-- ============================================================
-- Lexware Integration — Complement Migration
-- Fills gaps in existing tables for full Lexware Office sync
--
-- Lexware API endpoints:
--   /v1/vouchers  — Buchungsbelege (purchaseinvoice) → purchase_invoices.lexware_voucher_id
--   /v1/invoices  — Ausgangsrechnungen              → sales_invoices.lexware_invoice_id
--   /v1/voucherlist — Auflisten/Filtern aller Belege
-- ============================================================

-- 1. purchase_invoices: UNIQUE constraint on lexware_voucher_id
ALTER TABLE purchase_invoices
  ADD CONSTRAINT uq_purchase_invoices_lexware_voucher_id
    UNIQUE (lexware_voucher_id);

-- 2. suppliers: UNIQUE constraint on lexware_contact_id
ALTER TABLE suppliers
  ADD CONSTRAINT uq_suppliers_lexware_contact_id
    UNIQUE (lexware_contact_id);

-- 3. sales_invoices: Add Lexware sync columns
--    (existing: lexware_invoice_id, lexware_synced_at)
ALTER TABLE sales_invoices
  ADD COLUMN IF NOT EXISTS lexware_raw_data JSONB,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_address TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS lexware_sync_status TEXT DEFAULT 'pending'
    CHECK (lexware_sync_status IN ('pending','synced','error','skipped')),
  ADD COLUMN IF NOT EXISTS lexware_sync_error TEXT;

-- 4. lexware_sync_log: Add missing columns for full audit trail
ALTER TABLE lexware_sync_log
  ADD COLUMN IF NOT EXISTS action TEXT,
  ADD COLUMN IF NOT EXISTS request_payload JSONB,
  ADD COLUMN IF NOT EXISTS response_payload JSONB;

-- 5. lexware_sync_log: Enable RLS + policies
ALTER TABLE lexware_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_lexware_sync_log" ON lexware_sync_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read_lexware_sync_log" ON lexware_sync_log
  FOR SELECT TO authenticated USING (true);

-- 6. Register Lexware event types in event_routing
INSERT INTO event_routing (event_type, target_workflow, webhook_url, description, is_active)
VALUES
  ('LEXWARE_PUSH_COMPLETED',   'M6_02_lexware_sync', '', 'Eingangsrechnung erfolgreich zu Lexware gepusht', false),
  ('LEXWARE_PUSH_FAILED',      'M6_02_lexware_sync', '', 'Push zu Lexware fehlgeschlagen', false),
  ('LEXWARE_PAYMENT_RECEIVED', 'M6_02_lexware_sync', '', 'Zahlung in Lexware eingegangen', false),
  ('LEXWARE_INVOICE_SYNCED',   'M6_02_lexware_sync', '', 'Ausgangsrechnung aus Lexware synchronisiert', false)
ON CONFLICT (event_type, target_workflow) DO NOTHING;
