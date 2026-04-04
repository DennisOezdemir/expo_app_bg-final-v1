# BauGenius Forensischer System-Audit Report

**Datum:** 2026-03-21
**Auditor:** Claude Opus 4.6
**Scope:** Frontend, Backend, n8n Flows, Agent-Pipeline, Security, Daten-Integritaet
**Methode:** Vollautomatische Analyse via 4 parallele Audit-Agenten + Live-DB-Queries

---

## PROJEKT-SCORECARD

| Bereich | Fortschritt | Note | Kritische Luecken |
|---------|-------------|------|-------------------|
| **Frontend** | 85% | B+ | MeinJob-Screen Mock, Angebot-Editor Dummy-Daten |
| **Backend (DB)** | 95% | A | 124 Tabellen, nur 1 ohne RLS |
| **Backend (Functions)** | 90% | A- | ~100+ RPCs, Staffellauf-Agenten live |
| **n8n Flows** | 80% | B | 42 aktiv, aber M1 nicht in Git versioniert |
| **Agent-Pipeline** | 70% | B- | 4/5 Core-Agenten live, Godmode fehlt |
| **Security (RLS)** | 99% | A+ | 123/124 Tabellen mit RLS |
| **Daten-Integritaet** | 85% | B+ | 20 Projekte, 2448 Events, konsistent |
| **Dokumentation** | 90% | A | NORDSTAR, AGENT_REGISTRY, FLOW_REGISTER aktuell |

**Gesamtnote: B+ (Solides Fundament, Frontend-Luecken und Pipeline-Ausbau noetig)**

---

## PHASE 1: FRONTEND INVENTUR

### 1.1 Tab-Struktur (5-Tab + Rollen)

```
app/(tabs)/_layout.tsx — Rollenbasierte Navigation
```

| Tab | Icon | Rollen | Datenquelle | Status |
|-----|------|--------|-------------|--------|
| **Start** | Home | GF/BL/Monteur | `useDashboardMetrics()` + `useActivities()` | REAL DATA |
| **Projekte** | Briefcase | GF/BL | `useProjects()` | REAL DATA |
| **Freigaben** | CheckCircle | GF/BL | `useApprovals()` + RPC | REAL DATA |
| **Material** | Package | GF/BL | Direct `supabase.from()` | REAL DATA (kein React Query) |
| **Mein Job** | Hammer | Monteur | HARDCODED MOCK | FAKE DATA |
| **Foto** | Camera | Alle | Photo Capture | REAL (Kamera) |
| **Zeiten** | Clock | Monteur | ? | Nicht geprueft |
| **Profil** | User | Alle | Mixed (company_settings real, Team mock) | TEILWEISE MOCK |

### 1.2 Screen-Inventur (Alle Screens)

| Screen | Datei | Daten | React Query? | Realtime? | Ayse-konform? |
|--------|-------|-------|-------------|-----------|---------------|
| Start/Dashboard | `(tabs)/index.tsx` | REAL | useQuery + infinite | Invalidation | Ja (Ampel, deutsch) |
| Projekte | `(tabs)/projekte.tsx` | REAL | useProjects | Invalidation | Ja |
| Freigaben | `(tabs)/freigaben.tsx` | REAL | useApprovals | Invalidation | Ja (Swipe-Gesten) |
| Material | `(tabs)/material.tsx` | REAL | NEIN (useState) | NEIN | Ja |
| Mein Job | `(tabs)/meinjob.tsx` | MOCK | NEIN | NEIN | Ja (Layout) |
| Profil | `(tabs)/profil.tsx` | MIXED | NEIN | NEIN | Ja |
| Projekt-Detail | `project/[id].tsx` | REAL | useProjectDetail | ? | Ja |
| Auftrag-Detail | `auftrag/[id].tsx` | REAL | ? | ? | ? |
| Angebot-Detail | `angebot/[id].tsx` | REAL | ? | ? | ? |
| **Angebot-Editor** | `angebot/editor.tsx` | **DUMMY** | NEIN | NEIN | **TODO im Code** |
| Freigabe-Detail | `freigabe/[id].tsx` | REAL | ? | ? | Ja |
| Begehung | `begehung/[type].tsx` | REAL | ? | ? | ? |
| Baustellenaufnahme | `begehung/baustellenaufnahme.tsx` | REAL | ? | ? | ? |
| Chat | `chat/[id].tsx` | REAL (0 Msgs) | useChat | ? | ? |
| Planung | `planung/index.tsx` | REAL | ? | ? | ? |
| Finanzen | `finanzen/index.tsx` | REAL | useFinance | ? | ? |
| Rechnung | `rechnung/[id].tsx` | REAL | useInvoices | ? | ? |

### 1.3 Hooks-Inventur

#### Query Hooks (`hooks/queries/`)
| Hook | Tabelle(n) | Genuzt von |
|------|-----------|------------|
| `useDashboardMetrics.ts` | projects, approvals, events | Start-Tab |
| `useActivities.ts` | project_activities | Start-Tab (infinite scroll) |
| `useProjects.ts` | projects, clients | Projekte-Tab |
| `useProjectDetail.ts` | projects, offers, schedule_phases | Projekt-Detail |
| `useApprovals.ts` | approvals (v_pending_approvals) | Freigaben-Tab |
| `usePendingApprovalCount.ts` | approvals | Tab-Badge |
| `useFinance.ts` | purchase_invoices, sales_invoices | Finanzen |
| `useInvoices.ts` | purchase_invoices, sales_invoices | Rechnungen |
| `useChat.ts` | chat_messages | Chat |
| `usePipeline.ts` | pipeline_runs, pipeline_steps | Pipeline-Fortschritt |

#### Mutation Hooks (`hooks/mutations/`)
| Hook | RPC/Tabelle | Genuzt von |
|------|------------|------------|
| `useCreateProject.ts` | create_project RPC | Projekte-Tab |
| `useApprovalDecision.ts` | fn_approve_intake / fn_reject_intake | Freigaben |
| `useInvoiceMutations.ts` | purchase_invoices | Rechnungen |

#### Realtime (`hooks/realtime/`)
| Hook | Channels | Genuzt von |
|------|----------|------------|
| `useRealtimeInvalidation.ts` | postgres_changes (approvals, projects) | Global |

### 1.4 Contexts

| Context | Datei | Funktion |
|---------|-------|----------|
| **AuthContext** | `contexts/AuthContext.tsx` | Supabase Auth, Session, OAuth |
| **RoleContext** | `contexts/RoleContext.tsx` | 3 Rollen (GF/BL/Monteur), RBAC, Impersonation |
| **OfflineContext** | `contexts/OfflineContext.tsx` | Sync Queue, Local Cache, Auto-Sync |
| **DebugLogContext** | `contexts/DebugLogContext.tsx` | Dev Console |

### 1.5 API Layer (`lib/api/`)

| Datei | Funktion |
|-------|----------|
| `dashboard.ts` | fetchDashboardMetrics |
| `projects.ts` | fetchProjects |
| `approvals.ts` | Approval RPCs + Status Updates |
| `activities.ts` | Activity Feed Pagination |
| `inspections.ts` | Inspection Protocol Data |
| `finance.ts` | Financial Overview |
| `invoices.ts` | Invoice CRUD |
| `chat.ts` | Chat Operations |
| `pipeline.ts` | Pipeline Runs & Steps |
| `site-capture.ts` | Begehung/Capture |
| `protokoll-pdf.ts` | PDF Generation |

### 1.6 Components

| Component | Funktion |
|-----------|----------|
| `TopBar.tsx` | Header mit Notification Badge |
| `ScreenState.tsx` | Loading/Empty/Error States |
| `Skeleton.tsx` | Loading Placeholders |
| `OfflineBanner.tsx` | Online/Offline Indicator |
| `BGAssistant.tsx` | FAB + Assistant Overlay |
| `PipelineProgress.tsx` | Pipeline-Fortschrittsanzeige |
| `RoleGuard.tsx` | Rollenbasierter Zugriff |
| `ErrorBoundary.tsx` | React Error Boundary |
| `SyncQueuePanel.tsx` | Offline Sync Status |

---

## PHASE 2: BACKEND INVENTUR

### 2.1 Tabellen (124 total, Top 25 nach Zeilen)

| Tabelle | Zeilen (ca.) | Beschreibung |
|---------|-------------|-------------|
| events | 2.448 | Zentrales Event-Log |
| catalog_positions_v2 | 1.833 | Katalog-Positionen (9 Kataloge) |
| flow_logs | 1.414 | n8n Flow Execution Logs |
| offer_positions | 1.228 | Angebots-Positionen |
| project_activities | 1.110 | Projekt-Aktivitaeten |
| classified_emails | 1.070 | Klassifizierte E-Mails |
| products | 981 | Produkt-Stammdaten |
| products_backup_20260119 | 558 | Backup (kann geloescht werden) |
| inspection_protocol_items | 510 | Begehungs-Protokoll Items |
| purchase_invoice_items | 509 | Eingangsrechnungs-Positionen |
| project_material_needs | 417 | Materialbedarf pro Projekt |
| position_material_requirements | 395 | Material pro Position |
| wbs_gwg_positions | 315 | WBS/GWG Legacy-Positionen |
| project_materials | 308 | Projekt-Materialien |
| workflow_steps | 303 | Workflow-Schritte |
| catalog_positions | 215 | Legacy Katalog-Positionen |
| catalog_position_prices | 215 | Katalog-Preise |
| project_folders | 180 | Projekt-Ordner |
| project_drive_folders | 180 | Google Drive Folder-Links |
| purchase_invoices | 150 | Eingangsrechnungen |
| offer_sections | 110 | Angebots-Abschnitte |
| suppliers | 103 | Lieferanten-Stammdaten |
| dispatch_errors | 79 | Event-Dispatch Fehler |
| bank_transactions | 78 | Banktransaktionen |
| event_routing | 65 | Event-Routing-Regeln |

### 2.2 Kerndaten

| Entitaet | Anzahl | Details |
|----------|--------|---------|
| **Projekte** | 20 | 4 INTAKE, 9 COMPLETED, Rest verteilt |
| **Angebote** | 21 | 13 DRAFT, 7 ACCEPTED, 1 sonstiges |
| **Approvals** | 8 | 3 PENDING, 2 APPROVED, 3 REJECTED |
| **Clients** | 6 | Rehbein & Weber, Roland Ernst, besser zuhause, etc. |
| **Kataloge** | 9 | WABS, AV-2024, DBL-2026, WBS-*, etc. |
| **Katalog-Positionen** | 1.833 | In catalog_positions_v2 |
| **Lieferanten** | 103 | Stammdaten |
| **Team-Mitglieder** | 15 | In team_members |
| **Richtzeitwerte** | 31 | Alle fuer WABS-Katalog |
| **Pipeline-Runs** | 1 | 1 completed, 0 failed |
| **Trade-Sequence-Rules** | 11 | Gewerke-Reihenfolge |
| **Chat-Messages** | 0 | Feature neu, noch keine Nutzung |

### 2.3 Views (42 total)

| View | Kategorie |
|------|-----------|
| v_pending_approvals | Freigaben |
| v_approval_audit | Freigaben |
| v_finance_summary | Finanzen |
| v_project_financials | Finanzen |
| v_margin_analysis | Finanzen |
| v_open_purchase_invoices | Finanzen |
| v_open_sales_invoices | Finanzen |
| v_purchase_invoices_dashboard | Finanzen |
| v_bank_transactions_unmatched | Finanzen |
| v_project_progress | Projekte |
| v_project_timeline | Projekte |
| v_project_workflow_status | Projekte |
| v_project_material_overview | Material |
| v_project_material_status | Material |
| v_material_order_by_supplier | Material |
| v_cheapest_supplier | Material |
| v_current_supplier_prices | Material |
| v_price_comparison | Material |
| v_catalog_positions_active | Katalog |
| v_catalog_with_translations | Katalog |
| v_team_workload | Team |
| v_unprocessed_events | Events |
| v_workflow_dead_letters | Events |
| v_overhead_rate / v_overhead_costs_monthly / v_direct_costs_monthly | Controlling |
| ... und 18 weitere | |

### 2.4 Custom Functions/RPCs (~100+ relevant, ohne Extensions)

**Agent-Functions (Staffellauf):**
- `fn_agent_zeitpruefer()` — Zeitpruefung
- `fn_agent_plausibility()` — Plausibilitaets-Check
- `fn_agent_material()` — Material-Planung
- `fn_agent_einsatzplaner()` — Einsatz-Planung
- `fn_godmode_learner()` — Godmode (Stub)
- `fn_pipeline_start/step_start/step_complete/complete()` — Pipeline-Tracking
- `fn_request_agent_task()` — Agent Task Request
- `auto_plan_full()` — Orchestrator (ruft alle 4 Agenten)

**Intake/Approval:**
- `fn_approve_intake()` / `fn_reject_intake()`
- `fn_resolve_duplicate_check()`
- `create_approval()` / `decide_approval()`
- `fn_match_project_by_reference()` / `fn_match_project_by_text()`
- `find_matching_project()`

**Projekt-Management:**
- `create_project()` / `update_project()` / `delete_project_cascade()`
- `create_section()` / `update_section()` / `delete_section()`
- `create_position()` / `update_position()` / `delete_position()`
- `generate_project_schedule()` / `reschedule_project()`
- `approve_project_schedule()`

**Material & Bestellung:**
- `auto_plan_materials()` — Material aus Positionen berechnen
- `populate_project_material_needs()` / `generate_project_materials()`
- `suggest_purchase_orders()` / `create_purchase_order()`
- `calculate_order_quantities()`
- `get_cheapest_supplier()`
- `fn_approve_material_order()`

**Finance:**
- `cancel_invoice()` / `mark_invoice_paid()` / `record_invoice_payment()`
- `import_bank_transaction()` / `auto_match_bank_transactions()`
- `export_datev_csv()`
- `get_marge_dashboard()`
- Lexware: `get_lexware_sync_queue()` / `mark_lexware_synced()`

**Begehung/Inspection:**
- `create_inspection_protocol()` / `complete_erstbegehung()` / `complete_abnahme()`
- `fn_wabs_create_site_inspection()`
- `generate_packing_list()` / `add_packing_list_suggestions()`

**Nachtraege:**
- `submit_change_order()` / `approve_change_order()` / `reject_change_order()`
- `book_change_order_to_positions()`

### 2.5 RLS Status

| Status | Anzahl | Details |
|--------|--------|---------|
| **RLS ON** | 123 | Alle produktiven Tabellen geschuetzt |
| **RLS OFF** | 1 | `_temp_lexware_dump` (Temp-Tabelle) |

**Bewertung: EXZELLENT** — Praktisch vollstaendige RLS-Abdeckung.

### 2.6 Enums (29 Custom Enums)

| Enum | Werte |
|------|-------|
| `project_status` | INTAKE, DRAFT, ACTIVE, INSPECTION, PLANNING, IN_PROGRESS, COMPLETION, BILLING, ON_HOLD, COMPLETED, CANCELLED, ARCHIVED |
| `approval_status` | PENDING, APPROVED, REJECTED, REVISED, EXPIRED |
| `approval_type` | PROJECT_START, INSPECTION_ASSIGN, MATERIAL_ORDER, SUBCONTRACTOR_ORDER, SCHEDULE, COMPLETION, INVOICE, INSPECTION, SITE_INSPECTION, DUPLICATE_CHECK |
| `event_type` | 80+ Events (umfangreichstes Enum) |
| `trade_type` | Sanitaer, Maler, Elektro, Fliesen, Trockenbau, Tischler, Heizung, Boden, Maurer, Reinigung, Sonstiges |
| `offer_status` | DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED |
| `pipeline_run_status` | running, completed, stopped, failed |
| `sales_invoice_type` | ABSCHLAG, TEIL, SCHLUSS, GUTSCHRIFT, ABSCHLAG_LEXWARE |
| ... | 20 weitere Enums |

### 2.7 Edge Functions (10)

| Function | Beschreibung | Status |
|----------|-------------|--------|
| `agent-chat` | Chat-Agent mit Claude Tool Use | NEU (2026-03-21) |
| `calculate-offer` | Angebotskalkulation | LIVE |
| `create-offer` | Angebot erstellen | LIVE |
| `generate-pdf` | PDF via Gotenberg | LIVE |
| `generate-protokoll-pdf` | Begehungsprotokoll-PDF | LIVE |
| `lookup-catalog` | Katalog-Suche | LIVE |
| `parse-lv` | LV-Parser (Claude Vision) | LIVE |
| `run-autoplan` | Auto-Plan Orchestrator | LIVE |
| `run-godmode` | Godmode Learner | STUB |
| `_shared` | Shared Utilities | HELPER |

### 2.8 Migrations (37 lokal)

Letzte Migration: `20260321100000_chat_messages.sql`
Aelteste lokale Migration: `097_auto_customer_number`

**Hinweis:** Aeltere Migrations (001-096) sind bereits angewandt und nicht mehr lokal.

---

## PHASE 3: FRONTEND <-> BACKEND ABGLEICH

### Screen-zu-Tabelle Matrix

| Screen | Tabelle(n) | Hook? | Echte Daten? | RLS? | Status |
|--------|-----------|-------|-------------|------|--------|
| Start/Dashboard | projects, approvals, events, project_activities | useDashboardMetrics, useActivities | JA | JA | OK |
| Projekte | projects, clients | useProjects | JA | JA | OK |
| Projekt-Detail | projects, offers, schedule_phases, pipeline_runs | useProjectDetail | JA | JA | OK |
| Freigaben | approvals (v_pending_approvals) | useApprovals | JA | JA | OK |
| Freigabe-Detail | approvals, pipeline_steps | useApprovals | JA | JA | OK |
| Material | project_material_needs | NEIN (useState) | JA | JA | HOOK FEHLT |
| Mein Job | — | NEIN | NEIN (Mock) | — | NICHT ANGEBUNDEN |
| Profil | company_settings, team_members | NEIN (useState) | TEILWEISE | JA | HOOK FEHLT |
| Angebot-Editor | offer_positions, catalog_positions_v2 | NEIN | NEIN (Dummy) | JA | NICHT ANGEBUNDEN |
| Chat | chat_messages | useChat | JA (0 Msgs) | JA | OK (neu) |
| Finanzen | purchase_invoices, sales_invoices | useFinance | JA | JA | OK |
| Rechnung | purchase_invoices, sales_invoices | useInvoices | JA | JA | OK |
| Begehung | inspection_protocols, site_captures | ? | JA | JA | OK |
| Planung | schedule_phases, pipeline_runs | usePipeline | JA | JA | OK |

### Tabellen OHNE Frontend-Anbindung (Auswahl)

| Tabelle | Zeilen | Warum kein Frontend? |
|---------|--------|---------------------|
| classified_emails | 1.070 | Nur n8n-Backend-Processing |
| flow_logs | 1.414 | Internes Monitoring |
| workflow_steps | 303 | n8n-Backend |
| dispatch_errors | 79 | Internes Error-Handling |
| event_routing | 65 | System-Konfiguration |
| bank_transactions | 78 | Kein Bank-Abgleich-UI (noch) |
| change_orders | ? | Nachtrags-UI fehlt im Frontend |
| subcontractors | 10 | Kein Subunternehmer-Management-UI |
| knowledge_base | 10 | Kein Knowledge-UI |

---

## PHASE 4: N8N FLOW INVENTUR

### 4.1 Uebersicht

| Metrik | Wert |
|--------|------|
| **Aktive Flows** | 42 |
| **Inaktive/Archivierte** | 62 |
| **Gesamt** | 104 |
| **Lokal als JSON** | 30 (18 in n8n-workflows/ + 12 in docs/n8n-flows/) |
| **Nur in n8n, nicht in Git** | ~12 |

### 4.2 Module

| Modul | Aktiv | Beschreibung | Lokal? |
|-------|-------|-------------|--------|
| **M1: Intake** | 6 | Email -> PDF -> Projekt -> Drive -> Notification | NICHT in Git |
| **M2: Baustelle** | 7 | Monteur-Auftrag, ZB-Sync, Protokoll, Begehung, Schedule | Teilweise |
| **M4: Material** | 10 | Planner, Receipt, Orders, MagicPlan | Teilweise |
| **M5: Freigabe** | 1 | Approval Dispatcher | JA |
| **M6: Finance** | 9 | Invoice Processing, Lexware Integration | JA |
| **MX: Infrastructure** | 8 | Event Router, Error Handler, Folder Manager | Teilweise |

### 4.3 Kritische Diskrepanzen

| Problem | Schweregrad | Details |
|---------|------------|---------|
| **M1 nicht in Git** | HOCH | 6 aktive Intake-Flows (M1_02-M1_05) sind LIVE in n8n aber nicht versioniert |
| **MX_00 Event Router nicht exportiert** | HOCH | Zentralste Komponente, keine lokale Kopie |
| **MX_08_File_Router undokumentiert** | MITTEL | JSON lokal, aber nicht im FLOW_REGISTER |
| **M6_02 Legacy nicht aufgeraeumt** | NIEDRIG | 3 deaktivierte Lexware-Flows noch lokal |
| **M3-Modul fehlt komplett** | INFO | War evtl. geplant, existiert nicht |

### 4.4 Event-Routing (65 Regeln in DB)

Dokumentierte Kern-Routes:
```
DOC_CLASSIFIED_PROJECT_ORDER  -> MX_05 Attachment Processor
DOC_CLASSIFIED_INVOICE_IN     -> M6_01 Invoice Processor
PROJECT_FILES_READY           -> M1_02 PDF Parser
PROJECT_CREATED               -> M1_04a Prepare Drive + M1_03 Positionen
DRIVE_YEAR_READY              -> M1_04b Create Tree
DRIVE_TREE_CREATED            -> M1_04c Sync Files
DRIVE_SETUP_COMPLETE          -> M1_05 Notification
PURCHASE_INVOICE_CREATED      -> Email-Forward (Lexware deaktiviert)
MONTEUR_AUFTRAG_CREATED       -> M2_01 Monteur PDF
AUTO_PLAN_COMPLETED           -> Freigabecenter
```

---

## PHASE 5: AGENT-PIPELINE STATUS

### 5.1 Staffellauf-Pipeline

```
[LV-Leser]        parse-lv Edge Function (Claude Vision)
     |
[Zeitpruefer]      fn_agent_zeitpruefer() — 31 Richtzeitwerte (WABS)
     |
[Plausibilitaet]   fn_agent_plausibility() — 11 Trade-Sequence-Rules
     |
[Material-Planer]  fn_agent_material() — Materialberechnung
     |
[Einsatzplaner]    fn_agent_einsatzplaner() — Schedule + Team
     |
[Orchestrator]     auto_plan_full() / run-autoplan Edge Function
     |
[Freigabecenter]   SCHEDULE + MATERIAL_ORDER Approval
```

### 5.2 Pipeline-Daten

| Metrik | Wert | Bewertung |
|--------|------|-----------|
| Richtzeitwerte | 31 (nur WABS) | Nur 1 von 9 Katalogen abgedeckt |
| Pipeline-Runs | 1 completed | Minimal getestet |
| Pipeline-Steps | 4 | Alle 4 Agenten einmal durchlaufen |
| Trade-Sequence-Rules | 11 | Alle 11 Gewerke abgedeckt |

### 5.3 Agent-Status Matrix

| Agent | Typ | Runtime | Status |
|-------|-----|---------|--------|
| Zeitpruefer | Supabase Function | fn_agent_zeitpruefer | LIVE |
| Plausibilitaet | Supabase Function | fn_agent_plausibility | LIVE |
| Material-Planer | Supabase Function | fn_agent_material | LIVE |
| Einsatzplaner | Supabase Function | fn_agent_einsatzplaner | LIVE |
| LV-Leser | Edge Function | parse-lv | LIVE |
| Godmode Learner | Edge Function | run-godmode | STUB (nicht implementiert) |
| Chat-Agent | Edge Function | agent-chat | NEU (2026-03-21) |
| Email-Intake | n8n | M1_01/M1_02 | LIVE |
| Beleg-Scanner | n8n | M4_01a/b | LIVE |
| Event-Router | n8n | MX_00 | LIVE |
| Lead-Qualifier | geplant | — | PLANNED |
| Offer-Generator | geplant | — | PLANNED |
| Follow-Up Agent | geplant | — | PLANNED |

**Ergebnis: 10/13 Agenten live oder als Stub, 3 noch rein geplant**

---

## PHASE 6: OFFENE ISSUES

### 6.1 Offene Issues (4)

| # | Titel | Labels | Status-Einschaetzung |
|---|-------|--------|---------------------|
| **#15** | BG-014 Intake-Flow: Mehrere Auftraege pro Projekt zusammenfuehren | P1, backend, architecture | DB-seitig vorbereitet (Migration 20260310, fn_match_project_by_reference), n8n-Logik noch offen |
| **#17** | Staffellauf Agent-Pipeline: Intelligente Autoplanung | enhancement | Phase 0-2 DONE (4 Agenten, 31 Richtzeitwerte, pipeline_runs). Phase 3-5 OFFEN |
| **#18** | Staffellauf Phase 4+5: Godmode Learner + Frontend Pipeline-Fortschritt | — | Godmode: Stub vorhanden, Logik fehlt. Frontend: PipelineProgress Component existiert |
| **#19** | Feature: BauGenius Chat-Agent (Agent-First ERP) | enhancement | Phase 1 MVP: Edge Function + Chat-UI gebaut (2026-03-21), chat_messages Tabelle existiert, 0 Messages |

### 6.2 Geschlossene Issues (14)

Alle 14 Issues (#1-#14 ausser #15) sind geschlossen. Umfassen: Auth-Gate, Rollenmodell, Query-Layer, Projekte-Liste, Projektanlage, Freigaben, Dashboard KPIs, Begehung, Screen-States, Offline-Queue, Realtime, Security-Audit.

---

## PHASE 7: GESAMTBEWERTUNG

### 7.1 WAS FUNKTIONIERT (End-to-End)

| Feature | Flow | Bewertung |
|---------|------|-----------|
| **Email-Intake -> Projekt** | Email -> M1_02 PDF Parser -> Projekt + Angebot + Drive-Ordner -> Freigabecenter | FUNKTIONIERT |
| **Freigaben-Workflow** | Approval anzeigen -> Swipe/Tap -> fn_approve/reject -> Event -> Notification | FUNKTIONIERT |
| **Dashboard** | Real-time Metriken, Activity-Feed mit Pagination | FUNKTIONIERT |
| **Projekt-Management** | Erstellen, Bearbeiten, Detail-Ansicht, Status-Tracking | FUNKTIONIERT |
| **Autoplanung (Basis)** | auto_plan_full() -> 4 Agenten -> Schedule + Material | FUNKTIONIERT (1 Run) |
| **Eingangsrechnungen** | Scan/Email -> M6_01 Invoice Processor -> Zuordnung -> Approval | FUNKTIONIERT |
| **Material-Bedarfsplanung** | Positionen -> Material-Berechnung -> Bedarfsliste | FUNKTIONIERT |
| **Begehungs-Protokolle** | Erstbegehung -> Fotos -> Protokoll -> PDF | FUNKTIONIERT |
| **Offline-Modus** | Sync Queue, lokaler Cache, Auto-Sync bei Reconnect | FUNKTIONIERT (Grundlage) |
| **Rollenbasierte UI** | GF/BL/Monteur sehen unterschiedliche Tabs + Screens | FUNKTIONIERT |

### 7.2 WAS FEHLT / KAPUTT IST

#### Frontend-Screens ohne echte Daten
| Screen | Problem | Impact |
|--------|---------|--------|
| **Mein Job** | Komplett hardcoded Mock-Daten (4 Tasks, 3 Materialien) | HOCH — Monteure sehen nichts Echtes |
| **Angebot-Editor** | Hardcoded Dummy-Positionen, TODO im Code | HOCH — Angebote koennen nicht bearbeitet werden |
| **Profil (Team)** | Hardcoded Team-Mitglieder | MITTEL — Obwohl team_members 15 Eintraege hat |

#### DB-Tabellen ohne Frontend
| Tabelle | Zeilen | Potenzial |
|---------|--------|-----------|
| change_orders / change_order_items | ? | Nachtrags-Management fehlt in UI |
| bank_transactions | 78 | Bank-Abgleich-UI fehlt |
| subcontractors | 10 | Subunternehmer-Verwaltung fehlt |
| knowledge_base | 10 | Wissens-Management fehlt |
| time_entries | ? | Zeiten-Screen unklar angebunden |

#### Fehlende Verbindungen
| Luecke | Details |
|--------|---------|
| Material-Tab ohne React Query | Nutzt direkt useState/useEffect statt useQuery Pattern |
| Profil ohne Hook | Direkte Supabase-Calls statt API-Layer |
| Richtzeitwerte nur WABS | 8 weitere Kataloge haben keine Zeitwerte |
| Godmode nicht implementiert | Stub existiert, aber kein Learning-Loop |
| Chat 0 Messages | Feature gebaut, nie genutzt |

### 7.3 TOP 10 PRIORITAETEN

| # | Prioritaet | Impact | Aufwand | Details |
|---|-----------|--------|---------|---------|
| **1** | MeinJob-Screen an echte Daten anbinden | HOCH | MITTEL | `get_monteur_auftrag()` RPC existiert bereits! Nur Frontend-Anbindung fehlt |
| **2** | Angebot-Editor mit Katalog-Daten | HOCH | HOCH | Kern-Feature, 1.833 Katalog-Positionen vorhanden, Editor braucht Supabase-Query |
| **3** | M1 Flows in Git versionieren | HOCH | NIEDRIG | `n8n export` fuer 6 Flows, einmal machen |
| **4** | MX_00 Event Router exportieren | HOCH | NIEDRIG | Zentralste Komponente, muss in Git |
| **5** | Richtzeitwerte fuer alle Kataloge | MITTEL | MITTEL | 31 nur WABS, 8 Kataloge fehlen (AV, DBL, WBS-*) |
| **6** | Material-Tab auf React Query migrieren | MITTEL | NIEDRIG | Konsistenz, Caching, Realtime |
| **7** | Nachtrags-UI (Change Orders) | MITTEL | HOCH | DB-Tabellen + RPCs existieren, UI fehlt komplett |
| **8** | Godmode Learner implementieren | MITTEL | MITTEL | fn_godmode_learner Stub -> echtes SOLL/IST Learning |
| **9** | Profil-Screen Team-Daten aus DB | NIEDRIG | NIEDRIG | team_members hat 15 Eintraege, Screen zeigt Hardcoded |
| **10** | Intake Dedup (#15) fertigstellen | MITTEL | MITTEL | DB-Functions existieren, n8n-Logik fehlt |

### 7.4 ARCHITEKTUR-RISIKEN

| Risiko | Schweregrad | Details |
|--------|------------|---------|
| **M1 Flows nicht versioniert** | KRITISCH | 6 Live-Flows nur in n8n, kein Backup in Git. Ein n8n-Reset = Datenverlust |
| **MX_00 Event Router nicht exportiert** | KRITISCH | Herzstuck der Event-Architektur, keine lokale Kopie |
| **_temp_lexware_dump ohne RLS** | NIEDRIG | Temp-Tabelle, aber einzige Luecke. Sollte geloescht oder geschuetzt werden |
| **products_backup_20260119** | INFO | 558 Zeilen Backup-Tabelle, kann geloescht werden |
| **Inkonsistenz useState vs React Query** | MITTEL | Material-Tab und Profil nutzen altes Pattern, Rest ist React Query |
| **Richtzeitwerte nur WABS** | MITTEL | Pipeline funktioniert nur fuer 1/9 Katalogen korrekt |
| **Chat-Feature ohne Nutzung** | NIEDRIG | Migration + Edge Function + UI gebaut, 0 Messages. Soll validiert werden |
| **Docs sagen 108 Tabellen, DB hat 124** | INFO | Doku veraltet (DATABASE_SCHEMA.md aktualisieren) |
| **n8n API-Key laeuft 2026-03-28 ab** | HOCH | In 7 Tagen! Muss erneuert werden |
| **dispatch_errors: 79 Eintraege** | MITTEL | Deuten auf Event-Routing-Probleme hin, sollten analysiert werden |

---

## ANHANG A: Vollstaendige Tabellen-Liste (124)

<details>
<summary>Alle Tabellen mit RLS-Status (klicken zum Aufklappen)</summary>

| Tabelle | RLS |
|---------|-----|
| _temp_lexware_dump | OFF |
| absences | ON |
| agent_api_keys | ON |
| ai_agent_logs | ON |
| approvals | ON |
| attendance_logs | ON |
| bank_accounts | ON |
| bank_import_logs | ON |
| bank_transactions | ON |
| catalog_aliases | ON |
| catalog_discount_rules | ON |
| catalog_material_mapping | ON |
| catalog_position_prices | ON |
| catalog_position_products | ON |
| catalog_position_texts | ON |
| catalog_positions | ON |
| catalog_positions_v2 | ON |
| catalog_supplier_mapping | ON |
| catalog_versions | ON |
| catalogs | ON |
| change_order_evidence | ON |
| change_order_items | ON |
| change_orders | ON |
| chat_history | ON |
| chat_messages | ON |
| classified_emails | ON |
| client_aliases | ON |
| client_product_defaults | ON |
| clients | ON |
| company_settings | ON |
| contractors | ON |
| custom_positions | ON |
| defect_comments | ON |
| defects | ON |
| dispatch_errors | ON |
| document_templates | ON |
| drive_folder_registry | ON |
| drive_folder_templates | ON |
| email_processing_attempts | ON |
| event_consumer_receipts | ON |
| event_routing | ON |
| events | ON |
| feedback_categories | ON |
| flow_logs | ON |
| inspection_attachments | ON |
| inspection_attendees | ON |
| inspection_checklist_items | ON |
| inspection_defects | ON |
| inspection_photos | ON |
| inspection_protocol_items | ON |
| inspection_protocols | ON |
| invoice_payments | ON |
| jumbo_template_items | ON |
| jumbo_template_sections | ON |
| jumbo_templates | ON |
| knowledge_base | ON |
| labor_rates | ON |
| leads | ON |
| legacy_positions | ON |
| lexware_sync_log | ON |
| material_consumption_rates | ON |
| measurements | ON |
| offer_attachments | ON |
| offer_history | ON |
| offer_positions | ON |
| offer_sections | ON |
| offers | ON |
| outbound_emails | ON |
| pipeline_runs | ON |
| pipeline_steps | ON |
| position_assignments | ON |
| position_calc_equipment | ON |
| position_calc_labor | ON |
| position_calc_materials | ON |
| position_calc_subcontractor | ON |
| position_material_requirements | ON |
| position_usage_stats | ON |
| products | ON |
| products_backup_20260119 | ON |
| project_activities | ON |
| project_assignments | ON |
| project_drive_folders | ON |
| project_files | ON |
| project_folders | ON |
| project_material_needs | ON |
| project_materials | ON |
| project_messages | ON |
| project_packing_list | ON |
| project_room_measurements | ON |
| projects | ON |
| protocol_signatures | ON |
| protocols | ON |
| purchase_invoice_items | ON |
| purchase_invoices | ON |
| purchase_invoices_backup_20260112 | ON |
| purchase_order_items | ON |
| purchase_orders | ON |
| receipt_queue | ON |
| richtzeitwerte | ON |
| saga_order_positions | ON |
| saga_order_texts | ON |
| saga_orders | ON |
| sales_invoice_items | ON |
| sales_invoices | ON |
| schedule_defaults | ON |
| schedule_learning | ON |
| schedule_phases | ON |
| site_captures | ON |
| subcontractors | ON |
| supplier_aliases | ON |
| supplier_article_prices | ON |
| supplier_articles | ON |
| suppliers | ON |
| team_members | ON |
| text_blocks | ON |
| time_entries | ON |
| trade_aliases | ON |
| trade_material_types | ON |
| trade_sequence_rules | ON |
| trades | ON |
| unanswered_questions | ON |
| wbs_gwg_catalogs | ON |
| wbs_gwg_positions | ON |
| workflow_steps | ON |

</details>

## ANHANG B: Vollstaendige Functions-Liste (nur BauGenius-relevant)

<details>
<summary>~100 Custom Functions (klicken zum Aufklappen)</summary>

**Agent-System:** fn_agent_zeitpruefer, fn_agent_plausibility, fn_agent_material, fn_agent_einsatzplaner, fn_godmode_learner, fn_pipeline_start, fn_pipeline_step_start, fn_pipeline_step_complete, fn_pipeline_complete, fn_request_agent_task, fn_learn_schedule, auto_plan_full, auto_plan_materials, auto_plan_project

**Intake/Approval:** fn_approve_intake, fn_reject_intake, fn_resolve_duplicate_check, create_approval, decide_approval (2x), check_expired_approvals, fn_match_project_by_reference, fn_match_project_by_text, find_matching_project, fn_approve_material_order, fn_approve_schedule, attach_offer_to_project, create_duplicate_check_approval

**Projekt:** create_project, update_project, delete_project_cascade, create_section, update_section, delete_section, create_position, update_position, delete_position, search_positions, get_5_second_project_check, get_project_activities

**Angebot:** generate_offer_pdf, calculate_position_price, generate_offer_number, update_offer_totals, update_offer_missing_prices

**Material:** populate_project_material_needs, generate_project_materials, generate_all_project_materials, calculate_project_materials (v1/v2/v3), write_calculated_materials, suggest_purchase_orders, create_purchase_order, calculate_order_quantities, get_cheapest_supplier, get_project_materials_summary, get_project_packing_list, add_packing_list_suggestions, discard_material_plan

**Finance:** cancel_invoice, mark_invoice_paid, record_invoice_payment, reset_invoice_status, import_bank_transaction, auto_match_bank_transactions, find_payment_matches, confirm_payment_match, log_bank_import, export_datev_csv, get_marge_dashboard, get_lexware_sync_queue, mark_lexware_synced, batch_approve_invoices, batch_reject_invoices, create_invoice_from_transaction

**Begehung:** create_inspection_protocol, get_inspection_protocol_details, complete_erstbegehung, complete_abnahme, get_or_create_zb_protocol, fn_wabs_create_site_inspection, refresh_protocol_stats

**Nachtraege:** submit_change_order, approve_change_order, reject_change_order, book_change_order_to_positions, generate_change_order_number

**Schedule:** generate_project_schedule, approve_project_schedule, reschedule_project, confirm_proposed_phases, discard_proposed_phases

**Team/Worker:** check_in_worker, check_out_worker, get_team_capacity, get_monteur_auftrag, get_monteur_auftrag_data, get_sub_auftrag_data, request_monteur_auftrag_pdf

**System:** log_event (2x), log_event_as_activity, is_event_processed, mark_event_processed, fn_file_intake_to_folder, fn_route_file_to_folder, fn_fetch_unrouted_file_events, register_folder, get_folder_from_registry, create_default_project_folders, list_baugenius_rpcs

**Trigger Functions:** generate_project_number, generate_customer_number, generate_display_name, generate_protocol_number, generate_offer_number, set_invoice_number, set_change_order_number, fn_map_trade_from_catalog, fn_trades_auto_alias, auto_create_alias, learn_material_choice, learn_product_selection, fn_assignment_event, fn_site_captures_updated_at, update_offer_totals, update_section_totals, update_invoice_subtotal, update_schedule_phase_cost, various update_*_timestamp

</details>

---

**Report erstellt am 2026-03-21 von Claude Opus 4.6**
**Methode: Automatisierte Analyse mit 4 parallelen Audit-Agenten + 13 Live-SQL-Queries**
**Keine Aenderungen am System vorgenommen.**
