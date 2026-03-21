// EB-Protokoll HTML Template für Gotenberg PDF-Generierung

export interface EbProtokollData {
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
  };
  positions: Array<{
    catalog_code: string | null;
    title: string;
    description: string | null;
    quantity: number;
    unit: string;
    inspection_status: string;
  }>;
  photoUrls?: string[];
}

export function generateEbProtokollHtml(data: EbProtokollData): string {
  const { project, client, protocol, positions } = data;

  const confirmedCount = positions.filter((p) => p.inspection_status === "confirmed").length;
  const correctionCount = positions.filter((p) => p.inspection_status === "pending_correction").length;
  const pendingCount = positions.filter((p) => p.inspection_status === "pending").length;

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

  const posRows = positions
    .map((p, idx) => {
      const isConfirmed = p.inspection_status === "confirmed";
      const isCorrection = p.inspection_status === "pending_correction";
      const statusHtml = isConfirmed
        ? `<span style="color:#38a169;font-weight:700;">&#10003;</span>`
        : isCorrection
        ? `<span style="color:#e53e3e;font-weight:700;">&#10007;</span>`
        : `<span style="color:#d69e2e;font-weight:700;">&#9679;</span>`;
      const rowBg = idx % 2 === 0 ? "#ffffff" : "#f7fafc";
      return `
        <tr style="background:${rowBg};page-break-inside:avoid;">
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:10pt;color:#718096;width:60px;">${idx + 1}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:10pt;">
            ${p.catalog_code ? `<span style="color:#718096;font-size:9pt;">${p.catalog_code} — </span>` : ""}
            <strong>${escapeHtml(p.title)}</strong>
            ${p.description ? `<br><span style="color:#718096;font-size:9pt;">${escapeHtml(p.description)}</span>` : ""}
          </td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:10pt;text-align:right;white-space:nowrap;">
            ${p.quantity.toFixed(2)} ${escapeHtml(p.unit)}
          </td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:11pt;text-align:center;width:50px;">
            ${statusHtml}
          </td>
        </tr>`;
    })
    .join("\n");

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
      margin-bottom: 0;
    }
    .header-brand {
      font-size: 11pt;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #bee3f8;
      margin-bottom: 6px;
    }
    .header-title {
      font-size: 22pt;
      font-weight: 700;
      margin-bottom: 4px;
      letter-spacing: -0.5px;
    }
    .header-sub {
      font-size: 10pt;
      color: #bee3f8;
      font-weight: 400;
    }

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
    .meta-label {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #718096;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .meta-value { font-size: 10pt; color: #2d3748; font-weight: 600; }

    .section-header {
      font-size: 12pt;
      font-weight: 700;
      color: #2c5282;
      border-bottom: 2px solid #2c5282;
      padding-bottom: 6px;
      margin: 0 0 12px 0;
    }

    table { width: 100%; border-collapse: collapse; }
    thead th {
      background: #2c5282;
      color: #ffffff;
      padding: 8px 8px;
      font-size: 9pt;
      font-weight: 700;
      text-align: left;
    }
    thead th:last-child { text-align: center; }
    thead th:nth-child(3) { text-align: right; }

    .summary-box {
      margin-top: 24px;
      display: flex;
      gap: 12px;
    }
    .summary-item {
      flex: 1;
      padding: 12px 16px;
      border-radius: 8px;
      text-align: center;
    }
    .summary-count { font-size: 22pt; font-weight: 700; }
    .summary-label { font-size: 9pt; font-weight: 600; margin-top: 2px; }

    .notes-box {
      background: #fffbeb;
      border: 1px solid #f6e05e;
      border-radius: 6px;
      padding: 14px 18px;
      margin-top: 20px;
    }
    .notes-label { font-size: 9pt; font-weight: 700; color: #975a16; margin-bottom: 4px; }
    .notes-text { font-size: 10pt; color: #744210; }

    .signature-section {
      margin-top: 40px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      page-break-inside: avoid;
    }
    .signature-box {
      border: 1px solid #cbd5e0;
      border-radius: 6px;
      padding: 16px;
    }
    .signature-title {
      font-size: 9pt;
      font-weight: 700;
      color: #2c5282;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .signature-line {
      border-bottom: 2px solid #2d3748;
      height: 60px;
      margin-bottom: 8px;
    }
    .signature-name-label { font-size: 8pt; color: #718096; }

    .footer {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 8pt;
      color: #718096;
      text-align: center;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="header-brand">Deine Baulöwen</div>
    <div class="header-title">Erstbegehungs-Protokoll</div>
    <div class="header-sub">Protokoll-Nr. ${escapeHtml(protocol.protocol_number)}</div>
  </div>

  <!-- Meta Box -->
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

  <!-- Positions Table -->
  <div class="section-header">Positionen</div>
  <table>
    <thead>
      <tr>
        <th style="width:50px;">Pos.</th>
        <th>Beschreibung</th>
        <th style="width:100px;text-align:right;">Menge</th>
        <th style="width:50px;text-align:center;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${posRows}
    </tbody>
  </table>

  <!-- Summary -->
  <div class="summary-box">
    <div class="summary-item" style="background:#f0fff4;border:1px solid #9ae6b4;">
      <div class="summary-count" style="color:#38a169;">${confirmedCount}</div>
      <div class="summary-label" style="color:#276749;">Bestätigt</div>
    </div>
    <div class="summary-item" style="background:#fff5f5;border:1px solid #feb2b2;">
      <div class="summary-count" style="color:#e53e3e;">${correctionCount}</div>
      <div class="summary-label" style="color:#9b2c2c;">Korrektur nötig</div>
    </div>
    ${pendingCount > 0 ? `
    <div class="summary-item" style="background:#fffff0;border:1px solid #faf089;">
      <div class="summary-count" style="color:#d69e2e;">${pendingCount}</div>
      <div class="summary-label" style="color:#975a16;">Ausstehend</div>
    </div>` : ""}
    <div class="summary-item" style="background:#ebf8ff;border:1px solid #90cdf4;">
      <div class="summary-count" style="color:#2b6cb0;">${positions.length}</div>
      <div class="summary-label" style="color:#2c5282;">Gesamt</div>
    </div>
  </div>

  <!-- Notes -->
  ${protocol.general_notes ? `
  <div class="notes-box">
    <div class="notes-label">Anmerkungen</div>
    <div class="notes-text">${escapeHtml(protocol.general_notes)}</div>
  </div>` : ""}

  <!-- Signatures -->
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
    Deine Baulöwen · Erstbegehungs-Protokoll ${escapeHtml(protocol.protocol_number)} · Erstellt am ${formatDate(new Date().toISOString())}
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
