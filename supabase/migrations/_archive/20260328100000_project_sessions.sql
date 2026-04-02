-- ============================================================================
-- Project Sessions — Tracking wann User in welchem Projekt arbeiten
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id),
    team_member_id  UUID REFERENCES team_members(id),
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at        TIMESTAMPTZ,
    device_info     JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_sessions_active
    ON project_sessions(project_id, user_id)
    WHERE ended_at IS NULL;

CREATE INDEX idx_project_sessions_user
    ON project_sessions(user_id, started_at DESC);

-- ── RPC: Session starten ──
CREATE OR REPLACE FUNCTION fn_start_project_session(
    p_project_id UUID,
    p_user_id UUID,
    p_device_info JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_session_id UUID;
    v_team_member_id UUID;
BEGIN
    -- Offene Sessions fuer diesen User in diesem Projekt schliessen
    UPDATE project_sessions
    SET ended_at = now()
    WHERE project_id = p_project_id
      AND user_id = p_user_id
      AND ended_at IS NULL;

    -- Team-Member-ID ermitteln
    SELECT id INTO v_team_member_id
    FROM team_members
    WHERE auth_id = p_user_id
    LIMIT 1;

    -- Neue Session starten
    INSERT INTO project_sessions (project_id, user_id, team_member_id, device_info)
    VALUES (p_project_id, p_user_id, v_team_member_id, p_device_info)
    RETURNING id INTO v_session_id;

    RETURN v_session_id;
END;
$$;

-- ── RPC: Session beenden ──
CREATE OR REPLACE FUNCTION fn_end_project_session(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE project_sessions
    SET ended_at = now()
    WHERE id = p_session_id
      AND ended_at IS NULL;
END;
$$;

-- ── RLS ──
ALTER TABLE project_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ps_select" ON project_sessions
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());
CREATE POLICY "ps_insert" ON project_sessions
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "ps_service" ON project_sessions
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON project_sessions TO authenticated;
GRANT ALL ON project_sessions TO service_role;
GRANT EXECUTE ON FUNCTION fn_start_project_session TO authenticated;
GRANT EXECUTE ON FUNCTION fn_end_project_session TO authenticated;
