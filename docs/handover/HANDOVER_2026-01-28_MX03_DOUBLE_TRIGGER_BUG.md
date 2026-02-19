# HANDOVER: MX_03_V2 Double-Trigger Bug

**Datum:** 2026-01-28  
**Status:** Root Cause gefunden, Fix pending  
**Modul:** MX (Core)

---

## SYMPTOM

1 Email → 3 Projekte erstellt (BL-2026-012, 013, 014)

---

## ROOT CAUSE

MX_03_V2 (`XvPkC3_OJ6tEfws2qsQA7`) verletzt das Event-Only Prinzip:

```
📢 Create Event (INSERT INTO events)
        ↓
🚀 Trigger MX_05 (HTTP Request direkt!) ← VERBOTEN
        ↓
📱 Telegram
```

**Ergebnis:** MX_05 wird aufgerufen durch:
1. Direkter HTTP Call von MX_03_V2 (`🚀 Trigger MX_05`)
2. MX_00 Event Router (wegen Event in DB)
3. Eventuell MX_00 Sweeper (Backup-Mechanismus)

= **2-3x Trigger für 1 Email**

---

## BEWEIS

```sql
-- 3 PROJECT_FILES_READY Events innerhalb 257ms
SELECT id, created_at, payload->>'source_event_id'
FROM events 
WHERE event_type::text = 'PROJECT_FILES_READY'
  AND created_at > '2026-01-28 20:12:00';

-- Ergebnis:
-- 20:12:26.297 | source: 961bbd1b...
-- 20:12:26.546 | source: 961bbd1b... (gleich!)
-- 20:12:26.553 | source: null
```

Alle 3 vom selben Source Event oder ohne Source = Double/Triple-Trigger.

---

## FIX

### In n8n: MX_03_V2 (`XvPkC3_OJ6tEfws2qsQA7`)

1. **Node `🚀 Trigger MX_05` löschen**
2. **Connection ändern:**
   - ALT: `📢 Create Event` → `🚀 Trigger MX_05` → `📱 Telegram`
   - NEU: `📢 Create Event` → `📱 Telegram`

### Warum?

Das Event-System kümmert sich um das Routing:
```
📢 Create Event (DOC_CLASSIFIED_PROJECT_ORDER)
        ↓
    [events Tabelle]
        ↓
MX_00 Event Router (Webhook oder Sweeper)
        ↓
MX_05_Attachment_Processor
```

Direkter HTTP Call ist redundant und verursacht Duplikate.

---

## HARD RULE VERLETZT

> **Event-Only** — Flows kommunizieren NUR über `events` Tabelle

Aus `ARBEITSWEISE.md`:
> **Keine Execute-Workflow-Ketten** — Flows kennen sich nicht

---

## CLEANUP (nach Fix)

```sql
-- Duplikat-Projekte löschen (behalte nur das erste)
DELETE FROM projects 
WHERE project_number IN ('BL-2026-013', 'BL-2026-014');

-- Oder alle 3 löschen wenn Testdaten:
DELETE FROM projects 
WHERE project_number LIKE 'BL-2026-01%'
  AND name LIKE '%Wesselyring%';
```

---

## VERWANDTE BUGS

| Bug | Status | Beschreibung |
|-----|--------|--------------|
| M1_03 68x Events | Dokumentiert | RETURNING erzeugt 68 Items |
| MX_05 ENUM Cast | Gefixt | `::event_type` Cast fehlte |
| **MX_03 Double-Trigger** | **DIESER** | Event + HTTP Call |

---

## TEST NACH FIX

1. Neue Test-Email an info@deine-bauloewen.de
2. Prüfen: Nur 1x PROJECT_FILES_READY Event
3. Prüfen: Nur 1 Projekt erstellt

---

*Erstellt: 2026-01-28 22:00*
