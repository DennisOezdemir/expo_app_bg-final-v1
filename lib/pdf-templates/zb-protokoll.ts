// ZB-Protokoll HTML Template für Gotenberg PDF-Generierung

export interface ZbProtokollData {
  project: {
    name: string;
    code: string;
    address: string;
  };
  client: {
    name: string;
    address: string;
    zip: string;
    city: string;
  } | null;
  protocol: {
    protocol_number: string;
    inspection_date: string;
    inspector_name: string;
    general_notes: string | null;
    next_appointment: string | null;
  };
  positions: Array<{
    catalog_code: string | null;
    title: string;
    description: string | null;
    quantity: number;
    unit: string;
    progress_percent: number;
  }>;
}

export function generateZbProtokollHtml(data: ZbProtokollData): string {
  const { project, client, protocol, positions } = data;

  const totalProgress =
    positions.length > 0
      ? Math.round(
          positions.reduce((sum, p) => sum + p.progress_percent, 0) / positions.length
        )
      : 0;

  const formatDate = (iso: string): string => {
    try {
      return new Date(iso).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const progressColor = (pct: number): string => {
    if (pct >= 80) return "#38a169";
    if (pct >= 50) return "#d69e2e";
    return "#e53e3e";
  };

  const progressBgColor = (pct: number): string => {
    if (pct >= 80) return "#f0fff4";
    if (pct >= 50) return "#fffff0";
    return "#fff5f5";
  };

  const progressBorderColor = (pct: number): string => {
    if (pct >= 80) return "#9ae6b4";
    if (pct >= 50) return "#faf089";
    return "#feb2b2";
  };

  const posRows = positions
    .map((p, idx) => {
      const pct = Math.min(100, Math.max(0, p.progress_percent));
      const color = progressColor(pct);
      const rowBg = idx % 2 === 0 ? "#ffffff" : "#f7fafc";
      const barWidth = `${pct}%`;
      return `
        <tr style="background:${rowBg};page-break-inside:avoid;">
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:10pt;color:#718096;width:50px;">${idx + 1}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:10pt;">
            ${p.catalog_code ? `<span style="color:#718096;font-size:9pt;">${p.catalog_code} — </span>` : ""}
            <strong>${escapeHtml(p.title)}</strong>
            ${p.description ? `<br><span style="color:#718096;font-size:9pt;">${escapeHtml(p.description)}</span>` : ""}
          </td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:10pt;text-align:right;white-space:nowrap;width:90px;">
            ${p.quantity.toFixed(2)} ${escapeHtml(p.unit)}
          </td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;width:140px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="flex:1;background:#e2e8f0;border-radius:4px;height:10px;overflow:hidden;">
                <div style="width:${barWidth};background:${color};height:10px;border-radius:4px;"></div>
              </div>
              <span style="font-size:10pt;font-weight:700;color:${color};min-width:34px;text-align:right;">${pct}%</span>
            </div>
          </td>
        </tr>`;
    })
    .join("\n");

  const totalColor = progressColor(totalProgress);
  const totalBg = progressBgColor(totalProgress);
  const totalBorder = progressBorderColor(totalProgress);

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Segoe UI", Arial, sans-serif; font-size: 11pt; color: #2d3748; line-height: 1.5; }
    @page { margin: 20mm 15mm 20mm 15mm; }

    .header {
      background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
      color: #ffffff;
      padding: 28px 32px;
    }
    .header-brand {
      font-size: 11pt;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #bee3f8;
      margin-bottom: 6px;
    }
    .header-title { font-size: 22pt; font-weight: 700; margin-bottom: 4px; letter-spacing: -0.5px; }
    .header-sub { font-size: 10pt; color: #bee3f8; }

    .meta-box {
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-top: none;
      padding: 20px 32px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 32px;
      margin-bottom: 24px;
    }
    .meta-item { display: flex; flex-direction: column; }
    .meta-label { font-size: 8pt; font-weight: 700; text-transform: uppercase; color: #718096; letter-spacing: 0.5px; margin-bottom: 2px; }
    .meta-value { font-size: 10pt; color: #2d3748; font-weight: 600; }

    .section-header { font-size: 12pt; font-weight: 700; color: #2c5282; border-bottom: 2px solid #2c5282; padding-bottom: 6px; margin: 0 0 12px 0; }

    table { width: 100%; border-collapse: collapse; }
    thead th { background: #2c5282; color: #ffffff; padding: 8px 8px; font-size: 9pt; font-weight: 700; text-align: left; }
    thead th:nth-child(3) { text-align: right; }
    thead th:last-child { text-align: center; }

    .total-progress-box {
      margin-top: 24px;
      padding: 20px 24px;
      background: ${totalBg};
      border: 2px solid ${totalBorder};
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 24px;
      page-break-inside: avoid;
    }
    .total-progress-label { font-size: 10pt; font-weight: 700; color: #2c5282; min-width: 140px; }
    .total-progress-bar-wrap { flex: 1; background: #e2e8f0; border-radius: 6px; height: 14px; overflow: hidden; }
    .total-progress-bar { height: 14px; border-radius: 6px; background: ${totalColor}; width: ${totalProgress}%; }
    .total-progress-pct { font-size: 18pt; font-weight: 700; color: ${totalColor}; min-width: 60px; text-align: right; }

    .next-appointment-box {
      margin-top: 16px;
      padding: 14px 18px;
      background: #ebf8ff;
      border: 1px solid #90cdf4;
      border-radius: 6px;
    }
    .next-appointment-label { font-size: 9pt; font-weight: 700; color: #2c5282; margin-bottom: 2px; }
    .next-appointment-value { font-size: 11pt; font-weight: 600; color: #2b6cb0; }

    .notes-box { background: #fffbeb; border: 1px solid #f6e05e; border-radius: 6px; padding: 14px 18px; margin-top: 16px; }
    .notes-label { font-size: 9pt; font-weight: 700; color: #975a16; margin-bottom: 4px; }
    .notes-text { font-size: 10pt; color: #744210; }

    .signature-section { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; page-break-inside: avoid; }
    .signature-box { border: 1px solid #cbd5e0; border-radius: 6px; padding: 16px; }
    .signature-title { font-size: 9pt; font-weight: 700; color: #2c5282; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .signature-line { border-bottom: 2px solid #2d3748; height: 60px; margin-bottom: 8px; }
    .signature-name-label { font-size: 8pt; color: #718096; }

    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 8pt; color: #718096; text-align: center; }
  </style>
</head>
<body>

  <div class="header">
    <div class="header-brand">Deine Baulöwen</div>
    <div class="header-title">Zwischenbegehungs-Protokoll Nr. ${escapeHtml(protocol.protocol_number)}</div>
    <div class="header-sub">Fortschrittskontrolle</div>
  </div>

  <div class="meta-box">
    <div class="meta-item">
      <span class="meta-label">Projekt</span>
      <span class="meta-value">${escapeHtml(project.name)}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Protokoll-Nr.</span>
      <span class="meta-value">${escapeHtml(protocol.protocol_number)}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Adresse</span>
      <span class="meta-value">${escapeHtml(project.address)}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Prüfdatum</span>
      <span class="meta-value">${formatDate(protocol.inspection_date)}</span>
    </div>
    ${client ? `
    <div class="meta-item">
      <span class="meta-label">Auftraggeber</span>
      <span class="meta-value">${escapeHtml(client.name)}</span>
    </div>` : ""}
    <div class="meta-item">
      <span class="meta-label">Prüfer</span>
      <span class="meta-value">${escapeHtml(protocol.inspector_name)}</span>
    </div>
  </div>

  <div class="section-header">Positionen &amp; Fortschritt</div>
  <table>
    <thead>
      <tr>
        <th style="width:50px;">Pos.</th>
        <th>Beschreibung</th>
        <th style="width:90px;text-align:right;">Menge</th>
        <th style="width:140px;text-align:center;">Fortschritt</th>
      </tr>
    </thead>
    <tbody>${posRows}</tbody>
  </table>

  <!-- Gesamtfortschritt -->
  <div class="total-progress-box">
    <span class="total-progress-label">Gesamtfortschritt</span>
    <div class="total-progress-bar-wrap">
      <div class="total-progress-bar"></div>
    </div>
    <span class="total-progress-pct">${totalProgress}%</span>
  </div>

  <!-- Nächster Termin -->
  ${protocol.next_appointment ? `
  <div class="next-appointment-box">
    <div class="next-appointment-label">Nächster Termin</div>
    <div class="next-appointment-value">${formatDate(protocol.next_appointment)}</div>
  </div>` : ""}

  <!-- Anmerkungen -->
  ${protocol.general_notes ? `
  <div class="notes-box">
    <div class="notes-label">Anmerkungen</div>
    <div class="notes-text">${escapeHtml(protocol.general_notes)}</div>
  </div>` : ""}

  <!-- Unterschriften -->
  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-title">Auftragnehmer</div>
      <div class="signature-line"></div>
      <div class="signature-name-label">Unterschrift, Datum</div>
    </div>
    <div class="signature-box">
      <div class="signature-title">Auftraggeber</div>
      <div class="signature-line"></div>
      <div class="signature-name-label">Unterschrift, Datum</div>
    </div>
  </div>

  <div class="footer">
    Deine Baulöwen · Zwischenbegehungs-Protokoll ${escapeHtml(protocol.protocol_number)} · Erstellt am ${formatDate(new Date().toISOString())}
  </div>

</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
