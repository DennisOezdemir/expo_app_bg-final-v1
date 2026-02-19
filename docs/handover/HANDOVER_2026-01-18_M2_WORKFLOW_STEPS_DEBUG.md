# HANDOVER: M2 workflow_steps bleiben IN_PROGRESS

**Datum:** 2026-01-18  
**Status:** Debug erforderlich  
**Priorität:** Mittel (System funktioniert, aber Steps tracken nicht korrekt)

---

## KONTEXT

Multi-Route-Test für `INSPECTION_PROTOCOL_COMPLETED` Event durchgeführt.

**Was funktioniert:**
- MX_00 v2 Dynamic Routing dispatcht zu BEIDEN Flows ✅
- M2_02 Sync_ZB_Progress wird getriggert ✅
- M2_03 Generate_Protocol_PDF wird getriggert ✅
- M2_02 Business Logic läuft (feuert `ZB_PROGRESS_SYNCED` Event) ✅

**Was nicht funktioniert:**
- workflow_steps bleiben auf `IN_PROGRESS` statt `DONE`
- MX_00 bekommt 30s Timeout (Flows antworten nicht rechtzeitig)

---

## TEST-EVIDENZ

### Test-Event
```sql
-- Event ID: 832b4147-e00f-4c88-b622-ae08d9171ede
-- Erstellt: 2026-01-18 12:28:35
-- Processed: 2026-01-18 12:29:42 ✅
```

### workflow_steps Status
```
step_key                                          | status      | completed_at
--------------------------------------------------|-------------|-------------
m2_01:832b4147-e00f-4c88-b622-ae08d9171ede       | IN_PROGRESS | NULL
m2_02:832b4147-e00f-4c88-b622-ae08d9171ede       | IN_PROGRESS | NULL
```

### Dispatch Errors (Timeouts)
```
target_workflow              | error_message              | error_code
-----------------------------|----------------------------|------------
M2_02_Sync_ZB_Progress       | timeout of 30000ms exceeded | ECONNABORTED
M2_03_Generate_Protocol_PDF  | timeout of 30000ms exceeded | ECONNABORTED
```

---

## ZU PRÜFEN

### 1. "Mark Processed + Complete" Node in M2_02
- Ist der Node korrekt verbunden?
- Query prüfen - setzt sie `status = 'DONE'` und `completed_at = now()`?
- Wird der Node überhaupt erreicht?

### 2. "Mark Processed + Complete" Node in M2_03
- Gleiche Checks wie M2_02

### 3. Response Timing
- Webhook `responseMode` prüfen
- Option A: `responseMode: "onReceived"` (sofort antworten, async weiterarbeiten)
- Option B: MX_00 Timeout auf 60s erhöhen

---

## WORKFLOW IDs

| Workflow | ID | Webhook Path |
|----------|-----|--------------|
| MX_00_Event_Router v2 | `eNHx0TACVcF6MIdAYIKSl` | `/webhook/event-router` |
| M2_02Sync_ZB_Progress | `TQoWuDki_q9IDVIJCHcHE` | `/webhook/m2-02-sync-zb-progress` |
| M2_03Generate_Protocol_PDF | `lDrZnW4bYMCpumiTbmkKl` | `/webhook/m2-03-generate-protocol-pdf` |

---

## RELEVANTE QUERIES

### Check workflow_steps Status
```sql
SELECT step_key, step_type, status, created_at, completed_at, error
FROM workflow_steps 
WHERE step_key LIKE 'm2_01:%' OR step_key LIKE 'm2_02:%'
ORDER BY created_at DESC
LIMIT 20;
```

### Check Dispatch Errors
```sql
SELECT event_type, target_workflow, error_message, error_code, created_at
FROM dispatch_errors 
WHERE resolved_at IS NULL
ORDER BY created_at DESC;
```

### Manueller Test-Event
```sql
INSERT INTO events (event_type, project_id, payload, source_system, source_flow)
VALUES (
  'INSPECTION_PROTOCOL_COMPLETED',
  '56404c9c-3e55-4cd5-9ea4-40ebde77c58c',
  '{"protocol_id": "fedb60fd-c6fe-4636-beac-7df0cb2fff2b", "protocol_type": "zwischenbegehung", "protocol_number": "ZB-2026-010-001", "test": true}'::jsonb,
  'manual_test',
  'debug_session'
)
RETURNING id, event_type::text, created_at;
```

---

## ERWARTETES ERGEBNIS NACH FIX

1. workflow_steps werden auf `DONE` gesetzt mit `completed_at` Timestamp
2. MX_00 bekommt keine Timeouts mehr
3. Oder: Timeouts werden toleriert weil Flows async weiterlaufen

---

## ZUSÄTZLICHE NOTIZ

M2_01_Monteur_Auftrag_PDF und M2_10_Sub_Order_Generator haben **KEIN Event-Routing** - sie werden direkt via Webhook aufgerufen (z.B. vom Frontend). Das ist korrekt so.
