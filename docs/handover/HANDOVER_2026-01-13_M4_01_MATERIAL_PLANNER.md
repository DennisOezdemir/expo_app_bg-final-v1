# HANDOVER: M4_01 Material Planner

**Datum:** 2026-01-13
**Status:** âœ… Implementiert & getestet
**Modul:** M4 Material

---

## Was wurde gebaut

### 1. Position Material Requirements Seeding

**338 EintrÃ¤ge** fÃ¼r die drei Hauptgewerke:

| Trade | Positionen | Requirements | Material-Typen |
|-------|------------|--------------|----------------|
| Maler | 184 | 130 | Dispersionsfarbe, Sperrgrund, Vliesraufaser, Vlieskleber, Spachtelmasse, Acryl, Tiefgrund, Abdeckfolie, Lackfarbe, Haftgrund, Glasfaservlies |
| Fliesen | 92 | 181 | Bodenfliese, Wandfliese, Fliesenkleber, Fugenmasse, Silikon, Dichtband, Kantenprofil, Ausgleichsmasse |
| Boden | 95 | 27 | Vinyl-Designbelag, Parkett, TrittschalldÃ¤mmung, Sockelleiste, Ausgleichsmasse, Ãœbergangsprofil, Trockenestrich, Spanplatte |

**Besonderheit Maler:** Vliesraufaser + Vlieskleber werden zusammen geseeded (wie gewÃ¼nscht).

### 2. Database Functions

```sql
-- Einzelne Position verarbeiten
generate_project_materials(p_project_id uuid, p_offer_position_id uuid)

-- Alle Positionen eines Projekts
generate_all_project_materials(p_project_id uuid)
```

**Idempotenz:** Unique Constraint auf `(offer_position_id, material_type)`

### 3. n8n Workflow: M4_01_Material_Planner

**Webhook:** `https://n8n.srv1045913.hstgr.cloud/webhook/m4-01-material-planner`

**Flow:**
```
Webhook Trigger
    â†“
Extract Project ID (Code)
    â†“
Generate Materials (SQL: generate_all_project_materials)
    â†“
Get Summary (SQL: GROUP BY material_type)
    â†“
Create MATERIALS_PLANNED Event
    â†“
Check Unassigned (Code)
    â†“
Create MATERIALS_NEED_ASSIGNMENT Event (wenn unassigned > 0)
    â†“
Final Response
```

### 4. Event Routing

| Event Type | Target | Status |
|------------|--------|--------|
| OFFER_POSITIONS_EXTRACTED | M4_01_Material_Planner | âœ… Aktiv |
| MATERIALS_PLANNED | M4_02_Material_Assignment | â¸ï¸ Inaktiv |
| MATERIALS_NEED_ASSIGNMENT | M4_02_Material_Assignment | â¸ï¸ Inaktiv |

### 5. MX_00_Event_Router Erweiterung

- Switch Node: Output `OFFER_POSITIONS_EXTRACTED` hinzugefÃ¼gt
- HTTP Node: `Call M4_01` erstellt
- Verbindung: Switch â†’ Call M4_01 â†’ Mark as Processed

---

## Test-Ergebnis

**Projekt:** BL-2026-003 (40 Positionen, Maler)

```
Input:  40 offer_positions
Output: 160 project_materials
        - 40x Dispersionsfarbe
        - 40x Vliesraufaser
        - 40x Vlieskleber
        - 40x Spachtelmasse

Events: MATERIALS_PLANNED âœ“
        MATERIALS_NEED_ASSIGNMENT âœ“ (160 unassigned)
```

---

## Auto-Learning Mechanismus

Der Trigger `trg_learn_product` auf `project_materials` funktioniert so:

1. User wÃ¤hlt Produkt fÃ¼r Material â†’ `use_count++`
2. Nach 3x gleiches Produkt fÃ¼r material_type â†’ `default_product_id` wird gesetzt
3. NÃ¤chstes Projekt â†’ Auto-Suggestion

**Voraussetzung:** Requirements mÃ¼ssen existieren (jetzt erfÃ¼llt).

---

## Offene Punkte

| Prio | Task | Status |
|------|------|--------|
| 1 | M4_02 Material Assignment UI | Offen |
| 2 | Weitere Gewerke seeden (SanitÃ¤r, Elektro, Tischler) | Offen |
| 3 | IDS Connect Integration (WÃ¼rth, MEGA) | Phase 2/3 |
| 4 | Measurement-Workflow fÃ¼r Mengen-Verifikation | Offen |

---

## Relevante Dateien

- Migration: `m4_01_material_idempotency`
- Migration: `m4_01_event_types`
- Flow: `M4_01_Material_Planner` (n8n)
- Tabellen: `position_material_requirements`, `project_materials`

---

## Curl Test

```bash
curl -X POST https://n8n.srv1045913.hstgr.cloud/webhook/m4-01-material-planner \
  -H "Content-Type: application/json" \
  -d '{"project_id": "YOUR-PROJECT-UUID"}'
```
