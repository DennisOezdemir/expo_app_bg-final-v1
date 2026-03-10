-- ============================================================================
-- Migration: Mehrere Angebote pro Projekt erlauben
-- Datum: 2026-03-10
-- Grund: UNIQUE Constraint auf offers.project_id verhindert 2+ Angebote
--        pro Projekt (z.B. AV + WABS für gleiche Baustelle)
-- ============================================================================

ALTER TABLE offers DROP CONSTRAINT IF EXISTS offers_project_id_unique;
ALTER TABLE offers DROP CONSTRAINT IF EXISTS offers_project_id_key;
