-- =============================================================
-- Migration: Auto-Planner (Monteur-Zuordnung + Lernsystem)
-- =============================================================

-- 1a. schedule_phases.status: 'proposed' hinzufügen
ALTER TABLE schedule_phases DROP CONSTRAINT IF EXISTS schedule_phases_status_check;
ALTER TABLE schedule_phases ADD CONSTRAINT schedule_phases_status_check
  CHECK (status = ANY (ARRAY['planned','in_progress','completed','delayed','blocked','proposed']));

-- 1b. event_type Enum erweitern
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'SCHEDULE_PROPOSED';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'SCHEDULE_CONFIRMED';

-- 1c. Lern-Tabelle: Rohdaten pro Gewerk pro Projekt
CREATE TABLE IF NOT EXISTS schedule_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade TEXT NOT NULL,
  team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  proposed_duration_days INT,
  actual_duration_days INT,
  phase_number INT,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, trade)
);

-- 1d. Aggregierte Defaults (1 Zeile pro Gewerk)
CREATE TABLE IF NOT EXISTS schedule_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade TEXT NOT NULL UNIQUE,
  default_team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  avg_duration_days NUMERIC(5,1) DEFAULT 5,
  default_phase_order INT NOT NULL DEFAULT 99,
  observation_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed mit Standardwerten
INSERT INTO schedule_defaults (trade, default_phase_order) VALUES
  ('Trockenbau', 1),
  ('Sanitär',    2),
  ('Elektro',    3),
  ('Fliesen',    4),
  ('Maler',      5),
  ('Sonstiges',  6)
ON CONFLICT (trade) DO NOTHING;

-- 1e. Kern-Funktion: auto_plan_project
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

  -- 2. Idempotenz: proposed Phasen bereits vorhanden?
  SELECT COUNT(*) INTO v_existing
  FROM schedule_phases
  WHERE project_id = p_project_id AND status = 'proposed';

  IF v_existing > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vorschläge existieren bereits. Bitte erst freigeben oder verwerfen.');
  END IF;

  v_start := v_project.planned_start;
  v_end := v_project.planned_end;
  v_total_days := GREATEST((v_end - v_start) + 1, 1);

  -- 3. Offer-Positionen nach Gewerk gruppieren
  FOR v_trade IN
    SELECT op.trade::text AS trade_name, COUNT(*) AS pos_count
    FROM offer_positions op
    JOIN offers o ON o.id = op.offer_id
    WHERE o.project_id = p_project_id
      AND op.trade IS NOT NULL
    GROUP BY op.trade
    ORDER BY op.trade
  LOOP
    v_phase_num := v_phase_num + 1;

    -- Defaults laden
    SELECT * INTO v_defaults
    FROM schedule_defaults
    WHERE trade = v_trade.trade_name;

    -- Phase-Reihenfolge bestimmen
    IF v_defaults IS NOT NULL AND v_defaults.default_phase_order < 99 THEN
      v_phase_order := v_defaults.default_phase_order;
    ELSE
      v_phase_order := v_phase_num;
    END IF;

    -- Dauer bestimmen
    IF v_defaults IS NOT NULL AND v_defaults.avg_duration_days IS NOT NULL AND v_defaults.observation_count > 0 THEN
      v_duration := CEIL(v_defaults.avg_duration_days);
    ELSE
      -- Fallback: Projektdauer / Anzahl Gewerke, mindestens 3 Tage
      v_duration := GREATEST(CEIL(v_total_days::numeric / GREATEST(v_phase_num, 3)), 3);
    END IF;

    -- Phase-Daten berechnen (sequenziell)
    v_phase_start := v_start + v_day_offset;
    v_phase_end := LEAST(v_phase_start + v_duration - 1, v_end);
    v_day_offset := v_day_offset + v_duration;

    -- Monteur suchen
    v_best_member_id := NULL;
    v_best_member_name := NULL;

    -- Erst Default prüfen
    IF v_defaults IS NOT NULL AND v_defaults.default_team_member_id IS NOT NULL THEN
      SELECT id, name INTO v_member_id, v_member_name
      FROM team_members
      WHERE id = v_defaults.default_team_member_id AND active = true;

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

    -- Falls kein Default: bester verfügbarer Monteur mit passendem Gewerk
    IF v_best_member_id IS NULL THEN
      v_min_busy := 999999;
      FOR v_member_id, v_member_name IN
        SELECT tm.id, tm.name
        FROM team_members tm
        WHERE tm.active = true
          AND tm.role = 'Monteur'
          AND (tm.gewerk = v_trade.trade_name OR tm.gewerk IS NULL)
        ORDER BY
          CASE WHEN tm.gewerk = v_trade.trade_name THEN 0 ELSE 1 END,
          tm.name
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

    -- Phase einfügen (negative phase_numbers für proposed)
    INSERT INTO schedule_phases (
      project_id, phase_number, name, trade, start_date, end_date,
      assigned_team_member_id, status, progress, estimated_qty
    ) VALUES (
      p_project_id, -v_phase_order, v_trade.trade_name, v_trade.trade_name,
      v_phase_start, v_phase_end, v_best_member_id, 'proposed', 0,
      v_trade.pos_count
    )
    ON CONFLICT (project_id, phase_number) DO UPDATE SET
      name = EXCLUDED.name,
      trade = EXCLUDED.trade,
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

-- 1f. Helper: Vorschläge freigeben
CREATE OR REPLACE FUNCTION confirm_proposed_phases(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE schedule_phases
  SET
    status = 'planned',
    phase_number = ABS(phase_number),
    updated_at = now()
  WHERE project_id = p_project_id
    AND status = 'proposed';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Keine Vorschläge zum Freigeben gefunden');
  END IF;

  RETURN jsonb_build_object('success', true, 'confirmed_count', v_count);
END;
$$;

-- 1g. Helper: Vorschläge verwerfen
CREATE OR REPLACE FUNCTION discard_proposed_phases(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  DELETE FROM schedule_phases
  WHERE project_id = p_project_id
    AND status = 'proposed';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'discarded_count', v_count);
END;
$$;

-- 1h. Lern-Trigger
CREATE OR REPLACE FUNCTION fn_learn_schedule()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actual_days INT;
  v_trade_text TEXT;
  v_member_count INT;
BEGIN
  IF NEW.status NOT IN ('planned', 'in_progress', 'completed') THEN
    RETURN NEW;
  END IF;

  v_trade_text := NEW.trade;
  v_actual_days := (NEW.end_date - NEW.start_date) + 1;

  -- Lern-Eintrag upserten
  INSERT INTO schedule_learning (
    trade, team_member_id, actual_duration_days, phase_number, project_id
  ) VALUES (
    v_trade_text, NEW.assigned_team_member_id, v_actual_days, ABS(NEW.phase_number), NEW.project_id
  )
  ON CONFLICT (project_id, trade) DO UPDATE SET
    team_member_id = EXCLUDED.team_member_id,
    actual_duration_days = EXCLUDED.actual_duration_days,
    phase_number = EXCLUDED.phase_number,
    updated_at = now();

  -- Defaults aktualisieren
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

  -- Monteur-Präferenz: Nach 3x → Default setzen
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

DROP TRIGGER IF EXISTS trg_learn_schedule ON schedule_phases;
CREATE TRIGGER trg_learn_schedule
  AFTER UPDATE OF assigned_team_member_id, start_date, end_date, status
  ON schedule_phases
  FOR EACH ROW
  EXECUTE FUNCTION fn_learn_schedule();

-- 1i. Performance-Indexes
CREATE INDEX IF NOT EXISTS idx_schedule_phases_member_dates
  ON schedule_phases (assigned_team_member_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_schedule_learning_trade_member
  ON schedule_learning (trade, team_member_id);
CREATE INDEX IF NOT EXISTS idx_schedule_phases_status
  ON schedule_phases (status);

-- 1j. RLS
ALTER TABLE schedule_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedule_learning_select" ON schedule_learning FOR SELECT USING (true);
CREATE POLICY "schedule_learning_all"    ON schedule_learning FOR ALL USING (true);
CREATE POLICY "schedule_defaults_select" ON schedule_defaults FOR SELECT USING (true);
CREATE POLICY "schedule_defaults_all"    ON schedule_defaults FOR ALL USING (true);
