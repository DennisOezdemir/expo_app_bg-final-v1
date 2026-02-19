# HANDOVER 2026-01-28: MX_03_V2 Email Classification Complete

## Status: ✅ MX_03_V2 LIVE | ⚠️ Routing Chain unvollständig

---

## Was wurde gebaut

### MX_03_V2_Superchat_Intake (Workflow ID: XvPkC3_OJ6tEfws2qsQA7)

**Trigger:** Native Superchat Trigger (nicht Webhook)
- Event: Inbound Message
- Filter: Mail Channel (info@deine-bauloewen.de)
- Credential: "Superchat NEW"

**Flow:**
```
Superchat Trigger
    ↓
📋 Extract Metadata (JS: parst Message-Struktur)
    ↓
🚫 Spam? (IF: domain check)
    ├─ TRUE → 📝 Log Spam → END
    ↓ FALSE
🔍 Already Classified? (Postgres: dedupe check)
    ├─ EXISTS → 📝 Log Duplicate → END
    ↓ NEW
🏢 Supplier Lookup (Postgres: supplier info als Hint)
    ↓
❓ Has Attachments? (IF)
    ├─ TRUE → 📎 Get File Info → 📥 Download Binary → 🤖 Claude mit Anhang
    ↓ FALSE → 🤖 Claude ohne Anhang
    ↓
📋 Parse Response (JS: JSON aus Claude)
    ↓
💾 Save Classification (Postgres: classified_emails)
    ↓
❓ Needs Event? (IF: doc_type check)
    ├─ FALSE → 📝 Log No Event → END
    ↓ TRUE
📢 Create Event (Postgres: events table)
    ↓
🚀 Trigger MX_05 (HTTP POST)
    ↓
📬 Telegram Notify
    ↓
📝 Log Success → END
```

---

## Database Changes (Migration 049)

### 1. classified_emails.updated_at
```sql
ALTER TABLE classified_emails ADD COLUMN updated_at timestamptz DEFAULT now();
-- + Trigger für auto-update
```

### 2. flow_logs Tabelle (NEU)
```sql
CREATE TABLE flow_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_name text NOT NULL,
  status text NOT NULL,        -- COMPLETED, SKIPPED, ERROR
  reason text,                 -- spam, duplicate, event_created, no_event_needed
  message_id text,
  from_address text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

---

## Event Routing (Aktueller Stand)

```
MX_03_V2 erzeugt:
├─ DOC_CLASSIFIED_INVOICE_IN    → MX_05 ✅ → M6_01 ❌ (nicht verbunden!)
├─ DOC_CLASSIFIED_PROJECT_ORDER → MX_05 ✅ → M1_01 ❌ (nicht verbunden!)
├─ DOC_CLASSIFIED_CREDIT_NOTE   → MX_05 ✅ → ??? (kein Handler)
├─ DOC_CLASSIFIED_REMINDER      → MX_05 ✅ → ??? (kein Handler)
├─ DOC_CLASSIFIED_MAGICPLAN     → MX_05 ✅ → MX_04 ❌ (nicht verbunden!)
└─ INFO_ONLY, OTHER             → kein Event (nur Log)
```

**Problem:** MX_05 erzeugt `ATTACHMENTS_STORED` aber ruft nachfolgende Flows nicht auf!

---

## Nächste Schritte (Priorität)

### 1. MX_05 erweitern: Routing nach doc_type
Nach `📢 Event ATTACHMENTS_STORED`:
```
IF doc_type === 'INVOICE_IN'
  → HTTP POST /webhook/m6-01-invoice-processor
ELSE IF doc_type === 'PROJECT_ORDER'  
  → HTTP POST /webhook/m1-01-... (existiert das?)
ELSE IF doc_type === 'MAGICPLAN'
  → HTTP POST /webhook/mx-04-... (existiert das?)
```

### 2. Sweeper Flow für Belt & Suspenders
Pollt `events WHERE processed_at IS NULL AND created_at < now() - interval '5 min'`
Triggert entsprechende Webhooks als Backup.

### 3. Alte MX_03 deaktivieren
Erst wenn V2 + Routing stabil läuft.

---

## Wichtige Erkenntnisse

### Superchat Trigger vs Webhook
- Superchat Trigger liefert strukturierte Daten direkt
- Kein "Respond to Webhook" möglich → DB Logging stattdessen
- File Download via Superchat API: GET /v1.0/files/{id} → link.url

### Partial UNIQUE Index
```sql
-- classified_emails hat:
CREATE UNIQUE INDEX idx_classified_superchat_msg 
ON classified_emails (superchat_message_id) 
WHERE superchat_message_id IS NOT NULL;

-- ON CONFLICT braucht daher:
ON CONFLICT (superchat_message_id) WHERE superchat_message_id IS NOT NULL
```

### Event Type ist ENUM
```sql
-- FALSCH:
'{{ $json.doc_type }}'::doc_type  -- doc_type existiert nicht als ENUM

-- RICHTIG:
'DOC_CLASSIFIED_INVOICE_IN'::event_type  -- event_type ist der ENUM
```

---

## Offene Flows (Status Check)

| Flow | Webhook | Wer triggert? | Status |
|------|---------|---------------|--------|
| MX_03_V2 | Superchat Trigger | Superchat direkt | ✅ LIVE |
| MX_05 | /webhook/mx-05-attachment-processor | MX_03_V2 | ✅ LIVE |
| M6_01 | /webhook/m6-01-invoice-processor | ❌ Niemand | ⚠️ LÜCKE |
| M1_01 | ??? | ❌ Niemand | ⚠️ LÜCKE |
| MX_04 | ??? | ❌ Niemand | ⚠️ LÜCKE |

---

## Test-Daten

Letzte erfolgreiche Kette:
```
Message: ms_Y9AB6Kb6gg9I4MwDv3tym
Event 1: DOC_CLASSIFIED_INVOICE_IN (77c2dc84-2a02-4e14-91b8-f15decf98f9c)
Event 2: ATTACHMENTS_STORED (40d24bf8-3dab-4cee-9859-d411b5532f99)
```

---

## Prompt für nächste Session

```
Kontext: MX_03_V2 Email Classification ist LIVE und triggert MX_05.

PROBLEM: MX_05 erzeugt ATTACHMENTS_STORED Events aber ruft keine Folge-Flows auf.

AUFGABE:
1. MX_05 erweitern: Nach Event-Erstellung HTTP Request an:
   - INVOICE_IN → M6_01 (/webhook/m6-01-invoice-processor)
   - PROJECT_ORDER → M1_01 (Webhook prüfen/erstellen)
   - MAGICPLAN → MX_04 (Webhook prüfen/erstellen)

2. Sweeper Flow erstellen für Belt & Suspenders

3. Alte MX_03 Flows deaktivieren nach Validierung

Lies zuerst: docs/handover/HANDOVER_2026-01-28_MX03_V2_COMPLETE.md
```
