/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { handleCors } from "../_shared/cors.ts";
import { authenticate } from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { logEvent } from "../_shared/events.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

/**
 * generate-protokoll-pdf — PDF-Generierung für Begehungs-Protokolle via Gotenberg
 *
 * POST /functions/v1/generate-protokoll-pdf
 * Body: {
 *   protocol_id: string,
 *   protocol_type: 'erstbegehung' | 'zwischenbegehung' | 'abnahme'
 * }
 *
 * Generiert ein Protokoll-PDF und speichert es in Supabase Storage.
 * Aktualisiert inspection_protocols.pdf_storage_path.
 * Loggt PROTOCOL_PDF_GENERATED Event.
 */
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
    const { protocol_id, protocol_type } = body as {
      protocol_id: string;
      protocol_type: "erstbegehung" | "zwischenbegehung" | "abnahme";
    };

    if (!protocol_id) return errorResponse("protocol_id ist erforderlich");
    if (!protocol_type) return errorResponse("protocol_type ist erforderlich");
    if (!["erstbegehung", "zwischenbegehung", "abnahme"].includes(protocol_type)) {
      return errorResponse("protocol_type muss 'erstbegehung', 'zwischenbegehung' oder 'abnahme' sein");
    }

    const sb = createServiceClient();

    // Protokoll laden
    const { data: protocol, error: protoErr } = await sb
      .from("inspection_protocols")
      .select(`
        id, project_id, offer_id, protocol_type, protocol_number,
        inspection_date, inspector_name, status, general_notes,
        total_items, completed_items, items_with_issues,
        signature_path, finalized_at, catalog_label
      `)
      .eq("id", protocol_id)
      .single();

    if (protoErr || !protocol) {
      return errorResponse("Protokoll nicht gefunden", 404);
    }

    // Projekt + Auftraggeber laden
    const { data: project, error: projectErr } = await sb
      .from("projects")
      .select(`
        id, name, project_number, object_street, object_zip, object_city, client_id,
        clients:client_id (name, address, zip, city)
      `)
      .eq("id", protocol.project_id)
      .single();

    if (projectErr || !project) {
      return errorResponse("Projekt nicht gefunden", 404);
    }

    // Positionen laden: gefiltert nach offer_id (falls vorhanden) und phase
    let positionsQuery = sb
      .from("offer_positions")
      .select("id, catalog_code, title, description, quantity, unit, unit_price, phase, inspection_status, progress_percent, trade")
      .is("deleted_at", null);

    if (protocol.offer_id) {
      positionsQuery = positionsQuery.eq("offer_id", protocol.offer_id);
    } else {
      // Fallback: alle Positionen des Projekts via offers
      const { data: offers } = await sb
        .from("offers")
        .select("id")
        .eq("project_id", protocol.project_id)
        .is("deleted_at", null);
      const offerIds = (offers ?? []).map((o: { id: string }) => o.id);
      if (offerIds.length > 0) {
        positionsQuery = positionsQuery.in("offer_id", offerIds);
      }
    }

    // Phase-Filter entsprechend dem Protokolltyp
    positionsQuery = positionsQuery.eq("phase", protocol_type);

    const { data: positions } = await positionsQuery.order("position_number");

    const positionList = positions ?? [];

    // Client-Daten extrahieren
    const clientRaw = project.clients as Record<string, unknown> | null;
    const clientData = clientRaw
      ? {
          name: (clientRaw.name as string) ?? "",
          address: (clientRaw.address as string) ?? "",
          zip: (clientRaw.zip as string) ?? "",
          city: (clientRaw.city as string) ?? "",
        }
      : null;

    // Projektadresse zusammenstellen
    const addressParts = [project.object_street, project.object_zip, project.object_city].filter(Boolean);
    const projectAddress = addressParts.join(", ");

    // HTML generieren je nach Protokolltyp
    let html: string;

    if (protocol_type === "erstbegehung") {
      html = generateEbHtml({
        project: {
          name: project.name ?? "",
          code: project.project_number ?? "",
          address: projectAddress,
        },
        client: clientData,
        protocol: {
          protocol_number: protocol.protocol_number ?? protocol_id.slice(0, 8),
          inspection_date: protocol.inspection_date ?? new Date().toISOString().split("T")[0],
          inspector_name: protocol.inspector_name ?? "",
          general_notes: protocol.general_notes ?? null,
        },
        positions: positionList.map((p: Record<string, unknown>) => ({
          catalog_code: (p.catalog_code as string | null) ?? null,
          title: (p.title as string) ?? "",
          description: (p.description as string | null) ?? null,
          quantity: Number(p.quantity ?? 0),
          unit: (p.unit as string) ?? "",
          inspection_status: (p.inspection_status as string) ?? "pending",
        })),
      });
    } else if (protocol_type === "zwischenbegehung") {
      html = generateZbHtml({
        project: {
          name: project.name ?? "",
          code: project.project_number ?? "",
          address: projectAddress,
        },
        client: clientData,
        protocol: {
          protocol_number: protocol.protocol_number ?? protocol_id.slice(0, 8),
          inspection_date: protocol.inspection_date ?? new Date().toISOString().split("T")[0],
          inspector_name: protocol.inspector_name ?? "",
          general_notes: protocol.general_notes ?? null,
          next_appointment: null,
        },
        positions: positionList.map((p: Record<string, unknown>) => ({
          catalog_code: (p.catalog_code as string | null) ?? null,
          title: (p.title as string) ?? "",
          description: (p.description as string | null) ?? null,
          quantity: Number(p.quantity ?? 0),
          unit: (p.unit as string) ?? "",
          progress_percent: Number(p.progress_percent ?? 0),
        })),
      });
    } else {
      // abnahme
      const totalNet = positionList.reduce((sum: number, p: Record<string, unknown>) => {
        return sum + Number(p.quantity ?? 0) * Number(p.unit_price ?? 0);
      }, 0);

      html = generateAbHtml({
        project: {
          name: project.name ?? "",
          code: project.project_number ?? "",
          address: projectAddress,
        },
        client: clientData,
        protocol: {
          protocol_number: protocol.protocol_number ?? protocol_id.slice(0, 8),
          inspection_date: protocol.inspection_date ?? new Date().toISOString().split("T")[0],
          inspector_name: protocol.inspector_name ?? "",
          general_notes: protocol.general_notes ?? null,
        },
        positions: positionList.map((p: Record<string, unknown>) => ({
          catalog_code: (p.catalog_code as string | null) ?? null,
          title: (p.title as string) ?? "",
          description: (p.description as string | null) ?? null,
          quantity: Number(p.quantity ?? 0),
          unit: (p.unit as string) ?? "",
          unit_price: Number(p.unit_price ?? 0),
        })),
        totalNet,
        signaturePath: protocol.signature_path ?? undefined,
      });
    }

    // Gotenberg aufrufen
    const gotenbergUrl = Deno.env.get("GOTENBERG_URL") ?? "https://gotenberg.srv1045913.hstgr.cloud";
    const formData = new FormData();

    const htmlBlob = new Blob([html], { type: "text/html" });
    formData.append("files", htmlBlob, "index.html");
    formData.append("marginTop", "0");
    formData.append("marginBottom", "0");
    formData.append("marginLeft", "0");
    formData.append("marginRight", "0");
    formData.append("paperWidth", "8.27");
    formData.append("paperHeight", "11.7");

    const pdfResponse = await fetch(
      `${gotenbergUrl}/forms/chromium/convert/html`,
      { method: "POST", body: formData }
    );

    if (!pdfResponse.ok) {
      const errText = await pdfResponse.text();
      console.error("Gotenberg error:", errText);
      return errorResponse("PDF-Generierung fehlgeschlagen: " + pdfResponse.status, 500);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfBuffer);

    // Dateiname + Pfad aufbauen
    const typeLabel =
      protocol_type === "erstbegehung" ? "EB" :
      protocol_type === "zwischenbegehung" ? "ZB" : "AB";
    const protoNum = (protocol.protocol_number ?? protocol_id.slice(0, 8)).replace(/[^a-zA-Z0-9_-]/g, "_");
    const storagePath = `projects/${protocol.project_id}/protokolle/${typeLabel}_${protoNum}.pdf`;

    // In Storage hochladen
    const { error: uploadErr } = await sb.storage
      .from("project-files")
      .upload(storagePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadErr) {
      console.error("Storage upload error:", uploadErr);
      return errorResponse("PDF-Upload fehlgeschlagen: " + uploadErr.message, 500);
    }

    // inspection_protocols aktualisieren
    const { error: updateErr } = await sb
      .from("inspection_protocols")
      .update({ pdf_storage_path: storagePath })
      .eq("id", protocol_id);

    if (updateErr) {
      console.error("Protocol update error:", updateErr);
    }

    // Event loggen
    await logEvent(sb, {
      event_type: "PROTOCOL_PDF_GENERATED",
      project_id: protocol.project_id,
      source_flow: "edge_generate_protokoll_pdf",
      payload: {
        protocol_id,
        protocol_type,
        protocol_number: protocol.protocol_number ?? null,
        offer_id: protocol.offer_id ?? null,
        storage_path: storagePath,
        pdf_size_bytes: pdfBytes.length,
        positions_count: positionList.length,
      },
    });

    return jsonResponse({
      success: true,
      protocol_id,
      protocol_type,
      storage_path: storagePath,
      pdf_size_bytes: pdfBytes.length,
    });

  } catch (e) {
    console.error("generate-protokoll-pdf error:", e);
    return errorResponse("Interner Fehler: " + (e as Error).message, 500);
  }
});

// ---- Inline HTML-Generatoren (kopiert aus lib/pdf-templates) ----
// (Edge Functions können keine lokalen TS-Dateien außerhalb des Functions-Verzeichnisses importieren)

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDateDe(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// --- EB Protokoll ---
interface EbData {
  project: { name: string; code: string; address: string };
  client: { name: string; address: string; zip: string; city: string } | null;
  protocol: { protocol_number: string; inspection_date: string; inspector_name: string; general_notes: string | null };
  positions: Array<{ catalog_code: string | null; title: string; description: string | null; quantity: number; unit: string; inspection_status: string }>;
}

function generateEbHtml(data: EbData): string {
  const { project, client, protocol, positions } = data;
  const confirmedCount = positions.filter((p) => p.inspection_status === "confirmed").length;
  const correctionCount = positions.filter((p) => p.inspection_status === "pending_correction").length;
  const pendingCount = positions.filter((p) => p.inspection_status === "pending").length;

  const posRows = positions.map((p, idx) => {
    const isConfirmed = p.inspection_status === "confirmed";
    const isCorrection = p.inspection_status === "pending_correction";
    const statusHtml = isConfirmed
      ? `<span style="color:#38a169;font-weight:700;">&#10003;</span>`
      : isCorrection
      ? `<span style="color:#e53e3e;font-weight:700;">&#10007;</span>`
      : `<span style="color:#d69e2e;font-weight:700;">&#9679;</span>`;
    const rowBg = idx % 2 === 0 ? "#ffffff" : "#f7fafc";
    return `<tr style="background:${rowBg};page-break-inside:avoid;">
      <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:10pt;color:#718096;width:60px;">${idx + 1}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:10pt;">
        ${p.catalog_code ? `<span style="color:#718096;font-size:9pt;">${p.catalog_code} — </span>` : ""}
        <strong>${escapeHtml(p.title)}</strong>
        ${p.description ? `<br><span style="color:#718096;font-size:9pt;">${escapeHtml(p.description)}</span>` : ""}
      </td>
      <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:10pt;text-align:right;white-space:nowrap;">${p.quantity.toFixed(2)} ${escapeHtml(p.unit)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:11pt;text-align:center;width:50px;">${statusHtml}</td>
    </tr>`;
  }).join("\n");

  return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:"Segoe UI",Arial,sans-serif;font-size:11pt;color:#2d3748;line-height:1.5}
    @page{margin:20mm 15mm 20mm 15mm}
    .hdr{background:linear-gradient(135deg,#1a365d 0%,#2c5282 100%);color:#fff;padding:28px 32px}
    .meta{background:#f7fafc;border:1px solid #e2e8f0;border-top:none;padding:20px 32px;display:grid;grid-template-columns:1fr 1fr;gap:12px 32px;margin-bottom:24px}
    .ml{font-size:8pt;font-weight:700;text-transform:uppercase;color:#718096;letter-spacing:.5px;margin-bottom:2px}
    .mv{font-size:10pt;color:#2d3748;font-weight:600}
    .sh{font-size:12pt;font-weight:700;color:#2c5282;border-bottom:2px solid #2c5282;padding-bottom:6px;margin:0 0 12px 0}
    table{width:100%;border-collapse:collapse}
    thead th{background:#2c5282;color:#fff;padding:8px;font-size:9pt;font-weight:700;text-align:left}
    .sum{margin-top:24px;display:flex;gap:12px}
    .si{flex:1;padding:12px 16px;border-radius:8px;text-align:center}
    .sig-sec{margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:32px;page-break-inside:avoid}
    .sig-box{border:1px solid #cbd5e0;border-radius:6px;padding:16px}
    .sig-line{border-bottom:2px solid #2d3748;height:60px;margin-bottom:8px}
    .ftr{margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:8pt;color:#718096;text-align:center}
  </style></head><body>
  <div class="hdr">
    <div style="font-size:11pt;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#bee3f8;margin-bottom:6px">Deine Baulöwen</div>
    <div style="font-size:22pt;font-weight:700;margin-bottom:4px">Erstbegehungs-Protokoll</div>
    <div style="font-size:10pt;color:#bee3f8">Protokoll-Nr. ${escapeHtml(protocol.protocol_number)}</div>
  </div>
  <div class="meta">
    <div><div class="ml">Projekt</div><div class="mv">${escapeHtml(project.name)}</div></div>
    <div><div class="ml">Protokoll-Nr.</div><div class="mv">${escapeHtml(protocol.protocol_number)}</div></div>
    <div><div class="ml">Adresse</div><div class="mv">${escapeHtml(project.address)}</div></div>
    <div><div class="ml">Prüfdatum</div><div class="mv">${formatDateDe(protocol.inspection_date)}</div></div>
    ${client ? `<div><div class="ml">Auftraggeber</div><div class="mv">${escapeHtml(client.name)}</div></div>` : ""}
    <div><div class="ml">Prüfer</div><div class="mv">${escapeHtml(protocol.inspector_name)}</div></div>
  </div>
  <div class="sh">Positionen</div>
  <table><thead><tr><th style="width:60px">Pos.</th><th>Beschreibung</th><th style="text-align:right;width:100px">Menge</th><th style="text-align:center;width:50px">Status</th></tr></thead>
  <tbody>${posRows}</tbody></table>
  <div class="sum">
    <div class="si" style="background:#f0fff4;border:1px solid #9ae6b4"><div style="font-size:22pt;font-weight:700;color:#38a169">${confirmedCount}</div><div style="font-size:9pt;font-weight:600;color:#276749">Bestätigt</div></div>
    <div class="si" style="background:#fff5f5;border:1px solid #feb2b2"><div style="font-size:22pt;font-weight:700;color:#e53e3e">${correctionCount}</div><div style="font-size:9pt;font-weight:600;color:#9b2c2c">Korrektur nötig</div></div>
    ${pendingCount > 0 ? `<div class="si" style="background:#fffff0;border:1px solid #faf089"><div style="font-size:22pt;font-weight:700;color:#d69e2e">${pendingCount}</div><div style="font-size:9pt;font-weight:600;color:#975a16">Ausstehend</div></div>` : ""}
    <div class="si" style="background:#ebf8ff;border:1px solid #90cdf4"><div style="font-size:22pt;font-weight:700;color:#2b6cb0">${positions.length}</div><div style="font-size:9pt;font-weight:600;color:#2c5282">Gesamt</div></div>
  </div>
  ${protocol.general_notes ? `<div style="background:#fffbeb;border:1px solid #f6e05e;border-radius:6px;padding:14px 18px;margin-top:20px"><div style="font-size:9pt;font-weight:700;color:#975a16;margin-bottom:4px">Anmerkungen</div><div style="font-size:10pt;color:#744210">${escapeHtml(protocol.general_notes)}</div></div>` : ""}
  <div class="sig-sec">
    <div class="sig-box"><div style="font-size:9pt;font-weight:700;color:#2c5282;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Auftragnehmer</div><div class="sig-line"></div><div style="font-size:8pt;color:#718096">Unterschrift, Datum</div></div>
    <div class="sig-box"><div style="font-size:9pt;font-weight:700;color:#2c5282;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Auftraggeber</div><div class="sig-line"></div><div style="font-size:8pt;color:#718096">Unterschrift, Datum</div></div>
  </div>
  <div class="ftr">Deine Baulöwen · Erstbegehungs-Protokoll ${escapeHtml(protocol.protocol_number)} · Erstellt am ${formatDateDe(new Date().toISOString())}</div>
  </body></html>`;
}

// --- ZB Protokoll ---
interface ZbData {
  project: { name: string; code: string; address: string };
  client: { name: string; address: string; zip: string; city: string } | null;
  protocol: { protocol_number: string; inspection_date: string; inspector_name: string; general_notes: string | null; next_appointment: string | null };
  positions: Array<{ catalog_code: string | null; title: string; description: string | null; quantity: number; unit: string; progress_percent: number }>;
}

function generateZbHtml(data: ZbData): string {
  const { project, client, protocol, positions } = data;
  const totalProgress = positions.length > 0
    ? Math.round(positions.reduce((s, p) => s + p.progress_percent, 0) / positions.length)
    : 0;

  const pColor = (n: number) => n >= 80 ? "#38a169" : n >= 50 ? "#d69e2e" : "#e53e3e";

  const posRows = positions.map((p, idx) => {
    const pct = Math.min(100, Math.max(0, p.progress_percent));
    const c = pColor(pct);
    const rowBg = idx % 2 === 0 ? "#ffffff" : "#f7fafc";
    return `<tr style="background:${rowBg};page-break-inside:avoid;">
      <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:10pt;color:#718096;width:50px">${idx + 1}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:10pt">
        ${p.catalog_code ? `<span style="color:#718096;font-size:9pt">${p.catalog_code} — </span>` : ""}
        <strong>${escapeHtml(p.title)}</strong>
        ${p.description ? `<br><span style="color:#718096;font-size:9pt">${escapeHtml(p.description)}</span>` : ""}
      </td>
      <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:10pt;text-align:right;white-space:nowrap;width:90px">${p.quantity.toFixed(2)} ${escapeHtml(p.unit)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;width:140px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="flex:1;background:#e2e8f0;border-radius:4px;height:10px;overflow:hidden"><div style="width:${pct}%;background:${c};height:10px;border-radius:4px"></div></div>
          <span style="font-size:10pt;font-weight:700;color:${c};min-width:34px;text-align:right">${pct}%</span>
        </div>
      </td>
    </tr>`;
  }).join("\n");

  const tc = pColor(totalProgress);
  return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:"Segoe UI",Arial,sans-serif;font-size:11pt;color:#2d3748;line-height:1.5}
    @page{margin:20mm 15mm 20mm 15mm}
    table{width:100%;border-collapse:collapse}
    thead th{background:#2c5282;color:#fff;padding:8px;font-size:9pt;font-weight:700;text-align:left}
    .sig-sec{margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:32px;page-break-inside:avoid}
    .sig-box{border:1px solid #cbd5e0;border-radius:6px;padding:16px}
    .sig-line{border-bottom:2px solid #2d3748;height:60px;margin-bottom:8px}
  </style></head><body>
  <div style="background:linear-gradient(135deg,#1a365d 0%,#2c5282 100%);color:#fff;padding:28px 32px">
    <div style="font-size:11pt;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#bee3f8;margin-bottom:6px">Deine Baulöwen</div>
    <div style="font-size:22pt;font-weight:700;margin-bottom:4px">Zwischenbegehungs-Protokoll Nr. ${escapeHtml(protocol.protocol_number)}</div>
    <div style="font-size:10pt;color:#bee3f8">Fortschrittskontrolle</div>
  </div>
  <div style="background:#f7fafc;border:1px solid #e2e8f0;border-top:none;padding:20px 32px;display:grid;grid-template-columns:1fr 1fr;gap:12px 32px;margin-bottom:24px">
    <div><div style="font-size:8pt;font-weight:700;text-transform:uppercase;color:#718096;letter-spacing:.5px;margin-bottom:2px">Projekt</div><div style="font-size:10pt;color:#2d3748;font-weight:600">${escapeHtml(project.name)}</div></div>
    <div><div style="font-size:8pt;font-weight:700;text-transform:uppercase;color:#718096;letter-spacing:.5px;margin-bottom:2px">Protokoll-Nr.</div><div style="font-size:10pt;color:#2d3748;font-weight:600">${escapeHtml(protocol.protocol_number)}</div></div>
    <div><div style="font-size:8pt;font-weight:700;text-transform:uppercase;color:#718096;letter-spacing:.5px;margin-bottom:2px">Adresse</div><div style="font-size:10pt;color:#2d3748;font-weight:600">${escapeHtml(project.address)}</div></div>
    <div><div style="font-size:8pt;font-weight:700;text-transform:uppercase;color:#718096;letter-spacing:.5px;margin-bottom:2px">Prüfdatum</div><div style="font-size:10pt;color:#2d3748;font-weight:600">${formatDateDe(protocol.inspection_date)}</div></div>
    ${client ? `<div><div style="font-size:8pt;font-weight:700;text-transform:uppercase;color:#718096;letter-spacing:.5px;margin-bottom:2px">Auftraggeber</div><div style="font-size:10pt;color:#2d3748;font-weight:600">${escapeHtml(client.name)}</div></div>` : ""}
    <div><div style="font-size:8pt;font-weight:700;text-transform:uppercase;color:#718096;letter-spacing:.5px;margin-bottom:2px">Prüfer</div><div style="font-size:10pt;color:#2d3748;font-weight:600">${escapeHtml(protocol.inspector_name)}</div></div>
  </div>
  <div style="font-size:12pt;font-weight:700;color:#2c5282;border-bottom:2px solid #2c5282;padding-bottom:6px;margin:0 0 12px 0">Positionen &amp; Fortschritt</div>
  <table><thead><tr>
    <th style="width:50px">Pos.</th><th>Beschreibung</th>
    <th style="text-align:right;width:90px">Menge</th>
    <th style="text-align:center;width:140px">Fortschritt</th>
  </tr></thead><tbody>${posRows}</tbody></table>
  <div style="margin-top:24px;padding:20px 24px;background:${totalProgress>=80?"#f0fff4":totalProgress>=50?"#fffff0":"#fff5f5"};border:2px solid ${totalProgress>=80?"#9ae6b4":totalProgress>=50?"#faf089":"#feb2b2"};border-radius:8px;display:flex;align-items:center;gap:24px;page-break-inside:avoid">
    <span style="font-size:10pt;font-weight:700;color:#2c5282;min-width:140px">Gesamtfortschritt</span>
    <div style="flex:1;background:#e2e8f0;border-radius:6px;height:14px;overflow:hidden"><div style="width:${totalProgress}%;background:${tc};height:14px;border-radius:6px"></div></div>
    <span style="font-size:18pt;font-weight:700;color:${tc};min-width:60px;text-align:right">${totalProgress}%</span>
  </div>
  ${protocol.next_appointment ? `<div style="margin-top:16px;padding:14px 18px;background:#ebf8ff;border:1px solid #90cdf4;border-radius:6px"><div style="font-size:9pt;font-weight:700;color:#2c5282;margin-bottom:2px">Nächster Termin</div><div style="font-size:11pt;font-weight:600;color:#2b6cb0">${formatDateDe(protocol.next_appointment)}</div></div>` : ""}
  ${protocol.general_notes ? `<div style="background:#fffbeb;border:1px solid #f6e05e;border-radius:6px;padding:14px 18px;margin-top:16px"><div style="font-size:9pt;font-weight:700;color:#975a16;margin-bottom:4px">Anmerkungen</div><div style="font-size:10pt;color:#744210">${escapeHtml(protocol.general_notes)}</div></div>` : ""}
  <div class="sig-sec">
    <div class="sig-box"><div style="font-size:9pt;font-weight:700;color:#2c5282;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Auftragnehmer</div><div class="sig-line"></div><div style="font-size:8pt;color:#718096">Unterschrift, Datum</div></div>
    <div class="sig-box"><div style="font-size:9pt;font-weight:700;color:#2c5282;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Auftraggeber</div><div class="sig-line"></div><div style="font-size:8pt;color:#718096">Unterschrift, Datum</div></div>
  </div>
  <div style="margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:8pt;color:#718096;text-align:center">Deine Baulöwen · Zwischenbegehungs-Protokoll ${escapeHtml(protocol.protocol_number)} · Erstellt am ${formatDateDe(new Date().toISOString())}</div>
  </body></html>`;
}

// --- AB Protokoll ---
interface AbData {
  project: { name: string; code: string; address: string };
  client: { name: string; address: string; zip: string; city: string } | null;
  protocol: { protocol_number: string; inspection_date: string; inspector_name: string; general_notes: string | null };
  positions: Array<{ catalog_code: string | null; title: string; description: string | null; quantity: number; unit: string; unit_price: number }>;
  signaturePath?: string;
  totalNet: number;
}

function generateAbHtml(data: AbData): string {
  const { project, client, protocol, positions, totalNet } = data;
  const mwst = totalNet * 0.19;
  const totalBrutto = totalNet + mwst;
  const fmt = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

  const posRows = positions.map((p, idx) => {
    const total = p.quantity * p.unit_price;
    const rowBg = idx % 2 === 0 ? "#ffffff" : "#f7fafc";
    return `<tr style="background:${rowBg};page-break-inside:avoid;">
      <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:10pt;color:#718096;width:50px">${idx + 1}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:10pt">
        ${p.catalog_code ? `<span style="color:#718096;font-size:9pt">${p.catalog_code} — </span>` : ""}
        <strong>${escapeHtml(p.title)}</strong>
        ${p.description ? `<br><span style="color:#718096;font-size:9pt">${escapeHtml(p.description)}</span>` : ""}
      </td>
      <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:10pt;text-align:right;white-space:nowrap;width:90px">${p.quantity.toFixed(2)} ${escapeHtml(p.unit)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:10pt;text-align:right;white-space:nowrap;width:90px">${fmt(p.unit_price)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:10pt;text-align:right;white-space:nowrap;width:90px;font-weight:600">${fmt(total)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:11pt;text-align:center;width:40px"><span style="color:#38a169;font-weight:700">&#10003;</span></td>
    </tr>`;
  }).join("\n");

  return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:"Segoe UI",Arial,sans-serif;font-size:11pt;color:#2d3748;line-height:1.5}
    @page{margin:20mm 15mm 20mm 15mm}
    table{width:100%;border-collapse:collapse}
    thead th{background:#2c5282;color:#fff;padding:8px;font-size:9pt;font-weight:700;text-align:left}
    .sig-sec{margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:32px;page-break-inside:avoid}
    .sig-box{border:1px solid #cbd5e0;border-radius:6px;padding:16px}
    .sig-line{border-bottom:2px solid #2d3748;height:60px;margin-bottom:8px}
  </style></head><body>
  <div style="background:linear-gradient(135deg,#1a365d 0%,#2c5282 100%);color:#fff;padding:28px 32px">
    <div style="font-size:11pt;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#bee3f8;margin-bottom:6px">Deine Baulöwen</div>
    <div style="font-size:22pt;font-weight:700;margin-bottom:4px">Abnahme-Protokoll</div>
    <div style="font-size:10pt;color:#bee3f8">Protokoll-Nr. ${escapeHtml(protocol.protocol_number)}</div>
  </div>
  <div style="background:#f0fff4;border-bottom:3px solid #38a169;padding:12px 32px;display:flex;align-items:center;gap:10px">
    <span style="font-size:16pt;color:#38a169;font-weight:700">&#10003;</span>
    <span style="font-size:11pt;font-weight:700;color:#276749">Alle Leistungen zu 100% erbracht</span>
  </div>
  <div style="background:#f7fafc;border:1px solid #e2e8f0;border-top:none;padding:20px 32px;display:grid;grid-template-columns:1fr 1fr;gap:12px 32px;margin-bottom:24px">
    <div><div style="font-size:8pt;font-weight:700;text-transform:uppercase;color:#718096;letter-spacing:.5px;margin-bottom:2px">Projekt</div><div style="font-size:10pt;color:#2d3748;font-weight:600">${escapeHtml(project.name)}</div></div>
    <div><div style="font-size:8pt;font-weight:700;text-transform:uppercase;color:#718096;letter-spacing:.5px;margin-bottom:2px">Protokoll-Nr.</div><div style="font-size:10pt;color:#2d3748;font-weight:600">${escapeHtml(protocol.protocol_number)}</div></div>
    <div><div style="font-size:8pt;font-weight:700;text-transform:uppercase;color:#718096;letter-spacing:.5px;margin-bottom:2px">Adresse</div><div style="font-size:10pt;color:#2d3748;font-weight:600">${escapeHtml(project.address)}</div></div>
    <div><div style="font-size:8pt;font-weight:700;text-transform:uppercase;color:#718096;letter-spacing:.5px;margin-bottom:2px">Abnahmedatum</div><div style="font-size:10pt;color:#2d3748;font-weight:600">${formatDateDe(protocol.inspection_date)}</div></div>
    ${client ? `<div><div style="font-size:8pt;font-weight:700;text-transform:uppercase;color:#718096;letter-spacing:.5px;margin-bottom:2px">Auftraggeber</div><div style="font-size:10pt;color:#2d3748;font-weight:600">${escapeHtml(client.name)}</div></div>` : ""}
    <div><div style="font-size:8pt;font-weight:700;text-transform:uppercase;color:#718096;letter-spacing:.5px;margin-bottom:2px">Prüfer</div><div style="font-size:10pt;color:#2d3748;font-weight:600">${escapeHtml(protocol.inspector_name)}</div></div>
  </div>
  <div style="font-size:12pt;font-weight:700;color:#2c5282;border-bottom:2px solid #2c5282;padding-bottom:6px;margin:0 0 12px 0">Abgenommene Leistungen</div>
  <table><thead><tr>
    <th style="width:50px">Pos.</th><th>Beschreibung</th>
    <th style="text-align:right;width:90px">Menge</th>
    <th style="text-align:right;width:90px">EP</th>
    <th style="text-align:right;width:90px">GP</th>
    <th style="text-align:center;width:40px">&#10003;</th>
  </tr></thead><tbody>${posRows}</tbody></table>
  <div style="margin-top:20px;margin-left:auto;width:320px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;page-break-inside:avoid">
    <div style="display:flex;justify-content:space-between;padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:10pt"><span>Netto:</span><span style="font-weight:600">${fmt(totalNet)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:10pt"><span>MwSt. 19%:</span><span style="font-weight:600">${fmt(mwst)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:10px 16px;background:#2c5282;color:#fff;font-size:12pt;font-weight:700"><span>Gesamt brutto:</span><span>${fmt(totalBrutto)}</span></div>
  </div>
  ${protocol.general_notes ? `<div style="background:#fffbeb;border:1px solid #f6e05e;border-radius:6px;padding:14px 18px;margin-top:20px"><div style="font-size:9pt;font-weight:700;color:#975a16;margin-bottom:4px">Anmerkungen</div><div style="font-size:10pt;color:#744210">${escapeHtml(protocol.general_notes)}</div></div>` : ""}
  <div style="margin-top:20px;padding:14px 18px;background:#f7fafc;border:1px solid #cbd5e0;border-radius:6px;font-size:9pt;color:#4a5568;font-style:italic">
    Mit Unterschrift bestätigen beide Parteien die vollständige Leistungserbringung gemäß den vereinbarten Positionen. Die abgenommenen Leistungen werden als vertragsgemäß und mängelfrei anerkannt.
  </div>
  <div class="sig-sec">
    <div class="sig-box"><div style="font-size:9pt;font-weight:700;color:#2c5282;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Auftragnehmer</div><div class="sig-line"></div><div style="font-size:8pt;color:#718096">Unterschrift, Datum</div></div>
    <div class="sig-box"><div style="font-size:9pt;font-weight:700;color:#2c5282;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Auftraggeber</div><div class="sig-line"></div><div style="font-size:8pt;color:#718096">Unterschrift, Datum</div></div>
  </div>
  <div style="margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:8pt;color:#718096;text-align:center">Deine Baulöwen · Abnahme-Protokoll ${escapeHtml(protocol.protocol_number)} · Erstellt am ${formatDateDe(new Date().toISOString())}</div>
  </body></html>`;
}
