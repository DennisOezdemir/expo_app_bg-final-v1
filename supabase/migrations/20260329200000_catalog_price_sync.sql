-- ============================================================================
-- Katalog-Preis-Sync: Automatische Preisaktualisierung aus Aufträgen
-- ============================================================================
-- Preise kommen aus realen Aufträgen, nicht aus dem Katalog-PDF.
-- Jeder neue Auftrag aktualisiert die Katalogpreise automatisch.
-- ============================================================================

-- Spalte für Preis-Tracking
ALTER TABLE catalog_positions_v2 ADD COLUMN IF NOT EXISTS price_updated_at TIMESTAMPTZ;

-- Batch-Funktion: Alle Preise eines Angebots in den Katalog syncen
CREATE OR REPLACE FUNCTION fn_update_catalog_prices_from_offer(p_offer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_pos RECORD;
    v_updated INT := 0;
    v_skipped INT := 0;
BEGIN
    FOR v_pos IN
        SELECT op.catalog_position_v2_id, op.unit_price, op.catalog_code
        FROM offer_positions op
        WHERE op.offer_id = p_offer_id
          AND op.deleted_at IS NULL
          AND op.catalog_position_v2_id IS NOT NULL
          AND op.unit_price > 0
    LOOP
        UPDATE catalog_positions_v2
        SET base_price_eur = v_pos.unit_price,
            price_updated_at = now(),
            updated_at = now()
        WHERE id = v_pos.catalog_position_v2_id
          AND (base_price_eur IS NULL
               OR base_price_eur != v_pos.unit_price
               OR price_updated_at IS NULL);

        IF FOUND THEN
            v_updated := v_updated + 1;
        ELSE
            v_skipped := v_skipped + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'offer_id', p_offer_id,
        'prices_updated', v_updated,
        'prices_unchanged', v_skipped
    );
END;
$$;

-- Trigger: Bei jedem Insert/Update auf offer_positions Katalogpreis syncen
CREATE OR REPLACE FUNCTION trg_fn_sync_catalog_price()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NEW.catalog_position_v2_id IS NOT NULL AND NEW.unit_price > 0 AND NEW.deleted_at IS NULL THEN
        UPDATE catalog_positions_v2
        SET base_price_eur = NEW.unit_price,
            price_updated_at = now(),
            updated_at = now()
        WHERE id = NEW.catalog_position_v2_id
          AND (base_price_eur IS NULL OR base_price_eur != NEW.unit_price);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_catalog_price ON offer_positions;
CREATE TRIGGER trg_sync_catalog_price
    AFTER INSERT OR UPDATE ON offer_positions
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_sync_catalog_price();

GRANT EXECUTE ON FUNCTION fn_update_catalog_prices_from_offer TO authenticated;
GRANT EXECUTE ON FUNCTION fn_update_catalog_prices_from_offer TO service_role;
