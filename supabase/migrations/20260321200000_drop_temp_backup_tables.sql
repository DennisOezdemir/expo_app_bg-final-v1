-- Migration: Drop obsolete temp/backup tables
-- Issue: #21 (n8n-export + Cleanup)
-- Date: 2026-03-21
--
-- These tables are leftover backups from January 2026:
--   _temp_lexware_dump          (150 rows, 72 KB) — one-time Lexware import
--   products_backup_20260119    (558 rows, 136 KB) — products snapshot before restructure
--   purchase_invoices_backup_20260112 (4 rows, 16 KB) — invoices snapshot before restructure
--
-- None are referenced in code, flows, or RPC functions.

DROP TABLE IF EXISTS public._temp_lexware_dump;
DROP TABLE IF EXISTS public.products_backup_20260119;
DROP TABLE IF EXISTS public.purchase_invoices_backup_20260112;
