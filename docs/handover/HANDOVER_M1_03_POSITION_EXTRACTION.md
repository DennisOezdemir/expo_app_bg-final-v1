# HANDOVER: M1_03 Position Extraction Implementation

## ðŸŽ¯ AUFGABE
Baue M1_03 Workflow fÃ¼r automatische Extraktion und Matching von Leistungspositionen aus WBS/GWG Auftrags-PDFs.

## ðŸ“Š KONTEXT

### M1 Intake Pipeline Status
```
âœ… M1_01 Email Trigger       - Filtert PDFs aus Gmail
âœ… M1_02 PDF Parser Vision   - Extrahiert Projekt-Metadaten + WBS Detection
âœ… M1_04a Prepare Drive      - Event Routing Setup
âœ… M1_04b Create Project Tree - Google Drive Ordnerstruktur
âœ… M1_04c Sync Initial Files - PDF Upload zu Drive
âœ… M1_05 Notification        - Telegram Benachrichtigung

âŒ M1_03 Offer Positions     - FEHLT (diese Session)
```

### Was M1_02 liefert
```json
{
  "project_id": "uuid",
  "client_id": "uuid", 
  "contractor_code": "WBS",  // â† WICHTIG fÃ¼r Katalog-Matching
  "project_code": "BL-2026-XXX",
  "pdf_storage_path": "projects/{project_id}/intake/auftrag.pdf"
}
```

**Event:** `PROJECT_CREATED` â†’ Trigger fÃ¼r M1_03

### Was bereits in DB existiert

#### WBS/GWG Kataloge (neu importiert)
```sql
-- 3 Kataloge, 315 Positionen
wbs_gwg_catalogs:
- contractor_code: "WBS"
- catalog_name: "GWG/WBS Malerarbeiten 2025" (128 pos)
- catalog_name: "GWG/WBS Fliesenarbeiten 2025" (92 pos)  
- catalog_name: "GWG/WBS BodenbelÃ¤ge 2025" (95 pos)

wbs_gwg_positions:
- position_code: "1.1.1.", "1.2.3", etc.
- title_de: "WandflÃ¤chen tapezieren..."
- title_tr: "Duvar yÃ¼zeyleri kaplama..." (tÃ¼rkisch)
- unit: "mÂ²", "Stk", "psch", "h"
- base_price_eur: NUMERIC (kann NULL sein)
- category: "Laufende Instandhaltung", etc.

-- Query fÃ¼r Matching:
SELECT id, title_de, title_tr, unit, base_price_eur
FROM wbs_gwg_positions
WHERE position_code = :code
  AND catalog_id IN (
    SELECT id FROM wbs_gwg_catalogs 
    WHERE contractor_code = :contractor
      AND is_active = true
  );
```

#### Offer Struktur
```sql
offers:
- project_id (FK)
- has_missing_prices (BOOLEAN) - Auto-Flag via Trigger

offer_positions:
- offer_id (FK)
- wbs_gwg_position_id (FK) - NEU, kann NULL sein
- position_number (INT) - Reihenfolge
- title (TEXT) - Snapshot aus Katalog oder PDF
- unit (TEXT)
- unit_price (NUMERIC) - Kann NULL sein
- quantity (NUMERIC)
- total_price (GENERATED) - quantity * unit_price
```

**Trigger:** Wenn `unit_price IS NULL` â†’ setzt `offers.has_missing_prices = true`

## ðŸ”§ M1_03 FLOW REQUIREMENTS

### Input Event
```
Event Type: PROJECT_CREATED
Payload: {
  project_id, 
  contractor_code,
  pdf_storage_path
}
```

### Flow Schritte

#### 1. PDF Analyse (Gemini/Claude Vision)
```
- Lade PDF von Supabase Storage
- Extrahiere:
  * Position Codes (z.B. "1.1.2001", "2.3.5")
  * Titel (falls nicht im Katalog)
  * Mengen
  * Einheiten
  * Preise (falls vorhanden)

Prompt Pattern:
"Extrahiere alle Leistungspositionen aus diesem Auftrags-PDF.
Format: position_code|title|quantity|unit|price
Beispiel: 1.1.1.|WandflÃ¤chen tapezieren|45.5|mÂ²|73.69"
```

**Tool:** Claude Vision API (wie M1_02)
- Credential ID: `DSb7Itt2r6kfGiHs`
- Model: `claude-sonnet-4-20250514`

#### 2. Katalog-Matching
```javascript
for (position in extracted_positions) {
  // Query wbs_gwg_positions
  match = await queryKatalog(position.code, contractor_code);
  
  if (match) {
    // Use Katalog-Daten
    title = match.title_de;
    unit = match.unit;
    base_price = match.base_price_eur;
    wbs_gwg_position_id = match.id;
  } else {
    // Fallback: Use PDF-Daten
    title = position.title;
    unit = position.unit;
    base_price = position.price || null;
    wbs_gwg_position_id = null;
  }
}
```

#### 3. Offer anlegen
```sql
-- Falls noch kein Offer existiert
INSERT INTO offers (project_id, status)
SELECT :project_id, 'draft'
WHERE NOT EXISTS (
  SELECT 1 FROM offers WHERE project_id = :project_id
)
RETURNING id;
```

#### 4. Positionen einfÃ¼gen
```sql
INSERT INTO offer_positions (
  offer_id,
  wbs_gwg_position_id,
  position_number,
  title,
  unit,
  unit_price,
  quantity
) VALUES (
  :offer_id,
  :wbs_gwg_position_id,  -- NULL wenn nicht gematched
  :position_number,
  :title,
  :unit,
  :unit_price,  -- NULL wenn fehlend
  :quantity
);
```

#### 5. Output Event
```
Event Type: OFFER_POSITIONS_EXTRACTED
Payload: {
  project_id,
  offer_id,
  total_positions,
  matched_positions,
  missing_prices_count
}
```

### Error Handling

**PDF Parse Fail:**
```
â†’ Log error
â†’ has_missing_prices = true
â†’ Notification: "Manuelle Position-Eingabe erforderlich"
```

**Keine Katalog-Matches:**
```
â†’ Insert mit wbs_gwg_position_id = NULL
â†’ title/unit/price aus PDF
â†’ has_missing_prices = true (wenn Preise fehlen)
```

**Partial Success:**
```
â†’ Insert successful positions
â†’ Flag fehlende Preise
â†’ Continue flow
```

## ðŸ› ï¸ IMPLEMENTATION DETAILS

### n8n Flow Template
```
Name: M1_03_Position_Extractor
Trigger: Supabase Webhook (event_type = 'PROJECT_CREATED')

Nodes:
1. Webhook - Listen for PROJECT_CREATED
2. Check if already processed (idempotency)
3. Load PDF from Storage
4. Claude Vision - Extract positions
5. Parse Vision Response (JSON/CSV)
6. Loop: For each position
   7. Query Katalog (Postgres)
   8. Build position data
9. Create/Get Offer
10. Batch Insert Positions (Postgres)
11. Fire Event: OFFER_POSITIONS_EXTRACTED
12. Error Handler
```

### Postgres Queries

**Find Catalog:**
```sql
SELECT id FROM wbs_gwg_catalogs
WHERE contractor_code = $1
  AND is_active = true
ORDER BY valid_from DESC
LIMIT 1;
```

**Match Position:**
```sql
SELECT id, title_de, title_tr, unit, base_price_eur, category
FROM wbs_gwg_positions
WHERE position_code = $1
  AND catalog_id = $2
LIMIT 1;
```

**Get/Create Offer:**
```sql
INSERT INTO offers (project_id, status)
VALUES ($1, 'draft')
ON CONFLICT (project_id) 
DO UPDATE SET updated_at = now()
RETURNING id;
```

### Vision Prompt Template
```
Du bist PDF-Parser fÃ¼r Bau-AuftrÃ¤ge.

AUFGABE:
Extrahiere ALLE Leistungspositionen aus diesem WBS/GWG Auftrags-PDF.

FORMAT (CSV, Trennzeichen: |):
position_code|title|quantity|unit|price

REGELN:
- position_code: Exakt wie im PDF (z.B. "1.1.1.", "1.2.2001")
- title: Kompletter deutscher Titel
- quantity: Nur Zahl (z.B. 45.5)
- unit: mÂ², Stk, psch, h, etc.
- price: EUR Preis OHNE WÃ¤hrung, leer wenn nicht vorhanden

BEISPIEL:
1.1.1.|WandflÃ¤chen und Leibungen tapezieren|45.5|mÂ²|73.69
1.1.2.|Zulage fÃ¼r Malervlies|12|mÂ²|
2.1.1.|Bad komplett erneuern|1|psch|3012.39

Starte Extraktion.
```

## ðŸ“ TESTING

### Mock Event
```json
{
  "event_type": "PROJECT_CREATED",
  "payload": {
    "project_id": "test-uuid",
    "contractor_code": "WBS",
    "pdf_storage_path": "projects/test-uuid/intake/auftrag.pdf"
  }
}
```

### Expected Output
```sql
-- Check offer created
SELECT * FROM offers WHERE project_id = 'test-uuid';

-- Check positions inserted
SELECT 
  op.position_number,
  op.title,
  op.unit,
  op.unit_price,
  op.quantity,
  wp.position_code,
  wp.title_tr
FROM offer_positions op
LEFT JOIN wbs_gwg_positions wp ON wp.id = op.wbs_gwg_position_id
WHERE op.offer_id = (SELECT id FROM offers WHERE project_id = 'test-uuid')
ORDER BY op.position_number;

-- Check missing prices flag
SELECT has_missing_prices FROM offers WHERE project_id = 'test-uuid';
```

### Success Criteria
- âœ… Positions extracted from PDF
- âœ… Katalog matches found (where possible)
- âœ… Offer created with all positions
- âœ… `has_missing_prices` flag correct
- âœ… Event `OFFER_POSITIONS_EXTRACTED` fired

## ðŸ”— RESOURCES

### Project Files
```
/mnt/project/SESSION_2026-01-05_WBS_KATALOG_IMPORT.md - Diese Session
/mnt/project/020_wbs_gwg_catalog_clean.sql - Schema
/mnt/project/021_wbs_gwg_seed.sql - Katalog-Daten
/mnt/project/M1_04a_event_routing.sql - Event System
```

### Credentials
```
Supabase: yetwntwayhmzmhhgdkli.supabase.co
Postgres Node: qXZ2ZjK31ZDrPoDG
Anthropic API: DSb7Itt2r6kfGiHs
```

### Existing Flows
```
M1_02_PDF_Parser_Vision - Referenz fÃ¼r Vision API Usage
MX_00_Event_Router - Event System Pattern
```

## ðŸŽ¯ DELIVERABLES

1. **n8n Flow:** `M1_03_Position_Extractor.json`
2. **Dokumentation:** `M1_03_DOCUMENTATION.md`
3. **Test Results:** End-to-End mit Mock PDF
4. **Event Integration:** Verified mit MX_00

## ðŸš¨ WICHTIG

**Atomic Operation:**
- Flow muss idempotent sein
- Check if positions already extracted
- Use transaction wenn mÃ¶glich

**Error Resilience:**
- Partial failures OK (insert was geht)
- NEVER abort komplett
- has_missing_prices = Safety Net

**Turkish Translations:**
- Nutze `title_tr` fÃ¼r spÃ¤tere M2 Features
- Speichere in offer_positions wenn gematched

---

**Los geht's. Viel Erfolg mit M1_03!**
