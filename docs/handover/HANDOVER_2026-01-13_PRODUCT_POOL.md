# HANDOVER â€” 13. Januar 2026
## Product Pool & Material System Foundation

---

## ðŸ“‹ SESSION ÃœBERSICHT

**Datum:** 13. Januar 2026
**Dauer:** ~4 Stunden
**Fokus:** 
1. Migration 024: Product Pool Schema
2. sevDesk Bulk-Import via Antigravity
3. Produkt-Datenbereinigung & Import

---

## TEIL 1: MIGRATION 024 â€” PRODUCT POOL SCHEMA

### Neue Tabellen

| Tabelle | Zweck |
|---------|-------|
| `products` | Zentraler Produkt-Pool (wÃ¤chst organisch) |
| `position_material_requirements` | Was braucht Position X? |
| `project_materials` | Konkrete Materialliste pro Projekt |
| `measurements` | AufmaÃŸ-Daten (Monteur-Input) |

### products Tabelle

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  material_type TEXT,           -- Generisch: "Armatur", "Fliese"
  trade TEXT,                   -- Gewerk
  supplier_id UUID REFERENCES suppliers(id),
  sku TEXT,                     -- Artikelnummer
  last_price_net_eur NUMERIC(10,2),
  last_price_date DATE,
  unit TEXT DEFAULT 'Stk',
  use_count INTEGER DEFAULT 0,  -- FÃ¼r Auto-Learning
  source TEXT,                  -- invoice_import, bulk_import, manual
  source_reference TEXT,
  UNIQUE(supplier_id, sku)
);
```

### Auto-Learning Trigger

```sql
CREATE FUNCTION learn_product_selection() 
-- Bei Produktauswahl:
-- 1. use_count hochzÃ¤hlen
-- 2. Nach 3x Nutzung â†’ default_product_id setzen
```

### Funktionen

| Funktion | Zweck |
|----------|-------|
| `search_products(query, supplier, limit)` | Autocomplete mit Ranking |
| `generate_project_materials(project_id)` | Materialliste aus Requirements |

### Views

| View | Zweck |
|------|-------|
| `v_product_autocomplete` | Produkte sortiert nach Relevanz |
| `v_project_material_status` | Dashboard: % zugewiesen |
| `v_open_measurements` | Offene AufmaÃŸe fÃ¼r Monteur-Inbox |

---

## TEIL 2: SEVDESK BULK-IMPORT VIA ANTIGRAVITY

### Ausgangslage

- **1873 PDFs** im sevDesk-Export (2023-2025)
- Alles durcheinander (Tanken, Essen, Material, Software)
- Manuelles Sortieren unmÃ¶glich

### Antigravity Setup

**Task:** Alle PDFs klassifizieren, nur Material-Relevante extrahieren

**Filtering Logic:**
- âœ… BaumÃ¤rkte, GroÃŸhandel, Fachhandel
- âŒ Tankstellen, Restaurant, Software, Entsorgung

**Output:** Google Sheet mit extrahierten Artikeln

### Ergebnis nach Nacht-Run

| Metrik | Wert |
|--------|------|
| PDFs verarbeitet | ~600 |
| Zeilen extrahiert | 629 |
| Saubere Produkte | 507 |
| Lieferanten | 21 |

---

## TEIL 3: DATENBEREINIGUNG

### Probleme im Rohdaten

1. **Lieferanten-Duplikate:**
   - `Delmes Heitmann GmbH` + `Delmes Heitmann` + `bauwelt Delmes Heitmann`
   - `MEGA eG` + `MEGA`
   - `WÃ¼rth` + `WÃ¼rth Industrie Service` + `Adolf WÃ¼rth GmbH`

2. **Einheiten-Chaos:**
   - `ST`, `STK`, `St` â†’ alles StÃ¼ck
   - `PAK`, `PCK` â†’ Pack
   - `ROL`, `RL`, `RO` â†’ Rolle

3. **Preis-Overflow:**
   - EAN-Codes als Preise geparst (40020199814.0)
   - Fix: Preise > 10.000â‚¬ â†’ NULL

### Bereinigung durchgefÃ¼hrt

```python
supplier_mapping = {
    'MEGA eG': 'MEGA',
    'Delmes Heitmann GmbH': 'DELMES',
    'bauwelt Delmes Heitmann': 'DELMES',
    # ...
}

unit_mapping = {
    'ST': 'Stk', 'STK': 'Stk', 'St': 'Stk',
    'PAK': 'Pack', 'PCK': 'Pack',
    # ...
}

# Sanity Check
if price > 10000:
    price = NULL
```

### Import-Ergebnis

```sql
SELECT source, COUNT(*) FROM products GROUP BY source;
-- bulk_import:    507
-- invoice_import:  51
-- TOTAL:          558
```

---

## TEIL 4: M4_01b FLOW-ERWEITERUNG

### Ã„nderung

M4_01b_Receipt_Processor erweitert um Product-Upsert:

```
PDF â†’ Claude Vision â†’ Split Positions â†’ Process Item â†’ Upsert Product â†’ Event
```

### Neuer Node: Upsert Product

```sql
INSERT INTO products (name, supplier_id, sku, ...)
ON CONFLICT (supplier_id, sku) 
DO UPDATE SET last_price_net_eur = EXCLUDED...
WHERE newer
```

**Effekt:** Jede neue Rechnung fÃ¼ttert automatisch den Product Pool.

---

## ARCHITEKTUR-ENTSCHEIDUNG

### Closed-Loop Product System

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  EINGANG (passiv)                                   â”‚
â”‚  â”œâ”€ Alte Rechnungen (bulk_import)      â†’ 507       â”‚
â”‚  â”œâ”€ Neue Rechnungen (M4_01b)           â†’ ongoing   â”‚
â”‚  â””â”€ Manuelle Eingabe                   â†’ selten    â”‚
â”‚                                                     â”‚
â”‚  NUTZUNG (aktiv)                                    â”‚
â”‚  â”œâ”€ Autocomplete bei Materialplanung               â”‚
â”‚  â”œâ”€ User wÃ¤hlt Produkt                             â”‚
â”‚  â””â”€ System lernt (use_count, defaults)             â”‚
â”‚                                                     â”‚
â”‚  ERGEBNIS                                           â”‚
â”‚  â””â”€ Nach 3x Nutzung â†’ Auto-Vorschlag               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Kein manueller Katalog nÃ¶tig

- Pool wÃ¤chst organisch aus EinkÃ¤ufen
- Preise immer aktuell (letzte Rechnung)
- Favorites entstehen durch Nutzung

---

## DATEIEN ERSTELLT

| Datei | Inhalt |
|-------|--------|
| `024_product_pool_material_system.sql` | Schema + Triggers + Views |
| `024_PRODUCT_POOL_DOCS.md` | Technische Dokumentation |
| `025_sevdesk_product_import_v2.sql` | Bereinigte Import-Statements |
| `products_clean.csv` | Bereinigte Produktliste |

---

## DATENBANK-STATUS

### Products Table

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”
â”‚ source         â”‚ count â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ bulk_import    â”‚   507 â”‚
â”‚ invoice_import â”‚    51 â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ TOTAL          â”‚   558 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Suppliers (neu angelegt)

```
21 Lieferanten mit supplier_code:
BAUHAUS, MEGA, TOOM, SUDING, DELMES, IMPARAT,
WUERTH, SCHLAU, KERAMUNDO, BENTHACK, LIDL, etc.
```

---

## NÃ„CHSTE SCHRITTE

### PrioritÃ¤t 1: M4_01 Material Planner
- Input: Projekt mit Positionen
- Output: Materialliste mit Produkt-VorschlÃ¤gen
- Autocomplete aus `products` Tabelle

### PrioritÃ¤t 2: position_material_requirements seeden
- Mapping: Katalog-Position â†’ Material-Typ
- Beispiel: "Waschtisch erneuern" â†’ braucht Armatur + Siphon + AnschlÃ¼sse

### PrioritÃ¤t 3: M2_01/02 AufmaÃŸ
- Monteur erfasst echte Mengen vor Ort
- Input fÃ¼r Materialplanung

### PrioritÃ¤t 4: M5 Freigabe UI
- Dashboard mit Autocomplete
- Chef gibt Bestellungen frei

---

## METRIKEN

| Metrik | Wert |
|--------|------|
| Produkte im Pool | 558 |
| Lieferanten | 21 (+11 vs gestern) |
| Produkte mit Preis | 538 (96%) |
| Antigravity PDFs | ~600 verarbeitet |
| Schema-Tabellen neu | 4 |
| Triggers neu | 2 |
| Views neu | 3 |

---

*Dokumentiert am 13. Januar 2026, 18:30 Uhr*
