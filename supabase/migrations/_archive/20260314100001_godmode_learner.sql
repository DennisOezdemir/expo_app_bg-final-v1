-- ============================================================================
-- Migration: Godmode Learner
-- SOLL vs IST Vergleich nach Projektabschluss
-- Passt Richtzeitwerte an basierend auf tatsächlicher Dauer
-- Exponential Moving Average: new = 0.3 × actual + 0.7 × old
-- ============================================================================

-- ===========================================
-- 1. offer_positions.actual_minutes — IST-Dauer tracken
-- ===========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'offer_positions' AND column_name = 'actual_minutes'
    ) THEN
        ALTER TABLE offer_positions ADD COLUMN actual_minutes NUMERIC(8,2);
        COMMENT ON COLUMN offer_positions.actual_minutes IS 'Tatsächlich gebrauchte Minuten (vom Monteur oder Bauleiter erfasst)';
    END IF;
END $$;

-- ===========================================
-- 2. fn_godmode_learner(project_id) — Lernagent
-- ===========================================
CREATE OR REPLACE FUNCTION fn_godmode_learner(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_project RECORD;
    v_pos RECORD;
    v_rzw RECORD;
    v_ema_alpha NUMERIC := 0.3;  -- Lernrate: 30% neuer Wert, 70% alter Wert
    v_confidence_step NUMERIC := 0.05;
    v_max_confidence NUMERIC := 0.95;
    v_updated INT := 0;
    v_created INT := 0;
    v_skipped INT := 0;
    v_observations JSONB := '[]'::JSONB;
    v_new_value NUMERIC;
    v_new_mat NUMERIC;
    v_new_confidence NUMERIC;
BEGIN
    -- Projekt prüfen
    SELECT id, name, status INTO v_project
    FROM projects WHERE id = p_project_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Projekt nicht gefunden');
    END IF;

    -- Alle Positionen mit actual_minutes durchgehen
    FOR v_pos IN
        SELECT
            op.id,
            op.catalog_code,
            op.title,
            op.quantity,
            op.unit,
            op.labor_minutes AS planned_minutes,
            op.actual_minutes,
            op.material_cost AS planned_material_cost
        FROM offer_positions op
        JOIN offers o ON o.id = op.offer_id
        WHERE o.project_id = p_project_id
          AND op.actual_minutes IS NOT NULL
          AND op.quantity > 0
          AND op.catalog_code IS NOT NULL
          AND op.deleted_at IS NULL
    LOOP
        -- IST pro Einheit berechnen
        DECLARE
            v_actual_per_unit NUMERIC;
            v_planned_per_unit NUMERIC;
            v_deviation_pct NUMERIC;
        BEGIN
            v_actual_per_unit := v_pos.actual_minutes / v_pos.quantity;
            v_planned_per_unit := COALESCE(v_pos.planned_minutes, 0) / NULLIF(v_pos.quantity, 0);

            -- Deviation berechnen
            IF v_planned_per_unit > 0 THEN
                v_deviation_pct := ((v_actual_per_unit - v_planned_per_unit) / v_planned_per_unit) * 100;
            ELSE
                v_deviation_pct := 0;
            END IF;

            -- Existierenden Richtzeitwert suchen
            SELECT * INTO v_rzw
            FROM richtzeitwerte
            WHERE catalog_position_nr = v_pos.catalog_code
            LIMIT 1;

            IF FOUND THEN
                -- EMA: new = alpha * actual + (1-alpha) * old
                v_new_value := v_ema_alpha * v_actual_per_unit + (1 - v_ema_alpha) * v_rzw.labor_minutes_per_unit;
                v_new_confidence := LEAST(v_rzw.confidence + v_confidence_step, v_max_confidence);

                UPDATE richtzeitwerte
                SET labor_minutes_per_unit = ROUND(v_new_value, 2),
                    confidence = v_new_confidence,
                    observation_count = observation_count + 1,
                    source = CASE
                        WHEN source = 'manual' THEN 'godmode'
                        ELSE source
                    END,
                    updated_at = now(),
                    notes = COALESCE(notes, '') || ' | Godmode ' || to_char(now(), 'YYYY-MM-DD') ||
                            ': ' || ROUND(v_rzw.labor_minutes_per_unit, 1) || '→' || ROUND(v_new_value, 1) || ' min'
                WHERE id = v_rzw.id;

                v_updated := v_updated + 1;
            ELSE
                -- Neuen Richtzeitwert anlegen
                INSERT INTO richtzeitwerte (
                    catalog_position_nr, labor_minutes_per_unit, unit,
                    source, confidence, observation_count, notes
                ) VALUES (
                    v_pos.catalog_code,
                    ROUND(v_actual_per_unit, 2),
                    v_pos.unit,
                    'godmode',
                    0.5 + v_confidence_step,  -- Erste Beobachtung = 0.55
                    1,
                    'Godmode initial: ' || ROUND(v_actual_per_unit, 1) || ' min aus Projekt ' || v_project.name
                );
                v_created := v_created + 1;
            END IF;

            -- Observation loggen
            v_observations := v_observations || jsonb_build_object(
                'catalog_code', v_pos.catalog_code,
                'title', v_pos.title,
                'planned_per_unit', ROUND(COALESCE(v_planned_per_unit, 0), 2),
                'actual_per_unit', ROUND(v_actual_per_unit, 2),
                'new_richtzeitwert', ROUND(COALESCE(v_new_value, v_actual_per_unit), 2),
                'deviation_pct', ROUND(v_deviation_pct, 1),
                'action', CASE WHEN v_rzw.id IS NOT NULL THEN 'updated' ELSE 'created' END
            );
        END;
    END LOOP;

    -- Event loggen
    INSERT INTO events (event_type, project_id, source_system, source_flow, payload)
    VALUES ('GODMODE_LEARNING_COMPLETED', p_project_id, 'db', 'fn_godmode_learner',
        jsonb_build_object(
            'updated', v_updated,
            'created', v_created,
            'skipped', v_skipped,
            'total_observations', jsonb_array_length(v_observations),
            'observations', v_observations
        ));

    RETURN jsonb_build_object(
        'success', true,
        'project_id', p_project_id,
        'project_name', v_project.name,
        'richtzeitwerte_updated', v_updated,
        'richtzeitwerte_created', v_created,
        'skipped', v_skipped,
        'total_observations', jsonb_array_length(v_observations),
        'observations', v_observations
    );
END;
$$;

GRANT EXECUTE ON FUNCTION fn_godmode_learner(UUID) TO authenticated;

COMMENT ON FUNCTION fn_godmode_learner IS 'Godmode Learner: SOLL vs IST vergleichen, Richtzeitwerte per EMA anpassen. Alpha=0.3, Confidence += 0.05 pro Beobachtung.';
