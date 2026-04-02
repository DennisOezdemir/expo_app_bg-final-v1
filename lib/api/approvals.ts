import { supabase } from "@/lib/supabase";

export interface ApprovalRow {
  id: string;
  approval_type: string;
  request_summary: string | null;
  request_data: Record<string, unknown> | null;
  feedback_reason: string | null;
  requested_at: string;
  projects: {
    id: string;
    project_number: string | null;
    name: string | null;
    object_street: string | null;
    object_city: string | null;
    budget_net?: number | null;
  } | {
    id: string;
    project_number: string | null;
    name: string | null;
    object_street: string | null;
    object_city: string | null;
    budget_net?: number | null;
  }[] | null;
}

export async function fetchPendingApprovals(): Promise<ApprovalRow[]> {
  const { data, error } = await supabase
    .from("approvals")
    .select("id, approval_type, request_summary, request_data, feedback_reason, requested_at, projects(id, project_number, name, object_street, object_city, budget_net)")
    .eq("status", "PENDING")
    .order("requested_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ApprovalRow[];
}

export async function fetchPendingApprovalCount(): Promise<number> {
  const { count, error } = await supabase
    .from("approvals")
    .select("id", { count: "exact", head: true })
    .eq("status", "PENDING");

  if (error) throw error;
  return count ?? 0;
}

async function runApprovalRpc(fnName: string, approvalId: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error("Nicht eingeloggt");

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("Supabase URL not configured");

  const action = fnName === "reject" || fnName.startsWith("fn_reject_")
    ? "reject"
    : "approve";
  const response = await fetch(`${supabaseUrl}/functions/v1/manage-approval`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      approval_id: approvalId,
      action,
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    throw new Error(result.error || "Freigabe-Aktion fehlgeschlagen");
  }

  return result.result;
}

// Maps approval_type → correct RPC function
const APPROVE_FN_MAP: Record<string, string> = {
  PROJECT_START: "fn_approve_intake",
  MATERIAL_ORDER: "fn_approve_material_order",
  SCHEDULE: "fn_approve_schedule",
};

const REJECT_FN_MAP: Record<string, string> = {
  PROJECT_START: "fn_reject_intake",
  // Material + Schedule: generic reject (update status to REJECTED)
};

async function genericReject(approvalId: string) {
  return runApprovalRpc("reject", approvalId);
}

export async function approveApproval(approvalId: string, approvalType?: string) {
  // If type is known, use the right function
  if (approvalType && APPROVE_FN_MAP[approvalType]) {
    return runApprovalRpc(APPROVE_FN_MAP[approvalType], approvalId);
  }
  // Fallback: look up the type from DB
  const { data: row } = await supabase
    .from("approvals")
    .select("approval_type")
    .eq("id", approvalId)
    .single();
  const type = row?.approval_type || "PROJECT_START";
  const fn = APPROVE_FN_MAP[type] || "fn_approve_intake";
  return runApprovalRpc(fn, approvalId);
}

export async function rejectApproval(approvalId: string, approvalType?: string) {
  if (approvalType && REJECT_FN_MAP[approvalType]) {
    return runApprovalRpc(REJECT_FN_MAP[approvalType], approvalId);
  }
  // For types without a specific reject function, use generic
  const { data: row } = await supabase
    .from("approvals")
    .select("approval_type")
    .eq("id", approvalId)
    .single();
  const type = row?.approval_type || "PROJECT_START";
  if (REJECT_FN_MAP[type]) {
    return runApprovalRpc(REJECT_FN_MAP[type], approvalId);
  }
  return genericReject(approvalId);
}
