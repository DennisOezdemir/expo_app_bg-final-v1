# HANDOVER — 25. Januar 2026
## Manual Product Import & FE-Bug Discovery

---

## 📋 SESSION ÜBERSICHT

**Datum:** 25. Januar 2026
**Dauer:** ~4 Sessions
**Fokus:** 
1. Manueller Produkt-Import aus BAUHAUS URLs
2. Preis-Korrekturen (Katalog → echte BAUHAUS-Preise)
3. FE-Bug identifiziert: supplier_id verhindert Suche
4. Supplier-Konsolidierung (BAUHAUS)

---

## TEIL 1: IMPORTIERTE PRODUKTE

### Busch-Jaeger Reflex SI Serie (Elektro)

| Produkt | SKU | Netto € | Brutto € |
|---------|-----|---------|----------|
| Abdeckrahmen 2511-214 1-fach | 2511-214 | 1,42 | 1,69 |
| Abdeckrahmen 2512-214 2-fach | 2512-214 | 2,50 | 2,98 |
| Abdeckrahmen 2513-214 3-fach | 2513-214 | 4,65 | 5,53 |
| Abdeckrahmen 2514-214 4-fach | 2514-214 | 8,30 | 9,88 |
| Antennenabdeckung 2531-214 2-Loch | 2531-214 | 3,10 | 3,69 |
| TAE-Abdeckung 2539-214 | 2539-214 | 3,10 | 3,69 |
| Serienschalterwippe 2505-214 | 2505-214 | 3,94 | 4,69 |
| Universalwippe 2506-214 | 2506-214 | 1,92 | 2,28 |
| Doppelsteckdose 202 EUJ-214 | 202-EUJ-214 | 7,70 | 9,16 |
| Steckdose 20 EUC-214 | 12246628 | 3,38 | 4,02 |
| Wechselschalter-Einsatz 2000/6 US 10A | 2000/6 US | 4,84 | 5,76 |
| Doppelwechselschalter 2000/6/6 US-101 10A | 2000/6/6 US-101 | 13,56 | 16,14 |

### Heimeier (Heizung)

| Produkt | SKU | Netto € | Brutto € |
|---------|-----|---------|----------|
| Adapter für Vaillant M30x1,5 | 9700-27.700 | 14,00 | 16,66 |
| Adapter inkl. Sechskantschlüssel | 9700-27.700-SET | 19,00 | 22,61 |
| Thermostatkopf K weiß 6-28°C | 6000-00.500 | 10,83 | 12,89 |

### Weitere Produkte

| Produkt | SKU | Netto € | Brutto € | Source |
|---------|-----|---------|----------|--------|
| WD-40 Multifunktionsprodukt Smart Straw 400ml | 49425 | 6,43 | 7,65 | Büromarkt AG |
| Portaferm Fenstergriff abschließbar weiß 7mm | 23823657 | 8,36 | 9,95 | BAUHAUS |
| BAUHAUS Fenstergriff weiß 7mm | 24450508 | 4,19 | 4,99 | BAUHAUS |
| WERZALIT Innenfensterbank weiß 200mm (€/m) | 17.002.001 | 37,14 | 44,20 | Erlich |
| Herdanschlussdose Aufputz weiß 5x2,5mm² | 22615347 | 4,61 | 5,49 | BAUHAUS |
| Mirka Abranet Scheiben 150mm P120 | 4934121816105 | 35,60 | 42,36 | Schleiftitan |
| SPAX Universalschraube T-Star plus 3x25mm 100 Stk | 22545329 | 4,16 | 4,95 | BAUHAUS |

---

## TEIL 2: FE-BUG IDENTIFIZIERT

### Problem
Produkte mit gesetzter `supplier_id` werden im Frontend-Autocomplete **nicht gefunden**.

### Beweis
```sql
-- Funktioniert (wird gefunden):
name: "Busch-Jaeger Reflex SI Abdeckrahmen 2511-214"
supplier_id: NULL  ← 

-- Funktioniert NICHT (wird nicht gefunden):
name: "Busch-Jaeger Reflex SI Steckdose 20 EUC-214"
supplier_id: "d41e7a9f-69af-413e-b7eb-25d2b59689a6"  ← 
```

### Workaround
Alle neuen Produkte mit `supplier_id = NULL` importieren.
Supplier-Name in `source` Feld speichern.

### Root Cause (vermutlich)
FE-Query macht vermutlich einen JOIN auf suppliers der zu INNER JOIN wird,
oder filtert explizit auf `supplier_id IS NULL`.

### TODO
- [ ] FE-Code prüfen: Supabase-Query für Produkt-Autocomplete
- [ ] Query fixen: LEFT JOIN oder WHERE-Bedingung anpassen

---

## TEIL 3: SUPPLIER-KONSOLIDIERUNG

### Vorher
```
df4e5930-... | Bauhaus Gesellschaft für Bau- und Hausbedarf mbH & Co.KG | BAUH
d41e7a9f-... | BAUHAUS Bergedorf | BAUHAUS
```

### Nachher
```
d41e7a9f-69af-413e-b7eb-25d2b59689a6 | BAUHAUS | BAUHAUS
```

Alle Produkte migriert, alter Supplier gelöscht.

---

## TEIL 4: PREIS-WORKFLOW

### Erkenntnisse
1. **Katalog-Listenpreise ≠ BAUHAUS-Preise**
   - Busch-Jaeger Katalog: 27,47€ für 2000/6/6 US-101
   - BAUHAUS Website: 16,14€ brutto
   - Differenz: ~40% günstiger bei BAUHAUS

2. **Workflow für zukünftige Imports:**
   ```
   User gibt BAUHAUS brutto Preis
   → System rechnet netto (÷ 1,19)
   → Import mit source = 'BAUHAUS'
   → supplier_id = NULL (wegen FE-Bug)
   ```

---

## TEIL 5: DATENBANK-STATUS

### products Tabelle
- **558+ Produkte** aus sevDesk Bulk-Import
- **~25 Produkte** manuell importiert (diese Session)
- Alle mit `is_active = true`

### Neue Supplier
- **Schleiftitan** (fc8a97c6-3c49-485b-8719-cd7ccc20360b)

---

## 📝 NÄCHSTE SCHRITTE

1. **FE-Bug fixen** — Produkt-Suche mit supplier_id
2. **Weitere Produkte importieren** — nach Bedarf
3. **Preis-Verifikation** — Heimeier-Produkte gegen echte Preise prüfen

---

## 🔧 IMPORT-TEMPLATE

```sql
INSERT INTO products (
  id, name, material_type, trade, category, sku, 
  last_price_net_eur, last_price_date, unit, source, source_reference, is_active
)
VALUES (
  gen_random_uuid(),
  'Produktname mit Specs',
  'material_type',
  'trade',  -- elektro, sanitär, maler, allgemein
  'Category',
  'SKU',
  NETTO_PREIS,  -- brutto / 1,19
  CURRENT_DATE,
  'Stk',  -- oder Pack, m, etc.
  'BAUHAUS',  -- Supplier-Name (nicht ID wegen FE-Bug!)
  'URL',
  true
);
```
