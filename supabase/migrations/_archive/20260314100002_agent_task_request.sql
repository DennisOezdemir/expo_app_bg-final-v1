-- ============================================================================
-- Migration: Agent Task Request Helper
-- Vereinfacht das Erstellen von AGENT_TASK_REQUESTED Events
-- Jeder Teil des Systems kann damit einen Agent-Task dispatchen
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_request_agent_task(
    p_agent_function TEXT,
    p_agent_input JSONB,
    p_project_id UUID DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_event_id UUID;
    v_valid_functions TEXT[] := ARRAY[
        'lookup-catalog', 'create-offer', 'run-autoplan',
        'parse-lv', 'calculate-offer', 'generate-pdf', 'run-godmode'
    ];
BEGIN
    -- Validierung
    IF p_agent_function IS NULL OR p_agent_function = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'agent_function ist erforderlich');
    END IF;

    IF NOT (p_agent_function = ANY(v_valid_functions)) THEN
        RETURN jsonb_build_object('success', false, 'error',
            'Unbekannte Funktion: ' || p_agent_function || '. Erlaubt: ' || array_to_string(v_valid_functions, ', '));
    END IF;

    -- Event erstellen
    INSERT INTO events (
        event_type,
        project_id,
        source_system,
        source_flow,
        payload,
        idempotency_key
    ) VALUES (
        'AGENT_TASK_REQUESTED',
        p_project_id,
        'db',
        'fn_request_agent_task',
        jsonb_build_object(
            'agent_function', p_agent_function,
            'agent_input', p_agent_input,
            'requested_at', now()
        ),
        p_idempotency_key
    )
    RETURNING id INTO v_event_id;

    RETURN jsonb_build_object(
        'success', true,
        'event_id', v_event_id,
        'agent_function', p_agent_function,
        'message', 'Agent-Task wurde angefordert. Wird vom Dispatcher verarbeitet.'
    );
EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'error', 'Task mit diesem Idempotency-Key existiert bereits');
END;
$$;

GRANT EXECUTE ON FUNCTION fn_request_agent_task(TEXT, JSONB, UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION fn_request_agent_task IS 'Erstellt einen AGENT_TASK_REQUESTED Event. MX_01 Agent Dispatcher verarbeitet diese.';
