# HANDOVER 2026-01-27 — Event Chain Fix COMPLETE + M4_01 Crash Fix

## STATUS: ✅ COMPLETE

## WAS ERLEDIGT WURDE

### 1. Event Chain Fix (MX_03 → MX_05 → M1_02)

**Problem:** PROJECT_ORDER Emails wurden klassifiziert aber nicht verarbeitet. Events blieben stuck.

**Root Cause:** 
- `event_routing` hatte keinen Eintrag für `DOC_CLASSIFIED_PROJECT_ORDER`
- `file_ids` fehlten im Event-Payload
- `superchat_message_id` wurde nicht an MX_05 weitergereicht

**Fixes angewendet:**

| Workflow | Node | Fix |
|----------|------|-----|
| MX_03 | 📢 Event M1 | ✅ Bereits gefixt (file_ids drin) |
| MX_05 | 📋 Extract Data | ✅ superchat_message_id hinzugefügt |
| MX_05 | 📢 Event ATTACHMENTS_STORED | ✅ `::event_type` Cast hinzugefügt |
| M1_02 | Parse Event Data | ✅ Bereits gefixt |

**Neue Event-Kette funktioniert:**
```
Email → Superchat
    ↓
MX_03_Superchat_Intake (klassifiziert)
    ↓
DOC_CLASSIFIED_PROJECT_ORDER (mit file_ids!)
    ↓
MX_00_Event_Router
    ↓
MX_05_Attachment_Processor
    ↓
PROJECT_FILES_READY
    ↓
M1_02_PDF_Parser_Vision
    ↓
PROJECT_CREATED + PDF_PARSED
    ↓
[Drive Setup + Notification]
```

### 2. M4_01_Material_Planner Crash Fix

**Problem:** 62 WORKFLOW_ERRORs beim Generieren von Materials.

**Error:**
```
there is no unique or exclusion constraint matching the ON CONFLICT specification
```

**Root Cause:**
- Function `generate_project_materials()` nutzt `ON CONFLICT (offer_position_id, material_type)`
- Aber UNIQUE constraint existierte nur für `(offer_position_id, product_id)`

**Fix (Migration 048):**
```sql
-- Duplikate bereinigt
DELETE FROM project_materials pm1
WHERE EXISTS (
  SELECT 1 FROM project_materials pm2
  WHERE pm2.offer_position_id = pm1.offer_position_id
    AND pm2.material_type = pm1.material_type
    AND pm2.created_at > pm1.created_at
);

-- Constraint hinzugefügt
ALTER TABLE project_materials 
ADD CONSTRAINT uq_project_materials_position_material_type 
UNIQUE (offer_position_id, material_type);
```

**Reprocessing durchgeführt:**
- BL-2026-011: 54 Positionen → 30 Materials ✅
- BL-2026-009: 9 Positionen → 0 Materials (keine catalog_position_v2_id)
- BL-2026-008: 7 Positionen → 0 Materials (keine catalog_position_v2_id)
- BL-2026-007: 78 Positionen → 31 Materials ✅

## DB ÄNDERUNGEN

### Migration 048: fix_project_materials_unique_constraint
```sql
ALTER TABLE project_materials 
ADD CONSTRAINT uq_project_materials_position_material_type 
UNIQUE (offer_position_id, material_type);
```

## N8N ÄNDERUNGEN

### MX_05 `📋 Extract Data` Node (NEUER CODE)
```javascript
const payload = $input.first().json.body?.payload || $input.first().json.payload || $input.first().json;

const fileIds = payload.file_ids || [];
const docType = payload.doc_type || 'UNKNOWN';
const messageId = payload.superchat_message_id || 'unknown';
const projectNumber = payload.project_number || null;
const eventId = $input.first().json.body?.event_id || $input.first().json.event_id || null;

if (!fileIds.length) {
  throw new Error('No file_ids in payload');
}

return {
  json: {
    event_id: eventId,
    superchat_message_id: messageId,
    project_number: projectNumber,
    doc_type: docType,
    file_ids: fileIds,
    file_count: fileIds.length
  }
};
```

### MX_05 `📢 Event ATTACHMENTS_STORED` Node
**Wichtig:** `::event_type` Cast am CASE Statement:
```sql
(CASE 
  WHEN '{{ $json.doc_type }}' = 'PROJECT_ORDER' THEN 'PROJECT_FILES_READY'
  ELSE 'ATTACHMENTS_STORED'
END)::event_type,
```

## BEKANNTE EINSCHRÄNKUNGEN

### Email-Klassifikation bei vagen Emails
Emails wie "Auftrag" mit Body "Hallo, anbei ein Auftrag" werden als OTHER klassifiziert weil Claude die Attachment-Namen nicht sieht.

**Geplanter Fix (nicht implementiert):**
- `✂️ Extract Metadata`: `attachment_names: content.files?.map(f => f.name || f.id) || []`
- `🤖 Claude Classify` Prompt: `Anhänge: {{ attachment_names.join(', ') }}`

### Event Router markiert Events als processed vor Workflow-Erfolg
Events werden als `processed_at = now()` markiert sobald der Webhook aufgerufen wird, nicht wenn der Workflow erfolgreich endet. Bei Crashes bleiben Events als "processed" obwohl sie failed sind.

**Workaround:** Bei Crashes manuell `generate_all_project_materials()` ausführen.

## TEST-ERGEBNIS

Neues Projekt erfolgreich erstellt:
- **BL-2026-011** — SAGA - Norbert-Schmid-Platz 4 - Hamburg
- 54 Positionen extrahiert
- 30 Materials generiert
- Drive-Struktur angelegt
- Telegram-Notification gesendet

---

**Erstellt:** 2026-01-27 21:00
**Status:** COMPLETE
**Nächste Priorität:** MX_03 Attachment-Namen an Claude senden
