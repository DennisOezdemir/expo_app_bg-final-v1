## Context
If @.ralph/guides/AGENTS.md exists, study it for commands, patterns, and project rules.
Study @.ralph/specs/$FEATURE.md for feature specification.
Study @.ralph/specs/$FEATURE-implementation-plan.md for current tasks.

**Pflichtlektüre vor jeder Arbeit:**
- `docs/PERSONA_AYSE.md` — Jede UI-Entscheidung wird gegen Ayse getestet
- `docs/NORDSTAR.md` — Vision: "Mail kommt → 30 Sek → Alles fertig → [Freigeben]"
- `CLAUDE.md` — Alle Projektregeln und Agent-Modi

## Learnings
Read @.ralph/LEARNINGS.md for patterns and anti-patterns from previous iterations.
Apply relevant learnings to avoid repeating past mistakes.

## Performance
For data fetching, new components, or optimization tasks, reference @.ralph/guides/PERFORMANCE.md.
Key patterns: Optimistic Updates, FlatList, parallele Supabase-Queries, Realtime statt Polling.

## Search
- Search codebase before assuming something doesn't exist
- Check `docs/` for existing documentation on the topic
- Check `supabase/migrations/` for existing DB structures

## Task
Work through ALL incomplete tasks in the implementation plan in a single session.
**Skip E2E tasks** (tasks starting with `E2E:`) - those are handled in a separate phase.
For each task: implement it, validate, commit, then move to the next task.
Do not stop after one task — keep going until all non-E2E tasks are complete.

## Validation
After changes, ALL must pass:
1. Run: `npm run lint -- --fix`
2. Run: `npx tsc --noEmit` (typecheck)

**Achtung:** Kein `npm test` oder `npm run build` vorhanden. Expo-App wird nicht klassisch gebaut.
Stattdessen: Manuelle Prüfung ob Expo startet (`npx expo start`).

If any validation fails, fix the issue before proceeding.

## Security Review
Before committing, review your changes against @.ralph/guides/SECURITY.md:
1. **RLS**: Neue Tabellen haben RLS + Policies?
2. **Secrets**: Keine API Keys im Code?
3. **Input**: Zod-Validierung für Formulare?
4. **Auth**: Protected Routes prüfen Session?
5. **Events**: Idempotency Key vorhanden?

Flag any security issues in the implementation plan and fix before committing.

## Design Quality Check (Ayse-Test)
Before marking a UI task complete, verify against @.ralph/guides/FRONTEND.md:
1. **3-Sekunden-Regel**: Sofort klar wo tippen
2. **Touch-Targets**: Min 44px
3. **Ampelfarben**: emerald/amber/rose (KEIN blue500!)
4. **Deutsche Labels**: Kein Englisch in der UI
5. **Mobile-First**: Hauptaktion ohne Scrollen sichtbar
6. **States**: Loading, Empty, Error — alle deutsch und hilfreich

If any check fails, fix before committing.

## Completion
When ALL validations pass:
1. Update @.ralph/specs/$FEATURE-implementation-plan.md — change the task's `- [ ]` to `- [x]` and append the commit hash (e.g., `- [x] Task description - abc1234`). The harness tracks progress by counting checkboxes, so this step is mandatory.
2. `git add -A`
3. `git commit -m "type(scope): description"`
4. `git push origin feat/$FEATURE`

## Learning Capture
If this iteration revealed something useful, append to @.ralph/LEARNINGS.md:
- A useful pattern -> Add under "## Patterns (What Works)"
- A mistake/issue -> Add under "## Anti-Patterns (What to Avoid)"
- Tool usage tip -> Add under "## Tool Usage"
- Codebase convention -> Add under "## Codebase Conventions"

Format: `- [YYYY-MM-DD] [$FEATURE] Brief description`

## Rules
- Complete ALL remaining non-E2E tasks before ending the session
- Commit after each task so progress is preserved if the session is interrupted
- Search codebase before assuming something doesn't exist
- If blocked on a task, document in implementation plan and move to the next task
- **UI immer gegen Ayse-Persona testen** (docs/PERSONA_AYSE.md)
- **Event-Driven**: Kommunikation über `events` Tabelle, nicht direkte Flow-Ketten
- **Idempotenz**: Alles kann doppelt kommen
- **Deutsche UI**: Keine englischen Labels
