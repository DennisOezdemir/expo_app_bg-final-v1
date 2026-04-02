/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { handleCors } from "../_shared/cors.ts";
import {
  assertRole,
  requireProjectAccess,
  requireUserContext,
} from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { errorResponse, jsonResponse } from "../_shared/response.ts";

interface ApprovalActionRequest {
  approval_id: string;
  action: "approve" | "reject";
  approval_type?: string;
}

const APPROVE_FN_MAP: Record<string, string> = {
  PROJECT_START: "fn_approve_intake",
  MATERIAL_ORDER: "fn_approve_material_order",
  SCHEDULE: "fn_approve_schedule",
};

const REJECT_FN_MAP: Record<string, string> = {
  PROJECT_START: "fn_reject_intake",
};

async function runApprovalRpc(sb: any, fnName: string, approvalId: string) {
  const { data, error } = await sb.rpc(fnName, { p_approval_id: approvalId });
  if (error) throw new Error(error.message);
  if (data && typeof data === "object" && "success" in data && !data.success) {
    throw new Error(String(data.error || "Freigabe-Aktion fehlgeschlagen"));
  }
  return data;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const user = await requireUserContext(req);
    assertRole(user, ["gf", "bauleiter"]);

    const body = await req.json() as ApprovalActionRequest;
    if (!body.approval_id || !body.action) {
      return errorResponse("approval_id und action sind erforderlich", 400, req);
    }

    const sb = createServiceClient();
    const { data: approval, error: approvalError } = await sb
      .from("approvals")
      .select("id, project_id, approval_type, status")
      .eq("id", body.approval_id)
      .maybeSingle();

    if (approvalError || !approval) {
      return errorResponse("Freigabe nicht gefunden", 404, req);
    }

    await requireProjectAccess(user.authHeader, approval.project_id);

    const approvalType = body.approval_type || approval.approval_type;

    if (body.action === "approve") {
      const fnName = APPROVE_FN_MAP[approvalType];
      if (!fnName) {
        return errorResponse(`approval_type ${approvalType} wird serverseitig nicht unterstützt`, 400, req);
      }

      const result = await runApprovalRpc(sb, fnName, body.approval_id);
      return jsonResponse({ success: true, result }, 200, req);
    }

    const rejectFn = REJECT_FN_MAP[approvalType];
    if (rejectFn) {
      const result = await runApprovalRpc(sb, rejectFn, body.approval_id);
      return jsonResponse({ success: true, result }, 200, req);
    }

    const { data: rejected, error: rejectError } = await sb
      .from("approvals")
      .update({
        status: "REJECTED",
        decided_at: new Date().toISOString(),
        decided_by: user.userId,
        decision_channel: "freigabecenter",
        feedback_category: "rejected",
      })
      .eq("id", body.approval_id)
      .eq("status", "PENDING")
      .select("id, status")
      .maybeSingle();

    if (rejectError || !rejected) {
      return errorResponse(rejectError?.message || "Freigabe konnte nicht abgelehnt werden", 400, req);
    }

    return jsonResponse({ success: true, result: rejected }, 200, req);
  } catch (err) {
    const message = (err as Error).message;
    const authErrors = new Set([
      "Missing authorization",
      "Invalid JWT token",
      "User authentication required",
    ]);
    const status = message === "Forbidden"
      ? 403
      : authErrors.has(message)
      ? 401
      : 500;
    console.error("[manage-approval] Error:", message, (err as Error).stack || "");
    return errorResponse(message, status, req);
  }
});
