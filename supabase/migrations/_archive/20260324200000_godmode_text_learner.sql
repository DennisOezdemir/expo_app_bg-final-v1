-- ============================================================================
-- Godmode Text Learner
-- ============================================================================
-- Lernt aus abgeschlossenen Offer-Langtext-Sessions:
-- approved/edited/rejected Ratio → memory_entries
-- Term-Korrekturen → term_preference
-- Stil-Aenderungen → style_rule
-- EMA-Algorithmus wie bestehender Godmode (alpha=0.3)
-- ============================================================================

-- ==========================================================================
-- 1. fn_learn_from_offer_sessions(p_days INT)
-- ==========================================================================
CREATE OR REPLACE FUNCTION fn_learn_from_offer_sessions(p_days INT DEFAULT 7)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_thread        RECORD;
    v_obs           RECORD;
    v_approved      INT := 0;
    v_edited        INT := 0;
    v_rejected      INT := 0;
    v_memories_created INT := 0;
    v_memories_updated INT := 0;
    v_ema_alpha     NUMERIC := 0.3;
    v_confidence_step NUMERIC := 0.05;
    v_max_confidence NUMERIC := 0.95;
    v_threads_processed INT := 0;
BEGIN
    -- Abgeschlossene Langtext-Sessions der letzten N Tage
    FOR v_thread IN
        SELECT id, offer_id, user_id, context_snapshot
        FROM agent_threads
        WHERE thread_type = 'offer_longtext'
          AND status = 'completed'
          AND updated_at >= now() - (p_days || ' days')::interval
          -- Nicht bereits gelernt (idempotenz)
          AND NOT EXISTS (
              SELECT 1 FROM events e
              WHERE e.payload->>'thread_id' = agent_threads.id::text
                AND e.event_type = 'OFFER_LONGTEXT_LEARNING_COMPLETED'
          )
        ORDER BY updated_at
    LOOP
        v_threads_processed := v_threads_processed + 1;

        -- Observations aggregieren
        FOR v_obs IN
            SELECT
                observation_type,
                catalog_code,
                trade,
                proposed_text,
                final_text,
                quality_score,
                edit_distance
            FROM agent_observations
            WHERE thread_id = v_thread.id
        LOOP
            CASE v_obs.observation_type
                WHEN 'text_approved' THEN
                    v_approved := v_approved + 1;
                WHEN 'text_edited' THEN
                    v_edited := v_edited + 1;

                    -- Term-Korrekturen extrahieren (wenn Text deutlich geaendert)
                    IF v_obs.edit_distance IS NOT NULL AND v_obs.edit_distance > 10
                       AND v_obs.proposed_text IS NOT NULL AND v_obs.final_text IS NOT NULL THEN

                        -- Pruefen ob es eine bestehende Korrektur gibt
                        IF EXISTS (
                            SELECT 1 FROM memory_entries
                            WHERE scope = 'tenant'
                              AND memory_type = 'correction_pattern'
                              AND key = COALESCE(v_obs.catalog_code, v_obs.trade, 'general')
                        ) THEN
                            -- Update confidence mit EMA
                            UPDATE memory_entries
                            SET confidence = LEAST(v_max_confidence,
                                    v_ema_alpha * COALESCE(v_obs.quality_score, 0.8)
                                    + (1 - v_ema_alpha) * confidence),
                                observation_count = observation_count + 1,
                                updated_at = now()
                            WHERE scope = 'tenant'
                              AND memory_type = 'correction_pattern'
                              AND key = COALESCE(v_obs.catalog_code, v_obs.trade, 'general');
                            v_memories_updated := v_memories_updated + 1;
                        ELSE
                            -- Neue Korrektur-Beobachtung
                            INSERT INTO memory_entries (
                                scope, scope_id, memory_type, key, value, trade,
                                confidence, observation_count, source
                            ) VALUES (
                                'tenant', NULL, 'correction_pattern',
                                COALESCE(v_obs.catalog_code, v_obs.trade, 'general'),
                                'User hat Text editiert. Proposed: ' || LEFT(v_obs.proposed_text, 100)
                                    || '... Final: ' || LEFT(v_obs.final_text, 100),
                                v_obs.trade,
                                COALESCE(v_obs.quality_score, 0.5),
                                1,
                                'auto_extracted'
                            );
                            v_memories_created := v_memories_created + 1;
                        END IF;
                    END IF;

                WHEN 'text_rejected' THEN
                    v_rejected := v_rejected + 1;
            END CASE;
        END LOOP;

        -- Few-Shot Beispiele aus gut bewerteten Texten speichern
        INSERT INTO memory_entries (
            scope, scope_id, memory_type, key, value, trade,
            confidence, observation_count, source
        )
        SELECT
            'tenant', NULL, 'few_shot_example',
            COALESCE(ao.catalog_code, ao.trade, 'general'),
            ao.final_text,
            ao.trade,
            ao.quality_score,
            1,
            'auto_extracted'
        FROM agent_observations ao
        WHERE ao.thread_id = v_thread.id
          AND ao.observation_type IN ('text_approved', 'text_edited')
          AND ao.quality_score >= 0.8
          AND ao.final_text IS NOT NULL
          AND LENGTH(ao.final_text) > 20
          -- Max 3 Beispiele pro catalog_code
          AND (
              SELECT COUNT(*) FROM memory_entries me
              WHERE me.scope = 'tenant'
                AND me.memory_type = 'few_shot_example'
                AND me.key = COALESCE(ao.catalog_code, ao.trade, 'general')
          ) < 3
        ON CONFLICT DO NOTHING;

        -- Event loggen (Idempotenz-Marker)
        INSERT INTO events (event_type, project_id, source_system, source_flow, payload)
        VALUES (
            'OFFER_LONGTEXT_LEARNING_COMPLETED',
            (SELECT project_id FROM agent_threads WHERE id = v_thread.id),
            'db',
            'fn_learn_from_offer_sessions',
            jsonb_build_object(
                'thread_id', v_thread.id,
                'offer_id', v_thread.offer_id,
                'approved', v_approved,
                'edited', v_edited,
                'rejected', v_rejected,
                'memories_created', v_memories_created,
                'memories_updated', v_memories_updated
            )
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'threads_processed', v_threads_processed,
        'total_approved', v_approved,
        'total_edited', v_edited,
        'total_rejected', v_rejected,
        'memories_created', v_memories_created,
        'memories_updated', v_memories_updated
    );
END;
$$;

COMMENT ON FUNCTION fn_learn_from_offer_sessions IS 'Lernt aus Langtext-Sessions: extrahiert Korrekturen und Few-Shot-Beispiele in memory_entries';

-- ==========================================================================
-- 2. fn_export_training_data(p_format TEXT)
-- ==========================================================================
CREATE OR REPLACE FUNCTION fn_export_training_data(p_min_quality NUMERIC DEFAULT 0.8)
RETURNS TABLE (
    system_prompt TEXT,
    user_prompt TEXT,
    assistant_response TEXT,
    quality_score NUMERIC,
    catalog_code TEXT,
    trade TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT
        'Du bist der BauGenius Langtext-Assistent. Schreibe verkaufende Langtexte fuer Angebotspositionen im Handwerk.' AS system_prompt,
        'Schreibe den Langtext fuer: ' || COALESCE(op.title, 'Position') || ' (' || COALESCE(op.quantity::text, '?') || ' ' || COALESCE(op.unit, '?') || ')' AS user_prompt,
        ao.final_text AS assistant_response,
        ao.quality_score,
        ao.catalog_code,
        ao.trade,
        ao.created_at
    FROM agent_observations ao
    LEFT JOIN offer_positions op ON op.id = ao.position_id
    WHERE ao.observation_type IN ('text_approved', 'text_edited')
      AND ao.quality_score >= p_min_quality
      AND ao.final_text IS NOT NULL
      AND LENGTH(ao.final_text) > 20
    ORDER BY ao.quality_score DESC, ao.created_at DESC;
$$;

COMMENT ON FUNCTION fn_export_training_data IS 'Exportiert Trainingspaare (system/user/assistant) fuer lokales LLM Fine-Tuning';

-- ==========================================================================
-- 3. Grants
-- ==========================================================================
GRANT EXECUTE ON FUNCTION fn_learn_from_offer_sessions TO service_role;
GRANT EXECUTE ON FUNCTION fn_export_training_data TO service_role;
