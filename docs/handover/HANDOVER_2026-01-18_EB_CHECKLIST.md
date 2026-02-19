# HANDOVER 2026-01-18: Erstbegehung Checklist & Bug Findings

**Datum:** 18.01.2026 (Nacht-Session)  
**Kontext:** Claude.ai + Claude Code  
**Fokus:** Baustellen-Abwicklung Tab funktional machen

---

## Erledigt

### 1. WeatherCard entfernt ✅

**Problem:** Wetter-Widget fraß halbe Seite, Action-Buttons unter dem Fold

**Lösung:** 
- `WeatherCard` Import + Rendering aus `BaustelleTab.tsx` entfernt
- WeatherBadge im Header bleibt (6°C kompakt)

**Datei:** `src/components/baustelle/BaustelleTab.tsx`

---

### 2. Erstbegehung-Tab zeigt offer_positions ✅

**Problem:** Tab war tot, lud aus Mock-Daten

**Lösung:**
- Supabase Query für `offer_positions` implementiert
- Positionen als Checkliste mit Checkboxen angezeigt
- Preis-Berechnung pro Position (Menge × EP = GP)

**Ergebnis:** 98 Positionen für BL-2026-010 werden angezeigt

---

## Gefundene Bugs

### BUG 1: Parser "(3x)" Multiplikation — KRITISCH

**Location:** M1_03 Position Extractor  
**Problem:** PDF-Positionen wie `8.5(3x) - 169,74 €` werden falsch geparst
- Parser interpretiert (3x) als Multiplikator
- 3 × 169,74 = 509,22 € statt 169,74 €

**Impact:** Angebotssummen sind zu hoch  
**Beispiel:** BL-2026-010 zeigt 8.027 € statt ~6.348 € netto

**Fix:** M1_03 Prompt/Logic anpassen - (3x) ist Positions-Suffix, nicht Multiplikator

---

### BUG 2: Räume/Sections fehlen — KRITISCH

**Location:** M1_03 Position Extractor  
**Problem:** Parser extrahiert Räume nicht aus SAGA PDF

```sql
-- Alle 98 Positionen haben section_id = NULL
SELECT section_id, COUNT(*) FROM offer_positions 
WHERE offer_id = '...' GROUP BY section_id;
-- Result: NULL | 98
```

**SAGA PDF Struktur:**
```
Raum 1 - Wohnzimmer
  1.1 Tapeten entfernen...
  1.2 Wände streichen...
  
Raum 2 - Schlafzimmer  
  2.1 Tapeten entfernen...
```

**Soll-Zustand:**
1. Parser erkennt Raum-Header im PDF
2. Erstellt `offer_sections` Eintrag pro Raum
3. Setzt `section_id` auf allen Positionen dieses Raums

**Fix:** M1_03 Claude Prompt erweitern:
```
Extrahiere auch die Raum-Struktur:
- Raum-Name (z.B. "Wohnzimmer", "Bad", "Flur")
- Welche Positionen gehören zu welchem Raum
```

---

### BUG 3: inspection_protocols.protocol_type Inkonsistenz

**Problem:** DB hat `'zwischenbegehung'` (lowercase, ausgeschrieben), Code erwartet `'ZB'`

**Fix:** 
```sql
UPDATE inspection_protocols SET protocol_type = 'ZB' WHERE protocol_type = 'zwischenbegehung';
UPDATE inspection_protocols SET protocol_type = 'EB' WHERE protocol_type = 'erstbegehung';
UPDATE inspection_protocols SET protocol_type = 'AB' WHERE protocol_type = 'abnahme';
```

---

## DB Status

### offer_positions für BL-2026-010

| Feld | Status |
|------|--------|
| Positionen | 98 vorhanden ✅ |
| section_id | NULL (Bug) ❌ |
| Preise | Teilweise falsch (3x Bug) ❌ |

### offer_sections

| Feld | Status |
|------|--------|
| Sections | 0 vorhanden ❌ |

---

## Nächste Schritte (Prio-Reihenfolge)

### Prio 1: M1_03 Parser Bugs fixen

1. **"(3x)" Bug** — Positions-Suffix nicht als Multiplikator interpretieren
2. **Raum-Extraktion** — Sections aus SAGA PDF extrahieren
3. **section_id setzen** — Positionen den Räumen zuordnen

### Prio 2: Frontend weiter

1. **Übersicht-Tab** — Mock-Daten raus, Supabase rein
2. **EB-Tab gruppiert** — Nach Sections/Räumen gruppieren (wenn M1_03 gefixt)
3. **Checkbox-State** — Speichern in `inspection_protocol_items`

### Prio 3: Finance

1. **MARGE-Berechnung** — braucht `sales_invoices` Tabelle
2. **v_project_financials** — View anpassen

---

## Dateien geändert

| Datei | Änderung |
|-------|----------|
| `src/components/baustelle/BaustelleTab.tsx` | WeatherCard entfernt, Supabase Query für offer_positions |

---

## Test-Projekt

- **Projekt:** BL-2026-010 - Schwentnerring 13c
- **UUID:** `56404c9c-3e55-4cd5-9ea4-40ebde77c58c`
- **Positionen:** 98
- **Sections:** 0 (Bug)

---

## Flow nach M1_03 Fix

```
SAGA Email
    ↓
M1_03 Parser (GEFIXT)
    ↓
offer_sections (Räume)
    ↓
offer_positions (mit section_id)
    ↓
Frontend EB-Tab
    ↓
┌─────────────────────────────┐
│ ▼ Wohnzimmer                │
│   ☐ Tapeten entfernen       │
│   ☐ Wände streichen         │
│                             │
│ ▼ Schlafzimmer              │
│   ☐ Tapeten entfernen       │
│   ☐ Boden verlegen          │
└─────────────────────────────┘
```

---

*Dokumentiert am 18. Januar 2026, 22:30 Uhr*
