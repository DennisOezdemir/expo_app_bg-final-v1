# BauGenius — Aktueller Kontext (Stand 2026-03-31)

> Dieses File wird nach jeder Session aktualisiert. Lies es KOMPLETT bevor du an einem Issue arbeitest.

---

## Was gerade läuft

### Expo App (dieses Repo)
- **Status**: Verschlankung abgeschlossen (Phase 1-6 done). App ist Baustellen-App für Monteure/BL.
- **Nächster Schritt**: iOS Native Deploy (Issue #59, Deadline 05.04.2026)
- **Farbe**: Electric Blue `#4D4DFF` (war vorher Orange/Amber)
- **Tabs**: Start, Projekte, Planung, Profil (4 Tabs)
- **GF-Rolle gibt es NICHT** in der App — wird als BL gemappt

### AgentView (separates Repo: `v0-agent-dashboard-layout`)
- **Status**: UI-Templates fertig (28 Views, Mock-Daten). Noch keine Supabase/Claude Anbindung.
- **Nächster Schritt**: Supabase Client + Claude API Agent verdrahten
- **NICHT in dieses Repo mergen** — bleibt getrennt

---

## Architektur-Entscheidungen (chronologisch)

### 2026-03-24: Offer Assistant
- Generischer Agent-Kern gebaut: `agent_threads`, `agent_messages`, `agent_observations`, `memory_entries`, `llm_providers`
- Edge Function `offer-assistant` mit Batch-Generierung + Approve/Edit/Reject Flow
- `_shared/llm-router.ts` — Provider-agnostisch (Claude/Gemini/Local), priority-basiert
- Godmode Text Learner: `fn_learn_from_offer_sessions`, `fn_export_training_data`

### 2026-03-28: Expo Verschlankung
- 4 Tabs statt 8 (Material, Foto, Freigaben, MeinJob, Zeiten → hidden)
- Chat projektgebunden: FAB nur in `/project/[id]`, kein allgemeiner Chat
- GF → BL gemappt in RoleContext
- Quick-Actions: Material, Nachtrag, Chat → alle öffnen Agent-Chat
- Projektseite = Logbuch (Nachrichten → Fotos → Nachträge → Dokumente, read-only)
- Agent-Chat: System-Prompt tool-first, query_positions über offers JOIN gefixt
- Neue Tools: request_material, request_tool, search_projects, remember
- Monteur darf Nachträge melden (HITL: Monteur meldet → GF genehmigt im AgentView)
- project_sessions Tabelle für Session-Tracking
- user_feedback Tabelle + Feedback-Button in TopBar

### 2026-03-29: Katalog-Bereinigung
- AV-2024: 215 Positionen mit Beschreibungen aus PDF importiert, 17 neue, 26 alte deaktiviert
- WABS: 220 Positionen mit Beschreibungen aus PDF importiert, 20 neue, 15 alte deaktiviert
- Automatischer Preis-Sync: Trigger `trg_sync_catalog_price` + Batch `fn_update_catalog_prices_from_offer`
- Lupinenacker neu importiert: A-2026-132 (AV, 30 Pos), A-2026-133 (WABS, 82 Pos)
- `price_updated_at` Spalte auf catalog_positions_v2

### 2026-03-29: Design
- Electric Blue `#4D4DFF` ersetzt Orange/Amber überall
- BG Agent Button: Pill-Form mit Sparkles + "BG Agent" Label + Glow-Effekt
- Texte auf blauem Hintergrund: weiß

---

## Bekannte Probleme / Schulden

1. **Monster-Files**: `app/project/[id].tsx` (3400+ Zeilen), `app/begehung/[type].tsx` (2600+ Zeilen) — nur gezielt ändern
2. **Unicode-Escapes**: `app/foto/index.tsx` und `app/begehung/[type].tsx` haben noch `\u00E4` statt echte Umlaute
3. **EB-Protokoll PDF**: Fehler "Projekt nicht gefunden" (Issue #56)
4. **Chat-History**: Alte Nachrichten mit falschem user_id bleiben in der DB
5. **Alte GF-Home/BL-Home/Monteur-Home**: Toter Code in `app/(tabs)/index.tsx` — aufräumen wenn AgentView steht
6. **n8n Flows**: Viele tot oder fragwürdig. Intake-Flow (MX_03 → M1_02 → M1_03) funktioniert halbgar. Wird durch AgentView PDF-Intake ersetzt.
7. **13 offer_positions ohne Katalog-Beschreibung**: Betrifft Positionen ohne catalog_position_v2_id
8. **WBS-Boden + WBS-Fliesen Kataloge**: Haben keine Beschreibungen (kein PDF vorhanden)

---

## Prinzipien die wir etabliert haben

- **Hosenträger und Gürtel**: Nichts löschen bevor die Alternative steht
- **UI erst wenn Backend stabil**: Keine Zeit in UI-Polish solange Features gebaut werden
- **Chat ist das Aktions-Zentrum**: Monteur/BL fordert an → Agent erstellt Freigabe → GF entscheidet im AgentView
- **Der Agent IST die Navigation** (im AgentView): Kein Menü, kein Sidebar — ein Textfeld
- **Preise aus Aufträgen, nicht aus Katalog-PDFs**: Trigger aktualisiert automatisch
- **Jede Interaktion = Trainingsdaten**: agent_observations, memory_entries, quality_score

---

## Offene Issues nach Priorität

### P0 — Diese Woche
- **#59** iOS Native Deploy (Apple Developer Account nötig)

### P1 — Nächste Woche
- **#53** AgentView: Supabase + Claude API anbinden (separates Repo)
- **#58** Quick-Action Intent (Material/Nachtrag Auto-Prompt im Chat)
- **#52** Chat/Voice Angebotserstellung

### P2 — Danach
- **#54** Expo verschlanken Phase 2+3 (GF-Routen raus NACH AgentView)
- **#57** Team-Chat (Mensch-zu-Mensch)
- **#55** Feedback-Flow mit Agent
- **#56** EB-Protokoll PDF Bug

---

## Supabase Credentials

- **URL**: `https://yetwntwayhmzmhhgdkli.supabase.co`
- **Anon Key**: In `.env` (EXPO_PUBLIC_SUPABASE_ANON_KEY)
- **Service Role Key**: In `.env` (SUPABASE_SERVICE_ROLE_KEY) — NIE im Frontend
- **Auth User**: `info@deine-bauloewen.de` (ID: `627ec3d9-9414-4427-99ad-5c2a914c9e29`)

---

## Deploy-Checkliste

### Vercel (Web)
```bash
vercel --prod
```

### Edge Functions
```bash
supabase functions deploy agent-chat --project-ref yetwntwayhmzmhhgdkli
supabase functions deploy offer-assistant --project-ref yetwntwayhmzmhhgdkli
```

### Migrations
SQL im **Supabase Dashboard → SQL Editor** ausführen. CLI hat keine DDL-Rechte.

### iOS
```bash
eas build --platform ios --profile preview
eas submit --platform ios
```
