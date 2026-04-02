-- ============================================================
-- sales_invoices: Make compatible with Lexware Pull sync
-- ============================================================

-- 1. UNIQUE constraint on lexware_invoice_id for UPSERT
ALTER TABLE sales_invoices
  ADD CONSTRAINT uq_sales_invoices_lexware_invoice_id
    UNIQUE (lexware_invoice_id);

-- 2. Relax NOT NULL on project_id, client_id, due_date
--    (Lexware-sourced invoices won't have BG project/client initially)
ALTER TABLE sales_invoices
  ALTER COLUMN project_id DROP NOT NULL,
  ALTER COLUMN client_id DROP NOT NULL,
  ALTER COLUMN due_date DROP NOT NULL;

-- 3. Add missing enum values for Lexware voucher types
ALTER TYPE sales_invoice_type ADD VALUE IF NOT EXISTS 'GUTSCHRIFT';
ALTER TYPE sales_invoice_type ADD VALUE IF NOT EXISTS 'ABSCHLAG_LEXWARE';

-- 4. Add missing enum values for Lexware statuses
ALTER TYPE sales_invoice_status ADD VALUE IF NOT EXISTS 'PAIDOFF';
ALTER TYPE sales_invoice_status ADD VALUE IF NOT EXISTS 'VOIDED';
ALTER TYPE sales_invoice_status ADD VALUE IF NOT EXISTS 'OPEN';

-- 5. Add lexware_contact_id column for customer matching
ALTER TABLE sales_invoices
  ADD COLUMN IF NOT EXISTS lexware_contact_id TEXT;

-- 6. Add lexware_last_synced_at for tracking pull freshness
ALTER TABLE sales_invoices
  ADD COLUMN IF NOT EXISTS lexware_last_synced_at TIMESTAMPTZ;

-- 7. Add source column to distinguish BG-created vs Lexware-pulled
ALTER TABLE sales_invoices
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'bg'
    CHECK (source IN ('bg', 'lexware'));
