import { supabase } from "@/lib/supabase";

export interface ApprovalRow {
  id: string;
  approval_type: string;
  request_summary: string | null;
  request_data: Record<string, unknown> | null;
  feedback_reason: string | null;
  requested_at: string;
  projects: {
    project_number: string | null;
    name: string | null;
    object_street: string | null;
    object_city: string | null;
    budget_net?: number | null;
  } | {
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
    .select("id, approval_type, request_summary, request_data, feedback_reason, requested_at, projects(project_number, name, object_street, object_city, budget_net)")
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

async function runApprovalRpc(fnName: "fn_approve_intake" | "fn_reject_intake", approvalId: string) {
  const { data, error } = await supabase.rpc(fnName, { p_approval_id: approvalId });
  if (error) throw error;
  if (data && typeof data === "object" && "success" in data && !data.success) {
    throw new Error(String(data.error || "Freigabe-Aktion fehlgeschlagen"));
  }
  return data;
}

export async function approveApproval(approvalId: string) {
  return runApprovalRpc("fn_approve_intake", approvalId);
}

export async function rejectApproval(approvalId: string) {
  return runApprovalRpc("fn_reject_intake", approvalId);
}
