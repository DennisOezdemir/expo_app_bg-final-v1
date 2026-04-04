# AGENTS.md — BauGenius

## Projekt

BauGenius — Handwerker-App für Subunternehmer im Baugewerbe.
Vision: "Mail kommt → 30 Sek → Alles ready → [Freigeben]"

**Zielnutzerin:** Ayse, 46, Projektmanagerin. Samsung-Handy, Baustelle, Wurstfinger, kein Tech-Nerd.
Lies `docs/PERSONA_AYSE.md` und `docs/NORDSTAR.md` vor jeder UI-Entscheidung.

## Stack

- **Frontend**: React Native 0.81 + Expo 54 + Expo Router 6 + TypeScript 5.9
- **Styling**: Inline Styles (React Native), kein Tailwind CSS
- **State**: useState/useEffect + Supabase Realtime, @tanstack/react-query
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **ORM**: Drizzle
- **Server**: Express (unter `server/`)
- **Automation**: n8n (self-hosted) — `https://n8n.srv1045913.hstgr.cloud`
- **PDF**: Gotenberg — `https://gotenberg.srv1045913.hstgr.cloud`
- **AI**: Claude API (Vision für PDF-Parsing, Anthropic SDK)
- **Notifications**: Telegram Bot
- **UI-Sprache**: Deutsch (kein Englisch in der UI)

## Entry Points

- `expo-router/entry` (App-Einstieg)
- `app/` — Expo Router Seiten (13 Routen, 5-Tab Navigation)
- `server/index.ts` — Express-Server

## Commands

| Action | Command |
|--------|---------|
| Dev (Mobile) | `npx expo start` |
| Dev (Web) | `CI=false npx expo start --web` |
| Server Dev | `npm run server:dev` |
| Lint | `npm run lint` |
| Lint Fix | `npm run lint:fix` |
| Typecheck | `npx tsc --noEmit` |
| DB Push | `npm run db:push` |

## Validation (run before commit)

```bash
npm run lint && npx tsc --noEmit
```

**Achtung:** Kein `npm run build` oder `npm test` vorhanden. Expo-App wird nicht klassisch gebaut.

## Patterns

- **Pages**: `./app/` — Expo Router (NICHT Next.js App Router!)
- **Components**: `./components/` — shared/, ui/
- **Hooks**: `./hooks/` — useProjects, useInbox, useOffers, useProjectDetail
- **Lib**: `./lib/` — formatters.ts, status.ts, utils.ts
- **Server**: `./server/` — Express API
- **Supabase**: `./supabase/` — Migrations in `migrations/`
- **Docs**: `./docs/` — 35+ Projektdokumente

## Architecture Rules

1. **Event-Driven** — `events` Tabelle für alle Statusänderungen
2. **Single Responsibility** — Ein n8n-Flow = Eine Aufgabe
3. **Idempotenz** — `idempotency_key` auf allem was doppelt kommen kann
4. **Human-in-the-Loop** — KI bereitet vor, Mensch entscheidet
5. **RLS auf allen Tabellen** — Row Level Security aktiv
6. **DB-Funktionen** für deterministische Logik (SECURITY DEFINER, RETURNS JSONB)
7. **n8n nur für externe API-Calls** (Claude Vision, SevDesk, Telegram)
8. **Binaries in Storage** — Nur `storage_path` in Events, nie Base64

## Code Rules

- TypeScript strict
- Deutsche Labels in UI, Code/Kommentare Deutsch oder Englisch
- Colors: `Colors.raw.amber500`, `emerald500`, `rose500`, `zinc*` — KEIN `blue500`
- Ampelfarben: grün = gut, gelb = Achtung, rot = Problem
- Touch-Targets min 44px
- Mobile-first, Wurstfinger-kompatibel
- `trade_type` Enum: `'Sanitär'`, `'Maler'`, `'Elektro'`, `'Fliesen'`, `'Trockenbau'`, `'Sonstiges'`

## Secrets

- `.env.local` für Secrets, nie committen
- Supabase Projekt-ID: `yetwntwayhmzmhhgdkli`
- n8n URL: `https://n8n.srv1045913.hstgr.cloud`

## Git

- Commits: `type(scope): description` (conventional commits)
- Types: feat, fix, docs, refactor, test, chore

## Wichtige Docs (IMMER konsultieren)

| Doc | Wann laden |
|-----|------------|
| `docs/NORDSTAR.md` | Feature-Entscheidungen, UX-Fragen |
| `docs/PERSONA_AYSE.md` | Jede UI-Entscheidung |
| `docs/AUTOMATION_MANIFEST.md` | Neue Automatisierungen |
| `docs/FLOW_REGISTER.md` | n8n Flow-Änderungen |
| `docs/DATABASE_SCHEMA.md` | DB-Änderungen |
| `docs/ARCHITEKTUR.md` | Event-System, Flow-Templates |
| `docs/PATTERNS.md` | n8n Node Patterns, SQL Patterns |
| `CLAUDE.md` | Alle Projektregeln |

## Quick Triggers

| Keywords | Action |
|----------|--------|
| type error, ts | Run typecheck |
| lint, format | Run lint --fix |
| database, migration, rls | Check `supabase/migrations/` |
| flow, n8n, automation | Read `docs/FLOW_REGISTER.md` |
| ayse, ux, design | Read `docs/PERSONA_AYSE.md` |
| nordstar, vision | Read `docs/NORDSTAR.md` |

## Detailed Docs

- Frontend: `.ralph/guides/FRONTEND.md` — Ayse-konformes Design, Mobile-First
- Security: `.ralph/guides/SECURITY.md` — RLS, Auth, Supabase-spezifisch
- Performance: `.ralph/guides/PERFORMANCE.md` — Mobile Performance, React Native
