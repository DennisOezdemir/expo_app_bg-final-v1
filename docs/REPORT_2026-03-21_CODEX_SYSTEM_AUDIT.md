# CODEX SYSTEM AUDIT

Datum: 2026-03-21
Projekt: `expo_app_bg-final-v1`
Supabase Projekt-ID: `yetwntwayhmzmhhgdkli`
Modus: rein forensische Analyse, keine Produktcode-Aenderung

## Kurzfazit

Das Projekt ist **nicht leer und nicht nur UI-Fassade**. Die Kernbereiche `Projekte`, `Freigaben`, `Angebots-Editor`, `Begehung`, `Rechnungen`, `Finanzen` und die neue Agent-Pipeline sind technisch real an Supabase angebunden. Gleichzeitig ist das Gesamtbild **stark inkonsistent**: viele Monteur-/Admin-Screens sind noch Mock, die lokale n8n-Artefaktlage liegt deutlich hinter Register und Live-DB, der Repo-Typecheck ist kaputt, und die Security-Story ist eher "RLS an" als "RLS restriktiv".

Der staerkste positive Befund ist der **Staffellauf-/Pipeline-Backend-Stand**: live existieren `pipeline_runs`, `pipeline_steps`, `richtzeitwerte`, `trade_sequence_rules`, die zentralen RPCs sind deployed, und es gibt mindestens **einen echten completed Run** mit vier completed Steps. Der staerkste negative Befund ist die **Drift zwischen Code, lokalen Migrations, n8n-JSONs, Docs und live deploytem Schema**.

## Methodik und Grenzen

- Gelesen wurden:
  - 46 `app/*.tsx` Dateien
  - 14 Hook-Dateien unter `hooks/`
  - 11 API-Dateien unter `lib/api/`
  - 4 Contexts
  - 12 Components
  - 37 lokale SQL-Migrationen
  - 9 lokale Supabase Edge Functions
  - `docs/FLOW_REGISTER.md`, `docs/FLOW_ARCHITECTURE.md`, `docs/AGENT_REGISTRY.md`
  - 18 JSON-Dateien unter `n8n-workflows/`
  - 12 JSON-Dateien unter `docs/n8n-flows/`
  - `gh issue list --limit 30` plus `gh issue view` fuer alle 4 offenen Issues
  - Live-Supabase REST/OpenAPI und Live-Row-Counts per Service-Role
- Wichtige Grenze:
  - In dieser Session gab es **kein Supabase MCP `execute_sql` Tool**.
  - `information_schema.views`, `pg_tables` und `pg_stat_user_tables` waren ueber den verfuegbaren REST-Pfad nicht exposed.
  - Exakte SQL-Katalogabfragen und ein harter deployed-RLS-Dump pro Tabelle waren daher **nicht** moeglich.
  - Die Backend-Inventur basiert deshalb auf drei Beweisquellen:
    - deployed OpenAPI unter `/rest/v1/`
    - Live-HEAD-Counts pro public Relation
    - lokale Migrationen / lokale Flow-Dateien
- Zusatzeinschraenkung:
  - Ein exakter Vergleich `lokale Migrationen` vs. `deployed schema_migrations history` war ohne `SUPABASE_ACCESS_TOKEN` oder SQL-Zugriff nicht moeglich.
  - Ich konnte aber verifizieren, dass spaete Features wie `site_captures`, `pipeline_runs`, `pipeline_steps`, `richtzeitwerte` und `chat_messages` deployed vorhanden sind.

## 1. Projekt-Scorecard

| Bereich | Fortschritt | Kritische Luecken |
|---|---:|---|
| Frontend | 60% | Viele Screens mock/hybrid, direkte Supabase-Zugriffe statt konsistentem Query-Layer, Typecheck kaputt |
| Backend | 75% | Repo enthaelt nur Teil der Schemahistorie, starke Drift zwischen lokal und deployed |
| Flows / n8n | 35% | Register behauptet 42 aktive Flows, lokal liegen nur 18 echte Workflow-JSONs vor |
| Agent-Pipeline | 70% | Backend real und einmal erfolgreich gelaufen, aber wenig Live-Nutzung und kein sauber sichtbarer Orchestrator im Repo |
| Security | 55% | RLS lokal breit aktiviert, aber vielfach sehr permissiv (`USING (true)` / blanket authenticated access) |
| Daten-Integritaet | 60% | Kernobjekte vorhanden, aber Mock-Screens, Typfehler und lokale/deployed Drift erhoehen Risiko |

## 2. Phase 1: Frontend Inventur

### 2.1 Tabs in `app/(tabs)/_layout.tsx`

GF / Bauleiter:
- `index`
- `projekte`
- `freigaben`
- `material`
- `profil`

Monteur:
- `index`
- `meinjob`
- `foto`
- `zeiten`
- `profil`

Weitere Befunde im Tab-Layout:
- `usePendingApprovalCount()` liefert echtes Badge fuer `freigaben`.
- `useRealtimeInvalidation()` invalidiert `approvals` und `projects`.
- `BGAssistant` ist global eingeblendet, aber die Component selbst ist noch Mock-Demo-UI.

### 2.2 Screen-Gesamtbild

Real / weitgehend echt:
- `app/(tabs)/projekte.tsx`
- `app/(tabs)/freigaben.tsx`
- `app/(tabs)/material.tsx`
- `app/angebot/editor.tsx`
- `app/auftrag/[id].tsx`
- `app/begehung/[type].tsx`
- `app/begehung/baustellenaufnahme.tsx`
- `app/chat/[id].tsx`
- `app/finanzen/index.tsx`
- `app/freigabe/[id].tsx`
- `app/planung/index.tsx`
- `app/planung/[id].tsx`
- `app/project/[id].tsx`
- `app/rechnung/index.tsx`
- `app/rechnung/neu.tsx`
- `app/rechnung/[id].tsx`
- `app/einstellungen/firma.tsx`
- `app/einstellungen/kunden.tsx`
- `app/einstellungen/team.tsx`
- `app/assign-material.tsx`

Hybrid / teilweise echt:
- `app/(tabs)/index.tsx`
- `app/(tabs)/profil.tsx`
- `app/angebote/index.tsx`
- `app/chat/[id].tsx`

Noch klar mock / placeholder / lokal simuliert:
- `app/(tabs)/meinjob.tsx`
- `app/(tabs)/foto.tsx`
- `app/(tabs)/zeiten.tsx`
- `app/angebot/[id].tsx`
- `app/bestellung/index.tsx`
- `app/einstellungen/katalog.tsx`
- `app/einstellungen/lieferanten.tsx`
- `app/einstellungen/briefpapier.tsx`
- `app/einstellungen/import.tsx`
- `app/foto/index.tsx`
- `app/project/team.tsx`
- `components/BGAssistant.tsx` (globaler Assistant-FAB/Dialog)

### 2.3 Realtime im Frontend

Echte Realtime-Subscriptions wurden nur an wenigen Stellen gefunden:
- `app/(tabs)/_layout.tsx` via `useRealtimeInvalidation()` fuer `projects` und `approvals`
- `hooks/queries/useActivities.ts` fuer `project_activities`
- `hooks/queries/useChat.ts` fuer `chat_messages`

Nicht gefunden fuer:
- Planung
- Material
- Projekte-Detail
- Finanzen
- Rechnungen
- Angebot-Editor

### 2.4 Ayse-Konformitaet

Positiv:
- Fast alle Business-Screens haben deutsche Labels.
- Buttons sind ueberwiegend gross, touchbar und mobil gedacht.
- Ampel-/Signal-Farben werden konsistent genutzt (`emerald`, `amber`, `rose`).

Auffaellige Ausnahmen:
- `app/+not-found.tsx` ist komplett englisch und nicht Ayse-konform.
- Mehrere Monteur-/Admin-Screens sind zwar sprachlich deutsch, aber fachlich nur Mock.
- `components/BGAssistant.tsx` wirkt wie Demo-Overlay statt produktive Ayse-Arbeitsoberflaeche.

### 2.5 Hooks: Bestand und Luecken

Vorhandene Hook-Dateien:
- `hooks/queries/useActivities.ts` - Activities Feed, Infinite Query, Realtime
- `hooks/queries/useApprovals.ts` - Pending Approvals
- `hooks/queries/useChat.ts` - Chat-History + Send-Mutation + Realtime
- `hooks/queries/useDashboardMetrics.ts` - Dashboard Kennzahlen
- `hooks/queries/useFinance.ts` - Finance Overview / Controlling / offene Rechnungen
- `hooks/queries/useInvoices.ts` - Sales-Invoice Listen/Detail/Optionen/Textblocks
- `hooks/queries/usePendingApprovalCount.ts` - Badge Count
- `hooks/queries/usePipeline.ts` - Pipeline Run / Steps / Start / Readiness
- `hooks/queries/useProjectDetail.ts` - Projektdetail
- `hooks/queries/useProjects.ts` - Projektliste
- `hooks/mutations/useApprovalDecision.ts` - Approve / Reject
- `hooks/mutations/useCreateProject.ts` - Projektanlage
- `hooks/mutations/useInvoiceMutations.ts` - Invoice CRUD / Status
- `hooks/realtime/useRealtimeInvalidation.ts` - generische Query-Invalidation

Was fehlt:
- Kein Hook-Layer fuer `company_settings`, `clients`, `team_members`
- Kein Hook-Layer fuer `offers`, `offer_sections`, `offer_positions`, `catalogs`
- Kein Hook-Layer fuer `project_material_needs`, `project_materials`, `products`, `suppliers`
- Kein Hook-Layer fuer `schedule_phases`, `project_assignments`
- Kein Hook-Layer fuer `site_captures`
- Kein Hook-Layer fuer `purchase_orders`, `event_routing`, `dispatch_errors`, `change_orders`

### 2.6 `lib/api`: Bestand und Luecken

Vorhandene API-Dateien:
- `lib/api/activities.ts`
- `lib/api/approvals.ts`
- `lib/api/chat.ts`
- `lib/api/dashboard.ts`
- `lib/api/finance.ts`
- `lib/api/inspections.ts`
- `lib/api/invoices.ts`
- `lib/api/pipeline.ts`
- `lib/api/projects.ts`
- `lib/api/protokoll-pdf.ts`
- `lib/api/site-capture.ts`

Was fehlt:
- Kein `lib/api/settings.ts`
- Kein `lib/api/offers.ts`
- Kein `lib/api/materials.ts`
- Kein `lib/api/planning.ts`
- Kein `lib/api/suppliers.ts`
- Kein `lib/api/catalogs.ts`
- Kein `lib/api/orders.ts`
- Kein `lib/api/events.ts`
- Kein `lib/api/agents.ts`

### 2.7 Contexts

- `contexts/AuthContext.tsx` - Supabase Auth, Login, Social Login, Magic Link, Invite, Reset
- `contexts/RoleContext.tsx` - Rollenlogik, Berechtigungen, GF-Impersonation
- `contexts/OfflineContext.tsx` - Offline Queue / Sync / lokale Caches
- `contexts/DebugLogContext.tsx` - Debug-/Event-Log fuer Dev/Analyse

### 2.8 Components

- `components/BGAssistant.tsx`
- `components/DebugConsole.tsx`
- `components/DebugLogSeeder.tsx`
- `components/ErrorBoundary.tsx`
- `components/ErrorFallback.tsx`
- `components/KeyboardAwareScrollViewCompat.tsx`
- `components/OfflineBanner.tsx`
- `components/PipelineProgress.tsx`
- `components/RoleGuard.tsx`
- `components/ScreenState.tsx`
- `components/Skeleton.tsx`
- `components/SyncQueuePanel.tsx`
- `components/TopBar.tsx`

### 2.9 Harte Frontend-Befunde

- `app/planung/[id].tsx:31-43`
  - `showAlert()` ruft sich in der nativen Branch selbst rekursiv auf statt `Alert.alert`.
  - Das ist ein echter Laufzeitfehler.
- `app/(tabs)/index.tsx:167`
  - Activity-Navigation nutzt `/projekt/${id}`, im Router existiert aber `project/[id]`.
  - Das ist sehr wahrscheinlich ein kaputter Link.
- `app/angebot/[id].tsx:540`
  - `params.id` wird referenziert, `params` ist in diesem Scope nicht definiert.
- `app/project/[id].tsx:1046`
  - `handleDeleteOffer` wird in einem Scope verwendet, in dem es nicht sichtbar ist.
- `app/project/[id].tsx:1876`
  - `project.price_catalog` wird genutzt, obwohl `ProjectDetail` den Typ nicht enthaelt.
- `app/(tabs)/freigaben.tsx:144`
  - `projects.id` wird gelesen, aber der API-Typ fuer `projects(...)` selektiert keine `id`.
- `app/freigabe/[id].tsx:1228` und `app/freigabe/[id].tsx:1262`
  - Typed-Router beschwert sich ueber `"/freigabe"` als nicht definierte Route.

### 2.10 Repo-Qualitaet

`npx tsc --noEmit` am 2026-03-21:
- **fehlgeschlagen**
- App-seitige Fehler in mehreren produktiven Screens
- zusaetzlich Edge-Function-/Deno-Typkonfiguration nicht sauber getrennt

`npm run lint` am 2026-03-21:
- **0 Errors, 54 Warnings**
- Hauptrisiken: missing hook dependencies, tote Mock-Reste, unused imports/vars

## 3. Phase 2: Backend Inventur

### 3.1 Live-Schema: deployed sichtbar

Deployed ueber OpenAPI / REST sichtbar:
- 124 non-view public Relations
- 42 `v_`-View-artige public Relations
- zusammen 166 sichtbare public Relations
- 166 sichtbare RPC-Endpunkte unter `/rpc/*`

Wichtige Beobachtung:
- Der OpenAPI-Header meldet noch `Migration 024: Product Pool & Material System - 2026-01-12`.
- Das ist offenkundig **veraltet**, weil deployed deutlich spaetere Objekte sichtbar sind (`pipeline_runs`, `pipeline_steps`, `richtzeitwerte`, `site_captures`, `chat_messages`).

### 3.2 Lokale Migrationen

Lokal vorhanden:
- 37 SQL-Migrationsdateien
- davon in diesem Repo-Snapshot per `CREATE TABLE` sichtbar: **11 Tabellen**
- per `CREATE VIEW`: **0 Views**
- per `CREATE FUNCTION`: **35 Funktionen**

Lokale `CREATE TABLE`-Abdeckung in den sichtbaren Migrationen:
- `agent_api_keys`
- `chat_messages`
- `pipeline_runs`
- `pipeline_steps`
- `richtzeitwerte`
- `schedule_defaults`
- `schedule_learning`
- `site_captures`
- `team_members`
- `trade_aliases`
- `trade_sequence_rules`

Harter Drift-Befund:
- deployed sichtbare non-view Relations: **124**
- lokal per `CREATE TABLE` in diesem Repo-Snapshot: **11**
- Ueberlappung: genau diese 11
- Schlussfolgerung: Die lokale Migrationshistorie ist **nicht vollstaendig**. Das Repo enthaelt nur einen spaeteren Ausschnitt und nicht das komplette Basisschema.

### 3.3 Live-Row-Counts fuer zentrale Relations

| Relation | HTTP | Count |
|---|---:|---:|
| projects | 200 | 20 |
| clients | 200 | 6 |
| offers | 200 | 21 |
| offer_sections | 200 | 110 |
| offer_positions | 206 | 1228 |
| approvals | 200 | 8 |
| project_material_needs | 200 | 417 |
| products | 200 | 981 |
| suppliers | 200 | 103 |
| schedule_phases | 200 | 7 |
| project_assignments | 200 | 0 |
| team_members | 200 | 15 |
| inspection_protocols | 200 | 10 |
| inspection_protocol_items | 200 | 510 |
| inspection_photos | 200 | 2 |
| site_captures | 200 | 0 |
| pipeline_runs | 200 | 1 |
| pipeline_steps | 200 | 4 |
| richtzeitwerte | 200 | 31 |
| trade_sequence_rules | 200 | 11 |
| chat_messages | 200 | 0 |
| project_files | 200 | 27 |
| project_folders | 200 | 180 |
| purchase_invoices | 200 | 150 |
| sales_invoices | 200 | 1 |
| sales_invoice_items | 200 | 0 |
| project_activities | 206 | 1110 |
| events | 206 | 2449 |
| event_routing | 200 | 65 |
| dispatch_errors | 200 | 79 |

Interpretation:
- Kernobjekte haben echte Daten.
- `chat_messages`, `site_captures`, `project_assignments`, `sales_invoice_items`, `agent_api_keys`, `ai_agent_logs` sind live leer.
- Die Pipeline ist nicht nur Schema: `pipeline_runs = 1`, `pipeline_steps = 4`, `richtzeitwerte = 31`.

### 3.4 Views / View-artige Relations

Deployte `v_`-Relations:

`v_approval_audit, v_assignments_by_subcontractor, v_bank_transactions_unmatched, v_catalog_positions_active, v_catalog_with_translations, v_cheapest_supplier, v_current_supplier_prices, v_direct_costs_monthly, v_feedback_stats, v_finance_summary, v_global_workflow_steps, v_inspection_protocols_summary, v_margin_analysis, v_material_order_by_supplier, v_open_measurements, v_open_purchase_invoices, v_open_sales_invoices, v_overhead_costs_monthly, v_overhead_rate, v_pending_approvals, v_positions_with_assignments, v_price_comparison, v_product_autocomplete, v_project_change_orders, v_project_defects, v_project_event_history, v_project_financials, v_project_material_overview, v_project_material_status, v_project_order_summary, v_project_progress, v_project_purchases, v_project_timeline, v_project_workflow_status, v_purchase_invoices_dashboard, v_receipt_queue_current, v_receipt_queue_stats, v_supplier_balances, v_team_workload, v_unprocessed_events, v_workflow_dead_letters, v_workflow_steps_retry`

Wichtiger Befund:
- Lokal sichtbar per `CREATE VIEW` in den vorhandenen Migrationen: **0**
- deployed sichtbar: **42**
- auch hier ist die Repo-Migrationslage deutlich unvollstaendig.

### 3.5 RPCs / Functions

Besonders relevante deployed RPCs fuer das Frontend:
- `auto_plan_full`
- `confirm_proposed_phases`
- `discard_proposed_phases`
- `fn_approve_intake`
- `fn_approve_schedule`
- `fn_approve_material_order`
- `fn_reject_intake`
- `fn_agent_plausibility`
- `fn_agent_material`
- `fn_agent_einsatzplaner`
- `fn_agent_zeitpruefer`
- `fn_pipeline_start`
- `fn_pipeline_step_start`
- `fn_pipeline_step_complete`
- `fn_pipeline_complete`
- `fn_request_agent_task`
- `fn_godmode_learner`
- `fn_match_project_by_reference`
- `find_matching_project`
- `attach_offer_to_project`
- `create_duplicate_check_approval`
- `fn_resolve_duplicate_check`

Vollstaendige deployed RPC-Liste (sichtbar ueber OpenAPI):

```text
add_defect_comment, add_packing_list_suggestions, aggregate_project_materials, aggregate_project_tools, approve_change_order, approve_project_schedule, attach_offer_to_project, auto_match_bank_transactions, auto_plan_full, auto_plan_materials, auto_plan_project, batch_approve_invoices
batch_approve_time_entries, batch_reject_invoices, book_change_order_to_positions, bytea_to_text, calculate_match_confidence, calculate_order_quantities, calculate_position_price, calculate_project_costs, calculate_project_materials, calculate_project_materials_v2, calculate_project_materials_v3, cancel_invoice
check_email_duplicate, check_expired_approvals, check_in_worker, check_out_worker, check_overdue_invoices, claim_next_receipt, claim_workflow_step, complete_abnahme, complete_erstbegehung, complete_receipt_processing, complete_workflow_step, confirm_payment_match
confirm_proposed_phases, create_approval, create_client, create_defect, create_duplicate_check_approval, create_inspection_protocol, create_invoice_from_transaction, create_position, create_project, create_project_folder_entries, create_purchase_order, create_saga_order
create_section, decide_approval, delete_position, delete_project_cascade, delete_section, discard_material_plan, discard_proposed_phases, escalate_overdue_invoices, export_datev_csv, fail_receipt_processing, fail_workflow_step, find_matching_project
find_or_create_client, find_or_create_supplier_article, find_payment_matches, fn_agent_einsatzplaner, fn_agent_material, fn_agent_plausibility, fn_agent_zeitpruefer, fn_approve_intake, fn_approve_material_order, fn_approve_schedule, fn_fetch_unrouted_file_events, fn_file_intake_to_folder
fn_godmode_learner, fn_match_project_by_reference, fn_match_project_by_text, fn_pipeline_complete, fn_pipeline_start, fn_pipeline_step_complete, fn_pipeline_step_start, fn_reject_intake, fn_request_agent_task, fn_resolve_duplicate_check, fn_route_file_to_folder, fn_wabs_create_site_inspection
generate_all_project_materials, generate_change_order_number, generate_invoice_number, generate_offer_pdf, generate_packing_list, generate_project_materials, generate_project_schedule, generate_sales_invoice_pdf, get_5_second_project_check, get_cheapest_supplier, get_company_setting, get_dashboard_summary
get_folder_from_registry, get_inspection_protocol_details, get_lexware_sync_queue, get_marge_dashboard, get_matching_bank_transactions, get_monteur_auftrag, get_monteur_auftrag_data, get_open_bid_requests, get_or_create_zb_protocol, get_parent_info, get_position_context, get_positions_for_language
get_project_activities, get_project_change_orders, get_project_materials_summary, get_project_packing_list, get_saga_order_payload, get_sub_auftrag_data, get_team_capacity, http, http_delete, http_get, http_head, http_header
http_list_curlopt, http_patch, http_post, http_put, http_reset_curlopt, http_set_curlopt, import_bank_transaction, is_event_processed, list_baugenius_rpcs, log_bank_import, log_event, mark_event_processed
mark_invoice_paid, mark_lexware_synced, match_catalog_position, match_knowledge, normalize_room_name, populate_project_material_needs, record_invoice_payment, record_price_from_invoice, refresh_protocol_stats, register_folder, reject_change_order, request_monteur_auftrag_pdf
reschedule_project, reset_invoice_status, reset_stale_processing, resolve_trade_id, revert_position_status, search_positions, search_products, show_limit, show_trgm, skip_receipt_processing, submit_change_order, suggest_purchase_orders
text_to_bytea, update_defect_status, update_position, update_position_progress, update_project, update_purchase_invoice, update_section, upsert_room_measurement, urlencode, write_calculated_materials
```

### 3.6 RLS Status

Was ich sicher belegen kann:
- Lokal existiert `20260309100000_enable_rls_all_tables.sql`.
- Diese Migration aktiviert RLS dynamisch auf **allen** `public` Tabellen und erzeugt, falls keine Policy existiert, eine blanket policy `authenticated_access` fuer `authenticated` (`USING (true) WITH CHECK (true)`) - siehe Zeilen 16-72.
- Zusaetzlich existieren spezifische Policies fuer neue Tabellen, z. B.:
  - `richtzeitwerte`, `pipeline_runs`, `pipeline_steps` in `20260313100000_staffellauf_foundation.sql:113-131`
  - `agent_api_keys` service-only in `20260314100000_agent_api_layer.sql:27-31`

Wichtige Einschraenkung:
- Der **exakte deployed RLS-Status jeder Tabelle** konnte ohne SQL-Katalogzugriff nicht direkt aus `pg_tables` gelesen werden.

Sicherheitsbewertung:
- "RLS an" ist lokal plausibel.
- "RLS restriktiv und least-privilege" ist **nicht** plausibel.
- Das Single-Tenant-Modell basiert stark auf "jeder authentifizierte User darf sehr viel".

### 3.7 Lokale Edge Functions

Lokal vorhanden:
- `agent-chat`
- `calculate-offer`
- `create-offer`
- `generate-pdf`
- `generate-protokoll-pdf`
- `lookup-catalog`
- `parse-lv`
- `run-autoplan`
- `run-godmode`

## 4. Phase 3: Frontend <-> Backend Abgleich

Hinweis zur RLS-Spalte:
- `lokal ON*` bedeutet: lokale Migrationen sprechen fuer aktivierte RLS.
- `n/a` bedeutet: kein Business-Table-Zugriff oder reiner Mock.
- `*` deployed exakter Tabellenstatus war mangels SQL-Katalogzugriff nicht direkt dumpbar.

| Screen | Tabelle(n) | Hook vorhanden? | Echte Daten? | RLS? | Status |
|---|---|---|---|---|---|
| `app/+native-intent.tsx` | none | nein | nein | n/a | Utility Redirect |
| `app/+not-found.tsx` | none | nein | nein | n/a | Englisch, nicht Ayse-konform |
| `app/index.tsx` | Auth Session | AuthContext | ja | n/a | Auth-Router only |
| `app/login.tsx` | Supabase Auth | AuthContext | ja | auth | Echter Login/Magic-Link/Invite-Flow |
| `app/splash.tsx` | none | AuthContext | nein | n/a | Visual-only |
| `app/(tabs)/index.tsx` | `projects`, `approvals`, `offers`, `team_members`, `inspection_protocols`, `project_activities` | ja | teilweise | lokal ON* | GF/BL Dashboard live, Monteur-Home statisch; Activity-Link defekt |
| `app/(tabs)/projekte.tsx` | `projects`, `clients`, `events` | ja | ja | lokal ON* | Nutzbar, aber Client-CRUD noch direkt via Supabase |
| `app/(tabs)/freigaben.tsx` | `approvals`, `projects` | ja | ja | lokal ON* | Nutzbar; Typdefinition fuer `projects.id` kaputt |
| `app/(tabs)/material.tsx` | `projects`, `project_material_needs` | nein | ja | lokal ON* | Echt, aber ohne Query-Layer |
| `app/(tabs)/profil.tsx` | `company_settings`, `team_members` | nein | teilweise | lokal ON* | Reale Settings + Mock-Stats / Mock-Integrationen |
| `app/(tabs)/meinjob.tsx` | none | nein | nein | n/a | Voller Mock |
| `app/(tabs)/foto.tsx` | none | nein | nein | n/a | Voller Mock |
| `app/(tabs)/zeiten.tsx` | none | nein | nein | n/a | Voller Mock |
| `app/angebote/index.tsx` | `offers` | nein | teilweise | lokal ON* | Echt geladen, aber viele Werte Placeholder |
| `app/angebot/editor.tsx` | `projects`, `offers`, `offer_sections`, `offer_positions`, `catalogs`, `catalog_positions_v2`, `company_settings`, Storage | nein | ja | lokal ON* | Kernfunktion real; Screen umgeht fast komplett Hook/API-Layer |
| `app/angebot/[id].tsx` | none | nein | nein | n/a | Mock-Screen und TS-Bug mit `params.id` |
| `app/auftrag/[id].tsx` | `projects`, `offers`, `offer_positions` | nein | ja | lokal ON* | Direkt angebunden, kein Hook |
| `app/begehung/[type].tsx` | `projects`, `offers`, `offer_sections`, `offer_positions`, `inspection_protocols`, `inspection_protocol_items`, `events` | teils | ja | lokal ON* | Reale Abschlusslogik; Zusatzkataloge teilweise hardcoded |
| `app/begehung/baustellenaufnahme.tsx` | `site_captures`, `projects`, `events`, Storage | API ja, Hook nein | ja | lokal ON* | Flow real, aber live noch 0 `site_captures` |
| `app/bestellung/index.tsx` | none | nein | nein | n/a | Voller Mock |
| `app/chat/[id].tsx` | `chat_messages`, `projects`, `approvals`, `events` | ja | teilweise | lokal ON* | Realer Chat-Stack vorhanden, aber UI enthaelt noch grosse Mock-Reste; live 0 Messages |
| `app/einstellungen/firma.tsx` | `company_settings` | nein | ja | lokal ON* | Echt, aber ohne Hook/API-Layer |
| `app/einstellungen/kunden.tsx` | `clients` | nein | ja | lokal ON* | Echt, aber ohne Hook/API-Layer |
| `app/einstellungen/team.tsx` | `team_members` | nein | ja | lokal ON* | Echt, aber ohne Hook/API-Layer |
| `app/einstellungen/katalog.tsx` | sollte `catalogs`, `catalog_positions` nutzen, nutzt aber none | nein | nein | n/a | Voller Mock |
| `app/einstellungen/lieferanten.tsx` | sollte `suppliers`, `products`, `purchase_orders` nutzen, nutzt aber none | nein | nein | n/a | Voller Mock |
| `app/einstellungen/briefpapier.tsx` | sollte `company_settings` / Storage nutzen, nutzt aber none | nein | nein | n/a | Nur lokaler State |
| `app/einstellungen/import.tsx` | sollte Import-/ETL-Backend nutzen, nutzt aber none | nein | nein | n/a | Reine Simulation |
| `app/finanzen/index.tsx` | `offers`, `purchase_invoices`, `sales_invoices`, `projects`, `clients` | ja | ja | lokal ON* | Reale Daten, aggregiert ueber API-Layer |
| `app/foto/index.tsx` | none | nein | nein | n/a | Voller Mock |
| `app/freigabe/[id].tsx` | `approvals`, `projects`, `clients`, `project_files`, `pipeline_runs`, `pipeline_steps` | teils | ja | lokal ON* | Reale Detailseite, Pipeline-Schritte sichtbar |
| `app/planung/index.tsx` | `schedule_phases`, `projects`, `pipeline_runs` + RPCs | API teils | ja | lokal ON* | Reale Planung, aber direkter Supabase-Zugriff dominiert |
| `app/planung/[id].tsx` | `projects`, `schedule_phases`, `project_assignments`, `team_members` + RPCs | nein | ja | lokal ON* | Echt, aber `showAlert()` ist kaputt |
| `app/project/[id].tsx` | `projects`, `clients`, `offers`, `offer_positions`, `project_files`, `project_folders`, `project_messages`, `purchase_invoices`, `inspection_protocols`, `inspection_photos`, `saga_orders`, `pipeline_runs`, `pipeline_steps` | teils | ja | lokal ON* | Sehr zentrale echte Seite; hat jedoch harte Broken References |
| `app/project/team.tsx` | sollte `team_members`, `project_assignments`, `schedule_phases` nutzen, nutzt aber none | nein | nein | n/a | Voller Mock |
| `app/rechnung/index.tsx` | `sales_invoices`, `projects` | ja | ja | lokal ON* | Echt |
| `app/rechnung/neu.tsx` | `sales_invoices`, `clients`, `projects`, `offers`, `offer_positions` | ja | ja | lokal ON* | Echt |
| `app/rechnung/[id].tsx` | `sales_invoices`, `sales_invoice_items`, `clients`, `projects`, `offers`, `offer_positions`, `text_blocks` | ja | ja | lokal ON* | Echt, aber PDF-Download noch Placeholder |
| `app/assign-material.tsx` | `project_materials`, `products`, `suppliers` | nein | ja | lokal ON* | Echt, aber ohne Hook/API-Layer |

## 5. Phase 4: n8n Flow Inventur

### 5.1 Register vs. Repo

`docs/FLOW_REGISTER.md` behauptet:
- Stand 2026-03-17
- 42 aktive Flows
- 62 inaktive/archivierte
- 104 gesamt

Im Repo gefunden:
- 18 echte Workflow-JSONs unter `n8n-workflows/`
- 12 dokumentarische JSONs unter `docs/n8n-flows/`
- zusammen 30 JSON-Artefakte

Wichtige Schlussfolgerung:
- Selbst wenn man Doku-JSONs mitzahlt, ist die lokale Artefaktlage **klar unter** den behaupteten 42 aktiven Flows.
- Besonders die komplette M1-/MX-Infrastruktur des Registers ist lokal als JSON **weitgehend nicht vorhanden**.

### 5.2 Register-Drift / Namensdrift

Im Register genannt, lokal aber nicht als JSON vorhanden:
- `M1_02_PDF_Parser_Vision`
- `M1_03_Position_Extractor_V3`
- `M1_04a_Prepare_Drive`
- `M1_04b_Create_Project_Tree`
- `M1_04c_Sync_Initial_Files`
- `M1_05_Notification`
- `M2_01_Monteur_Auftrag_PDF`
- `M2_10_Sub_Order_Generator`
- `M2_10a_Schedule_Approve`
- `M2_10b_Schedule_Notification`
- `M4_01_Material_Planner`
- `M4_01a_Receipt_Intake`
- `M4_01b_Receipt_Processor_V2_MX02`
- `M4_03a_Order_Approve`
- `M4_03b_Order_Suggester`
- `M4_10_MagicPlan_Parser`
- `MX_00_Event_Router v2`
- `MX_01_Error_Handler_v2`
- `MX_02_Folder_Manager`
- `MX_03_V2_Superchat_Intake`
- `MX_04_Dispatch_Doctor`
- `MX_05_Attachment_Processor`
- `MX_07_Flow_Monitor`
- `MX_AI_Analyze_With_Fallback`

Lokal vorhanden, aber im Register anders oder gar nicht dargestellt:
- `M6_01_Invoice_Processor_v2`
- `M6_02_Lexware_Push_Invoice`
- `M6_04_Lexware_Payment_Webhook`
- `MX_01_Agent_Dispatcher`
- `MX_08_File_Router`

### 5.3 Dokumentationskonflikte

`docs/FLOW_ARCHITECTURE.md` sagt:
- "Alle 21 Flows"

`docs/FLOW_REGISTER.md` sagt:
- 42 aktive Flows

Das ist ein direkter Widerspruch innerhalb der Doku.

### 5.4 Event Routing: Doku, lokale JSONs, Live-DB

Live-DB:
- `event_routing` hat **65 Zeilen**
- damit deutlich mehr als die 11 Event-Routen im Register-Auszug

Belegte Live-Routen fuer zentrale Register-Events:
- `DOC_CLASSIFIED_INVOICE_IN -> M6_01_Invoice_Processor` (aktiv)
- `DOC_CLASSIFIED_PROJECT_ORDER -> M1_02_PDF_Parser` (aktiv)
- `DOC_CLASSIFIED_PROJECT_ORDER -> MX_05_Attachment_Processor` (aktiv)
- `PROJECT_FILES_READY -> M1_02_PDF_Parser_Vision` (aktiv)
- `PROJECT_CREATED -> M1_04a_Prepare_Drive` (aktiv)
- `PROJECT_CREATED -> M1_05_Notification` (aktiv)
- `DRIVE_YEAR_READY -> M1_04b_Create_Project_Tree` (aktiv)
- `DRIVE_TREE_CREATED -> M1_04c_Sync_Initial_Files` (aktiv)
- `DRIVE_SETUP_COMPLETE -> M1_05_Notification` (aktiv)
- `PURCHASE_INVOICE_CREATED -> M6_02a_Lexware_Push_Prepare` (inaktiv)
- `PURCHASE_INVOICE_CREATED -> M6_01_Invoice_Processor` (aktiv)
- `MONTEUR_AUFTRAG_CREATED -> MX_07_Monteur_Auftrag_PDF` (aktiv)

Lokale JSON-Belege fuer Register-Events:
- Direkt in lokalen JSONs gefunden:
  - `PURCHASE_INVOICE_CREATED`
  - `RECONCILIATION_COMPLETED`
- Fuer die meisten dokumentierten M1/MX-Events existiert lokal **kein** passendes Flow-JSON.

Auditurteil fuer n8n:
- Live-DB und Register sprechen fuer ein groesseres produktives Flow-System.
- Das Repo ist dafuer **kein vollstaendiges Source-of-Truth**.

## 6. Phase 5: Agent-Pipeline Status

### 6.1 `docs/AGENT_REGISTRY.md`

Die Agent-Doku ist architektonisch gross und zukunftsorientiert, beschreibt aber vor allem:
- externe Agenten als spaetere Produktschicht
- Agent-First-Architektur
- Schemas / Capabilities / Monetarisierung

Sie passt nur teilweise zum realen Implementierungsstand:
- Interne Pipeline-Agenten existieren bereits real in DB/RPC/Form.
- Externe Agent-API-Schicht ist nur angelegt (`agent_api_keys`), live aber ungenutzt.

### 6.2 Deployed Agent-/Pipeline-Funktionen

Deployed bestaetigt:
- `fn_agent_plausibility`
- `fn_agent_material`
- `fn_agent_einsatzplaner`
- `fn_agent_zeitpruefer`
- `fn_pipeline_start`
- `fn_pipeline_step_start`
- `fn_pipeline_step_complete`
- `fn_pipeline_complete`
- `fn_request_agent_task`
- `fn_godmode_learner`

### 6.3 `richtzeitwerte`

Live:
- 31 Eintraege
- 1 Katalog
- alle 31 auf:
  - `925ae844-bef4-4213-b0a4-d4598dee2dfd`
  - Name: `WABS Preisstand 30.09.2024`

Befund:
- Seed ist real vorhanden.
- `observation_count` in den Stichproben noch `0`.
- Quellen in der Stichprobe: `manual`.
- Godmode-Learning ist damit noch nicht sichtbar im Datenbestand.

### 6.4 `pipeline_runs`

Live:
- 1 Eintrag
- Status: `completed`
- `agents_completed = ["zeitpruefer","plausibility","material","einsatzplaner"]`
- `approval_schedule_id` und `approval_material_id` gesetzt

Belegte Ergebniszusammenfassung des echten Runs:
- Zeitpruefer:
  - `matched = 50`
  - `fallback = 63`
- Plausibility:
  - `total_hours = 145.5`
  - `trade_count = 9`
- Material:
  - `needs_created = 119`
- Schedule:
  - `assigned_count = 9`
  - `phases_created = 9`

### 6.5 `pipeline_steps`

Live:
- 4 Eintraege
- alle `completed`

Warnungen aus dem echten Run:
- `zeitpruefer`:
  - `63 Positionen mit Formel-Fallback ...`
- `plausibility`:
  - `Sanitaer: 48.3h geplant - ungewoehnlich hoch, bitte pruefen`
- `material`:
  - `10x aufmass_fehlt`
  - `72x mapping_fehlt`
  - `37x termin_fehlt`

Urteil:
- Pipeline ist **nicht nur Theorie**.
- Sie laeuft, aber die Warning-Lage zeigt klar, dass Datenqualitaet und Mapping noch nicht stabil sind.

### 6.6 `trade_sequence_rules`

Live:
- 11 Regeln
- `trades` ebenfalls 11 Eintraege
- `tradesWithoutRule = []`

Urteil:
- Formal vollstaendig fuer den aktuellen `trades`-Bestand.
- Fachlich trotzdem nur so gut wie die zugrunde liegende Trade-Pflege / Mapping-Qualitaet.

### 6.7 Agent API Layer

Live:
- `agent_api_keys = 0`
- `ai_agent_logs = 0`

Urteil:
- Externe Agent-API-Schicht ist vorbereitet, aber live nicht in Nutzung.

## 7. Phase 6: Offene Issues

`gh issue list --limit 30` am 2026-03-21 ergab 4 offene Issues:
- #19 `Feature: BauGenius Chat-Agent (Agent-First ERP)`
- #18 `Staffellauf Phase 4+5: Godmode Learner + Frontend Pipeline-Fortschritt`
- #17 `Staffellauf Agent-Pipeline: Intelligente Autoplanung`
- #15 `BG-014 Intake-Flow: Mehrere Auftraege pro Projekt zusammenfuehren`

### Issue #15 - teilweise erledigt

Erledigt / belegt:
- `offers.project_id` kann mehrfach belegt werden (Issue-Text verweist auf `20260310080000`)
- Dedup-/Merge-Funktionen sind lokal vorhanden:
  - `find_matching_project`
  - `attach_offer_to_project`
  - `create_duplicate_check_approval`
  - `fn_resolve_duplicate_check`
- Diese Funktionen sind deployed sichtbar
- Live `event_routing` enthaelt `PROJECT_CREATED -> M1_05_Notification`

Nicht erledigt / nicht belegbar:
- In lokalen n8n-JSONs ist **keine** Verdrahtung des M1-Intake auf diese Dedup-Funktionen sichtbar
- Lokal fehlen die M1-Flow-JSONs fuer Parser / Drive / Notification komplett
- Lexware-Beleg-Upload-Validierung konnte aus dem Repo nicht end-to-end bestaetigt werden

Urteil:
- **teilweise erledigt**
- Datenbankseite deutlich weiter als die lokal sichtbare Flow-Seite

### Issue #17 - weitgehend backend-seitig erledigt, aber nicht vollstaendig geschlossen

Erledigt / belegt:
- Tabellen `richtzeitwerte`, `pipeline_runs`, `pipeline_steps` live vorhanden
- Agent-Funktionen live vorhanden
- `auto_plan_full()` live vorhanden
- 1 echter `completed` Pipeline-Run live vorhanden
- 4 echte `completed` Pipeline-Steps live vorhanden
- `trade_sequence_rules` vollstaendig gegen `trades`

Nicht sauber belegt:
- Kein lokales n8n-JSON fuer einen expliziten `M2_10_AutoPlan_Pipeline` Orchestrator
- Phase-3 LV-Leser / PDF-Kontext nur teilweise indirekt sichtbar

Urteil:
- **grossenteils erledigt im Backend**
- Repo-/Flow-Artefakte sprechen aber gegen "vollstaendig sauber abgeschlossen"

### Issue #18 - teilweise erledigt

Erledigt / belegt:
- Frontend-Pipeline-Fortschritt ist im Code vorhanden:
  - `components/PipelineProgress.tsx`
  - `app/project/[id].tsx`
  - `app/freigabe/[id].tsx`
  - `app/planung/index.tsx`
- Live-Pipeline-Daten existieren
- `fn_godmode_learner` ist deployed

Nicht erledigt / nicht belegt:
- Kein lokales `M2_11_Godmode` n8n-JSON
- Keine sichtbaren Godmode-Lerndaten in `richtzeitwerte`
- `agent_api_keys` / `ai_agent_logs` leer

Urteil:
- **Phase 5 frontendseitig weit fortgeschritten**
- **Phase 4 Godmode noch nicht end-to-end belegt**

### Issue #19 - weit fortgeschritten im Code, aber nicht end-to-end bewiesen

Erledigt / belegt:
- `app/chat/[id].tsx` existiert
- `hooks/queries/useChat.ts` existiert
- `lib/api/chat.ts` existiert
- Edge Function `supabase/functions/agent-chat/index.ts` existiert
- Tool Use implementiert:
  - `query_positions`
  - `check_catalog`
  - `create_change_order`
  - `prepare_email`
  - `get_project_status`
  - `get_schedule`
- Chat persistiert in `chat_messages`
- Realtime auf `chat_messages` existiert

Nicht erledigt / schwach:
- Live `chat_messages = 0`
- `components/BGAssistant.tsx` ist noch Mock
- Das Naming weicht vom Issue ab (`create_change_order` statt `create_amendment`)
- NemoClaw / Phase 2 nicht begonnen

Urteil:
- **Phase 1 im Code stark fortgeschritten**
- **end-to-end im Live-System noch nicht bewiesen**

## 8. Was funktioniert end-to-end

Konservativ nur dort, wo Code + Daten + Backend-Spur zusammenpassen:

- Projektanlage und Projektliste
  - Reale `projects`-Daten
  - `useProjects()` + `useCreateProject()`
  - `PROJECT_CREATED` Event wird im API-Layer geschrieben
- Freigabecenter
  - `approvals = 8`
  - Freigabeliste, Detailseite und Approve-/Reject-Logik real
  - passende RPCs sind deployed
- Angebots-Editor
  - `offers = 21`, `offer_sections = 110`, `offer_positions = 1228`
  - Editor liest/schreibt echte Daten, Storage und Edge Functions
- Begehung / Protokolle
  - `inspection_protocols = 10`, `inspection_protocol_items = 510`, `inspection_photos = 2`
  - Abschluss- und Update-Logik real
- Finanzen / Rechnungen
  - `purchase_invoices = 150`, `sales_invoices = 1`
  - Screen-Layer ist real ueber Hooks/API angebunden
- Staffellauf-Pipeline
  - 1 echter `completed` Run
  - 4 echte `completed` Steps
  - Pipeline-UI fuer Projekt / Freigabe / Planung vorhanden

## 9. Was fehlt oder kaputt ist

### 9.1 Frontend-Screens ohne echte Daten

- `app/(tabs)/meinjob.tsx`
- `app/(tabs)/foto.tsx`
- `app/(tabs)/zeiten.tsx`
- `app/angebot/[id].tsx`
- `app/bestellung/index.tsx`
- `app/einstellungen/katalog.tsx`
- `app/einstellungen/lieferanten.tsx`
- `app/einstellungen/briefpapier.tsx`
- `app/einstellungen/import.tsx`
- `app/foto/index.tsx`
- `app/project/team.tsx`
- `components/BGAssistant.tsx`

### 9.2 DB-/Backend-Bereiche ohne Frontend-Abdeckung

Beispiele fuer klare Luecken:
- `event_routing`
- `dispatch_errors`
- `classified_emails`
- `bank_transactions`
- `change_orders`
- `change_order_items`
- `change_order_evidence`
- `supplier_article_prices`
- `supplier_articles`
- `receipt_queue`
- `workflow_steps`
- `ai_agent_logs`
- `agent_api_keys`

### 9.3 Broken Imports / References / Build-Brecher

- Typecheck insgesamt kaputt
- Defekte Referenzen in:
  - `app/angebot/[id].tsx`
  - `app/project/[id].tsx`
  - `app/(tabs)/freigaben.tsx`
  - `app/freigabe/[id].tsx`
- Routen-Inkonsistenz:
  - `/projekt/...` vs `project/[id]`
- Rekursive Alert-Helferfunktion:
  - `app/planung/[id].tsx`

### 9.4 Flows ohne lokale Artefakte / Routing ohne Source-of-Truth

- Register dokumentiert 42 aktive Flows
- Repo enthaelt 18 echte Workflow-JSONs
- Live `event_routing` hat 65 Zeilen
- Das bedeutet:
  - Doku != Repo
  - Live-DB != Repo
  - Repo ist fuer Flows aktuell **nicht** das Source-of-Truth

## 10. Top 10 Prioritaeten

1. Typecheck auf Gruen bringen.
2. Mock-Monteurpfad ersetzen: `meinjob`, `foto`, `zeiten`, `project/team`.
3. Den kaputten Navigationspfad `/projekt/...` auf `project/[id]` korrigieren.
4. `app/planung/[id].tsx` Alert-Rekursion beheben.
5. Angebots-Detailseite `app/angebot/[id].tsx` von Mock auf echte Daten umstellen oder entfernen.
6. n8n-Repository konsolidieren: echte aktive Flows exportieren und lokale JSONs auf Register/Live-DB synchronisieren.
7. Settings-/Admin-Bereiche (`katalog`, `lieferanten`, `briefpapier`, `import`) mit echten Daten und API-Layer anbinden.
8. Direktzugriffe auf Supabase in Kernscreens in Hook/API-Layer ueberfuehren.
9. RLS von "authenticated darf fast alles" auf echte Rollen-/Objektgrenzen verhaerten.
10. Chat-Agent von "Code vorhanden" zu "echt genutzt" bringen: BGAssistant entmocken, erste Live-Chats, Freigabe-/Nachtrag-Loop verifizieren.

## 11. Architektur-Risiken

### 11.1 Docs fuehren teilweise in die Irre

- `FLOW_REGISTER` und `FLOW_ARCHITECTURE` widersprechen sich direkt.
- Das Register beschreibt Flows, die lokal nicht vorliegen.
- Das deployed Schema ist groesser als die sichtbare lokale Migrationshistorie.

### 11.2 Repo ist nicht das Source-of-Truth fuer Flows und Schema

- 124 deployed non-view Relations vs 11 lokal sichtbare `CREATE TABLE`s
- 42 dokumentierte aktive Flows vs 18 echte lokale Workflow-JSONs
- 65 live Event-Routings vs 11 Register-Routing-Zeilen

### 11.3 Security-Risiko: RLS ist breit, nicht fein

- Lokal ist RLS-Aktivierung plausibel.
- Viele Policies sind aber absichtlich permissiv:
  - blanket `authenticated_access`
  - `USING (true)` fuer breite Leserechte
- Fuer Single-Tenant kann das kurzfristig funktionieren, ist aber kein robustes Least-Privilege-Modell.

### 11.4 Produkt-Risiko: Hybrid aus echter Kernlogik und Demo-Screens

- User sehen in derselben App gleichzeitig:
  - echte Freigaben / Projekte / Pipeline
  - komplett simulierte Monteur- und Admin-Screens
- Das erzeugt falsche Vollstaendigkeitswahrnehmung.

## 12. Gesamturteil

Das Projekt ist **weiter als eine typische halb-fertige Expo-App**. Die zentrale fachliche Achse `Projekt -> Angebot -> Freigabe -> Begehung -> Rechnung -> Pipeline` ist ueber weite Strecken real. Die **groessten Risiken liegen nicht im Fehlen von Kernlogik**, sondern in:

- Mock-Screens in produktnahen Routen
- defektem Typecheck
- lokaler/deployed Drift bei Schema und Flows
- zu grober Security-Policierung

Wenn die naechsten Schritte strikt nach Impact umgesetzt werden, ist das Projekt eher ein **inkonsistentes fast-ERP** als ein Greenfield-Prototyp.
