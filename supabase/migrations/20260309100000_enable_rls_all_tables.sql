-- ============================================================================
-- Migration: RLS auf ALLEN public-Tabellen aktivieren (Single-Tenant)
-- Issue: #14 - Sicherheitsaudit: Kritische Lücken in API-Auth und RLS
-- Datum: 2026-03-09
--
-- Strategie: Single-Tenant (ein Handwerksbetrieb)
-- Policy: Nur authentifizierte User haben Zugriff (auth.role() = 'authenticated')
-- Service-Role (n8n, DB-Functions) bypassed RLS automatisch.
-- ============================================================================

-- ==========================================================================
-- SCHRITT 1: RLS auf allen public-Tabellen aktivieren die es noch nicht haben
-- ==========================================================================
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY ist idempotent (safe bei Wiederholung)

DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'          -- nur reguläre Tabellen
      AND c.relrowsecurity = false  -- nur Tabellen OHNE RLS
    ORDER BY c.relname
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.table_name);
    RAISE NOTICE 'RLS aktiviert: %', tbl.table_name;
  END LOOP;
END $$;

-- ==========================================================================
-- SCHRITT 2: Default-Policy für authentifizierte User auf ALLEN Tabellen
-- ==========================================================================
-- Erstellt "authenticated_access" Policy nur wo sie noch nicht existiert.
-- Tabellen die bereits eigene Policies haben, werden nicht verändert.

DO $$
DECLARE
  tbl RECORD;
  policy_exists BOOLEAN;
BEGIN
  FOR tbl IN
    SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity = true  -- nur Tabellen MIT RLS
    ORDER BY c.relname
  LOOP
    -- Prüfe ob diese Tabelle IRGENDEINE Policy hat
    SELECT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = tbl.table_name
    ) INTO policy_exists;

    -- Nur wenn KEINE Policy existiert, Default-Policy anlegen
    IF NOT policy_exists THEN
      EXECUTE format(
        'CREATE POLICY "authenticated_access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);',
        tbl.table_name
      );
      RAISE NOTICE 'Policy erstellt: %', tbl.table_name;
    ELSE
      RAISE NOTICE 'Policy existiert bereits: % (übersprungen)', tbl.table_name;
    END IF;
  END LOOP;
END $$;

-- ==========================================================================
-- SCHRITT 3: Anon-Key komplett aussperren (kein anonymer Zugriff)
-- ==========================================================================
-- Erstellt eine DENY-Policy für anon auf Tabellen die nur "authenticated_access" haben.
-- Das stellt sicher: Ohne Login = kein Zugriff.
--
-- Hinweis: In Supabase blockiert RLS ohne passende Policy automatisch.
-- Die "authenticated_access" Policy gilt nur für TO authenticated.
-- Anon-User haben damit keinen Zugriff. Kein zusätzlicher DENY nötig.

-- ==========================================================================
-- VERIFIZIERUNG: Zeige den finalen Status
-- ==========================================================================
DO $$
DECLARE
  total_tables INT;
  rls_enabled INT;
  rls_disabled INT;
  with_policies INT;
BEGIN
  SELECT COUNT(*) INTO total_tables
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r';

  SELECT COUNT(*) INTO rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = true;

  SELECT COUNT(*) INTO rls_disabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = false;

  SELECT COUNT(DISTINCT tablename) INTO with_policies
  FROM pg_policies WHERE schemaname = 'public';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Migration abgeschlossen!';
  RAISE NOTICE 'Tabellen gesamt:     %', total_tables;
  RAISE NOTICE 'RLS aktiviert:       %', rls_enabled;
  RAISE NOTICE 'RLS deaktiviert:     %', rls_disabled;
  RAISE NOTICE 'Mit Policies:        %', with_policies;
  RAISE NOTICE '========================================';
END $$;
