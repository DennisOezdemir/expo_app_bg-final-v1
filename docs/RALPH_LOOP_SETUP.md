# Ralph Loop Setup

Stand: 11.03.2026

Diese Codebase ist ein guter Kandidat fuer eine externe Ralph-Loop-Orchestrierung, nicht fuer eine direkte Runtime-Integration in die Expo-App.

Empfohlene Variante: `Wiggum CLI`

Warum diese Variante:
- funktioniert auf bestehenden Codebases ohne Umbau
- ist laut offizieller Doku agent-agnostisch und kann mit Codex oder Claude Code arbeiten
- passt besser zu diesem Stack als ein eingebettetes experimentelles Agent-Framework

Nicht empfohlen als erster Schritt:
- `vercel-labs/ralph-loop-agent`: technisch interessant, aber laut README experimentell
- `frankbria/ralph-claude-code`: stark auf Claude Code zugeschnitten, weniger neutral fuer euren Stack

## Projektkontext

Dieses Repo hat:
- Expo / React Native Frontend
- Express-Server unter `server/`
- Supabase / Drizzle
- n8n-Workflows im Repo

Fuer Ralph-Loops ist deshalb sinnvoll:
- Feature-Specs gegen das bestehende Repo erzeugen
- Implementierung ueber CLI-Agent laufen lassen
- Verifikation mit euren bestehenden Commands und manuellen Gates machen

## Voraussetzungen

Lokal benoetigt ihr:
- Node.js und npm
- Git
- einen CLI-Agenten, den ihr wirklich nutzen wollt

Fuer Codex:
- funktionierender Codex-CLI-Workflow in eurem Terminal

Fuer Claude Code:
- `@anthropic-ai/claude-code` global oder via `npx`

## Bereits im Repo vorbereitet

In `package.json` gibt es jetzt folgende Helfer:

```bash
npm run ralph:init
npm run ralph:new
npm run ralph:run
npm run ralph:agent
```

Diese Scripts rufen `wiggum-cli` ueber `npx` auf.

## Einrichtung

1. Wiggum einmal global installieren:

```bash
npm i -g wiggum-cli
```

Alternativ koennen die Repo-Scripts `npx wiggum-cli ...` verwenden.

2. Im Repo initialisieren:

```bash
npm run ralph:init
```

Erwartetes Ergebnis (Stand v0.17.2):
- `.ralph/` Verzeichnis mit guides, prompts, scripts, specs
- `.ralph/.context.json` — Projekt-Kontext
- `.ralph/guides/AGENTS.md` + FRONTEND/PERFORMANCE/SECURITY
- `.ralph/prompts/PROMPT*.md` — verschiedene Loop-Prompts
- `.ralph/scripts/loop.sh`, `feature-loop.sh`, `ralph-monitor.sh`

3. Erste Spec erzeugen:

```bash
npm run ralph:new
```

Sinnvolle erste Aufgaben fuer dieses Repo:
- Query-/Mutation-Layer fuer weitere Screens vereinheitlichen
- n8n-Workflow-Dokumentation gegen Live-Stand abgleichen
- Freigaben-/Begehungs-Flow mit Tests oder Checklisten absichern

4. Ralph-Loop ausfuehren:

```bash
npm run ralph:run -- <spec-name>
```

Beispiel:

```bash
npm run ralph:run -- approvals-realtime-hardening
```

## Empfohlene Arbeitsweise fuer dieses Repo

Vor jedem Loop:
- sauberen Git-Branch verwenden
- `.env` und Secrets nicht in Specs oder Commits ziehen
- kleine, klar abgegrenzte Features waehlen

Nach jedem Loop:
- `npm run lint`
- Expo-Flow pruefen
- relevante Supabase- oder n8n-Auswirkungen manuell gegenchecken

## Quellen

- Wiggum CLI: https://wiggum.app/
- Wiggum CLI GitHub/Get Started: https://wiggum.app/
- Ralph fuer Claude Code: https://github.com/frankbria/ralph-claude-code
- Vercel Ralph Loop Agent: https://github.com/vercel-labs/ralph-loop-agent
