# FRONTEND â†” BACKEND MAPPING
## BAUGENIUS UI Components â†’ Supabase Tabellen

---

## STATUS LEGENDE

| Symbol | Bedeutung |
|--------|-----------|
| âœ… | Backend ready, kann direkt anbinden |
| ðŸŸ¡ | Schema existiert, Flow fehlt |
| ðŸ”´ | Tabelle fehlt, muss erstellt werden |
| âšª | Nur Frontend (kein Backend nÃ¶tig) |

---

## CORE PAGES

### Dashboard

| UI Component | Supabase Tabelle | Status | Anmerkung |
|--------------|------------------|--------|-----------|
| KPI: Aktive Projekte | `projects` | âœ… | `WHERE status = 'active'` |
| KPI: Offene Angebote | `offers` | âœ… | `WHERE status = 'draft' OR status = 'sent'` |
| KPI: Unbezahlte Rechnungen | `purchase_invoices` | âœ… | `WHERE payment_status != 'paid'` |
| KPI: Durchschnittsmarge | Aggregation | ðŸ”´ | View `v_project_margins` erstellen |
| Chart: Umsatz | `sales_invoices` | ðŸ”´ | Tabelle fehlt |
| Chart: Rechnungen Status | `purchase_invoices` | âœ… | Group by status |
| Gewinn/Verlust | Aggregation | ðŸ”´ | View `v_profit_loss` erstellen |

### Projekte

| UI Component | Supabase Tabelle | Status | Anmerkung |
|--------------|------------------|--------|-----------|
| Projekt Liste | `projects` | âœ… | Mit `clients` JOIN |
| Projekt Detail | `projects` | âœ… | |
| Kanban View | `projects` | âœ… | Group by `status` |
| Gantt Timeline | `project_phases` | ðŸ”´ | Tabelle erstellen |

### Projekt Detail Tabs

| Tab | Tabelle | Status | Anmerkung |
|-----|---------|--------|-----------|
| Ãœbersicht | `projects` + `offers` | âœ… | |
| Baustellen-Abwicklung | `protocols` | ðŸŸ¡ | Tabelle existiert, M2 Flow fehlt |
| Nachtragserfassung | `change_orders` | ðŸ”´ | Schema planen |
| AktivitÃ¤ten | `project_activities` | ðŸ”´ | Event log Tabelle |
| Dokumente | `project_files` | âœ… | Existiert! |
| Chat | `project_messages` | ðŸ”´ | Wenn Chat statt Activity |

### Angebote

| UI Component | Supabase Tabelle | Status | Anmerkung |
|--------------|------------------|--------|-----------|
| Angebot Liste | `offers` | âœ… | |
| Angebot Detail | `offers` + `offer_positions` | âœ… | |
| Kalkulation | `offer_positions` + `catalog_positions_v2` | âœ… | |
| PDF Export | â€” | âšª | Frontend PDF Generation |

### Rechnungen

| UI Component | Supabase Tabelle | Status | Anmerkung |
|--------------|------------------|--------|-----------|
| Eingangsrechnungen | `purchase_invoices` | âœ… | M4 âœ… |
| Ausgangsrechnungen | `sales_invoices` | ðŸ”´ | Tabelle erstellen |
| Positionen | `purchase_invoice_items` | âœ… | |
| Zahlungsstatus | `purchase_invoices.payment_status` | âœ… | |

---

## STAMMDATEN

| UI Component | Supabase Tabelle | Status | Anmerkung |
|--------------|------------------|--------|-----------|
| Kunden | `clients` | âœ… | |
| Lieferanten | `suppliers` | âœ… | |
| Artikel | `catalog_positions_v2` | âœ… | 620 Positionen |
| Lohngruppen | `labor_rates` | ðŸ”´ | Tabelle erstellen |
| Ansprechpartner | `contacts` | ðŸ”´ | Tabelle erstellen |

---

## AUTOMATION FEATURES

### Protokolle & Baustelle

| Feature | Tabelle | Status | Trigger |
|---------|---------|--------|---------|
| Erstbegehung | `protocols` | ðŸŸ¡ | Tally Webhook â†’ n8n |
| Zwischenbegehung | `protocols` | ðŸŸ¡ | Tally Webhook â†’ n8n |
| Abnahme | `protocols` | ðŸŸ¡ | Tally Webhook â†’ n8n |
| Unterschriften | `protocol_signatures` | ðŸ”´ | |
| MÃ¤ngel | `protocol_defects` | ðŸ”´ | |
| Fotos | `project_files` | âœ… | type = 'photo' |

### Zeit & Anwesenheit

| Feature | Tabelle | Status | Trigger |
|---------|---------|--------|---------|
| Check-In | `attendance_logs` | ðŸ”´ | QR Scan / Geofence |
| Zeiterfassung | `time_entries` | ðŸ”´ | |
| Team | `users` / `team_members` | ðŸ”´ | |

### Finanzen

| Feature | Tabelle | Status | Trigger |
|---------|---------|--------|---------|
| Kosten-Radar | Aggregation View | ðŸ”´ | |
| Cashflow | `cash_flow_forecast` | ðŸ”´ | Berechnet |
| Bank-Matching | `bank_transactions` | ðŸ”´ | Bank API |
| Mahnungen | `payment_reminders` | ðŸ”´ | Auto-Eskalation |

### Portale

| Feature | Tabelle | Status | Anmerkung |
|---------|---------|--------|-----------|
| Kunden-Portal | `portal_access` | ðŸ”´ | Separate Auth |
| Sub-Portal | `portal_access` | ðŸ”´ | Separate Auth |
| Portal Messages | `portal_messages` | ðŸ”´ | |

---

## NEUE TABELLEN PRIORISIERT

### Prio 1 â€” Sofort (fÃ¼r MVP)

```sql
-- Ausgangsrechnungen
CREATE TABLE sales_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  client_id UUID REFERENCES clients(id),
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  total_net DECIMAL(12,2),
  total_gross DECIMAL(12,2),
  status TEXT DEFAULT 'draft',
  payment_status TEXT DEFAULT 'unpaid',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AktivitÃ¤ten Log
CREATE TABLE project_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lohngruppen
CREATE TABLE labor_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hourly_rate DECIMAL(8,2) NOT NULL,
  markup_percent DECIMAL(5,2) DEFAULT 0,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Prio 2 â€” M2 Baustelle

```sql
-- Protokoll Unterschriften
CREATE TABLE protocol_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID REFERENCES protocols(id),
  signer_name TEXT NOT NULL,
  signer_role TEXT,
  signature_data TEXT, -- Base64 or Storage path
  signed_at TIMESTAMPTZ,
  request_sent_at TIMESTAMPTZ,
  request_token TEXT UNIQUE
);

-- Protokoll MÃ¤ngel
CREATE TABLE protocol_defects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID REFERENCES protocols(id),
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'minor',
  status TEXT DEFAULT 'open',
  photos TEXT[], -- Storage paths
  resolved_at TIMESTAMPTZ
);
```

### Prio 3 â€” Zeit & Team

```sql
-- Anwesenheit
CREATE TABLE attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID REFERENCES projects(id),
  check_in_at TIMESTAMPTZ NOT NULL,
  check_out_at TIMESTAMPTZ,
  source TEXT DEFAULT 'qr', -- qr, geofence, manual
  duration_minutes INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (check_out_at - check_in_at)) / 60
  ) STORED
);

-- ZeiteintrÃ¤ge
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID REFERENCES projects(id),
  date DATE NOT NULL,
  hours DECIMAL(4,2) NOT NULL,
  description TEXT,
  billable BOOLEAN DEFAULT true
);
```

### Prio 4 â€” NachtrÃ¤ge

```sql
-- NachtrÃ¤ge
CREATE TABLE change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  change_order_number TEXT NOT NULL,
  title TEXT NOT NULL,
  reason TEXT,
  description TEXT,
  amount_net DECIMAL(12,2),
  status TEXT DEFAULT 'draft',
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  evidence_files TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## AGGREGATION VIEWS

```sql
-- Projekt Margen
CREATE VIEW v_project_margins AS
SELECT 
  p.id,
  p.project_number,
  COALESCE(SUM(si.total_net), 0) as revenue,
  COALESCE(SUM(pi.total_net), 0) as costs,
  COALESCE(SUM(si.total_net), 0) - COALESCE(SUM(pi.total_net), 0) as profit,
  CASE 
    WHEN SUM(si.total_net) > 0 
    THEN ((SUM(si.total_net) - SUM(pi.total_net)) / SUM(si.total_net) * 100)
    ELSE 0 
  END as margin_percent
FROM projects p
LEFT JOIN sales_invoices si ON si.project_id = p.id
LEFT JOIN purchase_invoices pi ON pi.project_id = p.id
GROUP BY p.id;

-- Projekt Kosten Radar
CREATE VIEW v_project_cost_radar AS
SELECT
  p.id,
  p.project_number,
  o.total_net as budget,
  COALESCE(SUM(pi.total_net), 0) as spent,
  COALESCE(SUM(CASE WHEN mo.status = 'ordered' THEN mo.total ELSE 0 END), 0) as committed,
  o.total_net - COALESCE(SUM(pi.total_net), 0) as available
FROM projects p
LEFT JOIN offers o ON o.project_id = p.id AND o.status = 'accepted'
LEFT JOIN purchase_invoices pi ON pi.project_id = p.id
LEFT JOIN material_orders mo ON mo.project_id = p.id
GROUP BY p.id, o.total_net;
```

---

## CURSOR MIGRATION CHECKLIST

1. [ ] `sales_invoices` Tabelle erstellen
2. [ ] `project_activities` Tabelle erstellen
3. [ ] `labor_rates` Tabelle erstellen
4. [ ] Aggregation Views erstellen
5. [ ] Supabase Auth konfigurieren
6. [ ] RLS Policies fÃ¼r neue Tabellen
7. [ ] Dashboard mit echten Daten verbinden
8. [ ] Projekte-Liste mit echten Daten
9. [ ] Angebote mit echten Daten
10. [ ] Rechnungen mit echten Daten

---

*Stand: 12. Januar 2026*
