# HANDOVER: WBS Catalog & Fuzzy Matching System
**Datum:** 2026-01-10
**Session:** Catalog Completion + Fuzzy Matching Implementation

---

## âœ… ERLEDIGT

### 1. WBS Kataloge komplett
| Katalog | Positionen | TR Ãœbersetzung |
|---------|------------|----------------|
| WBS-MALER-2025 | 128 | âœ… |
| WBS-FLIESEN-2025 | 92 | âœ… |
| WBS-BODEN-2025 | 95 | âœ… |
| WBS-ELEKTRO-2024 | 90 | âœ… |
| WBS-SANITAER-2025 | 141 | âœ… |
| WBS-TISCHLER-2024 | 74 | âœ… |
| **TOTAL** | **620** | **620** |

### 2. Naming vereinheitlicht
- Alle GWG-* Kataloge â†’ WBS-* umbenannt
- Ein Contractor, einheitliche Codes

### 3. Fuzzy Matching System (Migration 023)

**Komponenten:**
- `pg_trgm` Extension fÃ¼r Similarity-Berechnung
- `catalog_aliases` Tabelle fÃ¼r bekannte Varianten
- `match_catalog_position()` Funktion

**Match-Kaskade (PrioritÃ¤t):**
1. **CODE** - Position Code exakt (z.B. "2.1.4" â†’ Match)
2. **EXACT** - Titel normalisiert (ÃŸâ†’ss, -â†’space, lowercase)
3. **ALIAS** - Aus catalog_aliases Tabelle
4. **FUZZY** - Trigram Similarity â‰¥0.4

**Funktion Signatur:**
```sql
match_catalog_position(
  p_title TEXT,
  p_trade TEXT,
  p_contractor_code TEXT,
  p_position_code TEXT DEFAULT NULL,
  p_similarity_threshold NUMERIC DEFAULT 0.4
)
RETURNS TABLE (
  catalog_position_v2_id UUID,
  matched_title TEXT,
  match_type TEXT,        -- CODE/EXACT/ALIAS/FUZZY
  similarity_score NUMERIC
)
```

### 4. M1_03 Flow V3
- Match Catalog Node: Nutzt jetzt `match_catalog_position()` mit 4 Parametern
- Build Position Node: Liest `catalog_position_v2_id` (nicht mehr `position_id`)
- Response zeigt Match-Typen Breakdown

**Match Catalog Query:**
```sql
SELECT * FROM match_catalog_position(
  '{{ $json.title.replace(/'/g, "''") }}'::TEXT,
  '{{ $json.trade }}'::TEXT,
  '{{ $json.contractor_code }}'::TEXT,
  '{{ $json.position_code }}'::TEXT
);
```

### 5. Auto-Learn Trigger
Bei manueller Katalog-Zuordnung im Dashboard wird automatisch ein Alias angelegt:

```sql
CREATE TRIGGER trg_auto_alias
AFTER UPDATE ON offer_positions
FOR EACH ROW
EXECUTE FUNCTION auto_create_alias();
```

**Effekt:** System lernt von manuellen Korrekturen.

### 6. Seed Aliases angelegt
| Alias | â†’ Katalog Position |
|-------|-------------------|
| Waschtisch erneuern | Waschtisch Duravit Nr.1 |
| Waschtischarmatur erneuern | Waschtischarmatur Hansgrohe Focus |

---

## ðŸ“Š MATCH RATE

**Test-Projekt:** 7c201df4-2bcf-466f-9bdf-ac288d19e4e8

| Metrik | Wert |
|--------|------|
| Total Positionen | 44 |
| Matched | 37 |
| Unmatched | 7 |
| **Match Rate** | **84%** |

**Unmatched (legitim):**
- 2x Allgemein (kein Katalog vorhanden)
- 5x Boden-Codes die im Katalog nicht existieren (2.7, 2.17 etc.)

---

## ðŸ“ DATEIEN

| Datei | Zweck |
|-------|-------|
| `/mnt/project/023_fuzzy_catalog_matching.sql` | Migration (bereits ausgefÃ¼hrt) |
| `M1_03_Position_Extractor_V3.json` | Flow mit Fuzzy Matching |
| `wbs_catalog_import.sql` | Elektro/SanitÃ¤r/Tischler Import |
| `wbs_turkish_translations.sql` | TR Ãœbersetzungen |

---

## ðŸ”§ DB OBJEKTE

### Neue Tabelle
```sql
catalog_aliases (
  id UUID PRIMARY KEY,
  catalog_position_v2_id UUID REFERENCES catalog_positions_v2(id),
  alias_title TEXT UNIQUE,
  created_at TIMESTAMPTZ
)
```

### Neue Funktion
- `match_catalog_position(TEXT, TEXT, TEXT, TEXT, NUMERIC)` 

### Neue Trigger
- `trg_auto_alias` auf `offer_positions`

### Neue Indizes
- `idx_catalog_aliases_trgm` (GIN trigram)
- `idx_catalog_positions_v2_title_trgm` (GIN trigram)

---

## â­ï¸ NÃ„CHSTE SCHRITTE

1. **M5 Freigabe-Center** - Dashboard fÃ¼r manuelle Zuordnung
2. **Weitere Aliases** - Bei Bedarf manuell oder per Auto-Learn
3. **Katalog-Erweiterung** - Falls fehlende Codes nachgepflegt werden

---

## ðŸ§ª TEST COMMANDS

**Reset Test-Projekt:**
```sql
DELETE FROM offer_positions 
WHERE offer_id IN (
  SELECT id FROM offers 
  WHERE project_id = '7c201df4-2bcf-466f-9bdf-ac288d19e4e8'
);
DELETE FROM workflow_steps WHERE step_key LIKE 'position_extract:%';
```

**Trigger M1_03:**
```bash
curl -X POST https://n8n.srv1045913.hstgr.cloud/webhook/m1-03-position-extractor \
  -H "Content-Type: application/json" \
  -d '{
    "body": {
      "event_id": "test-xyz",
      "project_id": "7c201df4-2bcf-466f-9bdf-ac288d19e4e8",
      "payload": {
        "contractor_code": "WBS",
        "pdf_storage_path": "inbox/mk59mm28fkdrc4wv9.pdf"
      }
    }
  }'
```

**Check Match Rate:**
```sql
SELECT 
  COUNT(*) as total,
  COUNT(catalog_position_v2_id) as matched
FROM offer_positions
WHERE offer_id IN (
  SELECT id FROM offers 
  WHERE project_id = '7c201df4-2bcf-466f-9bdf-ac288d19e4e8'
);
```

**Test Fuzzy Match:**
```sql
SELECT * FROM match_catalog_position(
  'Anfahrtpauschale bis 20 km'::TEXT,
  'SanitÃ¤r'::TEXT,
  'WBS'::TEXT,
  '10.4'::TEXT
);
```
