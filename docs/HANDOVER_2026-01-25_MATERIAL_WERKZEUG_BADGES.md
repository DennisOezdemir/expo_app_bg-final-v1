# HANDOVER: Material & Werkzeug Badge System

**Datum:** 2026-01-25  
**Status:** Code gepusht, Lovable Rebuild pending

---

## Was wurde gebaut

### 1. AI Material Suggest (Edge Function)

**URL:** `https://yetwntwayhmzmhhgdkli.supabase.co/functions/v1/ai-material-suggest`

- Claude Haiku analysiert Position-Kontext
- Gibt Vorschläge mit category (material|werkzeug|hilfsmittel) und priority (essential|recommended|optional)
- Kosten: ~0.3 Cent/Call
- Secret: `ANTHROPIC_API_KEY` in Supabase Dashboard gesetzt ✓

### 2. Multi-Material UI

**Datei:** `src/components/baustelle/PositionItemWithMaterial.tsx`

```
[🪄 AI Vorschläge] Button

📦 MATERIALIEN (count)
- Blaue Badges mit Sparkles-Icon wenn product_id existiert
- [X] zum Entfernen
- [+ Material hinzufügen] → Suche mit Autocomplete
- Learning: Auswahl wird in project_materials mit product_id gespeichert

🔧 WERKZEUGE (count)
- Orange Badges
- [X] zum Entfernen  
- [+ Werkzeug hinzufügen] → Freitext, Enter zum Speichern
- Werden pro Projekt nur 1x gezählt (nicht summiert)
```

### 3. Datenbank-Änderungen

**project_materials.category** (neu):
```sql
ALTER TABLE project_materials 
ADD COLUMN category TEXT DEFAULT 'material'
CHECK (category IN ('material', 'werkzeug', 'hilfsmittel'));
```

**Werkzeuge jetzt in project_materials** statt offer_positions.tools_note:
- Einheitliche Struktur für Material und Werkzeug
- Beide persistent als Badges
- Migration der bestehenden tools_note Daten durchgeführt (9 Werkzeuge)

### 4. Aggregations-Logik

**products.is_consumable** Flag:
- TRUE = Verbrauchsmaterial → SUM(quantity) über alle Positionen
- FALSE = Werkzeug → quantity = 1 egal wie oft verwendet

**Funktionen:**
- `aggregate_project_materials(project_id)` - Intelligente Aggregation
- `aggregate_project_tools(project_id)` - Distinct Tools
- `v_project_order_summary` - Bestellliste pro Projekt

---

## Offene Punkte

1. **Lovable Rebuild triggern** → UI deployed
2. **Testen:** AI Suggest → Badge → Refresh → Badge noch da?
3. **Optional:** Häufige Werkzeuge als Produkte anlegen für Learning

---

## Relevante Commits

- `00556449` - feat(M4): Werkzeuge als persistente Badges
- `6ccc40c1` - feat(M4): Multi-Material UI mit AI Suggest

---

## Transcript

Vollständiger Chat: `/mnt/transcripts/2026-01-25-10-38-04-ai-material-suggest-multi-material-ui.txt`
