# HANDOVER 2026-01-24: MX_05 Aggregate Results Bug Fix

## ZUSAMMENFASSUNG

**Problem:** MX_05_Attachment_Processor erzeugte leere ATTACHMENTS_STORED Events
**Ursache:** `📦 Aggregate Results` Node verlor JSON-Kontext nach Binary HTTP Operations
**Lösung:** Referenz von `$input.all()` → `$('📝 Prepare Upload').all()` geändert

---

## BUG DETAILS

### Symptom
```json
{
  "files": [{}],
  "doc_type": "undefined",
  "project_number": "undefined",
  "source_event_id": "undefined"
}
```

### Root Cause
n8n HTTP Request Nodes (Binary Upload) geben nur ihre Response zurück.
Die ursprünglichen JSON-Felder (`file_id`, `project_number`, etc.) aus vorherigen Nodes werden nicht weitergereicht.

### Betroffener Node
`📦 Aggregate Results` in Workflow `MX_05_Attachment_Processor` (ID: `qAiKaCpDUF3yQUvcZA2rd`)

---

## FIX

### Vorher (kaputt)
```javascript
const items = $input.all();  // ← Nach Upload Storage ist das leer/korrupt
```

### Nachher (korrekt)
```javascript
const prepareItems = $('📝 Prepare Upload').all();  // ← Direkter Zugriff auf vorherigen Node
```

### Vollständiger Code
```javascript
const prepareItems = $('📝 Prepare Upload').all();

const files = prepareItems.map(item => ({
  file_id: item.json.file_id,
  name: item.json.file_name,
  storage_path: item.json.storage_path,
  mime_type: item.json.mime_type
}));

const first = prepareItems[0].json;

return {
  json: {
    event_id: first.event_id,
    project_number: first.project_number,
    doc_type: first.doc_type,
    files: files,
    file_count: files.length
  }
};
```

---

## VERIFIZIERUNG

### Test Event
```sql
INSERT INTO events (event_type, source_system, payload) VALUES (
  'DOC_CLASSIFIED_MAGICPLAN', 'n8n',
  '{"doc_type": "MAGICPLAN", "file_ids": ["fi_GZAz0JxPOPVRzIC2VD2Dh"], "project_number": "BL-2026-007"}'
);
```

### Ergebnis nach Fix
```json
{
  "files": [{
    "file_id": "fi_GZAz0JxPOPVRzIC2VD2Dh",
    "name": "file_1769267478612",
    "mime_type": "text/plain",
    "storage_path": "magicplan/BL-2026-007/file_1769267478612"
  }],
  "doc_type": "MAGICPLAN",
  "project_number": "BL-2026-007",
  "source_event_id": "a66359e0-01ed-479f-9abd-6fe5b910fdc2"
}
```

✅ **Fix verifiziert**

---

## PATTERN FÜR ZUKUNFT

**n8n Binary Operations brechen JSON-Kontext!**

Nach jedem HTTP Request mit Binary Upload NIEMALS `$input` verwenden.
Stattdessen explizit auf den letzten Node mit vollständigen Daten referenzieren:

```javascript
// FALSCH nach Binary Operation
const data = $input.first().json;

// RICHTIG
const data = $('Node Name Mit JSON Daten').first().json;
```

---

## NÄCHSTE SCHRITTE

1. **Issue #16** — Mengenberechnung aus Raummessungen
2. **Issue #17** — Frontend: Raummessungen anzeigen  
3. **Issue #13** — GoCardless Banking (wartet auf Account)
4. Optional: E2E Test mit neuer MagicPlan-Mail

---

## REFERENZEN

- Workflow: `MX_05_Attachment_Processor` (qAiKaCpDUF3yQUvcZA2rd)
- Test-Projekt: BL-2026-007
- Superchat File ID: fi_GZAz0JxPOPVRzIC2VD2Dh
