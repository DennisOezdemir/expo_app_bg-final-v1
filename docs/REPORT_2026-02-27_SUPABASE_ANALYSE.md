# BauGenius Supabase Backend-Analyse Report
> **Datum:** 2026-02-27 | **Projekt-ID:** yetwntwayhmzmhhgdkli

---

## EXECUTIVE SUMMARY

| Metrik | Wert |
|--------|------|
| Tabellen (public) | 108 |
| Views | 42 |
| Functions | ~150 |
| Trigger | 88 |
| Migrations | 121 |
| Events | 6.855 |
| Edge Functions | 1 |
| Storage Buckets | 3 |

---

## DATEN-STATISTIK (Top 15)

| Tabelle | Rows |
|---------|------|
| events | 6.855 |
| project_activities | 959 |
| products | 904 |
| catalog_positions_v2 | 835 |
| flow_logs | 787 |
| offer_positions | 712 |
| classified_emails | 662 |
| position_material_requirements | 395 |
| purchase_invoice_items | 352 |
| wbs_gwg_positions | 315 |
| project_materials | 308 |
| workflow_steps | 166 |
| project_drive_folders | 130 |
| purchase_invoices | 109 |
| suppliers | 102 |

Projekte: 13 | Offers: 10 | Clients: 7 (Entwicklungsphase)

---

## SECURITY STATUS: KRITISCH

### RLS-Übersicht
- **RLS aktiviert MIT Policies:** 39 Tabellen
- **RLS aktiviert OHNE Policies:** 2 (bank_import_logs, bank_transactions — gesperrt)
- **RLS DEAKTIVIERT:** 69 Tabellen

### Ungeschützte sensible Tabellen
projects, clients, offers, offer_positions, purchase_invoices, purchase_invoice_items, company_settings, bank_accounts (IBAN!), events, suppliers, products

### Policy-Qualität
Fast alle Policies prüfen nur `true` — lassen alles durch. Kein echtes Zugriffs-Filtering.

### Security Advisors: 305 Findings
- 112 ERROR (42x security_definer_view, 69x rls_disabled, 1x sensitive_columns)
- 191 WARN (152x function_search_path, 37x rls_policy_always_true)
- 2 INFO

---

## WORKFLOW_ERROR ANALYSE

### Kernbefund: 90% = DB-Outage (25./26. Feb)

| Kategorie | Anzahl | Status |
|-----------|--------|--------|
| DB-Outage (Supabase Pooler) | ~4.560 (90%) | VERGANGEN |
| Code-Bugs (uuid, schema) | ~253 (5%) | AKTIV — fixen |
| Config-Fehler (404 Webhooks) | ~58 (1%) | AKTIV — URLs prüfen |
| Sonstige (Timeouts) | ~174 (3,5%) | Intermittierend |

### Top Code-Bugs
| Bug | Workflow | Anzahl |
|-----|----------|--------|
| uuid: "undefined" | M6_02 Lexware Push | 97 |
| column ws.event_id missing | MX_04 Dispatch Doctor | 72 |
| no unique constraint ON CONFLICT | M4_01 Material Planner | 55 |

### Empfehlung
1. MX_00: Exponential Backoff bei DB-Fehlern
2. M6_02: UUID-Validierung fixen
3. MX_04: SQL-Schema-Mismatch fixen
4. event_routing: 404-Webhook-URLs prüfen
5. 4.560 Outage-Events optional löschen

---

## EVENT-SYSTEM

### 44 Event-Typen, 60 Routing-Regeln

**Wichtigste Ketten:**
- Email → DOC_CLASSIFIED_* → MX_05 → M1_02 → PROJECT_CREATED → Drive + Positions
- Invoice → M6_01 → PURCHASE_INVOICE_CREATED → M6_02a/b/c (Lexware)
- Inspection → M2_02 (ZB Sync) + M2_03 (PDF)

---

## VIEWS (42)

Finanzen: v_project_financials, v_margin_analysis, v_finance_summary, v_direct_costs_monthly
Material: v_project_material_overview, v_material_order_by_supplier, v_project_material_status
Workflow: v_global_workflow_steps, v_workflow_dead_letters, v_unprocessed_events
Rechnungen: v_open_purchase_invoices, v_open_sales_invoices, v_purchase_invoices_dashboard
Team: v_team_workload, v_positions_with_assignments
Und 27 weitere...

---

## WICHTIGE FUNCTIONS

**Projekt:** create_project, generate_project_number, get_5_second_project_check
**Material:** generate_all_project_materials, calculate_order_quantities, generate_packing_list
**Finanzen:** get_marge_dashboard, export_datev_csv, auto_match_bank_transactions
**Workflow:** claim_workflow_step, complete_workflow_step, fail_workflow_step
**Events:** log_event, mark_event_processed

---

## TRIGGER (Wichtigste)

| Trigger | Tabelle | Funktion |
|---------|---------|----------|
| baugenius_event_router | events | Routet Events an Webhooks |
| trg_learn_product | project_materials | Produkt-Lernfunktion |
| trg_material_auto_apply | project_materials | Material auto-apply |
| trg_offer_positions_totals | offer_positions | Totals berechnen |
| trg_projects_number | projects | Projektnummer generieren |

---

## STORAGE

| Bucket | Public | Zweck |
|--------|--------|-------|
| assets | Ja | Allgemeine Assets |
| project-files | Nein | PDFs, Dokumente |
| receipts | Nein | Belege |

---

## EXTENSIONS

pg_trgm (Fuzzy Search), btree_gist, uuid-ossp, pgcrypto, pg_net (Webhooks), pg_stat_statements, pg_graphql, supabase_vault

---

## PERFORMANCE ADVISORS (194 Findings)

- 48 unindexed Foreign Keys
- 125 unused Indexes
- 17 redundante Policies
- 2 Tabellen ohne Primary Key

---

## HANDLUNGSEMPFEHLUNGEN

| Prio | Aktion | Aufwand |
|------|--------|---------|
| 1 | RLS auf 69 Tabellen aktivieren | Groß |
| 2 | `true`-Policies durch echte Checks ersetzen | Groß |
| 3 | WORKFLOW_ERROR Bugs fixen (5 Stück) | Klein |
| 4 | Function Search Paths absichern | Mittel |
| 5 | 125 ungenutzte Indexes entfernen | Klein |
| 6 | 48 fehlende FK-Indexes anlegen | Mittel |

---

*Generiert: 2026-02-27 | Agent: supabase-analyst*
