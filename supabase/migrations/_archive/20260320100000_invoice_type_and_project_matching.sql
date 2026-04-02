-- Migration: invoice_type Feld + Projekt-Matching Funktion
-- FIX 2: Gutschrift-Erkennung — neues Feld invoice_type
-- FIX 3: Projektzuordnung — Supabase Function für Matching

-------------------------------------------------------
-- 1. invoice_type auf purchase_invoices
-------------------------------------------------------
ALTER TABLE purchase_invoices
  ADD COLUMN IF NOT EXISTS invoice_type TEXT NOT NULL DEFAULT 'invoice';

COMMENT ON COLUMN purchase_invoices.invoice_type IS
  'invoice | credit_note — Gutschriften von z.B. besser zuhause';

-- Index für schnelle Filterung
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_invoice_type
  ON purchase_invoices (invoice_type);

-------------------------------------------------------
-- 2. project_reference + delivery_address Felder
--    (von Claude Vision extrahiert, vor dem Matching)
-------------------------------------------------------
ALTER TABLE purchase_invoices
  ADD COLUMN IF NOT EXISTS project_reference TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT;

COMMENT ON COLUMN purchase_invoices.project_reference IS
  'Projektnummer (BL-YYYY-NNN) vom Beleg extrahiert';
COMMENT ON COLUMN purchase_invoices.delivery_address IS
  'Lieferadresse vom Beleg extrahiert';

-------------------------------------------------------
-- 3. fn_match_project_by_reference
--    Sucht Projekt anhand Projektnummer oder Adresse
-------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_match_project_by_reference(
  p_project_reference TEXT DEFAULT NULL,
  p_delivery_address TEXT DEFAULT NULL
)
RETURNS TABLE (
  project_id UUID,
  project_number TEXT,
  match_type TEXT,
  confidence NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_street TEXT;
BEGIN
  -- 1. Exakter Match auf Projektnummer (BL-YYYY-NNN)
  IF p_project_reference IS NOT NULL AND p_project_reference != '' THEN
    RETURN QUERY
    SELECT p.id, p.project_number, 'project_number'::TEXT, 1.0::NUMERIC
    FROM projects p
    WHERE p.project_number = p_project_reference
      AND p.status NOT IN ('CANCELLED', 'ARCHIVED')
    LIMIT 1;

    IF FOUND THEN RETURN; END IF;

    -- Fuzzy: nur die Nummer ohne Prefix
    RETURN QUERY
    SELECT p.id, p.project_number, 'project_number_fuzzy'::TEXT, 0.8::NUMERIC
    FROM projects p
    WHERE p.project_number ILIKE '%' || p_project_reference || '%'
      AND p.status NOT IN ('CANCELLED', 'ARCHIVED')
    ORDER BY p.created_at DESC
    LIMIT 1;

    IF FOUND THEN RETURN; END IF;
  END IF;

  -- 2. Adress-Match: Straße aus delivery_address extrahieren
  IF p_delivery_address IS NOT NULL AND p_delivery_address != '' THEN
    -- Ersten Teil (vor Komma oder Zeilenumbruch) als Straße nehmen
    v_street := split_part(split_part(p_delivery_address, ',', 1), E'\n', 1);
    v_street := trim(v_street);

    -- Nur matchen wenn Straße mindestens 5 Zeichen lang
    IF length(v_street) >= 5 THEN
      RETURN QUERY
      SELECT p.id, p.project_number, 'address'::TEXT, 0.7::NUMERIC
      FROM projects p
      WHERE p.object_street ILIKE '%' || v_street || '%'
        AND p.status NOT IN ('CANCELLED', 'ARCHIVED')
      ORDER BY p.created_at DESC
      LIMIT 1;

      IF FOUND THEN RETURN; END IF;
    END IF;

    -- PLZ-Match als Fallback
    RETURN QUERY
    SELECT p.id, p.project_number, 'zip_code'::TEXT, 0.5::NUMERIC
    FROM projects p
    WHERE p.object_zip IS NOT NULL
      AND p_delivery_address ILIKE '%' || p.object_zip || '%'
      AND p.status NOT IN ('CANCELLED', 'ARCHIVED')
    ORDER BY p.created_at DESC
    LIMIT 1;
  END IF;

  -- Kein Match gefunden → leere Ergebnismenge
  RETURN;
END;
$$;

COMMENT ON FUNCTION fn_match_project_by_reference IS
  'Matcht Belege auf Projekte via Projektnummer (BL-YYYY-NNN) oder Lieferadresse';

-------------------------------------------------------
-- 4. lexware_forwarded_at Feld (FIX 4 Tracking)
-------------------------------------------------------
ALTER TABLE purchase_invoices
  ADD COLUMN IF NOT EXISTS lexware_forwarded_at TIMESTAMPTZ;

COMMENT ON COLUMN purchase_invoices.lexware_forwarded_at IS
  'Zeitpunkt der Email-Weiterleitung an Lexware Inbox';
