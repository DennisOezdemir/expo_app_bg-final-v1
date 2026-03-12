# AGENT REGISTRY — BAUGENIUS Agent-First Architecture

> **Lade diese Datei wenn:** Agent-Schemas, API-Design, Capability-Definitionen, Agent-to-Agent Kommunikation

---

## DAS PRINZIP

```
Jeder Agent = Eigenständiger Endpunkt + Definiertes Schema + Capability-Beschreibung
```

**Warum:** Egal ob Fetch.ai Agentverse, OpenAI Plugins, Anthropic MCP, Google Agent Protocols
oder WhatsApp — wer saubere Schemas hat, kann jeden Kanal bedienen.
Die Schemas sind die Grundlage. Der Discovery-Layer ist austauschbar.

**Der Vorteil:** Meisterbrief + Regionalwissen + echte Baustellendaten = Trust-Score
den kein globaler Agent replizieren kann.

---

## MONETARISIERUNG IM AGENT-ÖKOSYSTEM

```
Heute:   Google Ads → "Maler Kiel" → Klick → Anruf → Angebot
Morgen:  Personal Agent → "Badsanierung Kiel" → Agent Discovery → Angebot → Termin
```

Im Agent-to-Agent Ökosystem wird bezahlt für:
- **Priority Ranking** — Wer wird zuerst empfohlen?
- **Verified Partner** — Meisterbrief + Bewertungen = Trust-Score
- **Sponsored Agent** — Sichtbarkeit im Discovery
- **Provision** — % vom vermittelten Auftrag

Wer früh mit echtem Trust-Score + verifiziertem Meisterbrief drinsteht,
hat den First-Mover-Advantage — unabhängig welches Ökosystem gewinnt.

---

## TRUST-LAYER (Verifizierbare Credentials)

```yaml
agent_owner:
  name: "Dennis Özdemir"
  company: "Deine Baulöwen"
  credentials:
    - type: "Meisterbrief"
      trade: "Maler und Lackierer"
      issued_by: "Handwerkskammer"
      verifiable: true
    - type: "Fachkompetenz"
      area: "Fassadendämmtechnik"
    - type: "Gewerbeanmeldung"
      location: "Hamburg / Schleswig-Holstein"
  region:
    primary: ["Hamburg", "Kiel", "Neumünster", "Rendsburg"]
    radius_km: 120
  track_record:
    projects_completed: "tracked_in_supabase"
    avg_rating: "tracked_in_supabase"
    on_time_rate: "tracked_in_supabase"
```

Vorbereitet für On-Chain Verifikation (DID / Verifiable Credentials).
Aktuell: Supabase als Source of Truth. Später: Blockchain-Anker möglich.

---

## AGENT-ÜBERSICHT

### Status-Legende

| Symbol | Bedeutung |
|--------|-----------|
| LIVE | Produktiv, getestet, läuft |
| READY | Code existiert, bereit für API-Wrapper |
| PLANNED | Konzept steht, noch nicht gebaut |

### Die drei Ebenen

```
┌─────────────────────────────────────────────────────────┐
│  EBENE 1: Externe Agenten (Agent-to-Agent)              │
│  → Können von fremden Agenten / Kunden aufgerufen werden │
│  → Brauchen Auth, Rate-Limiting, Billing                │
├─────────────────────────────────────────────────────────┤
│  EBENE 2: Interne Pipeline-Agenten (Staffellauf)        │
│  → Arbeiten intern, saubere Schemas, lose gekoppelt     │
│  → Können perspektivisch extern werden                  │
├─────────────────────────────────────────────────────────┤
│  EBENE 3: Infrastruktur-Agenten (Core)                  │
│  → Event-Router, Error-Handler, Sweeper                 │
│  → Bleiben intern, kein externer Zugriff                │
└─────────────────────────────────────────────────────────┘
```

---

## EBENE 1: EXTERNE AGENTEN

Diese Agenten sind die Schnittstelle nach außen. Sie können von
Kunden-Agenten, Partner-Agenten oder Plattformen aufgerufen werden.

---

### AGENT: Anfrage-Qualifizierer (Lead-Agent)

```yaml
agent_id: "bg-lead-qualifier"
name: "BAUGENIUS Anfrage-Qualifizierer"
status: PLANNED
layer: external
version: "0.1"

description:
  de: >
    Qualifiziert eingehende Anfragen für Maler-, Sanitär-, Elektro-
    und weitere Handwerksleistungen im Raum Hamburg/SH.
    Prüft Machbarkeit, schätzt Aufwand, gibt Erstantwort.
  en: >
    Qualifies incoming requests for painting, plumbing, electrical
    and other trade services in Hamburg/Schleswig-Holstein region.
    Checks feasibility, estimates effort, provides initial response.

capabilities:
  - "qualify_trade_request"
  - "estimate_project_scope"
  - "check_availability"
  - "provide_initial_quote_range"

input_schema:
  type: object
  required: [request_type, location, description]
  properties:
    request_type:
      type: string
      enum: [renovation, repair, new_construction, maintenance]
      description: "Art der Anfrage"
    location:
      type: object
      properties:
        city: { type: string }
        postal_code: { type: string }
        address: { type: string }
    description:
      type: string
      description: "Freitext-Beschreibung der gewünschten Leistung"
    property_type:
      type: string
      enum: [apartment, house, commercial, public]
    area_sqm:
      type: number
      description: "Geschätzte Fläche in qm"
    desired_timeframe:
      type: string
      description: "Wunschzeitraum (z.B. 'März 2026', 'schnellstmöglich')"
    budget_range:
      type: object
      properties:
        min_eur: { type: number }
        max_eur: { type: number }
    contact:
      type: object
      properties:
        name: { type: string }
        phone: { type: string }
        email: { type: string }
        preferred_channel: { type: string, enum: [whatsapp, email, phone] }

output_schema:
  type: object
  properties:
    qualified:
      type: boolean
      description: "Ist die Anfrage im Leistungsspektrum?"
    confidence:
      type: number
      description: "0.0-1.0 Sicherheit der Qualifizierung"
    trades_needed:
      type: array
      items: { type: string }
      description: "Benötigte Gewerke"
    estimated_duration_days:
      type: number
    estimated_price_range:
      type: object
      properties:
        min_eur: { type: number }
        max_eur: { type: number }
        confidence: { type: number }
    earliest_availability:
      type: string
      format: date
    rejection_reason:
      type: string
      description: "Grund bei qualified=false"
    next_steps:
      type: array
      items: { type: string }
      description: "Empfohlene nächste Schritte"
    response_message:
      type: string
      description: "Menschenlesbare Antwort (Deutsch)"

fallback:
  on_error: "Anfrage wird manuell an Dennis weitergeleitet"
  on_overload: "Warteliste mit geschätzter Antwortzeit"

rate_limit: "100 requests/day"
auth: "API-Key oder Agent-to-Agent Handshake"
```

---

### AGENT: Angebots-Ersteller

```yaml
agent_id: "bg-offer-generator"
name: "BAUGENIUS Angebots-Ersteller"
status: PLANNED
layer: external
version: "0.1"

description:
  de: >
    Erstellt vollständige Angebote basierend auf Aufmaß/LV.
    Kalkuliert Materialpreise, Arbeitszeiten, Zuschläge.
    Generiert PDF im Firmendesign.
  en: >
    Creates complete offers based on measurement/specifications.
    Calculates material prices, labor times, surcharges.
    Generates PDF in company design.

capabilities:
  - "parse_measurement_document"
  - "calculate_positions"
  - "generate_offer_pdf"
  - "apply_catalog_prices"

input_schema:
  type: object
  required: [project_id]
  properties:
    project_id:
      type: string
      format: uuid
    catalog_id:
      type: string
      format: uuid
      description: "Welcher Preiskatalog (z.B. SAGA AV-2024)"
    positions:
      type: array
      description: "Wenn leer: werden aus offer_positions geladen"
      items:
        type: object
        properties:
          catalog_code: { type: string }
          title: { type: string }
          quantity: { type: number }
          unit: { type: string }
          trade: { type: string }
    surcharges:
      type: object
      properties:
        material_markup_pct: { type: number, default: 15 }
        overhead_pct: { type: number, default: 10 }
        profit_pct: { type: number, default: 5 }
    format:
      type: string
      enum: [pdf, json, both]
      default: "both"

output_schema:
  type: object
  properties:
    offer_id: { type: string, format: uuid }
    total_net_eur: { type: number }
    total_gross_eur: { type: number }
    position_count: { type: integer }
    trades_involved:
      type: array
      items: { type: string }
    estimated_margin_pct: { type: number }
    pdf_url: { type: string, format: uri }
    valid_until: { type: string, format: date }
    warnings:
      type: array
      items: { type: string }

fallback:
  on_missing_prices: "Formel-Fallback (Stundensatz × geschätzte Zeit)"
  on_missing_catalog: "DBL-2026 Eigenkatalog als Default"
```

---

### AGENT: Follow-Up Agent

```yaml
agent_id: "bg-follow-up"
name: "BAUGENIUS Follow-Up Agent"
status: PLANNED
layer: external
version: "0.1"

description:
  de: >
    Automatische Nachfass-Sequenz nach Angebotsversand.
    24h/72h/7d Rhythmus. Kanal: WhatsApp, Email, Telegram.
    Erkennt Antworten und eskaliert bei Bedarf.
  en: >
    Automatic follow-up sequence after offer delivery.
    24h/72h/7d rhythm. Channels: WhatsApp, Email, Telegram.
    Detects responses and escalates when needed.

capabilities:
  - "send_follow_up_sequence"
  - "detect_response_intent"
  - "escalate_to_human"
  - "track_conversion"

input_schema:
  type: object
  required: [project_id, contact, offer_id]
  properties:
    project_id: { type: string, format: uuid }
    offer_id: { type: string, format: uuid }
    contact:
      type: object
      required: [name]
      properties:
        name: { type: string }
        phone: { type: string }
        email: { type: string }
        preferred_channel: { type: string, enum: [whatsapp, email, telegram] }
    sequence:
      type: string
      enum: [standard_3step, urgent_2step, gentle_4step]
      default: "standard_3step"
    language:
      type: string
      default: "de"

output_schema:
  type: object
  properties:
    sequence_id: { type: string, format: uuid }
    status: { type: string, enum: [active, completed, converted, expired, cancelled] }
    messages_sent: { type: integer }
    response_detected: { type: boolean }
    response_intent: { type: string, enum: [accept, reject, question, negotiate, unclear] }
    conversion: { type: boolean }
```

---

## EBENE 2: INTERNE PIPELINE-AGENTEN (Staffellauf)

Diese Agenten arbeiten intern in der Autoplanungs-Pipeline.
Jeder hat saubere Schemas und kann perspektivisch extern werden.

---

### AGENT: LV-Leser (PDF-Intelligence)

```yaml
agent_id: "bg-lv-reader"
name: "LV-Leser"
status: PLANNED
layer: internal → perspektivisch external
version: "0.1"
runtime: "n8n + Claude Vision API"

description:
  de: >
    Liest Leistungsverzeichnisse und Aufmaße aus PDFs.
    Extrahiert Positionen, Mengen, Räume, Gewerke.
    Versteht SAGA/GWG-Formate und freie Aufmaße.
  en: >
    Reads specifications and measurements from PDFs.
    Extracts positions, quantities, rooms, trades.

capabilities:
  - "parse_lv_pdf"
  - "extract_positions"
  - "identify_rooms"
  - "match_catalog_positions"

input_schema:
  type: object
  required: [document]
  properties:
    document:
      type: object
      properties:
        storage_path: { type: string, description: "Supabase Storage Pfad" }
        url: { type: string, format: uri }
        format: { type: string, enum: [pdf, image] }
    catalog_id:
      type: string
      format: uuid
      description: "Katalog für Position-Matching"
    expected_trades:
      type: array
      items: { type: string }

output_schema:
  type: object
  properties:
    positions:
      type: array
      items:
        type: object
        properties:
          catalog_code: { type: string }
          title: { type: string }
          quantity: { type: number }
          unit: { type: string }
          trade: { type: string }
          room: { type: string }
          confidence: { type: number }
    total_positions: { type: integer }
    unmatched_positions: { type: integer }
    document_type: { type: string, enum: [lv, aufmass, free_form] }
    warnings: { type: array, items: { type: string } }
```

---

### AGENT: Zeitprüfer

```yaml
agent_id: "bg-time-checker"
name: "Zeitprüfer"
status: LIVE
layer: internal
version: "1.0"
runtime: "Supabase fn_agent_zeitpruefer()"

description:
  de: >
    Enriched Positionen mit realistischen Arbeitszeiten.
    Lookup in Richtzeitwerte-Datenbank (echte Baustellenerfahrung),
    Formel-Fallback wenn kein Richtzeitwert vorhanden.
  en: >
    Enriches positions with realistic labor times.
    Lookup in reference time database (real construction experience),
    formula fallback when no reference time available.

capabilities:
  - "lookup_reference_times"
  - "calculate_labor_minutes"
  - "formula_fallback_estimation"
  - "write_enriched_positions"

input_schema:
  type: object
  required: [project_id]
  properties:
    project_id: { type: string, format: uuid }
    positions:
      type: array
      description: "Optional — wenn leer, werden Positionen aus DB geladen"
      items:
        type: object
        required: [id, catalog_code, quantity]
        properties:
          id: { type: string, format: uuid }
          catalog_code: { type: string }
          title: { type: string }
          quantity: { type: number }
          unit: { type: string }
          trade: { type: string }
          trade_id: { type: string, format: uuid }
          unit_price: { type: number }

output_schema:
  type: object
  properties:
    success: { type: boolean }
    total_positions: { type: integer }
    matched_richtzeitwerte: { type: integer }
    formula_fallback: { type: integer }
    no_data: { type: integer }
    updated_in_db: { type: integer }
    positions:
      type: array
      items:
        type: object
        properties:
          id: { type: string, format: uuid }
          labor_minutes: { type: number }
          material_cost: { type: number }
          time_confidence: { type: number }
          time_source: { type: string, enum: [richtzeitwert, formel_fallback, null] }
    warnings: { type: array, items: { type: string } }

data_sources:
  - table: "richtzeitwerte"
    description: "31 Richtzeitwerte für SAGA AV-2024 Top-Positionen (Stand 2026-03-12)"
  - formula: "(unit_price × 0.7) / 70€/h × 60 = max Minuten"
    description: "Fallback wenn kein Richtzeitwert, confidence 0.3"
```

---

### AGENT: Plausibilitäts-Prüfer

```yaml
agent_id: "bg-plausibility"
name: "Plausibilitäts-Prüfer"
status: LIVE
layer: internal
version: "1.0"
runtime: "Supabase fn_agent_plausibility()"

description:
  de: >
    Prüft Gewerke-Reihenfolge (Baulogik), Gesamtstunden,
    fehlende Daten. STOP bei kritischen Fehlern.
    Erstellt trade_sequence für den Einsatzplaner.
  en: >
    Checks trade sequence (construction logic), total hours,
    missing data. STOP on critical errors.
    Creates trade_sequence for the deployment planner.

capabilities:
  - "validate_trade_sequence"
  - "check_total_hours"
  - "detect_missing_data"
  - "generate_trade_sequence"

input_schema:
  type: object
  required: [project_id]
  properties:
    project_id: { type: string, format: uuid }
    positions:
      type: array
      description: "Enriched positions vom Zeitprüfer"

output_schema:
  type: object
  properties:
    valid: { type: boolean }
    stop: { type: boolean }
    stop_reason: { type: string }
    total_positions: { type: integer }
    positions_without_trade: { type: integer }
    positions_without_labor: { type: integer }
    total_project_minutes: { type: number }
    total_project_hours: { type: number }
    trade_count: { type: integer }
    trade_sequence:
      type: array
      description: "Geordnet nach Baulogik (phase_order)"
      items:
        type: object
        properties:
          trade_id: { type: string, format: uuid }
          trade: { type: string }
          phase_order: { type: integer }
          position_count: { type: integer }
          total_minutes: { type: number }
          total_hours: { type: number }
          must_come_after: { type: array, items: { type: string, format: uuid } }
    warnings: { type: array, items: { type: string } }
    errors: { type: array, items: { type: string } }

stop_conditions:
  - "Null Positionen für Projekt"
  - "Alle Positionen ohne Gewerk-Zuordnung"

warning_thresholds:
  - ">40h pro Gewerk = suspekt"
  - ">200h Gesamtprojekt = sehr groß"

data_sources:
  - table: "trade_sequence_rules"
    description: "11 Gewerke mit Baulogik-Abhängigkeiten (Abbruch→Rohinstallation→Wände→Böden→Oberflächen→Einbauten→Reinigung)"
```

---

### AGENT: Material-Planer

```yaml
agent_id: "bg-material-planner"
name: "Material-Planer"
status: LIVE
layer: internal
version: "1.0"
runtime: "Supabase fn_agent_material()"

description:
  de: >
    Berechnet Materialbedarf aus Angebotspositionen.
    Nutzt Katalog-Mappings (catalog_material_mappings).
    Schreibt project_material_needs mit Mengen, Einheiten, Terminen.
  en: >
    Calculates material needs from offer positions.
    Uses catalog mappings. Writes project_material_needs.

capabilities:
  - "calculate_material_needs"
  - "map_catalog_to_materials"
  - "apply_quantity_multipliers"
  - "detect_unmapped_positions"

input_schema:
  type: object
  required: [project_id]
  properties:
    project_id: { type: string, format: uuid }

output_schema:
  type: object
  properties:
    success: { type: boolean }
    needs_created: { type: integer }
    needs_without_mapping: { type: integer }
    needs:
      type: array
      items:
        type: object
        properties:
          trade: { type: string }
          material_type: { type: string }
          quantity: { type: number }
          unit: { type: string }
          room: { type: string }
          problem: { type: string, description: "null wenn alles OK" }
    warnings: { type: array, items: { type: string } }
```

---

### AGENT: Einsatzplaner

```yaml
agent_id: "bg-deployment-planner"
name: "Einsatzplaner"
status: LIVE
layer: internal
version: "1.0"
runtime: "Supabase fn_agent_einsatzplaner()"

description:
  de: >
    Plant Bauphasen und weist Monteure zu.
    Nutzt trade_sequence vom Plausibilitäts-Prüfer für Reihenfolge.
    Berechnet Phasendauer aus labor_minutes (480min/Tag).
    3-stufiges Monteur-Matching.
  en: >
    Plans construction phases and assigns workers.
    Uses trade_sequence for ordering.
    Calculates phase duration from labor_minutes (480min/day).

capabilities:
  - "create_schedule_phases"
  - "assign_workers"
  - "calculate_phase_duration"
  - "respect_trade_dependencies"

input_schema:
  type: object
  required: [project_id, trade_sequence]
  properties:
    project_id: { type: string, format: uuid }
    trade_sequence:
      type: array
      description: "Von fn_agent_plausibility — Gewerke in Baulogik-Reihenfolge"
      items:
        type: object
        required: [trade_id, trade, phase_order, total_minutes]
        properties:
          trade_id: { type: string, format: uuid }
          trade: { type: string }
          phase_order: { type: integer }
          total_minutes: { type: number }

output_schema:
  type: object
  properties:
    success: { type: boolean }
    phases_created: { type: integer }
    assigned_count: { type: integer }
    unassigned_trades: { type: array, items: { type: string } }
    assignments:
      type: array
      items:
        type: object
        properties:
          trade: { type: string }
          member_name: { type: string }
          start_date: { type: string, format: date }
          end_date: { type: string, format: date }
          duration_days: { type: integer }
          total_minutes: { type: number }
    warnings: { type: array, items: { type: string } }

worker_matching:
  level_1: "Default-Monteur des Gewerks (team_members.default_trade)"
  level_2: "Monteur mit passendem Gewerk (team_member_trades)"
  level_3: "Monteur mit wenigsten Zuweisungen (Lastverteilung)"
```

---

### AGENT: Godmode Learner

```yaml
agent_id: "bg-godmode"
name: "Godmode Learner"
status: PLANNED
layer: internal
version: "0.1"
runtime: "Supabase Trigger + n8n Cron"

description:
  de: >
    Vergleicht SOLL (geplant) vs IST (tatsächlich gebraucht).
    Passt Richtzeitwerte automatisch an. Wird mit jedem
    abgeschlossenen Projekt schlauer.
  en: >
    Compares planned vs actual. Adjusts reference times
    automatically. Gets smarter with every completed project.

capabilities:
  - "compare_planned_vs_actual"
  - "update_reference_times"
  - "increase_confidence"
  - "generate_learning_report"

input_schema:
  type: object
  required: [project_id]
  properties:
    project_id: { type: string, format: uuid }
    phase_id: { type: string, format: uuid, description: "Einzelne Phase oder ganzes Projekt" }

output_schema:
  type: object
  properties:
    positions_compared: { type: integer }
    richtzeitwerte_updated: { type: integer }
    avg_deviation_pct: { type: number }
    biggest_outliers:
      type: array
      items:
        type: object
        properties:
          catalog_code: { type: string }
          planned_minutes: { type: number }
          actual_minutes: { type: number }
          deviation_pct: { type: number }
    learning_summary: { type: string }

algorithm:
  method: "Exponential Moving Average"
  formula: "new = 0.3 × IST + 0.7 × ALT"
  confidence_increase: "+0.05 pro Beobachtung, max 0.95"
```

---

## EBENE 2: INTAKE-PIPELINE AGENTEN

---

### AGENT: Email-Intake

```yaml
agent_id: "bg-email-intake"
name: "Email-Intake"
status: LIVE
layer: internal
version: "1.0"
runtime: "n8n M1_01_Email_Trigger + M1_02_PDF_Parser"

description:
  de: >
    Überwacht Gmail auf neue Aufträge (Label 02_Geschaeft_Projekte/Auftraege).
    Extrahiert Kopfdaten mit Claude Vision. Erstellt Projekt in Supabase.
  en: >
    Monitors Gmail for new orders. Extracts header data with Claude Vision.
    Creates project in Supabase.

capabilities:
  - "monitor_gmail_labels"
  - "extract_pdf_metadata"
  - "create_project"
  - "store_documents"

input_schema:
  type: object
  properties:
    email:
      type: object
      properties:
        subject: { type: string }
        from: { type: string }
        attachments: { type: array, items: { type: string } }

output_schema:
  type: object
  properties:
    project_id: { type: string, format: uuid }
    project_name: { type: string }
    client: { type: string }
    address: { type: string }
    unit_count: { type: integer }
    documents_stored: { type: integer }
    event_fired: { type: string, const: "PROJECT_CREATED" }
```

---

### AGENT: Beleg-Scanner

```yaml
agent_id: "bg-receipt-scanner"
name: "Beleg-Scanner"
status: LIVE
layer: internal
version: "1.0"
runtime: "n8n M4_01 + M4_02"

description:
  de: >
    Scannt Eingangsrechnungen aus Drive und Gmail.
    Extrahiert Rechnungsdaten mit Claude Vision.
    Matcht Lieferanten, kategorisiert Kosten.
  en: >
    Scans incoming invoices from Drive and Gmail.
    Extracts invoice data with Claude Vision.

capabilities:
  - "scan_invoice_pdf"
  - "extract_invoice_data"
  - "match_supplier"
  - "categorize_expense"

input_schema:
  type: object
  properties:
    document:
      type: object
      properties:
        storage_path: { type: string }
        source: { type: string, enum: [drive, gmail] }

output_schema:
  type: object
  properties:
    invoice_id: { type: string, format: uuid }
    invoice_number: { type: string }
    supplier_name: { type: string }
    total_gross: { type: number }
    expense_category: { type: string }
    positions_count: { type: integer }
    event_fired: { type: string, const: "PURCHASE_INVOICE_CREATED" }
```

---

## EBENE 2: GEPLANTE BUSINESS-AGENTEN

---

### AGENT: Kalkulations-Agent

```yaml
agent_id: "bg-calculator"
name: "Kalkulations-Agent"
status: PLANNED
layer: internal → perspektivisch external
version: "0.1"

description:
  de: >
    Kalkuliert Angebotspositionen: Materialpreise aus Lieferanten-DB,
    Arbeitszeiten aus Richtzeitwerten, Zuschläge nach Betriebskosten.
    Berechnet Stundensatz pro Position und Gesamtmarge.
  en: >
    Calculates offer positions: material prices from supplier DB,
    labor times from reference values, surcharges from overhead costs.

capabilities:
  - "calculate_position_price"
  - "lookup_material_prices"
  - "calculate_margin_per_position"
  - "calculate_total_margin"

input_schema:
  type: object
  required: [positions]
  properties:
    positions:
      type: array
      items:
        type: object
        properties:
          catalog_code: { type: string }
          quantity: { type: number }
          unit: { type: string }
          trade: { type: string }
    target_hourly_rate: { type: number, default: 70 }
    material_markup_pct: { type: number, default: 15 }

output_schema:
  type: object
  properties:
    positions:
      type: array
      items:
        type: object
        properties:
          catalog_code: { type: string }
          material_cost: { type: number }
          labor_minutes: { type: number }
          effective_hourly_rate: { type: number }
          unit_price: { type: number }
          margin_pct: { type: number }
          profitable: { type: boolean }
    total_net: { type: number }
    total_margin_pct: { type: number }
    unprofitable_positions: { type: integer }
    warnings: { type: array, items: { type: string } }
```

---

### AGENT: Controlling-Agent (Nachkalkulation)

```yaml
agent_id: "bg-controlling"
name: "Controlling-Agent"
status: PLANNED
layer: internal
version: "0.1"

description:
  de: >
    Vergleicht Angebot vs tatsächliche Kosten nach Projektabschluss.
    Identifiziert Margenfresser, erkennt Nachtragspotenzial,
    speist Erkenntnisse in den Godmode Learner.
  en: >
    Compares offer vs actual costs after project completion.
    Identifies margin drains, detects change order potential.

capabilities:
  - "compare_offer_vs_actual"
  - "identify_margin_drains"
  - "detect_change_order_potential"
  - "feed_godmode_learner"

input_schema:
  type: object
  required: [project_id]
  properties:
    project_id: { type: string, format: uuid }

output_schema:
  type: object
  properties:
    project_name: { type: string }
    offer_total: { type: number }
    actual_cost: { type: number }
    margin_pct: { type: number }
    margin_eur: { type: number }
    deviation_pct: { type: number }
    top_margin_drains:
      type: array
      items:
        type: object
        properties:
          trade: { type: string }
          planned_eur: { type: number }
          actual_eur: { type: number }
          deviation_pct: { type: number }
    change_order_potential:
      type: array
      items:
        type: object
        properties:
          description: { type: string }
          estimated_value_eur: { type: number }
          evidence_available: { type: boolean }
```

---

## EBENE 3: INFRASTRUKTUR-AGENTEN

---

### AGENT: Event-Router

```yaml
agent_id: "bg-event-router"
name: "Event-Router"
status: LIVE
layer: infrastructure
version: "2.0"
runtime: "n8n MX_00_Event_Router"

description:
  de: "Zentraler Event-Dispatcher. Liest event_routing Tabelle, feuert Webhooks."

capabilities:
  - "route_events"
  - "multi_target_dispatch"
  - "error_logging"

note: "Bleibt intern. Kein externer Zugriff."
```

---

## PIPELINE-ORCHESTRIERUNG

### Autoplanung (LIVE)

```
auto_plan_full(project_id)
    │
    ├─► [Zeitprüfer]        fn_agent_zeitpruefer()      Step 2
    │       │ positions + labor_minutes
    │       ▼
    ├─► [Plausibilität]     fn_agent_plausibility()     Step 3
    │       │ trade_sequence + warnings
    │       ▼ (STOP möglich)
    ├─► [Material]          fn_agent_material()          Step 4
    │       │ project_material_needs
    │       ▼
    ├─► [Einsatzplaner]     fn_agent_einsatzplaner()    Step 5
    │       │ schedule_phases + assignments
    │       ▼
    └─► Approvals: SCHEDULE + MATERIAL_ORDER → Freigabecenter
```

### Intake (LIVE)

```
Email (Gmail Label) → M1_01 → M1_02 (Claude Vision)
    → PROJECT_CREATED → MX_00 Router
    → M1_04a/b/c (Drive) → M1_05 (Telegram)
```

### Angebot (PLANNED)

```
[LV-Leser] → [Kalkulations-Agent] → [Angebots-Ersteller] → PDF → Follow-Up
```

### Controlling (PLANNED)

```
Projekt abgeschlossen → [Controlling-Agent] → [Godmode Learner] → richtzeitwerte UPDATE
```

---

## AGENT-API DESIGN (Phase 1)

Wenn Agenten als HTTP-Endpunkte exponiert werden:

```
POST /api/agents/{agent_id}/invoke
Authorization: Bearer {api_key}
Content-Type: application/json

{
  "input": { ... agent-specific input ... },
  "callback_url": "https://...",     // optional: async response
  "request_id": "uuid",              // idempotency
  "requester": {                     // wer fragt?
    "agent_id": "external-agent-123",
    "trust_level": "verified"
  }
}

Response:
{
  "request_id": "uuid",
  "agent_id": "bg-time-checker",
  "status": "completed",
  "output": { ... agent-specific output ... },
  "duration_ms": 1234,
  "version": "1.0"
}
```

---

## NÄCHSTE SCHRITTE

1. **Jetzt:** Schemas als Referenz für alle neuen Agents nutzen
2. **Bald:** FastAPI-Wrapper für die 4 Live-Staffellauf-Agenten
3. **Dann:** Lead-Agent + Angebots-Ersteller als erste externe Agenten
4. **Perspektive:** Agent Discovery (Agentverse, MCP, oder was gewinnt)

---

> **Der Nordstern:**
> Ein Personal Agent fragt nach Badsanierung in Kiel →
> BAUGENIUS qualifiziert → kalkuliert → macht Angebot → bestätigt Termin.
> Ohne dass Dennis oder Batuhan eingreifen.
> Nicht weil die Technik es kann — sondern weil der Trust stimmt.
