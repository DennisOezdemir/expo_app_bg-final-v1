-- fn_approve_intake: Approve PROJECT_START, set status to PLANNING
-- auto_plan_full is NOT called here — too early, no Erstbegehung/Aufmaß yet
-- Planung starten happens manually after inspection + measurements are done

CREATE OR REPLACE FUNCTION fn_approve_intake(p_approval_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_approval record;
  v_project_id uuid;
BEGIN
  -- Lock and validate the approval
  SELECT * INTO v_approval
  FROM approvals
  WHERE id = p_approval_id
    AND status = 'PENDING'
    AND approval_type = 'PROJECT_START'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Approval not found or not PENDING');
  END IF;

  v_project_id := v_approval.project_id;

  -- Mark approval as approved
  UPDATE approvals
  SET status = 'APPROVED',
      decided_at = now(),
      decided_by = 'app_gf',
      decision_channel = 'freigabecenter',
      feedback_category = 'approved'
  WHERE id = p_approval_id;

  -- Update project status to PLANNING (= waiting for Erstbegehung)
  UPDATE projects
  SET status = 'PLANNING',
      updated_at = now()
  WHERE id = v_project_id
    AND status IN ('INTAKE', 'DRAFT');

  -- Fire PROJECT_CREATED event
  INSERT INTO project_events (project_id, event_type, payload, source)
  VALUES (
    v_project_id,
    'PROJECT_CREATED',
    jsonb_build_object(
      'approval_id', p_approval_id,
      'approved_at', now()
    ),
    'fn_approve_intake'
  );

  RETURN jsonb_build_object(
    'success', true,
    'project_id', v_project_id
  );
END;
$$;
