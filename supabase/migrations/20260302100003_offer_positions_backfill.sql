-- =============================================================
-- Migration: offer_positions.trade_id Backfill
-- Strategie: 1) Katalog-Link  2) Enum-Text  3) Sonstiges
-- =============================================================

-- Schritt 1: Aus verknüpfter Katalog-Position (höchste Qualität)
UPDATE offer_positions op
SET trade_id = cpv.trade_id
FROM catalog_positions_v2 cpv
WHERE op.catalog_position_v2_id = cpv.id
  AND cpv.trade_id IS NOT NULL;

-- Schritt 2: Aus Enum-Text (für Positionen ohne Katalog-Link)
UPDATE offer_positions op
SET trade_id = resolve_trade_id(op.trade::text)
WHERE op.trade_id IS NULL
  AND op.trade IS NOT NULL;

-- Schritt 3: Restliche NULLs → Sonstiges
UPDATE offer_positions op
SET trade_id = (SELECT id FROM trades WHERE name = 'Sonstiges')
WHERE op.trade_id IS NULL;
