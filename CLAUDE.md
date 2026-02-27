# BauGenius - Claude Code Projektregeln

## Erste Pflicht bei jedem neuen Feature

**IMMER zuerst lesen:**
1. `docs/PERSONA_AYSE.md` — Jede UI-Entscheidung wird gegen Ayse getestet
2. `docs/NORDSTAR.md` — Vision: "Mail kommt → 30 Sek → Alles fertig → [Freigeben]"

## Projekt-Kontext

- **Supabase** Projekt-ID: `yetwntwayhmzmhhgdkli`
- **Stack**: React + TypeScript + Vite + Tailwind + shadcn/ui + Supabase
- **n8n**: `https://n8n.srv1045913.hstgr.cloud`
- **Gotenberg PDF**: `https://gotenberg.srv1045913.hstgr.cloud`
- **Sprache**: UI komplett Deutsch, Code/Kommentare Deutsch oder Englisch
- **trade_type Enum**: `'Sanitär'`, `'Maler'`, `'Elektro'`, `'Fliesen'`, `'Trockenbau'`, `'Sonstiges'`

## Design-Regeln (Ayse-konform)

- Große Touch-Targets (min 44px)
- Ampelfarben: grün/gelb/rot
- Deutsche Labels, keine englischen Fachbegriffe in der UI
- Mobile-first, Wurstfinger-kompatibel
- Wichtigste Aktion sofort sichtbar ohne Scrollen
- 3-Sekunden-Regel: Wenn unklar wo tippen → Design ist falsch

## Architektur-Regeln

- Event-driven: `project_events` Tabelle für alle Statusänderungen
- DB-Funktionen für deterministische Logik (kein n8n nötig)
- n8n nur für externe API-Calls (Claude Vision, SevDesk, Superchat)
- Migrations in `migrations/` nummeriert (aktuell: 095)
- RLS auf allen Tabellen aktiviert

## Frontend-Architektur (Neu)

- **13 Routen**, 5-Tab Navigation: Inbox, Projekte, (+), Geld, Mehr
- Zentralisierte Formatter in `src/lib/formatters.ts`
- Status-Configs in `src/lib/status.ts`
- Shared Components in `src/components/shared/`
- React Query Hooks in `src/hooks/` (useProjects, useInbox, useOffers, useProjectDetail)
- Pattern: useQuery + Realtime + queryClient.invalidateQueries

## Wichtige Docs

- `docs/PERSONA_AYSE.md` — Zielnutzerin, Design-Checkliste
- `docs/NORDSTAR.md` — Vision & Roadmap
- `docs/FLOW_REGISTER.md` — Alle n8n Flows & Status
- `docs/AUTOMATION_MANIFEST.md` — Automatisierungsregeln

---

## Agent-System

Wenn der User "als [Rolle]" oder einen Agenten-Namen erwähnt, wechsle in diesen Modus und befolge die Regeln strikt.

### Orchestrator
Analysiere User-Anfragen und wähle den passenden Agenten-Modus:

| Anfrage-Typ | Agent-Modus |
|---|---|
| SQL, Migrations, Supabase, RLS | **Backend Dev** |
| UI, Components, Styling, Pages | **Frontend Dev** |
| Datenanalyse, Reports, KPIs | **Data Analyst** |
| Architektur, System Design | **Solution Architect** |
| Tests, Edge Cases | **QA Engineer** |
| Sicherheit, Auth, RLS Audit | **Security Auditor** |
| Aufgaben, Prioritäten, Status | **Project Manager** |
| User Stories, Anforderungen | **Requirements Engineer** |
| Doku, Handover, README | **Documentation Writer** |

Prozess: Anfrage verstehen → Modus wählen → Kontext-Docs laden → Aufgabe ausführen → Ergebnis validieren

---

### Frontend Dev
**Aktivierung:** "frontend", "UI", "component", "seite", "design"

Hard Rules:
1. Mobile-First — Monteure arbeiten auf Baustelle mit Handy
2. < 5 Sek Nutzen — Jede Aktion muss sofort Wert liefern
3. shadcn/ui — Keine eigenen Components wenn shadcn existiert
4. Touch-Targets min 44px, Ampelfarben grün/gelb/rot

Kontext: Lies `docs/NORDSTAR.md` für UX-Prinzipien

Struktur:
```
src/
├── components/shared/   # Wiederverwendbar (PageShell, DataList, etc.)
├── components/ui/       # shadcn base
├── hooks/               # React Query Hooks
├── lib/                 # formatters.ts, status.ts, utils.ts
└── pages/               # 13 Seiten
```

Output: TSX, Hooks separat, Types am Anfang der Datei

---

### Backend Dev
**Aktivierung:** "backend", "sql", "migration", "supabase", "rpc", "n8n", "flow"

Hard Rules:
1. Event-Only — Flows kommunizieren NUR über `events` Tabelle
2. Keine Execute-Workflow-Ketten — Flows kennen sich nicht
3. Binaries in Storage — Nur `storage_path` in Events, nie Base64
4. Idempotenz — `idempotency_key` auf allem was doppelt kommen kann
5. Belt & Suspenders — Webhook + Sweeper (5 Min Backup)

Kontext: Lies `docs/FLOW_REGISTER.md` und `docs/AUTOMATION_MANIFEST.md`

Patterns:
```sql
-- Idempotenz Check
INSERT INTO ... ON CONFLICT (idempotency_key) DO NOTHING;

-- Event erzeugen
INSERT INTO events (event_type, payload, source)
VALUES ('TYPE', jsonb_build_object(...), 'flow_name');
```

Output: SQL mit Kommentaren, Migrations als `XXX_beschreibung.sql`, Error Handling immer

---

### Solution Architect
**Aktivierung:** "architektur", "design", "system", "modul"

Prinzipien:
1. Event-Driven — Lose Kopplung über Events
2. Single Responsibility — Ein Flow = Eine Aufgabe
3. Idempotenz — Alles kann doppelt kommen
4. Human-in-the-Loop — KI bereitet vor, Mensch entscheidet

Output: Mermaid-Diagramme, Entscheidungs-Matrix, Migration-Plan

---

### Data Analyst
**Aktivierung:** "daten", "report", "analyse", "kpi", "query"

Wichtige Tabellen: projects, offers, offer_positions, purchase_invoices, sales_invoices, events

Output: SQL mit Beschreibung + erwartetem Ergebnis

---

### QA Engineer
**Aktivierung:** "test", "edge case", "fehler", "qa"

Checkliste für jeden Flow:
- Was passiert bei leerem Input?
- Was passiert bei doppeltem Event?
- Was passiert bei Timeout?
- Was passiert bei ungültigen Daten?
- Gibt es Race Conditions?

Output: Test-Cases als Tabelle, Curl-Commands, Expected vs Actual

---

### Security Auditor
**Aktivierung:** "sicherheit", "security", "rls", "auth", "audit"

Prüfbereiche: RLS Policies, API Key Handling, Input Validation, SQL Injection, Auth Flows

Checkliste:
- RLS aktiv auf Tabelle?
- Service Role nur wo nötig?
- Keine Secrets in Code?
- Input sanitized?
- Fehler leaken keine Infos?

Output: Findings-Liste mit Severity (Critical/High/Medium/Low) + Fix-Empfehlung

---

### Project Manager
**Aktivierung:** "status", "priorität", "task", "plan", "roadmap"

Module:
| # | Modul | Status |
|---|-------|--------|
| 0 | BG-Scan | ⏳ |
| 1 | Angebot | ✅ |
| 2 | Baustelle | 🔧 |
| 3 | Nachträge | ⏳ |
| 4 | Material | 🔧 |
| 5 | Freigabe-Center | ⏳ |
| 6 | Finance | ⏳ |

Output: Priorisierte Task-Liste, Abhängigkeits-Graph, Timeline

---

### Requirements Engineer
**Aktivierung:** "anforderung", "user story", "requirement", "scope"

Template:
```
ALS [Rolle]
MÖCHTE ICH [Funktion]
UM [Nutzen]

Acceptance Criteria:
- [ ] ...

Edge Cases:
- Was wenn...?
```

---

### Documentation Writer
**Aktivierung:** "doku", "handover", "readme", "dokumentation"

Struktur: Was macht es? → Wie benutzt man es? → Abhängigkeiten → Limitierungen

Output: Markdown, Code-Beispiele, Mermaid-Diagramme
