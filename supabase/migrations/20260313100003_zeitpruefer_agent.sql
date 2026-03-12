-- ============================================================================
-- Migration: Zeitprüfer Agent + Richtzeitwerte Seeding + auto_plan_full V3
-- Staffellauf Phase 2: Echte Zeiten statt Würfeln
-- ============================================================================

-- ===========================================
-- 1. Richtzeitwerte seeden: Top-30 SAGA AV-2024 Positionen
-- ===========================================
INSERT INTO richtzeitwerte (catalog_position_nr, catalog_id, trade_id, labor_minutes_per_unit, unit, material_cost_per_unit, source, confidence, notes)
VALUES
-- ELEKTRO
('29.1', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '7c65f414-ddf3-4deb-a026-8936165f1240', 10, 'psch', 5.00, 'manual', 0.80, 'Lichtschalter tauschen'),
('30.1', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '7c65f414-ddf3-4deb-a026-8936165f1240', 10, 'psch', 5.00, 'manual', 0.80, 'Steckdose tauschen'),
('30.2', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '7c65f414-ddf3-4deb-a026-8936165f1240', 15, 'psch', 12.00, 'manual', 0.80, 'Doppelsteckdose montieren'),
('31.2', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '7c65f414-ddf3-4deb-a026-8936165f1240', 60, 'psch', 0, 'manual', 0.70, 'VDE-Prüfung Wohnung'),
-- HEIZUNG
('20.1', '925ae844-bef4-4213-b0a4-d4598dee2dfd', 'fa20c848-f4c6-4058-bd02-5a35e3e9a9a1', 30, 'psch', 3.00, 'manual', 0.80, 'Heizungsrohre streichen'),
('20.2', '925ae844-bef4-4213-b0a4-d4598dee2dfd', 'fa20c848-f4c6-4058-bd02-5a35e3e9a9a1', 45, 'psch', 5.00, 'manual', 0.80, 'Heizkörper streichen'),
('20.4', '925ae844-bef4-4213-b0a4-d4598dee2dfd', 'fa20c848-f4c6-4058-bd02-5a35e3e9a9a1', 3, 'psch', 15.00, 'manual', 0.95, 'Thermostatkopf ab/drauf: 3 Min'),
-- MALER
('1.1', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '6792de03-2acc-42a6-b1a2-0001888ab1f4', 60, 'psch', 8.00, 'manual', 0.75, 'Decke glätten+streichen pro Raum'),
('1.3', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '6792de03-2acc-42a6-b1a2-0001888ab1f4', 90, 'psch', 15.00, 'manual', 0.75, 'Deckentapete neu'),
('1.4', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '6792de03-2acc-42a6-b1a2-0001888ab1f4', 60, 'psch', 12.00, 'manual', 0.70, 'Decke reparieren+tapezieren'),
('2.1', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '6792de03-2acc-42a6-b1a2-0001888ab1f4', 120, 'psch', 20.00, 'manual', 0.75, 'Tapeten ab+glätten 2h/Raum'),
('2.2', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '6792de03-2acc-42a6-b1a2-0001888ab1f4', 90, 'psch', 10.00, 'manual', 0.75, 'Wände streichen 90min/Raum'),
('2.5', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '6792de03-2acc-42a6-b1a2-0001888ab1f4', 150, 'psch', 15.00, 'manual', 0.70, 'Latex/Glasfaser entfernen 2.5h'),
('2.7', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '6792de03-2acc-42a6-b1a2-0001888ab1f4', 45, 'psch', 8.00, 'manual', 0.75, 'Putzschäden bis 2qm'),
('6.3', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '6792de03-2acc-42a6-b1a2-0001888ab1f4', 60, 'psch', 25.00, 'manual', 0.75, 'Fußleisten montieren+lackieren'),
('6.5', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '6792de03-2acc-42a6-b1a2-0001888ab1f4', 20, 'psch', 0, 'manual', 0.80, 'Fußleisten entfernen'),
('14.7', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '6792de03-2acc-42a6-b1a2-0001888ab1f4', 5, 'psch', 2.00, 'manual', 0.90, 'Rauchwarnmelder abkleben'),
('14.8', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '6792de03-2acc-42a6-b1a2-0001888ab1f4', 30, 'psch', 15.00, 'manual', 0.75, 'Baubeleuchtung montieren'),
('16.1', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '6792de03-2acc-42a6-b1a2-0001888ab1f4', 60, 'psch', 8.00, 'manual', 0.80, 'Türblatt beidseitig lackieren'),
-- TISCHLER
('10.1', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '64e354cd-a1c0-42a8-bb97-3ef71f96ecdb', 30, 'psch', 5.00, 'manual', 0.80, 'Fensterbank lackieren'),
('12.1', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '64e354cd-a1c0-42a8-bb97-3ef71f96ecdb', 15, 'psch', 0, 'manual', 0.85, 'Gardinenbrett entfernen'),
('16.12', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '64e354cd-a1c0-42a8-bb97-3ef71f96ecdb', 60, 'psch', 8.00, 'manual', 0.75, 'Wohnungstür innen lackieren'),
('16.13', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '64e354cd-a1c0-42a8-bb97-3ef71f96ecdb', 60, 'psch', 8.00, 'manual', 0.75, 'Wohnungstür außen lackieren'),
('17.2', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '64e354cd-a1c0-42a8-bb97-3ef71f96ecdb', 15, 'psch', 8.00, 'manual', 0.85, 'Türschließblech montieren'),
('17.3', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '64e354cd-a1c0-42a8-bb97-3ef71f96ecdb', 25, 'psch', 15.00, 'manual', 0.85, 'Türschloss erneuern'),
('17.4', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '64e354cd-a1c0-42a8-bb97-3ef71f96ecdb', 20, 'psch', 12.00, 'manual', 0.85, 'Türbeschläge erneuern'),
('17.5', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '64e354cd-a1c0-42a8-bb97-3ef71f96ecdb', 45, 'psch', 5.00, 'manual', 0.80, 'Türzarge schleifen+lackieren'),
('19.1', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '64e354cd-a1c0-42a8-bb97-3ef71f96ecdb', 45, 'psch', 5.00, 'manual', 0.80, 'Türzarge anschleifen+lackieren'),
-- BODEN
('5.4', '925ae844-bef4-4213-b0a4-d4598dee2dfd', 'cc47de4c-4537-4d6d-bf88-2e0e6699170d', 90, 'psch', 10.00, 'manual', 0.70, 'PVC entfernen+spachteln'),
('5.12', '925ae844-bef4-4213-b0a4-d4598dee2dfd', 'cc47de4c-4537-4d6d-bf88-2e0e6699170d', 60, 'psch', 15.00, 'manual', 0.70, 'Fußboden ausgleichen'),
-- SANITÄR
('14.5', '925ae844-bef4-4213-b0a4-d4598dee2dfd', '9b3ebe02-4275-4acb-a71f-3b0969bb1f20', 180, 'psch', 10.00, 'manual', 0.70, 'Wohnung Grundreinigung 3h')
ON CONFLICT (catalog_position_nr, catalog_id) DO UPDATE SET
    labor_minutes_per_unit = EXCLUDED.labor_minutes_per_unit,
    material_cost_per_unit = EXCLUDED.material_cost_per_unit,
    notes = EXCLUDED.notes, updated_at = now();

-- ===========================================
-- 2. fn_agent_zeitpruefer() — Agent #2
-- Enriches Positionen mit labor_minutes aus Richtzeitwerten + Formel-Fallback
-- Schreibt labor_minutes in offer_positions (DB-Update)
-- ===========================================
CREATE OR REPLACE FUNCTION fn_agent_zeitpruefer(p_run_id UUID, p_input JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_step_id UUID;
    v_project_id UUID;
    v_positions JSONB;
    v_enriched JSONB := '[]'::JSONB;
    v_pos JSONB;
    v_warnings TEXT[] := '{}';
    v_errors TEXT[] := '{}';
    v_output JSONB;
    v_rzw RECORD;
    v_labor_min NUMERIC;
    v_mat_cost NUMERIC;
    v_confidence NUMERIC;
    v_source TEXT;
    v_matched INT := 0;
    v_formula_fallback INT := 0;
    v_no_data INT := 0;
    v_total INT;
    v_updated_in_db INT := 0;
    i INT;
BEGIN
    v_project_id := (p_input->>'project_id')::UUID;
    v_step_id := fn_pipeline_step_start(p_run_id, 'zeitpruefer', 2, p_input);

    -- Positionen aus Input (vom Plausibilitäts-Agent oder direkt aus DB)
    IF p_input ? 'positions' AND jsonb_array_length(p_input->'positions') > 0 THEN
        v_positions := p_input->'positions';
    ELSE
        SELECT jsonb_agg(jsonb_build_object(
            'id', op.id, 'catalog_code', op.catalog_code, 'title', op.title,
            'quantity', op.quantity, 'unit', op.unit,
            'trade', op.trade::TEXT, 'trade_id', COALESCE(op.trade_id, t.id),
            'labor_minutes', op.labor_minutes, 'material_cost', op.material_cost,
            'unit_price', op.unit_price
        ))
        INTO v_positions
        FROM offer_positions op
        JOIN offers o ON o.id = op.offer_id
        LEFT JOIN trades t ON t.name = op.trade::TEXT
        WHERE o.project_id = v_project_id AND op.deleted_at IS NULL
          AND (op.is_optional IS NULL OR op.is_optional = false);
    END IF;

    v_total := COALESCE(jsonb_array_length(v_positions), 0);
    IF v_total = 0 THEN
        v_output := jsonb_build_object('success', true, 'project_id', v_project_id,
            'positions', '[]'::JSONB, 'matched', 0, 'formula_fallback', 0, 'no_data', 0,
            'warnings', to_jsonb(v_warnings), 'errors', to_jsonb(v_errors));
        PERFORM fn_pipeline_step_complete(v_step_id, v_output, 'completed', v_warnings, v_errors);
        RETURN v_output;
    END IF;

    -- Jede Position enrichen
    FOR i IN 0..v_total - 1 LOOP
        v_pos := v_positions->i;
        v_labor_min := NULL;
        v_mat_cost := NULL;
        v_confidence := 0;
        v_source := NULL;

        -- 1. Richtzeitwert-Lookup (höchste Priorität)
        IF v_pos->>'catalog_code' IS NOT NULL THEN
            SELECT rzw.labor_minutes_per_unit, rzw.material_cost_per_unit, rzw.confidence
            INTO v_rzw
            FROM richtzeitwerte rzw
            WHERE rzw.catalog_position_nr = v_pos->>'catalog_code'
              AND rzw.confidence >= 0.5
            ORDER BY rzw.confidence DESC
            LIMIT 1;

            IF FOUND THEN
                v_labor_min := v_rzw.labor_minutes_per_unit * COALESCE((v_pos->>'quantity')::NUMERIC, 1);
                v_mat_cost := v_rzw.material_cost_per_unit * COALESCE((v_pos->>'quantity')::NUMERIC, 1);
                v_confidence := v_rzw.confidence;
                v_source := 'richtzeitwert';
                v_matched := v_matched + 1;
            END IF;
        END IF;

        -- 2. Formel-Fallback: (unit_price - geschätzte Material) / 70€/h × 60 = max Minuten
        IF v_labor_min IS NULL AND (v_pos->>'unit_price') IS NOT NULL AND (v_pos->>'unit_price')::NUMERIC > 0 THEN
            DECLARE
                v_price NUMERIC := (v_pos->>'unit_price')::NUMERIC;
                v_qty NUMERIC := COALESCE((v_pos->>'quantity')::NUMERIC, 1);
                v_estimated_material NUMERIC := v_price * 0.3;  -- 30% Material-Anteil Schätzung
                v_lohn NUMERIC := v_price - v_estimated_material;
            BEGIN
                -- Minuten = Lohnanteil / Stundensatz × 60
                v_labor_min := GREATEST(ROUND(v_lohn / 70.0 * 60 * v_qty, 1), 1);
                v_mat_cost := ROUND(v_estimated_material * v_qty, 2);
                v_confidence := 0.3;
                v_source := 'formel_fallback';
                v_formula_fallback := v_formula_fallback + 1;
            END;
        END IF;

        IF v_labor_min IS NULL THEN
            v_no_data := v_no_data + 1;
        END IF;

        -- Position enrichen
        v_enriched := v_enriched || (v_pos || jsonb_build_object(
            'labor_minutes', v_labor_min,
            'material_cost', v_mat_cost,
            'time_confidence', v_confidence,
            'time_source', v_source
        ));

        -- DB updaten: labor_minutes + material_cost in offer_positions schreiben
        IF v_labor_min IS NOT NULL AND (v_pos->>'id') IS NOT NULL THEN
            UPDATE offer_positions
            SET labor_minutes = v_labor_min,
                material_cost = COALESCE(v_mat_cost, material_cost),
                updated_at = now()
            WHERE id = (v_pos->>'id')::UUID
              AND (labor_minutes IS NULL OR labor_minutes = 0);
            IF FOUND THEN v_updated_in_db := v_updated_in_db + 1; END IF;
        END IF;
    END LOOP;

    -- Warnungen
    IF v_formula_fallback > 0 THEN
        v_warnings := array_append(v_warnings,
            v_formula_fallback || ' Positionen mit Formel-Fallback (30% Material, 70€/h) — geringe Confidence');
    END IF;
    IF v_no_data > 0 THEN
        v_warnings := array_append(v_warnings,
            v_no_data || ' Positionen ohne Zeitdaten (kein Katalogcode, kein Preis)');
    END IF;

    v_output := jsonb_build_object(
        'success', true,
        'project_id', v_project_id,
        'total_positions', v_total,
        'matched_richtzeitwerte', v_matched,
        'formula_fallback', v_formula_fallback,
        'no_data', v_no_data,
        'updated_in_db', v_updated_in_db,
        'positions', v_enriched,
        'warnings', to_jsonb(v_warnings),
        'errors', to_jsonb(v_errors)
    );

    PERFORM fn_pipeline_step_complete(v_step_id, v_output, 'completed', v_warnings, v_errors);
    RETURN v_output;
END;
$$;

COMMENT ON FUNCTION fn_agent_zeitpruefer IS 'Staffellauf Agent #2: Enriches Positionen mit labor_minutes aus Richtzeitwerten (Lookup) + Formel-Fallback (30% Material, 70€/h). Schreibt in offer_positions.';

GRANT EXECUTE ON FUNCTION fn_agent_zeitpruefer(UUID, JSONB) TO authenticated;

-- ===========================================
-- 3. auto_plan_full() V3 — mit Zeitprüfer
-- Pipeline: Zeitprüfer → Plausibilität → Material → Einsatzplaner → Approvals
-- ===========================================
CREATE OR REPLACE FUNCTION auto_plan_full(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_project RECORD; v_run_id UUID;
    v_zeitpruefer_result JSONB;
    v_plausibility_result JSONB; v_material_result JSONB; v_schedule_result JSONB;
    v_einsatz_input JSONB;
    v_approval_schedule_id UUID; v_approval_material_id UUID;
    v_material_summary JSONB; v_problems JSONB := '[]'::JSONB; v_need RECORD;
BEGIN
    SELECT id, name, status, planned_start, planned_end INTO v_project FROM projects WHERE id = p_project_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Projekt nicht gefunden'); END IF;

    BEGIN v_run_id := fn_pipeline_start(p_project_id);
    EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('success', false, 'error', SQLERRM); END;

    -- Agent 2: Zeitprüfer — enriches positions mit labor_minutes
    v_zeitpruefer_result := fn_agent_zeitpruefer(v_run_id, jsonb_build_object('project_id', p_project_id));

    -- Agent 3: Plausibilität — jetzt MIT labor_minutes aus Zeitprüfer
    v_plausibility_result := fn_agent_plausibility(v_run_id,
        jsonb_build_object('project_id', p_project_id, 'positions', v_zeitpruefer_result->'positions'));

    IF (v_plausibility_result->>'stop')::BOOLEAN = true THEN
        PERFORM fn_pipeline_complete(v_run_id, jsonb_build_object('stopped_at', 'plausibility', 'reason', v_plausibility_result->>'stop_reason'));
        RETURN jsonb_build_object('success', false, 'error', 'Plausibilitäts-Check gestoppt: ' || v_plausibility_result->>'stop_reason',
            'pipeline_run_id', v_run_id, 'plausibility', v_plausibility_result);
    END IF;

    -- Agent 4: Material
    v_material_result := fn_agent_material(v_run_id, jsonb_build_object('project_id', p_project_id));

    -- Agent 5: Einsatzplaner
    IF v_project.planned_start IS NOT NULL AND v_project.planned_end IS NOT NULL THEN
        v_einsatz_input := jsonb_build_object('project_id', p_project_id, 'trade_sequence', v_plausibility_result->'trade_sequence');
        v_schedule_result := fn_agent_einsatzplaner(v_run_id, v_einsatz_input);
    ELSE
        v_schedule_result := jsonb_build_object('success', false, 'error', 'Kein Start-/Enddatum');
    END IF;

    -- Approvals
    IF (v_schedule_result->>'success')::BOOLEAN = true AND (v_schedule_result->>'phases_created')::INT > 0 THEN
        INSERT INTO approvals (project_id, approval_type, status, requested_by, request_summary, request_data)
        VALUES (p_project_id, 'SCHEDULE', 'PENDING', 'system_auto_plan',
            (v_schedule_result->>'phases_created') || ' Phasen geplant, ' || (v_schedule_result->>'assigned_count') || ' Monteure zugewiesen'
            || CASE WHEN jsonb_array_length(COALESCE(v_plausibility_result->'warnings', '[]'::JSONB)) > 0 THEN ' ⚠️' ELSE '' END,
            jsonb_build_object('phases', v_schedule_result->'phases_created', 'assigned', v_schedule_result->'assigned_count',
                'unassigned', v_schedule_result->'unassigned_trades', 'assignments', v_schedule_result->'assignments',
                'plausibility_warnings', v_plausibility_result->'warnings',
                'zeitpruefer', jsonb_build_object('matched', v_zeitpruefer_result->'matched_richtzeitwerte',
                    'fallback', v_zeitpruefer_result->'formula_fallback', 'no_data', v_zeitpruefer_result->'no_data'),
                'pipeline_run_id', v_run_id))
        RETURNING id INTO v_approval_schedule_id;
    END IF;

    IF (v_material_result->>'success')::BOOLEAN = true AND (v_material_result->>'needs_created')::INT > 0 THEN
        SELECT jsonb_agg(sub.trade_summary) INTO v_material_summary FROM (
            SELECT jsonb_build_object('trade', trade, 'count', COUNT(*), 'problems', COUNT(*) FILTER (WHERE problem IS NOT NULL)) AS trade_summary
            FROM project_material_needs WHERE project_id = p_project_id AND source = 'auto_plan' AND status = 'planned' GROUP BY trade
        ) sub;

        FOR v_need IN SELECT trade, needed_by, problem, COUNT(*) AS cnt, SUM(total_quantity) AS total_qty
            FROM project_material_needs WHERE project_id = p_project_id AND source = 'auto_plan' AND problem IS NOT NULL
            GROUP BY trade, needed_by, problem
        LOOP v_problems := v_problems || jsonb_build_object('trade', v_need.trade, 'problem', v_need.problem, 'count', v_need.cnt, 'needed_by', v_need.needed_by); END LOOP;

        INSERT INTO approvals (project_id, approval_type, status, requested_by, request_summary, request_data)
        VALUES (p_project_id, 'MATERIAL_ORDER', 'PENDING', 'system_auto_plan',
            (v_material_result->>'needs_created') || ' Materialpositionen, ' || (v_material_result->>'needs_without_mapping') || ' ohne Mapping',
            jsonb_build_object('needs_created', v_material_result->'needs_created', 'needs_without_mapping', v_material_result->'needs_without_mapping',
                'trades_summary', COALESCE(v_material_summary, '[]'::JSONB), 'problems', v_problems, 'pipeline_run_id', v_run_id))
        RETURNING id INTO v_approval_material_id;
    END IF;

    UPDATE pipeline_runs SET approval_schedule_id = v_approval_schedule_id, approval_material_id = v_approval_material_id WHERE id = v_run_id;

    PERFORM fn_pipeline_complete(v_run_id, jsonb_build_object(
        'zeitpruefer', jsonb_build_object('matched', v_zeitpruefer_result->'matched_richtzeitwerte',
            'fallback', v_zeitpruefer_result->'formula_fallback', 'updated_db', v_zeitpruefer_result->'updated_in_db'),
        'plausibility', jsonb_build_object('trade_count', v_plausibility_result->'trade_count',
            'total_positions', v_plausibility_result->'total_positions', 'total_hours', v_plausibility_result->'total_project_hours',
            'warnings_count', jsonb_array_length(COALESCE(v_plausibility_result->'warnings', '[]'::JSONB))),
        'schedule', jsonb_build_object('phases_created', v_schedule_result->'phases_created', 'assigned_count', v_schedule_result->'assigned_count'),
        'material', jsonb_build_object('needs_created', v_material_result->'needs_created')));

    INSERT INTO events (event_type, project_id, source_system, source_flow, payload)
    VALUES ('AUTO_PLAN_COMPLETED', p_project_id, 'db', 'auto_plan_full_v3',
        jsonb_build_object('pipeline_run_id', v_run_id, 'schedule', v_schedule_result, 'material', v_material_result,
            'zeitpruefer', jsonb_build_object('matched', v_zeitpruefer_result->'matched_richtzeitwerte', 'fallback', v_zeitpruefer_result->'formula_fallback'),
            'plausibility_warnings', v_plausibility_result->'warnings',
            'approval_schedule_id', v_approval_schedule_id, 'approval_material_id', v_approval_material_id));

    RETURN jsonb_build_object('success', true, 'project_name', v_project.name, 'pipeline_run_id', v_run_id,
        'schedule', v_schedule_result, 'material', v_material_result,
        'zeitpruefer', jsonb_build_object('matched', v_zeitpruefer_result->'matched_richtzeitwerte',
            'formula_fallback', v_zeitpruefer_result->'formula_fallback', 'no_data', v_zeitpruefer_result->'no_data',
            'updated_in_db', v_zeitpruefer_result->'updated_in_db'),
        'plausibility', jsonb_build_object('trade_count', v_plausibility_result->'trade_count',
            'total_positions', v_plausibility_result->'total_positions', 'total_hours', v_plausibility_result->'total_project_hours',
            'warnings', v_plausibility_result->'warnings'),
        'approval_schedule_id', v_approval_schedule_id, 'approval_material_id', v_approval_material_id, 'problems', v_problems);
END;
$$;

COMMENT ON FUNCTION auto_plan_full IS 'Staffellauf Orchestrator V3: Zeitprüfer → Plausibilität → Material → Einsatzplaner → Approvals. Abwärtskompatibel.';
