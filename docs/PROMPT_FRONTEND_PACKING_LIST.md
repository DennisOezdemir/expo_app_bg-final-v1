# PROMPT: Packliste im Projekt-Dashboard

## Kontext

Die Packliste kombiniert:
1. **Materialien** — automatisch berechnet aus Positionen × Raummessungen
2. **Werkzeuge** — vom Bauleiter bei EB eingegeben
3. **AI-Vorschläge** — Verbrauchsmaterial das oft vergessen wird

Daten liegen in `project_packing_list`.

## Supabase RPCs

```typescript
// Materialliste aggregiert
const { data: materials } = await supabase
  .rpc('get_project_materials_summary', { p_project_id: projectId });

// Komplette Packliste
const { data: packingList } = await supabase
  .rpc('get_project_packing_list', { p_project_id: projectId });
```

## Schema `project_packing_list`

```typescript
interface PackingItem {
  id: string;
  item_type: 'material' | 'tool' | 'consumable';
  item_name: string;
  quantity: number;
  unit: string;
  source: 'calculated' | 'tools_note' | 'ai_suggested' | 'manual';
  ai_suggested: boolean;
  ai_reason: string | null;  // Begründung bei AI-Vorschlägen
  confirmed: boolean;        // User hat bestätigt
  packed: boolean;           // Wurde eingepackt
  notes: string | null;
}
```

## UI-Anforderungen

### 1. Komponente: `ProjectPackingList`

**Props:**
```typescript
interface Props {
  projectId: string;
  editable?: boolean;  // Für Monteur-Ansicht: nur packed toggle
}
```

### 2. Layout

```
┌─────────────────────────────────────────────────────┐
│ 📦 Packliste                          [+ Hinzufügen]│
├─────────────────────────────────────────────────────┤
│                                                     │
│ MATERIAL (13)                              ▼        │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ☑ Ausgleichsmasse          221 kg    calculated │ │
│ │ ☑ Binderfarbe Wand          21 L     calculated │ │
│ │ ☑ Raufaser Decke            52 m²    calculated │ │
│ │ ...                                             │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ WERKZEUG (12)                              ▼        │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ☑ Rollengeschirr groß        1 Stk   tools_note │ │
│ │ ☑ 50er Pinsel                1 Stk   tools_note │ │
│ │ ○ Eimer 10L                  2 Stk   🤖 AI      │ │
│ │   └─ "Für Kleister und Farbe"                   │ │
│ │ ...                                             │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ VERBRAUCHSMATERIAL (4)                     ▼        │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ○ Malerkrepp 50mm            3 Rol   🤖 AI      │ │
│ │   └─ "Zum Abkleben bei Malerarbeiten"           │ │
│ │ ○ Abdeckfolie 4x5m           2 Stk   🤖 AI      │ │
│ │ ...                                             │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🤖 4 AI-Vorschläge warten auf Bestätigung       │ │
│ │    [Alle bestätigen]  [Alle ablehnen]           │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 3. Features

**Gruppierung:**
- Nach `item_type`: Material → Werkzeug → Verbrauchsmaterial
- Collapsible sections

**Status-Anzeige:**
- `☑` = confirmed + packed
- `☐` = confirmed, not packed
- `○` = not confirmed (AI suggestion)

**AI-Vorschläge:**
- Badge: 🤖 oder "AI"
- Reason als Tooltip oder Subtext
- Bulk-Actions: "Alle bestätigen" / "Alle ablehnen"

**Aktionen:**
- Toggle `packed` (Checkbox)
- Toggle `confirmed` (für AI-Vorschläge)
- Item löschen (soft: `DELETE`)
- Item hinzufügen (Modal)

### 4. Mutations

```typescript
// Confirm AI suggestion
await supabase
  .from('project_packing_list')
  .update({ confirmed: true })
  .eq('id', itemId);

// Mark as packed
await supabase
  .from('project_packing_list')
  .update({ packed: true, packed_at: new Date().toISOString() })
  .eq('id', itemId);

// Add manual item
await supabase
  .from('project_packing_list')
  .insert({
    project_id: projectId,
    item_type: 'tool',
    item_name: 'Leiter 3m',
    quantity: 1,
    unit: 'Stück',
    source: 'manual',
    confirmed: true
  });
```

### 5. Styling

- Konsistent mit bestehendem Design
- Deutsche Zahlenformatierung
- Farbcodes:
  - Material: blau
  - Werkzeug: grau
  - Verbrauch: orange
  - AI-Vorschlag: gelber Rand oder Badge

### 6. Platzierung

Im Projekt-Detail (`/projects/[id]`):
- Neuer Tab "Packliste" ODER
- Accordion unter "Material"

## Test-Projekt

`project_id: 56404c9c-3e55-4cd5-9ea4-40ebde77c58c` (Schwentnerring 13c)
- 13 Materialien (calculated)
- 9 Werkzeuge (tools_note)
- 3 Werkzeuge (ai_suggested)
- 4 Verbrauchsmaterial (ai_suggested)

## Nicht im Scope

- Bestellfunktion (kommt später)
- Preisanzeige (noch nicht gepflegt)
- Monteur-Zuweisung
