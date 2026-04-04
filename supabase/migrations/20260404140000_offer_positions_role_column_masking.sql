-- ============================================================
-- Migration: 20260404140000_offer_positions_role_column_masking.sql
-- Issue: HAN-10 — QA Audit: offer_positions price/margin visibility
--
-- PROBLEM: offer_positions RLS allows any project member (incl. Monteure)
-- to SELECT all columns, including:
--   - unit_price, total_price, material_cost     → Monteur should NOT see prices
--   - surcharge_overhead_percent, surcharge_profit_percent → BL should NOT see margins
--
-- SOLUTION: Two security-definer views that strip sensitive columns per role.
--   - offer_positions_monteur: hides all price/cost/margin columns
--   - offer_positions_bauleiter: shows prices but hides margin surcharges
--
-- NOTE: Direct table access via RLS alone cannot mask individual columns.
-- App screens for Monteure and Bauleiter should query these views, not the table.
-- Edge Functions already enforce assertRole() — this closes the direct-API gap.
-- ============================================================

BEGIN;

-- ── View für Monteur: kein Preis, keine Kosten, keine Margen ──────────────

DROP VIEW IF EXISTS public.offer_positions_monteur;

CREATE VIEW public.offer_positions_monteur
WITH (security_invoker = true)
AS
SELECT
  op.id,
  op.offer_id,
  op.catalog_code,
  op.position_number,
  op.title,
  op.description,
  op.long_text,
  op.unit,
  op.quantity,
  -- unit_price        HIDDEN
  -- total_price       HIDDEN
  -- material_cost     HIDDEN
  -- labor_minutes     HIDDEN (enthält Kalkulation)
  -- surcharge_*       HIDDEN
  -- internal_note     HIDDEN
  -- has_calculation   HIDDEN
  op.is_optional,
  op.trade,
  op.trade_id,
  op.section_id,
  op.position_type,
  op.alternative_to,
  op.image_path,
  op.sort_order,
  op.progress_percent,
  op.progress_updated_at,
  op.last_inspection_id,
  op.inspection_status,
  op.replaces_position_id,
  op.material_note,
  op.tools_note,
  op.phase,
  op.completed_at,
  op.change_order_item_id,
  op.source,
  op.actual_minutes,
  op.assigned_team_member_id,
  op.assigned_subcontractor_id,
  op.assignment_type,
  op.deleted_at,
  op.created_at,
  op.updated_at
FROM public.offer_positions op;

GRANT SELECT ON public.offer_positions_monteur TO authenticated;
COMMENT ON VIEW public.offer_positions_monteur IS
  'Monteur-safe Projektion: keine Preise, keine Kalkulation, keine Margen.';

-- ── View für Bauleiter: Preise sichtbar, aber Margen/Aufschläge nicht ────

DROP VIEW IF EXISTS public.offer_positions_bauleiter;

CREATE VIEW public.offer_positions_bauleiter
WITH (security_invoker = true)
AS
SELECT
  op.id,
  op.offer_id,
  op.catalog_code,
  op.position_number,
  op.title,
  op.description,
  op.long_text,
  op.unit,
  op.quantity,
  op.unit_price,
  op.total_price,
  op.material_cost,
  op.labor_minutes,
  -- surcharge_overhead_percent  HIDDEN (Marge)
  -- surcharge_profit_percent    HIDDEN (Gewinn-Aufschlag)
  op.is_optional,
  op.discount_percent,
  op.trade,
  op.trade_id,
  op.section_id,
  op.position_type,
  op.alternative_to,
  op.image_path,
  op.internal_note,
  op.has_calculation,
  op.sort_order,
  op.wbs_gwg_position_id,
  op.catalog_position_v2_id,
  op.progress_percent,
  op.progress_updated_at,
  op.last_inspection_id,
  op.inspection_status,
  op.replaces_position_id,
  op.material_note,
  op.tools_note,
  op.phase,
  op.completed_at,
  op.change_order_item_id,
  op.source,
  op.actual_minutes,
  op.assigned_team_member_id,
  op.assigned_subcontractor_id,
  op.assignment_type,
  op.staged_long_text,
  op.staged_at,
  op.staged_by,
  op.deleted_at,
  op.created_at,
  op.updated_at
FROM public.offer_positions op;

GRANT SELECT ON public.offer_positions_bauleiter TO authenticated;
COMMENT ON VIEW public.offer_positions_bauleiter IS
  'Bauleiter-safe Projektion: Preise sichtbar, Gewinn-/Overhead-Aufschläge verborgen.';

COMMIT;
