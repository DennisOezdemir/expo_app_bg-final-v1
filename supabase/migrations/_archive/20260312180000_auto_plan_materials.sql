-- =============================================================
-- Migration 096: auto_plan_materials + auto_plan_full + Approve-Funktionen
-- =============================================================
-- Bauleiter-Logik: Positionen + Aufmaß → Materialbedarf berechnen
-- Schreibt in project_material_needs (Source of Truth)
-- Erzeugt Approvals im Freigabecenter für Material + Schedule
-- =============================================================

-- 1. Erweitere project_material_needs um fehlende Felder
ALTER TABLE project_material_needs
  ADD COLUMN IF NOT EXISTS supplier_name TEXT,
  ADD COLUMN IF NOT EXISTS supplier_id UUID,
  ADD COLUMN IF NOT EXISTS schedule_phase_id UUID REFERENCES schedule_phases(id),
  ADD COLUMN IF NOT EXISTS needed_by DATE,
  ADD COLUMN IF NOT EXISTS problem TEXT,
  ADD COLUMN IF NOT EXISTS suggested_product_id UUID,
  ADD COLUMN IF NOT EXISTS suggested_product_name TEXT,
  ADD COLUMN IF NOT EXISTS catalog_position_nr TEXT,
  ADD COLUMN IF NOT EXISTS multiplier_used NUMERIC DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_pmn_project_status ON project_material_needs(project_id, status);
CREATE INDEX IF NOT EXISTS idx_pmn_project_trade ON project_material_needs(project_id, trade);
CREATE INDEX IF NOT EXISTS idx_pmn_schedule_phase ON project_material_needs(schedule_phase_id);

-- 2. New event types
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'AUTO_PLAN_COMPLETED';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'MATERIAL_ORDER_APPROVED';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'SCHEDULE_APPROVED';

-- 3. auto_plan_materials(project_id) — Materialbedarf aus Positionen + Aufmaß + Mappings
CREATE OR REPLACE FUNCTION auto_plan_materials(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project RECORD;
  v_pos RECORD;
  v_mapping RECORD;
  v_needs_created INT := 0;
  v_needs_skipped INT := 0;
  v_problems TEXT[] := '{}';
  v_trades_found TEXT[] := '{}';
  v_existing INT;
  v_qty NUMERIC;
  v_multiplier NUMERIC;
  v_room_name TEXT;
  v_phase_id UUID;
  v_needed_by DATE;
  v_need_id UUID;
  v_room_qty NUMERIC;
  v_was_insert BOOLEAN;
BEGIN
  SELECT id, name, status, planned_start, planned_end
  INTO v_project FROM projects WHERE id = p_project_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Projekt nicht gefunden');
  END IF;

  SELECT COUNT(*) INTO v_existing
  FROM project_material_needs
  WHERE project_id = p_project_id AND status = 'planned' AND source = 'auto_plan';
  IF v_existing > 0 THEN
    RETURN jsonb_build_object('success', false,
      'error', 'Material-Planung existiert bereits (' || v_existing || ' Positionen).',
      'existing_count', v_existing);
  END IF;

  FOR v_pos IN
    SELECT op.id AS pos_id, op.catalog_code, op.title AS pos_title,
      op.quantity AS pos_qty, op.unit AS pos_unit,
      op.trade::text AS trade_name, op.trade_id, op.section_id,
      os.title AS section_title, os.room_measurement_id, o.id AS offer_id
    FROM offer_positions op
    JOIN offers o ON o.id = op.offer_id
    LEFT JOIN offer_sections os ON os.id = op.section_id
    WHERE o.project_id = p_project_id
      AND op.deleted_at IS NULL
      AND (op.position_type IS NULL OR op.position_type != 'ALTERNATIVE')
    ORDER BY op.trade, os.section_number, op.position_number
  LOOP
    IF v_pos.trade_name IS NOT NULL AND NOT v_pos.trade_name = ANY(v_trades_found) THEN
      v_trades_found := array_append(v_trades_found, v_pos.trade_name);
    END IF;

    v_room_name := NULL;
    IF v_pos.room_measurement_id IS NOT NULL THEN
      SELECT room_name INTO v_room_name FROM project_room_measurements WHERE id = v_pos.room_measurement_id;
    END IF;
    IF v_room_name IS NULL AND v_pos.section_title IS NOT NULL THEN
      v_room_name := v_pos.section_title;
    END IF;

    v_phase_id := NULL; v_needed_by := NULL;
    IF v_pos.trade_id IS NOT NULL THEN
      SELECT id, start_date INTO v_phase_id, v_needed_by FROM schedule_phases
      WHERE project_id = p_project_id AND trade_id = v_pos.trade_id
        AND status IN ('proposed', 'planned', 'in_progress')
      ORDER BY start_date ASC LIMIT 1;
    END IF;
    IF v_phase_id IS NULL AND v_pos.trade_name IS NOT NULL THEN
      SELECT id, start_date INTO v_phase_id, v_needed_by FROM schedule_phases
      WHERE project_id = p_project_id AND trade = v_pos.trade_name
        AND status IN ('proposed', 'planned', 'in_progress')
      ORDER BY start_date ASC LIMIT 1;
    END IF;

    FOR v_mapping IN
      SELECT cmm.material_name, cmm.default_qty, cmm.unit, cmm.gewerk,
        cmm.multiplier_field, cmm.multiplier_factor, cmm.product_pool_id, cmm.catalog_position_nr
      FROM catalog_material_mapping cmm
      WHERE cmm.catalog_position_nr = v_pos.catalog_code AND cmm.is_active = true
    LOOP
      v_multiplier := COALESCE(v_mapping.multiplier_factor, 1);
      IF v_mapping.multiplier_field IS NOT NULL AND v_pos.room_measurement_id IS NOT NULL THEN
        SELECT CASE v_mapping.multiplier_field
          WHEN 'floor_area_m2' THEN prm.floor_area_m2
          WHEN 'wall_area_m2' THEN prm.wall_area_m2
          WHEN 'ceiling_area_m2' THEN prm.ceiling_area_m2
          WHEN 'floor_perimeter_m' THEN prm.floor_perimeter_m
          WHEN 'perimeter_m' THEN prm.perimeter_m
          ELSE NULL END INTO v_room_qty
        FROM project_room_measurements prm WHERE prm.id = v_pos.room_measurement_id;
        IF v_room_qty IS NOT NULL THEN
          v_qty := v_room_qty * v_multiplier * COALESCE(v_mapping.default_qty, 1);
        ELSE
          v_qty := COALESCE(v_mapping.default_qty, 1) * COALESCE(v_pos.pos_qty, 1) * v_multiplier;
          v_problems := array_append(v_problems, 'Aufmaß-Feld "' || v_mapping.multiplier_field || '" fehlt für ' || v_mapping.material_name);
        END IF;
      ELSE
        v_qty := COALESCE(v_mapping.default_qty, 1) * COALESCE(v_pos.pos_qty, 1) * v_multiplier;
      END IF;

      INSERT INTO project_material_needs (
        project_id, trade, material_type, label, total_quantity, quantity_unit,
        room, source_position_nr, catalog_position_nr, schedule_phase_id, needed_by,
        multiplier_used, source, status, problem
      ) VALUES (
        p_project_id, COALESCE(v_mapping.gewerk, v_pos.trade_name, 'Sonstiges'),
        v_mapping.material_name, v_mapping.material_name, CEIL(v_qty),
        COALESCE(v_mapping.unit, v_pos.pos_unit, 'Stk'),
        v_room_name, v_pos.catalog_code, v_mapping.catalog_position_nr,
        v_phase_id, v_needed_by, v_multiplier, 'auto_plan', 'planned',
        CASE WHEN v_mapping.multiplier_field IS NOT NULL AND v_pos.room_measurement_id IS NULL THEN 'aufmass_fehlt' ELSE NULL END
      )
      ON CONFLICT (project_id, label, COALESCE(room, '__all__'))
      DO UPDATE SET total_quantity = project_material_needs.total_quantity + EXCLUDED.total_quantity, updated_at = now()
      RETURNING (xmax = 0) INTO v_was_insert;
      IF v_was_insert THEN v_needs_created := v_needs_created + 1; END IF;
    END LOOP;

    IF NOT EXISTS (
      SELECT 1 FROM catalog_material_mapping WHERE catalog_position_nr = v_pos.catalog_code AND is_active = true
    ) AND v_pos.catalog_code IS NOT NULL THEN
      v_needs_skipped := v_needs_skipped + 1;
      INSERT INTO project_material_needs (
        project_id, trade, material_type, label, total_quantity, quantity_unit,
        room, source_position_nr, schedule_phase_id, needed_by, source, status, problem
      ) VALUES (
        p_project_id, COALESCE(v_pos.trade_name, 'Sonstiges'),
        'Unbekannt (' || COALESCE(v_pos.catalog_code, '?') || ')',
        COALESCE(v_pos.pos_title, 'Position ohne Mapping'),
        COALESCE(v_pos.pos_qty, 1), COALESCE(v_pos.pos_unit, 'Stk'),
        v_room_name, v_pos.catalog_code, v_phase_id, v_needed_by,
        'auto_plan', 'planned', 'mapping_fehlt'
      )
      ON CONFLICT (project_id, label, COALESCE(room, '__all__'))
      DO UPDATE SET total_quantity = project_material_needs.total_quantity + EXCLUDED.total_quantity, updated_at = now()
      RETURNING (xmax = 0) INTO v_was_insert;
      IF v_was_insert THEN v_needs_created := v_needs_created + 1; END IF;
    END IF;
  END LOOP;

  UPDATE project_material_needs SET problem = COALESCE(problem, 'termin_fehlt')
  WHERE project_id = p_project_id AND source = 'auto_plan' AND status = 'planned'
    AND schedule_phase_id IS NULL AND problem IS NULL;

  RETURN jsonb_build_object('success', true, 'project_id', p_project_id,
    'project_name', v_project.name, 'needs_created', v_needs_created,
    'needs_without_mapping', v_needs_skipped, 'trades', to_jsonb(v_trades_found),
    'problems', to_jsonb(v_problems));
END;
$$;

-- 4. discard_material_plan
CREATE OR REPLACE FUNCTION discard_material_plan(p_project_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_deleted INT;
BEGIN
  DELETE FROM project_material_needs WHERE project_id = p_project_id AND source = 'auto_plan' AND status = 'planned';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN jsonb_build_object('success', true, 'deleted', v_deleted);
END;
$$;

-- 5. auto_plan_full (Material + Monteure + Freigaben)
CREATE OR REPLACE FUNCTION auto_plan_full(p_project_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_project RECORD;
  v_schedule_result JSONB;
  v_material_result JSONB;
  v_approval_schedule_id UUID;
  v_approval_material_id UUID;
  v_material_summary JSONB;
  v_problems JSONB := '[]'::jsonb;
  v_need RECORD;
BEGIN
  SELECT id, name, status, planned_start, planned_end INTO v_project FROM projects WHERE id = p_project_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Projekt nicht gefunden'); END IF;

  IF v_project.planned_start IS NOT NULL AND v_project.planned_end IS NOT NULL THEN
    v_schedule_result := auto_plan_project(p_project_id);
  ELSE
    v_schedule_result := jsonb_build_object('success', false, 'error', 'Kein Start-/Enddatum');
  END IF;

  v_material_result := auto_plan_materials(p_project_id);

  FOR v_need IN
    SELECT pmn.trade, pmn.needed_by, pmn.problem, COUNT(*) as cnt, SUM(pmn.total_quantity) as total_qty
    FROM project_material_needs pmn
    WHERE pmn.project_id = p_project_id AND pmn.source = 'auto_plan' AND pmn.problem IS NOT NULL
    GROUP BY pmn.trade, pmn.needed_by, pmn.problem
  LOOP
    v_problems := v_problems || jsonb_build_object('trade', v_need.trade, 'problem', v_need.problem, 'count', v_need.cnt, 'needed_by', v_need.needed_by);
  END LOOP;

  IF (v_schedule_result->>'success')::boolean = true AND (v_schedule_result->>'phases_created')::int > 0 THEN
    INSERT INTO approvals (project_id, approval_type, status, requested_by, request_summary, request_data)
    VALUES (p_project_id, 'SCHEDULE', 'PENDING', 'system_auto_plan',
      (v_schedule_result->>'phases_created') || ' Phasen geplant, ' || (v_schedule_result->>'assigned_count') || ' Monteure zugewiesen',
      jsonb_build_object('phases', v_schedule_result->'phases_created', 'assigned', v_schedule_result->'assigned_count',
        'unassigned', v_schedule_result->'unassigned_trades', 'assignments', v_schedule_result->'assignments'))
    RETURNING id INTO v_approval_schedule_id;
  END IF;

  IF (v_material_result->>'success')::boolean = true AND (v_material_result->>'needs_created')::int > 0 THEN
    SELECT jsonb_agg(trade_summary) INTO v_material_summary FROM (
      SELECT jsonb_build_object('trade', trade, 'count', COUNT(*), 'problems', COUNT(*) FILTER (WHERE problem IS NOT NULL)) AS trade_summary
      FROM project_material_needs WHERE project_id = p_project_id AND source = 'auto_plan' AND status = 'planned' GROUP BY trade
    ) sub;
    INSERT INTO approvals (project_id, approval_type, status, requested_by, request_summary, request_data)
    VALUES (p_project_id, 'MATERIAL_ORDER', 'PENDING', 'system_auto_plan',
      (v_material_result->>'needs_created') || ' Materialpositionen berechnet, ' || (v_material_result->>'needs_without_mapping') || ' ohne Mapping',
      jsonb_build_object('needs_created', v_material_result->'needs_created', 'needs_without_mapping', v_material_result->'needs_without_mapping',
        'trades_summary', COALESCE(v_material_summary, '[]'::jsonb), 'problems', v_problems))
    RETURNING id INTO v_approval_material_id;
  END IF;

  INSERT INTO events (event_type, project_id, source_system, source_flow, payload)
  VALUES ('AUTO_PLAN_COMPLETED', p_project_id, 'db', 'auto_plan_full',
    jsonb_build_object('schedule', v_schedule_result, 'material', v_material_result,
      'approval_schedule_id', v_approval_schedule_id, 'approval_material_id', v_approval_material_id, 'problems', v_problems));

  RETURN jsonb_build_object('success', true, 'project_name', v_project.name,
    'schedule', v_schedule_result, 'material', v_material_result,
    'approval_schedule_id', v_approval_schedule_id, 'approval_material_id', v_approval_material_id, 'problems', v_problems);
END;
$$;

-- 6. fn_approve_material_order
CREATE OR REPLACE FUNCTION fn_approve_material_order(p_approval_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_approval RECORD; v_updated INT;
BEGIN
  SELECT * INTO v_approval FROM approvals WHERE id = p_approval_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Freigabe nicht gefunden'); END IF;
  IF v_approval.status != 'PENDING' THEN RETURN jsonb_build_object('success', false, 'error', 'Status ist nicht PENDING'); END IF;
  IF v_approval.approval_type != 'MATERIAL_ORDER' THEN RETURN jsonb_build_object('success', false, 'error', 'Falscher Approval-Typ'); END IF;

  UPDATE approvals SET status = 'APPROVED', decided_at = now(), decided_by = 'app_gf',
    decision_channel = 'freigabecenter', feedback_category = 'approved_material', updated_at = now()
  WHERE id = p_approval_id;

  UPDATE project_material_needs SET status = 'ordered', updated_at = now()
  WHERE project_id = v_approval.project_id AND source = 'auto_plan' AND status = 'planned' AND problem IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  INSERT INTO events (event_type, project_id, source_system, source_flow, payload, reference_id, reference_table)
  VALUES ('MATERIAL_ORDER_APPROVED', v_approval.project_id, 'app', 'freigabecenter_approve',
    jsonb_build_object('approval_id', p_approval_id, 'needs_ordered', v_updated), p_approval_id, 'approvals');

  RETURN jsonb_build_object('success', true, 'needs_ordered', v_updated, 'approval_id', p_approval_id);
END;
$$;

-- 7. fn_approve_schedule
CREATE OR REPLACE FUNCTION fn_approve_schedule(p_approval_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_approval RECORD; v_result JSONB;
BEGIN
  SELECT * INTO v_approval FROM approvals WHERE id = p_approval_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Freigabe nicht gefunden'); END IF;
  IF v_approval.status != 'PENDING' THEN RETURN jsonb_build_object('success', false, 'error', 'Status ist nicht PENDING'); END IF;
  IF v_approval.approval_type != 'SCHEDULE' THEN RETURN jsonb_build_object('success', false, 'error', 'Falscher Approval-Typ'); END IF;

  SELECT confirm_proposed_phases(v_approval.project_id) INTO v_result;

  UPDATE approvals SET status = 'APPROVED', decided_at = now(), decided_by = 'app_gf',
    decision_channel = 'freigabecenter', feedback_category = 'approved_schedule', updated_at = now()
  WHERE id = p_approval_id;

  INSERT INTO events (event_type, project_id, source_system, source_flow, payload, reference_id, reference_table)
  VALUES ('SCHEDULE_APPROVED', v_approval.project_id, 'app', 'freigabecenter_approve',
    jsonb_build_object('approval_id', p_approval_id, 'confirm_result', v_result), p_approval_id, 'approvals');

  RETURN jsonb_build_object('success', true, 'approval_id', p_approval_id, 'confirm_result', v_result);
END;
$$;

-- 8. Grants
GRANT EXECUTE ON FUNCTION auto_plan_materials(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_plan_full(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION discard_material_plan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_approve_material_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_approve_schedule(UUID) TO authenticated;
