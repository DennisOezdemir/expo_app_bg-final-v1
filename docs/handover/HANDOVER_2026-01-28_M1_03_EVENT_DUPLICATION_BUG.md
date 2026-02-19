# HANDOVER: M1_03 Event Duplication Bug

**Datum:** 2026-01-28  
**Status:** ROOT CAUSE IDENTIFIZIERT  
**Priorität:** KRITISCH  

---

## Problem

`OFFER_POSITIONS_EXTRACTED` Events werden 68x statt 1x pro Projekt erstellt.

### Symptome

| Projekt | Event Count | Soll |
|---------|-------------|------|
| BL-2026-012 | 68 | 1 |
| BL-2026-013 | 68 | 1 |
| BL-2026-014 | 68 | 1 |

**Gesamt:** 204 Events statt 3.

---

## Root Cause

**Flow:** `M1_03_Position_Extractor_V3` (ID: `eVbTku3Jsyf0dFdQ`)

**Problematische Stelle:**

```
Insert Positions (RETURNING id → 68 rows)
    ↓
Get Stats (läuft 68x wegen 68 Input-Items)
    ↓
Fire Event (läuft 68x)
```

### Technische Erklärung

1. Node "Insert Positions" führt Batch-Insert aus:
   ```sql
   INSERT INTO offer_positions (...) VALUES (...)
   ON CONFLICT DO NOTHING
   RETURNING id;
   ```

2. `RETURNING id` gibt **68 Zeilen** zurück (eine pro Position)

3. n8n-Verhalten: Jeder nachfolgende Node wird **einmal pro Input-Item** ausgeführt

4. Resultat: "Fire Event" Node läuft 68x statt 1x

### Beweis

| Offer | Positionen | Events | Match |
|-------|------------|--------|-------|
| 406640df... | 68 | 68 | ✓ |
| 6e94eca7... | 68 | 68 | ✓ |
| 7b5703dd... | 68 | 68 | ✓ |

Event-Count = Position-Count. QED.

---

## Fix

### Option A: Node-Einstellung (Empfohlen)

Node "Get Stats" → Settings → "Execute Once" aktivieren.

Dann läuft alles danach nur 1x.

### Option B: Aggregate Node

Zwischen "Insert Positions" und "Get Stats" einen Aggregate Node einfügen:
- Mode: "Aggregate All Item Data"

### Option C: Idempotency Key (Defense in Depth)

"Fire Event" Query erweitern:

```sql
INSERT INTO events (event_type, project_id, payload, source_system, idempotency_key)
VALUES (
  'OFFER_POSITIONS_EXTRACTED',
  '...'::uuid,
  '...'::jsonb,
  'n8n',
  'offer_positions_extracted:' || '{{ offer_id }}'
)
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING id;
```

---

## Cleanup

Nach Fix, Duplikate entfernen:

```sql
-- Behalte nur das erste Event pro project_id + created_at
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY project_id, created_at 
           ORDER BY id
         ) as rn
  FROM events
  WHERE event_type::text = 'OFFER_POSITIONS_EXTRACTED'
)
DELETE FROM events
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
```

---

## Betroffene Flows

| Flow | Problem | Fix nötig |
|------|---------|-----------|
| M1_03_Position_Extractor_V3 | Fire Event 68x | ✅ JA |
| M4_01_Material_Planner | Empfängt 68 Events | Nein (Idempotenz vorhanden) |

---

## Lessons Learned

1. **RETURNING in Batch-Inserts:** Gibt N Rows zurück → N Executions downstream
2. **n8n Default:** Jeder Node läuft pro Input-Item
3. **Idempotency Keys:** Immer setzen, auch wenn Flow "nur 1x" laufen sollte

---

*Erstellt: 2026-01-28 21:45*
