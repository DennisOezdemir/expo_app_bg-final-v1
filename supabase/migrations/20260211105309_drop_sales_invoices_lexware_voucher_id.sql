-- Drop lexware_voucher_id from sales_invoices
-- Sales invoices use /v1/invoices endpoint → lexware_invoice_id (already exists)
-- lexware_voucher_id is only for /v1/vouchers (purchase invoices)
ALTER TABLE sales_invoices DROP COLUMN IF EXISTS lexware_voucher_id;
