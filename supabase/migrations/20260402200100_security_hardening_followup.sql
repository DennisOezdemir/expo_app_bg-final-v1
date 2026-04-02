BEGIN;

-- Kein impliziter Admin-Fallback mehr: Admin-Rechte nur ueber explizite Zuordnung.
CREATE OR REPLACE FUNCTION public.fn_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE auth_id = auth.uid()
      AND is_admin = true
  );
$$;

-- team_members selbst nur noch fuer Admins oder den eigenen Datensatz.
DROP POLICY IF EXISTS "tm_select_auth" ON public.team_members;
DROP POLICY IF EXISTS "tm_select_self_or_admin" ON public.team_members;
CREATE POLICY "tm_select_self_or_admin" ON public.team_members
  FOR SELECT TO authenticated
  USING (public.fn_is_admin() OR auth_id = auth.uid());

-- Sichere Team-Projektion fuer normale App-Screens ohne PII oder Verguetungsdaten.
DROP VIEW IF EXISTS public.team_members_public;
CREATE VIEW public.team_members_public AS
SELECT
  tm.id,
  tm.name,
  NULL::text AS initials,
  tm.role,
  tm.role_label,
  tm.gewerk,
  tm.active,
  tm.active AS is_active,
  tm.sort_order,
  NULL::text AS email,
  NULL::text AS phone,
  NULL::numeric AS hourly_rate,
  NULL::text AS skill_level,
  NULL::text[] AS skills,
  NULL::integer AS max_hours_per_week
FROM public.team_members tm
WHERE tm.active = true;

GRANT SELECT ON public.team_members_public TO authenticated;
COMMENT ON VIEW public.team_members_public IS 'Abgespeckte Team-Liste fuer App-Screens ohne sensible Kontaktdaten oder Stundensaetze.';

-- site_captures nur noch innerhalb des eigenen Projektzugriffs.
DROP POLICY IF EXISTS "site_captures_select" ON public.site_captures;
DROP POLICY IF EXISTS "site_captures_insert" ON public.site_captures;
DROP POLICY IF EXISTS "site_captures_update" ON public.site_captures;

CREATE POLICY "site_captures_select" ON public.site_captures
  FOR SELECT TO authenticated
  USING (public.fn_user_has_project_access(project_id));

CREATE POLICY "site_captures_insert" ON public.site_captures
  FOR INSERT TO authenticated
  WITH CHECK (public.fn_user_has_project_access(project_id));

CREATE POLICY "site_captures_update" ON public.site_captures
  FOR UPDATE TO authenticated
  USING (public.fn_user_has_project_access(project_id))
  WITH CHECK (public.fn_user_has_project_access(project_id));

-- Feedback nur fuer den Einsender selbst oder Admins lesbar.
ALTER TABLE public.user_feedback
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id);

ALTER TABLE public.user_feedback
  ALTER COLUMN auth_user_id SET DEFAULT auth.uid();

DROP POLICY IF EXISTS "fb_insert" ON public.user_feedback;
DROP POLICY IF EXISTS "fb_select" ON public.user_feedback;

CREATE POLICY "fb_insert" ON public.user_feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND auth_user_id = auth.uid());

CREATE POLICY "fb_select" ON public.user_feedback
  FOR SELECT TO authenticated
  USING (public.fn_is_admin() OR auth_user_id = auth.uid());

-- KI-Konfiguration und Memory nicht mehr direkt clientseitig lesbar.
DROP POLICY IF EXISTS "me_select" ON public.memory_entries;
DROP POLICY IF EXISTS "lp_select" ON public.llm_providers;

REVOKE SELECT ON public.memory_entries FROM authenticated;
REVOKE SELECT ON public.llm_providers FROM authenticated;

-- Direkte Client-Ausfuehrung privilegierter Funktionen abschalten.
REVOKE EXECUTE ON FUNCTION public.auto_plan_materials(UUID) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_plan_full(UUID) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.discard_material_plan(UUID) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.confirm_proposed_phases(UUID) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.discard_proposed_phases(UUID) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_approve_material_order(UUID) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_approve_schedule(UUID) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_approve_intake(UUID) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_reject_intake(UUID, TEXT) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_godmode_learner(UUID) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_get_offer_assistant_context(UUID) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_commit_staged_longtext(UUID, UUID) FROM anon, authenticated, PUBLIC;

GRANT EXECUTE ON FUNCTION public.auto_plan_materials(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_plan_full(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.discard_material_plan(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_proposed_phases(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.discard_proposed_phases(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_approve_material_order(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_approve_schedule(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_approve_intake(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_reject_intake(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_godmode_learner(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_get_offer_assistant_context(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_commit_staged_longtext(UUID, UUID) TO service_role;

COMMIT;
