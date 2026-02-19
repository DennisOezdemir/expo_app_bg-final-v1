# n8n Flow: M4_20_Packing_List_Review

## Trigger

Event: `PACKING_LIST_REVIEW_REQUESTED`

Wird gefeuert von `complete_erstbegehung()` nach Generierung der Packliste.

## Payload

```json
{
  "protocol_id": "uuid",
  "packing_list": {
    "materials_count": 13,
    "tools_count": 9
  },
  "review_scope": "suggest_missing_consumables_and_tools"
}
```

## Flow-Logik

```
1. Event empfangen
    ↓
2. Aktuelle Packliste laden
    ↓
3. Positionen laden (für Kontext)
    ↓
4. Claude API: Analyse + Vorschläge
    ↓
5. add_packing_list_suggestions() aufrufen
    ↓
6. Event PACKING_LIST_REVIEWED feuern
```

## Claude Prompt

```
Du bist Werkstattleiter bei einem Maler- und Renovierungsbetrieb.

Prüfe die Packliste für folgendes Projekt und schlage fehlende Verbrauchsmaterialien und Werkzeuge vor.

## Projekt-Positionen (was wird gemacht):
{{positions}}

## Aktuelle Packliste:

### Materialien:
{{materials}}

### Werkzeuge:
{{tools}}

## Deine Aufgabe:

1. Analysiere welche Arbeiten durchgeführt werden
2. Prüfe ob alle nötigen Verbrauchsmaterialien vorhanden sind
3. Prüfe ob alle nötigen Werkzeuge vorhanden sind
4. Schlage fehlende Items vor

## Typische Verbrauchsmaterialien die oft vergessen werden:
- Malerkrepp / Abklebeband (verschiedene Breiten)
- Abdeckfolie / Malervlies
- Abreissklingen für Schaber
- Müllsaecke (für Tapeten, Bauschutt)
- Schleifpapier (verschiedene Körnungen)
- Holzleim / Montagekleber
- Dübel und Schrauben (für Fußleisten)
- Silikon (für Bad/Küche)
- Putzlappen / Küchenpapier

## Typische Werkzeuge die oft vergessen werden:
- Eimer (für Farbe, Kleister, Wasser)
- Rührstab für Bohrmaschine
- Teleskopstange (für Deckenarbeiten)
- Leiter / Trittleiter
- Cuttermesser
- Bleistift / Zollstock
- Wasserwaage
- Staubsauger (für Endreinigung)

## Antwortformat (JSON Array):

```json
[
  {
    "item_type": "consumable",
    "item_name": "Malerkrepp 50mm",
    "quantity": 3,
    "unit": "Rollen",
    "reason": "Zum Abkleben bei Decken- und Wandarbeiten"
  },
  {
    "item_type": "tool",
    "item_name": "Eimer 10L",
    "quantity": 2,
    "unit": "Stück",
    "reason": "Für Kleister und Farbe"
  }
]
```

## Regeln:
- Nur Vorschläge die NICHT bereits in der Packliste sind
- Realistische Mengen basierend auf Projektgröße
- Kurze, prägnante Begründungen
- item_type muss "tool" oder "consumable" sein (nie "material")
- Antworte NUR mit dem JSON Array, kein anderer Text
```

## Supabase Calls

### 1. Packliste laden

```sql
SELECT * FROM get_project_packing_list('{{project_id}}');
```

### 2. Positionen laden

```sql
SELECT 
  op.catalog_code,
  op.title,
  os.title as room
FROM offer_positions op
JOIN offer_sections os ON os.id = op.section_id
JOIN offers o ON o.id = op.offer_id
WHERE o.project_id = '{{project_id}}'
  AND op.phase = 'zwischenbegehung'
  AND op.deleted_at IS NULL
ORDER BY op.catalog_code;
```

### 3. Vorschläge speichern

```sql
SELECT add_packing_list_suggestions(
  '{{project_id}}',
  '{{suggestions_json}}'::jsonb
);
```

### 4. Event feuern

```sql
INSERT INTO events (
  event_type,
  project_id,
  source_system,
  source_flow,
  payload
) VALUES (
  'PACKING_LIST_REVIEWED',
  '{{project_id}}',
  'n8n',
  'M4_20_Packing_List_Review',
  '{"suggestions_added": {{count}}}'::jsonb
);
```

## Idempotenz

- `add_packing_list_suggestions` hat `ON CONFLICT DO NOTHING`
- Doppelte Vorschläge werden ignoriert
- Event kann mehrfach laufen ohne Probleme

## Error Handling

- Bei Claude API Fehler: Retry nach 30s (max 3x)
- Bei leerer Antwort: Event trotzdem feuern mit `suggestions_added: 0`
- Bei JSON Parse Error: Log + Skip
