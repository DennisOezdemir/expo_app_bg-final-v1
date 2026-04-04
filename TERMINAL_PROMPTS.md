# 8 Terminal-Prompts fuer paralleles Bauen

> **Datum:** 2026-03-17
> **Basis-Commit:** 9853e42 (main)
> **Modell:** Opus 1M fuer alle Terminals
> **Modus:** `claude --dangerously-skip-permissions`

Kopiere jeden Prompt in ein eigenes CC-Terminal. Jedes Terminal arbeitet NUR auf seinem Branch.

---

## Terminal 1: Finance Dashboard

```
Du arbeitest im BauGenius Expo-Projekt. Wechsle SOFORT auf den Branch feat/finance-dashboard:
git checkout feat/finance-dashboard

Du arbeitest NUR auf diesem Branch. Kein anderer Branch, kein main.

AUFGABE: Finance Dashboard (Geld-Tab) mit echten Daten aufbauen.

KONTEXT LESEN:
1. docs/NORDSTAR.md — 7 UX-Gebote, Ayse-Test
2. docs/PERSONA_AYSE.md — Zielnutzerin
3. docs/TODO_FINANCE_DASHBOARD.md — Bestehendes Konzept
4. app/finanzen/index.tsx — Aktueller Mock (1105 Zeilen, alles Fake-Daten)
5. docs/REPORT_2026-02-27_SUPABASE_ANALYSE.md — Datenbestand

BAUE:

Tab 1: Projekt-Controlling
- Ampel-Karten oben: Umsatz (gruen) / Kosten (gelb) / Ergebnis + Marge
- Tabelle: Alle Projekte mit Beauftragungssumme, Istkosten, Marge, Durchlaufzeit (Tage seit Anlage)
- Halbfertige Arbeiten: Beauftragungssumme × ZB-Fortschritt (%) = angefangener Wert
- Projekt-Deckungsbeitrag: Angebot minus Istkosten (purchase_invoices)
- Top-Margenfresser: Welche Positionen fressen Marge
- Offene Nachtraege (change_orders: genehmigt aber nicht abgerechnet)

Tab 2: Buchfuehrung
- Offene Belege (purchase_invoices WHERE payment_status != 'paid')
- Bezahlte Belege mit Zahlungsziel-Info
- Faellige/ueberfaellige Rechnungen (rot markiert)
- Daten aus Lexware via bestehende Felder (lexware_voucher_id, payment_status etc.)

KPIs (Controller-Sicht):
- Liquiditaetsampel: Offene Forderungen vs. offene Verbindlichkeiten
- Kostenart-Verteilung: Material/Lohn/Sub/AGK (aus expense_category)
- Monatsvergleich: Aktuell vs. Vormonat
- Cashflow-Prognose: Wann kommen welche Zahlungen

DATENQUELLEN:
- projects, offers, offer_positions (Beauftragungssumme)
- purchase_invoices, purchase_invoice_items (Kosten)
- sales_invoices (Umsatz/Forderungen)
- change_orders (Nachtraege)
- Lexware-Felder auf purchase_invoices (payment_status, lexware_paid_amount)

TECH:
- React Query Hooks in hooks/ anlegen (useFinanceDashboard, useProjectControlling etc.)
- Echte Supabase-Queries, KEINE Mock-Daten
- Ampelfarben: gruen/gelb/rot
- Mobile-first, grosse Touch-Targets

NICHT ANFASSEN: Andere Tabs, andere Screens, contexts/, server/
```

---

## Terminal 2: Rechnungstool

```
Du arbeitest im BauGenius Expo-Projekt. Wechsle SOFORT auf den Branch feat/rechnungstool:
git checkout feat/rechnungstool

Du arbeitest NUR auf diesem Branch. Kein anderer Branch, kein main.

AUFGABE: Rechnungstool zum Erstellen und Verwalten von Ausgangsrechnungen.

KONTEXT LESEN:
1. docs/NORDSTAR.md + docs/PERSONA_AYSE.md — UX-Regeln
2. app/rechnung/[id].tsx — Aktueller Mock (957 Zeilen)
3. docs/ARCHITEKTUR.md — Tech-Stack

REFERENZ-DESIGN (von "Das Programm" / app.das-programm.io):
Das BG-Rechnungstool orientiert sich an diesem Vorbild:

Header:
- Icon-Toolbar: PDF Download, Duplizieren, Drucken, E-Mail versenden, Loeschen
- Kundensuche (aus clients Tabelle)
- Felder: Bezeichnung, Projekt (Dropdown), Status (Entwurf/Offen/Bezahlt/Ueberfaellig), Typ (Rechnung/Abschlagsrechnung/Schlussrechnung)
- Objektadresse
- Summen rechts: Netto, Umsatzsteuer (19%), Brutto

Anschreiben:
- Rich-Text-Editor (Bold, Italic, Listen, Ausrichtung)
- Textbausteine: Dropdown mit vorgefertigten Texten (text_blocks Tabelle)

Positionstabelle:
- Hierarchisch: Titel (Sections) > Positionen
- Spalten: #, Menge, Einheit, Leistung/Material, Einheitspreis, Nachlass %, Gesamt
- Positionen aus offer_positions laden (vorausgefuellt)
- + neue Position, + neuer Titel

Finanzen:
- Netto vor Nachlass
- Nachlass (optional)
- Abzuege/Aufschlaege
- Sicherheitseinbehalt (5% Standard bei SAGA)
- Bereits gestellte Rechnungen in Abzug bringen (fuer Abschlagsrechnungen)

KILLER-FEATURE — Automatische Abschlagsrechnungs-Vorschlaege:
- Wenn ZB-Fortschritt (aus offer_positions.progress_percent) einen Schwellwert erreicht (z.B. 30%, 60%, 100%)
- System schlaegt Abschlagsrechnung vor im Freigabecenter
- Betrag = Beauftragungssumme × Fortschritt% minus bereits gestellte Abschlaege
- GF muss nur noch [Freigeben] druecken

Optionen:
- Zahlungsziel (Tage)
- Skonto
- Leistungszeitraum (von/bis)
- PDF Export

Verlauf:
- Erstellt am/von, Geaendert am/von

DATENQUELLEN:
- sales_invoices + sales_invoice_items (Tabellen existieren, Migration 026)
- offers + offer_positions (Positionen laden)
- clients (Kundendaten)
- projects (Projektzuordnung)
- text_blocks (Textbausteine, falls vorhanden — sonst anlegen)

TECH:
- React Query Hooks: useInvoice, useCreateInvoice, useInvoicePositions
- Supabase Queries, KEINE Mocks
- PDF-Generierung: Gotenberg via Edge Function (existiert in supabase/functions/generate-pdf/)

NICHT ANFASSEN: app/finanzen/, app/(tabs)/, contexts/, server/routes.ts
```

---

## Terminal 3: Aktivitaeten-Feed

```
Du arbeitest im BauGenius Expo-Projekt. Wechsle SOFORT auf den Branch feat/aktivitaeten:
git checkout feat/aktivitaeten

Du arbeitest NUR auf diesem Branch. Kein anderer Branch, kein main.

AUFGABE: Letzte Aktivitaeten auf dem Home-Screen mit echten Daten.

KONTEXT LESEN:
1. docs/PERSONA_AYSE.md — UX
2. app/(tabs)/index.tsx — Home-Screen (aktuell Mock-Daten)

BAUE:
- Aktivitaeten-Feed auf dem Home-Screen (ersetzt die Mock-Daten)
- Daten aus project_activities (959 Eintraege vorhanden!)
- Gruppiert nach: Heute / Gestern / Diese Woche / Aelter
- Pro Eintrag: Icon je activity_type, Titel, Projekt-Referenz, Zeitstempel
- activity_types sinnvoll mit Icons mappen (z.B. PROJECT_CREATED = Ordner, OFFER_SENT = Brief, PHOTO_UPLOADED = Kamera etc.)
- Pull-to-Refresh
- Tap auf Eintrag -> Navigation zum jeweiligen Projekt

TECH:
- React Query Hook: useActivities mit Pagination
- Supabase Query auf project_activities mit projects JOIN
- Realtime-Subscription fuer neue Aktivitaeten (supabase.channel)

NICHT ANFASSEN: Andere Tabs, app/finanzen/, app/rechnung/, contexts/
```

---

## Terminal 4: PDF-Erzeugung

```
Du arbeitest im BauGenius Expo-Projekt. Wechsle SOFORT auf den Branch feat/pdf-generation:
git checkout feat/pdf-generation

Du arbeitest NUR auf diesem Branch. Kein anderer Branch, kein main.

AUFGABE: PDF-Templates fuer EB/ZB/AB Protokolle und Monteurauftraege (DE/TR/RU).

KONTEXT LESEN:
1. docs/CORE_FLOW_API.md — EB/ZB/AB Flow
2. docs/PATTERNS.md — Gotenberg Pattern
3. docs/n8n-flows/M2_01_Monteur_Auftrag_PDF_UPDATED_BUILD_HTML.js — Bestehendes Monteur-Template
4. supabase/functions/generate-pdf/index.ts — Bestehende PDF Edge Function

BAUE:

1. Protokoll-PDFs (EB, ZB, AB):
- HTML-Templates im Firmendesign (aehnlich dem Angebots-Template)
- EB-Protokoll: Positionen mit Ja/Nein Status, Maengel, Fotos, Datum, Pruefer
- ZB-Protokoll: Positionen mit Fortschritt %, Fotos, Protokollnummer
- AB-Protokoll: Alle 100% Positionen, Unterschrift-Feld, Abnahmedatum
- Edge Function oder Server-Route die Gotenberg aufruft
- Gotenberg URL: https://gotenberg.srv1045913.hstgr.cloud

2. Monteurauftrag Uebersetzungen pruefen:
- Labels DE/TR/PL/RO/RU existieren in M2_01 Build HTML (geprueft)
- PRUEFEN: Sind die Positions-Texte (catalog_positions_v2.title_tr, title_ru) befuellt?
- SQL ausfuehren: SELECT COUNT(*) FROM catalog_positions_v2 WHERE title_tr IS NOT NULL
- Falls leer: M2_11_Translate_Positions Flow-Logik implementieren (Claude API fuer Batch-Uebersetzung)

3. Frontend-Buttons:
- Nach abgeschlossener EB: Button "EB-Protokoll als PDF" im Projekt-Detail
- Nach ZB: Button "ZB-Protokoll als PDF"
- Nach AB: Button "Abnahme-Protokoll als PDF"
- Monteurauftrag: Sprach-Auswahl (DE/TR/RU) beim Generieren

TECH:
- Gotenberg: POST HTML -> PDF zurueck
- Templates als HTML-Strings in einer eigenen Datei (lib/pdf-templates/)
- Supabase Storage: PDFs in project-files/{project_id}/protokolle/ speichern

NICHT ANFASSEN: app/(tabs)/, app/finanzen/, app/rechnung/, contexts/
```

---

## Terminal 5: Autoplanung Frontend

```
Du arbeitest im BauGenius Expo-Projekt. Wechsle SOFORT auf den Branch feat/autoplanung-ui:
git checkout feat/autoplanung-ui

Du arbeitest NUR auf diesem Branch. Kein anderer Branch, kein main.

AUFGABE: Pipeline-Fortschritt der Autoplanung im Frontend sichtbar machen (Issue #18, Phase 5).

KONTEXT LESEN:
1. docs/AGENT_REGISTRY.md — Die 5 Staffellauf-Agenten und ihre Schemas
2. docs/NORDSTAR.md — Staffellauf-Prinzip
3. app/project/[id].tsx — Projektdetail (hier Pipeline einbauen)
4. app/planung/index.tsx — Planungsseite
5. app/freigabe/[id].tsx — Freigabe-Detail

HINTERGRUND:
Phase 0-2 sind LIVE. Die Pipeline laeuft als Supabase-Funktionen:
- fn_agent_zeitpruefer() -> fn_agent_plausibility() -> fn_agent_material() -> fn_agent_einsatzplaner()
- Tracking in: pipeline_runs (ein Lauf) + pipeline_steps (ein Schritt pro Agent)
- 31 Richtzeitwerte in richtzeitwerte Tabelle

BAUE:

1. Projektdetail-Seite — Pipeline-Status:
- Letzten pipeline_run fuer das Projekt laden
- Fortschrittsanzeige: 5 Schritte (Zeitpruefer -> Plausibilitaet -> Material -> Einsatzplaner -> Freigabe)
- Status pro Schritt: wartend / laeuft / fertig / gestoppt
- Warnungen aus pipeline_steps.warnings anzeigen
- Confidence-Score vom Zeitpruefer
- Button "Planung starten" (ruft auto_plan_full() via RPC auf)

2. Freigabe-Detail:
- Agent-Schritte aus pipeline_steps anzeigen
- Dauer pro Schritt
- Warnungen und Fehler sichtbar
- Ergebnis: Zeitplan + Materialiste + Monteur-Zuweisungen

3. Planungsseite:
- Pipeline-Status pro Projekt als Badge/Indikator
- running / completed / stopped / not_started

TECH:
- React Query Hook: usePipelineRun(projectId), usePipelineSteps(runId)
- Supabase Queries auf pipeline_runs + pipeline_steps
- Ampelfarben fuer Status

NICHT ANFASSEN: app/(tabs)/finanzen.tsx, app/rechnung/, server/, contexts/
```

---

## Terminal 6: Intake Dedup (Issue #15)

```
Du arbeitest im BauGenius Expo-Projekt. Wechsle SOFORT auf den Branch feat/intake-dedup:
git checkout feat/intake-dedup

Du arbeitest NUR auf diesem Branch. Kein anderer Branch, kein main.

AUFGABE: Duplikat-Erkennung im Intake-Flow (Issue #15).

KONTEXT LESEN:
1. docs/FLOW_WABS_AV.md — Adress-Deduplizierung Konzept (bereits definiert!)
2. docs/FLOW_REGISTER.md — M1_02 PDF Parser, Event-Routing
3. docs/FLOW_ARCHITECTURE.md — Intake-Kette
4. docs/ARCHITEKTUR.md — Event-System

PROBLEM:
Wenn 2 Auftraege (AV + WABS) fuer die gleiche Baustelle kommen, erstellt der Intake 2 separate Projekte statt 1 Projekt mit 2 Angeboten.

BAUE:

1. Supabase Function: find_matching_project(p_street, p_city, p_client_id)
- Sucht bestehendes Projekt mit gleicher Adresse + Client
- Returns: project_id wenn 100% Match, NULL wenn kein Match
- Fuzzy: Bei unsicherem Match -> DUPLICATE_CHECK Approval

2. Supabase Function: attach_offer_to_project(p_project_id, p_offer_data)
- Legt neues Angebot an bestehendem Projekt an
- UNIQUE Constraint auf offers.project_id wurde bereits entfernt (Migration 20260310080000)

3. Approval-Typ DUPLICATE_CHECK:
- Wenn Adresse aehnlich aber nicht 100% Match
- request_data: new_address, matched_project_id, match_confidence, catalog_type
- User waehlt: [Anhaengen] oder [Neues Projekt]
- In approvals Tabelle mit approval_type = 'DUPLICATE_CHECK'

4. M1_02 PDF Parser Anpassung:
- Nach Extraktion: find_matching_project() aufrufen
- Bei Match: attach_offer_to_project() statt neues Projekt
- Bei Unsicher: DUPLICATE_CHECK Approval erstellen
- Bei kein Match: wie bisher neues Projekt

TECH:
- Alles in Supabase Functions (deterministische Logik)
- RLS beachten
- Idempotenz: idempotency_key auf Angebote
- Tests mit Referenzprojekt: BL-2026-028 Springeltwiete 9 (AV + WABS)

NICHT ANFASSEN: Frontend-Dateien, app/, components/
```

---

## Terminal 7: Chat-Agent (Issue #19, Phase 1)

```
Du arbeitest im BauGenius Expo-Projekt. Wechsle SOFORT auf den Branch feat/chat-agent:
git checkout feat/chat-agent

Du arbeitest NUR auf diesem Branch. Kein anderer Branch, kein main.

AUFGABE: BauGenius Chat-Agent MVP mit Claude Tool Use (Issue #19, Phase 1).

KONTEXT LESEN:
1. docs/AGENT_REGISTRY.md — Agent-Schemas
2. docs/NORDSTAR.md — Vision
3. app/chat/[id].tsx — Bestehende Chat-UI (1247 Zeilen, Mock)
4. contexts/RoleContext.tsx — Rollen (GF/BL/Monteur)

BAUE:

1. Supabase Edge Function: agent-chat
- Claude API mit Tool Use (claude-sonnet-4-20250514)
- System-Prompt: "Du bist der BauGenius Assistent. Du hilfst Handwerkern auf der Baustelle."
- WICHTIG: Die Rolle des Users wird mitgeschickt. Der Agent darf NUR Infos zeigen die der Rolle erlaubt sind:
  - GF: alles
  - BL: Projektdaten, Positionen, Material — KEINE Margen, KEINE Finanzen anderer Projekte
  - Monteur: Nur sein Projekt, seine Aufgaben — KEINE Preise, KEINE Margen

2. Tools fuer den Agent:
- query_positions(project_id, room?) — Positionen nach Raum abfragen
- check_catalog(catalog_id, search_term) — Katalog durchsuchen
- create_change_order(project_id, positions[]) — Nachtrag anlegen
- prepare_email(to, subject, body) — Mail vorbereiten -> Freigabecenter
- get_project_status(project_id) — Projektstatus
- get_schedule(project_id) — Einsatzplan

3. Chat-UI aufraumen:
- Bestehende Mock-Nachrichten durch echte ersetzen
- Chat-History in Supabase persistieren (neue Tabelle chat_messages)
- Streaming-Response von Claude anzeigen
- Projektbezogen: Chat ist immer im Kontext eines Projekts

4. Freigabecenter-Integration:
- Wenn Agent create_change_order oder prepare_email aufruft
- Erstellt Eintrag in approvals Tabelle
- GF bekommt Notification

TECH:
- Edge Function: Deno, @anthropic-ai/sdk
- Chat-History: chat_messages Tabelle mit RLS
- Frontend: React Query + Realtime fuer neue Nachrichten

NICHT ANFASSEN: app/(tabs)/finanzen.tsx, app/rechnung/, server/routes.ts
```

---

## Terminal 8: Rollenverteilung

```
Du arbeitest im BauGenius Expo-Projekt. Wechsle SOFORT auf den Branch feat/rollen-views:
git checkout feat/rollen-views

Du arbeitest NUR auf diesem Branch. Kein anderer Branch, kein main.

AUFGABE: Echtes Permission-Enforcement fuer GF/BL/Monteur Rollen.

KONTEXT LESEN:
1. contexts/RoleContext.tsx — Bestehende Rollen-Definition (3 Rollen, Permissions, Views)
2. app/(tabs)/_layout.tsx — Tab-Navigation
3. Alle Screens in app/(tabs)/ durchlesen

ROLLEN-DEFINITION:

GF (Geschaeftsfuehrer):
- Sieht ALLES
- Alle Tabs, alle Projekte, Finance Dashboard, Margen, Freigaben, Rechnungen

BL (Bauleiter):
- KEIN Finance Dashboard (Geld-Tab wird ausgeblendet oder zeigt nur seine Projekte)
- Sieht NUR seine zugewiesenen Projekte
- Sieht Beauftragungssumme + Marge seiner Projekte
- Hat Zugang zu: Begehungen, Material, Planung
- Chat: ja, aber keine Finanz-Queries anderer Projekte

Monteur:
- Sieht NUR die Projektseite mit seinen Aufgaben
- Aufgaben kommen aus Autoplanung (schedule_phases + Zuweisungen) nach GF-Freigabe
- Tabs: Home (seine Aufgaben), Projekte (nur zugewiesene), Chat
- KEIN Zugang zu: Finance, Rechnungen, Freigaben, Einstellungen
- KEINE Preise sichtbar, KEINE Margen
- Hat: Zeiterfassung, Fotos, Maengel melden

BAUE:

1. RoleContext erweitern:
- hasPermission(permission) Funktion robust machen
- canViewScreen(screenName) Funktion
- filterProjectsByRole(projects, userId) — BL/Monteur sehen nur ihre

2. Tab-Navigation anpassen:
- _layout.tsx: Tabs basierend auf Rolle ein/ausblenden
- GF: alle Tabs
- BL: Home, Projekte, (+), Freigaben, Mehr (ohne Finance)
- Monteur: Home (Meine Aufgaben), Projekte, (+Foto), Chat

3. Screen-Guards:
- Wrapper-Component <RoleGuard requiredRole="gf"> fuer geschuetzte Screens
- Redirect zu "Kein Zugriff" wenn Rolle nicht passt

4. Daten-Filterung:
- Projekte: BL sieht nur wo er BL ist, Monteur nur wo er zugewiesen ist
- Supabase RLS Policies die user_id / role pruefen (vorbereiten, nicht deployen)

WICHTIG: Monteur-Begehungsscreens VORBEREITEN aber noch NICHT aktivieren.
Erstmal nur BL-Ebene fuer Begehungen.

NICHT ANFASSEN: Keine inhaltlichen Aenderungen an Screens (nur Wrapping/Guards).
Keine Aenderungen an app/finanzen/index.tsx oder app/rechnung/.
```

---

## Terminal 9: Lexware Beleg-Pipeline

```
Du arbeitest im BauGenius Expo-Projekt. Wechsle SOFORT auf den Branch feat/lexware-beleg-pipeline:
git checkout feat/lexware-beleg-pipeline

Du arbeitest NUR auf diesem Branch. Kein anderer Branch, kein main.

AUFGABE: Beleg-Pipeline komplett ueberarbeiten — Lexware wird Source of Truth.

KONTEXT LESEN:
1. docs/FLOW_REGISTER.md — Aktuelle M6 Flows (9 aktiv)
2. docs/FLOW_ARCHITECTURE.md — Fehlerbehandlung, AI Fallback
3. docs/PATTERNS.md — n8n Patterns, SQL Patterns
4. n8n-workflows/M6_01_Invoice_Processor.json — AKTUELLER Flow (hier sind die Bugs)
5. docs/ARCHITEKTUR.md — Event-System

AKTUELLE PROBLEME:

1. MULTI-ATTACHMENT BUG:
   In M6_01 Extract Event Data (Zeile 20 im JSON):
   const firstFileId = fileIds[0]  ← NUR ERSTER ANHANG
   Download-Node nutzt nur primary_file_id
   → Zweiter Anhang wird komplett ignoriert

2. GUTSCHRIFT-BUG:
   Absender "besser zuhause GmbH" sendet Gutschriften (Einnahmen fuer DBL).
   Emails mit Betreff "Gutschrift"/"Gutschriften" von besser zuhause.
   Der Classifier (MX_03) stuft diese als INVOICE_IN (Ausgabe) ein statt als CREDIT_NOTE.
   besser zuhause sendet NUR Gutschriften, nie echte Rechnungen an DBL.

3. KEINE PROJEKTZUORDNUNG:
   Claude Vision extrahiert keine Projektnummer (BL-YYYY-NNN) und keine Lieferadresse.
   Dennis gibt bei Bestellungen immer die Projektnummer oder Adresse an.
   Wenn nichts gefunden → Lagerware (MATERIAL ohne Projekt) oder Gemeinkosten (AGK).

4. FRAGILER LEXWARE-PUSH:
   M6_02a/b/c Kette versagt — 39 von 139 Belegen nie zu Lexware gepusht.
   Wird ersetzt durch Email-Forwarding.

BAUE DIESE 5 FIXES:

FIX 1 — Multi-Attachment Loop:
- M6_01: Statt file_ids[0] → Loop ueber ALLE file_ids
- Pro Anhang: einzeln downloaden, einzeln an Claude Vision senden
- Pro Anhang: eigenen purchase_invoice Eintrag anlegen
- Idempotency: idempotency_key = m6_{superchat_message_id}_{file_index}

FIX 2 — Gutschrift-Erkennung:
- In MX_03 Classifier ODER M6_01:
  IF Absender enthält "besser zuhause" → doc_type = 'CREDIT_NOTE'
  IF Betreff enthält "Gutschrift" oder "Storno" → doc_type = 'CREDIT_NOTE'
  IF Claude Vision findet "Gutschrift" auf dem PDF → doc_type = 'CREDIT_NOTE'
- Neues Feld auf purchase_invoices: invoice_type TEXT DEFAULT 'invoice'
  Werte: 'invoice' | 'credit_note'
- Migration schreiben: ALTER TABLE purchase_invoices ADD COLUMN invoice_type TEXT DEFAULT 'invoice'

FIX 3 — Projektzuordnung via Claude Vision:
- Claude Vision Prompt erweitern um:
  "Suche auf dem Beleg nach:
   1. Projektnummer im Format BL-YYYY-NNN (z.B. BL-2026-014)
   2. Lieferadresse / Baustellenadresse (Strasse + Stadt/PLZ)
   3. Bestellreferenz oder Auftragsnummer
   Gib zurueck: project_reference, delivery_address"
- Nach Extraktion: Supabase Function aufrufen:
  SELECT id FROM projects
  WHERE project_number = extracted_ref
  OR address ILIKE '%' || extracted_street || '%'
- Wenn Match → project_id setzen
- Wenn kein Match:
  - expense_category IN ('MATERIAL','SUBCONTRACTOR') → Lagerware (project_id = NULL)
  - Alles andere → Gemeinkosten/AGK (project_id = NULL)

FIX 4 — Email-Forward an Lexware:
- NACH erfolgreicher Verarbeitung in M6_01:
- PDF aus Supabase Storage laden
- Email senden an: bauloewen@inbox.lexware.email
- Betreff: "{invoice_number} - {supplier_name}"
- Body: "Automatisch weitergeleitet von BauGenius"
- PDF als Anhang
- n8n "Send Email" Node (SMTP oder Gmail Credentials)
- Bei Fehler: Error loggen, Telegram-Alert, NICHT den ganzen Flow stoppen

FIX 5 — Taeglicher Reconciliation Pull (NEUER Flow M6_10):
- Cron: Taeglich 06:00 Uhr
- Schritt 1: Lexware API GET /v1/vouchers (Filter: 2026, Eingangsbelege)
- Schritt 2: Alle purchase_invoices aus DB laden
- Schritt 3: Match auf invoice_number
- Schritt 4: Sync-Logik:
  a) In Lexware + DB → payment_status, paid_amount, due_date syncen
  b) In DB aber NICHT in Lexware → PDF nochmal an Lexware mailen
  c) In Lexware aber NICHT in DB → Als Info loggen (Kleinbelege, Kontoauszug-Imports)
  d) Status-Diff → Lexware gewinnt (Source of Truth)
- Schritt 5: Ergebnis in events Tabelle: RECONCILIATION_COMPLETED
- Schritt 6: Telegram-Report:
  "Beleg-Abgleich 06:00:
   Gesamt: 195 Lexware / 142 DB
   Neu gesynct: 3
   Nachgesendet: 1
   Fehler: 0"

ALTE FLOWS DEAKTIVIEREN (NICHT loeschen):
- M6_02a_Lexware_Push_Prepare → deaktivieren
- M6_02b_Lexware_Contact_Sync → deaktivieren
- M6_02c_Lexware_Push_Voucher → deaktivieren
Diese werden durch FIX 4 (Email-Forward) ersetzt.

M6_03 (Lexware Pull Sales) und M6_04a-d (Webhooks) BEHALTEN — die holen Daten VON Lexware.

TECH:
- n8n Flows (M6_01 anpassen + M6_10 neu)
- Supabase Migration fuer invoice_type Feld
- Supabase Function fuer Projekt-Matching
- SMTP/Gmail fuer Email-Versand an Lexware

TESTEN MIT:
- Beleg mit 2 Anhaengen (2 PDFs in einer Mail)
- Gutschrift von besser zuhause (Betreff "Gutschrift")
- Beleg mit Projektnummer BL-2026-014 auf dem PDF
- Beleg ohne Projektnummer (muss als Lagerware/AGK erkannt werden)

NICHT ANFASSEN: Frontend-Dateien, app/, components/, contexts/
```

---

## Terminal 10: Richtzeitwerte & Katalog-Mapping

```
Du arbeitest im BauGenius Expo-Projekt. Branch: feat/autoplanung-ui

AUFGABE: Richtzeitwerte befuellen und Katalog-Mapping fixen, damit die Autoplanung realistische Zeitschaetzungen liefert statt Formel-Fallback.

KONTEXT LESEN:
1. CLAUDE.md — Projektregeln
2. docs/AGENT_REGISTRY.md — Agenten-Schemas (Zeitpruefer, Plausibilitaet)

PROBLEM:
Die Autoplanung (fn_agent_zeitpruefer) nutzt die Tabelle `richtzeitwerte` um labor_minutes pro Position zu berechnen. Aktuell:
- Nur 31 Richtzeitwerte vorhanden (1 Katalog, 6 Trades)
- 113 Positionen bei einem typischen Projekt (Lupinenacker: AV + WABS)
- 63 Positionen landen im Formel-Fallback (30% Material, 70EUR/h) → unbrauchbare Zeitschaetzungen
- Sanitaer: 23 Positionen, nur 1 hat catalog_position_v2_id → kein Match moeglich
- Fliesen: 9 Positionen, 0 catalog_position_v2_id → komplett ohne Referenz
- Ergebnis: "Sanitaer 48.3h geplant" statt realistisch 8-15h

IST-ZUSTAND DB:

richtzeitwerte (31 Eintraege):
- Spalten: id, catalog_position_nr, catalog_id, trade_id, labor_minutes_per_unit, unit, material_cost_per_unit, source, confidence, observation_count, notes
- Verknuepft ueber catalog_position_nr + catalog_id mit catalog_positions_v2
- Nur 1 Katalog abgedeckt, 6 Trades

offer_positions (113 bei Lupinenacker):
- Hat catalog_position_v2_id (FK auf catalog_positions_v2) — bei vielen NULL
- Hat trade (Text: Sanitaer, Maler, Elektro, etc.)
- Hat labor_minutes — wird vom Zeitpruefer befuellt (aktuell oft Fallback-Werte)
- Lupinenacker Breakdown:
  - Maler: 32 Pos, 32 mit catalog_ref ✅
  - Tischler: 27 Pos, 24 mit catalog_ref
  - Sanitaer: 23 Pos, nur 1 mit catalog_ref ❌
  - Fliesen: 9 Pos, 0 mit catalog_ref ❌
  - Heizung: 8 Pos, 8 mit catalog_ref ✅
  - Elektro: 5 Pos, 5 mit catalog_ref ✅
  - Boden: 5 Pos, 5 mit catalog_ref ✅
  - Sonstiges: 2 Pos, 1 mit catalog_ref
  - Reinigung: 2 Pos, 1 mit catalog_ref

catalog_positions_v2 (1.833 total):
- 9 Kataloge: AV-2024 (224), WABS (215), WBS-Sanitaer (141), WBS-Maler (128), WBS-Boden (95), WBS-Fliesen (92), WBS-Elektro (90), WBS-Tischler (74), DBL-2026 (774)

Supabase Projekt-ID: yetwntwayhmzmhhgdkli

AUFGABE:

1. Analyse: Pruefe welche Katalog-Positionen (AV-2024, WABS) KEINE Richtzeitwerte haben. Zeige die Luecken.

2. Richtzeitwerte befuellen: Fuer alle AV-2024 und WABS Katalog-Positionen realistische labor_minutes_per_unit + material_cost_per_unit eintragen
   - Nutze die existierenden 31 Werte als Referenz fuer das Format
   - Quelle fuer Zeitwerte: Branchenuebliche Richtzeitwerte fuer Maler/Sanitaer/Fliesen/Tischler/Heizung/Elektro/Boden
   - Bei Unsicherheit: confidence niedrig setzen, source = 'estimate'
   - WICHTIG: Realistische Werte! Ein WT-Armat demo+ents = ca. 45-60min, nicht 4h

3. catalog_position_v2_id Mapping: Offer-Positionen die keinen Katalog-Link haben mit der passenden catalog_positions_v2 verknuepfen
   - Match ueber Titel-Aehnlichkeit (offer_positions.title <-> catalog_positions_v2.title)
   - Nur matchen wenn sicher (>80% Uebereinstimmung)
   - Besonders Sanitaer (23 Pos, 1 ref) und Fliesen (9 Pos, 0 ref) fixen

4. Validierung: fn_agent_zeitpruefer() nochmal fuer Lupinenacker laufen lassen und pruefen ob der Formel-Fallback signifikant sinkt

NICHT ANFASSEN:
- Frontend-Code
- n8n Flows
- Andere Projekte als Lupinenacker zum Testen

ERWARTETES ERGEBNIS:
- Richtzeitwerte fuer alle ~440 AV+WABS Positionen (statt nur 31)
- Lupinenacker: 0 Formel-Fallback statt 63
- Sanitaer-Stunden: Realistischer Wert (ca. 8-15h statt 48h)
- Confidence-Score des Zeitpruefers: >0.7 statt aktuell <0.3
```

---

## Reihenfolge beim Mergen

1. Terminal 9 (Lexware Pipeline) — Backend/Flows, keine FE-Konflikte
2. Terminal 6 (Intake Dedup) — nur Backend, keine Konflikte
3. Terminal 3 (Aktivitaeten) — isoliert
4. Terminal 5 (Autoplanung UI) — isoliert
5. Terminal 4 (PDF) — isoliert
6. Terminal 7 (Chat-Agent) — isoliert
7. Terminal 1 (Finance Dashboard) — isoliert
8. Terminal 2 (Rechnungstool) — isoliert
9. Terminal 8 (Rollen) — ZULETZT, weil es viele Screens wrapped
