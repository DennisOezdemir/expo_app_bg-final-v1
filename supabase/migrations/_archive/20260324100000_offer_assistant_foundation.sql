-- ============================================================================
-- BG Offer Assistant Foundation
-- ============================================================================
-- Generischer Agent-Kern fuer dialogbasierte KI-Assistenten:
-- - agent_threads: Conversation-Container
-- - agent_messages: Strukturierte Nachrichten mit Positions-Bezug
-- - agent_observations: Append-only Trainings-Log
-- - memory_entries: Scoped Memory (global/tenant/user/project/session)
-- - llm_providers: DB-konfigurierbarer LLM Provider-Switch
-- ============================================================================

-- ==========================================================================
-- 0. Event Types erweitern
-- ==========================================================================
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'OFFER_LONGTEXT_SESSION_STARTED';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'OFFER_LONGTEXT_BATCH_COMPLETED';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'OFFER_LONGTEXT_APPROVED';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'OFFER_LONGTEXT_LEARNING_COMPLETED';

-- ==========================================================================
-- 1. agent_threads — Generischer Conversation-Container
-- ==========================================================================
CREATE TABLE IF NOT EXISTS agent_threads (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_type       TEXT NOT NULL CHECK (thread_type IN (
                          'offer_longtext', 'email_draft', 'protocol', 'change_order'
                      )),
    project_id        UUID REFERENCES projects(id) ON DELETE CASCADE,
    offer_id          UUID REFERENCES offers(id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES auth.users(id),
    status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
                          'active', 'completed', 'archived'
                      )),
    context_snapshot  JSONB,
    positions_total   INT DEFAULT 0,
    positions_completed INT DEFAULT 0,
    metadata          JSONB DEFAULT '{}'::jsonb,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_threads_offer ON agent_threads(offer_id) WHERE offer_id IS NOT NULL;
CREATE INDEX idx_agent_threads_user ON agent_threads(user_id, created_at DESC);

COMMENT ON TABLE agent_threads IS 'Generischer Conversation-Container fuer KI-Assistenten (Langtexte, E-Mails, Protokolle)';

-- ==========================================================================
-- 2. agent_messages — Strukturierte Nachrichten
-- ==========================================================================
CREATE TABLE IF NOT EXISTS agent_messages (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id         UUID NOT NULL REFERENCES agent_threads(id) ON DELETE CASCADE,
    role              TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content           TEXT NOT NULL DEFAULT '',
    -- Positions-Bezug (fuer Offer-Langtext-Modus)
    position_id       UUID REFERENCES offer_positions(id),
    action            TEXT CHECK (action IN (
                          'propose', 'approve', 'edit', 'reject', 'commit', 'batch_propose'
                      )),
    proposed_text     TEXT,
    final_text        TEXT,
    quality_score     NUMERIC(3,2) CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 1)),
    -- LLM Metadata
    model_used        TEXT,
    tokens_in         INT,
    tokens_out        INT,
    latency_ms        INT,
    metadata          JSONB DEFAULT '{}'::jsonb,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_messages_thread ON agent_messages(thread_id, created_at);
CREATE INDEX idx_agent_messages_position ON agent_messages(position_id) WHERE position_id IS NOT NULL;

COMMENT ON TABLE agent_messages IS 'Strukturierte Agent-Nachrichten mit optionalem Positions-Bezug und Quality-Score';

-- ==========================================================================
-- 3. agent_observations — Append-only Trainings-Log
-- ==========================================================================
CREATE TABLE IF NOT EXISTS agent_observations (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id         UUID NOT NULL REFERENCES agent_threads(id) ON DELETE CASCADE,
    position_id       UUID REFERENCES offer_positions(id),
    catalog_code      TEXT,
    trade             TEXT,
    observation_type  TEXT NOT NULL CHECK (observation_type IN (
                          'text_approved', 'text_edited', 'text_rejected',
                          'style_preference', 'term_correction'
                      )),
    proposed_text     TEXT,
    final_text        TEXT,
    edit_distance     INT,
    quality_score     NUMERIC(3,2),
    payload           JSONB DEFAULT '{}'::jsonb,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_observations_thread ON agent_observations(thread_id, created_at);
CREATE INDEX idx_agent_observations_catalog ON agent_observations(catalog_code) WHERE catalog_code IS NOT NULL;
CREATE INDEX idx_agent_observations_trade ON agent_observations(trade) WHERE trade IS NOT NULL;

COMMENT ON TABLE agent_observations IS 'Append-only Trainings-Log: jede Zeile = ein Trainingspaar (proposed vs final)';

-- ==========================================================================
-- 4. memory_entries — Scoped Memory
-- ==========================================================================
CREATE TABLE IF NOT EXISTS memory_entries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope               TEXT NOT NULL CHECK (scope IN (
                            'global', 'tenant', 'user', 'project', 'session'
                        )),
    scope_id            TEXT,
    memory_type         TEXT NOT NULL CHECK (memory_type IN (
                            'style_rule', 'term_preference', 'template_fragment',
                            'few_shot_example', 'correction_pattern', 'condensed_summary'
                        )),
    key                 TEXT NOT NULL,
    value               TEXT NOT NULL,
    trade               TEXT,
    confidence          NUMERIC(3,2) NOT NULL DEFAULT 0.50
                            CHECK (confidence >= 0 AND confidence <= 1),
    observation_count   INT NOT NULL DEFAULT 0,
    source              TEXT NOT NULL DEFAULT 'manual' CHECK (source IN (
                            'manual', 'auto_extracted', 'godmode', 'condensed'
                        )),
    expires_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_memory_scope ON memory_entries(scope, scope_id);
CREATE INDEX idx_memory_trade ON memory_entries(trade) WHERE trade IS NOT NULL;
CREATE INDEX idx_memory_type ON memory_entries(memory_type);

COMMENT ON TABLE memory_entries IS 'Hierarchisches Memory-System: global > tenant > user > project > session';

-- ==========================================================================
-- 5. llm_providers — DB-konfigurierbarer Provider-Switch
-- ==========================================================================
CREATE TABLE IF NOT EXISTS llm_providers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL UNIQUE,
    provider            TEXT NOT NULL CHECK (provider IN ('anthropic', 'google', 'openai', 'local')),
    model_id            TEXT NOT NULL,
    endpoint_url        TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    priority            INT NOT NULL DEFAULT 10,
    capabilities        TEXT[] NOT NULL DEFAULT '{}',
    max_tokens          INT NOT NULL DEFAULT 4096,
    cost_per_1k_input   NUMERIC(8,6) DEFAULT 0,
    cost_per_1k_output  NUMERIC(8,6) DEFAULT 0,
    config              JSONB DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE llm_providers IS 'LLM Provider-Konfiguration: priority steuert Failover-Reihenfolge, capabilities filtern nach Aufgabe';

-- Seed: Standard-Provider
INSERT INTO llm_providers (name, provider, model_id, is_active, priority, capabilities, max_tokens, cost_per_1k_input, cost_per_1k_output)
VALUES
    ('claude-sonnet', 'anthropic', 'claude-sonnet-4-6', true, 1,
     ARRAY['text', 'vision', 'tool_use', 'long_context'], 8192, 0.003, 0.015),
    ('gemini-flash', 'google', 'gemini-2.5-flash', true, 5,
     ARRAY['text', 'tool_use'], 8192, 0.000075, 0.0003),
    ('qwen-local', 'local', 'qwen2.5:72b', false, 10,
     ARRAY['text', 'tool_use'], 4096, 0, 0)
ON CONFLICT (name) DO NOTHING;

-- ==========================================================================
-- 6. offer_positions: Staging-Felder fuer Review-Workflow
-- ==========================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'offer_positions' AND column_name = 'staged_long_text'
    ) THEN
        ALTER TABLE offer_positions
            ADD COLUMN staged_long_text TEXT,
            ADD COLUMN staged_at TIMESTAMPTZ,
            ADD COLUMN staged_by UUID REFERENCES auth.users(id);
        COMMENT ON COLUMN offer_positions.staged_long_text IS 'KI-Vorschlag: wird erst nach Freigabe zu long_text';
    END IF;
END $$;

-- ==========================================================================
-- 7. Fix: chat_messages project_id Drift (Migration sagt NOT NULL, Runtime erlaubt NULL)
-- ==========================================================================
ALTER TABLE chat_messages ALTER COLUMN project_id DROP NOT NULL;

-- ==========================================================================
-- 8. DB-Funktion: fn_get_offer_assistant_context(offer_id)
-- ==========================================================================
CREATE OR REPLACE FUNCTION fn_get_offer_assistant_context(p_offer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'offer', jsonb_build_object(
            'id', o.id,
            'offer_number', o.offer_number,
            'status', o.status,
            'total_net', o.total_net,
            'total_gross', o.total_gross
        ),
        'project', jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'project_number', p.project_number,
            'object_street', p.object_street,
            'object_zip', p.object_zip,
            'object_city', p.object_city
        ),
        'client', jsonb_build_object(
            'company_name', c.company_name,
            'salutation', c.salutation,
            'first_name', c.first_name,
            'last_name', c.last_name
        ),
        'sections', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', s.id,
                    'section_number', s.section_number,
                    'title', s.title,
                    'trade', s.trade,
                    'positions', COALESCE((
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'id', pos.id,
                                'position_number', pos.position_number,
                                'title', pos.title,
                                'description', pos.description,
                                'long_text', pos.long_text,
                                'staged_long_text', pos.staged_long_text,
                                'unit', pos.unit,
                                'unit_price', pos.unit_price,
                                'quantity', pos.quantity,
                                'catalog_code', pos.catalog_code,
                                'sort_order', pos.sort_order
                            ) ORDER BY pos.sort_order
                        )
                        FROM offer_positions pos
                        WHERE pos.section_id = s.id
                          AND pos.deleted_at IS NULL
                    ), '[]'::jsonb)
                ) ORDER BY s.section_number
            )
            FROM offer_sections s
            WHERE s.offer_id = o.id
        ), '[]'::jsonb)
    ) INTO v_result
    FROM offers o
    LEFT JOIN projects p ON p.id = o.project_id
    LEFT JOIN clients c ON c.id = p.client_id
    WHERE o.id = p_offer_id
      AND o.deleted_at IS NULL;

    RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

COMMENT ON FUNCTION fn_get_offer_assistant_context IS 'Liefert kompletten Angebots-Kontext als JSONB fuer den Offer Assistant';

-- ==========================================================================
-- 9. DB-Funktion: fn_commit_staged_longtext(position_id, user_id)
-- ==========================================================================
CREATE OR REPLACE FUNCTION fn_commit_staged_longtext(p_position_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_pos RECORD;
    v_offer_id UUID;
BEGIN
    -- Position laden
    SELECT id, offer_id, title, long_text, staged_long_text
    INTO v_pos
    FROM offer_positions
    WHERE id = p_position_id AND deleted_at IS NULL;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Position not found');
    END IF;

    IF v_pos.staged_long_text IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No staged text to commit');
    END IF;

    -- Staged -> Long Text uebernehmen
    UPDATE offer_positions
    SET long_text = staged_long_text,
        staged_long_text = NULL,
        staged_at = NULL,
        staged_by = NULL,
        updated_at = now()
    WHERE id = p_position_id;

    -- Audit-Trail in offer_history (falls Tabelle existiert)
    BEGIN
        INSERT INTO offer_history (offer_id, changed_by, change_type, changes)
        VALUES (
            v_pos.offer_id,
            p_user_id,
            'longtext_committed',
            jsonb_build_object(
                'position_id', p_position_id,
                'position_title', v_pos.title,
                'old_long_text', v_pos.long_text,
                'new_long_text', v_pos.staged_long_text
            )
        );
    EXCEPTION WHEN undefined_table THEN
        -- offer_history existiert nicht, kein Problem
        NULL;
    END;

    RETURN jsonb_build_object(
        'success', true,
        'position_id', p_position_id,
        'committed_text', v_pos.staged_long_text
    );
END;
$$;

COMMENT ON FUNCTION fn_commit_staged_longtext IS 'Uebernimmt staged_long_text in long_text mit Audit-Trail';

-- ==========================================================================
-- 10. RLS Policies
-- ==========================================================================
ALTER TABLE agent_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_providers ENABLE ROW LEVEL SECURITY;

-- agent_threads: Eigene Threads
CREATE POLICY "at_select" ON agent_threads
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());
CREATE POLICY "at_insert" ON agent_threads
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "at_update" ON agent_threads
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());
CREATE POLICY "at_service" ON agent_threads
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- agent_messages: Ueber Thread-Ownership
CREATE POLICY "am_select" ON agent_messages
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM agent_threads t
        WHERE t.id = thread_id
          AND t.user_id = auth.uid()
    ));
CREATE POLICY "am_insert" ON agent_messages
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM agent_threads t
        WHERE t.id = thread_id AND t.user_id = auth.uid()
    ));
CREATE POLICY "am_service" ON agent_messages
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- agent_observations: Append-only (SELECT + INSERT, kein UPDATE/DELETE)
CREATE POLICY "ao_select" ON agent_observations
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM agent_threads t
        WHERE t.id = thread_id
          AND t.user_id = auth.uid()
    ));
CREATE POLICY "ao_insert" ON agent_observations
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM agent_threads t
        WHERE t.id = thread_id AND t.user_id = auth.uid()
    ));
CREATE POLICY "ao_service" ON agent_observations
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);
-- Kein UPDATE/DELETE Policy = append-only fuer authenticated users

-- memory_entries: Lesen fuer alle, Schreiben nur service_role
CREATE POLICY "me_select" ON memory_entries
    FOR SELECT TO authenticated
    USING (true);
CREATE POLICY "me_service" ON memory_entries
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- llm_providers: Lesen fuer alle, Mutation nur Admin
CREATE POLICY "lp_select" ON llm_providers
    FOR SELECT TO authenticated
    USING (true);
CREATE POLICY "lp_admin" ON llm_providers
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ==========================================================================
-- 11. Realtime fuer agent_messages
-- ==========================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE agent_messages;

-- ==========================================================================
-- 12. Grants
-- ==========================================================================
GRANT SELECT, INSERT, UPDATE ON agent_threads TO authenticated;
GRANT SELECT, INSERT ON agent_messages TO authenticated;
GRANT SELECT, INSERT ON agent_observations TO authenticated;
GRANT SELECT ON memory_entries TO authenticated;
GRANT SELECT ON llm_providers TO authenticated;

GRANT ALL ON agent_threads TO service_role;
GRANT ALL ON agent_messages TO service_role;
GRANT ALL ON agent_observations TO service_role;
GRANT ALL ON memory_entries TO service_role;
GRANT ALL ON llm_providers TO service_role;

GRANT EXECUTE ON FUNCTION fn_get_offer_assistant_context TO authenticated;
GRANT EXECUTE ON FUNCTION fn_commit_staged_longtext TO authenticated;
