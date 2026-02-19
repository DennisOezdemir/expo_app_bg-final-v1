# TASK: Nachtrag-System DB Migration Fix

## KONTEXT

Das Nachtrags-System Frontend (Gang 2) ist fertig implementiert. Es gibt ein **Migrations-Problem** das gelöst werden muss, bevor das System funktioniert.

**Repo:** `Deine-Baulowen/baugenius-mockup` (Branch: main)
**Supabase Project:** `krtxhxajrphymrzuinna`

---

## PROBLEM: Doppelte Migration 028

```
migrations/
├── 028_bank_transactions_matching.sql  ← War schon da
├── 028_nachtrag_system_extension.sql   ← ⚠️ DOPPELT - muss 030 werden!
└── 029_fix_clients_vs_catalogs.sql     ← Existiert
```

---

## AUFGABE (3 Schritte)

### Schritt 1: Migration umbenennen

Auf GitHub:
- **Lösche** `migrations/028_nachtrag_system_extension.sql`
- **Erstelle** `migrations/030_nachtrag_system_extension.sql` mit dem gleichen Inhalt

Der Inhalt ist:
```sql
-- Migration 030: Change Order System Extension

BEGIN;

-- 1. Status Enum erweitern
ALTER TYPE change_order_status ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL';
ALTER TYPE change_order_status ADD VALUE IF NOT EXISTS 'APPROVED_BY_CUSTOMER';
ALTER TYPE change_order_status ADD VALUE IF NOT EXISTS 'REJECTED_BY_CUSTOMER';

-- 2. Spalten zu change_orders hinzufügen
ALTER TABLE change_orders 
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('catalog', 'manual')),
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES offer_sections(id),
ADD COLUMN IF NOT EXISTS catalog_position_id UUID REFERENCES catalog_positions_v2(id);

-- 3. Outbound Emails Tabelle
CREATE TABLE IF NOT EXISTS outbound_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  
  recipient TEXT NOT NULL,
  cc TEXT[],
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_approval', 'approved', 'rejected', 'sent', 'failed'
  )),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  rejected_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_outbound_emails_entity ON outbound_emails(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_outbound_emails_status ON outbound_emails(status);
CREATE INDEX IF NOT EXISTS idx_outbound_emails_project ON outbound_emails(project_id);

ALTER TABLE outbound_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "outbound_emails_all" ON outbound_emails FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON outbound_emails TO authenticated;

COMMIT;
```

### Schritt 2: Hardening Migration erstellen

Erstelle `migrations/031_nachtrag_hardening.sql`:

```sql
-- Migration 031: Nachtrag System Hardening
-- Idempotency Keys + Event Routing

BEGIN;

-- 1. Idempotency Key auf change_orders
ALTER TABLE change_orders
ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_change_orders_idempotency ON change_orders(idempotency_key);

-- 2. Idempotency Key auf outbound_emails  
ALTER TABLE outbound_emails
ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_outbound_emails_idempotency ON outbound_emails(idempotency_key);

-- 3. Event Routing registrieren
INSERT INTO event_routing (event_type, target_workflow, description) VALUES
  ('CHANGE_ORDER_CREATED', 'N1_01_Email_Prep', 'Nachtrag erstellt -> Mail vorbereiten via AI'),
  ('EMAIL_APPROVED', 'N1_02_Email_Send', 'Mail freigegeben -> Versenden via Gmail'),
  ('EMAIL_REJECTED', NULL, 'Mail abgelehnt -> Logging only'),
  ('CHANGE_ORDER_CUSTOMER_APPROVED', NULL, 'Kunde hat beauftragt -> Logging'),
  ('CHANGE_ORDER_CUSTOMER_REJECTED', NULL, 'Kunde hat abgelehnt -> Logging')
ON CONFLICT (event_type) DO UPDATE SET
  target_workflow = EXCLUDED.target_workflow,
  description = EXCLUDED.description;

COMMIT;
```

### Schritt 3: Migrationen auf Supabase ausführen

1. Prüfe ob `change_order_status` Enum existiert mit allen Values
2. Führe Migration 030 aus (falls Tabellen/Columns fehlen)
3. Führe Migration 031 aus

**Prüf-Query vorher:**
```sql
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'change_order_status'::regtype;
```

**Prüf-Query nachher:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'change_orders';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'outbound_emails';
```

---

## ERFOLGSKRITERIEN

Nach Abschluss müssen existieren:

1. ✅ `migrations/030_nachtrag_system_extension.sql` auf GitHub
2. ✅ `migrations/031_nachtrag_hardening.sql` auf GitHub
3. ✅ `028_nachtrag_system_extension.sql` gelöscht
4. ✅ Tabelle `outbound_emails` in Supabase mit allen Columns
5. ✅ Column `idempotency_key` auf `change_orders`
6. ✅ Column `idempotency_key` auf `outbound_emails`
7. ✅ Event-Types in `event_routing` registriert

---

## REFERENZ

Vollständige Doku: `docs/HANDOVER_2026-01-19_NACHTRAG_GANG2.md` im Repo
