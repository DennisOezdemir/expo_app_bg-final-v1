# Bestehender agent-chat: Code-Analyse

> Analyse des aktuellen Chat-Agents fuer die Migration auf Ollama Local
> Erstellt: 2026-03-22 von Claude Opus 4.6

---

## Architektur-Uebersicht

```
Expo App (React Native)
  └─ lib/api/chat.ts → sendChatMessage()
       └─ POST /functions/v1/agent-chat
            └─ supabase/functions/agent-chat/index.ts
                 ├─ Anthropic SDK (Claude Sonnet 4)
                 ├─ 6 Tool-Definitionen (Anthropic-Format)
                 ├─ Tool Use Loop (max 5 Iterationen)
                 ├─ Tool-Ausfuehrung gegen Supabase
                 └─ chat_messages Persistenz
```

## Dateien

| Datei | Zweck | Aenderung noetig? |
|-------|-------|-------------------|
| `supabase/functions/agent-chat/index.ts` | Edge Function, Claude API Call | **JA — Privacy Router** |
| `supabase/functions/_shared/cors.ts` | CORS Headers | Nein |
| `supabase/functions/_shared/supabase-client.ts` | Supabase Service Client | Nein |
| `supabase/functions/_shared/events.ts` | Event-Logging | Nein |
| `supabase/functions/_shared/response.ts` | JSON/Error Response Helper | Nein |
| `supabase/functions/_shared/auth.ts` | JWT/API-Key Auth | Nein |
| `lib/api/chat.ts` | Frontend API Layer | Nein |
| `hooks/queries/useChat.ts` | React Query + Realtime | Nein |
| `app/chat/[id].tsx` | Chat-UI (1200+ Zeilen) | Nein |

**Fazit: Nur 1 Datei muss geaendert werden** (agent-chat/index.ts). Das Frontend bleibt 100% unveraendert.

## Bestehende Tool-Definitionen (Anthropic-Format)

6 Tools im Anthropic `input_schema` Format:

| Tool | Beschreibung | Rollen-Restriktion |
|------|-------------|-------------------|
| `query_positions` | Angebotspositionen nach Raum | Monteur/BL: keine Preise |
| `check_catalog` | Katalog durchsuchen (1.833 Pos.) | Alle |
| `create_change_order` | Nachtrag anlegen → Freigabecenter | Nur GF + BL |
| `prepare_email` | E-Mail vorbereiten → Freigabecenter | Alle |
| `get_project_status` | Projektstatus + Ampel | Monteur: kein client_name |
| `get_schedule` | Einsatzplan/Terminplan | Alle |

## System-Prompts nach Rolle

```
GF:       "Er darf ALLES sehen: Margen, Finanzen, alle Projekte, Preise."
Bauleiter: "VERBOTEN: Margen, Finanzen anderer Projekte, Einkaufspreise, Stundensaetze."
Monteur:   "VERBOTEN: Preise, Margen, Finanzen, andere Projekte, Angebotssummen."
```

## Tool Use Loop (bestehend)

```
1. Claude API Call mit System-Prompt + History + Tools
2. Response pruefen:
   - Nur Text → Fertig
   - Tool Calls → Ausfuehren gegen Supabase
3. Tool-Ergebnisse an Konversation anhaengen
4. Zurueck zu Schritt 1 (max 5x)
5. Finale Antwort in chat_messages speichern
```

## Chat-History Management

- Gespeichert in `chat_messages` (project_id, user_id, role, content, tool_calls, tool_results, metadata)
- Letzte 50 Nachrichten geladen pro Konversation
- Realtime-Subscription im Frontend (neue Nachrichten erscheinen sofort)

## Migration: Was sich aendert

### Anthropic-Format → OpenAI-Format

**Vorher (Anthropic):**
```typescript
{
  name: "query_positions",
  description: "...",
  input_schema: {
    type: "object",
    properties: { project_id: { type: "string" } },
    required: ["project_id"]
  }
}
```

**Nachher (OpenAI/Ollama):**
```typescript
{
  type: "function",
  function: {
    name: "query_positions",
    description: "...",
    parameters: {
      type: "object",
      properties: { project_id: { type: "string" } },
      required: ["project_id"]
    }
  }
}
```

### Tool-Call Response Mapping

**Anthropic:** `{ type: "tool_use", id: "...", name: "...", input: {...} }`
**OpenAI/Ollama:** `{ id: "...", function: { name: "...", arguments: "..." } }`

### Tool-Result Format

**Anthropic:** `{ type: "tool_result", tool_use_id: "...", content: "..." }`
**OpenAI/Ollama:** `{ role: "tool", tool_call_id: "...", content: "..." }`

## Risiken bei Migration

| Risiko | Wahrscheinlichkeit | Mitigation |
|--------|-------------------|-----------|
| Qwen 72B gibt schlechteren Tool Call JSON | Mittel | System-Prompt mit Beispielen verstaerken |
| Latenz > 15s bei komplexen Queries | Hoch (72B) | QwQ 32B fuer einfache Anfragen |
| Ollama down, kein Fallback getestet | Niedrig | Automatischer Claude-Fallback im Router |
| Rollen-Enforcement schwaecher bei kleinerem Modell | Mittel | Doppelte Pruefung: Prompt + executeTool() |
