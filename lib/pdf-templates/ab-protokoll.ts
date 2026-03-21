// AB-Protokoll HTML Template für Gotenberg PDF-Generierung

export interface AbProtokollData {
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
    unit_price: number;
  }>;
  signaturePath?: string;
  totalNet: number;
}

export function generateAbProtokollHtml(data: AbProtokollData): string {
  const { project, client, protocol, positions, totalNet } = data;

  const mwst = totalNet * 0.19;
  const totalBrutto = totalNet + mwst;

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

  const formatCurrency = (amount: number): string =>
    amount.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

  const posRows = positions
    .map((p, idx) => {
      const total = p.quantity * p.unit_price;
      const rowBg = idx % 2 === 0 ? "#ffffff" : "#f7fafc";
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
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:10pt;text-align:right;white-space:nowrap;width:90px;">
            ${formatCurrency(p.unit_price)}
          </td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:10pt;text-align:right;white-space:nowrap;width:90px;font-weight:600;">
            ${formatCurrency(total)}
          </td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:11pt;text-align:center;width:40px;">
            <span style="color:#38a169;font-weight:700;">&#10003;</span>
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
    }
    .header-brand { font-size: 11pt; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: #bee3f8; margin-bottom: 6px; }
    .header-title { font-size: 22pt; font-weight: 700; margin-bottom: 4px; letter-spacing: -0.5px; }
    .header-sub { font-size: 10pt; color: #bee3f8; }

    .completion-banner {
      background: #f0fff4;
      border-bottom: 3px solid #38a169;
      padding: 12px 32px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .completion-banner-icon { font-size: 16pt; color: #38a169; font-weight: 700; }
    .completion-banner-text { font-size: 11pt; font-weight: 700; color: #276749; }

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
    thead th:nth-child(3), thead th:nth-child(4), thead th:nth-child(5) { text-align: right; }
    thead th:last-child { text-align: center; }

    .price-summary {
      margin-top: 20px;
      margin-left: auto;
      width: 320px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .price-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 16px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 10pt;
    }
    .price-row:last-child { border-bottom: none; }
    .price-row-total {
      background: #2c5282;
      color: #ffffff;
      font-size: 12pt;
      font-weight: 700;
    }
    .price-label { color: inherit; }
    .price-value { font-weight: 600; }

    .notes-box { background: #fffbeb; border: 1px solid #f6e05e; border-radius: 6px; padding: 14px 18px; margin-top: 20px; }
    .notes-label { font-size: 9pt; font-weight: 700; color: #975a16; margin-bottom: 4px; }
    .notes-text { font-size: 10pt; color: #744210; }

    .legal-box {
      margin-top: 20px;
      padding: 14px 18px;
      background: #f7fafc;
      border: 1px solid #cbd5e0;
      border-radius: 6px;
      font-size: 9pt;
      color: #4a5568;
      font-style: italic;
    }

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
    <div class="header-title">Abnahme-Protokoll</div>
    <div class="header-sub">Protokoll-Nr. ${escapeHtml(protocol.protocol_number)}</div>
  </div>

  <div class="completion-banner">
    <span class="completion-banner-icon">&#10003;</span>
    <span class="completion-banner-text">Alle Leistungen zu 100% erbracht</span>
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
      <span class="meta-label">Abnahmedatum</span>
      <span class="meta-value">${formatDate(protocol.inspection_date)}</span>
    </div>
    ${client ? `
    <div class="meta-item">
      <span class="meta-label">Auftraggeber</span>
      <span class="meta-value">${escapeHtml(client.name)}<br>
        <span style="font-size:9pt;font-weight:400;color:#718096;">${escapeHtml(client.address)}, ${escapeHtml(client.zip)} ${escapeHtml(client.city)}</span>
      </span>
    </div>` : ""}
    <div class="meta-item">
      <span class="meta-label">Prüfer</span>
      <span class="meta-value">${escapeHtml(protocol.inspector_name)}</span>
    </div>
  </div>

  <div class="section-header">Abgenommene Leistungen</div>
  <table>
    <thead>
      <tr>
        <th style="width:50px;">Pos.</th>
        <th>Beschreibung</th>
        <th style="width:90px;text-align:right;">Menge</th>
        <th style="width:90px;text-align:right;">EP</th>
        <th style="width:90px;text-align:right;">GP</th>
        <th style="width:40px;text-align:center;">&#10003;</th>
      </tr>
    </thead>
    <tbody>${posRows}</tbody>
  </table>

  <!-- Preiszusammenfassung -->
  <div class="price-summary">
    <div class="price-row">
      <span class="price-label">Netto:</span>
      <span class="price-value">${formatCurrency(totalNet)}</span>
    </div>
    <div class="price-row">
      <span class="price-label">MwSt. 19%:</span>
      <span class="price-value">${formatCurrency(mwst)}</span>
    </div>
    <div class="price-row price-row-total">
      <span class="price-label">Gesamt brutto:</span>
      <span class="price-value">${formatCurrency(totalBrutto)}</span>
    </div>
  </div>

  <!-- Anmerkungen -->
  ${protocol.general_notes ? `
  <div class="notes-box">
    <div class="notes-label">Anmerkungen</div>
    <div class="notes-text">${escapeHtml(protocol.general_notes)}</div>
  </div>` : ""}

  <!-- Rechtstext -->
  <div class="legal-box">
    Mit Unterschrift bestätigen beide Parteien die vollständige Leistungserbringung gemäß den vereinbarten Positionen.
    Die abgenommenen Leistungen werden als vertragsgemäß und mängelfrei anerkannt.
  </div>

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
    Deine Baulöwen · Abnahme-Protokoll ${escapeHtml(protocol.protocol_number)} · Erstellt am ${formatDate(new Date().toISOString())}
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
