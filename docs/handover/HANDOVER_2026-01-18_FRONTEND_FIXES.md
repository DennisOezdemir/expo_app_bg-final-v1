# HANDOVER 2026-01-18: Frontend Fixes & Offer Totals

## Session Summary

**Datum:** 18.01.2026 (Abend-Session)  
**Kontext:** Claude.ai + VS Code mit Claude Code Extension  
**Fokus:** Projekte-Liste + Projekt-Detail Bugs fixen

---

## Was wurde gemacht

### 1. Migration 030: Offer Totals Fix

**Problem:** 
- `offers.total_gross` war 0, obwohl `offer_positions` Preise hatten
- `offers.status` war DRAFT → View zeigte nur ACCEPTED
- SUMME-Spalte in Projekte-Liste zeigte "-"

**Lösung:**
```sql
-- Update total_gross auf allen offers aus offer_positions
UPDATE offers SET total_net/total_gross FROM offer_positions SUM

-- Offers mit Positionen auf ACCEPTED setzen
UPDATE offers SET status = 'ACCEPTED' WHERE positions exist

-- Trigger für automatische Summen-Berechnung
CREATE TRIGGER trg_update_offer_totals ON offer_positions
```

**File:** `migrations/030_fix_offer_totals.sql` (in Supabase applied)

---

### 2. Projekte.tsx Fixes

**Bereits von Antigravity erledigt:**
- ✅ `price_catalog` zum SELECT hinzugefügt
- ✅ Neue Spalte "Katalog" zwischen Ort und Kunde
- ✅ SAGA = orange Badge, WBS = blau Badge
- ✅ Quick-Assign Dropdown für Kundenzuweisung

---

### 3. ProjektDetail.tsx Fixes

**Problem 1:** `address` Feld existiert nicht
```typescript
// VORHER (Zeile 72)
.select(`id, project_number, name, address, status, clients...`)

// NACHHER
.select(`id, project_number, name, object_street, object_zip, object_city, status, clients...`)
```

**Problem 2:** Header zeigte UUID statt Projektnummer
```typescript
// VORHER
<h1>{projekt.id}</h1>

// NACHHER  
<h1>{projekt.project_number} - {projekt.name}</h1>
```

**Problem 3:** `detail.gewerke` undefined crash
- Null-checks hinzugefügt für alle Mock-Data Referenzen
- Fallback-Content wenn detail null

---

## Bekannte offene Bugs

### 1. Parser-Bug "(3x)" Multiplikation
**Location:** MX_03 Document Classifier / Position Parser  
**Problem:** PDF-Positionen wie "8.5(3x) - 169,74 €" werden falsch als 3 × 169,74 = 509,22 € importiert  
**Impact:** Angebotssummen sind zu hoch  
**Beispiel:** BL-2026-010 zeigt 8.027 € statt 6.348 € netto

### 2. Übersicht-Tab leer
**Location:** ProjektDetail.tsx → Übersicht Tab  
**Problem:** Mock-Daten (`projektDetails`) haben keine echten UUIDs  
**Impact:** GanttChart, FinanzCards, KostenTabelle, StatusKreise zeigen nichts  
**Lösung:** Echte Daten aus Supabase laden statt Mock

---

## Datenmodell Referenz

```
v_project_financials View:
- Summiert offers.total_gross WHERE status = 'ACCEPTED'
- margin_percent braucht invoiced_net > 0 (Rechnungen)

Trigger trg_update_offer_totals:
- Fired on INSERT/UPDATE/DELETE offer_positions
- Updates offers.total_net und total_gross automatisch
```

---

## Test-Verifizierung

```sql
-- Prüfe ob Summen korrekt
SELECT project_number, order_value 
FROM v_project_financials 
ORDER BY project_number DESC;

-- Erwartete Werte:
-- BL-2026-010: 9.552,69 € (brutto) ← Parser-Bug, sollte 7.177 € sein
-- BL-2026-009: 1.484,61 €
-- BL-2026-008: 782,03 €
-- BL-2026-007: 5.578,80 €
```

---

## Nächste Schritte

1. [ ] Parser-Bug "(3x)" fixen in MX_03
2. [ ] Übersicht-Tab mit echten Supabase-Daten
3. [ ] Projekt-Detail: Mehr Tabs mit Supabase verbinden
4. [ ] MARGE-Berechnung (braucht sales_invoices)

---

*Dokumentiert am 18. Januar 2026, 21:45 Uhr*
