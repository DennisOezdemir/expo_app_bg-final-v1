-- Migration 20260317100000
-- Bereichert SITE_INSPECTION Approvals mit offer_id + catalog_label
-- Damit zeigt das Freigabecenter Katalog-Badge und kann direkt zur richtigen Begehung navigieren
--
-- Änderungen:
-- 1. fn_approve_intake: SITE_INSPECTION bekommt offer_id + catalog_label aus dem Projekt
-- 2. fn_wabs_create_site_inspection: neue Funktion für WABS/AV-Direktaufträge (kein PROJECT_START)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. fn_approve_intake — SITE_INSPECTION mit Kontext
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_approve_intake(p_approval_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_approval    RECORD;
  v_project_id  UUID;
  v_event_id    UUID;
  v_storage_path TEXT;
  v_file_name   TEXT;
  v_offer_id    UUID;
  v_catalog     TEXT;
  v_catalog_label TEXT;
BEGIN
  SELECT * INTO v_approval
  FROM approvals
  WHERE id = p_approval_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Freigabe nicht gefunden');
  END IF;

  IF v_approval.status != 'PENDING' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Freigabe ist nicht mehr PENDING (aktuell: ' || v_approval.status::text || ')');
  END IF;

  IF v_approval.approval_type != 'PROJECT_START' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Diese Funktion ist nur fuer PROJECT_START Approvals');
  END IF;

  v_project_id := v_approval.project_id;

  UPDATE approvals SET
    status = 'APPROVED',
    decided_at = now(),
    decided_by = 'app_gf',
    decision_channel = 'freigabecenter',
    feedback_category = 'approved_intake',
    updated_at = now()
  WHERE id = p_approval_id;

  UPDATE projects SET
    status = 'INSPECTION',
    updated_at = now()
  WHERE id = v_project_id
    AND status = 'INTAKE';

  -- Ersten akzeptierten Auftrag + Katalog ermitteln
  SELECT o.id INTO v_offer_id
  FROM offers o
  WHERE o.project_id = v_project_id
    AND o.deleted_at IS NULL
  ORDER BY o.created_at
  LIMIT 1;

  SELECT p.price_catalog INTO v_catalog
  FROM projects p
  WHERE p.id = v_project_id;

  v_catalog_label := CASE
    WHEN v_catalog ILIKE '%WABS%' THEN 'WABS'
    WHEN v_catalog ILIKE '%AV%'   THEN 'AV'
    ELSE NULL
  END;

  -- SITE_INSPECTION mit Kontext anlegen (idempotent)
  INSERT INTO approvals (project_id, approval_type, status, requested_at, request_summary, request_data)
  SELECT
    v_project_id,
    'SITE_INSPECTION',
    'PENDING',
    now(),
    'Erstbegehung erforderlich: Vor-Ort-Begehung um Monteure, Material und Umfang zu klaeren',
    jsonb_strip_nulls(jsonb_build_object(
      'offer_id',      v_offer_id,
      'catalog_label', v_catalog_label
    ))
  WHERE NOT EXISTS (
    SELECT 1 FROM approvals
    WHERE project_id = v_project_id
      AND approval_type = 'SITE_INSPECTION'
      AND status = 'PENDING'
  );

  -- Auftrags-PDF in 01_Auftrag ablegen (wenn vorhanden)
  v_storage_path := v_approval.request_data->>'storage_path';
  v_file_name := COALESCE(v_approval.request_data->>'file_name', 'Auftrag.pdf');
  IF v_storage_path IS NOT NULL THEN
    PERFORM fn_file_intake_to_folder(
      v_project_id,
      v_storage_path,
      v_file_name,
      COALESCE(v_approval.request_data->>'mime_type', 'application/pdf'),
      COALESCE((v_approval.request_data->>'file_size')::INT, 0)
    );
  END IF;

  INSERT INTO events (event_type, project_id, source_system, source_flow, payload)
  VALUES (
    'PROJECT_CREATED',
    v_project_id,
    'app',
    'freigabecenter_approve',
    jsonb_build_object(
      'approval_id', p_approval_id,
      'approved_by', 'app_gf',
      'channel', 'freigabecenter'
    )
  )
  RETURNING id INTO v_event_id;

  INSERT INTO events (event_type, project_id, source_system, source_flow, payload, reference_id, reference_table)
  VALUES (
    'APPROVAL_APPROVED',
    v_project_id,
    'app',
    'freigabecenter_approve',
    jsonb_build_object(
      'approval_id', p_approval_id,
      'approval_type', 'PROJECT_START',
      'approved_by', 'app_gf'
    ),
    p_approval_id,
    'approvals'
  );

  RETURN jsonb_build_object(
    'success', true,
    'project_id', v_project_id,
    'site_inspection_offer_id', v_offer_id,
    'site_inspection_catalog', v_catalog_label
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. fn_wabs_create_site_inspection — für WABS/AV-Direktaufträge ohne PROJECT_START
-- ─────────────────────────────────────────────────────────────────────────────
-- Wird vom WABS/AV Intake-Flow (n8n M1_02 oder Edge Function parse-lv) aufgerufen
-- nachdem Projekt + Angebote angelegt wurden.
-- Idempotent: legt keinen zweiten SITE_INSPECTION an wenn bereits einer PENDING ist.
CREATE OR REPLACE FUNCTION fn_wabs_create_site_inspection(p_project_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offer_id      UUID;
  v_catalog       TEXT;
  v_catalog_label TEXT;
  v_inserted      BOOLEAN := false;
BEGIN
  -- Prüfen ob Projekt existiert
  IF NOT EXISTS (SELECT 1 FROM projects WHERE id = p_project_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Projekt nicht gefunden');
  END IF;

  -- Ersten Auftrag (ACCEPTED) holen
  SELECT id INTO v_offer_id
  FROM offers
  WHERE project_id = p_project_id
    AND deleted_at IS NULL
  ORDER BY created_at
  LIMIT 1;

  -- Katalog aus Projekt lesen
  SELECT price_catalog INTO v_catalog
  FROM projects
  WHERE id = p_project_id;

  v_catalog_label := CASE
    WHEN v_catalog ILIKE '%WABS%' THEN 'WABS'
    WHEN v_catalog ILIKE '%AV%'   THEN 'AV'
    ELSE NULL
  END;

  -- Idempotent: nur anlegen wenn noch kein PENDING SITE_INSPECTION existiert
  INSERT INTO approvals (project_id, approval_type, status, requested_at, request_summary, request_data)
  SELECT
    p_project_id,
    'SITE_INSPECTION',
    'PENDING',
    now(),
    'Erstbegehung erforderlich: Vor-Ort-Begehung um Monteure, Material und Umfang zu klaeren',
    jsonb_strip_nulls(jsonb_build_object(
      'offer_id',      v_offer_id,
      'catalog_label', v_catalog_label
    ))
  WHERE NOT EXISTS (
    SELECT 1 FROM approvals
    WHERE project_id = p_project_id
      AND approval_type = 'SITE_INSPECTION'
      AND status = 'PENDING'
  );

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- Event feuern
  INSERT INTO events (event_type, project_id, source_system, source_flow, payload)
  VALUES (
    'SITE_INSPECTION_CREATED',
    p_project_id,
    'db_function',
    'fn_wabs_create_site_inspection',
    jsonb_build_object(
      'offer_id',      v_offer_id,
      'catalog_label', v_catalog_label,
      'already_existed', NOT v_inserted
    )
  );

  RETURN jsonb_build_object(
    'success',        true,
    'offer_id',       v_offer_id,
    'catalog_label',  v_catalog_label,
    'already_existed', NOT v_inserted
  );
END;
$$;

COMMENT ON FUNCTION fn_wabs_create_site_inspection(UUID) IS
  'Legt SITE_INSPECTION Approval für WABS/AV-Direktaufträge an. '
  'Idempotent — legt keinen zweiten an wenn bereits PENDING. '
  'Muss nach Projekt + Angebots-Anlage aufgerufen werden (z.B. von n8n M1_02 oder parse-lv Edge Function).';
