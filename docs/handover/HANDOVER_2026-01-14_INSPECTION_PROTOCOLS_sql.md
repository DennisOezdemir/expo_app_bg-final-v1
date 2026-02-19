# HANDOVER: Inspection Protocol System (EB/ZB/AB)

**Datum:** 2026-01-14
**Status:** âœ… DB komplett, Frontend-Integration offen

---

## Erledigt

### 1. Datenbank (Migrationen applied)

**Migration 026 - Core Tables:**
```sql
client_product_defaults     -- Standard-Produkte pro Gesellschaft
inspection_protocols        -- EB/ZB/AB Protokolle
inspection_protocol_items   -- Eine Zeile pro offer_position
inspection_attachments      -- MagicPlan, Fotos, Videos
```

**Migration 027 - Extensions:**
```sql
inspection_attendees        -- Anwesende Personen
inspection_defects          -- MÃ¤ngel-Dokumentation
next_appointment            -- Feld in inspection_protocols
v_inspection_protocols_summary  -- View fÃ¼r Dashboard
v_project_defects           -- View fÃ¼r MÃ¤ngel-Ãœbersicht
```

**Functions:**
- `create_inspection_protocol(project_id, type, inspector)` â†’ auto-erstellt Items
- `get_inspection_protocol_details(protocol_id)` â†’ Join mit Defaults
- `update_protocol_summary()` â†’ Trigger fÃ¼r ZÃ¤hler
- `refresh_protocol_stats(protocol_id)` â†’ Manueller Refresh

**Event-Typen:**
- `INSPECTION_PROTOCOL_CREATED`
- `INSPECTION_PROTOCOL_COMPLETED`
- `INSPECTION_REQUIRES_SUPPLEMENT`

### 2. Test-Daten

| Element | Wert |
|---------|------|
| Protokoll | EB-001 fÃ¼r BL-2026-003 (SAGA) |
| Protocol ID | `2f4af76a-f8f6-41ac-b7ef-2e4b583fd45b` |
| Items | 40 (auto-generiert) |

### 3. Frontend (GitHub Branch)

**Branch:** `feature/inspection-protocols`
**Repo:** Deine-Baulowen/baugenius-mockup

```
src/
â”œâ”€â”€ types/inspection.ts
â”œâ”€â”€ data/inspectionMockData.ts
â””â”€â”€ components/baustelle/
    â”œâ”€â”€ InspectionProtocolDialog.tsx
    â””â”€â”€ InspectionProtocolItem.tsx
```

---

## Offen (Cursor-Tasks)

### Frontend-Integration:

1. **Branch mergen:** `feature/inspection-protocols` â†’ `main`
2. **BaustelleTab.tsx:** Button "Neue Erstbegehung" â†’ Ã¶ffnet Dialog
3. **Supabase-Integration:** Mock-Daten â†’ echte Queries
4. **Fortschritt-Feld:** Nur bei ZB/AB anzeigen (nicht EB)

### Backend (nÃ¤chste Claude-Session):

1. **MagicPlan CSV Parser** (n8n)
   - CSV aus inspection_attachments lesen
   - RÃ¤ume, FlÃ¤chen extrahieren
   - In metadata speichern

2. **Mengen-Rechner** (SQL/n8n)
   - Fliesenschild: 0.6m Ã— WandlÃ¤nge
   - Bad: HÃ¶he Ã— FlÃ¤che (1.40m oder 2.10m)
   - project_materials.quantity updaten

3. **Event-Handler**
   - INSPECTION_COMPLETED â†’ Trigger Rechner

---

## Flow-Ãœbersicht

```
offer_positions
      â†“
M4_01 Material Planner âœ…
      â†“
project_materials
      â†“
EB-Protokoll âœ…
      â†“
EVENT: INSPECTION_COMPLETED
      â†“
M4_02 Mengen-Rechner â† NÃ„CHSTER SCHRITT
      â†“
project_materials.quantity (updated)
      â†“
M4_03 Bestellvorschlag
```

---

## SQL-Files (Download)

Migration-Files separat verfÃ¼gbar:
- `026_inspection_protocols.sql`
- `027_inspection_protocols_extension.sql`
