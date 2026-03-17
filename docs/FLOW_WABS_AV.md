# WABS/AV Auftrags-Flow

> Stand: 2026-03-17 — Definiert nach Feldtest-Erkenntnissen

## Grundregel

WABS- und AV-Aufträge sind **bereits beauftragt**. Sie durchlaufen KEINEN Freigabe-Schritt.
Der Katalogtyp (WABS oder AV) muss jederzeit sichtbar sein.

## Flow

```
WABS/AV PDF kommt rein (Email oder manuell)
  ↓
1. PDF wird geparst → Katalog erkannt (WABS vs AV)
2. Projekt wird angelegt:
   - price_catalog = 'WABS' oder 'AV-2024'
   - status = 'INTAKE' (nicht DRAFT)
   - source = 'wabs_import' oder 'av_import'
3. Angebot wird angelegt:
   - status = 'ACCEPTED' (nicht 'DRAFT')
   - internal_notes = Katalogtyp + Kunden-Nr.
4. Positionen werden NACH RÄUMEN als Sections angelegt:
   - Section pro Raum (Wohnzimmer, Schlafzimmer, Küche, Bad, Flur, etc.)
   - Jede Position mit catalog_code aus WABS/AV-Katalog
   - Verursacher (SAGA/Mieter) als internal_note
5. KEIN Freigabe-Schritt → direkt Status 'PLANNED'
6. Erstbegehung-Aufforderung wird im Freigabecenter erstellt
   - Typ: 'ERSTBEGEHUNG_NOETIG'
   - Enthält Projekt-Referenz
7. Nach Erstbegehung:
   - PDF-Protokoll wird automatisch erzeugt
   - Erstbegehung-Aufforderung wird als ERLEDIGT markiert
   - Projekt-Status → 'IN_PROGRESS'
```

## Unterschied zu normalen Projekten

| Aspekt | Normal (Anfrage) | WABS/AV (Auftrag) |
|--------|-------------------|---------------------|
| Eingang | Email-Anfrage | Beauftragtes LV |
| Freigabe nötig? | JA (HITL) | NEIN |
| Angebot-Status | DRAFT → SENT → ACCEPTED | Direkt ACCEPTED |
| Projekt-Status | DRAFT → INTAKE | Direkt INTAKE → PLANNED |
| Struktur | Frei | Nach Räumen (Sections) |
| Katalog sichtbar? | Optional | PFLICHT (WABS/AV Badge) |

## Räume-Mapping (WABS Standard)

Typische Räume in WABS-Aufträgen:
- Wohnzimmer
- Schlafzimmer
- Kinderzimmer
- Küche
- Bad
- Flur
- Abstellraum
- Wohnung allgemein (Positionen die gesamte Wohnung betreffen)

Jeder Raum = 1 Section im Angebot mit eigener Zwischensumme.

## Adress-Deduplizierung (Intake)

Wenn ein neues PDF reinkommt, MUSS der Intake-Flow prüfen ob die Adresse schon existiert:

```
Neues PDF → Adresse extrahiert (Straße + Stadt + Stockwerk)
  ↓
  Ähnliches Projekt gefunden?
  ├─ 100% Match (Straße + Stadt + Stockwerk):
  │    → Automatisch neues LV/Angebot im bestehenden Projekt anlegen
  │    → Kein Freigabe-Schritt nötig
  │
  ├─ UNSICHER (Straße ähnlich, Stockwerk anders/fehlend):
  │    → DUPLICATE_CHECK Approval ins Freigabecenter
  │    → Hinweis: "Mögliches Projekt gefunden: BL-2026-029 Lupinenacker 4"
  │    → User wählt: [Anhängen] oder [Neues Projekt]
  │
  └─ Kein Match:
       → Neues Projekt anlegen (wie bisher)
```

**Approval-Typ:** `DUPLICATE_CHECK` (in approval_type enum)

**request_data Format:**
```json
{
  "new_address": { "street": "Lupinenacker 4", "city": "Hamburg", "floor": "2. OG rechts" },
  "matched_project_id": "037a37a3-...",
  "matched_project_number": "BL-2026-029",
  "match_confidence": 0.85,
  "catalog_type": "WABS",
  "pdf_storage_path": "documents/intake/..."
}
```

## Katalog-Anzeige

Der Katalogtyp MUSS sichtbar sein:
- In der Projektliste (Badge/Tag)
- In der Projektdetail-Ansicht
- Bei der Erstbegehung
- Im Angebots-Tab
