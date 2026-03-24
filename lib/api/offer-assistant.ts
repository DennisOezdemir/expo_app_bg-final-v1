import { supabase } from "@/lib/supabase";

// ── Types ──

export interface AssistantPosition {
  id: string;
  position_number: number;
  title: string;
  description: string | null;
  unit: string;
  quantity: number;
  unit_price: number;
  long_text: string | null;
  staged_long_text: string | null;
  section_title: string;
}

export type PositionStatus = "pending" | "generating" | "proposed" | "approved" | "rejected";

export interface BatchResult {
  success: boolean;
  thread_id?: string;
  positions_total?: number;
  positions_generated?: number;
  positions_errors?: number;
  errors?: string[];
  message?: string;
  error?: string;
}

export interface ActionResult {
  success: boolean;
  position_id?: string;
  action?: string;
  quality_score?: number;
  new_text?: string;
  committed?: number;
  approved?: number;
  error?: string;
}

// ── API Calls ──

const FUNCTION_URL = "offer-assistant";

async function callAssistant(body: Record<string, unknown>): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Nicht eingeloggt");

  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/${FUNCTION_URL}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const result = await resp.json();
  if (!resp.ok || !result.success) {
    throw new Error(result.error || `Request failed: ${resp.status}`);
  }
  return result;
}

export async function startBatchGeneration(offerId: string): Promise<BatchResult> {
  return callAssistant({ offer_id: offerId, action: "start_batch" });
}

export async function approvePosition(offerId: string, threadId: string, positionId: string): Promise<ActionResult> {
  return callAssistant({ offer_id: offerId, thread_id: threadId, position_id: positionId, action: "approve" });
}

export async function editPosition(
  offerId: string,
  threadId: string,
  positionId: string,
  finalText?: string,
  message?: string,
): Promise<ActionResult> {
  return callAssistant({
    offer_id: offerId,
    thread_id: threadId,
    position_id: positionId,
    action: "edit",
    final_text: finalText,
    message,
  });
}

export async function rejectPosition(offerId: string, threadId: string, positionId: string, reason?: string): Promise<ActionResult> {
  return callAssistant({ offer_id: offerId, thread_id: threadId, position_id: positionId, action: "reject", message: reason });
}

export async function approveAllPositions(offerId: string, threadId: string): Promise<ActionResult> {
  return callAssistant({ offer_id: offerId, thread_id: threadId, action: "approve_all" });
}

export async function commitAllPositions(offerId: string, threadId: string): Promise<ActionResult> {
  return callAssistant({ offer_id: offerId, thread_id: threadId, action: "commit_all" });
}

// ── Fetch staged positions ──

export async function fetchStagedPositions(offerId: string): Promise<AssistantPosition[]> {
  const { data: sections, error } = await supabase
    .from("offer_sections")
    .select("id, section_number, title, trade")
    .eq("offer_id", offerId)
    .order("section_number");

  if (error) throw error;

  const { data: positions, error: posErr } = await supabase
    .from("offer_positions")
    .select("id, position_number, title, description, unit, quantity, unit_price, long_text, staged_long_text, section_id, sort_order")
    .eq("offer_id", offerId)
    .is("deleted_at", null)
    .order("sort_order");

  if (posErr) throw posErr;

  const sectionMap = new Map((sections || []).map((s: any) => [s.id, s.title]));

  return (positions || []).map((p: any) => ({
    id: p.id,
    position_number: p.position_number,
    title: p.title,
    description: p.description,
    unit: p.unit,
    quantity: Number(p.quantity) || 0,
    unit_price: Number(p.unit_price) || 0,
    long_text: p.long_text,
    staged_long_text: p.staged_long_text,
    section_title: sectionMap.get(p.section_id) || "",
  }));
}
