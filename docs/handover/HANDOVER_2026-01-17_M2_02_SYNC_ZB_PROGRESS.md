# HANDOVER: M2_02 Sync ZB Progress

**Datum:** 2026-01-17
**Status:** ✅ COMPLETED
**Workflow:** M2_02Sync_ZB_Progress (TQoWuDki_q9IDVIJCHcHE)

---

## Kontext

M2_02 synchronisiert Fortschrittsdaten aus Zwischenbegehungs-Protokollen (ZB) zurück in die `offer_positions` Tabelle.

**Flow:**
```
INSPECTION_PROTOCOL_COMPLETED Event
  → MX_00 Router
  → M2_02 Webhook (/webhook/m2-02-sync-zb-progress)
  → Claim Step (Idempotenz)
  → Check ZB Type (nur zwischenbegehung)
  → Load Protocol Items
  → Update Offer Positions
  → Calc Stats
  → Telegram Notification
  → Fire ZB_PROGRESS_SYNCED Event
  → Mark Processed
  → Response OK
```

---

## Gelöste Bugs (Session 17.01.2026 Abend)

### 1. Webhook URL Mismatch
**Problem:** `event_routing` hatte falsche URL
```
event_routing: /webhook/m2-02-sync-zb-progress
n8n Webhook:   /webhook/m2-01-sync-zb-progress  ← FALSCH
```
**Lösung:** Webhook Path in n8n auf `m2-02-sync-zb-progress` geändert

### 2. "Unused Respond to Webhook" Error
**Problem:** Webhook auf "Respond: When Last Node Finishes" + separater "Respond to Webhook" Node
```
Error: Unused Respond to Webhook node found in the workflow
```
**Lösung:** Webhook Settings → "Respond: Using 'Respond to Webhook' Node"

### 3. pairedItem Error bei SQL Nodes
**Problem:** Nach Code Node (Calc Stats) verliert n8n pairedItem Metadata
```
$('Webhook').item.json.body.event_id → ERROR
```
**Lösung:** `.first()` statt `.item` verwenden:
```javascript
$('Webhook').first().json.body.event_id
```

### 4. Test mit Fake UUIDs
**Problem:** Test-Event mit `test-m2-02-007` statt echter UUID
```
invalid input syntax for type uuid: "test-m2-02-007"
```
**Lösung:** Echte Test-Daten in DB erstellen (siehe unten)

---

## event_routing Konfiguration

```sql
-- Korrekte Konfiguration
SELECT * FROM event_routing WHERE target_workflow = 'M2_02_Sync_ZB_Progress';

-- event_type: INSPECTION_PROTOCOL_COMPLETED
-- webhook_url: https://n8n.srv1045913.hstgr.cloud/webhook/m2-02-sync-zb-progress
```

---

## Test-Daten (Real)

```sql
-- Projekt: BL-2026-010 (56404c9c-3e55-4cd5-9ea4-40ebde77c58c)
-- Protokoll: ZB-2026-010-001 (fedb60fd-c6fe-4636-beac-7df0cb2fff2b)
-- 5 Protocol Items mit Progress: 50%, 100%, 100%, 75%, 0%
-- Erwarteter Ø: 65%

-- Test Event feuern:
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

## Verifizierung

```sql
-- Check ZB_PROGRESS_SYNCED Event erstellt
SELECT id, event_type, payload, created_at
FROM events 
WHERE event_type = 'ZB_PROGRESS_SYNCED'
ORDER BY created_at DESC
LIMIT 1;

-- Check offer_positions updated
SELECT id, progress_percent, progress_updated_at
FROM offer_positions
WHERE last_inspection_id = 'fedb60fd-c6fe-4636-beac-7df0cb2fff2b';
```

---

## Learnings

### n8n Webhook Response Mode
Wenn "Respond to Webhook" Node existiert:
- Webhook → Settings → Respond: **"Using 'Respond to Webhook' Node"**
- NICHT "When Last Node Finishes" (sonst Error)

### n8n pairedItem nach Code Nodes
Code Nodes brechen die pairedItem-Kette. Für nachfolgende Nodes:
- **Immer `.first()` statt `.item`** in Expressions
- Oder: Daten im Code Node durchreichen

### event_routing Tabelle
- Webhook URLs müssen 1:1 mit n8n Webhook Path matchen
- Typo-Gefahr: m2-01 vs m2-02

---

## Nächste Schritte

1. ~~M2_02 testen~~ ✅ DONE
2. M2_03 Generate Protocol PDF fixen (gleicher Respond to Webhook Bug)
3. Document Templates anlegen für PDF-Generierung
