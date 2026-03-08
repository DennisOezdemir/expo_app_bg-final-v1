-- Intake-PDF automatisch in 01_Auftrag ablegen nach Freigabe
-- M1_02 speichert PDF in Storage + schreibt storage_path in approvals.request_data
-- fn_approve_intake ruft fn_file_intake_to_folder auf → Datei erscheint im Projekt

-- Hilfsfunktion: Datei in Projektordner ablegen
CREATE OR REPLACE FUNCTION fn_file_intake_to_folder(
  p_project_id UUID,
  p_storage_path TEXT,
  p_file_name TEXT,
  p_mime_type TEXT DEFAULT 'application/pdf',
  p_file_size INT DEFAULT 0
) RETURNS VOID AS $$
DECLARE
  v_folder_id UUID;
BEGIN
  SELECT id INTO v_folder_id
  FROM project_folders
  WHERE project_id = p_project_id AND name = '01_Auftrag'
  LIMIT 1;

  IF v_folder_id IS NULL THEN
    INSERT INTO project_folders (project_id, name, sort_order)
    VALUES (p_project_id, '01_Auftrag', 1)
    RETURNING id INTO v_folder_id;
  END IF;

  INSERT INTO project_files (project_id, folder_id, file_type, file_name, mime_type, file_size_bytes, storage_path)
  VALUES (p_project_id, v_folder_id, 'pdf', p_file_name, p_mime_type, p_file_size, p_storage_path)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- fn_approve_intake erweitert: liest request_data.storage_path und legt Datei in 01_Auftrag ab
-- (Vollständige Funktion, ersetzt vorherige Version)
CREATE OR REPLACE FUNCTION fn_approve_intake(p_approval_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
  v_approval RECORD;
  v_project_id UUID;
  v_event_id UUID;
  v_storage_path TEXT;
  v_file_name TEXT;
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

  INSERT INTO approvals (project_id, approval_type, status, requested_at, request_summary)
  VALUES (
    v_project_id,
    'SITE_INSPECTION',
    'PENDING',
    now(),
    'Erstbegehung durchfuehren: Vor-Ort-Begehung um Monteure, Material und Umfang zu klaeren'
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
      'approval_type', 'PROJECT_START'
    ),
    p_approval_id,
    'approvals'
  );

  RETURN jsonb_build_object(
    'success', true,
    'project_id', v_project_id,
    'event_id', v_event_id
  );
END;
$$;
