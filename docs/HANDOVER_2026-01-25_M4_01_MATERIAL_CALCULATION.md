# HANDOVER 2026-01-25: M4-01 Materialberechnung

## Status: ✅ IMPLEMENTIERT

Issue #19 closed.

## Was wurde gebaut

### 1. Schema-Erweiterung
```sql
ALTER TABLE offer_sections 
ADD COLUMN room_measurement_id UUID REFERENCES project_room_measurements(id);
```

Damit ist jede Section (= Raum im Angebot) explizit mit den MagicPlan-Messdaten verknüpft.

### 2. Funktion `calculate_project_materials(project_id)`

Berechnet für alle ZB-Phase Positionen:
- ceiling_area × consumption_rate → Deckenfarbe/Tapete
- wall_area × consumption_rate → Wandfarbe
- floor_area × consumption_rate → Bodenbelag/Ausgleichsmasse
- floor_perimeter × consumption_rate → Fußleisten
- quantity × consumption_rate → Stückware (Schalter, Steckdosen)

**Nutzt FK wenn gesetzt, Fallback auf Fuzzy-Match.**

### 3. Funktion `write_calculated_materials(project_id)`

Schreibt Ergebnisse in `position_calc_materials`.

### 4. Integration in `complete_erstbegehung()`

Wird automatisch aufgerufen wenn EB abgeschlossen wird:
1. Positionen → ZB-Phase
2. `write_calculated_materials()` → Materialien berechnen
3. Event `MATERIALS_CALCULATED` feuern

## Test-Ergebnis: Schwentnerring 13c

| Material | Roh | +Verschnitt | Einheit |
|----------|-----|-------------|--------|
| Ausgleichsmasse | 210,74 | 221,27 | kg |
| Raufaser Decke | 46,83 | 51,51 | m² |
| Fußleisten | 48,09 | 52,90 | lfm |
| Binderfarbe Wand | 20,27 | 21,29 | L |
| Binderfarbe Decke | 8,65 | 9,08 | L |
| Steckdose | 11 | 11 | Stück |
| Lichtschalter | 6 | 6 | Stück |
| Thermostatkopf | 4 | 4 | Stück |
| Doppelsteckdose | 3 | 3 | Stück |

**53 Materialzeilen geschrieben.**

## Verknüpfung Section → Raum

Schwentnerring ist bereits verknüpft:

| Section | room_measurement_id | Raum |
|---------|---------------------|------|
| Wohnzimmer 1 | ✓ | Wohnzimmer (17,35 m²) |
| Schlafzimmer 1 | ✓ | Schlafzimmer (13,02 m²) |
| Kinderzimmer 1 | ✓ | Kinderzimmer (10,94 m²) |
| Küche 1 | ✓ | Küche (7,83 m²) |
| Flur 1 | ✓ | Flur (5,52 m²) |
| Bad 1 | ✓ | Bad (2,98 m²) |
| Keller 1 | NULL | — |
| Balkon 1 | NULL | — |

## Nächste Schritte

1. **Frontend**: Materialliste anzeigen im Projekt-Dashboard
2. **Auto-Mapping**: Bei MagicPlan-Import automatisch `room_measurement_id` setzen
3. **Bestellvorschlag**: Materialien → Produkte → Bestellung generieren

## Migrations (chronologisch)

1. `add_room_measurement_id_to_offer_sections`
2. `update_calculate_project_materials_use_fk`
3. `fix_calculate_materials_use_floor_perimeter`
