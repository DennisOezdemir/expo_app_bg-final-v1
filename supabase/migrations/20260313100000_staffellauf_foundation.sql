-- ============================================================================
-- Migration: Staffellauf Foundation
-- Neue Tabellen für die Agent-Pipeline Autoplanung
-- richtzeitwerte: Wissensbasis für Realzeiten pro Katalogposition
-- pipeline_runs: Ein Lauf pro Planung
-- pipeline_steps: Ein Schritt pro Agent
-- ============================================================================

-- ===========================================
-- 1. richtzeitwerte — Anker für Zeitberechnung
-- ===========================================
CREATE TABLE IF NOT EXISTS richtzeitwerte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalog_position_nr TEXT NOT NULL,
    catalog_id UUID REFERENCES catalogs(id),
    trade_id UUID REFERENCES trades(id),
    labor_minutes_per_unit NUMERIC(8,2) NOT NULL,
    unit TEXT NOT NULL DEFAULT 'Stk',
    material_cost_per_unit NUMERIC(10,2) DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'manual'
        CHECK (source IN ('manual', 'godmode', 'ai_estimate')),
    confidence NUMERIC(3,2) NOT NULL DEFAULT 0.5
        CHECK (confidence >= 0 AND confidence <= 1),
    observation_count INT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (catalog_position_nr, catalog_id)
);

COMMENT ON TABLE richtzeitwerte IS 'Wissensbasis: Wie lange dauert eine Katalogposition wirklich auf der Baustelle?';
COMMENT ON COLUMN richtzeitwerte.labor_minutes_per_unit IS 'DER ANKER — Minuten pro Einheit (z.B. 3.0 für Thermostatkopf)';
COMMENT ON COLUMN richtzeitwerte.confidence IS '0.0 = Schätzung, 1.0 = basiert auf vielen Beobachtungen';
COMMENT ON COLUMN richtzeitwerte.source IS 'manual = vom User, godmode = vom Lernagenten, ai_estimate = Claude-Schätzung';

-- Indexes
CREATE INDEX idx_rzw_catalog_pos ON richtzeitwerte(catalog_position_nr);
CREATE INDEX idx_rzw_trade ON richtzeitwerte(trade_id);
CREATE INDEX idx_rzw_catalog ON richtzeitwerte(catalog_id);

-- ===========================================
-- 2. pipeline_runs — Ein Lauf pro Planung
-- ===========================================
CREATE TYPE pipeline_run_status AS ENUM (
    'running', 'completed', 'stopped', 'failed'
);

CREATE TABLE IF NOT EXISTS pipeline_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status pipeline_run_status NOT NULL DEFAULT 'running',
    current_agent TEXT,
    agents_completed TEXT[] DEFAULT '{}',
    stopped_by_agent TEXT,
    stop_reason TEXT,
    -- Approval-IDs die aus diesem Lauf entstanden sind
    approval_schedule_id UUID REFERENCES approvals(id),
    approval_material_id UUID REFERENCES approvals(id),
    -- Ergebnis-Zusammenfassung
    result_summary JSONB,
    -- Timing
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE pipeline_runs IS 'Staffellauf: Ein Lauf der gesamten Autoplanungs-Pipeline';
COMMENT ON COLUMN pipeline_runs.current_agent IS 'Welcher Agent hat gerade den Stab?';
COMMENT ON COLUMN pipeline_runs.agents_completed IS 'Welche Agenten haben ihren Lauf beendet?';
COMMENT ON COLUMN pipeline_runs.stopped_by_agent IS 'Welcher Agent hat STOP gesagt?';

-- Indexes
CREATE INDEX idx_pr_project ON pipeline_runs(project_id);
CREATE INDEX idx_pr_status ON pipeline_runs(status);


-- ===========================================
-- 3. pipeline_steps — Ein Schritt pro Agent
-- ===========================================
CREATE TYPE pipeline_step_status AS ENUM (
    'running', 'completed', 'stopped', 'failed', 'skipped'
);

CREATE TABLE IF NOT EXISTS pipeline_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    step_order INT NOT NULL,
    status pipeline_step_status NOT NULL DEFAULT 'running',
    input_data JSONB,
    output_data JSONB,
    warnings TEXT[] DEFAULT '{}',
    errors TEXT[] DEFAULT '{}',
    duration_ms INT,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE pipeline_steps IS 'Staffellauf: Einzelner Agent-Schritt innerhalb eines Pipeline-Laufs';
COMMENT ON COLUMN pipeline_steps.input_data IS 'Was hat der Agent als Stab bekommen?';
COMMENT ON COLUMN pipeline_steps.output_data IS 'Was gibt der Agent weiter?';

-- Indexes
CREATE INDEX idx_ps_run ON pipeline_steps(run_id);
CREATE INDEX idx_ps_agent ON pipeline_steps(agent_name);
CREATE INDEX idx_ps_run_order ON pipeline_steps(run_id, step_order);

-- ===========================================
-- 4. RLS Policies
-- ===========================================
ALTER TABLE richtzeitwerte ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_steps ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all
CREATE POLICY "richtzeitwerte_select" ON richtzeitwerte
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "richtzeitwerte_all_service" ON richtzeitwerte
    FOR ALL TO service_role USING (true);

CREATE POLICY "pipeline_runs_select" ON pipeline_runs
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "pipeline_runs_all_service" ON pipeline_runs
    FOR ALL TO service_role USING (true);

CREATE POLICY "pipeline_steps_select" ON pipeline_steps
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "pipeline_steps_all_service" ON pipeline_steps
    FOR ALL TO service_role USING (true);

-- ===========================================
-- 5. Helper: Pipeline starten
-- ===========================================
CREATE OR REPLACE FUNCTION fn_pipeline_start(
    p_project_id UUID
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_run_id UUID;
    v_existing UUID;
BEGIN
    -- Idempotenz: Prüfe ob bereits ein Lauf aktiv ist
    SELECT id INTO v_existing
    FROM pipeline_runs
    WHERE project_id = p_project_id AND status = 'running'
    LIMIT 1;

    IF v_existing IS NOT NULL THEN
        RAISE EXCEPTION 'Pipeline läuft bereits für Projekt % (run_id: %)', p_project_id, v_existing;
    END IF;

    INSERT INTO pipeline_runs (project_id, status, current_agent)
    VALUES (p_project_id, 'running', 'plausibility')
    RETURNING id INTO v_run_id;

    RETURN v_run_id;
END;
$$;

-- ===========================================
-- 6. Helper: Pipeline-Step loggen
-- ===========================================
CREATE OR REPLACE FUNCTION fn_pipeline_step_start(
    p_run_id UUID,
    p_agent_name TEXT,
    p_step_order INT,
    p_input JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_step_id UUID;
BEGIN
    INSERT INTO pipeline_steps (run_id, agent_name, step_order, status, input_data)
    VALUES (p_run_id, p_agent_name, p_step_order, 'running', p_input)
    RETURNING id INTO v_step_id;

    -- Pipeline-Run updaten
    UPDATE pipeline_runs
    SET current_agent = p_agent_name, updated_at = now()
    WHERE id = p_run_id;

    RETURN v_step_id;
END;
$$;

CREATE OR REPLACE FUNCTION fn_pipeline_step_complete(
    p_step_id UUID,
    p_output JSONB,
    p_status pipeline_step_status DEFAULT 'completed',
    p_warnings TEXT[] DEFAULT '{}',
    p_errors TEXT[] DEFAULT '{}'
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_run_id UUID;
    v_agent TEXT;
    v_start TIMESTAMPTZ;
BEGIN
    -- Step abschließen
    SELECT run_id, agent_name, started_at INTO v_run_id, v_agent, v_start
    FROM pipeline_steps WHERE id = p_step_id;

    UPDATE pipeline_steps
    SET status = p_status,
        output_data = p_output,
        warnings = p_warnings,
        errors = p_errors,
        duration_ms = EXTRACT(EPOCH FROM (now() - v_start)) * 1000,
        completed_at = now()
    WHERE id = p_step_id;

    -- Pipeline-Run updaten
    IF p_status = 'completed' THEN
        UPDATE pipeline_runs
        SET agents_completed = array_append(agents_completed, v_agent)
        WHERE id = v_run_id;
    ELSIF p_status = 'stopped' THEN
        UPDATE pipeline_runs
        SET status = 'stopped',
            stopped_by_agent = v_agent,
            stop_reason = p_output->>'stop_reason',
            completed_at = now()
        WHERE id = v_run_id;
    ELSIF p_status = 'failed' THEN
        UPDATE pipeline_runs
        SET status = 'failed',
            stopped_by_agent = v_agent,
            stop_reason = COALESCE(p_errors[1], 'Unknown error'),
            completed_at = now()
        WHERE id = v_run_id;
    END IF;
END;
$$;

-- ===========================================
-- 7. Helper: Pipeline abschließen
-- ===========================================
CREATE OR REPLACE FUNCTION fn_pipeline_complete(
    p_run_id UUID,
    p_result_summary JSONB DEFAULT '{}'
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE pipeline_runs
    SET status = 'completed',
        current_agent = NULL,
        result_summary = p_result_summary,
        completed_at = now()
    WHERE id = p_run_id AND status = 'running';
END;
$$;
