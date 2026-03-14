-- ============================================================================
-- Migration: Agent API Layer
-- 1. agent_api_keys — Authentifizierung für externe Agenten
-- 2. offer_positions.source — Herkunft der Position tracken
-- ============================================================================

-- ===========================================
-- 1. agent_api_keys — Agent-Authentifizierung
-- ===========================================
CREATE TABLE IF NOT EXISTS agent_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                          -- "Claude Code", "n8n Agent", etc.
    key_hash TEXT NOT NULL UNIQUE,               -- SHA-256 Hash des API Keys
    permissions TEXT[] NOT NULL DEFAULT '{}',     -- Erlaubte Funktionen: {"lookup-catalog", "create-offer", ...}
    is_active BOOLEAN NOT NULL DEFAULT true,
    rate_limit_per_minute INT DEFAULT 60,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE agent_api_keys IS 'API Keys für externe Agenten — Hash-basiert, kein Klartext';
COMMENT ON COLUMN agent_api_keys.key_hash IS 'SHA-256 Hash des Klartext-Keys';
COMMENT ON COLUMN agent_api_keys.permissions IS 'Array erlaubter Edge Function Namen';

-- RLS
ALTER TABLE agent_api_keys ENABLE ROW LEVEL SECURITY;

-- Nur service_role darf agent_api_keys lesen/schreiben (Edge Functions nutzen service_role)
CREATE POLICY agent_api_keys_service_only ON agent_api_keys
    FOR ALL USING (false);

-- Index
CREATE INDEX idx_agent_api_keys_hash ON agent_api_keys(key_hash);
CREATE INDEX idx_agent_api_keys_active ON agent_api_keys(is_active) WHERE is_active = true;


-- ===========================================
-- 2. offer_positions.source — Positionsherkunft
-- ===========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'offer_positions' AND column_name = 'source'
    ) THEN
        ALTER TABLE offer_positions
        ADD COLUMN source TEXT DEFAULT 'manual'
        CHECK (source IN ('manual', 'lv_import', 'catalog_template', 'agent'));

        COMMENT ON COLUMN offer_positions.source IS 'Herkunft: manual (Editor), lv_import (LV-Parser), catalog_template (Vorlage), agent (API/MCP)';
    END IF;
END $$;
