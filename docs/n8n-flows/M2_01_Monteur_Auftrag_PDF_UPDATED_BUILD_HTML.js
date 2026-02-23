// Updated Build HTML node for M2_01_Monteur_Auftrag_PDF
// Changes: Added PL/RO/RU labels + title_de fallback display
// To deploy: Replace the "Build HTML" code node in n8n workflow v2b5w05D-CR5WxCsbbmAi

const input = $input.first().json;
const webhookData = $('Webhook').first().json;
const data = input.data;

if (!data || !data.project) {
  throw new Error('Projekt nicht gefunden');
}

const { project, sections, is_saga } = data;
const language = webhookData.language || 'de';
const hidePrices = webhookData.hide_prices !== false;

const dueDate = project.deadline
  ? new Date(project.deadline).toLocaleDateString('de-DE')
  : '';

const labels = {
  de: {
    title: 'MONTEUR-AUFTRAG',
    date: 'Datum',
    dueDate: 'Fertigstellung bis',
    signature: 'Unterschrift Monteur',
    note: 'Notizen',
    qty: 'Menge',
    project: 'Projekt',
    address: 'Adresse'
  },
  tr: {
    title: 'MONTAJ SİPARİŞİ',
    date: 'Tarih',
    dueDate: 'Teslim Tarihi',
    signature: 'Montör İmzası',
    note: 'Notlar',
    qty: 'Miktar',
    project: 'Proje',
    address: 'Adres'
  },
  pl: {
    title: 'ZLECENIE MONTAŻOWE',
    date: 'Data',
    dueDate: 'Termin wykonania',
    signature: 'Podpis montera',
    note: 'Uwagi',
    qty: 'Ilość',
    project: 'Projekt',
    address: 'Adres'
  },
  ro: {
    title: 'COMANDĂ DE MONTAJ',
    date: 'Data',
    dueDate: 'Termen de finalizare',
    signature: 'Semnătura montatorului',
    note: 'Note',
    qty: 'Cantitate',
    project: 'Proiect',
    address: 'Adresă'
  },
  ru: {
    title: 'НАРЯД НА МОНТАЖ',
    date: 'Дата',
    dueDate: 'Срок выполнения',
    signature: 'Подпись монтажника',
    note: 'Примечания',
    qty: 'Кол-во',
    project: 'Проект',
    address: 'Адрес'
  }
};

const l = labels[language] || labels.de;
const today = new Date().toLocaleDateString('de-DE');
const showDualLang = language !== 'de';

const projectAddress = [
  project.street,
  [project.zip_code, project.city].filter(Boolean).join(' ')
].filter(Boolean).join(', ') || '-';

const dueDateHtml = dueDate ? `
  <div class="due-date-box">
    <span class="due-label">${l.dueDate}:</span>
    <span class="due-value">${dueDate}</span>
  </div>
` : '';

let sectionsHtml = '';
for (const section of sections || []) {
  if (!section.positions || section.positions.length === 0) continue;

  let positionsHtml = '';
  for (const pos of section.positions) {
    const qty = pos.quantity ? `${pos.quantity} ${pos.unit || 'psch'}` : '-';
    // Show translated title, with German original in small below if different language
    const titleHtml = showDualLang && pos.title_de && pos.title !== pos.title_de
      ? `${pos.title}<br/><span class="title-de">${pos.title_de}</span>`
      : pos.title;

    positionsHtml += `
      <tr>
        <td class="checkbox-cell">☐</td>
        <td class="title-cell">${titleHtml}</td>
        <td class="qty-cell">${qty}</td>
      </tr>
      <tr>
        <td></td>
        <td colspan="2" class="note-cell">${l.note}: <span class="note-line"></span></td>
      </tr>
    `;
  }

  sectionsHtml += `
    <div class="section">
      <div class="section-header">${(section.group_label || 'Allgemein').toUpperCase()}</div>
      <table class="positions-table">
        ${positionsHtml}
      </table>
    </div>
  `;
}

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      margin: 15mm;
      size: A4;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.3;
      color: #222;
      margin: 0;
      padding: 0;
    }

    .header {
      background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
      color: white;
      padding: 20px 25px;
      margin: 0 0 20px 0;
      border-radius: 6px;
    }

    .header h1 {
      margin: 0 0 5px 0;
      font-size: 22pt;
      font-weight: 600;
      letter-spacing: 1px;
    }

    .header-subtitle {
      font-size: 9pt;
      opacity: 0.9;
    }

    .meta-box {
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 15px;
      margin-bottom: 20px;
    }

    .meta-row {
      display: flex;
      margin-bottom: 4px;
    }

    .meta-row:last-child {
      margin-bottom: 0;
    }

    .meta-label {
      font-weight: 600;
      color: #4a5568;
      width: 80px;
      flex-shrink: 0;
    }

    .meta-value {
      color: #1a202c;
    }

    .due-date-box {
      background: #edf2f7;
      border: 2px solid #2c5282;
      border-radius: 6px;
      padding: 10px 15px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .due-label {
      font-weight: 600;
      color: #2c5282;
      font-size: 11pt;
    }

    .due-value {
      font-weight: 700;
      color: #1a365d;
      font-size: 12pt;
    }

    .section {
      margin-bottom: 18px;
      page-break-inside: avoid;
    }

    .section-header {
      background: #2c5282;
      color: white;
      font-weight: 600;
      font-size: 11pt;
      padding: 8px 12px;
      border-radius: 4px 4px 0 0;
      letter-spacing: 0.5px;
    }

    .positions-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #e2e8f0;
      border-top: none;
    }

    .positions-table tr:nth-child(4n+1),
    .positions-table tr:nth-child(4n+2) {
      background: #f7fafc;
    }

    .checkbox-cell {
      width: 35px;
      text-align: center;
      font-size: 16pt;
      vertical-align: top;
      padding: 10px 5px 5px 10px;
      border-right: 1px solid #e2e8f0;
    }

    .title-cell {
      padding: 10px 10px 5px 10px;
      vertical-align: top;
      line-height: 1.4;
    }

    .title-de {
      font-size: 8pt;
      color: #a0aec0;
      font-style: italic;
    }

    .qty-cell {
      width: 70px;
      text-align: center;
      padding: 10px 10px 5px 5px;
      vertical-align: top;
      font-weight: 500;
      color: #4a5568;
      border-left: 1px solid #e2e8f0;
    }

    .note-cell {
      padding: 0 10px 12px 10px;
      color: #718096;
      font-size: 9pt;
    }

    .note-line {
      display: inline-block;
      width: calc(100% - 50px);
      border-bottom: 1px solid #cbd5e0;
      margin-left: 5px;
      height: 12px;
    }

    .footer {
      margin-top: 30px;
      page-break-inside: avoid;
    }

    .signature-box {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 15px 20px;
      background: #f7fafc;
    }

    .signature-label {
      font-size: 9pt;
      color: #718096;
      margin-bottom: 25px;
    }

    .signature-row {
      display: flex;
      justify-content: space-between;
      gap: 40px;
    }

    .signature-field {
      flex: 1;
    }

    .signature-line {
      border-top: 1px solid #1a365d;
      padding-top: 5px;
      font-weight: 500;
      font-size: 9pt;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${l.title}</h1>
    <div class="header-subtitle">Deine Baulöwen</div>
  </div>

  <div class="meta-box">
    <div class="meta-row">
      <div class="meta-label">${l.project}:</div>
      <div class="meta-value"><strong>${project.name || 'Unbenannt'}</strong></div>
    </div>
    <div class="meta-row">
      <div class="meta-label">${l.address}:</div>
      <div class="meta-value">${projectAddress}</div>
    </div>
    <div class="meta-row">
      <div class="meta-label">${l.date}:</div>
      <div class="meta-value">${today}</div>
    </div>
  </div>

  ${dueDateHtml}

  ${sectionsHtml || '<p>Keine Positionen vorhanden.</p>'}

  <div class="footer">
    <div class="signature-box">
      <div class="signature-label">Arbeiten vollständig ausgeführt:</div>
      <div class="signature-row">
        <div class="signature-field">
          <div class="signature-line">${l.signature}</div>
        </div>
        <div class="signature-field">
          <div class="signature-line">${l.date}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

const filename = `${project.project_number || 'Auftrag'}_Monteur_${language.toUpperCase()}.pdf`;
const storagePath = `projects/${webhookData.project_id}/monteurauftraege/${filename}`;

const binaryData = await this.helpers.prepareBinaryData(
  Buffer.from(html, 'utf8'),
  'index.html',
  'text/html'
);

return {
  json: {
    filename,
    storage_path: storagePath,
    project_id: webhookData.project_id,
    language
  },
  binary: {
    data: binaryData
  }
};
