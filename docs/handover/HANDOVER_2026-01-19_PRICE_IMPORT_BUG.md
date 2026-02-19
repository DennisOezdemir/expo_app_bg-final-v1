# HANDOVER: Price Import Bug Fix

**Datum:** 2026-01-19  
**Modul:** M4 (Material/Products)  
**Status:** ✅ ABGESCHLOSSEN

---

## Problem

Preise in `products` Tabelle waren um Faktor ~100 zu hoch:

| Source         | Produkte | Ø Preis VORHER | Ø Preis NACHHER   |
| -------------- | -------- | -------------- | ----------------- |
| bulk_import    | 487      | **1.137€**     | **24,56€**        |
| invoice_import | 51       | 35€            | 35€ (unverändert) |

---

## Root Cause

Das Generator-Script (`025_sevdesk_product_import_v2.sql`) hat deutsches Zahlenformat inkonsistent verarbeitet:

```
CSV-Input: "99,50" (deutsches Format, Komma = Dezimaltrenner)
Erwartet:  99.50
Ergebnis:  9950.0 (Komma entfernt statt konvertiert)
```

### Warum inkonsistent?

Das Quell-CSV (`Bauloewen_Material_Import_-_Tabellenblatt1.csv`) enthält **beide Formate**:

| Lieferant-Variante    | Format   | Beispiel   |
| --------------------- | -------- | ---------- |
| `Henri Benthack GmbH` | Deutsch  | `"99,50"`  |
| `Benthack`            | Englisch | `99.50`    |
| `MEGA eG`             | Deutsch  | `"115,50"` |
| `MEGA`                | Englisch | `115.50`   |

Gleicher Lieferant, unterschiedliche Schreibweise → unterschiedliches Zahlenformat.

---

## Fix

### 1. Backup erstellt

```sql
CREATE TABLE products_backup_20260119 AS SELECT * FROM products;
-- 558 rows gesichert
```

### 2. Faktor-100-Korrektur

~310 Produkte identifiziert durch CSV-Vergleich und korrigiert:

```sql
UPDATE products
SET last_price_net_eur = last_price_net_eur / 100, updated_at = now()
WHERE source = 'bulk_import' AND sku IN (...);
```

### 3. Sonderfälle manuell gefixt

Einige Produkte hatten andere Faktoren (119x, 150x, 200x) — direkt auf CSV-Wert gesetzt.

---

## Ergebnis

| Metrik    | VORHER | NACHHER |
| --------- | ------ | ------- |
| Ø Preis   | 1.137€ | 24,56€  |
| Max Preis | 9.999€ | 999€    |
| Median    | 435€   | 10€     |

Verbleibende hohe Preise (>200€) sind **korrekt** laut CSV:

- Lüftungstterr: 999€ ✓
- Makita Stemmhammer: 305€ ✓
- DeWALT Akku-Set: 214€ ✓

---

## Prävention

Für künftige Imports robusten Parser verwenden:

```python
def parse_german_price(price_str: str) -> float:
    """
    Parst deutsche und englische Zahlenformate.
    "99,50" → 99.50
    "99.50" → 99.50
    "1.234,56" → 1234.56
    """
    s = price_str.strip().strip('"')

    # Deutsches Format: Komma als Dezimaltrenner
    if ',' in s and '.' not in s:
        return float(s.replace(',', '.'))

    # Deutsches Format mit Tausenderpunkt: 1.234,56
    if ',' in s and '.' in s:
        return float(s.replace('.', '').replace(',', '.'))

    # Englisches Format
    return float(s)
```

---

## Dateien

| Datei                                            | Beschreibung                           |
| ------------------------------------------------ | -------------------------------------- |
| `products_backup_20260119`                       | DB-Backup vor Fix                      |
| `025_sevdesk_product_import_v2.sql`              | Ursprüngliches Import-SQL (fehlerhaft) |
| `Bauloewen_Material_Import_-_Tabellenblatt1.csv` | Quell-CSV (628 Zeilen)                 |

---

## Rollback

Falls nötig:

```sql
-- Restore from backup
UPDATE products p
SET last_price_net_eur = b.last_price_net_eur
FROM products_backup_20260119 b
WHERE p.id = b.id;

-- Oder komplett:
-- TRUNCATE products; INSERT INTO products SELECT * FROM products_backup_20260119;
```

---

## Lessons Learned

1. **Datenquellen-Konsistenz prüfen** — gleicher Lieferant kann unterschiedliche Formate haben
2. **Zahlenformat explizit behandeln** — nie implizit auf ein Format verlassen
3. **Sanity-Checks einbauen** — Ø Preis > 500€ bei Baumaterial = red flag
4. **Backup vor Bulk-Imports** — immer
