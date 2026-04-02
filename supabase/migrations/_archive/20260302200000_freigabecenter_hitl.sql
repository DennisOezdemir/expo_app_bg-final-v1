-- =============================================================
-- Migration: Freigabecenter HITL — Intake Approve/Reject
-- =============================================================
-- fn_approve_intake: PENDING → APPROVED, project DRAFT → INTAKE, fire events
-- fn_reject_intake:  PENDING → REJECTED, project stays DRAFT

-- 1. fn_approve_intake
CREATE OR REPLACE FUNCTION fn_approve_intake(p_approval_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_approval RECORD;
  v_project_id UUID;
  v_event_id UUID;
BEGIN
  -- Lock + fetch approval
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

  -- 1. Approval → APPROVED
  UPDATE approvals SET
    status = 'APPROVED',
    decided_at = now(),
    decided_by = 'app_gf',
    decision_channel = 'freigabecenter',
    feedback_category = 'approved_intake',
    updated_at = now()
  WHERE id = p_approval_id;

  -- 2. Project DRAFT → INTAKE
  UPDATE projects SET
    status = 'INTAKE',
    updated_at = now()
  WHERE id = v_project_id
    AND status = 'DRAFT';

  -- 3. Event: PROJECT_CREATED → triggers Drive-Setup, Telegram etc.
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

  -- 4. Event: APPROVAL_APPROVED → triggers M5_01 Dispatcher
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

-- 2. fn_reject_intake
CREATE OR REPLACE FUNCTION fn_reject_intake(p_approval_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_approval RECORD;
BEGIN
  -- Lock + fetch approval
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

  -- 1. Approval → REJECTED
  UPDATE approvals SET
    status = 'REJECTED',
    decided_at = now(),
    decided_by = 'app_gf',
    decision_channel = 'freigabecenter',
    feedback_category = 'rejected_intake',
    feedback_reason = COALESCE(p_reason, 'Abgelehnt via Freigabecenter'),
    updated_at = now()
  WHERE id = p_approval_id;

  -- 2. Project stays DRAFT — no status change needed

  -- 3. Event for audit trail
  INSERT INTO events (event_type, project_id, source_system, source_flow, payload, reference_id, reference_table)
  VALUES (
    'APPROVAL_DECIDED',
    v_approval.project_id,
    'app',
    'freigabecenter_reject',
    jsonb_build_object(
      'approval_id', p_approval_id,
      'approval_type', 'PROJECT_START',
      'decision', 'REJECTED',
      'reason', COALESCE(p_reason, 'Abgelehnt via Freigabecenter')
    ),
    p_approval_id,
    'approvals'
  );

  RETURN jsonb_build_object(
    'success', true,
    'project_id', v_approval.project_id,
    'status', 'REJECTED'
  );
END;
$$;
