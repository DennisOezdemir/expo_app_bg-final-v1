import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────

export type SalesInvoiceStatus =
  | "DRAFT"
  | "OPEN"
  | "SENT"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED"
  | "APPROVED"
  | "PAIDOFF"
  | "VOIDED";

export type SalesInvoiceType =
  | "ABSCHLAG"
  | "TEIL"
  | "SCHLUSS"
  | "GUTSCHRIFT";

export interface InvoiceListItem {
  id: string;
  invoice_number: string;
  invoice_type: SalesInvoiceType;
  status: SalesInvoiceStatus;
  total_net: number;
  total_gross: number;
  invoice_date: string;
  due_date: string | null;
  customer_name: string | null;
  client_id: string | null;
  project_id: string | null;
  project_name: string | null;
  project_number: string | null;
  description: string | null;
  paid_at: string | null;
  abschlag_number: number | null;
  created_at: string;
}

export interface InvoiceDetail {
  id: string;
  invoice_number: string;
  invoice_type: SalesInvoiceType;
  status: SalesInvoiceStatus;
  project_id: string | null;
  client_id: string | null;
  offer_id: string | null;
  total_net: number;
  total_vat: number;
  total_gross: number;
  vat_rate: number;
  invoice_date: string;
  due_date: string | null;
  service_date_from: string | null;
  service_date_to: string | null;
  payment_days: number;
  is_reverse_charge: boolean;
  client_vat_id: string | null;
  description: string | null;
  pdf_storage_path: string | null;
  pdf_public_url: string | null;
  paid_at: string | null;
  paid_amount: number | null;
  abschlag_percent: number | null;
  abschlag_number: number | null;
  gu_deduction_percent: number | null;
  reminder_level: number | null;
  last_reminder_at: string | null;
  customer_name: string | null;
  customer_address: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Joined
  project?: { id: string; name: string; project_number: string | null; object_street: string | null } | null;
  client?: { id: string; company_name: string | null; email: string | null; vat_id: string | null } | null;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  position_number: string;
  is_title: boolean;
  offer_position_id: string | null;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number | null;
  total_price: number | null;
  sort_order: number;
}

export interface ClientOption {
  id: string;
  company_name: string | null;
  email: string | null;
  vat_id: string | null;
}

export interface ProjectOption {
  id: string;
  name: string;
  project_number: string | null;
  object_street: string | null;
}

export interface OfferOption {
  id: string;
  offer_number: string | null;
  total_net: number | null;
  status: string | null;
}

export interface OfferPositionForInvoice {
  id: string;
  position_number: number;
  title: string;
  description: string | null;
  unit: string;
  unit_price: number | null;
  quantity: number;
  total_price: number | null;
  discount_percent: number | null;
  progress_percent: number | null;
  section_id: string | null;
  sort_order: number | null;
}

export interface TextBlock {
  id: string;
  name: string;
  category: string;
  content: string;
  variables: string[] | null;
  is_default: boolean;
}

export interface CreateInvoiceInput {
  client_id: string | null;
  project_id: string | null;
  offer_id?: string | null;
  invoice_type: SalesInvoiceType;
  description?: string | null;
  vat_rate?: number;
  payment_days?: number;
  is_reverse_charge?: boolean;
  service_date_from?: string | null;
  service_date_to?: string | null;
  gu_deduction_percent?: number | null;
  abschlag_percent?: number | null;
  abschlag_number?: number | null;
  customer_name?: string | null;
  customer_address?: string | null;
}

export interface UpdateInvoiceInput {
  client_id?: string | null;
  project_id?: string | null;
  offer_id?: string | null;
  invoice_type?: SalesInvoiceType;
  status?: SalesInvoiceStatus;
  description?: string | null;
  vat_rate?: number;
  total_net?: number;
  total_vat?: number;
  total_gross?: number;
  payment_days?: number;
  is_reverse_charge?: boolean;
  service_date_from?: string | null;
  service_date_to?: string | null;
  due_date?: string | null;
  gu_deduction_percent?: number | null;
  abschlag_percent?: number | null;
  abschlag_number?: number | null;
  customer_name?: string | null;
  customer_address?: string | null;
  paid_at?: string | null;
  paid_amount?: number | null;
}

export interface UpsertInvoiceItemInput {
  id?: string;
  invoice_id: string;
  position_number: string;
  is_title: boolean;
  offer_position_id?: string | null;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number | null;
  total_price: number | null;
  sort_order: number;
}

// ── Fetch Functions ────────────────────────────────────────

export async function fetchInvoices(): Promise<InvoiceListItem[]> {
  const { data, error } = await supabase
    .from("sales_invoices")
    .select(`
      id,
      invoice_number,
      invoice_type,
      status,
      total_net,
      total_gross,
      invoice_date,
      due_date,
      customer_name,
      client_id,
      project_id,
      description,
      paid_at,
      abschlag_number,
      created_at,
      projects!sales_invoices_project_id_fkey ( name, project_number )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    ...row,
    project_name: row.projects?.name ?? null,
    project_number: row.projects?.project_number ?? null,
    projects: undefined,
  })) as InvoiceListItem[];
}

export async function fetchInvoiceDetail(invoiceId: string): Promise<InvoiceDetail | null> {
  const { data, error } = await supabase
    .from("sales_invoices")
    .select(`
      *,
      projects!sales_invoices_project_id_fkey ( id, name, project_number, object_street ),
      clients!sales_invoices_client_id_fkey ( id, company_name, email, vat_id )
    `)
    .eq("id", invoiceId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // Fetch items
  const { data: items, error: itemsError } = await supabase
    .from("sales_invoice_items")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("sort_order", { ascending: true });

  if (itemsError) throw itemsError;

  return {
    ...data,
    project: (data as any).projects ?? null,
    client: (data as any).clients ?? null,
    items: (items ?? []) as InvoiceItem[],
    projects: undefined,
    clients: undefined,
  } as unknown as InvoiceDetail;
}

export async function fetchPreviousAbschlaege(
  projectId: string,
  excludeInvoiceId?: string
): Promise<{ total_billed: number; count: number; items: { invoice_number: string; total_gross: number; status: string }[] }> {
  let query = supabase
    .from("sales_invoices")
    .select("id, invoice_number, total_gross, status, abschlag_number")
    .eq("project_id", projectId)
    .eq("invoice_type", "ABSCHLAG")
    .not("status", "in", "(CANCELLED,VOIDED)")
    .order("abschlag_number", { ascending: true });

  if (excludeInvoiceId) {
    query = query.neq("id", excludeInvoiceId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const items = (data ?? []).map((r: any) => ({
    invoice_number: r.invoice_number,
    total_gross: Number(r.total_gross),
    status: r.status,
  }));

  return {
    total_billed: items.reduce((s: number, i: any) => s + i.total_gross, 0),
    count: items.length,
    items,
  };
}

// ── Options (Dropdowns) ────────────────────────────────────

export async function fetchClients(): Promise<ClientOption[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("id, company_name, email, vat_id")
    .order("company_name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ClientOption[];
}

export async function fetchProjectOptions(): Promise<ProjectOption[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, project_number, object_street")
    .in("status", ["ACTIVE", "IN_PROGRESS", "BILLING", "COMPLETION", "PLANNING", "DRAFT"])
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ProjectOption[];
}

export async function fetchOffersByProject(projectId: string): Promise<OfferOption[]> {
  const { data, error } = await supabase
    .from("offers")
    .select("id, offer_number, total_net, status")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as OfferOption[];
}

export async function fetchOfferPositions(offerId: string): Promise<OfferPositionForInvoice[]> {
  const { data, error } = await supabase
    .from("offer_positions")
    .select(`
      id, position_number, title, description, unit,
      unit_price, quantity, total_price, discount_percent,
      progress_percent, section_id, sort_order
    `)
    .eq("offer_id", offerId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as OfferPositionForInvoice[];
}

export async function fetchTextBlocks(category?: string): Promise<TextBlock[]> {
  let query = supabase
    .from("text_blocks")
    .select("id, name, category, content, variables, is_default")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as TextBlock[];
}

// ── Mutations ──────────────────────────────────────────────

export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `RE-${year}-`;

  const { data, error } = await supabase
    .from("sales_invoices")
    .select("invoice_number")
    .like("invoice_number", `${prefix}%`)
    .order("invoice_number", { ascending: false })
    .limit(1);

  if (error) throw error;

  let nextNum = 1;
  if (data && data.length > 0) {
    const last = data[0].invoice_number;
    const numPart = parseInt(last.replace(prefix, ""), 10);
    if (!isNaN(numPart)) nextNum = numPart + 1;
  }

  return `${prefix}${String(nextNum).padStart(3, "0")}`;
}

export async function createInvoice(input: CreateInvoiceInput): Promise<{ id: string; invoice_number: string }> {
  const invoice_number = await generateInvoiceNumber();

  const vatRate = input.vat_rate ?? (input.is_reverse_charge ? 0 : 19);

  const { data, error } = await supabase
    .from("sales_invoices")
    .insert({
      invoice_number,
      client_id: input.client_id,
      project_id: input.project_id,
      offer_id: input.offer_id ?? null,
      invoice_type: input.invoice_type,
      status: "DRAFT",
      description: input.description ?? null,
      total_net: 0,
      total_vat: 0,
      total_gross: 0,
      vat_rate: vatRate,
      payment_days: input.payment_days ?? 14,
      is_reverse_charge: input.is_reverse_charge ?? true,
      service_date_from: input.service_date_from ?? null,
      service_date_to: input.service_date_to ?? null,
      gu_deduction_percent: input.gu_deduction_percent ?? 0,
      abschlag_percent: input.abschlag_percent ?? null,
      abschlag_number: input.abschlag_number ?? null,
      customer_name: input.customer_name ?? null,
      customer_address: input.customer_address ?? null,
      source: "bg",
    })
    .select("id, invoice_number")
    .single();

  if (error) throw error;
  return data as { id: string; invoice_number: string };
}

export async function updateInvoice(invoiceId: string, input: UpdateInvoiceInput): Promise<void> {
  const { error } = await supabase
    .from("sales_invoices")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", invoiceId);

  if (error) throw error;
}

export async function deleteInvoice(invoiceId: string): Promise<void> {
  // Only allow deleting DRAFT invoices
  const { data: inv } = await supabase
    .from("sales_invoices")
    .select("status")
    .eq("id", invoiceId)
    .single();

  if (inv?.status !== "DRAFT") {
    throw new Error("Nur Entwürfe können gelöscht werden");
  }

  // Delete items first
  const { error: itemsError } = await supabase
    .from("sales_invoice_items")
    .delete()
    .eq("invoice_id", invoiceId);
  if (itemsError) throw itemsError;

  const { error } = await supabase
    .from("sales_invoices")
    .delete()
    .eq("id", invoiceId);

  if (error) throw error;
}

export async function upsertInvoiceItems(items: UpsertInvoiceItemInput[]): Promise<void> {
  if (items.length === 0) return;

  const { error } = await supabase
    .from("sales_invoice_items")
    .upsert(items, { onConflict: "id" });

  if (error) throw error;
}

export async function deleteInvoiceItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from("sales_invoice_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;
}

export async function recalcInvoiceTotals(invoiceId: string): Promise<{ total_net: number; total_vat: number; total_gross: number }> {
  // Sum all non-title items
  const { data: items, error } = await supabase
    .from("sales_invoice_items")
    .select("total_price, is_title")
    .eq("invoice_id", invoiceId);

  if (error) throw error;

  const totalNet = (items ?? [])
    .filter((i: any) => !i.is_title)
    .reduce((s: number, i: any) => s + (Number(i.total_price) || 0), 0);

  // Get vat_rate and gu_deduction
  const { data: inv } = await supabase
    .from("sales_invoices")
    .select("vat_rate, gu_deduction_percent")
    .eq("id", invoiceId)
    .single();

  const vatRate = Number(inv?.vat_rate) || 0;
  const guDeduction = Number(inv?.gu_deduction_percent) || 0;

  const netAfterDeduction = totalNet * (1 - guDeduction / 100);
  const totalVat = Math.round(netAfterDeduction * (vatRate / 100) * 100) / 100;
  const totalGross = Math.round((netAfterDeduction + totalVat) * 100) / 100;

  // Update invoice
  await supabase
    .from("sales_invoices")
    .update({
      total_net: Math.round(totalNet * 100) / 100,
      total_vat: totalVat,
      total_gross: totalGross,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  return {
    total_net: Math.round(totalNet * 100) / 100,
    total_vat: totalVat,
    total_gross: totalGross,
  };
}

export async function duplicateInvoice(invoiceId: string): Promise<{ id: string; invoice_number: string }> {
  const detail = await fetchInvoiceDetail(invoiceId);
  if (!detail) throw new Error("Rechnung nicht gefunden");

  const newInvoice = await createInvoice({
    client_id: detail.client_id,
    project_id: detail.project_id,
    offer_id: detail.offer_id,
    invoice_type: detail.invoice_type,
    description: detail.description ? `Kopie: ${detail.description}` : "Kopie",
    vat_rate: detail.vat_rate,
    payment_days: detail.payment_days,
    is_reverse_charge: detail.is_reverse_charge,
    service_date_from: detail.service_date_from,
    service_date_to: detail.service_date_to,
    gu_deduction_percent: detail.gu_deduction_percent,
    customer_name: detail.customer_name,
    customer_address: detail.customer_address,
  });

  // Copy items
  if (detail.items.length > 0) {
    await upsertInvoiceItems(
      detail.items.map((item) => ({
        invoice_id: newInvoice.id,
        position_number: item.position_number,
        is_title: item.is_title,
        offer_position_id: item.offer_position_id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        total_price: item.total_price,
        sort_order: item.sort_order,
      }))
    );

    await recalcInvoiceTotals(newInvoice.id);
  }

  return newInvoice;
}
