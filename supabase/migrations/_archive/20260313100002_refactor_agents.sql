-- ============================================================================
-- Migration: Refactor Agents — Material + Einsatzplaner + auto_plan_full v2
-- Staffellauf Phase 1b-1e: Bestehende Logik in Pipeline-Agenten umbauen
-- ============================================================================

-- ===========================================
-- 1. fn_agent_material() — Agent #4
-- Refactored aus auto_plan_materials()
-- Gleiche Logik, aber Pipeline-Step-Tracking + Output-Contract
-- ===========================================
CREATE OR REPLACE FUNCTION fn_agent_material(
    p_run_id UUID,
    p_input JSONB
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_step_id UUID;
    v_project_id UUID;
    v_warnings TEXT[] := '{}';
    v_errors TEXT[] := '{}';
    v_output JSONB;
    v_material_result JSONB;
    v_existing INT;
    v_needs JSONB := '[]'::JSONB;
    v_need RECORD;
BEGIN
    v_project_id := (p_input->>'project_id')::UUID;

    -- Step starten
    v_step_id := fn_pipeline_step_start(p_run_id, 'material', 4, p_input);

    -- Prüfe ob Material-Planung bereits existiert
    SELECT COUNT(*) INTO v_existing
    FROM project_material_needs
    WHERE project_id = v_project_id AND status = 'planned' AND source = 'auto_plan';

    IF v_existing > 0 THEN
        -- Alte Planung verwerfen (Pipeline darf überschreiben)
        DELETE FROM project_material_needs
        WHERE project_id = v_project_id AND source = 'auto_plan' AND status = 'planned';
        v_warnings := array_append(v_warnings,
            'Bestehende Material-Planung (' || v_existing || ' Positionen) wurde ersetzt');
    END IF;

    -- Bestehende auto_plan_materials aufrufen (bewährte Logik wiederverwenden)
    v_material_result := auto_plan_materials(v_project_id);

    IF NOT (v_material_result->>'success')::BOOLEAN THEN
        v_errors := array_append(v_errors, COALESCE(v_material_result->>'error', 'Material-Planung fehlgeschlagen'));
        v_output := jsonb_build_object(
            'success', false,
            'project_id', v_project_id,
            'needs_created', 0,
            'problems', '[]'::JSONB,
            'warnings', to_jsonb(v_warnings),
            'errors', to_jsonb(v_errors)
        );
        PERFORM fn_pipeline_step_complete(v_step_id, v_output, 'failed', v_warnings, v_errors);
        RETURN v_output;
    END IF;

    -- Material-Needs zusammenfassen für Output
    SELECT jsonb_agg(jsonb_build_object(
        'trade', pmn.trade,
        'material_type', pmn.material_type,
        'quantity', pmn.total_quantity,
        'unit', pmn.quantity_unit,
        'room', pmn.room,
        'problem', pmn.problem,
        'needed_by', pmn.needed_by
    ))
    INTO v_needs
    FROM project_material_needs pmn
    WHERE pmn.project_id = v_project_id AND pmn.source = 'auto_plan' AND pmn.status = 'planned';

    -- Problem-Zusammenfassung
    FOR v_need IN
        SELECT problem, COUNT(*) AS cnt
        FROM project_material_needs
        WHERE project_id = v_project_id AND source = 'auto_plan' AND problem IS NOT NULL
        GROUP BY problem
    LOOP
        v_warnings := array_append(v_warnings,
            v_need.cnt || 'x ' || v_need.problem);
    END LOOP;

    v_output := jsonb_build_object(
        'success', true,
        'project_id', v_project_id,
        'needs_created', COALESCE((v_material_result->>'needs_created')::INT, 0),
        'needs_without_mapping', COALESCE((v_material_result->>'needs_without_mapping')::INT, 0),
        'trades', COALESCE(v_material_result->'trades', '[]'::JSONB),
        'needs', COALESCE(v_needs, '[]'::JSONB),
        'warnings', to_jsonb(v_warnings),
        'errors', to_jsonb(v_errors)
    );

    PERFORM fn_pipeline_step_complete(v_step_id, v_output, 'completed', v_warnings, v_errors);
    RETURN v_output;
END;
$$;

COMMENT ON FUNCTION fn_agent_material IS 'Staffellauf Agent #4: Materialbedarf aus Positionen + Aufmaß + Katalog-Mappings berechnen';

-- ===========================================
-- 2. fn_agent_einsatzplaner() — Agent #5
-- Refactored aus auto_plan_project()
-- Nutzt trade_sequence vom Plausibilitäts-Agent für Reihenfolge
-- Berechnet Phasendauer aus labor_minutes wenn verfügbar
-- ===========================================
CREATE OR REPLACE FUNCTION fn_agent_einsatzplaner(
    p_run_id UUID,
    p_input JSONB
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_step_id UUID;
    v_project_id UUID;
    v_project RECORD;
    v_trade_seq JSONB;
    v_trade JSONB;
    v_warnings TEXT[] := '{}';
    v_errors TEXT[] := '{}';
    v_output JSONB;
    v_assignments JSONB := '[]'::JSONB;
    v_unassigned TEXT[] := '{}';
    v_phases_created INT := 0;
    v_assigned_count INT := 0;
    v_phase_order INT;
    v_duration INT;
    v_total_minutes NUMERIC;
    v_trade_id UUID;
    v_trade_name TEXT;
    v_start DATE;
    v_end DATE;
    v_phase_start DATE;
    v_phase_end DATE;
    v_day_offset INT := 0;
    v_total_days INT;
    v_existing INT;
    -- Monteur-Matching
    v_best_member_id UUID;
    v_best_member_name TEXT;
    v_member_id UUID;
    v_member_name TEXT;
    v_busy_count INT;
    v_min_busy INT;
    v_defaults RECORD;
    i INT;
BEGIN
    v_project_id := (p_input->>'project_id')::UUID;

    -- Step starten
    v_step_id := fn_pipeline_step_start(p_run_id, 'einsatzplaner', 5, p_input);

    -- Projekt laden
    SELECT id, planned_start, planned_end, status
    INTO v_project FROM projects WHERE id = v_project_id;

    IF NOT FOUND THEN
        v_errors := array_append(v_errors, 'Projekt nicht gefunden');
        v_output := jsonb_build_object('success', false, 'project_id', v_project_id,
            'phases_created', 0, 'warnings', to_jsonb(v_warnings), 'errors', to_jsonb(v_errors));
        PERFORM fn_pipeline_step_complete(v_step_id, v_output, 'failed', v_warnings, v_errors);
        RETURN v_output;
    END IF;

    IF v_project.planned_start IS NULL OR v_project.planned_end IS NULL THEN
        v_errors := array_append(v_errors, 'Projekt hat kein Start-/Enddatum — kann keine Phasen berechnen');
        v_output := jsonb_build_object('success', false, 'project_id', v_project_id,
            'phases_created', 0, 'warnings', to_jsonb(v_warnings), 'errors', to_jsonb(v_errors));
        PERFORM fn_pipeline_step_complete(v_step_id, v_output, 'stopped', v_warnings, v_errors);
        RETURN v_output;
    END IF;

    -- Idempotenz: bestehende Vorschläge löschen
    SELECT COUNT(*) INTO v_existing FROM schedule_phases
    WHERE project_id = v_project_id AND status = 'proposed';
    IF v_existing > 0 THEN
        DELETE FROM schedule_phases WHERE project_id = v_project_id AND status = 'proposed';
        v_warnings := array_append(v_warnings,
            'Bestehende Vorschläge (' || v_existing || ' Phasen) wurden ersetzt');
    END IF;

    v_start := v_project.planned_start;
    v_end := v_project.planned_end;
    v_total_days := GREATEST((v_end - v_start) + 1, 1);

    -- trade_sequence aus Plausibilitäts-Agent nutzen
    v_trade_seq := p_input->'trade_sequence';
    IF v_trade_seq IS NULL OR jsonb_array_length(v_trade_seq) = 0 THEN
        v_errors := array_append(v_errors, 'Keine trade_sequence im Input — Plausibilitäts-Agent nicht gelaufen?');
        v_output := jsonb_build_object('success', false, 'project_id', v_project_id,
            'phases_created', 0, 'warnings', to_jsonb(v_warnings), 'errors', to_jsonb(v_errors));
        PERFORM fn_pipeline_step_complete(v_step_id, v_output, 'failed', v_warnings, v_errors);
        RETURN v_output;
    END IF;

    -- Für jedes Gewerk in der Reihenfolge vom Plausibilitäts-Agent
    FOR i IN 0..jsonb_array_length(v_trade_seq) - 1 LOOP
        v_trade := v_trade_seq->i;
        v_trade_id := (v_trade->>'trade_id')::UUID;
        v_trade_name := v_trade->>'trade';
        v_phase_order := COALESCE((v_trade->>'phase_order')::INT, 99);
        v_total_minutes := COALESCE((v_trade->>'total_minutes')::NUMERIC, 0);

        -- Dauer berechnen: aus labor_minutes ODER aus schedule_defaults ODER Fallback
        IF v_total_minutes > 0 THEN
            -- Neue Logik: Realzeiten! 8h/Tag = 480min
            v_duration := GREATEST(CEIL(v_total_minutes / 480.0), 1);
        ELSE
            -- Fallback: schedule_defaults oder gleichmäßig verteilen
            SELECT * INTO v_defaults FROM schedule_defaults WHERE trade_id = v_trade_id;
            IF v_defaults IS NOT NULL AND v_defaults.avg_duration_days IS NOT NULL AND v_defaults.observation_count > 0 THEN
                v_duration := CEIL(v_defaults.avg_duration_days);
            ELSE
                v_duration := GREATEST(CEIL(v_total_days::NUMERIC / GREATEST(jsonb_array_length(v_trade_seq), 3)), 3);
            END IF;
            v_warnings := array_append(v_warnings,
                v_trade_name || ': Keine labor_minutes — nutze Fallback (' || v_duration || ' Tage)');
        END IF;

        v_phase_start := LEAST(v_start + v_day_offset, v_end);
        v_phase_end := LEAST(v_phase_start + v_duration - 1, v_end);
        v_day_offset := v_day_offset + v_duration;

        -- =====================================================
        -- Monteur-Matching: 3 Stufen (gleiche Logik wie V2)
        -- =====================================================
        v_best_member_id := NULL;
        v_best_member_name := NULL;

        -- Stufe 1: Default-Monteur aus schedule_defaults
        SELECT * INTO v_defaults FROM schedule_defaults WHERE trade_id = v_trade_id;
        IF v_defaults IS NOT NULL AND v_defaults.default_team_member_id IS NOT NULL THEN
            SELECT id, tm.name INTO v_member_id, v_member_name
            FROM team_members tm
            WHERE tm.id = v_defaults.default_team_member_id AND tm.active = true;
            IF FOUND THEN
                SELECT COUNT(*) INTO v_busy_count FROM schedule_phases sp
                WHERE sp.assigned_team_member_id = v_member_id AND sp.status != 'proposed'
                  AND sp.start_date <= v_phase_end AND sp.end_date >= v_phase_start;
                IF v_busy_count = 0 THEN
                    v_best_member_id := v_member_id;
                    v_best_member_name := v_member_name;
                END IF;
            END IF;
        END IF;

        -- Stufe 2: Monteur per trade_id Match
        IF v_best_member_id IS NULL AND v_trade_id IS NOT NULL THEN
            v_min_busy := 999999;
            FOR v_member_id, v_member_name IN
                SELECT tm.id, tm.name FROM team_members tm
                WHERE tm.active = true AND tm.role NOT IN ('GF', 'Bauleiter', 'Bauleiterin', 'Polier')
                  AND tm.trade_id = v_trade_id
                ORDER BY tm.name
            LOOP
                SELECT COUNT(*) INTO v_busy_count FROM schedule_phases sp
                WHERE sp.assigned_team_member_id = v_member_id AND sp.status != 'proposed'
                  AND sp.start_date <= v_phase_end AND sp.end_date >= v_phase_start;
                IF v_busy_count < v_min_busy THEN
                    v_min_busy := v_busy_count;
                    v_best_member_id := v_member_id;
                    v_best_member_name := v_member_name;
                END IF;
                EXIT WHEN v_busy_count = 0;
            END LOOP;
        END IF;

        -- Stufe 3: Fallback — am wenigsten beschäftigter Monteur
        IF v_best_member_id IS NULL THEN
            v_min_busy := 999999;
            FOR v_member_id, v_member_name IN
                SELECT tm.id, tm.name FROM team_members tm
                WHERE tm.active = true AND tm.role NOT IN ('GF', 'Bauleiter', 'Bauleiterin', 'Polier')
                  AND tm.trade_id IS NOT NULL
                ORDER BY tm.name
            LOOP
                SELECT COUNT(*) INTO v_busy_count FROM schedule_phases sp
                WHERE sp.assigned_team_member_id = v_member_id AND sp.status != 'proposed'
                  AND sp.start_date <= v_phase_end AND sp.end_date >= v_phase_start;
                IF v_busy_count < v_min_busy THEN
                    v_min_busy := v_busy_count;
                    v_best_member_id := v_member_id;
                    v_best_member_name := v_member_name;
                END IF;
                EXIT WHEN v_busy_count = 0;
            END LOOP;
        END IF;

        -- Phase einfügen (negative phase_number = proposed)
        INSERT INTO schedule_phases (
            project_id, phase_number, name, trade, trade_id,
            start_date, end_date, assigned_team_member_id,
            status, progress, estimated_qty
        ) VALUES (
            v_project_id, -v_phase_order, v_trade_name, v_trade_name, v_trade_id,
            v_phase_start, v_phase_end, v_best_member_id,
            'proposed', 0, (v_trade->>'position_count')::INT
        )
        ON CONFLICT (project_id, phase_number) DO UPDATE SET
            name = EXCLUDED.name, trade = EXCLUDED.trade, trade_id = EXCLUDED.trade_id,
            start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date,
            assigned_team_member_id = EXCLUDED.assigned_team_member_id,
            status = 'proposed', estimated_qty = EXCLUDED.estimated_qty, updated_at = now();

        v_phases_created := v_phases_created + 1;

        IF v_best_member_id IS NOT NULL THEN
            v_assigned_count := v_assigned_count + 1;
            v_assignments := v_assignments || jsonb_build_object(
                'trade', v_trade_name, 'trade_id', v_trade_id,
                'member_id', v_best_member_id, 'member_name', v_best_member_name,
                'start_date', v_phase_start, 'end_date', v_phase_end,
                'duration_days', v_duration,
                'total_minutes', v_total_minutes
            );
        ELSE
            v_unassigned := array_append(v_unassigned, v_trade_name);
        END IF;
    END LOOP;

    v_output := jsonb_build_object(
        'success', true,
        'project_id', v_project_id,
        'phases_created', v_phases_created,
        'assigned_count', v_assigned_count,
        'unassigned_trades', to_jsonb(v_unassigned),
        'assignments', v_assignments,
        'warnings', to_jsonb(v_warnings),
        'errors', to_jsonb(v_errors)
    );

    PERFORM fn_pipeline_step_complete(v_step_id, v_output, 'completed', v_warnings, v_errors);
    RETURN v_output;
END;
$$;

COMMENT ON FUNCTION fn_agent_einsatzplaner IS 'Staffellauf Agent #5: Phasen + Monteure zuweisen. Nutzt trade_sequence vom Plausibilitäts-Agent + labor_minutes für Dauer.';

-- ===========================================
-- 3. auto_plan_full() V2 — Staffellauf-Wrapper
-- Ruft Pipeline-Agenten sequentiell auf
-- Abwärtskompatibel: gleiche Signatur + Return-Struktur
-- ===========================================
CREATE OR REPLACE FUNCTION auto_plan_full(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_project RECORD;
    v_run_id UUID;
    v_plausibility_result JSONB;
    v_material_result JSONB;
    v_schedule_result JSONB;
    v_einsatz_input JSONB;
    v_approval_schedule_id UUID;
    v_approval_material_id UUID;
    v_material_summary JSONB;
    v_problems JSONB := '[]'::JSONB;
    v_need RECORD;
BEGIN
    -- Projekt validieren
    SELECT id, name, status, planned_start, planned_end
    INTO v_project FROM projects WHERE id = p_project_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Projekt nicht gefunden');
    END IF;

    -- Pipeline starten
    BEGIN
        v_run_id := fn_pipeline_start(p_project_id);
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
    END;

    -- =============================================
    -- Agent 3: Plausibilität
    -- =============================================
    v_plausibility_result := fn_agent_plausibility(
        v_run_id,
        jsonb_build_object('project_id', p_project_id)
    );

    -- STOP prüfen
    IF (v_plausibility_result->>'stop')::BOOLEAN = true THEN
        PERFORM fn_pipeline_complete(v_run_id, jsonb_build_object(
            'stopped_at', 'plausibility',
            'reason', v_plausibility_result->>'stop_reason'
        ));
        RETURN jsonb_build_object('success', false,
            'error', 'Plausibilitäts-Check gestoppt: ' || v_plausibility_result->>'stop_reason',
            'pipeline_run_id', v_run_id,
            'plausibility', v_plausibility_result);
    END IF;

    -- =============================================
    -- Agent 4: Material
    -- =============================================
    v_material_result := fn_agent_material(
        v_run_id,
        jsonb_build_object('project_id', p_project_id)
    );

    -- =============================================
    -- Agent 5: Einsatzplaner
    -- =============================================
    IF v_project.planned_start IS NOT NULL AND v_project.planned_end IS NOT NULL THEN
        -- Input für Einsatzplaner: project_id + trade_sequence vom Plausibilitäts-Agent
        v_einsatz_input := jsonb_build_object(
            'project_id', p_project_id,
            'trade_sequence', v_plausibility_result->'trade_sequence'
        );

        v_schedule_result := fn_agent_einsatzplaner(v_run_id, v_einsatz_input);
    ELSE
        v_schedule_result := jsonb_build_object('success', false, 'error', 'Kein Start-/Enddatum');
    END IF;

    -- =============================================
    -- Approvals erstellen
    -- =============================================
    -- Schedule Approval
    IF (v_schedule_result->>'success')::BOOLEAN = true AND (v_schedule_result->>'phases_created')::INT > 0 THEN
        INSERT INTO approvals (project_id, approval_type, status, requested_by, request_summary, request_data)
        VALUES (p_project_id, 'SCHEDULE', 'PENDING', 'system_auto_plan',
            (v_schedule_result->>'phases_created') || ' Phasen geplant, ' ||
            (v_schedule_result->>'assigned_count') || ' Monteure zugewiesen' ||
            CASE WHEN jsonb_array_length(COALESCE(v_plausibility_result->'warnings', '[]'::JSONB)) > 0
                 THEN ' ⚠️' ELSE '' END,
            jsonb_build_object(
                'phases', v_schedule_result->'phases_created',
                'assigned', v_schedule_result->'assigned_count',
                'unassigned', v_schedule_result->'unassigned_trades',
                'assignments', v_schedule_result->'assignments',
                'plausibility_warnings', v_plausibility_result->'warnings',
                'pipeline_run_id', v_run_id
            ))
        RETURNING id INTO v_approval_schedule_id;
    END IF;

    -- Material Approval
    IF (v_material_result->>'success')::BOOLEAN = true AND (v_material_result->>'needs_created')::INT > 0 THEN
        SELECT jsonb_agg(sub.trade_summary) INTO v_material_summary FROM (
            SELECT jsonb_build_object('trade', trade, 'count', COUNT(*),
                'problems', COUNT(*) FILTER (WHERE problem IS NOT NULL)) AS trade_summary
            FROM project_material_needs
            WHERE project_id = p_project_id AND source = 'auto_plan' AND status = 'planned'
            GROUP BY trade
        ) sub;

        -- Problem-Zusammenfassung
        FOR v_need IN
            SELECT trade, needed_by, problem, COUNT(*) AS cnt, SUM(total_quantity) AS total_qty
            FROM project_material_needs
            WHERE project_id = p_project_id AND source = 'auto_plan' AND problem IS NOT NULL
            GROUP BY trade, needed_by, problem
        LOOP
            v_problems := v_problems || jsonb_build_object(
                'trade', v_need.trade, 'problem', v_need.problem,
                'count', v_need.cnt, 'needed_by', v_need.needed_by);
        END LOOP;

        INSERT INTO approvals (project_id, approval_type, status, requested_by, request_summary, request_data)
        VALUES (p_project_id, 'MATERIAL_ORDER', 'PENDING', 'system_auto_plan',
            (v_material_result->>'needs_created') || ' Materialpositionen berechnet, ' ||
            (v_material_result->>'needs_without_mapping') || ' ohne Mapping',
            jsonb_build_object(
                'needs_created', v_material_result->'needs_created',
                'needs_without_mapping', v_material_result->'needs_without_mapping',
                'trades_summary', COALESCE(v_material_summary, '[]'::JSONB),
                'problems', v_problems,
                'pipeline_run_id', v_run_id
            ))
        RETURNING id INTO v_approval_material_id;
    END IF;

    -- Pipeline-Run: Approval-IDs speichern + abschließen
    UPDATE pipeline_runs
    SET approval_schedule_id = v_approval_schedule_id,
        approval_material_id = v_approval_material_id
    WHERE id = v_run_id;

    PERFORM fn_pipeline_complete(v_run_id, jsonb_build_object(
        'plausibility', jsonb_build_object(
            'trade_count', v_plausibility_result->'trade_count',
            'total_positions', v_plausibility_result->'total_positions',
            'warnings_count', jsonb_array_length(COALESCE(v_plausibility_result->'warnings', '[]'::JSONB))
        ),
        'schedule', jsonb_build_object(
            'phases_created', v_schedule_result->'phases_created',
            'assigned_count', v_schedule_result->'assigned_count'
        ),
        'material', jsonb_build_object(
            'needs_created', v_material_result->'needs_created'
        )
    ));

    -- Event feuern
    INSERT INTO events (event_type, project_id, source_system, source_flow, payload)
    VALUES ('AUTO_PLAN_COMPLETED', p_project_id, 'db', 'auto_plan_full_v2',
        jsonb_build_object(
            'pipeline_run_id', v_run_id,
            'schedule', v_schedule_result,
            'material', v_material_result,
            'plausibility_warnings', v_plausibility_result->'warnings',
            'approval_schedule_id', v_approval_schedule_id,
            'approval_material_id', v_approval_material_id,
            'problems', v_problems
        ));

    -- Abwärtskompatibles Return-Format
    RETURN jsonb_build_object(
        'success', true,
        'project_name', v_project.name,
        'pipeline_run_id', v_run_id,
        'schedule', v_schedule_result,
        'material', v_material_result,
        'plausibility', jsonb_build_object(
            'trade_count', v_plausibility_result->'trade_count',
            'total_positions', v_plausibility_result->'total_positions',
            'warnings', v_plausibility_result->'warnings'
        ),
        'approval_schedule_id', v_approval_schedule_id,
        'approval_material_id', v_approval_material_id,
        'problems', v_problems
    );
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION fn_agent_material(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_agent_einsatzplaner(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_agent_plausibility(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_pipeline_start(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_pipeline_complete(UUID, JSONB) TO authenticated;
