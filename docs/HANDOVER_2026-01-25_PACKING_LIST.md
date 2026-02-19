# HANDOVER: Packliste System

**Datum:** 2026-01-25  
**Session:** Material-Berechnung + Packliste

---

## Was wurde gebaut

### 1. Tabelle `project_packing_list`

```sql
CREATE TABLE project_packing_list (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  item_type packing_item_type,  -- 'material', 'tool', 'consumable'
  item_name TEXT,
  quantity NUMERIC,
  unit TEXT,
  source TEXT,  -- 'calculated', 'tools_note', 'ai_suggested', 'manual'
  source_position_id UUID,
  ai_suggested BOOLEAN,
  ai_reason TEXT,
  confirmed BOOLEAN,
  packed BOOLEAN,
  packed_at TIMESTAMPTZ,
  packed_by TEXT,
  notes TEXT,
  UNIQUE(project_id, item_type, item_name)
);
```

### 2. Funktionen

| Funktion | Zweck |
|----------|-------|
| `get_project_materials_summary(project_id)` | Aggregierte Materialliste für Frontend |
| `get_project_packing_list(project_id)` | Komplette Packliste für Frontend |
| `generate_packing_list(project_id)` | Befüllt Packliste aus Materialien + tools_note |
| `add_packing_list_suggestions(project_id, suggestions)` | AI fügt Vorschläge hinzu |

### 3. Event-Types

- `PACKING_LIST_REVIEW_REQUESTED` — Wird von `complete_erstbegehung()` gefeuert
- `PACKING_LIST_REVIEWED` — Wird nach AI-Review gefeuert

### 4. Integration in complete_erstbegehung()

Nach EB-Abschluss:
1. `write_calculated_materials()` → Materials berechnen
2. `generate_packing_list()` → Packliste erstellen
3. Event `PACKING_LIST_REVIEW_REQUESTED` feuern

---

## Test-Daten: Schwentnerring

`project_id: 56404c9c-3e55-4cd5-9ea4-40ebde77c58c`

### Packliste (29 Items):

**Materialien (13, calculated):**
- Ausgleichsmasse: 221 kg
- Binderfarbe Wand: 21 L
- Raufaser Decke: 52 m²
- Fußleisten: 53 lfm
- Steckdosen: 11 Stück
- etc.

**Werkzeuge (9, tools_note):**
- Rollengeschirr groß/klein
- 50er Pinsel
- Raufaser Tapezierbürste
- Cutterklingen, Reissadler
- Imbusset, Schraubendreherset
- Spachtelwerkzeug

**Werkzeuge (3, ai_suggested):**
- Eimer 10L (2x)
- Rührstab für Bohrmaschine
- Teleskopstange

**Verbrauchsmaterial (4, ai_suggested):**
- Malerkrepp 50mm (3 Rollen)
- Abdeckfolie 4x5m (2x)
- Abrissklinge für Schaber (10x)
- Müllsäcke 120L (10x)

---

## Offen

### 1. n8n Flow: M4_20_Packing_List_Review

**Trigger:** Event `PACKING_LIST_REVIEW_REQUESTED`

**Flow:**
1. Aktuelle Packliste laden
2. Positionen laden (für Kontext)
3. Claude API: Analyse + Vorschläge
4. `add_packing_list_suggestions()` aufrufen
5. Event `PACKING_LIST_REVIEWED` feuern

**Prompt-Konzept:** Siehe `docs/N8N_M4_20_PACKING_LIST_REVIEW.md`

### 2. Frontend: ProjectPackingList

**RPC:**
```typescript
const { data } = await supabase
  .rpc('get_project_packing_list', { p_project_id: projectId });
```

**Features:**
- Gruppierung nach item_type
- AI-Vorschläge mit Begründung
- Confirm/Pack toggles
- Manuelles Hinzufügen

**Prompt:** Siehe `docs/PROMPT_FRONTEND_PACKING_LIST.md`

---

## Queries für Frontend

```typescript
// Materialliste aggregiert
const { data: materials } = await supabase
  .rpc('get_project_materials_summary', { p_project_id: projectId });

// Packliste komplett
const { data: packingList } = await supabase
  .rpc('get_project_packing_list', { p_project_id: projectId });

// Item bestätigen
await supabase
  .from('project_packing_list')
  .update({ confirmed: true })
  .eq('id', itemId);

// Als gepackt markieren
await supabase
  .from('project_packing_list')
  .update({ packed: true, packed_at: new Date().toISOString() })
  .eq('id', itemId);
```

---

## Zusammenhang mit M4-01

```
complete_erstbegehung()
    │
    ├── write_calculated_materials() → position_calc_materials
    │
    ├── generate_packing_list() → project_packing_list
    │       ├── Materials (von position_calc_materials)
    │       └── Tools (von offer_positions.tools_note)
    │
    └── Event: PACKING_LIST_REVIEW_REQUESTED
                    │
                    └── n8n M4_20 → Claude AI → add_packing_list_suggestions()
```

---

## Lernendes System (Zukunft)

Die Packliste lernt über Zeit:

1. **Werkzeug-Stammdaten aufbauen** — Aus tatsächlicher Nutzung
2. **Regelbasierte Vorschläge** — "Position 1.3 = immer Rollengeschirr"
3. **AI-Verbesserung** — Feedback-Loop aus bestätigten/abgelehnten Vorschlägen

Felder für später:
- `source = 'rule_based'` + `suggested_by = 'rule:maler_basics'`
- Tracking welche AI-Vorschläge akzeptiert werden
