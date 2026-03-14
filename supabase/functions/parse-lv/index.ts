/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { handleCors } from "../_shared/cors.ts";
import { authenticate } from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { logEvent } from "../_shared/events.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

/**
 * parse-lv — LV/GAEB/Excel/PDF parsen → strukturierte Positionen
 *
 * POST /functions/v1/parse-lv
 * Body: {
 *   storage_path: string,             // Pfad in Supabase Storage
 *   catalog_id?: string,              // Gegen welchen Katalog matchen
 *   expected_trades?: string[],       // Erwartete Gewerke
 *   confidence_threshold?: number     // Min. Confidence für Auto-Match (default 0.8)
 * }
 */

interface ParsedPosition {
  position_nr: string;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  trade: string | null;
  catalog_code: string | null;
  matched_catalog_title: string | null;
  confidence: number;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    await authenticate(req);
  } catch (e) {
    return errorResponse((e as Error).message, 401);
  }

  try {
    const body = await req.json();
    const {
      storage_path,
      catalog_id,
      expected_trades,
      confidence_threshold = 0.8,
    } = body;

    if (!storage_path) return errorResponse("storage_path ist erforderlich");

    const sb = createServiceClient();

    // Datei aus Storage laden
    const { data: fileData, error: downloadErr } = await sb.storage
      .from("project-files")
      .download(storage_path);

    if (downloadErr || !fileData) {
      return errorResponse("Datei nicht gefunden: " + (downloadErr?.message ?? storage_path), 404);
    }

    // Format erkennen
    const extension = storage_path.split(".").pop()?.toLowerCase() ?? "";
    const format = detectFormat(extension, fileData);

    let rawPositions: ParsedPosition[];

    switch (format) {
      case "gaeb_xml":
        rawPositions = await parseGaebXml(fileData);
        break;
      case "csv":
        rawPositions = await parseCsv(fileData);
        break;
      case "excel":
        // Excel-Parsing: Basis-Implementierung über CSV-Export
        rawPositions = await parseCsv(fileData);
        break;
      case "pdf":
        rawPositions = await parsePdfWithVision(sb, storage_path, fileData);
        break;
      default:
        return errorResponse(`Unbekanntes Format: ${extension}. Unterstützt: XML (GAEB), CSV, XLSX, PDF`);
    }

    // Katalog-Matching
    let matchedCount = 0;
    let unmatchedCount = 0;

    if (catalog_id && rawPositions.length > 0) {
      // Katalogpositionen laden
      const { data: catalogPositions } = await sb
        .from("catalog_positions_v2")
        .select("id, position_code, title, title_secondary, unit, base_price_eur, trade")
        .eq("catalog_id", catalog_id)
        .eq("is_active", true);

      if (catalogPositions) {
        for (const pos of rawPositions) {
          const match = findBestCatalogMatch(pos, catalogPositions);
          if (match) {
            pos.catalog_code = match.position_code as string;
            pos.matched_catalog_title = match.title;
            pos.confidence = match.confidence;
            pos.trade = (match.trade as string) ?? pos.trade;
            matchedCount++;
          } else {
            unmatchedCount++;
          }
        }
      }
    } else {
      unmatchedCount = rawPositions.length;
    }

    // Positionen nach Confidence filtern
    const autoPositions = rawPositions.filter((p) => p.confidence >= confidence_threshold);
    const reviewPositions = rawPositions.filter((p) => p.confidence < confidence_threshold);

    const warnings: string[] = [];
    if (unmatchedCount > 0) {
      warnings.push(`${unmatchedCount} Positionen konnten nicht zugeordnet werden`);
    }
    if (reviewPositions.length > 0) {
      warnings.push(`${reviewPositions.length} Positionen benötigen manuelle Prüfung (Confidence < ${confidence_threshold})`);
    }

    // Event loggen
    await logEvent(sb, {
      event_type: "LV_PARSED",
      source_flow: "edge_parse_lv",
      payload: {
        storage_path,
        format_detected: format,
        total_positions: rawPositions.length,
        matched: matchedCount,
        unmatched: unmatchedCount,
        auto_accepted: autoPositions.length,
        needs_review: reviewPositions.length,
      },
    });

    return jsonResponse({
      success: true,
      format_detected: format,
      positions: rawPositions,
      summary: {
        total: rawPositions.length,
        matched: matchedCount,
        unmatched: unmatchedCount,
        auto_accepted: autoPositions.length,
        needs_review: reviewPositions.length,
      },
      warnings,
    });
  } catch (e) {
    console.error("parse-lv error:", e);
    return errorResponse("Interner Fehler: " + (e as Error).message, 500);
  }
});

// ============================================
// Format Detection
// ============================================

function detectFormat(extension: string, _blob: Blob): string {
  switch (extension) {
    case "xml":
    case "x83":
    case "x90":
    case "d83":
    case "p83":
      return "gaeb_xml";
    case "csv":
      return "csv";
    case "xlsx":
    case "xls":
      return "excel";
    case "pdf":
      return "pdf";
    default:
      return extension;
  }
}

// ============================================
// GAEB XML Parser (83/90 Format)
// ============================================

async function parseGaebXml(blob: Blob): Promise<ParsedPosition[]> {
  const text = await blob.text();
  const positions: ParsedPosition[] = [];

  // GAEB 83 Format: <Item> Elemente mit OZ, Kurztext, Menge, Einheit
  // GAEB 90/2000: <BoQBody> → <BoQCtgy> → <Itemlist> → <Item>
  // Wir unterstützen beide über Regex (kein DOM-Parser in Deno Edge nötig)

  // GAEB 90/2000 Format
  const itemRegex = /<Item[^>]*>([\s\S]*?)<\/Item>/gi;
  let match;

  while ((match = itemRegex.exec(text)) !== null) {
    const itemXml = match[1];
    const oz = extractXmlTag(itemXml, "OZ") ?? extractXmlTag(itemXml, "RNoPart");
    const shortText =
      extractXmlTag(itemXml, "Kurztext") ??
      extractXmlTag(itemXml, "Brief") ??
      extractXmlTag(itemXml, "OutlineText");
    const longText = extractXmlTag(itemXml, "Langtext") ?? extractXmlTag(itemXml, "DetailTxt") ?? "";
    const qty = parseFloat(extractXmlTag(itemXml, "Qty") ?? extractXmlTag(itemXml, "Menge") ?? "0");
    const unit = extractXmlTag(itemXml, "QU") ?? extractXmlTag(itemXml, "Einheit") ?? "Stk";

    if (oz || shortText) {
      positions.push({
        position_nr: oz ?? String(positions.length + 1),
        title: shortText ?? "Ohne Bezeichnung",
        description: longText,
        quantity: isNaN(qty) ? 0 : qty,
        unit: normalizeUnit(unit),
        trade: null,
        catalog_code: null,
        matched_catalog_title: null,
        confidence: 0,
      });
    }
  }

  // Fallback: GAEB 83 DA11 Satzart (älteres Format, zeilenbasiert)
  if (positions.length === 0) {
    const lines = text.split("\n");
    for (const line of lines) {
      // DA11: Satzart 11 = Positionszeile
      if (line.length >= 80 && (line.startsWith("11") || line.substring(0, 2) === "25")) {
        const posNr = line.substring(2, 11).trim();
        const title = line.substring(11, 77).trim();
        const qtyStr = line.substring(77, 89)?.trim();
        const unitStr = line.substring(89, 93)?.trim();

        if (posNr || title) {
          positions.push({
            position_nr: posNr || String(positions.length + 1),
            title: title || "Ohne Bezeichnung",
            description: "",
            quantity: parseFloat(qtyStr) || 0,
            unit: normalizeUnit(unitStr || "Stk"),
            trade: null,
            catalog_code: null,
            matched_catalog_title: null,
            confidence: 0,
          });
        }
      }
    }
  }

  return positions;
}

function extractXmlTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = regex.exec(xml);
  return match ? match[1].trim() : null;
}

// ============================================
// CSV Parser
// ============================================

async function parseCsv(blob: Blob): Promise<ParsedPosition[]> {
  const text = await blob.text();
  const lines = text.split("\n").filter((l) => l.trim());
  const positions: ParsedPosition[] = [];

  if (lines.length < 2) return positions;

  // Header erkennen
  const header = lines[0].toLowerCase();
  const separator = header.includes("\t") ? "\t" : header.includes(";") ? ";" : ",";
  const cols = lines[0].split(separator).map((c) => c.trim().toLowerCase());

  // Spalten-Mapping
  const posCol = cols.findIndex((c) => c.includes("pos") || c.includes("nr") || c.includes("oz"));
  const titleCol = cols.findIndex((c) => c.includes("beschreibung") || c.includes("text") || c.includes("bezeichnung") || c.includes("title"));
  const qtyCol = cols.findIndex((c) => c.includes("menge") || c.includes("qty") || c.includes("anzahl"));
  const unitCol = cols.findIndex((c) => c.includes("einheit") || c.includes("unit") || c.includes("me"));
  const tradeCol = cols.findIndex((c) => c.includes("gewerk") || c.includes("trade"));

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map((v) => v.trim());
    if (values.every((v) => !v)) continue;

    positions.push({
      position_nr: (posCol >= 0 ? values[posCol] : String(i)) ?? String(i),
      title: (titleCol >= 0 ? values[titleCol] : values[1]) ?? "Position " + i,
      description: "",
      quantity: parseFloat(qtyCol >= 0 ? values[qtyCol] : "0") || 0,
      unit: normalizeUnit((unitCol >= 0 ? values[unitCol] : "Stk") ?? "Stk"),
      trade: tradeCol >= 0 ? values[tradeCol] || null : null,
      catalog_code: null,
      matched_catalog_title: null,
      confidence: 0,
    });
  }

  return positions;
}

// ============================================
// PDF Parser via Claude Vision
// ============================================

async function parsePdfWithVision(
  sb: ReturnType<typeof createServiceClient>,
  storagePath: string,
  blob: Blob
): Promise<ParsedPosition[]> {
  // PDF als Base64 für Claude Vision
  const buffer = await blob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) {
    // Fallback: leeres Array + Warnung
    console.warn("ANTHROPIC_API_KEY nicht gesetzt — PDF-Parsing nicht möglich");
    return [];
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            {
              type: "text",
              text: `Analysiere dieses Leistungsverzeichnis (LV) und extrahiere alle Positionen als JSON-Array.

Für jede Position brauche ich:
- position_nr: string (Positionsnummer)
- title: string (Kurztext/Bezeichnung)
- description: string (Langtext falls vorhanden)
- quantity: number (Menge)
- unit: string (Einheit: Stk, m², m, psch, kg, etc.)
- trade: string | null (Gewerk falls erkennbar: Sanitär, Maler, Elektro, Fliesen, Trockenbau, Tischler, Heizung, Boden, Maurer, Reinigung)

Antworte NUR mit dem JSON-Array, kein anderer Text. Beispiel:
[{"position_nr":"1.1","title":"Tapeten entfernen","description":"Vorhandene Tapeten abkratzen und entsorgen","quantity":45,"unit":"m²","trade":"Maler"}]

Wenn du dir bei einer Position unsicher bist, setze das Feld trotzdem mit bestem Wissen.`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Claude Vision API error:", errText);
    return [];
  }

  const result = await response.json();
  const content = result.content?.[0]?.text ?? "[]";

  try {
    // JSON aus Antwort extrahieren (Claude gibt manchmal Markdown-Codeblocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.map((p: Record<string, unknown>) => ({
      position_nr: String(p.position_nr ?? ""),
      title: String(p.title ?? ""),
      description: String(p.description ?? ""),
      quantity: Number(p.quantity ?? 0),
      unit: normalizeUnit(String(p.unit ?? "Stk")),
      trade: p.trade ? String(p.trade) : null,
      catalog_code: null,
      matched_catalog_title: null,
      confidence: 0.75, // PDF Vision = moderate confidence
    }));
  } catch (e) {
    console.error("JSON parse error from Claude Vision:", e, content);
    return [];
  }
}

// ============================================
// Catalog Matching
// ============================================

function findBestCatalogMatch(
  pos: ParsedPosition,
  catalog: Record<string, unknown>[]
): (Record<string, unknown> & { confidence: number }) | null {
  const posTitle = pos.title.toLowerCase().trim();
  let bestMatch: (Record<string, unknown> & { confidence: number }) | null = null;
  let bestScore = 0;

  for (const cat of catalog) {
    const catTitle = ((cat.title as string) ?? "").toLowerCase();
    const catSecondary = ((cat.title_secondary as string) ?? "").toLowerCase();
    const catCode = (cat.position_code as string) ?? "";

    // Exakter Code-Match (höchste Priorität)
    if (pos.position_nr && catCode && pos.position_nr === catCode) {
      return { ...cat, confidence: 0.98 };
    }

    // Titel-Ähnlichkeit berechnen
    const score = Math.max(
      titleSimilarity(posTitle, catTitle),
      titleSimilarity(posTitle, catSecondary)
    );

    if (score > bestScore && score >= 0.4) {
      bestScore = score;
      bestMatch = { ...cat, confidence: Math.min(score, 0.95) };
    }
  }

  return bestMatch;
}

/**
 * Einfache Wort-basierte Ähnlichkeit (Jaccard-Index)
 */
function titleSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const wordsA = new Set(a.split(/\s+/).filter((w) => w.length > 2));
  const wordsB = new Set(b.split(/\s+/).filter((w) => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }

  return intersection / Math.max(wordsA.size, wordsB.size);
}

/**
 * Einheiten normalisieren
 */
function normalizeUnit(unit: string): string {
  const map: Record<string, string> = {
    stück: "Stk", stk: "Stk", st: "Stk", pcs: "Stk",
    "m2": "m²", qm: "m²", "m²": "m²",
    "m3": "m³", cbm: "m³", "m³": "m³",
    lfm: "m", lm: "m", m: "m",
    pausch: "psch", pauschal: "psch", psch: "psch", pa: "psch",
    kg: "kg", kilogramm: "kg",
    ltr: "l", liter: "l", l: "l",
  };
  return map[unit.toLowerCase().trim()] ?? unit;
}
