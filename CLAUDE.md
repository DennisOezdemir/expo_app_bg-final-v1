# BauGenius Expo App — Claude Code Projektregeln

> **MODUS: AUTONOMES ARBEITEN**
> Du arbeitest eigenständig ohne Rückfragen. Wenn du unsicher bist, wähle den konservativsten Weg. Lieber weniger bauen und es funktioniert, als viel bauen und es crasht.

---

## ERSTE PFLICHT — IMMER LESEN

1. Dieses File komplett lesen
2. Das GitHub Issue das du bearbeitest — lies es komplett bevor du anfängst
3. `docs/PERSONA_AYSE.md` — Jede UI-Entscheidung wird gegen Ayse getestet
4. `docs/NORDSTAR.md` — Vision: "Mail kommt → 30 Sek → Alles fertig → [Freigeben]"

---

## Projekt-Kontext

| Key | Value |
|-----|-------|
| Supabase Projekt-ID | `yetwntwayhmzmhhgdkli` |
| Supabase URL | `https://yetwntwayhmzmhhgdkli.supabase.co` |
| Stack | Expo (React Native) + TypeScript + Supabase |
| UI-Sprache | Komplett Deutsch |
| Code/Kommentare | Deutsch oder Englisch |
| Akzentfarbe | Electric Blue `#4D4DFF` |
| Migrations-Format | Timestamp: `YYYYMMDDHHMMSS_name.sql` |
| Letzte Migration | `20260329200000_catalog_price_sync.sql` |

### Zwei Repos — Nicht verwechseln!
- **Expo App** (dieses Repo): Mobile App für Monteure + Bauleiter auf der Baustelle
- **AgentView** (`v0-agent-dashboard-layout`): Next.js Web-Dashboard für GF — SEPARATES REPO

### Rollen in der App
- **Bauleiter** — Sieht Projekte, Positionen, Mengen. KEINE Preise/Margen.
- **Monteur** — Sieht nur Leistungsbeschreibungen. KEINE Preise, KEINE Kosten.
- **GF existiert NICHT in der App** — GF wird als Bauleiter gemappt. GF-Features sind im AgentView.

### trade_type Enum
`'Sanitär'`, `'Maler'`, `'Elektro'`, `'Fliesen'`, `'Trockenbau'`, `'Tischler'`, `'Heizung'`, `'Boden'`, `'Maurer'`, `'Reinigung'`, `'Sonstiges'`

---

## Projektstruktur

```
app/
├── (tabs)/
│   ├── _layout.tsx          # 4 Tabs: Start, Projekte, Planung, Profil
│   ├── index.tsx            # HeuteScreen (Moin + heutige Projekte + Schnellzugriff)
│   ├── projekte.tsx         # Projektliste (Filter: Laufend, Achtung, Abgeschlossen)
│   ├── planung.tsx          # Redirect auf /planung
│   └── profil.tsx           # Name, Rolle, Logout
├── project/
│   └── [id].tsx             # Projektdetail (3400+ Zeilen — VORSICHT, nur gezielt ändern)
├── chat/
│   └── [id].tsx             # Agent-Chat (projektgebunden)
├── begehung/
│   └── [type].tsx           # Erst-/Zwischenbegehung
├── planung/
│   ├── index.tsx            # Einsatzplanung
│   └── [id].tsx             # Planungsdetail
└── login.tsx

components/
├── BGAssistant.tsx          # FAB "BG Agent" Pill (nur in /project/[id])
├── TopBar.tsx               # Logo + Glocke + Feedback-Button
├── OfferAssistantModal.tsx  # KI-Langtext-Generator (wird in AgentView verlagert)
└── ...

hooks/
├── queries/
│   ├── useOffers.ts
│   ├── useOfferAssistant.ts
│   ├── useChat.ts
│   └── ...
└── realtime/

lib/
├── supabase.ts              # NICHT ANFASSEN
├── api/
│   ├── offers.ts
│   ├── offer-assistant.ts
│   ├── chat.ts
│   └── ...
├── query-keys.ts
└── status.ts

constants/
└── colors.ts                # Electric Blue #4D4DFF als amber500

supabase/
├── functions/
│   ├── agent-chat/          # Haupt-Chat-Agent (Claude + Gemini Fallback)
│   ├── offer-assistant/     # Langtext-Batch-Generator
│   ├── _shared/
│   │   ├── llm-router.ts   # Provider-agnostischer LLM Router
│   │   ├── cors.ts
│   │   ├── auth.ts
│   │   ├── response.ts
│   │   └── supabase-client.ts
│   ├── generate-protokoll-pdf/
│   ├── parse-lv/
│   └── run-godmode/
└── migrations/              # Timestamp-Format: 20260324100000_name.sql
```

---

## Wichtige DB-Tabellen (Auswahl)

### Agent-System (neu, 2026-03-24)
- `agent_threads` — Generischer Conversation-Container
- `agent_messages` — Strukturierte Nachrichten mit position_id, action, quality_score
- `agent_observations` — Append-only Trainings-Log
- `memory_entries` — Scoped Memory (global/tenant/user/project/session)
- `llm_providers` — DB-konfigurierbarer Provider-Switch (Claude/Gemini/Local)

### Kern
- `projects` — Status: DRAFT, INTAKE, INSPECTION, PLANNING, IN_PROGRESS, COMPLETED, INVOICED, ARCHIVED
- `offers` + `offer_sections` + `offer_positions` — Angebote mit staged_long_text für Review-Workflow
- `catalog_positions_v2` — Kataloge (AV-2024, WABS, WBS-*, DBL-2026) mit description + price_updated_at
- `approvals` — HITL Freigaben (MATERIAL_ORDER, TOOL_REQUEST, CHANGE_ORDER, etc.)
- `project_sessions` — Tracking wann User in welchem Projekt sind
- `user_feedback` — Bug-Reports + Verbesserungen
- `chat_messages` — Chat-Verlauf (project_id kann NULL sein)
- `events` — Zentrales Event-Log
- `richtzeitwerte` — Godmode EMA-Lernwerte

### Automatische Trigger
- `trg_sync_catalog_price` — Bei Insert/Update auf offer_positions → Katalogpreis aktualisieren
- `trg_godmode_phase_completed` — Bei Phase abgeschlossen → Richtzeitwerte lernen

---

## Edge Functions

### agent-chat
- **System-Prompt**: Tool-first, nutzt Projektkontext proaktiv
- **Tools**: query_positions, check_catalog, create_change_order, prepare_email, get_project_status, get_schedule, update_project_status, remember, search_projects, request_material, request_tool
- **Memory**: Lädt memory_entries (global/tenant/user, confidence >= 0.6) in System-Prompt
- **LLM**: Claude Sonnet primary, Gemini Flash fallback
- **Rollen-Schutz**: Monteur sieht NIE Preise, BL sieht keine Margen

### offer-assistant
- **Actions**: start_batch, approve, approve_all, edit, reject, commit_all
- **Flow**: Batch-Generierung → staged_long_text → User Review → commit → long_text
- **Learning**: Jede Interaktion wird in agent_observations geloggt

### _shared/llm-router
- Provider-agnostisch: Anthropic, Google, OpenAI-compat (Ollama/Local)
- Priority-basierter Failover aus llm_providers Tabelle (5min Cache)
- Prompt-Caching Support (Anthropic)

---

## DONT-TOUCH Regeln

1. **KEINE Änderungen an `lib/supabase.ts`** — Auth & Client Config ist stabil
2. **KEINE Änderungen an bestehenden Migrations** — nur NEUE erstellen
3. **KEINE Packages hinzufügen** ohne expliziten Grund im Issue
4. **KEINE `.env` Dateien committen**
5. **KEINE Änderungen an `app.json` / `eas.json`** außer das Issue fordert es explizit
6. **NICHT mehrere Issues gleichzeitig bearbeiten** — ein Issue = ein Branch = ein PR
7. **`app/project/[id].tsx` ist 3400+ Zeilen** — nur gezielt ändern, nie komplett umschreiben
8. **`app/begehung/[type].tsx` ist 2600+ Zeilen** — gleiche Vorsicht
9. **NICHT auf main committen** — immer Branch + PR

---

## Git-Regeln

```bash
# Branch erstellen (IMMER)
git checkout -b fix/issue-XX-kurzbeschreibung
# oder
git checkout -b feat/issue-XX-kurzbeschreibung

# Commit Message Format
git commit -m "fix(#XX): Kurze Beschreibung"
git commit -m "feat(#XX): Neue Feature Beschreibung"

# Nach Abschluss
git push origin fix/issue-XX-kurzbeschreibung
# PR erstellen via gh cli
gh pr create --title "fix(#XX): Beschreibung" --body "Closes #XX"
```

### Commit-Regeln:
- Kleine, atomare Commits — ein Commit pro logischer Änderung
- Nie mehr als 5 Dateien pro Commit wenn möglich
- `npx tsc --noEmit` vor dem finalen Commit — keine TypeScript-Fehler
- Wenn TypeScript-Fehler: fixen, nicht ignorieren

---

## Design-Regeln (Ayse-konform)

- Große Touch-Targets (min 44px)
- Ampelfarben: grün/gelb/rot für Status
- Deutsche Labels, keine englischen Fachbegriffe in der UI
- Mobile-first, Wurstfinger-kompatibel
- Wichtigste Aktion sofort sichtbar ohne Scrollen
- 3-Sekunden-Regel: Wenn unklar wo tippen → Design ist falsch
- Farbe: Electric Blue `#4D4DFF` (definiert in `constants/colors.ts` als amber500)
- Texte auf blauem Hintergrund: WEISS, nicht schwarz

---

## Architektur-Regeln

### STAFFELLAUF-PRINZIP
- Ein Agent = Eine Aufgabe = Stab weitergeben
- NIEMALS einen Monolith-Agent bauen der alles macht
- Event-driven: `events` Tabelle für alle Statusänderungen

### Daten-Patterns
```typescript
// React Query Hook Pattern (IMMER verwenden)
const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.entity.detail(id),
  queryFn: () => fetchEntity(id),
});

// Mutations mit Invalidation
const mutation = useMutation({
  mutationFn: (data) => updateEntity(data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.entity.all }),
});
```

### Backend-Regeln
- DB-Funktionen für deterministische Logik
- Edge Functions für LLM-Calls
- Migrations: Timestamp-Format `YYYYMMDDHHMMSS_beschreibung.sql`
- RLS auf allen neuen Tabellen aktivieren
- Idempotenz wo möglich

### Chat ist PROJEKTGEBUNDEN
- Kein allgemeiner Chat in der Expo App
- FAB (BG Agent Pill) nur in `/project/[id]`
- Jede Chat-Nachricht hat eine project_id
- agent-chat Edge Function nutzt Projektkontext proaktiv

### Quick-Actions auf Projektseite
- Material → öffnet Agent-Chat
- Nachtrag → öffnet Agent-Chat
- Chat → öffnet Agent-Chat
- Alle Input-Aktionen laufen über den Agent

### Sektionen auf Projektseite (Logbuch, read-only)
1. Nachrichten — Chatverlauf
2. Fotos — Galerie
3. Nachträge — Status-Anzeige
4. Dokumente — Aufträge, Angebote, Dateien

---

## Deploy

```bash
# Vercel (Web-Preview)
vercel --prod

# Edge Functions
supabase functions deploy agent-chat --project-ref yetwntwayhmzmhhgdkli
supabase functions deploy offer-assistant --project-ref yetwntwayhmzmhhgdkli

# iOS (sobald Apple Developer Account aktiv)
eas build --platform ios --profile preview
```

### Migrations ausführen
Migrations können NICHT über CLI deployed werden (Schema-Drift). SQL muss im **Supabase Dashboard → SQL Editor** ausgeführt werden.

---

## Offene Issues (Stand 2026-03-31)

| # | Titel | Prio |
|---|-------|------|
| 52 | Chat/Voice Angebotserstellung | High |
| 53 | AgentView GF-Cockpit (separates Repo) | High |
| 54 | Expo App verschlanken (Phase 2+3 nach AgentView) | Medium |
| 55 | Feedback-Flow mit Agent | Low |
| 56 | EB-Protokoll PDF Bug | Medium |
| 57 | Team-Chat (Mensch-zu-Mensch) | Low |
| 58 | Quick-Action Intent (Material/Nachtrag Auto-Prompt) | Medium |
| 59 | iOS Native Deploy bis 05.04.2026 | High |

---

## Autonomes Arbeiten — Checkliste pro Task

1. [ ] Issue gelesen und verstanden
2. [ ] Branch erstellt (`fix/issue-XX-...` oder `feat/issue-XX-...`)
3. [ ] CLAUDE.md gelesen (dieses File)
4. [ ] Betroffene Dateien identifiziert und gelesen
5. [ ] Änderungen implementiert (konservativ, minimal)
6. [ ] `npx tsc --noEmit` — keine TypeScript-Fehler
7. [ ] Atomare Commits mit `fix(#XX):` / `feat(#XX):` Prefix
8. [ ] Branch gepusht + PR erstellt
9. [ ] Wenn Edge Function geändert: `supabase functions deploy` ausführen
10. [ ] Wenn blockiert: Kommentar im Issue hinterlassen, NICHT raten

### Wenn du crashst oder unsicher bist:
- **STOP.** Nicht weiter bauen.
- Kommentar im Issue: "Blockiert weil: [Grund]. Brauche Klärung zu: [Frage]."
- Zum nächsten Issue weitergehen.
