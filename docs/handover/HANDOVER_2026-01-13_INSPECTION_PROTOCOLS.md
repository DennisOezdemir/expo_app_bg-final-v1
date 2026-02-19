# HANDOVER: Inspection Protocol System (EB/ZB/AB)

**Datum:** 2026-01-13
**Status:** ✅ DB + Frontend fertig, bereit für Integration

---

## Erledigt

### 1. Datenbank (Migration 026 - applied)

```sql
-- Neue Tabellen:
client_product_defaults     -- Standard-Produkte pro Gesellschaft
inspection_protocols        -- EB/ZB/AB Protokolle
inspection_protocol_items   -- Eine Zeile pro offer_position
inspection_attachments      -- MagicPlan, Fotos, Videos

-- Neue Funktionen:
create_inspection_protocol(project_id, type, inspector)
get_inspection_protocol_details(protocol_id)
update_protocol_summary() -- Trigger

-- Neue Events:
INSPECTION_PROTOCOL_CREATED
INSPECTION_PROTOCOL_COMPLETED
INSPECTION_REQUIRES_SUPPLEMENT
```

### 2. Frontend (GitHub Branch)

**Branch:** `feature/inspection-protocols`
**Repo:** Deine-Baulowen/baugenius-mockup

```
src/
├── types/inspection.ts
├── data/inspectionMockData.ts
└── components/baustelle/
    ├── InspectionProtocolDialog.tsx
    └── InspectionProtocolItem.tsx
```

### 3. M4_02 Scope-Änderung

- **Alt:** UI für Mengen-Bestätigung
- **Neu:** Backend-only (n8n + SQL)
- Mengen-Eingabe passiert jetzt im EB-Protokoll

---

## Nächster Schritt

### Cursor-Aufgaben:

1. Branch mergen: `feature/inspection-protocols` → `main`
2. BaustelleTab.tsx: Button "Neue Erstbegehung" → öffnet InspectionProtocolDialog
3. Supabase-Integration: Mock → echte Queries
4. Fortschritt-Feld nur bei ZB/AB zeigen (nicht bei EB)

### Danach neue Session für M4_02 Backend:

1. **MagicPlan CSV Parser** (n8n)
   - CSV aus inspection_attachments lesen
   - Räume, Flächen extrahieren
   - In metadata speichern

2. **Mengen-Rechner** (SQL/n8n)
   - Fliesenschild: 0.6m × Wandlänge
   - Bad: Höhe × Fläche (1.40m oder 2.10m bei Nassbereich)
   - project_materials.quantity updaten

3. **Event-Handler**
   - INSPECTION_COMPLETED → Trigger Rechner

---

## Test-Daten

- **Protokoll:** EB-001 für BL-2026-003 (SAGA)
- **Protocol ID:** `2f4af76a-f8f6-41ac-b7ef-2e4b583fd45b`
- **Items:** 40 (auto-generiert)

---

## Flow nach dieser Session

```
offer_positions
      ↓
M4_01 Material Planner ✅
      ↓
project_materials
      ↓
EB-Protokoll ✅ ← HEUTE
      ↓
EVENT: INSPECTION_COMPLETED
      ↓
M4_02 Mengen-Rechner ← NÄCHSTER SCHRITT
      ↓
project_materials.quantity (updated)
      ↓
M4_03 Bestellvorschlag
```
