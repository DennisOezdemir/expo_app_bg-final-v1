-- ============================================================
-- Migration: Intake Duplikat-Erkennung (Issue #15)
--
-- 4 Funktionen:
--   1. find_matching_project()              — Adress-Matching (EXACT/FUZZY/NONE)
--   2. attach_offer_to_project()            — Neues Angebot an bestehendes Projekt
--   3. create_duplicate_check_approval()    — DUPLICATE_CHECK Approval bei unsicherem Match
--   4. fn_resolve_duplicate_check()         — User-Entscheidung: ATTACH oder KEEP_NEW
--
-- Aufgerufen von: M1_02 PDF Parser (n8n) nach Adress-Extraktion
-- ============================================================

-- pg_trgm Extension fuer similarity()
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Neue Event-Typen
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'OFFER_ATTACHED';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'DUPLICATE_CHECK_REQUESTED';


-- ============================================================
-- 1. find_matching_project
--    Returns JSONB: { match_type, project_id, project_number, confidence }
--    match_type: 'EXACT' | 'FUZZY' | 'NONE'
-- ============================================================
CREATE OR REPLACE FUNCTION public.find_matching_project(
  p_street TEXT,
  p_city TEXT,
  p_client_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_exact RECORD;
  v_fuzzy RECORD;
  v_street_normalized TEXT;
  v_city_normalized TEXT;
BEGIN
  -- Normalisierung: Kleinbuchstaben, Whitespace trimmen
  v_street_normalized := lower(trim(p_street));
  v_city_normalized := lower(trim(p_city));

  -- 1. Exakter Match: Strasse + Stadt + Client (case-insensitive)
  SELECT id, project_number, object_street, object_city, object_floor
  INTO v_exact
  FROM projects
  WHERE lower(trim(object_street)) = v_street_normalized
    AND lower(trim(object_city)) = v_city_normalized
    AND client_id = p_client_id
    AND status NOT IN ('CANCELLED', 'COMPLETED', 'ARCHIVED')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_exact.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'match_type', 'EXACT',
      'project_id', v_exact.id,
      'project_number', v_exact.project_number,
      'matched_street', v_exact.object_street,
      'matched_city', v_exact.object_city,
      'matched_floor', v_exact.object_floor,
      'confidence', 1.0
    );
  END IF;

  -- 2. Fuzzy Match: Strasse aehnlich (pg_trgm similarity), gleiche Stadt + Client
  SELECT id, project_number, object_street, object_city, object_floor,
         similarity(lower(trim(object_street)), v_street_normalized) AS sim_score
  INTO v_fuzzy
  FROM projects
  WHERE lower(trim(object_city)) = v_city_normalized
    AND client_id = p_client_id
    AND status NOT IN ('CANCELLED', 'COMPLETED', 'ARCHIVED')
    AND similarity(lower(trim(object_street)), v_street_normalized) > 0.4
  ORDER BY similarity(lower(trim(object_street)), v_street_normalized) DESC
  LIMIT 1;

  IF v_fuzzy.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'match_type', 'FUZZY',
      'project_id', v_fuzzy.id,
      'project_number', v_fuzzy.project_number,
      'matched_street', v_fuzzy.object_street,
      'matched_city', v_fuzzy.object_city,
      'matched_floor', v_fuzzy.object_floor,
      'confidence', round(v_fuzzy.sim_score::numeric, 2)
    );
  END IF;

  -- 3. Kein Match
  RETURN jsonb_build_object(
    'match_type', 'NONE',
    'project_id', NULL,
    'confidence', 0
  );
END;
$fn$;

COMMENT ON FUNCTION public.find_matching_project IS
  'Sucht bestehendes Projekt anhand Strasse + Stadt + Client. Returns match_type EXACT/FUZZY/NONE mit Confidence.';


-- ============================================================
-- 2. attach_offer_to_project
--    p_offer_data JSONB: { catalog_type, source_pdf_path, idempotency_key }
--    Returns JSONB: { success, offer_id, offer_number, message }
-- ============================================================
CREATE OR REPLACE FUNCTION public.attach_offer_to_project(
  p_project_id UUID,
  p_offer_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_project RECORD;
  v_offer_id UUID;
  v_offer_number TEXT;
  v_idem_key TEXT;
  v_existing_offer_id UUID;
BEGIN
  -- Idempotenz-Check via internal_notes
  v_idem_key := p_offer_data->>'idempotency_key';
  IF v_idem_key IS NOT NULL THEN
    SELECT id INTO v_existing_offer_id
    FROM offers
    WHERE internal_notes LIKE '%idem:' || v_idem_key || '%'
      AND project_id = p_project_id
      AND deleted_at IS NULL;

    IF v_existing_offer_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', true,
        'offer_id', v_existing_offer_id,
        'message', 'Angebot existiert bereits (Idempotenz)',
        'idempotent_skip', true
      );
    END IF;
  END IF;

  -- Projekt pruefen + Lock
  SELECT id, project_number, status
  INTO v_project
  FROM projects
  WHERE id = p_project_id
  FOR UPDATE;

  IF v_project.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Projekt nicht gefunden: ' || p_project_id
    );
  END IF;

  -- Neues Angebot anlegen (offer_number via Trigger)
  INSERT INTO offers (project_id, status, internal_notes)
  VALUES (
    p_project_id,
    'ACCEPTED',
    COALESCE(p_offer_data->>'catalog_type', '')
      || ' | Quelle: ' || COALESCE(p_offer_data->>'source_pdf_path', 'unbekannt')
      || CASE WHEN v_idem_key IS NOT NULL
           THEN ' | idem:' || v_idem_key
           ELSE ''
         END
  )
  RETURNING id, offer_number INTO v_offer_id, v_offer_number;

  -- Event: OFFER_ATTACHED
  INSERT INTO events (project_id, event_type, payload, source_system, source_flow, dedupe_key)
  VALUES (
    p_project_id,
    'OFFER_ATTACHED',
    jsonb_build_object(
      'offer_id', v_offer_id,
      'offer_number', v_offer_number,
      'catalog_type', p_offer_data->>'catalog_type',
      'attached_to_existing', true
    ),
    'supabase_fn',
    'fn_attach_offer_to_project',
    'offer_attach_' || COALESCE(v_idem_key, gen_random_uuid()::text)
  );

  RETURN jsonb_build_object(
    'success', true,
    'offer_id', v_offer_id,
    'offer_number', v_offer_number,
    'project_id', p_project_id,
    'project_number', v_project.project_number,
    'message', 'Angebot ' || v_offer_number || ' an Projekt ' || v_project.project_number || ' angehaengt'
  );
END;
$fn$;

COMMENT ON FUNCTION public.attach_offer_to_project IS
  'Legt neues Angebot (Status ACCEPTED) an bestehendem Projekt an. Idempotent via idempotency_key.';


-- ============================================================
-- 3. create_duplicate_check_approval
--    Erstellt DUPLICATE_CHECK Approval fuer unsichere Matches.
--    Wird vom M1_02 PDF Parser aufgerufen wenn match_type = FUZZY.
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_duplicate_check_approval(
  p_new_project_id UUID,
  p_matched_project_id UUID,
  p_new_address JSONB,
  p_match_confidence NUMERIC,
  p_catalog_type TEXT,
  p_pdf_storage_path TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_matched RECORD;
  v_approval_id UUID;
  v_idem_key TEXT;
BEGIN
  -- Idempotenz: Ein DUPLICATE_CHECK pro new_project + matched_project
  v_idem_key := 'dupcheck_' || p_new_project_id || '_' || p_matched_project_id;

  -- Pruefen ob schon ein PENDING DUPLICATE_CHECK existiert
  SELECT id INTO v_approval_id
  FROM approvals
  WHERE approval_type = 'DUPLICATE_CHECK'
    AND project_id = p_new_project_id
    AND status = 'PENDING'
    AND (request_data->>'matched_project_id')::uuid = p_matched_project_id;

  IF v_approval_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'approval_id', v_approval_id,
      'message', 'DUPLICATE_CHECK Approval existiert bereits',
      'idempotent_skip', true
    );
  END IF;

  -- Matched-Projekt-Infos laden
  SELECT project_number, object_street, object_city, object_floor
  INTO v_matched
  FROM projects
  WHERE id = p_matched_project_id;

  IF v_matched.project_number IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Matched Projekt nicht gefunden: ' || p_matched_project_id
    );
  END IF;

  -- Approval anlegen
  INSERT INTO approvals (
    project_id, approval_type, status, requested_by, request_summary, request_data
  )
  VALUES (
    p_new_project_id,
    'DUPLICATE_CHECK',
    'PENDING',
    'system_intake',
    'Moeglisches Duplikat erkannt: ' || v_matched.project_number
      || ' (' || v_matched.object_street || ', ' || v_matched.object_city || ')'
      || ' — Konfidenz: ' || round(p_match_confidence * 100) || '%',
    jsonb_build_object(
      'new_address', p_new_address,
      'matched_project_id', p_matched_project_id,
      'matched_project_number', v_matched.project_number,
      'matched_address', jsonb_build_object(
        'street', v_matched.object_street,
        'city', v_matched.object_city,
        'floor', v_matched.object_floor
      ),
      'match_confidence', p_match_confidence,
      'catalog_type', p_catalog_type,
      'pdf_storage_path', p_pdf_storage_path
    )
  )
  RETURNING id INTO v_approval_id;

  -- Event: DUPLICATE_CHECK_REQUESTED
  INSERT INTO events (project_id, event_type, payload, source_system, source_flow, dedupe_key)
  VALUES (
    p_new_project_id,
    'DUPLICATE_CHECK_REQUESTED',
    jsonb_build_object(
      'approval_id', v_approval_id,
      'matched_project_id', p_matched_project_id,
      'matched_project_number', v_matched.project_number,
      'confidence', p_match_confidence
    ),
    'supabase_fn',
    'fn_create_duplicate_check_approval',
    v_idem_key
  );

  RETURN jsonb_build_object(
    'success', true,
    'approval_id', v_approval_id,
    'message', 'DUPLICATE_CHECK Approval erstellt fuer ' || v_matched.project_number
  );
END;
$fn$;

COMMENT ON FUNCTION public.create_duplicate_check_approval IS
  'Erstellt DUPLICATE_CHECK Approval im Freigabecenter bei unsicherem Adress-Match. Idempotent.';


-- ============================================================
-- 4. fn_resolve_duplicate_check
--    User-Entscheidung im Freigabecenter:
--    ATTACH = Angebot an bestehendes Projekt anhaengen
--    KEEP_NEW = Neues Projekt behalten (kein Merge)
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_resolve_duplicate_check(
  p_approval_id UUID,
  p_decision TEXT,  -- 'ATTACH' oder 'KEEP_NEW'
  p_decided_by TEXT DEFAULT 'app_gf'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_approval RECORD;
  v_attach_result JSONB;
  v_feedback_cat TEXT;
BEGIN
  -- Approval laden + Lock
  SELECT a.*,
         a.request_data->>'matched_project_id' AS matched_pid,
         a.request_data->>'catalog_type' AS catalog_type,
         a.request_data->>'pdf_storage_path' AS pdf_path
  INTO v_approval
  FROM approvals a
  WHERE a.id = p_approval_id
    AND a.approval_type = 'DUPLICATE_CHECK'
    AND a.status = 'PENDING'
  FOR UPDATE;

  IF v_approval.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Approval nicht gefunden oder bereits entschieden'
    );
  END IF;

  IF p_decision = 'ATTACH' THEN
    -- Angebot ans bestehende Projekt anhaengen
    SELECT attach_offer_to_project(
      (v_approval.matched_pid)::uuid,
      jsonb_build_object(
        'catalog_type', v_approval.catalog_type,
        'source_pdf_path', v_approval.pdf_path,
        'idempotency_key', 'dupcheck_resolve_' || p_approval_id
      )
    ) INTO v_attach_result;

    v_feedback_cat := 'approved_intake';

    UPDATE approvals
    SET status = 'APPROVED',
        decided_at = now(),
        decided_by = p_decided_by,
        decision_channel = 'freigabecenter',
        feedback_category = v_feedback_cat,
        feedback_reason = 'Angebot an bestehendes Projekt angehaengt',
        feedback_data = v_attach_result,
        updated_at = now()
    WHERE id = p_approval_id;

    RETURN jsonb_build_object(
      'success', true,
      'decision', 'ATTACH',
      'attach_result', v_attach_result,
      'message', 'Angebot an bestehendes Projekt angehaengt'
    );

  ELSIF p_decision = 'KEEP_NEW' THEN
    v_feedback_cat := 'rejected_intake';

    UPDATE approvals
    SET status = 'REJECTED',
        decided_at = now(),
        decided_by = p_decided_by,
        decision_channel = 'freigabecenter',
        feedback_category = v_feedback_cat,
        feedback_reason = 'Neues Projekt behalten — kein Duplikat',
        updated_at = now()
    WHERE id = p_approval_id;

    RETURN jsonb_build_object(
      'success', true,
      'decision', 'KEEP_NEW',
      'message', 'Neues Projekt beibehalten, kein Merge'
    );

  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Ungueltiger Decision-Typ: ' || p_decision || '. Erlaubt: ATTACH, KEEP_NEW'
    );
  END IF;
END;
$fn$;

COMMENT ON FUNCTION public.fn_resolve_duplicate_check IS
  'Loest DUPLICATE_CHECK Approval auf: ATTACH = Angebot anhaengen, KEEP_NEW = Neues Projekt behalten.';


-- ============================================================
-- 5. Event-Routing
-- ============================================================
INSERT INTO event_routing (event_type, target_workflow, description, is_active)
VALUES
  ('DUPLICATE_CHECK_REQUESTED', 'M5_01_Approval_Dispatcher', 'Duplikat-Check ans Freigabecenter', true),
  ('OFFER_ATTACHED', 'M1_05_Notification', 'Benachrichtigung: Angebot an Projekt angehaengt', true)
ON CONFLICT (event_type, target_workflow) DO UPDATE
SET description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;
