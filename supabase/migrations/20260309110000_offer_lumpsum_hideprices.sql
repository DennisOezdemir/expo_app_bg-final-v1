-- ============================================================================
-- Migration: Angebotssumme editierbar + Positionspreise ausblendbar
-- Datum: 2026-03-09
-- ============================================================================

-- Pauschalbetrag: Wenn gesetzt, wird dieser statt der berechneten Summe verwendet
ALTER TABLE offers ADD COLUMN IF NOT EXISTS is_lump_sum BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS lump_sum_amount NUMERIC(12,2) DEFAULT NULL;

-- Positionspreise im PDF/UI ausblenden
ALTER TABLE offers ADD COLUMN IF NOT EXISTS hide_position_prices BOOLEAN NOT NULL DEFAULT false;
