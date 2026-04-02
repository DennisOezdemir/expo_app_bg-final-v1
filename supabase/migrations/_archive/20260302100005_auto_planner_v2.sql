-- =============================================================
-- Migration: Auto-Planer V2 — trade_id statt Text-Matching
-- Ersetzt: auto_plan_project(), confirm/discard, fn_learn_schedule
-- =============================================================

-- =====================================================
-- Kern-Funktion: auto_plan_project() V2
-- Matcht Monteure per trade_id (deterministisch via trades-Tabelle)
-- =====================================================
CREATE OR REPLACE FUNCTION auto_plan_project(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project RECORD;
  v_trade RECORD;
  v_phase_order INT;
  v_duration INT;
  v_member_id UUID;
  v_member_name TEXT;
  v_start DATE;
  v_end DATE;
  v_total_days INT;
  v_phase_start DATE;
  v_phase_end DATE;
  v_phases_created INT := 0;
  v_assigned_count INT := 0;
  v_unassigned TEXT[] := '{}';
  v_assignments JSONB := '[]'::jsonb;
  v_busy_count INT;
  v_min_busy INT;
  v_best_member_id UUID;
  v_best_member_name TEXT;
  v_defaults RECORD;
  v_existing INT;
  v_phase_num INT := 0;
  v_day_offset INT := 0;
BEGIN
  -- 1. Projekt validieren
  SELECT id, planned_start, planned_end, status
  INTO v_project
  FROM projects
  WHERE id = p_project_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Projekt nicht gefunden');
  END IF;

  IF v_project.planned_start IS NULL OR v_project.planned_end IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Projekt hat kein Start-/Enddatum');
  END IF;

  -- 2. Idempotenz: keine doppelten Vorschläge
  SELECT COUNT(*) INTO v_existing
  FROM schedule_phases
  WHERE project_id = p_project_id AND status = 'proposed';

  IF v_existing > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vorschläge existieren bereits. Bitte erst freigeben oder verwerfen.');
  END IF;

  v_start := v_project.planned_start;
  v_end := v_project.planned_end;
  v_total_days := GREATEST((v_end - v_start) + 1, 1);

  -- 3. Offer-Positionen nach trade_id gruppieren (statt Text!)
  FOR v_trade IN
    SELECT
      t.id AS trade_id,
      t.name AS trade_name,
      COUNT(*) AS pos_count
    FROM offer_positions op
    JOIN offers o ON o.id = op.offer_id
    JOIN trades t ON t.id = op.trade_id
    WHERE o.project_id = p_project_id
      AND op.trade_id IS NOT NULL
    GROUP BY t.id, t.name
    ORDER BY t.sort_order
  LOOP
    v_phase_num := v_phase_num + 1;

    -- Defaults aus schedule_defaults (per trade_id)
    SELECT * INTO v_defaults
    FROM schedule_defaults
    WHERE trade_id = v_trade.trade_id;

    IF v_defaults IS NOT NULL AND v_defaults.default_phase_order < 99 THEN
      v_phase_order := v_defaults.default_phase_order;
    ELSE
      v_phase_order := v_phase_num;
    END IF;

    -- Dauer: gelernt oder geschätzt
    IF v_defaults IS NOT NULL AND v_defaults.avg_duration_days IS NOT NULL AND v_defaults.observation_count > 0 THEN
      v_duration := CEIL(v_defaults.avg_duration_days);
    ELSE
      v_duration := GREATEST(CEIL(v_total_days::numeric / GREATEST(v_phase_num, 3)), 3);
    END IF;

    v_phase_start := LEAST(v_start + v_day_offset, v_end);
    v_phase_end := LEAST(v_phase_start + v_duration - 1, v_end);
    v_day_offset := v_day_offset + v_duration;

    v_best_member_id := NULL;
    v_best_member_name := NULL;

    -- =====================================================
    -- Monteur-Matching: 3 Stufen
    -- =====================================================

    -- Stufe 1: Default-Monteur aus schedule_defaults
    IF v_defaults IS NOT NULL AND v_defaults.default_team_member_id IS NOT NULL THEN
      SELECT id, tm.name INTO v_member_id, v_member_name
      FROM team_members tm
      WHERE tm.id = v_defaults.default_team_member_id AND tm.active = true;

      IF FOUND THEN
        SELECT COUNT(*) INTO v_busy_count
        FROM schedule_phases sp
        WHERE sp.assigned_team_member_id = v_member_id
          AND sp.status != 'proposed'
          AND sp.start_date <= v_phase_end
          AND sp.end_date >= v_phase_start;

        IF v_busy_count = 0 THEN
          v_best_member_id := v_member_id;
          v_best_member_name := v_member_name;
        END IF;
      END IF;
    END IF;

    -- Stufe 2: Monteur per trade_id Match (deterministisch!)
    IF v_best_member_id IS NULL THEN
      v_min_busy := 999999;
      FOR v_member_id, v_member_name IN
        SELECT tm.id, tm.name
        FROM team_members tm
        WHERE tm.active = true
          AND tm.role NOT IN ('GF', 'Bauleiter', 'Bauleiterin', 'Polier')
          AND tm.trade_id = v_trade.trade_id
        ORDER BY tm.name
      LOOP
        SELECT COUNT(*) INTO v_busy_count
        FROM schedule_phases sp
        WHERE sp.assigned_team_member_id = v_member_id
          AND sp.status != 'proposed'
          AND sp.start_date <= v_phase_end
          AND sp.end_date >= v_phase_start;

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
        SELECT tm.id, tm.name
        FROM team_members tm
        WHERE tm.active = true
          AND tm.role NOT IN ('GF', 'Bauleiter', 'Bauleiterin', 'Polier')
          AND tm.trade_id IS NOT NULL
        ORDER BY tm.name
      LOOP
        SELECT COUNT(*) INTO v_busy_count
        FROM schedule_phases sp
        WHERE sp.assigned_team_member_id = v_member_id
          AND sp.status != 'proposed'
          AND sp.start_date <= v_phase_end
          AND sp.end_date >= v_phase_start;

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
      p_project_id, -v_phase_order, v_trade.trade_name, v_trade.trade_name, v_trade.trade_id,
      v_phase_start, v_phase_end, v_best_member_id,
      'proposed', 0, v_trade.pos_count
    )
    ON CONFLICT (project_id, phase_number) DO UPDATE SET
      name = EXCLUDED.name,
      trade = EXCLUDED.trade,
      trade_id = EXCLUDED.trade_id,
      start_date = EXCLUDED.start_date,
      end_date = EXCLUDED.end_date,
      assigned_team_member_id = EXCLUDED.assigned_team_member_id,
      status = 'proposed',
      estimated_qty = EXCLUDED.estimated_qty,
      updated_at = now();

    v_phases_created := v_phases_created + 1;

    IF v_best_member_id IS NOT NULL THEN
      v_assigned_count := v_assigned_count + 1;
      v_assignments := v_assignments || jsonb_build_object(
        'trade', v_trade.trade_name,
        'trade_id', v_trade.trade_id,
        'member_id', v_best_member_id,
        'member_name', v_best_member_name,
        'start_date', v_phase_start,
        'end_date', v_phase_end
      );
    ELSE
      v_unassigned := array_append(v_unassigned, v_trade.trade_name);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'phases_created', v_phases_created,
    'assigned_count', v_assigned_count,
    'unassigned_trades', to_jsonb(v_unassigned),
    'assignments', v_assignments
  );
END;
$$;

-- =====================================================
-- Lern-Trigger V2: mit trade_id
-- =====================================================
CREATE OR REPLACE FUNCTION fn_learn_schedule()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actual_days INT;
  v_trade_text TEXT;
  v_trade_uuid UUID;
  v_member_count INT;
BEGIN
  IF NEW.status NOT IN ('planned', 'in_progress', 'completed') THEN
    RETURN NEW;
  END IF;

  v_trade_text := NEW.trade;
  v_trade_uuid := NEW.trade_id;
  v_actual_days := (NEW.end_date - NEW.start_date) + 1;

  -- Lern-Eintrag upserten
  INSERT INTO schedule_learning (
    trade, trade_id, team_member_id, actual_duration_days, phase_number, project_id
  ) VALUES (
    v_trade_text, v_trade_uuid, NEW.assigned_team_member_id,
    v_actual_days, ABS(NEW.phase_number), NEW.project_id
  )
  ON CONFLICT (project_id, trade) DO UPDATE SET
    trade_id = EXCLUDED.trade_id,
    team_member_id = EXCLUDED.team_member_id,
    actual_duration_days = EXCLUDED.actual_duration_days,
    phase_number = EXCLUDED.phase_number,
    updated_at = now();

  -- Defaults aktualisieren (per trade_id wenn vorhanden)
  UPDATE schedule_defaults SET
    avg_duration_days = sub.avg_dur,
    observation_count = sub.cnt,
    default_phase_order = sub.avg_order,
    updated_at = now()
  FROM (
    SELECT
      sl.trade,
      ROUND(AVG(sl.actual_duration_days), 1) AS avg_dur,
      COUNT(*) AS cnt,
      ROUND(AVG(sl.phase_number)) AS avg_order
    FROM schedule_learning sl
    WHERE sl.trade = v_trade_text
    GROUP BY sl.trade
  ) sub
  WHERE schedule_defaults.trade = sub.trade;

  -- Monteur-Präferenz: nach 3x → Default setzen
  IF NEW.assigned_team_member_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_member_count
    FROM schedule_learning
    WHERE trade = v_trade_text
      AND team_member_id = NEW.assigned_team_member_id;

    IF v_member_count >= 3 THEN
      UPDATE schedule_defaults
      SET default_team_member_id = NEW.assigned_team_member_id,
          updated_at = now()
      WHERE trade = v_trade_text;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
