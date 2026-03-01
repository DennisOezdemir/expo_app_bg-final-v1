-- =============================================================
-- Migration: trade_id FK auf catalog_positions_v2 + Backfill
-- =============================================================

-- 1. Spalte hinzufügen
ALTER TABLE catalog_positions_v2
  ADD COLUMN IF NOT EXISTS trade_id UUID REFERENCES trades(id) ON DELETE SET NULL;

-- 2. Backfill: trade TEXT → trade_id via resolve_trade_id()
UPDATE catalog_positions_v2
SET trade_id = resolve_trade_id(trade)
WHERE trade IS NOT NULL AND trade_id IS NULL;

-- 3. NULL-Trades → Sonstiges
UPDATE catalog_positions_v2
SET trade_id = (SELECT id FROM trades WHERE name = 'Sonstiges')
WHERE trade IS NULL AND trade_id IS NULL;

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_catalog_positions_v2_trade_id
  ON catalog_positions_v2(trade_id);
