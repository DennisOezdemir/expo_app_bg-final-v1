# BAUGENIUS Datenbank-Schema

> **Stand:** 2026-03-21 (Live-Export aus Supabase)
> **Datenbank:** Supabase PostgreSQL | Projekt-ID: `yetwntwayhmzmhhgdkli`
> **Aktueller Stand:** 124 Tabellen, 42 Views, ~120 Business-Functions, 31 Enums, 95+ Migrations
> **RLS:** Auf allen Tabellen aktiviert (ausser `_temp_*` Hilfstabellen)

---

## SCHEMA-UEBERSICHT

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         BAUGENIUS DATENMODELL v3.0                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  STAMMDATEN          PROJEKTE              KATALOG-SYSTEM                       │
│  ──────────          ────────              ──────────────                       │
│  clients (6)         projects (20)         catalogs (9)                         │
│  contractors (4)     project_files (27)    catalog_positions_v2 (1833)          │
│  leads (0)           project_folders       catalog_aliases (218)                │
│  company_settings    project_activities    catalog_material_mapping (54)        │
│  team_members (15)   project_messages      catalog_position_products (11)       │
│  subcontractors (10) project_assignments                                       │
│  trades (11)         project_room_measurements                                 │
│                                                                                 │
│  ANGEBOTE            BEGEHUNGEN            MATERIAL & EINKAUF                  │
│  ────────            ──────────            ──────────────────                   │
│  offers (21)         inspection_protocols  suppliers (103)                      │
│  offer_positions     inspection_items      products (981)                       │
│  offer_sections      inspection_photos     purchase_invoices (150)              │
│  position_calc_*     inspection_defects    purchase_orders                      │
│  labor_rates         defects               project_materials (308)              │
│                      document_templates    project_material_needs (417)         │
│                                            receipt_queue (24)                   │
│                                                                                 │
│  FINANZEN            EVENT-SYSTEM          PIPELINE / KI                       │
│  ────────            ────────────          ──────────────                       │
│  sales_invoices      events (2469)         pipeline_runs (2)                   │
│  invoice_payments    event_routing (65)    pipeline_steps (5)                   │
│  bank_transactions   dispatch_errors (79)  richtzeitwerte (1917)               │
│  lexware_sync_log    workflow_steps (303)  schedule_learning                    │
│  outbound_emails     flow_logs (1416)      knowledge_base (10)                 │
│                      classified_emails     chat_messages                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## TABELLEN NACH MODUL

### Stammdaten & Firma

| Tabelle | Rows | Beschreibung |
|---------|------|--------------|
| `clients` | 6 | Auftraggeber (GUs): Rehbein & Weber, Roland Ernst, besser zuhause |
| `client_aliases` | 0 | Alternative Firmennamen fuer OCR/Matching |
| `contractors` | 4 | Endkunden der GUs: SAGA, WBS, BDS, B&O |
| `leads` | 0 | Potenzielle Neukunden |
| `company_settings` | 32 | Firmenstammdaten, Bankverbindung, Logos fuer PDF |
| `team_members` | 15 | Mitarbeiter/Monteure |
| `subcontractors` | 10 | Nachunternehmer |
| `trades` | 11 | Gewerke (Sanitaer, Maler, Elektro, ...) |
| `trade_aliases` | 26 | Alternative Gewerke-Bezeichnungen |
| `absences` | 7 | Urlaub, Krankheit, Abwesenheiten |

### Projekte

| Tabelle | Rows | Beschreibung |
|---------|------|--------------|
| `projects` | 20 | Bauprojekte mit Status, Adresse, Referenznummer |
| `project_files` | 27 | Dateien im Supabase Storage |
| `project_folders` | 180 | Ordnerstruktur pro Projekt |
| `project_drive_folders` | 180 | Google Drive Ordner-IDs |
| `project_activities` | 1110 | Aktivitaets-Feed (Timeline) |
| `project_messages` | 0 | Baustellen-Chat pro Projekt |
| `project_assignments` | 0 | Monteur-Zuweisungen zu Projekten |
| `project_room_measurements` | 12 | Raummessungen aus MagicPlan CSV |
| `drive_folder_templates` | 9 | Template fuer 9 Projektunterordner |
| `drive_folder_registry` | 17 | Zentrale Drive-Ordner-Registry |

### Katalog-System

| Tabelle | Rows | Beschreibung |
|---------|------|--------------|
| `catalogs` | 9 | Preiskataloge: SAGA AV-2024, WBS, DBL-2026 u.a. |
| `catalog_positions_v2` | 1833 | Unified Leistungspositionen aller Kataloge |
| `catalog_aliases` | 218 | Alternative Positionsbezeichnungen fuer Matching |
| `catalog_material_mapping` | 54 | Materialbedarf pro Katalogposition |
| `catalog_position_products` | 11 | Produkt-Zuordnung fuer Stueck-Positionen |
| `catalog_supplier_mapping` | 0 | Lieferantenartikel zu Katalogposition |

**Legacy-Katalog** (vor Unified-System):

| Tabelle | Rows | Beschreibung |
|---------|------|--------------|
| `catalog_versions` | 2 | Alte Katalogversionen |
| `catalog_positions` | 215 | Alte SAGA-Positionen (WABS) |
| `catalog_position_texts` | 0 | Mehrsprachige Texte |
| `catalog_position_prices` | 215 | Alte Preiszuordnungen |
| `catalog_discount_rules` | 0 | Rabattregeln |
| `wbs_gwg_catalogs` | 3 | WBS/GWG Vertraege |
| `wbs_gwg_positions` | 315 | WBS/GWG Positionen mit DE/TR |

### SAGA-Auftraege

| Tabelle | Rows | Beschreibung |
|---------|------|--------------|
| `saga_orders` | 5 | SAGA Handwerkerauftraege |
| `saga_order_positions` | 0 | Auftragspositionen |
| `saga_order_texts` | 2 | Begleittexte zu Auftraegen |

### Angebote & Kalkulation

| Tabelle | Rows | Beschreibung |
|---------|------|--------------|
| `offers` | 21 | Angebote mit Status (DRAFT/SENT/ACCEPTED/REJECTED) |
| `offer_positions` | 1228 | Einzelpositionen mit Menge, EP, GP |
| `offer_sections` | 110 | Gliederung in Abschnitte (Raeume, Gewerke) |
| `offer_attachments` | 0 | Anhaenge zu Angeboten |
| `offer_history` | 0 | Versionshistorie |
| `position_calc_materials` | 49 | Materialkalkulation pro Position |
| `position_calc_labor` | 0 | Lohnkalkulation |
| `position_calc_equipment` | 0 | Geraetekalkulation |
| `position_calc_subcontractor` | 0 | Nachunternehmer-Kalkulation |
| `text_blocks` | 3 | Textbausteine fuer Angebote |
| `custom_positions` | 0 | Freie Positionen (nicht aus Katalog) |
| `labor_rates` | 4 | Stundensaetze (Helfer/Geselle/Meister/Azubi) |
| `jumbo_templates` | 1 | Vorlagen fuer Sammelangebote |
| `jumbo_template_sections` | 2 | Abschnitte der Vorlage |
| `jumbo_template_items` | 0 | Positionen der Vorlage |
| `legacy_positions` | 0 | Alt-Positionen fuer Suche |
| `position_usage_stats` | 0 | Nutzungsstatistiken |

### Begehungen & Protokolle

| Tabelle | Rows | Beschreibung |
|---------|------|--------------|
| `inspection_protocols` | 10 | Erstbegehung, Zwischenbegehung, Abnahme |
| `inspection_protocol_items` | 510 | Status pro Position im Protokoll |
| `inspection_attachments` | 0 | MagicPlan, Videos, Fotos |
| `inspection_attendees` | 0 | Anwesende Personen |
| `inspection_defects` | 0 | Maengel bei Begehung |
| `inspection_checklist_items` | 0 | Checklisten-Punkte |
| `inspection_photos` | 2 | Fotos zu Begehungen |
| `protocols` | 0 | Legacy-Protokolle |
| `protocol_signatures` | 0 | Unterschriften |
| `defects` | 0 | Maengelverwaltung |
| `defect_comments` | 0 | Kommentare/Status zu Maengeln |
| `document_templates` | 2 | HTML-Templates fuer PDF (Gotenberg) |

### Nachtraege (Change Orders)

| Tabelle | Rows | Beschreibung |
|---------|------|--------------|
| `change_orders` | 0 | Nachtragsantraege |
| `change_order_items` | 0 | Nachtragspositionen |
| `change_order_evidence` | 0 | Nachweise (Fotos, Protokolle) |

### Lieferanten & Einkauf

| Tabelle | Rows | Beschreibung |
|---------|------|--------------|
| `suppliers` | 103 | Lieferanten-Stammdaten mit Typ und Kategorie |
| `supplier_aliases` | 64 | Alternative Schreibweisen fuer OCR-Matching |
| `supplier_articles` | 46 | Artikel pro Lieferant |
| `supplier_article_prices` | 46 | Preishistorie (valid_from/valid_to) |
| `purchase_invoices` | 150 | Eingangsrechnungen |
| `purchase_invoice_items` | 509 | Rechnungspositionen |
| `purchase_orders` | 0 | Bestellungen |
| `purchase_order_items` | 0 | Bestellpositionen |
| `receipt_queue` | 24 | Queue fuer sequentielle Beleg-Verarbeitung |
| `email_processing_attempts` | 0 | Retry-Tracking fuer Email-Rechnungen |

### Material & Produkte

| Tabelle | Rows | Beschreibung |
|---------|------|--------------|
| `products` | 981 | Zentraler Produktkatalog (waechst durch Import) |
| `position_material_requirements` | 395 | KI-generierter Materialbedarf pro Katalogposition |
| `project_materials` | 308 | Materialliste pro Projekt mit Produkt-Zuordnung |
| `project_material_needs` | 417 | Konkreter Bedarf pro Projekt (ein Produkt pro Type) |
| `project_packing_list` | 28 | Packliste: Material + Werkzeug + KI-Vorschlaege |
| `material_consumption_rates` | 39 | Verbrauchsraten (qm-basierte Gewerke) |
| `trade_material_types` | 34 | Welche Materialien pro Gewerk |
| `client_product_defaults` | 0 | Standard-Produkte pro Auftraggeber |
| `measurements` | 0 | Aufmass-Erfassung vor Ort |

### Finanzen

| Tabelle | Rows | Beschreibung |
|---------|------|--------------|
| `sales_invoices` | 1 | Ausgangsrechnungen |
| `sales_invoice_items` | 0 | Rechnungspositionen |
| `invoice_payments` | 12 | Zahlungseingaenge |
| `bank_accounts` | 0 | GoCardless Bankkonten (VR Bank, Finom) |
| `bank_transactions` | 78 | Kontobewegungen |
| `bank_import_logs` | 3 | Import-Protokolle |
| `lexware_sync_log` | 58 | Lexware Synchronisation |
| `outbound_emails` | 1 | Ausgehende Emails mit GF-Freigabe |

### Team & Zeiterfassung

| Tabelle | Rows | Beschreibung |
|---------|------|--------------|
| `position_assignments` | 0 | Positionen an Monteure zuweisen |
| `schedule_phases` | 7 | Terminplan-Phasen pro Projekt |
| `time_entries` | 0 | Arbeitszeiterfassung |
| `attendance_logs` | 0 | Check-in/Check-out |

### Event-System & Workflows

| Tabelle | Rows | Beschreibung |
|---------|------|--------------|
| `events` | 2469 | Zentrale Event-Tabelle (Event-Driven Architecture) |
| `event_routing` | 65 | Event-Typ → Ziel-Webhook Mapping |
| `event_consumer_receipts` | 0 | Quittungen fuer Event-Verarbeitung |
| `dispatch_errors` | 79 | Fehlgeschlagene Event-Dispatches (MX04 Retry) |
| `workflow_steps` | 303 | Workflow State Machine Steps |
| `flow_logs` | 1416 | n8n Flow Ausfuehrungslogs |
| `approvals` | 8 | Freigabe-Anfragen (HITL) |
| `feedback_categories` | 30 | Kategorien fuer Intake-Feedback |
| `classified_emails` | 1072 | Klassifizierte Emails aus MX03 |

### Pipeline / Autoplanung (Staffellauf)

| Tabelle | Rows | Beschreibung |
|---------|------|--------------|
| `pipeline_runs` | 2 | Lauf der Autoplanungs-Pipeline |
| `pipeline_steps` | 5 | Einzelschritte im Pipeline-Lauf |
| `richtzeitwerte` | 1917 | Zeitwerte: Wie lange dauert eine Position? |
| `trade_sequence_rules` | 11 | Gewerke-Reihenfolge (Baulogik) |
| `schedule_learning` | 1 | Godmode-Lernwerte SOLL vs IST |
| `schedule_defaults` | 11 | Standard-Zeitvorgaben |

### KI & Chat

| Tabelle | Rows | Beschreibung |
|---------|------|--------------|
| `chat_messages` | 0 | BauGenius Agent Chat-Verlauf |
| `chat_history` | 0 | Legacy Chat-Historie |
| `knowledge_base` | 10 | Wissensdatenbank fuer Chatbot |
| `unanswered_questions` | 0 | Nicht beantwortete Fragen |
| `ai_agent_logs` | 0 | Agent-Ausfuehrungslogs |
| `agent_api_keys` | 0 | API-Keys fuer externe Agenten (Hash-basiert) |
| `site_captures` | 0 | Baustellen-Fotos/Erfassungen |

### Backup / Temp

| Tabelle | Rows | RLS | Beschreibung |
|---------|------|-----|--------------|
| `purchase_invoices_backup_20260112` | 4 | ja | Backup vor Migration |
| `products_backup_20260119` | 558 | ja | Backup vor Produkt-Refactoring |
| `_temp_lexware_dump` | 150 | nein | Temp-Tabelle fuer Lexware-Import |

---

## VIEWS (42)

### Projekt & Dashboard

| View | Beschreibung |
|------|--------------|
| `v_project_progress` | Aggregierter Fortschritt pro Projekt |
| `v_project_financials` | Kosten-/Erloesueberblick pro Projekt |
| `v_project_timeline` | Zeitachse mit Meilensteinen |
| `v_project_workflow_status` | Aktueller Workflow-Status |
| `v_project_event_history` | Event-Verlauf pro Projekt |
| `v_project_purchases` | Einkaufshistorie pro Projekt |
| `v_project_change_orders` | Nachtraege pro Projekt |
| `v_project_defects` | Maengel mit Kontext |
| `v_team_workload` | Auslastung pro Mitarbeiter |
| `v_dashboard_summary` | KPI-Uebersicht |

### Material & Einkauf

| View | Beschreibung |
|------|--------------|
| `v_cheapest_supplier` | Guenstigster Lieferant pro Artikel |
| `v_current_supplier_prices` | Aktuelle EK-Preise |
| `v_price_comparison` | Preisvergleich bei mehreren Lieferanten |
| `v_supplier_balances` | Offene Salden pro Lieferant |
| `v_project_material_overview` | Materialstatus-Uebersicht |
| `v_project_material_status` | Materialstatus fuer Dashboard |
| `v_project_order_summary` | Bestelluebersicht aggregiert |
| `v_material_order_by_supplier` | Bestellungen nach Lieferant |
| `v_product_autocomplete` | Produkte sortiert nach Relevanz |

### Kalkulation & Finanzen

| View | Beschreibung |
|------|--------------|
| `v_overhead_rate` | Monatlicher AGK-Zuschlagssatz |
| `v_direct_costs_monthly` | Einzelkosten pro Monat |
| `v_overhead_costs_monthly` | Gemeinkosten pro Monat |
| `v_margin_analysis` | Margen-Analyse: VK vs. EK |
| `v_finance_summary` | Finanz-Zusammenfassung |
| `v_open_purchase_invoices` | Offene Eingangsrechnungen |
| `v_open_sales_invoices` | Offene Ausgangsrechnungen |
| `v_purchase_invoices_dashboard` | Dashboard-Ansicht Einkauf |
| `v_bank_transactions_unmatched` | Nicht zugeordnete Transaktionen |

### Angebote & Katalog

| View | Beschreibung |
|------|--------------|
| `v_catalog_positions_active` | Aktive Positionen mit Contractor-Info |
| `v_catalog_with_translations` | Positionen mit Uebersetzungen |
| `v_positions_with_assignments` | Positionen mit Monteur-Zuweisung |

### Begehungen

| View | Beschreibung |
|------|--------------|
| `v_inspection_protocols_summary` | Protokoll-Uebersicht aggregiert |
| `v_open_measurements` | Offene Aufmasse |

### Workflows & Events

| View | Beschreibung |
|------|--------------|
| `v_unprocessed_events` | Noch nicht verarbeitete Events |
| `v_workflow_dead_letters` | Dead-Letter Events |
| `v_workflow_steps_retry` | Retry-faehige Steps |
| `v_global_workflow_steps` | Alle Workflow-Steps |
| `v_receipt_queue_current` | Queue-Uebersicht mit Laufzeiten |
| `v_receipt_queue_stats` | Queue-Statistiken |
| `v_pending_approvals` | Offene Freigaben |
| `v_approval_audit` | Audit-Trail fuer Freigaben |
| `v_feedback_stats` | Feedback-Statistiken |
| `v_assignments_by_subcontractor` | Zuweisungen nach Sub |

---

## WICHTIGE FUNCTIONS (Auswahl)

### Projekt-Management

| Function | Beschreibung |
|----------|--------------|
| `create_project(...)` | Projekt anlegen |
| `update_project(...)` | Projekt aktualisieren |
| `delete_project_cascade(...)` | Projekt mit allen Abhaengigkeiten loeschen |
| `find_matching_project(...)` | Projekt per Referenznummer finden |
| `fn_match_project_by_reference(...)` | Projektzuordnung per BL-Nummer/Adresse |
| `fn_match_project_by_text(...)` | Freitext-Matching |
| `get_5_second_project_check(...)` | Quick-Check fuer Dashboard |
| `get_dashboard_summary()` | Dashboard-KPIs |

### Angebote

| Function | Beschreibung |
|----------|--------------|
| `create_section(...)` | Angebotsabschnitt anlegen |
| `create_position(...)` | Position anlegen |
| `calculate_position_price(...)` | EP/GP berechnen |
| `update_offer_totals(...)` | Angebotssummen aktualisieren |
| `generate_offer_number()` | Fortlaufende Angebotsnummer |
| `generate_offer_pdf(...)` | PDF-Daten fuer Gotenberg |
| `attach_offer_to_project(...)` | Angebot an Projekt koppeln |
| `search_positions(...)` | Positionssuche im Katalog |
| `match_catalog_position(...)` | KI-Matching zu Katalogposition |

### Intake & Freigabe (HITL)

| Function | Beschreibung |
|----------|--------------|
| `fn_approve_intake(...)` | Projekt-Intake genehmigen |
| `fn_reject_intake(...)` | Projekt-Intake ablehnen |
| `create_approval(...)` | Freigabe-Anfrage erstellen |
| `decide_approval(...)` | Freigabe erteilen/ablehnen |
| `check_expired_approvals()` | Abgelaufene Freigaben pruefen |
| `fn_resolve_duplicate_check(...)` | Duplikatpruefung aufloesen |

### Material & Einkauf

| Function | Beschreibung |
|----------|--------------|
| `calculate_project_materials_v3(...)` | Materialbedarf berechnen (aktuelle Version) |
| `generate_project_materials(...)` | Materialliste generieren |
| `populate_project_material_needs(...)` | Materialbedarf befuellen |
| `generate_packing_list(...)` | Packliste erstellen |
| `find_or_create_supplier_article(...)` | Artikel anlegen wenn nicht vorhanden |
| `record_price_from_invoice(...)` | Preis aus Rechnung erfassen |
| `get_cheapest_supplier(...)` | Guenstigsten Lieferanten finden |
| `search_products(...)` | Produktsuche |
| `learn_material_choice(...)` | Materialwahl lernen |
| `calculate_order_quantities(...)` | Bestellmengen berechnen |
| `suggest_purchase_orders(...)` | Bestellvorschlaege |
| `claim_next_receipt()` | Naechsten Beleg aus Queue holen |
| `fn_approve_material_order(...)` | Materialbestellung genehmigen |

### Finanzen

| Function | Beschreibung |
|----------|--------------|
| `generate_invoice_number()` | Rechnungsnummer generieren |
| `generate_sales_invoice_pdf(...)` | Rechnungs-PDF Daten |
| `record_invoice_payment(...)` | Zahlung erfassen |
| `mark_invoice_paid(...)` | Rechnung als bezahlt markieren |
| `check_overdue_invoices()` | Ueberfaellige Rechnungen pruefen |
| `import_bank_transaction(...)` | Banktransaktion importieren |
| `auto_match_bank_transactions(...)` | Automatisches Matching |
| `find_payment_matches(...)` | Zahlungszuordnung finden |
| `export_datev_csv(...)` | DATEV-Export |
| `mark_lexware_synced(...)` | Lexware-Sync markieren |
| `get_marge_dashboard(...)` | Margen-Dashboard |

### Begehungen

| Function | Beschreibung |
|----------|--------------|
| `create_inspection_protocol(...)` | Protokoll anlegen |
| `complete_erstbegehung(...)` | Erstbegehung abschliessen |
| `complete_abnahme(...)` | Abnahme abschliessen |
| `get_inspection_protocol_details(...)` | Protokolldetails laden |
| `create_defect(...)` | Mangel erfassen |
| `update_defect_status(...)` | Mangelstatus aendern |
| `get_or_create_zb_protocol(...)` | Zwischenbegehung holen/anlegen |

### Pipeline / Autoplanung (Staffellauf)

| Function | Beschreibung |
|----------|--------------|
| `fn_pipeline_start(...)` | Pipeline starten |
| `fn_pipeline_step_start(...)` | Pipeline-Schritt starten |
| `fn_pipeline_step_complete(...)` | Schritt abschliessen |
| `fn_pipeline_complete(...)` | Pipeline abschliessen |
| `fn_agent_zeitpruefer(...)` | Agent: Zeitpruefung |
| `fn_agent_plausibility(...)` | Agent: Plausibilitaetspruefung |
| `fn_agent_material(...)` | Agent: Materialpruefung |
| `fn_agent_einsatzplaner(...)` | Agent: Einsatzplanung |
| `fn_godmode_learner(...)` | Godmode: SOLL vs IST lernen |
| `generate_project_schedule(...)` | Terminplan generieren |

### Event-System

| Function | Beschreibung |
|----------|--------------|
| `log_event(...)` | Event in events-Tabelle schreiben |
| `mark_event_processed(...)` | Event als verarbeitet markieren |
| `is_event_processed(...)` | Pruefen ob Event verarbeitet |
| `log_event_as_activity(...)` | Event als Aktivitaet loggen |

---

## ENUMS (31 Typen)

### Kern-Enums

| Enum | Werte |
|------|-------|
| `project_status` | INTAKE, DRAFT, ACTIVE, INSPECTION, PLANNING, IN_PROGRESS, COMPLETION, BILLING, ON_HOLD, COMPLETED, CANCELLED, ARCHIVED |
| `trade_type` | Sanitaer, Maler, Elektro, Fliesen, Trockenbau, Tischler, Heizung, Boden, Maurer, Reinigung, Sonstiges |
| `offer_status` | DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED |
| `approval_status` | PENDING, APPROVED, REJECTED, REVISED, EXPIRED |
| `approval_type` | PROJECT_START, INSPECTION_ASSIGN, MATERIAL_ORDER, SUBCONTRACTOR_ORDER, SCHEDULE, COMPLETION, INVOICE, INSPECTION, SITE_INSPECTION, DUPLICATE_CHECK |

### Einkauf-Enums

| Enum | Werte |
|------|-------|
| `purchase_invoice_status` | DRAFT, PENDING, APPROVED, PAID, DISPUTED, CANCELLED |
| `purchase_order_status` | DRAFT, SENT, CONFIRMED, DELIVERED, CANCELLED |
| `purchase_unit` | STUECK, PACKUNG, PALETTE, METER, QM, KG, LITER, SATZ, PAUSCHAL |
| `expense_category` | MATERIAL, SUBCONTRACTOR, VEHICLE_FUEL, VEHICLE_RENTAL, VEHICLE_REPAIR, ENTERTAINMENT, SOFTWARE, INSURANCE, OFFICE, DISPOSAL, OTHER |
| `supplier_type` | GROSSHANDEL, BAUMARKT, FACHHANDEL, HERSTELLER, ONLINE, SONSTIGE |
| `invoice_source_type` | SCAN, EMAIL, UPLOAD, API, SUPERCHAT |
| `receipt_queue_status` | PENDING, PROCESSING, DONE, ERROR, SKIPPED |

### Finanz-Enums

| Enum | Werte |
|------|-------|
| `sales_invoice_status` | DRAFT, SENT, PAID, OVERDUE, CANCELLED, APPROVED, REJECTED, PAIDOFF, VOIDED, OPEN |
| `sales_invoice_type` | ABSCHLAG, TEIL, SCHLUSS, GUTSCHRIFT, ABSCHLAG_LEXWARE |
| `transaction_type` | CREDIT, DEBIT, TRANSFER, FEE |
| `payment_match_status` | SUGGESTED, CONFIRMED, REJECTED |

### Workflow-Enums

| Enum | Werte |
|------|-------|
| `workflow_step_status` | PENDING, IN_PROGRESS, DONE, FAILED, DEAD_LETTER |
| `pipeline_run_status` | running, completed, stopped, failed |
| `pipeline_step_status` | running, completed, stopped, failed, skipped |

### Sonstige Enums

| Enum | Werte |
|------|-------|
| `client_type` | PRIVATE, COMMERCIAL, HOUSING_COMPANY, PROPERTY_MANAGER, INSURANCE, SYSTEM |
| `lead_status` | NEW, QUALIFIED, DISQUALIFIED, CONVERTED |
| `position_type` | STANDARD, EVENTUAL, ALTERNATIVE |
| `protocol_type` | ERSTBEGEHUNG, ZWISCHENBEGEHUNG, ABNAHME, MATERIAL, NACHTRAG |
| `labor_group` | HELFER, GESELLE, MEISTER, AZUBI |
| `change_order_status` | DRAFT, SUBMITTED, APPROVED, REJECTED, INVOICED, CANCELLED, PENDING_APPROVAL, PENDING_CUSTOMER, APPROVED_BY_CUSTOMER, REJECTED_BY_CUSTOMER |
| `change_order_reason` | ADDITIONAL_WORK, MODIFIED_WORK, UNFORESEEN, CLIENT_REQUEST, PLANNING_ERROR, OTHER |
| `assignment_status` | ASSIGNED, IN_PROGRESS, COMPLETED, VERIFIED |
| `defect_severity` | minor, medium, critical |
| `defect_status` | open, in_progress, pending_review, resolved, rejected, closed |
| `packing_item_type` | material, tool, consumable |

### event_type Enum (120+ Werte)

Zu gross fuer Tabelle — wichtigste Gruppen:

| Praefix | Beispiele | Modul |
|---------|-----------|-------|
| `DOC_CLASSIFIED_*` | PROJECT_ORDER, INVOICE_IN, CREDIT_NOTE, REMINDER, DEFECT_LIST, SUPPLEMENT, BID_REQUEST, MAGICPLAN | M1 Intake |
| `PROJECT_*` | CREATED, STATUS_CHANGED, UPDATED, FILES_READY, POSITIONS_CONFIRMED | Projekte |
| `DRIVE_*` | FOLDER_CREATED, YEAR_READY, TREE_CREATED, SETUP_COMPLETE | Drive |
| `OFFER_*` | CREATED, POSITIONS_EXTRACTED, GENERATION_REQUESTED, GENERATED, CALCULATED, PDF_GENERATED, ATTACHED | Angebote |
| `MATERIALS_*` | PLANNED, NEED_ASSIGNMENT, CALCULATED, ORDER_SENT | Material |
| `PURCHASE_*` | INVOICE_CREATED, INVOICE_APPROVED, INVOICE_PAID, ORDER_CREATED, ORDER_SENT | Einkauf |
| `INSPECTION_*` | PROTOCOL_CREATED, PROTOCOL_COMPLETED, REQUIRES_SUPPLEMENT, FINALIZED | Begehung |
| `APPROVAL_*` | REQUESTED, REMINDED, DECIDED, APPROVED, DISPATCHED | Freigabe |
| `LEXWARE_*` | CONTACT_READY, PUSH_COMPLETED, PAYMENT_RECEIVED, INVOICE_CHANGED, INVOICE_SYNCED | Lexware |
| `CHANGE_ORDER_*` | CREATED, SUBMITTED, CUSTOMER_APPROVED, CUSTOMER_REJECTED | Nachtraege |
| `SCHEDULE_*` | GENERATED, PROPOSED, CONFIRMED, APPROVED | Terminplanung |
| `BANK_*` | TRANSACTION_CREATED, IMPORT_COMPLETED | Banking |

---

## EVENT-SYSTEM SCHEMA

```sql
events (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  event_type TEXT NOT NULL,          -- oder event_type ENUM
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,          -- NULL = unverarbeitet
  idempotency_key TEXT UNIQUE,
  source_system TEXT,
  source_flow TEXT,
  error_log TEXT
)

event_routing (
  event_type TEXT PRIMARY KEY,
  target_workflow TEXT NOT NULL,
  webhook_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true
)

dispatch_errors (
  id UUID PRIMARY KEY,
  event_id UUID,
  event_type TEXT,
  target_workflow TEXT,
  webhook_url TEXT,
  error_message TEXT,
  error_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

---

## ZUSCHLAGSKALKULATION

```
                    Σ Gemeinkosten (Monat)
Zuschlagssatz = ────────────────────────────── x 100%
                    Σ Einzelkosten (Monat)
```

**Einzelkosten** (MATERIAL, SUBCONTRACTOR) = Direkt einem Projekt zuordenbar
**AGK/Gemeinkosten** (VEHICLE_*, ENTERTAINMENT, SOFTWARE, ...) = Zuschlagssatz

---

*Zuletzt aktualisiert: 2026-03-21 (Issue #32)*
