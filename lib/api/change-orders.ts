import { supabase } from "@/lib/supabase";

// ─── Types ──────────────────────────────────────────────────────────────

export type ChangeOrderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING_APPROVAL"
  | "PENDING_CUSTOMER"
  | "APPROVED"
  | "APPROVED_BY_CUSTOMER"
  | "REJECTED"
  | "REJECTED_BY_CUSTOMER"
  | "INVOICED"
  | "CANCELLED";

export type ChangeOrderReason =
  | "ADDITIONAL_WORK"
  | "MODIFIED_WORK"
  | "UNFORESEEN"
  | "CLIENT_REQUEST"
  | "PLANNING_ERROR"
  | "OTHER";

export interface ChangeOrderDetail {
  id: string;
  changeOrderNumber: string;
  title: string;
  description: string | null;
  reason: ChangeOrderReason;
  reasonDetail: string | null;
  status: ChangeOrderStatus;
  amountNet: number;
  amountGross: number;
  vatRate: number;
  vobReference: string | null;
  pdfStoragePath: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  projectId: string;
  projectName: string | null;
  photoPaths: string[] | null;
  items: ChangeOrderItem[];
  evidence: ChangeOrderEvidence[];
}

export interface ChangeOrderItem {
  id: string;
  positionNumber: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  sortOrder: number;
}

export interface ChangeOrderEvidence {
  id: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  description: string | null;
  capturedAt: string | null;
  sortOrder: number;
}

export interface ChangeOrderListItem {
  id: string;
  changeOrderNumber: string;
  title: string;
  status: ChangeOrderStatus;
  amountNet: number;
  reason: ChangeOrderReason;
  createdAt: string;
  submittedAt: string | null;
  approvedAt: string | null;
  itemCount: number;
}

export interface CreateChangeOrderInput {
  projectId: string;
  title: string;
  description?: string;
  reason: ChangeOrderReason;
  reasonDetail?: string;
  vobReference?: string;
  items: {
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
  }[];
}

// ─── Fetch Functions ────────────────────────────────────────────────────

export async function fetchProjectChangeOrders(
  projectId: string
): Promise<ChangeOrderListItem[]> {
  const { data, error } = await supabase
    .from("change_orders")
    .select(
      "id, change_order_number, title, status, amount_net, reason, created_at, submitted_at, approved_at, change_order_items(id)"
    )
    .eq("project_id", projectId)
    .neq("status", "CANCELLED")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    changeOrderNumber: row.change_order_number,
    title: row.title,
    status: row.status as ChangeOrderStatus,
    amountNet: Number(row.amount_net) || 0,
    reason: row.reason as ChangeOrderReason,
    createdAt: row.created_at,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    itemCount: Array.isArray(row.change_order_items)
      ? row.change_order_items.length
      : 0,
  }));
}

export async function fetchChangeOrderDetail(
  changeOrderId: string
): Promise<ChangeOrderDetail> {
  const { data, error } = await supabase
    .from("change_orders")
    .select(
      `id, change_order_number, title, description, reason, reason_detail,
       status, amount_net, amount_gross, vat_rate, vob_reference,
       pdf_storage_path, submitted_at, approved_at, approved_by,
       rejected_at, rejection_reason, created_at, project_id, photo_paths,
       projects(name),
       change_order_items(id, position_number, description, quantity, unit, unit_price, total_price, sort_order),
       change_order_evidence(id, file_name, file_type, storage_path, description, captured_at, sort_order)`
    )
    .eq("id", changeOrderId)
    .single();

  if (error) throw error;

  const projectData = data.projects as unknown as { name: string } | null;
  const items = (
    (data.change_order_items as unknown as any[]) ?? []
  )
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((item: any) => ({
      id: item.id,
      positionNumber: item.position_number,
      description: item.description,
      quantity: Number(item.quantity),
      unit: item.unit,
      unitPrice: Number(item.unit_price),
      totalPrice: Number(item.total_price),
      sortOrder: item.sort_order,
    }));

  const evidence = (
    (data.change_order_evidence as unknown as any[]) ?? []
  )
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((ev: any) => ({
      id: ev.id,
      fileName: ev.file_name,
      fileType: ev.file_type,
      storagePath: ev.storage_path,
      description: ev.description,
      capturedAt: ev.captured_at,
      sortOrder: ev.sort_order,
    }));

  return {
    id: data.id,
    changeOrderNumber: data.change_order_number,
    title: data.title,
    description: data.description,
    reason: data.reason as ChangeOrderReason,
    reasonDetail: data.reason_detail,
    status: data.status as ChangeOrderStatus,
    amountNet: Number(data.amount_net) || 0,
    amountGross: Number(data.amount_gross) || 0,
    vatRate: Number(data.vat_rate) || 0,
    vobReference: data.vob_reference,
    pdfStoragePath: data.pdf_storage_path,
    submittedAt: data.submitted_at,
    approvedAt: data.approved_at,
    approvedBy: data.approved_by,
    rejectedAt: data.rejected_at,
    rejectionReason: data.rejection_reason,
    createdAt: data.created_at,
    projectId: data.project_id,
    projectName: projectData?.name ?? null,
    photoPaths: data.photo_paths as string[] | null,
    items,
    evidence,
  };
}

// ─── Mutations ──────────────────────────────────────────────────────────

export async function createChangeOrder(
  input: CreateChangeOrderInput
): Promise<{ id: string }> {
  // 1. Create the change order
  const { data: co, error: coError } = await supabase
    .from("change_orders")
    .insert({
      project_id: input.projectId,
      title: input.title,
      description: input.description || null,
      reason: input.reason,
      reason_detail: input.reasonDetail || null,
      vob_reference: input.vobReference || null,
      change_order_number: "DRAFT", // will be set by trigger
      status: "DRAFT",
    })
    .select("id")
    .single();

  if (coError) throw coError;

  // 2. Create items
  if (input.items.length > 0) {
    const itemRows = input.items.map((item, idx) => ({
      change_order_id: co.id,
      position_number: `N${String(idx + 1).padStart(2, "0")}`,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unitPrice,
      total_price: item.quantity * item.unitPrice,
      sort_order: idx + 1,
    }));

    const { error: itemError } = await supabase
      .from("change_order_items")
      .insert(itemRows);

    if (itemError) throw itemError;
  }

  // 3. Recalculate totals
  const totalNet = input.items.reduce(
    (sum, i) => sum + i.quantity * i.unitPrice,
    0
  );
  await supabase
    .from("change_orders")
    .update({
      amount_net: totalNet,
      amount_gross: totalNet * 1.19,
      vat_rate: 19,
    })
    .eq("id", co.id);

  return { id: co.id };
}

export async function uploadChangeOrderEvidence(
  changeOrderId: string,
  uri: string,
  fileName: string
): Promise<void> {
  const storagePath = `change-orders/${changeOrderId}/${Date.now()}_${fileName}`;
  const response = await fetch(uri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from("project-files")
    .upload(storagePath, blob, { contentType: blob.type || "image/jpeg" });

  if (uploadError) throw uploadError;

  // Get current sort_order
  const { count } = await supabase
    .from("change_order_evidence")
    .select("id", { count: "exact", head: true })
    .eq("change_order_id", changeOrderId);

  const { error: dbError } = await supabase
    .from("change_order_evidence")
    .insert({
      change_order_id: changeOrderId,
      file_name: fileName,
      file_type: blob.type || "image/jpeg",
      storage_path: storagePath,
      file_size_bytes: blob.size,
      sort_order: (count ?? 0) + 1,
      captured_at: new Date().toISOString(),
    });

  if (dbError) throw dbError;
}

// ─── RPCs ───────────────────────────────────────────────────────────────

export async function submitChangeOrder(changeOrderId: string): Promise<void> {
  const { error } = await supabase.rpc("submit_change_order", {
    p_change_order_id: changeOrderId,
  });
  if (error) throw error;
}

export async function approveChangeOrder(
  changeOrderId: string,
  approvedBy?: string
): Promise<void> {
  const { error } = await supabase.rpc("approve_change_order", {
    p_change_order_id: changeOrderId,
    p_approved_by: approvedBy || "Auftraggeber",
  });
  if (error) throw error;
}

export async function rejectChangeOrder(
  changeOrderId: string,
  reason?: string
): Promise<void> {
  const { error } = await supabase.rpc("reject_change_order", {
    p_change_order_id: changeOrderId,
    p_reason: reason || null,
  });
  if (error) throw error;
}
