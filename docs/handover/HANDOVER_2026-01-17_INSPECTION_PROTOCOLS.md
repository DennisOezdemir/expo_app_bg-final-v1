# HANDOVER: Inspection Protocols System

**Datum:** 2026-01-17  
**Modul:** M2 Baustelle — Protokolle (EB/ZB/AB)  
**Status:** DB + Templates ready, Flows pending

---

## 🎯 Was wurde gebaut

### 1. PDF Templates in DB

**Tabelle:** `document_templates`

| template_key | Typ | Beschreibung |
|--------------|-----|--------------|
| `inspection_eb_ab` | inspection | Erstbegehung + Abnahme (mit Unterschriften) |
| `inspection_zb` | inspection | Zwischenbegehung (mit Fortschrittsbalken) |

**Abruf:**
```sql
SELECT html_content FROM document_templates WHERE template_key = 'inspection_eb_ab';
```

**Template-Variablen:**
- `{{logo_url}}` — Supabase Storage URL
- `{{protocol_number}}` — EB-001, ZB-002, AB-001
- `{{protocol_type_label}}` — "Erstbegehung", "Abnahme"
- `{{inspection_date}}` — Formatiert: 17.01.2026
- `{{project_number}}`, `{{client_name}}`, `{{address}}`, `{{inspector_name}}`
- `{{items_html}}` — Generierte Table-Rows
- `{{total_items}}`, `{{completed_items}}`, `{{items_with_issues}}`
- `{{overall_progress_percent}}` — Nur ZB
- `{{show_signatures}}` — Boolean für AB
- `{{signature_contractor_url}}`, `{{signature_client_url}}` — Base64 Data-URLs

### 2. Logo in Storage

**Pfad:** `assets/LOGO DBL.webp`

**Public URL:**
```
https://yetwntwayhmzmhhgdkli.supabase.co/storage/v1/object/public/assets/LOGO%20DBL.webp
```

⚠️ **Bucket muss public sein** damit Gotenberg das Logo laden kann.

### 3. Progress-Tracking auf offer_positions

**Migration:** `add_progress_to_offer_positions`

**Neue Spalten:**
```sql
offer_positions.progress_percent      -- 0-100, aus letzter ZB
offer_positions.progress_updated_at   -- Timestamp
offer_positions.last_inspection_id    -- FK zu inspection_protocols
```

**Dashboard-View:**
```sql
SELECT * FROM v_project_progress;
-- Liefert: project_id, total_positions, completed_positions, 
--          in_progress_positions, avg_progress_percent, etc.
```

### 4. Bereits existierendes Schema (026_inspection_protocols.sql)

**Tabellen:**
- `inspection_protocols` — Hauptprotokoll
- `inspection_protocol_items` — Status pro Position
- `inspection_attachments` — MagicPlan, Fotos, Videos
- `client_product_defaults` — Standardprodukte pro Gesellschaft

**Events:**
- `INSPECTION_PROTOCOL_CREATED`
- `INSPECTION_PROTOCOL_COMPLETED`
- `INSPECTION_REQUIRES_SUPPLEMENT`

**Helper Functions:**
- `create_inspection_protocol(project_id, protocol_type, inspector_name)` — Erstellt Protokoll mit allen Positionen
- `get_inspection_protocol_details(protocol_id)` — Holt Protokoll mit Items + Defaults

---

## 🔄 Datenfluss

```
Frontend (Tally/React)
    ↓
ZB ausfüllen: progress_percent pro Position
    ↓
inspection_protocol_items UPDATE
    ↓
ZB status → 'completed'
    ↓
Event: INSPECTION_PROTOCOL_COMPLETED
    ↓
n8n Flow M2_01_Sync_ZB_Progress
    ↓
UPDATE offer_positions.progress_percent
    ↓
Dashboard liest v_project_progress
```

---

## 📋 Offene Flows

### Flow 1: M2_01_Create_Protocol
**Trigger:** Webhook oder Frontend-Call  
**Input:** `{ project_id, protocol_type, inspector_name }`  
**Logik:**
1. `SELECT create_inspection_protocol(...)` 
2. Event: INSPECTION_PROTOCOL_CREATED
3. Return: protocol_id

### Flow 2: M2_02_Sync_ZB_Progress
**Trigger:** Event INSPECTION_PROTOCOL_COMPLETED (nur für ZB)  
**Logik:**
1. Lade alle inspection_protocol_items
2. UPDATE offer_positions SET progress_percent = item.progress_percent
3. Telegram: "ZB-003 synced: 12 Positionen, Ø 67%"
4. Event: ZB_PROGRESS_SYNCED

### Flow 3: M2_03_Generate_Protocol_PDF
**Trigger:** Event INSPECTION_PROTOCOL_COMPLETED oder manuell  
**Logik:**
1. Lade Template aus document_templates
2. Lade Protokoll-Daten via get_inspection_protocol_details()
3. Replace {{variables}}
4. Generate items_html Loop
5. Send to Gotenberg
6. Save PDF to Storage: `/protocols/{project_number}/{protocol_number}.pdf`
7. Update inspection_protocols mit storage_path
8. Telegram: PDF-Link

---

## 🧱 Items HTML Generation (für n8n Code Node)

### EB/AB Items:
```javascript
const items_html = items.map(item => `
  <tr>
    <td class="col-position">${item.position_code}</td>
    <td class="col-title">${item.position_title}</td>
    <td class="col-trade">${item.trade || ''}</td>
    <td class="col-status">
      ${item.status === 'ja' ? '<span class="status-yes">✓</span>' : ''}
      ${item.status === 'nein' ? '<span class="status-no">✗</span>' : ''}
      ${item.status === 'teilweise' ? '<span class="status-partial">◐</span>' : ''}
      ${item.status === 'nicht_anwendbar' ? '<span class="status-na">n/a</span>' : ''}
      ${item.status === 'offen' ? '<span class="status-open">○</span>' : ''}
    </td>
    <td class="col-defect">
      ${item.has_defect ? '<span class="defect-yes">JA</span>' : '<span class="defect-no">—</span>'}
    </td>
    <td class="col-notes">
      ${item.notes || ''}
      ${item.defect_description ? `<div class="defect-description">⚠ ${item.defect_description}</div>` : ''}
    </td>
  </tr>
`).join('');
```

### ZB Items (mit Fortschrittsbalken):
```javascript
const getProgressClass = (p) => Math.round(p / 10) * 10;
const getColorClass = (p) => p < 30 ? 'progress-low' : p < 70 ? 'progress-mid' : 'progress-high';

const items_html = items.map(item => `
  <tr class="${item.has_defect ? 'has-issue' : ''}">
    <td class="col-position">${item.position_code}</td>
    <td class="col-title">${item.position_title}</td>
    <td class="col-trade">${item.trade || ''}</td>
    <td class="col-progress">
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill progress-${getProgressClass(item.progress_percent)}"></div>
        </div>
        <span class="progress-text ${getColorClass(item.progress_percent)}">${item.progress_percent}%</span>
      </div>
    </td>
    <td class="col-status">...</td>
    <td class="col-notes">...</td>
  </tr>
`).join('');
```

---

## 🔗 Relevante Dateien

| Datei | Inhalt |
|-------|--------|
| `026_inspection_protocols.sql` | DB Schema |
| `add_progress_to_offer_positions` | Migration für Progress-Tracking |
| `document_templates` | HTML Templates in DB |

---

## ⚠️ Wichtige Hinweise

1. **Logo-Bucket public machen** — Sonst 403 bei PDF-Generierung
2. **Gotenberg URL** — `http://gotenberg:3000` (Docker) oder konfigurierte URL
3. **Progress-Sync nur bei ZB** — EB und AB haben kein progress_percent
4. **Unterschriften nur bei AB** — `show_signatures` Flag setzen

---

## 📊 Test-Query

```sql
-- Neues Protokoll erstellen
SELECT create_inspection_protocol(
    '05282d92-3795-4522-b019-e094b30e8ac9'::uuid,  -- project_id
    'zwischenbegehung',
    'Dennis Schulze'
);

-- Progress-View testen
SELECT * FROM v_project_progress WHERE project_number = 'BL-2026-002';
```
