-- ============================================================================
-- Migration: Agent Plausibilität
-- Staffellauf Agent #3 — Prüft Gewerke-Reihenfolge, Gesamtstunden, fehlende Daten
-- Deterministisch: Kein AI nötig, reine Regelprüfung
-- ============================================================================

-- ===========================================
-- Gewerke-Reihenfolge-Regeln (Baulogik)
-- ===========================================
CREATE TABLE IF NOT EXISTS trade_sequence_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES trades(id),
    trade_name TEXT NOT NULL,
    default_phase_order INT NOT NULL,
    must_come_after UUID[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE trade_sequence_rules IS 'Baulogik: Gewerke-Reihenfolge für Plausibilitätsprüfung';

ALTER TABLE trade_sequence_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tsr_select" ON trade_sequence_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "tsr_all_service" ON trade_sequence_rules FOR ALL TO service_role USING (true);

-- Seed: Phase 10=Abbruch, 20=Rohinstallation, 30=Wände, 40=Böden, 50=Oberflächen, 60=Einbauten, 90=Reinigung
INSERT INTO trade_sequence_rules (trade_id, trade_name, default_phase_order, must_come_after, notes)
VALUES
    ('85f95b86-a41a-42b0-9b55-0524e068563f', 'Abbruch', 10, '{}', 'Immer zuerst'),
    ('7c65f414-ddf3-4deb-a026-8936165f1240', 'Elektro', 20,
     ARRAY['85f95b86-a41a-42b0-9b55-0524e068563f']::UUID[], 'Rohinstallation nach Abbruch'),
    ('9b3ebe02-4275-4acb-a71f-3b0969bb1f20', 'Sanitär', 20,
     ARRAY['85f95b86-a41a-42b0-9b55-0524e068563f']::UUID[], 'Rohinstallation nach Abbruch'),
    ('fa20c848-f4c6-4058-bd02-5a35e3e9a9a1', 'Heizung', 20,
     ARRAY['85f95b86-a41a-42b0-9b55-0524e068563f']::UUID[], 'Rohinstallation nach Abbruch'),
    ('e540723d-59b0-4869-9890-1beb8bc246ed', 'Trockenbau', 30,
     ARRAY['7c65f414-ddf3-4deb-a026-8936165f1240', '9b3ebe02-4275-4acb-a71f-3b0969bb1f20']::UUID[],
     'Nach Rohinstallation Elektro + Sanitär'),
    ('ad2d5c4c-7bf3-40b6-ab10-833e375e2241', 'Fliesen', 40,
     ARRAY['e540723d-59b0-4869-9890-1beb8bc246ed', '9b3ebe02-4275-4acb-a71f-3b0969bb1f20']::UUID[],
     'Nach Trockenbau + Sanitär-Rohinstallation'),
    ('cc47de4c-4537-4d6d-bf88-2e0e6699170d', 'Boden', 40,
     ARRAY['e540723d-59b0-4869-9890-1beb8bc246ed']::UUID[], 'Nach Trockenbau'),
    ('6792de03-2acc-42a6-b1a2-0001888ab1f4', 'Maler', 50,
     ARRAY['e540723d-59b0-4869-9890-1beb8bc246ed', 'ad2d5c4c-7bf3-40b6-ab10-833e375e2241']::UUID[],
     'Nach Trockenbau + Fliesen'),
    ('64e354cd-a1c0-42a8-bb97-3ef71f96ecdb', 'Tischler', 60,
     ARRAY['6792de03-2acc-42a6-b1a2-0001888ab1f4']::UUID[], 'Türen etc. nach Maler'),
    ('4efe3474-4d33-4459-ae1f-acb3d049b55a', 'Reinigung', 90, '{}', 'Immer am Ende'),
    ('c44885bd-2012-4e54-856e-fcab8a51f1b4', 'Sonstiges', 99, '{}', 'Flexibel einsortierbar')
ON CONFLICT DO NOTHING;

-- ===========================================
-- fn_agent_plausibility() — Der Plausibilitäts-Agent
-- ===========================================
-- Resolved trade_id auch aus trade-Enum-Name (Fallback wenn trade_id NULL)
CREATE OR REPLACE FUNCTION fn_agent_plausibility(
    p_run_id UUID,
    p_input JSONB
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_step_id UUID;
    v_project_id UUID;
    v_positions JSONB;
    v_trade_summary JSONB := '[]'::JSONB;
    v_warnings TEXT[] := '{}';
    v_errors TEXT[] := '{}';
    v_output JSONB;
    v_trade RECORD;
    v_rule RECORD;
    v_dep_in_project BOOLEAN;
    v_total_positions INT;
    v_positions_without_trade INT;
    v_positions_without_labor INT;
    v_total_project_minutes NUMERIC := 0;
BEGIN
    v_project_id := (p_input->>'project_id')::UUID;

    -- Step starten
    v_step_id := fn_pipeline_step_start(p_run_id, 'plausibility', 3, p_input);

    -- 1. Positionen laden (aus Input oder DB)
    IF p_input ? 'positions' AND jsonb_array_length(p_input->'positions') > 0 THEN
        v_positions := p_input->'positions';
        v_total_positions := jsonb_array_length(v_positions);
    ELSE
        -- Direkt aus offer_positions laden
        -- WICHTIG: trade_id aus trades-Tabelle resolven wenn NULL
        SELECT jsonb_agg(jsonb_build_object(
            'id', op.id,
            'catalog_code', op.catalog_code,
            'title', op.title,
            'quantity', op.quantity,
            'unit', op.unit,
            'trade', op.trade::TEXT,
            'trade_id', COALESCE(op.trade_id, t_resolved.id),
            'labor_minutes', op.labor_minutes,
            'material_cost', op.material_cost,
            'unit_price', op.unit_price
        ))
        INTO v_positions
        FROM offer_positions op
        JOIN offers o ON o.id = op.offer_id
        LEFT JOIN trades t_resolved ON t_resolved.name = op.trade::TEXT
        WHERE o.project_id = v_project_id
          AND op.deleted_at IS NULL
          AND (op.is_optional IS NULL OR op.is_optional = false);

        v_total_positions := COALESCE(jsonb_array_length(v_positions), 0);
    END IF;

    -- STOP: Null Positionen
    IF v_total_positions = 0 THEN
        v_errors := array_append(v_errors, 'Keine Positionen gefunden für Projekt');
        v_output := jsonb_build_object(
            'valid', false, 'stop', true,
            'stop_reason', 'Keine Positionen gefunden für Projekt',
            'project_id', v_project_id, 'total_positions', 0,
            'trade_sequence', '[]'::JSONB,
            'warnings', to_jsonb(v_warnings), 'errors', to_jsonb(v_errors)
        );
        PERFORM fn_pipeline_step_complete(v_step_id, v_output, 'stopped', v_warnings, v_errors);
        RETURN v_output;
    END IF;

    -- 2. Positionen ohne Gewerk
    SELECT COUNT(*) INTO v_positions_without_trade
    FROM jsonb_array_elements(v_positions) pos
    WHERE pos->>'trade_id' IS NULL AND pos->>'trade' IS NULL;

    IF v_positions_without_trade = v_total_positions THEN
        v_errors := array_append(v_errors, 'Kein Gewerk zugeordnet bei allen ' || v_total_positions || ' Positionen');
        v_output := jsonb_build_object(
            'valid', false, 'stop', true,
            'stop_reason', v_errors[1],
            'project_id', v_project_id, 'total_positions', v_total_positions,
            'positions_without_trade', v_positions_without_trade,
            'trade_sequence', '[]'::JSONB,
            'warnings', to_jsonb(v_warnings), 'errors', to_jsonb(v_errors)
        );
        PERFORM fn_pipeline_step_complete(v_step_id, v_output, 'stopped', v_warnings, v_errors);
        RETURN v_output;
    END IF;

    IF v_positions_without_trade > 0 THEN
        v_warnings := array_append(v_warnings,
            v_positions_without_trade || ' von ' || v_total_positions || ' Positionen ohne Gewerk-Zuordnung');
    END IF;

    -- 3. Positionen ohne labor_minutes
    SELECT COUNT(*) INTO v_positions_without_labor
    FROM jsonb_array_elements(v_positions) pos
    WHERE (pos->>'labor_minutes') IS NULL OR (pos->>'labor_minutes')::NUMERIC = 0;

    IF v_positions_without_labor > 0 THEN
        v_warnings := array_append(v_warnings,
            v_positions_without_labor || ' Positionen ohne Zeitangabe (labor_minutes) — Einsatzplaner nutzt Fallback');
    END IF;

    -- 4. Trade-Summary mit Reihenfolge
    -- Resolve: trade_id direkt ODER über trade-Name aus trades-Tabelle
    FOR v_trade IN
        SELECT
            COALESCE(
                (pos->>'trade_id')::UUID,
                t_by_name.id
            )::TEXT AS trade_id,
            COALESCE(
                t_by_id.name,
                t_by_name.name,
                pos->>'trade',
                'Unbekannt'
            ) AS trade_name,
            COUNT(*) AS position_count,
            SUM(COALESCE((pos->>'labor_minutes')::NUMERIC, 0)) AS total_minutes,
            SUM(COALESCE((pos->>'material_cost')::NUMERIC, 0)) AS total_material_cost,
            COALESCE(tsr_id.default_phase_order, tsr_name.default_phase_order, 99) AS phase_order,
            COALESCE(tsr_id.must_come_after, tsr_name.must_come_after) AS must_come_after
        FROM jsonb_array_elements(v_positions) pos
        LEFT JOIN trades t_by_id ON t_by_id.id = (pos->>'trade_id')::UUID
        LEFT JOIN trades t_by_name ON t_by_name.name = pos->>'trade' AND (pos->>'trade_id') IS NULL
        LEFT JOIN trade_sequence_rules tsr_id ON tsr_id.trade_id = (pos->>'trade_id')::UUID
        LEFT JOIN trade_sequence_rules tsr_name ON tsr_name.trade_name = pos->>'trade' AND (pos->>'trade_id') IS NULL
        WHERE pos->>'trade_id' IS NOT NULL OR pos->>'trade' IS NOT NULL
        GROUP BY
            COALESCE((pos->>'trade_id')::UUID, t_by_name.id),
            COALESCE(t_by_id.name, t_by_name.name, pos->>'trade', 'Unbekannt'),
            COALESCE(tsr_id.default_phase_order, tsr_name.default_phase_order, 99),
            COALESCE(tsr_id.must_come_after, tsr_name.must_come_after)
        ORDER BY COALESCE(tsr_id.default_phase_order, tsr_name.default_phase_order, 99)
    LOOP
        -- >40h pro Gewerk = suspekt
        IF v_trade.total_minutes > 2400 THEN
            v_warnings := array_append(v_warnings,
                v_trade.trade_name || ': ' || ROUND(v_trade.total_minutes / 60, 1) || 'h geplant — ungewöhnlich hoch, bitte prüfen');
        END IF;

        v_total_project_minutes := v_total_project_minutes + v_trade.total_minutes;

        v_trade_summary := v_trade_summary || jsonb_build_object(
            'trade_id', v_trade.trade_id,
            'trade', v_trade.trade_name,
            'phase_order', v_trade.phase_order,
            'position_count', v_trade.position_count,
            'total_minutes', v_trade.total_minutes,
            'total_hours', ROUND(v_trade.total_minutes / 60, 1),
            'total_material_cost', v_trade.total_material_cost,
            'must_come_after', COALESCE(to_jsonb(v_trade.must_come_after), '[]'::JSONB)
        );
    END LOOP;

    -- 5. Gesamt-Plausibilität: >200h = Warnung
    IF v_total_project_minutes > 12000 THEN
        v_warnings := array_append(v_warnings,
            'Gesamtprojekt: ' || ROUND(v_total_project_minutes / 60, 1) || 'h — sehr großes Projekt, Zeitplan genau prüfen');
    END IF;

    -- 6. Output
    v_output := jsonb_build_object(
        'valid', true, 'stop', false,
        'project_id', v_project_id,
        'total_positions', v_total_positions,
        'positions_without_trade', v_positions_without_trade,
        'positions_without_labor', v_positions_without_labor,
        'total_project_minutes', v_total_project_minutes,
        'total_project_hours', ROUND(v_total_project_minutes / 60, 1),
        'trade_count', jsonb_array_length(v_trade_summary),
        'trade_sequence', v_trade_summary,
        'positions', v_positions,
        'warnings', to_jsonb(v_warnings),
        'errors', to_jsonb(v_errors)
    );

    PERFORM fn_pipeline_step_complete(v_step_id, v_output, 'completed', v_warnings, v_errors);
    RETURN v_output;
END;
$$;

COMMENT ON FUNCTION fn_agent_plausibility IS 'Staffellauf Agent #3: Prüft Gewerke-Reihenfolge, Gesamtstunden, fehlende Daten. STOP bei Null Positionen oder kein Gewerk.';
