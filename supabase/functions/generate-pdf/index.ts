/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { handleCors } from "../_shared/cors.ts";
import {
  assertRole,
  requireOfferAccess,
  requireUserContext,
} from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { logEvent } from "../_shared/events.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

/**
 * generate-pdf — Server-seitige PDF-Generierung via Gotenberg
 *
 * POST /functions/v1/generate-pdf
 * Body: {
 *   offer_id: string,
 *   template?: string     // Optional: custom HTML template
 * }
 *
 * Generiert ein Angebots-PDF und speichert es in Supabase Storage.
 */
Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  let authHeader = "";
  try {
    const user = await requireUserContext(req);
    assertRole(user, ["gf", "bauleiter"]);
    authHeader = user.authHeader;
  } catch (e) {
    const message = (e as Error).message;
    const status = message === "Forbidden" ? 403 : 401;
    return errorResponse(message, status, req);
  }

  try {
    const body = await req.json();
    const { offer_id, template: customTemplate } = body;

    if (!offer_id) return errorResponse("offer_id ist erforderlich", 400, req);

    await requireOfferAccess(authHeader, offer_id);

    const sb = createServiceClient();

    // Angebot + Projekt + Positionen laden
    const { data: offer, error: offerErr } = await sb
      .from("offers")
      .select(`
        id, offer_number, project_id, status, created_at,
        projects:project_id (id, name, code, address, client_id,
          clients:client_id (name, address, city, zip)
        )
      `)
      .eq("id", offer_id)
      .single();

    if (offerErr || !offer) {
      return errorResponse("Angebot nicht gefunden", 404, req);
    }

    // Sektionen + Positionen
    const { data: sections } = await sb
      .from("offer_sections")
      .select("id, title, section_number")
      .eq("offer_id", offer_id)
      .order("section_number");

    const { data: positions } = await sb
      .from("offer_positions")
      .select("id, section_id, catalog_code, title, description, quantity, unit, unit_price, trade, is_optional, position_number")
      .eq("offer_id", offer_id)
      .is("deleted_at", null)
      .order("position_number");

    // HTML für PDF generieren
    const html = customTemplate ?? generateOfferHtml(offer, sections ?? [], positions ?? []);

    // Gotenberg aufrufen
    const gotenbergUrl = Deno.env.get("GOTENBERG_URL") ?? "https://gotenberg.srv1045913.hstgr.cloud";
    const formData = new FormData();

    const htmlBlob = new Blob([html], { type: "text/html" });
    formData.append("files", htmlBlob, "index.html");
    formData.append("marginTop", "1");
    formData.append("marginBottom", "1");
    formData.append("marginLeft", "1.5");
    formData.append("marginRight", "1");
    formData.append("paperWidth", "8.27");
    formData.append("paperHeight", "11.7");

    const pdfResponse = await fetch(
      `${gotenbergUrl}/forms/chromium/convert/html`,
      { method: "POST", body: formData }
    );

    if (!pdfResponse.ok) {
      const errText = await pdfResponse.text();
      console.error("Gotenberg error:", errText);
      return errorResponse("PDF-Generierung fehlgeschlagen: " + pdfResponse.status, 500, req);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfBuffer);

    // In Storage speichern
    const project = offer.projects as Record<string, unknown>;
    const storagePath = `projects/${offer.project_id}/angebote/Angebot_${offer.offer_number ?? offer_id.slice(0, 8)}.pdf`;

    const { error: uploadErr } = await sb.storage
      .from("project-files")
      .upload(storagePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadErr) {
      console.error("Storage upload error:", uploadErr);
      return errorResponse("PDF-Upload fehlgeschlagen: " + uploadErr.message, 500, req);
    }

    // Event loggen
    await logEvent(sb, {
      event_type: "OFFER_PDF_GENERATED",
      project_id: offer.project_id,
      source_flow: "edge_generate_pdf",
      payload: {
        offer_id,
        offer_number: offer.offer_number,
        storage_path: storagePath,
        pdf_size_bytes: pdfBytes.length,
      },
    });

    return jsonResponse({
      success: true,
      offer_id,
      storage_path: storagePath,
      pdf_size_bytes: pdfBytes.length,
    }, 200, req);
  } catch (e) {
    console.error("generate-pdf error:", e);
    const message = (e as Error).message;
    const status = message === "Forbidden" ? 403 : 500;
    return errorResponse("Interner Fehler: " + message, status, req);
  }
});

/**
 * Standard-Angebots-HTML für Gotenberg
 */
function generateOfferHtml(
  offer: Record<string, unknown>,
  sections: Record<string, unknown>[],
  positions: Record<string, unknown>[]
): string {
  const project = offer.projects as Record<string, unknown> | null;
  const client = project?.clients as Record<string, unknown> | null;

  const positionsBySection = new Map<string, Record<string, unknown>[]>();
  for (const pos of positions) {
    const sectionId = pos.section_id as string;
    if (!positionsBySection.has(sectionId)) {
      positionsBySection.set(sectionId, []);
    }
    positionsBySection.get(sectionId)!.push(pos);
  }

  let totalNet = 0;
  const sectionsHtml = sections
    .map((sec) => {
      const secPositions = positionsBySection.get(sec.id as string) ?? [];
      let sectionTotal = 0;

      const posRows = secPositions
        .map((p) => {
          const qty = Number(p.quantity ?? 0);
          const price = Number(p.unit_price ?? 0);
          const total = qty * price;
          sectionTotal += total;

          return `<tr${p.is_optional ? ' class="optional"' : ""}>
            <td>${p.catalog_code ?? ""}</td>
            <td>${p.title}${p.description ? `<br><small>${p.description}</small>` : ""}</td>
            <td class="right">${qty.toFixed(2)}</td>
            <td>${p.unit}</td>
            <td class="right">${price.toFixed(2)} €</td>
            <td class="right">${total.toFixed(2)} €</td>
          </tr>`;
        })
        .join("\n");

      totalNet += sectionTotal;

      return `
        <h3>${sec.section_number}. ${sec.title}</h3>
        <table>
          <thead>
            <tr><th>Pos.</th><th>Beschreibung</th><th>Menge</th><th>Einheit</th><th>EP</th><th>GP</th></tr>
          </thead>
          <tbody>${posRows}</tbody>
          <tfoot>
            <tr><td colspan="5" class="right"><strong>Zwischensumme</strong></td><td class="right"><strong>${sectionTotal.toFixed(2)} €</strong></td></tr>
          </tfoot>
        </table>`;
    })
    .join("\n");

  const mwst = totalNet * 0.19;
  const totalBrutto = totalNet + mwst;

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 11pt; color: #333; line-height: 1.4; }
    h1 { font-size: 18pt; color: #1a1a1a; margin-bottom: 4px; }
    h3 { font-size: 13pt; margin-top: 24px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #f5f5f5; text-align: left; padding: 6px 8px; font-size: 10pt; border-bottom: 2px solid #ddd; }
    td { padding: 5px 8px; border-bottom: 1px solid #eee; font-size: 10pt; vertical-align: top; }
    .right { text-align: right; }
    .optional { color: #888; font-style: italic; }
    .summary { margin-top: 24px; text-align: right; font-size: 12pt; }
    .summary td { border: none; padding: 3px 8px; }
    .total { font-size: 14pt; font-weight: bold; border-top: 2px solid #333 !important; }
    .header { margin-bottom: 32px; }
    .address { margin-bottom: 24px; font-size: 10pt; }
    small { color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Angebot${offer.offer_number ? ` Nr. ${offer.offer_number}` : ""}</h1>
    <p>Projekt: <strong>${(project?.name as string) ?? ""}</strong></p>
    ${(project?.address as string) ? `<p>Adresse: ${project.address}</p>` : ""}
  </div>

  ${client ? `<div class="address">
    <p><strong>${(client.name as string) ?? ""}</strong><br>
    ${(client.address as string) ?? ""}<br>
    ${(client.zip as string) ?? ""} ${(client.city as string) ?? ""}</p>
  </div>` : ""}

  ${sectionsHtml}

  <table class="summary">
    <tr><td>Netto:</td><td class="right">${totalNet.toFixed(2)} €</td></tr>
    <tr><td>MwSt. 19%:</td><td class="right">${mwst.toFixed(2)} €</td></tr>
    <tr class="total"><td>Gesamt:</td><td class="right">${totalBrutto.toFixed(2)} €</td></tr>
  </table>
</body>
</html>`;
}
