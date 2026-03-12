-- Extend trade_type enum with trades from catalogs
ALTER TYPE trade_type ADD VALUE IF NOT EXISTS 'Tischler';
ALTER TYPE trade_type ADD VALUE IF NOT EXISTS 'Heizung';
ALTER TYPE trade_type ADD VALUE IF NOT EXISTS 'Boden';
ALTER TYPE trade_type ADD VALUE IF NOT EXISTS 'Maurer';
ALTER TYPE trade_type ADD VALUE IF NOT EXISTS 'Reinigung';

-- Backfill: Map trade from catalog_positions_v2 → offer_positions
-- (only where trade is still 'Sonstiges' and catalog link exists)
UPDATE offer_positions op
SET trade = (
  CASE cp.trade
    WHEN 'Maler' THEN 'Maler'
    WHEN 'Sanitär' THEN 'Sanitär'
    WHEN 'Elektro' THEN 'Elektro'
    WHEN 'Fliesen' THEN 'Fliesen'
    WHEN 'Fliesenleger' THEN 'Fliesen'
    WHEN 'Maurer/Fliesenleger' THEN 'Fliesen'
    WHEN 'Tischler' THEN 'Tischler'
    WHEN 'Heizung' THEN 'Heizung'
    WHEN 'Boden' THEN 'Boden'
    WHEN 'Bodenleger' THEN 'Boden'
    WHEN 'Oberboden' THEN 'Boden'
    WHEN 'Maurer' THEN 'Maurer'
    WHEN 'Trockenbau' THEN 'Trockenbau'
    WHEN 'Reinigung' THEN 'Reinigung'
    WHEN 'Gebäudereinigung' THEN 'Reinigung'
    ELSE 'Sonstiges'
  END
)::trade_type,
trade_id = cp.trade_id,
updated_at = now()
FROM catalog_positions_v2 cp
WHERE cp.id = op.catalog_position_v2_id
  AND op.deleted_at IS NULL
  AND (op.trade = 'Sonstiges' OR op.trade IS NULL)
  AND cp.trade IS NOT NULL AND cp.trade != '';

-- Trigger: auto-map trade from catalog on INSERT/UPDATE
CREATE OR REPLACE FUNCTION fn_map_trade_from_catalog()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_catalog_trade text;
  v_catalog_trade_id uuid;
  v_mapped_trade text;
BEGIN
  IF NEW.catalog_position_v2_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.trade IS NOT NULL AND NEW.trade::text != 'Sonstiges' THEN
    RETURN NEW;
  END IF;

  SELECT trade, trade_id INTO v_catalog_trade, v_catalog_trade_id
  FROM catalog_positions_v2
  WHERE id = NEW.catalog_position_v2_id;

  IF v_catalog_trade IS NULL OR v_catalog_trade = '' THEN
    RETURN NEW;
  END IF;

  v_mapped_trade := CASE v_catalog_trade
    WHEN 'Maler' THEN 'Maler'
    WHEN 'Sanitär' THEN 'Sanitär'
    WHEN 'Elektro' THEN 'Elektro'
    WHEN 'Fliesen' THEN 'Fliesen'
    WHEN 'Fliesenleger' THEN 'Fliesen'
    WHEN 'Maurer/Fliesenleger' THEN 'Fliesen'
    WHEN 'Tischler' THEN 'Tischler'
    WHEN 'Heizung' THEN 'Heizung'
    WHEN 'Boden' THEN 'Boden'
    WHEN 'Bodenleger' THEN 'Boden'
    WHEN 'Oberboden' THEN 'Boden'
    WHEN 'Maurer' THEN 'Maurer'
    WHEN 'Trockenbau' THEN 'Trockenbau'
    WHEN 'Reinigung' THEN 'Reinigung'
    WHEN 'Gebäudereinigung' THEN 'Reinigung'
    ELSE NULL
  END;

  IF v_mapped_trade IS NOT NULL THEN
    NEW.trade := v_mapped_trade::trade_type;
    NEW.trade_id := v_catalog_trade_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_map_trade_from_catalog ON offer_positions;
CREATE TRIGGER trg_map_trade_from_catalog
  BEFORE INSERT OR UPDATE OF catalog_position_v2_id
  ON offer_positions
  FOR EACH ROW
  EXECUTE FUNCTION fn_map_trade_from_catalog();
