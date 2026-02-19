# HANDOVER: M2_03 Protocol PDF Generator Fix

**Datum:** 2026-01-17  
**Modul:** M2 Baustelle / Inspection Protocols  
**Status:** 🔧 IN PROGRESS  
**Workflow:** M2_03Generate_Protocol_PDF (`lDrZnW4bYMCpumiTbmkKl`)

---

## Problem

PDF-Generierung crasht mit `Problem in node 'Gotenberg PDF' - Your request is invalid or could not be processed by the service`.

Zusätzlich: Generierte PDFs zeigen unreplaced Placeholders wie `{{protocol_number}}`, `{{address}}`, `{{inspector_name}}`.

---

## Root Cause Analyse

### 1. Gotenberg Node — Falsches Request-Format

| Setting | M2_03 (FALSCH) | M2_01 (KORREKT) |
|---------|----------------|-----------------|
| Content Type | `binaryData` | `multipart-form-data` |
| Body | `inputDataFieldName` direkt | `bodyParameters` mit `formBinaryData` |
| Binary prep | Manuelles Base64 | `this.helpers.prepareBinaryData()` |

### 2. SQL-Funktion — Fehlende Felder

`get_inspection_protocol_details()` lieferte nicht:
- `inspector_name`
- `general_notes`
- `project_address`

### 3. Build HTML Node — Fehlende Berechnungen

Template erwartet Werte die berechnet werden müssen:
- `{{overall_progress_percent}}` — Durchschnitt aller Positionen
- `{{in_progress_items}}` — Anzahl Positionen 0 < progress < 100
- `{{items_html}}` — Falsches Format (Trade-Header fehlten)

### 4. Template — Handlebars nicht verarbeitet

`{{#if general_notes}}...{{/if}}` wurde nicht ausgewertet.

### 5. Storage Bucket — Falsche URL

Flow versuchte Upload nach `documents/protocols/...` — Bucket existiert nicht.
Korrekt: `project-files/protocols/...`

---

## Durchgeführte Fixes

### ✅ SQL-Funktion erweitert

```sql
-- Migration: fix_get_inspection_protocol_details_v2
DROP FUNCTION IF EXISTS get_inspection_protocol_details(uuid);

CREATE OR REPLACE FUNCTION public.get_inspection_protocol_details(p_protocol_id uuid)
RETURNS TABLE(
    protocol_id uuid,
    protocol_type text,
    protocol_number text,
    inspection_date date,
    status text,
    inspector_name text,          -- NEU
    general_notes text,           -- NEU
    project_id uuid,
    project_number text,
    project_address text,         -- NEU
    client_id uuid,
    client_name text,
    item_id uuid,
    offer_position_id uuid,
    position_code text,
    position_title text,
    trade text,
    item_status text,
    progress_percent integer,
    notes text,
    default_product_id uuid,
    default_product_name text,
    default_product_format text,
    override_product_id uuid,
    override_product_name text,
    wet_area_type text,
    has_defect boolean,
    requires_supplement boolean
)
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        ip.id AS protocol_id,
        ip.protocol_type,
        ip.protocol_number,
        ip.inspection_date,
        ip.status,
        ip.inspector_name,
        ip.general_notes,
        p.id AS project_id,
        p.project_number,
        CONCAT_WS(', ', p.object_street, CONCAT(p.object_zip, ' ', p.object_city)) AS project_address,
        p.client_id,
        c.company_name AS client_name,
        -- ... rest bleibt gleich
    FROM inspection_protocols ip
    JOIN projects p ON p.id = ip.project_id
    LEFT JOIN clients c ON c.id = p.client_id
    LEFT JOIN inspection_protocol_items ipi ON ipi.protocol_id = ip.id
    LEFT JOIN offer_positions op ON op.id = ipi.offer_position_id
    -- ... JOINs bleiben gleich
    WHERE ip.id = p_protocol_id
    ORDER BY ipi.sort_order;
END;
$function$;
```

---

## Ausstehende Fixes (n8n manuell)

### 1. Build HTML Node — Komplett ersetzen

```javascript
const data = $('Determine Template Key').first().json;
const template = $('Load Template').first().json.html_content;
const allItems = data.allItems || [];

// ============ BERECHNUNGEN ============
const totalItems = allItems.length;
const completedItems = allItems.filter(i => i.progress_percent === 100).length;
const inProgressItems = allItems.filter(i => i.progress_percent > 0 && i.progress_percent < 100).length;
const itemsWithIssues = allItems.filter(i => i.has_defect || i.requires_supplement).length;
const overallProgress = totalItems > 0 
  ? Math.round(allItems.reduce((sum, i) => sum + (i.progress_percent || 0), 0) / totalItems)
  : 0;

// ============ DATUM FORMATIEREN ============
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ============ ITEMS HTML GENERIEREN ============
const grouped = {};
for (const item of allItems) {
  const trade = item.trade || 'Sonstiges';
  if (!grouped[trade]) grouped[trade] = [];
  grouped[trade].push(item);
}

let itemsHtml = '';
for (const [trade, positions] of Object.entries(grouped)) {
  itemsHtml += `<tr style="background:#edf2f7"><td colspan="6" style="padding:8px;font-weight:600;color:#1a365d">${trade}</td></tr>`;
  
  for (const pos of positions) {
    const progress = pos.progress_percent || 0;
    const progressClass = `progress-${Math.floor(progress / 10) * 10}`;
    const progressColorClass = progress < 40 ? 'progress-low' : progress < 70 ? 'progress-mid' : 'progress-high';
    
    let statusHtml;
    if (pos.item_status === 'ja' || progress === 100) {
      statusHtml = '<span class="status-yes">✓</span>';
    } else if (pos.item_status === 'nein' || progress === 0) {
      statusHtml = '<span class="status-no">✗</span>';
    } else if (pos.item_status === 'teilweise') {
      statusHtml = '<span class="status-partial">◐</span>';
    } else if (pos.item_status === 'nicht_anwendbar') {
      statusHtml = '<span class="status-na">n/a</span>';
    } else {
      statusHtml = '<span class="status-open">○</span>';
    }
    
    const rowClass = (pos.has_defect || pos.requires_supplement) ? 'has-issue' : '';
    const defectNote = pos.has_defect ? '<div class="defect-indicator">⚠ Mangel</div>' : '';
    
    itemsHtml += `
      <tr class="${rowClass}">
        <td class="col-position">${pos.position_code || ''}</td>
        <td>${pos.position_title || ''}</td>
        <td class="col-trade">${pos.trade || ''}</td>
        <td class="col-progress">
          <div class="progress-container">
            <div class="progress-bar"><div class="progress-fill ${progressClass}"></div></div>
            <span class="progress-text ${progressColorClass}">${progress}%</span>
          </div>
        </td>
        <td class="col-status">${statusHtml}</td>
        <td class="col-notes">${pos.notes || ''}${defectNote}</td>
      </tr>`;
  }
}

// ============ LOGO URL ============
const logoUrl = 'https://yetwntwayhmzmhhgdkli.supabase.co/storage/v1/object/public/assets/logo-baulowen.png';

// ============ PLACEHOLDERS ERSETZEN ============
let html = template
  .replace(/\{\{logo_url\}\}/g, logoUrl)
  .replace(/\{\{protocol_number\}\}/g, data.protocol_number || '')
  .replace(/\{\{protocol_type\}\}/g, data.protocol_type || '')
  .replace(/\{\{inspection_date\}\}/g, formatDate(data.inspection_date))
  .replace(/\{\{project_number\}\}/g, data.project_number || '')
  .replace(/\{\{client_name\}\}/g, data.client_name || '')
  .replace(/\{\{address\}\}/g, data.project_address || '-')
  .replace(/\{\{inspector_name\}\}/g, data.inspector_name || '-')
  .replace(/\{\{overall_progress_percent\}\}/g, overallProgress)
  .replace(/\{\{items_html\}\}/g, itemsHtml)
  .replace(/\{\{total_items\}\}/g, totalItems)
  .replace(/\{\{completed_items\}\}/g, completedItems)
  .replace(/\{\{in_progress_items\}\}/g, inProgressItems)
  .replace(/\{\{items_with_issues\}\}/g, itemsWithIssues);

// ============ HANDLEBARS {{#if}} VERARBEITEN ============
if (data.general_notes && data.general_notes.trim()) {
  html = html.replace(/\{\{#if general_notes\}\}/g, '');
  html = html.replace(/\{\{\/if\}\}/g, '');
  html = html.replace(/\{\{general_notes\}\}/g, data.general_notes);
} else {
  html = html.replace(/\{\{#if general_notes\}\}[\s\S]*?\{\{\/if\}\}/g, '');
}

// ============ STORAGE PATH ============
const storagePath = `protocols/${data.project_number}/${data.protocol_number}.pdf`;

// ============ BINARY DATA KORREKT ERSTELLEN ============
const binaryData = await this.helpers.prepareBinaryData(
  Buffer.from(html, 'utf8'),
  'index.html',
  'text/html'
);

return [{
  json: {
    protocol_id: data.protocol_id,
    protocol_number: data.protocol_number,
    project_number: data.project_number,
    storage_path: storagePath
  },
  binary: {
    data: binaryData
  }
}];
```

### 2. Gotenberg PDF Node — Settings ändern

```
Method: POST
URL: http://gotenberg:3000/forms/chromium/convert/html

Content Type: Multipart Form Data

Body Parameters:
  + Add Parameter
    Parameter Type: Form Binary Data
    Name: files
    Input Data Field Name: data

Options:
  Response → Response Format: File
  Timeout: 30000
```

### 3. Upload to Storage Node — URL korrigieren

```
https://yetwntwayhmzmhhgdkli.supabase.co/storage/v1/object/project-files/{{ $('Build HTML').item.json.storage_path }}
```

### 4. Update Protocol PDF Path Node — SQL anpassen

```sql
UPDATE inspection_protocols
SET pdf_storage_path = '{{ $('Build HTML').item.json.storage_path }}'
WHERE id = '{{ $('Build HTML').item.json.protocol_id }}'::uuid
RETURNING id, pdf_storage_path;
```

---

## Test-Daten

```sql
-- Projekt: BL-2026-010 (56404c9c-3e55-4cd5-9ea4-40ebde77c58c)
-- Protokoll: ZB-2026-010-001 (fedb60fd-c6fe-4636-beac-7df0cb2fff2b)

-- Test Event erzeugen:
INSERT INTO events (event_type, project_id, payload, source_system, source_flow)
VALUES (
  'INSPECTION_PROTOCOL_COMPLETED',
  '56404c9c-3e55-4cd5-9ea4-40ebde77c58c',
  '{"protocol_id": "fedb60fd-c6fe-4636-beac-7df0cb2fff2b", "protocol_type": "zwischenbegehung", "protocol_number": "ZB-2026-010-001"}'::jsonb,
  'test',
  'manual_test'
);
```

---

## Vorhandene Infrastruktur

| Komponente | Status |
|------------|--------|
| Document Templates (`inspection_zb`, `inspection_eb_ab`) | ✅ Existiert |
| Storage Bucket `project-files` | ✅ Existiert |
| Storage Bucket `documents` | ❌ Existiert NICHT |
| Gotenberg Service | ✅ Läuft auf `http://gotenberg:3000` |
| Logo in Storage | ⚠️ Muss geprüft werden |

---

## Lessons Learned

1. **Gotenberg erwartet multipart-form-data** — nicht raw binary
2. **`prepareBinaryData()` ist Pflicht** — manuelles Base64 funktioniert nicht
3. **SQL-Funktion muss alle Template-Felder liefern** — sonst unreplaced Placeholders
4. **Handlebars-Syntax muss im Code verarbeitet werden** — Gotenberg kennt kein Handlebars
5. **Storage Bucket URLs prüfen** — falscher Bucket = 404

---

## Referenzen

- n8n Workflow ID: `lDrZnW4bYMCpumiTbmkKl`
- Funktionierendes Vorbild: M2_01 (`v2b5w05D-CR5WxCsbbmAi`)
- Templates: `document_templates` Tabelle
- Storage: `project-files` Bucket
