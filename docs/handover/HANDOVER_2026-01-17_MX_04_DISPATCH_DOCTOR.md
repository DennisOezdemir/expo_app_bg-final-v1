# HANDOVER: MX_04_Dispatch_Doctor

**Datum:** 2026-01-17  
**Status:** ✅ Production Ready  
**Workflow ID:** wT9ubypWwaOmZhkYSKpm1

---

## Zweck

Automatisches Retry von fehlgeschlagenen Event-Dispatches aus der `dispatch_errors` Tabelle. Belt & Suspenders Pattern für das Event-System.

---

## Trigger

| Typ | Config |
|-----|--------|
| Schedule | Alle 15 Minuten |
| Webhook | `POST /webhook/mx-04-dispatch-doctor` |

---

## Ablauf

```
Fetch Pending Retries (max 10)
    ↓
Loop Over Items (Split In Batches, size=1)
    ↓
Prepare Payload (Fallback wenn event_payload NULL)
    ↓
HTTP POST → webhook_url
    ↓
┌─ Success? ─────────────────────┐
│ JA → Mark Resolved → Loop      │
│ NEIN → Update Failure          │
│        ↓                       │
│        Max Attempts?           │
│        JA → Telegram Alert     │
│        NEIN → Retry Scheduled  │
└────────────────────────────────┘
```

---

## SQL Queries

### Fetch Pending Retries
```sql
SELECT 
  de.id,
  de.event_id,
  de.event_type,
  de.target_workflow,
  de.webhook_url,
  de.attempt_count,
  de.max_attempts,
  de.error_message as last_error,
  e.payload as event_payload
FROM dispatch_errors de
LEFT JOIN events e ON e.id = de.event_id
WHERE de.resolved_at IS NULL
  AND de.next_retry_at < NOW()
  AND de.attempt_count < de.max_attempts
ORDER BY de.next_retry_at ASC
LIMIT 10;
```

### Mark Resolved
```sql
UPDATE dispatch_errors
SET 
  resolved_at = NOW(),
  resolved_by = 'MX_04_Dispatch_Doctor',
  last_attempt_at = NOW(),
  attempt_count = attempt_count + 1
WHERE id = '{{ $json.id }}'::uuid
RETURNING id, event_type, target_workflow, 'resolved' as status;
```

### Update Failure
```sql
UPDATE dispatch_errors
SET 
  attempt_count = attempt_count + 1,
  last_attempt_at = NOW(),
  next_retry_at = NOW() + ((attempt_count + 1) * INTERVAL '5 minutes'),
  error_message = $1,
  http_status = $2
WHERE id = $3::uuid
RETURNING id, event_type, target_workflow, attempt_count, max_attempts, next_retry_at;
```

---

## Exponential Backoff

| Attempt | next_retry_at |
|---------|---------------|
| 1 → 2 | +10 min |
| 2 → 3 | +15 min |
| 3 (max) | Dead Letter |

Formel: `NOW() + ((attempt_count + 1) * 5 minutes)`

---

## Dead Letter Alert

Bei `attempt_count >= max_attempts` → Telegram an `6088921678`:

```
🚨 DISPATCH DEAD LETTER

Event: INSPECTION_PROTOCOL_COMPLETED
Target: M2_02_Sync_ZB_Progress
Attempts: 3/3
Next Retry: EXHAUSTED

⚠️ Manual intervention required!
```

---

## Node-Struktur

| Node | Typ | Funktion |
|------|-----|----------|
| ⏰ Every 15 Min | Schedule Trigger | Regelmäßiger Check |
| 🔧 Manual Trigger | Webhook | Manueller Trigger |
| 🔀 Merge Triggers | Merge (Append) | Kombiniert beide Trigger |
| 📋 Fetch Pending Retries | Postgres | Holt offene Errors |
| ❓ Has Items? | If | Prüft ob Errors vorhanden |
| ✅ Queue Empty | Code | Leere Queue Meldung |
| Loop Over Items | Split In Batches | 1 Item pro Iteration |
| 🔧 Prepare Payload | Code | Baut Fallback-Payload |
| 📤 HTTP Retry | HTTP Request | POST an webhook_url |
| 🔍 Check Result | Code | Error Detection |
| ❓ Success? | If | Erfolg prüfen |
| ✅ Mark Resolved | Postgres | Error als resolved markieren |
| ❌ Update Failure | Postgres | Attempt erhöhen, next_retry setzen |
| ❓ Max Attempts? | If | Dead Letter Check |
| 📱 Telegram Alert | Telegram | Dead Letter Notification |
| 🔄 Retry Scheduled | Code | Stille Fortsetzung |
| ✅ Success | Code | Erfolg-Log |

---

## Fallback Payload

Wenn `event_payload` NULL ist (z.B. Event wurde gelöscht):

```javascript
{
  event_type: "INSPECTION_PROTOCOL_COMPLETED",
  dispatch_error_id: "uuid-here",
  is_retry: true,
  retry_attempt: 2
}
```

Target-Workflow muss damit umgehen können.

---

## Idempotenz

- Query filtert `next_retry_at < NOW()` → verhindert Doppelverarbeitung
- Sofortiges Update von `last_attempt_at` → Race Condition Schutz
- `LIMIT 10` → Verhindert Überlast

---

## Testing

```sql
-- Test-Errors erstellen
INSERT INTO dispatch_errors (
  event_id, event_type, target_workflow, webhook_url,
  error_message, attempt_count, max_attempts, next_retry_at
) VALUES (
  'f6a7b8c9-d0e1-2345-f012-678901234567',
  'TEST_EVENT',
  'Test_Workflow',
  'https://n8n.srv1045913.hstgr.cloud/webhook/test',
  'Test error',
  1,
  3,
  NOW() - INTERVAL '1 minute'
);

-- Manuell triggern
POST https://n8n.srv1045913.hstgr.cloud/webhook/mx-04-dispatch-doctor

-- Cleanup
UPDATE dispatch_errors SET resolved_at = NOW(), resolved_by = 'manual_cleanup'
WHERE resolved_at IS NULL;
```

---

## Bekannte Einschränkungen

1. **Kein Original-Payload bei gelöschten Events** → Fallback-Payload
2. **Max 10 Errors pro Run** → Bei Backlog mehrere Runs nötig
3. **Ziel-Workflow muss aktiv sein** → Sonst 404

---

## Abhängigkeiten

- `dispatch_errors` Tabelle
- `events` Tabelle (optional, für Payload)
- Telegram Bot Credentials
- Postgres Credentials

---

## Änderungshistorie

| Datum | Änderung |
|-------|----------|
| 2026-01-17 | Initial Implementation |
