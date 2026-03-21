-- ============================================================
-- Migration: 20260321400000_rls_policies_hardening.sql
-- Issue: #24 — RLS Policies verschärfen
--
-- IST: Fast alle Policies sind USING(true) — alles offen
-- SOLL: Rollenbasierte Policies (Admin/GF vs. Monteur)
--
-- Strategie:
--   1. auth_id + is_admin auf team_members
--   2. Helper-Funktionen für Rollen-Checks
--   3. Sensible Tabellen: nur Admin/GF
--   4. Projekte/Angebote: über Zuordnung
--   5. Fallback: wenn kein Admin konfiguriert → jeder
--      authentifizierte User = Admin (verhindert Lockout)
-- ============================================================

BEGIN;

-- ============================================================
-- PART 1: Infrastruktur — auth_id + is_admin
-- ============================================================

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS auth_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Unique: 1 Auth-User = max 1 Team Member
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_auth_id
  ON public.team_members(auth_id) WHERE auth_id IS NOT NULL;

-- SETUP-HINWEIS: GF manuell verknüpfen:
-- UPDATE public.team_members SET auth_id = '<auth-user-id>', is_admin = true
-- WHERE id = '<team-member-id>';
-- ODER neuen Team-Member anlegen:
-- INSERT INTO public.team_members (name, role, email, auth_id, is_admin, active)
-- VALUES ('Max Mustermann', 'Geschäftsführer', 'info@firma.de', '<auth-uid>', true, true);

-- ============================================================
-- PART 2: Helper Functions
-- ============================================================

-- fn_is_admin(): Prüft ob aktueller User Admin/GF ist
-- Sicherheitsnetz: Wenn KEIN Admin konfiguriert → jeder authenticated = Admin
CREATE OR REPLACE FUNCTION public.fn_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM public.team_members
      WHERE is_admin = true AND auth_id IS NOT NULL
    )
    THEN EXISTS (
      SELECT 1 FROM public.team_members
      WHERE auth_id = auth.uid() AND is_admin = true
    )
    ELSE auth.uid() IS NOT NULL
  END;
$$;

-- fn_user_team_member_id(): Team-Member-ID für aktuellen Auth-User
CREATE OR REPLACE FUNCTION public.fn_user_team_member_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM public.team_members
  WHERE auth_id = auth.uid()
  LIMIT 1;
$$;

-- fn_user_has_project_access(project_id): Admin oder zugewiesen
CREATE OR REPLACE FUNCTION public.fn_user_has_project_access(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT public.fn_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.project_assignments
      WHERE project_id = p_project_id
        AND team_member_id = public.fn_user_team_member_id()
    );
$$;

-- ============================================================
-- PART 3: Alte blanket Policies droppen
-- ============================================================

-- Finance
DROP POLICY IF EXISTS "authenticated_access" ON public.purchase_invoices;
DROP POLICY IF EXISTS "authenticated_access" ON public.purchase_invoice_items;
DROP POLICY IF EXISTS "sales_invoices_all" ON public.sales_invoices;
DROP POLICY IF EXISTS "sales_invoice_items_all" ON public.sales_invoice_items;
DROP POLICY IF EXISTS "authenticated_access" ON public.bank_accounts;
DROP POLICY IF EXISTS "authenticated_access" ON public.bank_transactions;
DROP POLICY IF EXISTS "authenticated_access" ON public.bank_import_logs;
DROP POLICY IF EXISTS "auth_invoice_payments" ON public.invoice_payments;

-- Company Settings
DROP POLICY IF EXISTS "authenticated_access" ON public.company_settings;

-- Team Members (5 alte public-Policies)
DROP POLICY IF EXISTS "team_members_all" ON public.team_members;
DROP POLICY IF EXISTS "team_members_select" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert" ON public.team_members;
DROP POLICY IF EXISTS "team_members_update" ON public.team_members;
DROP POLICY IF EXISTS "team_members_delete" ON public.team_members;

-- Projects
DROP POLICY IF EXISTS "authenticated_access" ON public.projects;

-- Angebote (offers + Kinder)
DROP POLICY IF EXISTS "authenticated_access" ON public.offers;
DROP POLICY IF EXISTS "authenticated_access" ON public.offer_positions;
DROP POLICY IF EXISTS "authenticated_access" ON public.offer_sections;
DROP POLICY IF EXISTS "authenticated_access" ON public.offer_attachments;
DROP POLICY IF EXISTS "authenticated_access" ON public.offer_history;

-- ============================================================
-- PART 4: Neue restriktive Policies
-- ============================================================

-- ----------------------------------------------------------
-- FINANCE: Nur Admin/GF — kein Monteur sieht Rechnungen
-- (service_role bypassed RLS → n8n funktioniert weiterhin)
-- ----------------------------------------------------------

-- purchase_invoices
CREATE POLICY "pi_select_admin" ON public.purchase_invoices
  FOR SELECT TO authenticated USING (public.fn_is_admin());
CREATE POLICY "pi_insert_admin" ON public.purchase_invoices
  FOR INSERT TO authenticated WITH CHECK (public.fn_is_admin());
CREATE POLICY "pi_update_admin" ON public.purchase_invoices
  FOR UPDATE TO authenticated USING (public.fn_is_admin());
CREATE POLICY "pi_delete_admin" ON public.purchase_invoices
  FOR DELETE TO authenticated USING (public.fn_is_admin());

-- purchase_invoice_items
CREATE POLICY "pii_select_admin" ON public.purchase_invoice_items
  FOR SELECT TO authenticated USING (public.fn_is_admin());
CREATE POLICY "pii_insert_admin" ON public.purchase_invoice_items
  FOR INSERT TO authenticated WITH CHECK (public.fn_is_admin());
CREATE POLICY "pii_update_admin" ON public.purchase_invoice_items
  FOR UPDATE TO authenticated USING (public.fn_is_admin());
CREATE POLICY "pii_delete_admin" ON public.purchase_invoice_items
  FOR DELETE TO authenticated USING (public.fn_is_admin());

-- sales_invoices
CREATE POLICY "si_select_admin" ON public.sales_invoices
  FOR SELECT TO authenticated USING (public.fn_is_admin());
CREATE POLICY "si_insert_admin" ON public.sales_invoices
  FOR INSERT TO authenticated WITH CHECK (public.fn_is_admin());
CREATE POLICY "si_update_admin" ON public.sales_invoices
  FOR UPDATE TO authenticated USING (public.fn_is_admin());
CREATE POLICY "si_delete_admin" ON public.sales_invoices
  FOR DELETE TO authenticated USING (public.fn_is_admin());

-- sales_invoice_items
CREATE POLICY "sii_select_admin" ON public.sales_invoice_items
  FOR SELECT TO authenticated USING (public.fn_is_admin());
CREATE POLICY "sii_insert_admin" ON public.sales_invoice_items
  FOR INSERT TO authenticated WITH CHECK (public.fn_is_admin());
CREATE POLICY "sii_update_admin" ON public.sales_invoice_items
  FOR UPDATE TO authenticated USING (public.fn_is_admin());
CREATE POLICY "sii_delete_admin" ON public.sales_invoice_items
  FOR DELETE TO authenticated USING (public.fn_is_admin());

-- bank_accounts
CREATE POLICY "ba_select_admin" ON public.bank_accounts
  FOR SELECT TO authenticated USING (public.fn_is_admin());
CREATE POLICY "ba_insert_admin" ON public.bank_accounts
  FOR INSERT TO authenticated WITH CHECK (public.fn_is_admin());
CREATE POLICY "ba_update_admin" ON public.bank_accounts
  FOR UPDATE TO authenticated USING (public.fn_is_admin());
CREATE POLICY "ba_delete_admin" ON public.bank_accounts
  FOR DELETE TO authenticated USING (public.fn_is_admin());

-- bank_transactions
CREATE POLICY "bt_select_admin" ON public.bank_transactions
  FOR SELECT TO authenticated USING (public.fn_is_admin());
CREATE POLICY "bt_insert_admin" ON public.bank_transactions
  FOR INSERT TO authenticated WITH CHECK (public.fn_is_admin());
CREATE POLICY "bt_update_admin" ON public.bank_transactions
  FOR UPDATE TO authenticated USING (public.fn_is_admin());
CREATE POLICY "bt_delete_admin" ON public.bank_transactions
  FOR DELETE TO authenticated USING (public.fn_is_admin());

-- bank_import_logs
CREATE POLICY "bil_select_admin" ON public.bank_import_logs
  FOR SELECT TO authenticated USING (public.fn_is_admin());
CREATE POLICY "bil_insert_admin" ON public.bank_import_logs
  FOR INSERT TO authenticated WITH CHECK (public.fn_is_admin());
CREATE POLICY "bil_update_admin" ON public.bank_import_logs
  FOR UPDATE TO authenticated USING (public.fn_is_admin());
CREATE POLICY "bil_delete_admin" ON public.bank_import_logs
  FOR DELETE TO authenticated USING (public.fn_is_admin());

-- invoice_payments
CREATE POLICY "ip_select_admin" ON public.invoice_payments
  FOR SELECT TO authenticated USING (public.fn_is_admin());
CREATE POLICY "ip_insert_admin" ON public.invoice_payments
  FOR INSERT TO authenticated WITH CHECK (public.fn_is_admin());
CREATE POLICY "ip_update_admin" ON public.invoice_payments
  FOR UPDATE TO authenticated USING (public.fn_is_admin());
CREATE POLICY "ip_delete_admin" ON public.invoice_payments
  FOR DELETE TO authenticated USING (public.fn_is_admin());

-- ----------------------------------------------------------
-- COMPANY SETTINGS: Alle lesen, nur Admin schreiben
-- ----------------------------------------------------------

CREATE POLICY "cs_select_auth" ON public.company_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "cs_insert_admin" ON public.company_settings
  FOR INSERT TO authenticated WITH CHECK (public.fn_is_admin());
CREATE POLICY "cs_update_admin" ON public.company_settings
  FOR UPDATE TO authenticated USING (public.fn_is_admin());
CREATE POLICY "cs_delete_admin" ON public.company_settings
  FOR DELETE TO authenticated USING (public.fn_is_admin());

-- ----------------------------------------------------------
-- TEAM MEMBERS: Alle lesen, nur Admin schreiben
-- ----------------------------------------------------------

CREATE POLICY "tm_select_auth" ON public.team_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "tm_insert_admin" ON public.team_members
  FOR INSERT TO authenticated WITH CHECK (public.fn_is_admin());
CREATE POLICY "tm_update_admin" ON public.team_members
  FOR UPDATE TO authenticated USING (public.fn_is_admin());
CREATE POLICY "tm_delete_admin" ON public.team_members
  FOR DELETE TO authenticated USING (public.fn_is_admin());

-- ----------------------------------------------------------
-- PROJECTS: Admin alles, Monteure nur zugewiesene Projekte
-- ----------------------------------------------------------

CREATE POLICY "proj_select" ON public.projects
  FOR SELECT TO authenticated
  USING (public.fn_user_has_project_access(id));
CREATE POLICY "proj_insert_admin" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (public.fn_is_admin());
CREATE POLICY "proj_update" ON public.projects
  FOR UPDATE TO authenticated
  USING (public.fn_user_has_project_access(id));
CREATE POLICY "proj_delete_admin" ON public.projects
  FOR DELETE TO authenticated
  USING (public.fn_is_admin());

-- ----------------------------------------------------------
-- ANGEBOTE: Über Projekt-Zuordnung
-- ----------------------------------------------------------

-- offers
CREATE POLICY "off_select" ON public.offers
  FOR SELECT TO authenticated
  USING (public.fn_user_has_project_access(project_id));
CREATE POLICY "off_insert" ON public.offers
  FOR INSERT TO authenticated
  WITH CHECK (public.fn_user_has_project_access(project_id));
CREATE POLICY "off_update" ON public.offers
  FOR UPDATE TO authenticated
  USING (public.fn_user_has_project_access(project_id));
CREATE POLICY "off_delete_admin" ON public.offers
  FOR DELETE TO authenticated
  USING (public.fn_is_admin());

-- offer_positions (über offer → project)
CREATE POLICY "op_select" ON public.offer_positions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.id = offer_id
      AND public.fn_user_has_project_access(o.project_id)
  ));
CREATE POLICY "op_insert" ON public.offer_positions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.id = offer_id
      AND public.fn_user_has_project_access(o.project_id)
  ));
CREATE POLICY "op_update" ON public.offer_positions
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.id = offer_id
      AND public.fn_user_has_project_access(o.project_id)
  ));
CREATE POLICY "op_delete_admin" ON public.offer_positions
  FOR DELETE TO authenticated
  USING (public.fn_is_admin());

-- offer_sections (über offer → project)
CREATE POLICY "os_select" ON public.offer_sections
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.id = offer_id
      AND public.fn_user_has_project_access(o.project_id)
  ));
CREATE POLICY "os_insert" ON public.offer_sections
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.id = offer_id
      AND public.fn_user_has_project_access(o.project_id)
  ));
CREATE POLICY "os_update" ON public.offer_sections
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.id = offer_id
      AND public.fn_user_has_project_access(o.project_id)
  ));
CREATE POLICY "os_delete_admin" ON public.offer_sections
  FOR DELETE TO authenticated
  USING (public.fn_is_admin());

-- offer_attachments (über offer → project)
CREATE POLICY "oa_select" ON public.offer_attachments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.id = offer_id
      AND public.fn_user_has_project_access(o.project_id)
  ));
CREATE POLICY "oa_insert" ON public.offer_attachments
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.id = offer_id
      AND public.fn_user_has_project_access(o.project_id)
  ));
CREATE POLICY "oa_update" ON public.offer_attachments
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.id = offer_id
      AND public.fn_user_has_project_access(o.project_id)
  ));
CREATE POLICY "oa_delete_admin" ON public.offer_attachments
  FOR DELETE TO authenticated
  USING (public.fn_is_admin());

-- offer_history (Audit-Trail: lesen + schreiben über Projekt, kein Delete)
CREATE POLICY "oh_select" ON public.offer_history
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.id = offer_id
      AND public.fn_user_has_project_access(o.project_id)
  ));
CREATE POLICY "oh_insert" ON public.offer_history
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.id = offer_id
      AND public.fn_user_has_project_access(o.project_id)
  ));
-- Kein UPDATE/DELETE auf offer_history (Audit-Trail ist immutable)

-- ============================================================
-- PART 5: Cleanup
-- ============================================================

DROP TABLE IF EXISTS public._temp_lexware_dump;

COMMIT;
