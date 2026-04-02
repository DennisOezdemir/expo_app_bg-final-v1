-- ============================================================================
-- Godmode Phase Learner (Issue #18, Phase 4)
-- ============================================================================
-- Lernt aus abgeschlossenen schedule_phases:
-- SOLL (offer_positions.labor_minutes) vs IST (time_entries.hours)
-- Aktualisiert richtzeitwerte per EMA (0.3 * IST + 0.7 * ALT)
-- ============================================================================

-- ==========================================================================
-- 0. Event-Type erweitern
-- ==========================================================================
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'GODMODE_PHASE_LEARNING';

-- ==========================================================================
-- 1. fn_learn_from_completed_phase(p_phase_id UUID)
-- ==========================================================================
CREATE OR REPLACE FUNCTION fn_learn_from_completed_phase(p_phase_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_phase           RECORD;
    v_soll_total      NUMERIC;
    v_ist_total       NUMERIC;
    v_ratio           NUMERIC;
    v_pos             RECORD;
    v_rzw             RECORD;
    v_ema_alpha       NUMERIC := 0.3;
    v_confidence_step NUMERIC := 0.05;
    v_max_confidence  NUMERIC := 0.95;
    v_updated         INT := 0;
    v_created         INT := 0;
    v_skipped         INT := 0;
    v_observations    JSONB := '[]'::JSONB;
    v_new_value       NUMERIC;
    v_new_confidence  NUMERIC;
    v_actual_per_unit NUMERIC;
    v_planned_per_unit NUMERIC;
    v_deviation_pct   NUMERIC;
BEGIN
    -- Phase laden + validieren
    SELECT sp.id, sp.project_id, sp.trade, sp.trade_id, sp.name,
           sp.estimated_hours, sp.start_date, sp.end_date, sp.status
    INTO v_phase
    FROM schedule_phases sp
    WHERE sp.id = p_phase_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Phase nicht gefunden');
    END IF;

    IF v_phase.status != 'completed' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Phase nicht abgeschlossen');
    END IF;

    -- SOLL: Summe labor_minutes aus offer_positions fuer dieses Projekt + Gewerk
    SELECT COALESCE(SUM(op.labor_minutes), 0)
    INTO v_soll_total
    FROM offer_positions op
    JOIN offers o ON o.id = op.offer_id
    WHERE o.project_id = v_phase.project_id
      AND op.deleted_at IS NULL
      AND op.labor_minutes > 0
      AND (
          (v_phase.trade_id IS NOT NULL AND op.trade_id = v_phase.trade_id)
          OR (v_phase.trade_id IS NULL AND op.trade::TEXT = v_phase.trade)
      );

    -- IST: Summe time_entries.hours * 60 (Stunden → Minuten)
    SELECT COALESCE(SUM(te.hours), 0) * 60
    INTO v_ist_total
    FROM time_entries te
    WHERE te.project_id = v_phase.project_id
      AND te.trade = v_phase.trade;

    -- Nichts zu lernen wenn SOLL oder IST = 0
    IF v_soll_total = 0 OR v_ist_total = 0 THEN
        RETURN jsonb_build_object(
            'success', true,
            'phase_id', p_phase_id,
            'phase_name', v_phase.name,
            'skipped', true,
            'reason', CASE
                WHEN v_soll_total = 0 THEN 'Keine geplanten Minuten (SOLL=0)'
                ELSE 'Keine Zeiterfassung (IST=0)'
            END,
            'soll_minutes', v_soll_total,
            'ist_minutes', v_ist_total
        );
    END IF;

    -- Ratio IST/SOLL: > 1 = dauerte laenger, < 1 = ging schneller
    v_ratio := v_ist_total / v_soll_total;

    -- Pro offer_position mit catalog_code: richtzeitwert anpassen
    FOR v_pos IN
        SELECT
            op.id,
            op.catalog_code,
            op.title,
            op.quantity,
            op.unit,
            op.labor_minutes,
            op.catalog_position_v2_id
        FROM offer_positions op
        JOIN offers o ON o.id = op.offer_id
        WHERE o.project_id = v_phase.project_id
          AND op.deleted_at IS NULL
          AND op.labor_minutes > 0
          AND op.quantity > 0
          AND op.catalog_code IS NOT NULL
          AND (
              (v_phase.trade_id IS NOT NULL AND op.trade_id = v_phase.trade_id)
              OR (v_phase.trade_id IS NULL AND op.trade::TEXT = v_phase.trade)
          )
    LOOP
        -- Geplant pro Einheit
        v_planned_per_unit := v_pos.labor_minutes / v_pos.quantity;

        -- IST pro Einheit (proportional ueber Ratio verteilt)
        v_actual_per_unit := v_planned_per_unit * v_ratio;

        -- Abweichung in %
        v_deviation_pct := (v_ratio - 1) * 100;

        -- Richtzeitwert suchen
        SELECT * INTO v_rzw
        FROM richtzeitwerte
        WHERE catalog_position_nr = v_pos.catalog_code
        LIMIT 1;

        IF FOUND THEN
            -- EMA: new = 0.3 * IST + 0.7 * ALT
            v_new_value := v_ema_alpha * v_actual_per_unit
                         + (1 - v_ema_alpha) * v_rzw.labor_minutes_per_unit;
            v_new_confidence := LEAST(v_rzw.confidence + v_confidence_step, v_max_confidence);

            UPDATE richtzeitwerte
            SET labor_minutes_per_unit = ROUND(v_new_value, 2),
                confidence = v_new_confidence,
                observation_count = observation_count + 1,
                source = CASE WHEN source IN ('manual', 'ai_estimate') THEN 'godmode' ELSE source END,
                updated_at = now(),
                notes = COALESCE(notes, '') ||
                    ' | Phase ' || to_char(now(), 'YYYY-MM-DD') ||
                    ': ' || ROUND(v_rzw.labor_minutes_per_unit, 1) ||
                    '→' || ROUND(v_new_value, 1) || ' min'
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
                0.5 + v_confidence_step,
                1,
                'Godmode Phase-Learner initial: ' || ROUND(v_actual_per_unit, 1) ||
                ' min (Phase: ' || v_phase.name || ')'
            );
            v_created := v_created + 1;
        END IF;

        v_observations := v_observations || jsonb_build_object(
            'catalog_code', v_pos.catalog_code,
            'title', v_pos.title,
            'planned_per_unit', ROUND(v_planned_per_unit, 2),
            'actual_per_unit', ROUND(v_actual_per_unit, 2),
            'new_richtzeitwert', ROUND(COALESCE(v_new_value, v_actual_per_unit), 2),
            'deviation_pct', ROUND(v_deviation_pct, 1),
            'action', CASE WHEN v_rzw.id IS NOT NULL THEN 'updated' ELSE 'created' END
        );
    END LOOP;

    -- Event loggen
    INSERT INTO events (event_type, project_id, source_system, source_flow, payload)
    VALUES (
        'GODMODE_PHASE_LEARNING',
        v_phase.project_id,
        'db',
        'fn_learn_from_completed_phase',
        jsonb_build_object(
            'phase_id', p_phase_id,
            'phase_name', v_phase.name,
            'trade', v_phase.trade,
            'soll_minutes', v_soll_total,
            'ist_minutes', v_ist_total,
            'ratio', ROUND(v_ratio, 3),
            'updated', v_updated,
            'created', v_created,
            'observations', v_observations
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'phase_id', p_phase_id,
        'phase_name', v_phase.name,
        'trade', v_phase.trade,
        'soll_minutes', v_soll_total,
        'ist_minutes', v_ist_total,
        'ratio', ROUND(v_ratio, 3),
        'deviation_pct', ROUND((v_ratio - 1) * 100, 1),
        'richtzeitwerte_updated', v_updated,
        'richtzeitwerte_created', v_created,
        'total_observations', jsonb_array_length(v_observations),
        'observations', v_observations
    );
END;
$$;

COMMENT ON FUNCTION fn_learn_from_completed_phase(UUID) IS
    'Godmode Phase-Learner: Vergleicht SOLL (offer_positions.labor_minutes) '
    'mit IST (time_entries.hours) fuer eine abgeschlossene Phase. '
    'Aktualisiert richtzeitwerte per EMA (alpha=0.3).';


-- ==========================================================================
-- 2. Trigger auf schedule_phases: AFTER UPDATE WHEN status = 'completed'
-- ==========================================================================
CREATE OR REPLACE FUNCTION trg_fn_godmode_phase_completed()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Nur ausfuehren wenn Status auf 'completed' wechselt
    PERFORM fn_learn_from_completed_phase(NEW.id);
    RETURN NEW;
END;
$$;

-- Trigger: Feuert NUR wenn status sich zu 'completed' aendert
CREATE TRIGGER trg_godmode_phase_completed
    AFTER UPDATE ON schedule_phases
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
    EXECUTE FUNCTION trg_fn_godmode_phase_completed();

COMMENT ON TRIGGER trg_godmode_phase_completed ON schedule_phases IS
    'Godmode: Lernt automatisch wenn eine Phase abgeschlossen wird';


-- ==========================================================================
-- 3. fn_godmode_report(p_days INTEGER DEFAULT 30)
-- ==========================================================================
CREATE OR REPLACE FUNCTION fn_godmode_report(p_days INTEGER DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_since           TIMESTAMPTZ;
    v_phases          JSONB;
    v_top_deviations  JSONB;
    v_updated_count   INT;
    v_total_phases    INT;
BEGIN
    v_since := now() - (p_days || ' days')::INTERVAL;

    -- Alle abgeschlossenen Phasen mit Godmode-Events
    SELECT
        COALESCE(jsonb_agg(
            jsonb_build_object(
                'phase_name', e.payload->>'phase_name',
                'trade', e.payload->>'trade',
                'project_id', e.project_id,
                'project_name', p.name,
                'soll_minutes', (e.payload->>'soll_minutes')::NUMERIC,
                'ist_minutes', (e.payload->>'ist_minutes')::NUMERIC,
                'ratio', (e.payload->>'ratio')::NUMERIC,
                'deviation_pct', ROUND(((e.payload->>'ratio')::NUMERIC - 1) * 100, 1),
                'richtzeitwerte_updated', (e.payload->>'updated')::INT,
                'richtzeitwerte_created', (e.payload->>'created')::INT,
                'learned_at', e.created_at
            ) ORDER BY e.created_at DESC
        ), '[]'::JSONB),
        COUNT(*)
    INTO v_phases, v_total_phases
    FROM events e
    LEFT JOIN projects p ON p.id = e.project_id
    WHERE e.event_type = 'GODMODE_PHASE_LEARNING'
      AND e.created_at >= v_since;

    -- Top 5 groesste Abweichungen (aus den Observations der Events)
    SELECT COALESCE(jsonb_agg(deviation ORDER BY abs_dev DESC), '[]'::JSONB)
    INTO v_top_deviations
    FROM (
        SELECT
            jsonb_build_object(
                'catalog_code', obs->>'catalog_code',
                'title', obs->>'title',
                'planned_per_unit', (obs->>'planned_per_unit')::NUMERIC,
                'actual_per_unit', (obs->>'actual_per_unit')::NUMERIC,
                'deviation_pct', (obs->>'deviation_pct')::NUMERIC,
                'phase_name', e.payload->>'phase_name',
                'trade', e.payload->>'trade'
            ) AS deviation,
            ABS((obs->>'deviation_pct')::NUMERIC) AS abs_dev
        FROM events e,
             jsonb_array_elements(e.payload->'observations') AS obs
        WHERE e.event_type = 'GODMODE_PHASE_LEARNING'
          AND e.created_at >= v_since
        ORDER BY abs_dev DESC
        LIMIT 5
    ) sub;

    -- Anzahl aktualisierter Richtzeitwerte im Zeitraum
    SELECT COUNT(*)
    INTO v_updated_count
    FROM richtzeitwerte
    WHERE source = 'godmode'
      AND updated_at >= v_since;

    RETURN jsonb_build_object(
        'success', true,
        'report_period_days', p_days,
        'since', v_since,
        'total_phases_learned', v_total_phases,
        'richtzeitwerte_updated_total', v_updated_count,
        'phases', v_phases,
        'top_5_deviations', v_top_deviations
    );
END;
$$;

COMMENT ON FUNCTION fn_godmode_report(INTEGER) IS
    'Godmode Report: Zeigt alle Lern-Ergebnisse der letzten N Tage. '
    'Inkl. SOLL vs IST pro Phase, Top 5 Abweichungen, Anzahl Updates.';
