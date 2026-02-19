# HANDOVER 2026-01-27 — Event Chain Fix MX_03 → M1_02

## STATUS: 🟡 IN PROGRESS — n8n Änderungen pending

## PROBLEM

PROJECT_ORDER Emails werden klassifiziert aber nicht verarbeitet.
5 Events seit 22.01. stuck mit `processed_at = NULL`.

## ROOT CAUSE

```
MX_03 erzeugt DOC_CLASSIFIED_PROJECT_ORDER
        ↓
event_routing hat KEINEN Eintrag dafür
        ↓
MX_00_Event_Router findet keine webhook_url
        ↓
Event bleibt unverarbeitet
```

Zusätzlich: `file_ids` fehlen im PROJECT_ORDER Event (bei INVOICE/MAGICPLAN vorhanden).

## WAS BEREITS ERLEDIGT (DB)

### 1. event_routing Einträge
```sql
-- DOC_CLASSIFIED_PROJECT_ORDER → MX_05
INSERT INTO event_routing (event_type, target_workflow, webhook_url, is_active)
VALUES ('DOC_CLASSIFIED_PROJECT_ORDER', 'MX_05_Attachment_Processor', 
        'https://n8n.srv1045913.hstgr.cloud/webhook/mx-05-attachment-processor', true);

-- PROJECT_FILES_READY → M1_02
INSERT INTO event_routing (event_type, target_workflow, webhook_url, is_active)
VALUES ('PROJECT_FILES_READY', 'M1_02_PDF_Parser_Vision',
        'https://n8n.srv1045913.hstgr.cloud/webhook/m1-02-pdf-parser', true);
```

### 2. Neuer Event Type
```sql
ALTER TYPE event_type ADD VALUE 'PROJECT_FILES_READY';
```

## WAS NOCH FEHLT (n8n)

### 1. MX_03 `📢 Event M1` Node
**Zeile einfügen nach `superchat_conversation_id`:**
```sql
'file_ids', '{{ JSON.stringify($('✂️ Extract Metadata').first().json.file_ids) }}'::jsonb,
```

### 2. MX_05 `📋 Extract Data` Node
**Komplett ersetzen:**
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

### 3. MX_05 `📝 Prepare Upload` Node
**Komplett ersetzen:**
```javascript
const item = $input.first();
const binary = item.binary?.data;

if (!binary) {
  throw new Error('No binary data received');
}

const binaryFileName = binary.fileName || '';
const allSplitItems = $('🔀 Split Files').all();
let splitData = allSplitItems.find(i => 
  binaryFileName.includes(i.json.file_id)
)?.json;

if (!splitData) {
  splitData = allSplitItems[0]?.json || {};
}

const docType = splitData.doc_type || 'UNKNOWN';
const messageId = splitData.superchat_message_id || `unknown_${Date.now()}`;
const projectNumber = splitData.project_number || null;
const fileName = binaryFileName || `file_${Date.now()}`;
const mimeType = binary.mimeType || 'application/octet-stream';

// Storage Path dynamisch nach doc_type
let storagePath;
if (docType === 'PROJECT_ORDER') {
  storagePath = `intake/pending/${messageId}/${fileName}`;
} else if (docType === 'MAGICPLAN' && projectNumber) {
  storagePath = `magicplan/${projectNumber}/${fileName}`;
} else {
  storagePath = `intake/unclassified/${messageId}/${fileName}`;
}

return {
  json: {
    file_id: splitData.file_id,
    superchat_message_id: messageId,
    project_number: projectNumber,
    doc_type: docType,
    event_id: splitData.event_id,
    file_name: fileName,
    mime_type: mimeType,
    storage_path: storagePath
  },
  binary: item.binary
};
```

### 4. MX_05 `📢 Event ATTACHMENTS_STORED` Node
**Komplett ersetzen:**
```sql
INSERT INTO events (event_type, payload, source_system, source_flow)
VALUES (
  CASE 
    WHEN '{{ $json.doc_type }}' = 'PROJECT_ORDER' 
    THEN 'PROJECT_FILES_READY'::event_type
    ELSE 'ATTACHMENTS_STORED'::event_type
  END,
  jsonb_build_object(
    'doc_type', '{{ $json.doc_type }}',
    'superchat_message_id', '{{ $json.superchat_message_id }}',
    'files', '{{ JSON.stringify($json.files) }}'::jsonb,
    'file_count', {{ $json.file_count }},
    'source_event_id', '{{ $json.event_id }}'
  ),
  'n8n',
  'MX_05_Attachment_Processor'
)
RETURNING id::text, event_type::text;
```

### 5. M1_02 `Parse Event Data` Node
**Komplett ersetzen:**
```javascript
const input = $input.first().json;
const body = input.body || input;

const eventId = body.event_id || body.id;
const eventType = body.event_type;
const payload = typeof body.payload === 'string' 
  ? JSON.parse(body.payload) 
  : (body.payload || {});

if (!eventId || !eventType) {
  throw new Error(`Missing required fields: event_id=${eventId}, event_type=${eventType}`);
}

// Multi-File Support
const files = payload.files || [];
const storagePath = payload.storage_path || (files[0]?.storage_path) || null;

if (!storagePath) {
  throw new Error('No storage_path in payload or files array');
}

return {
  json: {
    event_id: eventId,
    event_type: eventType,
    payload: payload,
    storage_path: storagePath,
    all_files: files,
    file_count: files.length || 1,
    email_subject: payload.subject || '',
    email_from: payload.from_address || '',
    superchat_message_id: payload.superchat_message_id || null,
    step_key: `pdf_parse:${eventId}`
  }
};
```

## NEUE EVENT-KETTE (nach Fix)

```
Email → Superchat
    ↓
MX_03_Superchat_Intake
    ↓ (klassifiziert)
INSERT: DOC_CLASSIFIED_PROJECT_ORDER (mit file_ids!)
    ↓
MX_00_Event_Router
    ↓ (findet Routing)
MX_05_Attachment_Processor
    ↓ (lädt PDFs, speichert in Storage)
INSERT: PROJECT_FILES_READY (mit files[] array)
    ↓
MX_00_Event_Router
    ↓
M1_02_PDF_Parser_Vision
    ↓ (parsed erstes PDF, legt Projekt an)
INSERT: PROJECT_CREATED
    ↓
[Rest der Kette: M1_04a → M1_04b → M1_04c → M1_05]
```

## STORAGE PATHS

| doc_type | Storage Path |
|----------|--------------|
| PROJECT_ORDER | `intake/pending/{superchat_message_id}/{filename}` |
| MAGICPLAN | `magicplan/{project_number}/{filename}` |
| Sonstige | `intake/unclassified/{message_id}/{filename}` |

## TEST NACH FIX

1. n8n Änderungen machen (5 Nodes)
2. Neuen Test-Auftrag per Email schicken
3. Prüfen: Event mit file_ids?
4. Prüfen: MX_05 triggered?
5. Prüfen: Storage Path korrekt?
6. Prüfen: PROJECT_FILES_READY Event?
7. Prüfen: M1_02 triggered?
8. Prüfen: Projekt angelegt?

## STUCK EVENTS (nach Fix reprocessen)

```sql
-- 5 alte Events zurücksetzen für Reprocessing
UPDATE events 
SET processed_at = NULL 
WHERE event_type = 'DOC_CLASSIFIED_PROJECT_ORDER'
  AND processed_at IS NULL;

-- Dann MX_00 Sweeper abwarten oder manuell triggern
```

## WORKFLOWS BETROFFEN

| Workflow | ID | Änderung |
|----------|-----|----------|
| MX_03_Superchat_Intake | IdxGMYvUAQEcFyt9WijlN | 1 Zeile SQL |
| MX_05_Attachment_Processor | qAiKaCpDUF3yQUvcZA2rd | 3 Nodes |
| M1_02_PDF_Parser_Vision | 8KDtJKgrTIOV8LTw | 1 Node |

---

**Erstellt:** 2026-01-27 20:30
**Status:** DB fertig, n8n pending
