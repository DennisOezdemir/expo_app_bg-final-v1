# HANDOVER: MX_00 Dynamic Multi-Route Dispatch

**Datum:** 2026-01-17
**Status:** ✅ COMPLETE
**Workflow:** MX_00_Event_Router (ID: eNHx0TACVcF6MIdAYIKSl)

---

## ZUSAMMENFASSUNG

MX_00 Event Router von hardcoded Switch-Node auf Dynamic Multi-Route Dispatch umgebaut.

**Vorher:** Switch → 10× dedizierte Call Nodes
**Nachher:** Lookup ALL Routes → Dynamic Dispatcher → Error Logging

---

## ARCHITEKTUR-ÄNDERUNGEN

### Flow-Struktur

```
VORHER:
Webhook/Sweeper → Transform → Lookup (LIMIT 1) → Merge → Has Routing? 
  → Switch Event Type → [10× Call Nodes] → Mark as Processed → Done

NACHHER:
Webhook/Sweeper → Transform → Lookup ALL → Merge → Has Routing? 
  → Dynamic Route Dispatcher ─┬→ Has Errors? → Log Dispatch Error
                               └→ Mark as Processed → Done
```

### Gelöschte Nodes
- Switch Event Type
- 10× Call Nodes (M1_02, M1_03, M1_04a/b/c, M1_05, M4_01, MX_01, MX_02)
- Log Unhandled

### Neue Nodes
- **Dynamic Route Dispatcher** (Code Node)
- **Has Errors?** (Filter Node)
- **Log Dispatch Error** (Postgres Node)

---

## DATENBANK-ÄNDERUNGEN

### Neue Tabelle: dispatch_errors

```sql
CREATE TABLE dispatch_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID,  -- Kein FK (für Test-Events und Edge-Cases)
  event_type TEXT NOT NULL,
  target_workflow TEXT NOT NULL,
  webhook_url TEXT,
  error_message TEXT,
  error_code TEXT,
  http_status INT,
  attempt_count INT DEFAULT 1,
  max_attempts INT DEFAULT 3,
  last_attempt_at TIMESTAMPTZ DEFAULT now(),
  next_retry_at TIMESTAMPTZ DEFAULT (now() + interval '5 minutes'),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_dispatch_errors_unresolved 
  ON dispatch_errors(next_retry_at) 
  WHERE resolved_at IS NULL;

CREATE INDEX idx_dispatch_errors_event_id 
  ON dispatch_errors(event_id);
```

### Migrations Applied
1. `create_dispatch_errors_table` - Tabelle + Indizes
2. `drop_dispatch_errors_fk` - FK entfernt (Test-Events Support)

---

## KEY CODE COMPONENTS

### Lookup Routing (SQL)

```sql
SELECT target_workflow, webhook_url
FROM event_routing
WHERE event_type = '{{ $('Transform Webhook Payload').item.json.event_type }}'
  AND is_active = true;
-- KEIN LIMIT - liefert ALLE aktiven Routes
```

### Merge Routing Info (Code)

```javascript
const event = $('Transform Webhook Payload').first().json;
const routes = $input.all();

return routes.map(route => ({
  json: {
    ...event,
    target_workflow: route.json.target_workflow,
    webhook_url: route.json.webhook_url,
    source: 'webhook'
  }
}));
```

### Dynamic Route Dispatcher (Code)

```javascript
const results = [];

for (const item of items) {
  const { id: event_id, event_type, target_workflow, webhook_url, payload, project_id, _meta } = item.json;
  
  try {
    await this.helpers.httpRequest({
      method: 'POST',
      url: webhook_url,
      body: { id: event_id, event_type, project_id, payload, _meta },
      json: true,
      timeout: 30000
    });
    
    results.push({
      json: { ...item.json, dispatch_status: 'success', _isError: false }
    });
  } catch (error) {
    results.push({
      json: {
        ...item.json,
        dispatch_status: 'error',
        _isError: true,
        _error: {
          event_id,
          event_type,
          target_workflow,
          webhook_url,
          error_message: error.message || 'Unknown error',
          error_code: error.code || 'UNKNOWN',
          http_status: error.response?.status || null
        }
      }
    });
  }
}

return results;
```

### Has Errors? (Filter)
- Condition: `{{ $json._isError }}` equals `true` (Boolean)

### Log Dispatch Error (SQL)

```sql
INSERT INTO dispatch_errors (
  event_id,
  event_type,
  target_workflow,
  webhook_url,
  error_message,
  error_code
) VALUES (
  NULLIF('{{ $json._error.event_id }}', '')::uuid,
  '{{ $json._error.event_type }}',
  '{{ $json._error.target_workflow }}',
  '{{ $json._error.webhook_url }}',
  '{{ $json._error.error_message }}',
  '{{ $json._error.error_code }}'
)
RETURNING id;
```

**Note:** `http_status` entfernt wegen n8n null→string Problem.

---

## MULTI-ROUTE BEISPIEL

Aktive Konfiguration in `event_routing`:

| event_type | target_workflow | webhook_url |
|------------|-----------------|-------------|
| INSPECTION_PROTOCOL_COMPLETED | M2_02_Sync_ZB_Progress | .../webhook/m2-02-sync-zb-progress |
| INSPECTION_PROTOCOL_COMPLETED | M2_03_Generate_Protocol_PDF | .../webhook/m2-03-generate-protocol-pdf |

→ Ein Event triggert BEIDE Workflows parallel.

---

## TESTS DURCHGEFÜHRT

| Test | Event Type | Routes | Ergebnis |
|------|-----------|--------|----------|
| Single Route | PROJECT_CREATED | 1 | ✅ success |
| Multi-Route | INSPECTION_PROTOCOL_COMPLETED | 2 | ✅ Beide aufgerufen |
| Error Logging | INSPECTION_PROTOCOL_COMPLETED | 2 | ✅ 2 Einträge in dispatch_errors |

---

## BEKANNTE ISSUES / FIXES

### 1. n8n null→string Problem
**Problem:** `http_status: null` wird zu String `'null'`, CASE-Statement evaluiert beide Branches.
**Fix:** `http_status` aus INSERT entfernt.

### 2. FK Constraint auf event_id
**Problem:** Test-Events existieren nicht in `events` Tabelle → FK Violation.
**Fix:** FK gedroppt. dispatch_errors ist operationelles Logging.

---

## NÄCHSTE SCHRITTE

1. **MX_03_Dispatch_Doctor** bauen
   - Sweeper alle 15 Min
   - Fetch unresolved errors älter als 5 Min
   - Retry Webhook (max 3×)
   - Bei 3× failed → Telegram Alert

2. Test-Daten cleanen:
   ```sql
   DELETE FROM dispatch_errors WHERE event_type = 'INSPECTION_PROTOCOL_COMPLETED';
   ```

---

## REFERENZEN

- Workflow: https://n8n.srv1045913.hstgr.cloud/workflow/eNHx0TACVcF6MIdAYIKSl
- event_routing Tabelle: Supabase
- dispatch_errors Tabelle: Supabase
