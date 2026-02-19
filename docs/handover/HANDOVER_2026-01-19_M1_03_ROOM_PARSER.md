# HANDOVER: M1_03 Position Extractor - Raum-Support

## 📅 Session: 19.01.2026
## ✅ STATUS: FERTIG

---

## 🎯 ZIEL
SAGA PDFs haben Raum-Überschriften ("Wohnzimmer 1:", "Bad 1:", etc.) die extrahiert und in `offer_sections` gespeichert werden müssen.

## ✅ WAS GEMACHT WURDE

### 1. DB Migration (FERTIG)
```sql
-- offer_positions erweitert
ALTER TABLE offer_positions ADD COLUMN inspection_status text DEFAULT 'pending';
ALTER TABLE offer_positions ADD COLUMN replaces_position_id uuid REFERENCES offer_positions(id);
ALTER TABLE offer_positions ADD COLUMN material_note text;

-- Unique constraint für Sections (NEU - 19.01.2026)
ALTER TABLE offer_sections 
ADD CONSTRAINT offer_sections_offer_id_title_key UNIQUE (offer_id, title);
```

### 2. Frontend Komponenten (FERTIG, in GitHub)
- `PositionItemWithMaterial.tsx` - Position mit Ja/Nein Buttons + Material-Autocomplete
- `NachtraegeKorrektur.tsx` - Korrektur-Section für abgelehnte Positionen
- `BaustelleTab.tsx` - Updated mit neuen Komponenten

### 3. M1_03 Flow Updates (FERTIG ✅)

#### Node: Claude Vision Extract - PROMPT ✅
```
Du bist PDF-Parser für SAGA Handwerkeraufträge.

AUFGABE:
Extrahiere ALLE Leistungspositionen mit Raum-Zuordnung.

FORMAT (CSV, Trennzeichen: |):
room|position_code|title|quantity|unit|price|payer

REGELN:
- room: Raum-Überschrift EXAKT wie im PDF (z.B. "Wohnzimmer 1", "Bad 1", "Keller 1", "Wohnung allgemein")
- position_code: Katalog-Code VOR der Klammer (z.B. "8.5" nicht "8.5(3x)")
- title: Beschreibung aus Spalte "erforderliche Arbeiten"
- quantity: 
  * Bei "(3x)" im Code → 3
  * Bei "(2x)" im Code → 2
  * Sonst → 1
- unit: Immer "psch" (pauschal) bei SAGA
- price: Betrag aus "Aufw." Spalte OHNE € Zeichen
- payer: "SAGA" oder "Mieter" aus Spalte "Verursacher"

BEISPIELE:
Wohnzimmer 1|1.3|Tapeten von der Decke entfernen, Decke glätten|1|psch|140.28|SAGA
Wohnzimmer 1|8.5|Fenster/Balkontür/Terrassentür gang- und schließbar machen|3|psch|169.74|SAGA
Bad 1|21.1|WC-Becken liefern und montieren|1|psch|133.36|SAGA
Flur 1|36.2|Einbauschrank instand setzen|2|psch|37.72|SAGA

WICHTIG:
- Nur CSV Output, KEINE Markdown-Blöcke (kein ```)
- JEDE Position bekommt den aktuellen Raum
- Bei "(Nx)" die Zahl N als quantity, Code OHNE Klammer
- Zwischensummen IGNORIEREN

Starte Extraktion.
```

#### Node: Match Catalog - QUERY (GEFIXT ✅)
```sql
SELECT * FROM match_catalog_position(
  '{{ $json.title.replace(/'/g, "''") }}'::TEXT,
  NULLIF('{{ $json.trade }}', ''),  -- ← FIX: NULLIF statt leerer String
  '{{ $json.contractor_code }}'::TEXT,
  '{{ $json.position_code }}'::TEXT
);
```

**Problem war:** Leerer `trade` String führte zu `cp.trade = ''` → keine Matches.
**Lösung:** `NULLIF('', '')` → `NULL` → Trade-Filter wird ignoriert.

#### Node: Insert Sections (GEFIXT ✅)
- Node muss **"Insert Sections"** heißen (nicht "Execute a SQL query")
- Build Position referenziert `$('Insert Sections').all()`

#### Node: Success Response (GEFIXT ✅)
```json
{
  "status": "success",
  "project_id": "{{ $('Build Position').first().json.project_id }}",
  "offer_id": "{{ $('Build Position').first().json.offer_id }}",
  "total_positions": {{ $('Get Stats').first().json.total }},
  "matched_positions": {{ $('Get Stats').first().json.matched }}
}
```

**Entfernt:** `match_types` (existierte nicht) + trailing comma

### 4. Flow Connections (FINAL)
```
Claude Vision Extract
        ↓
    Parse CSV (98 items)
        ↓
   Match Catalog (97 items)
        ↓
   Aggregate All
        ↓
  Create/Get Offer
        ↓
  Create Sections
        ↓
  Insert Sections (9 items)
        ↓
  Build Position
        ↓
  Prepare Insert
        ↓
  Insert Positions (98 items)
        ↓
  Get Stats
        ↓
  Fire Event
        ↓
  Success ✅
```

## 🐛 BUGS DIE GEFIXT WURDEN

| Bug | Ursache | Lösung |
|-----|---------|--------|
| Match Catalog: "No output data" | `trade = ''` statt `NULL` | `NULLIF('{{ $json.trade }}', '')` |
| Insert Sections: "no unique constraint" | Constraint fehlte | `ADD CONSTRAINT offer_sections_offer_id_title_key UNIQUE (offer_id, title)` |
| Build Position: "Referenced node doesn't exist" | Node hieß "Execute a SQL query" | Umbenennen zu "Insert Sections" |
| Success: "Invalid JSON" | `match_types` undefined + trailing comma | Zeile entfernt |

## 📊 TEST-ERGEBNIS

```
Project: 56404c9c-3e55-4cd5-9ea4-40ebde77c58c
Sections: 9
Positions: 98
Matched: 97
```

## 📁 DATEIEN

### GitHub
- `src/components/baustelle/PositionItemWithMaterial.tsx`
- `src/components/baustelle/NachtraegeKorrektur.tsx`
- `src/components/baustelle/BaustelleTab.tsx`

### n8n Flow
- Workflow ID: `eVbTku3Jsyf0dFdQ`
- Name: `M1_03_Position_Extractor_V3`
- Status: **ACTIVE** ✅

## 📋 TEST-COMMAND

```bash
curl -X POST https://n8n.srv1045913.hstgr.cloud/webhook/m1-03-position-extractor \
  -H "Content-Type: application/json" \
  -d '{"body":{"event_id":"test-xxx","project_id":"PROJECT_UUID","payload":{"contractor_code":"SAGA","pdf_storage_path":"projects/PROJECT_UUID/intake/auftrag.pdf"}}}'
```

## 🔜 NÄCHSTE SCHRITTE

1. **Frontend:** BaustelleTab muss Räume/Sections anzeigen (Gruppierung nach section_id)
2. **Test:** Mit weiteren SAGA PDFs validieren
3. **Monitoring:** Fehlerrate bei Catalog-Matching beobachten

## 🔗 PROJEKT-KONTEXT

- Repo: https://github.com/Deine-Baulowen/baugenius-mockup
- Supabase: krtxhxajrphymrzuinna
- n8n: https://n8n.srv1045913.hstgr.cloud
