# HANDOVER: M2_02 + M2_03 workflow_steps Fix

**Datum:** 2026-01-18  
**Status:** ✅ ABGESCHLOSSEN  
**Module:** M2_02 Sync_ZB_Progress, M2_03 Generate_Protocol_PDF

---

## Problem

Beide Workflows blieben auf `IN_PROGRESS` hängen — `complete_workflow_step()` wurde nie aufgerufen.

### Root Causes

1. **Falscher step_key Prefix** — M2_03 verwendete `m2_02:` statt `m2_03:`
2. **`.item` vs `.first()`** — Nach Binary-Nodes (Gotenberg, HTTP Request) ist `$('Node').item` nicht verfügbar
3. **IF Claimed Condition leer** — Node hatte keine konfigurierte Bedingung
4. **Storage 409 Conflict** — Supabase Storage braucht `x-upsert: true` Header für Überschreiben
5. **UUID-Validierung fehlte** — Nicht-UUID event_ids crashten den DO-Block

---

## Fixes

### M2_02 Sync_ZB_Progress

#### Node: "IF Claimed"
```
Condition: {{ $json.claimed }} is true
```

#### Node: "Mark Processed + Complete"
```sql
DO $$
DECLARE
  v_event_id TEXT := '{{ $('Webhook').first().json.body.event_id }}';
  v_protocol_id TEXT := '{{ $('Webhook').first().json.body.payload.protocol_id }}';
  v_step_key TEXT;
BEGIN
  v_step_key := 'm2_02:' || COALESCE(NULLIF(v_event_id, ''), v_protocol_id);
  
  -- Nur updaten wenn event_id gültiges UUID-Format
  IF v_event_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    UPDATE events SET processed_at = now() 
    WHERE id = v_event_id::uuid;
  END IF;
  
  PERFORM complete_workflow_step(v_step_key, '{"status": "success"}'::jsonb);
END $$;
```

---

### M2_03 Generate_Protocol_PDF

#### Node: "Claim Step"
```sql
SELECT * FROM claim_workflow_step(
  'm2_03:{{ $json.body.event_id || $json.body.protocol_id }}',
  '{{ $json.body.project_id }}'::uuid,
  'PDF_GENERATION',
  10
) as result;
```

#### Node: "IF Claimed"
```
Condition: {{ $json.claimed }} is true
```

#### Node: "Build HTML" (am Ende des Codes)
```javascript
// ============ EVENT_ID DURCHREICHEN ============
const eventId = $('Webhook').first().json.body?.event_id || '';

return [{
  json: {
    protocol_id: data.protocol_id,
    protocol_number: data.protocol_number,
    project_number: data.project_number,
    storage_path: storagePath,
    event_id: eventId
  },
  binary: {
    data: binaryData
  }
}];
```

#### Node: "Upload to Storage"
- **Send Headers:** ON
- **Header:** `x-upsert` = `true`

#### Node: "Mark Processed + Complete"
```sql
DO $$
DECLARE
  v_event_id TEXT := '{{ $('Build HTML').item.json.event_id }}';
  v_protocol_id TEXT := '{{ $('Build HTML').item.json.protocol_id }}';
  v_step_key TEXT;
BEGIN
  v_step_key := 'm2_03:' || COALESCE(NULLIF(v_event_id, ''), v_protocol_id);
  
  IF v_event_id IS NOT NULL AND v_event_id != '' THEN
    UPDATE events SET processed_at = now() 
    WHERE id = v_event_id::uuid;
  END IF;
  
  PERFORM complete_workflow_step(v_step_key, '{"status": "success"}'::jsonb);
END $$;
```

---

## Learnings / Patterns

### 1. Binary-Node Item-Referenz Verlust
Nach Nodes die Binary-Daten verarbeiten (HTTP Request, Gotenberg) ist `$('Webhook').item` nicht mehr verfügbar.

**Lösung:** Relevante Daten im letzten Code-Node vor Binary-Verarbeitung durchreichen:
```javascript
return [{
  json: { ...data, event_id: $('Webhook').first().json.body?.event_id },
  binary: { data: binaryData }
}];
```

### 2. `.item` vs `.first()` 
- `.item` — Nur im "Run Once for Each Item" Modus
- `.first()` — Immer verfügbar, holt erstes Item

**Regel:** Im Zweifel `.first()` verwenden.

### 3. Supabase Storage Upsert
```
Header: x-upsert = true
```
Ohne diesen Header gibt 409 Conflict wenn Datei existiert.

### 4. UUID-Validierung in SQL
```sql
IF v_event_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
  -- Safe to cast
END IF;
```

### 5. Step Key Konsistenz
Claim und Complete MÜSSEN denselben step_key verwenden:
- Claim: `m2_03:{{ event_id }}`
- Complete: `m2_03:{{ event_id }}`

---

## Test-Verifizierung

```sql
-- Alle M2 Steps prüfen
SELECT step_key, status, completed_at 
FROM workflow_steps 
WHERE step_key LIKE 'm2_%'
ORDER BY created_at DESC;
```

Erwartetes Ergebnis: `status = 'DONE'`

---

## Offene Punkte

Keine — beide Workflows funktionieren korrekt.

---

## Referenzen

- `011_workflow_steps.sql` — Schema + Helper Functions
- `010_EVENT_SYSTEM_DOCS.md` — Event-System Dokumentation
