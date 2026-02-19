# BAUGENIUS PATTERNS

> **Copy-Paste Referenz fÃ¼r n8n Flows. Nicht erfinden â€” kopieren.**

---

## ðŸ”Œ NODE PATTERNS

### HTTP Request â†’ Webhook Call (Standard)

```
Method: POST
URL: {{ $json.webhook_url }}
Authentication: None
Send Body: true
Body Content Type: JSON
Body: {{ JSON.stringify({ body: $json }) }}
```

**Beispiel-Node:** MX_00 â†’ "Call M1_04a"

---

### Supabase Postgres Query

```
Credentials: "Supabase BG"
Operation: Execute Query
Query: (Expressions mit {{ }} funktionieren automatisch)
```

**Wichtig:** 
- UUID casten: `'{{ $json.id }}'::uuid`
- JSON escapen: `'{{ JSON.stringify(obj).replace(/'/g, "''") }}'::jsonb`

---

### Supabase Storage Download

```
Method: GET
URL: https://krtxhxajrphymrzuinna.supabase.co/storage/v1/object/project-files/{{ $json.path }}
Authentication: Header Auth
  Name: Authorization
  Value: Bearer [Supabase Service Key aus Credentials]
Response: File
```

**Beispiel-Node:** M1_03 â†’ "Load PDF from Storage"

---

### Claude Vision API Call

```
Method: POST
URL: https://api.anthropic.com/v1/messages
Authentication: Header Auth
  Name: x-api-key
  Value: [Anthropic API Key]
Headers:
  anthropic-version: 2023-06-01
  content-type: application/json
Body (JSON):
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 8000,
  "messages": [{
    "role": "user",
    "content": [
      {
        "type": "image",
        "source": {
          "type": "base64",
          "media_type": "application/pdf",
          "data": "{{ $binary.data.toString('base64') }}"
        }
      },
      {
        "type": "text",
        "text": "PROMPT HERE"
      }
    ]
  }]
}
```

**Beispiel-Node:** M1_02 â†’ "Claude Vision Parse", M1_03 â†’ "Claude Extract Positions"

---

### Telegram Notification

```
Method: POST
URL: https://api.telegram.org/bot[BOT_TOKEN]/sendMessage
Body (JSON):
{
  "chat_id": "6088921678",
  "text": "{{ $json.message }}",
  "parse_mode": "HTML"
}
```

**Beispiel-Node:** M1_05 â†’ "Send Telegram"

---

## ðŸ“Š DATENSTRUKTUREN

### Nach MX00 Event Router Call

```javascript
$json.body.event_id        // UUID des Events
$json.body.project_id      // UUID des Projekts
$json.body.event_type      // z.B. "PDF_PARSED"
$json.body.payload         // Event-spezifische Daten
$json.body.payload.contractor_code
$json.body.payload.pdf_storage_path
```

### Nach direktem Webhook Trigger

```javascript
$json.body                 // Gesamter Request Body
$json.headers              // HTTP Headers
$json.query                // Query Parameters
```

### Nach Postgres Query

```javascript
$json[0].column_name       // Erste Zeile, Spalte
$json                      // Array aller Zeilen
```

---

## ðŸ”— STANDARD URLS

### Webhook Endpoints

| Flow | URL |
|------|-----|
| M1_02 PDF Parser | `https://n8n.srv1045913.hstgr.cloud/webhook/m1-02-pdf-parser` |
| M1_03 Position Extractor | `https://n8n.srv1045913.hstgr.cloud/webhook/m1-03-position-extractor` |
| M1_04a Prepare Drive | `https://n8n.srv1045913.hstgr.cloud/webhook/m1-04a-prepare-drive` |
| M1_04b Create Tree | `https://n8n.srv1045913.hstgr.cloud/webhook/m1-04b-create-project-tree` |
| M1_04c Sync Files | `https://n8n.srv1045913.hstgr.cloud/webhook/m1-04c-sync-initial-files` |
| M1_05 Notification | `https://n8n.srv1045913.hstgr.cloud/webhook/m1-05-notification` |
| MX_00 Sweeper | `https://n8n.srv1045913.hstgr.cloud/webhook/mx00-sweep` |

### API Endpoints

```
Supabase API:     https://krtxhxajrphymrzuinna.supabase.co
Supabase Storage: https://krtxhxajrphymrzuinna.supabase.co/storage/v1/object/project-files/
Anthropic:        https://api.anthropic.com/v1/messages
Telegram:         https://api.telegram.org/bot{token}/sendMessage
```

---

## ðŸ“ SQL PATTERNS

### Event feuern

```sql
INSERT INTO events (event_type, project_id, payload, source_system, source_flow)
VALUES (
  'EVENT_NAME',
  '{{ $json.project_id }}'::uuid,
  '{{ JSON.stringify({ key: value }).replace(/'/g, "''") }}'::jsonb,
  'n8n',
  'FLOW_NAME'
)
RETURNING id, event_type::text, project_id;
```

### Workflow Step claimen (Idempotenz)

```sql
SELECT * FROM claim_workflow_step(
  'prefix:{{ $json.body.event_id }}',
  '{{ $json.body.project_id }}'::uuid,
  'STEP_TYPE',
  5  -- Timeout in Minuten
) as result;
```

Step Types: `PDF_PARSE`, `POSITION_EXTRACTION`, `DRIVE_SETUP`, `FILE_SYNC`, `NOTIFICATION`

### Workflow Step abschlieÃŸen

```sql
SELECT complete_workflow_step(
  'prefix:{{ $json.event_id }}',
  '{{ JSON.stringify({ result: "ok" }).replace(/'/g, "''") }}'::jsonb
);
```

### Event als processed markieren

```sql
UPDATE events SET processed_at = now() 
WHERE id = '{{ $json.event_id }}'::uuid;
```

### Katalog-Position matchen (Unified)

```sql
SELECT 
  cp.id as position_id,
  cp.position_code,
  cp.title,
  cp.unit,
  cp.base_price_eur,
  c.contractor_code,
  c.catalog_name as trade
FROM catalog_positions_v2 cp
JOIN catalogs_v2 c ON cp.catalog_id = c.id
WHERE cp.position_code = '{{ $json.position_code }}'
  AND c.contractor_code = '{{ $json.contractor_code }}'
  AND c.is_active = true
LIMIT 1;
```

---

## ðŸŽ¯ EVENT TYPES

| Event | Gefeuert von | Konsumiert von |
|-------|--------------|----------------|
| `EMAIL_RECEIVED` | M1_01 | M1_02 |
| `PROJECT_CREATED` | M1_02 | M1_04a |
| `PDF_PARSED` | M1_02 | M1_03 |
| `OFFER_POSITIONS_EXTRACTED` | M1_03 | (Future: M5) |
| `DRIVE_YEAR_READY` | M1_04a | M1_04b |
| `DRIVE_TREE_CREATED` | M1_04b | M1_04c |
| `DRIVE_SETUP_COMPLETE` | M1_04c | M1_05 |
| `PURCHASE_INVOICE_CREATED` | M4_01/M4_02 | (Future: M5) |
| `WORKFLOW_ERROR` | Any | MX_01 Error Handler |

---

## âš ï¸ HÃ„UFIGE FEHLER

| Fehler | LÃ¶sung |
|--------|--------|
| Expression nicht evaluiert | PrÃ¼fen ob `{{ }}` korrekt |
| UUID invalid | `'...'::uuid` casten |
| JSON Syntax Error | Single quotes escapen: `.replace(/'/g, "''")` |
| Webhook 404 | URL in event_routing prÃ¼fen |
| Binary verloren nach SQL | Merge Node mit "Combine by Position" |
| Falscher Mode | Code Node: "Run Once for Each Item" vs "Run Once for All Items" |

---

## ðŸ”„ STANDARD FLOW STRUKTUR

```
Webhook Trigger
    â†“
Claim Step (Idempotenz)
    â†“
If: claimed = true? â†’ weiter / sonst â†’ Stop
    â†“
[Business Logic]
    â†“
Mark Event Processed + Fire Next Event
    â†“
Complete Workflow Step
    â†“
Respond to Webhook (200 OK)
```

---

*Letzte Aktualisierung: 2026-01-08*
