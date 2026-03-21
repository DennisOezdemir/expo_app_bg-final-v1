import { supabase } from "@/lib/supabase";

// ─── Types ──────────────────────────────────────────────────────────────

export interface FinanceOverview {
  totalRevenue: number;       // sum offers with status ACCEPTED/SENT (Beauftragungssumme)
  totalCosts: number;         // sum purchase_invoices (not CANCELLED)
  totalResult: number;        // revenue - costs
  avgMarginPercent: number;   // result / revenue * 100
  openReceivables: number;    // sales_invoices not PAID
  openPayables: number;       // purchase_invoices not PAID/CANCELLED
  overduePayables: number;    // purchase_invoices where due_date < today
  overdueReceivables: number; // sales_invoices OVERDUE
}

export interface ProjectControllingRow {
  id: string;
  projectNumber: string;
  name: string;
  status: string;
  createdAt: string;
  offerTotal: number;         // Beauftragungssumme (sum of offers)
  costTotal: number;          // Istkosten (sum of purchase_invoices)
  progressPercent: number;    // ZB-Fortschritt
  wipValue: number;           // Halbfertige Arbeiten = offerTotal * progressPercent
  margin: number;             // offerTotal - costTotal
  marginPercent: number;      // margin / offerTotal * 100
  daysRunning: number;        // Tage seit Anlage
  clientName: string | null;
}

export interface CostByCategory {
  category: string;
  label: string;
  total: number;
  count: number;
}

export interface OpenInvoiceRow {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  projectName: string | null;
  totalNet: number;
  totalGross: number;
  invoiceDate: string;
  dueDate: string | null;
  status: string;
  expenseCategory: string | null;
  paidAmount: number;
  daysOverdue: number;
  lexwareVoucherId: string | null;
}

export interface SalesInvoiceRow {
  id: string;
  invoiceNumber: string;
  customerName: string | null;
  projectName: string | null;
  totalNet: number;
  totalGross: number;
  invoiceDate: string;
  dueDate: string | null;
  status: string;
  paidAmount: number;
  daysOverdue: number;
  invoiceType: string;
}

export interface ChangeOrderRow {
  id: string;
  changeOrderNumber: string;
  title: string;
  projectName: string | null;
  amountNet: number;
  status: string;
  submittedAt: string | null;
  approvedAt: string | null;
}

// ─── Mapping ────────────────────────────────────────────────────────────

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  MATERIAL: "Material",
  SUBCONTRACTOR: "Subunternehmer",
  LABOR: "Lohn",
  SOFTWARE: "Software",
  OFFICE: "Büro",
  DISPOSAL: "Entsorgung",
  VEHICLE_FUEL: "Kraftstoff",
  VEHICLE_REPAIR: "Fahrzeugreparatur",
  VEHICLE_RENTAL: "Fahrzeugmiete",
  OTHER: "Sonstiges",
};

// ─── Fetch Functions ────────────────────────────────────────────────────

export async function fetchFinanceOverview(): Promise<FinanceOverview> {
  const [offersRes, purchaseRes, salesRes] = await Promise.all([
    supabase
      .from("offers")
      .select("total_net, status")
      .not("total_net", "is", null)
      .is("deleted_at", null),
    supabase
      .from("purchase_invoices")
      .select("total_net, total_gross, status, due_date, paid_amount"),
    supabase
      .from("sales_invoices")
      .select("total_net, total_gross, status, due_date, paid_amount"),
  ]);

  if (offersRes.error) throw offersRes.error;
  if (purchaseRes.error) throw purchaseRes.error;
  if (salesRes.error) throw salesRes.error;

  const offers = offersRes.data ?? [];
  const purchases = purchaseRes.data ?? [];
  const sales = salesRes.data ?? [];

  const today = new Date().toISOString().split("T")[0];

  // Revenue = accepted/sent offers (Beauftragungssumme)
  const totalRevenue = offers
    .filter((o) => o.status !== "DRAFT")
    .reduce((s, o) => s + (Number(o.total_net) || 0), 0);

  // Costs = all non-cancelled purchase invoices
  const activePurchases = purchases.filter((p) => p.status !== "CANCELLED");
  const totalCosts = activePurchases.reduce((s, p) => s + (Number(p.total_net) || 0), 0);

  const totalResult = totalRevenue - totalCosts;
  const avgMarginPercent = totalRevenue > 0 ? (totalResult / totalRevenue) * 100 : 0;

  // Open receivables (sales invoices not fully paid)
  const openReceivables = sales
    .filter((s) => s.status !== "PAID" && s.status !== "PAIDOFF" && s.status !== "CANCELLED" && s.status !== "VOIDED")
    .reduce((sum, s) => sum + (Number(s.total_gross) || 0) - (Number(s.paid_amount) || 0), 0);

  const overdueReceivables = sales
    .filter((s) => s.status === "OVERDUE" || (s.due_date && s.due_date < today && s.status !== "PAID" && s.status !== "PAIDOFF" && s.status !== "CANCELLED"))
    .reduce((sum, s) => sum + (Number(s.total_gross) || 0) - (Number(s.paid_amount) || 0), 0);

  // Open payables (purchase invoices not paid/cancelled)
  const openPayables = activePurchases
    .filter((p) => p.status !== "PAID")
    .reduce((sum, p) => sum + (Number(p.total_gross) || 0) - (Number(p.paid_amount) || 0), 0);

  const overduePayables = activePurchases
    .filter((p) => p.status !== "PAID" && p.due_date && p.due_date < today)
    .reduce((sum, p) => sum + (Number(p.total_gross) || 0) - (Number(p.paid_amount) || 0), 0);

  return {
    totalRevenue,
    totalCosts,
    totalResult,
    avgMarginPercent,
    openReceivables,
    openPayables,
    overduePayables,
    overdueReceivables,
  };
}

export async function fetchProjectControlling(): Promise<ProjectControllingRow[]> {
  const [projectsRes, offersRes, purchaseRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id, project_number, name, status, created_at, progress_percent, client_id, clients(company_name)")
      .not("status", "eq", "ARCHIVED")
      .order("created_at", { ascending: false }),
    supabase
      .from("offers")
      .select("project_id, total_net, status")
      .not("total_net", "is", null)
      .is("deleted_at", null),
    supabase
      .from("purchase_invoices")
      .select("project_id, total_net, status")
      .not("status", "eq", "CANCELLED")
      .not("project_id", "is", null),
  ]);

  if (projectsRes.error) throw projectsRes.error;
  if (offersRes.error) throw offersRes.error;
  if (purchaseRes.error) throw purchaseRes.error;

  const projects = projectsRes.data ?? [];
  const offers = offersRes.data ?? [];
  const purchases = purchaseRes.data ?? [];

  const now = new Date();

  // Aggregate offers per project
  const offerByProject = new Map<string, number>();
  for (const o of offers) {
    if (!o.project_id || o.status === "DRAFT") continue;
    offerByProject.set(o.project_id, (offerByProject.get(o.project_id) ?? 0) + (Number(o.total_net) || 0));
  }

  // Aggregate costs per project
  const costByProject = new Map<string, number>();
  for (const p of purchases) {
    if (!p.project_id) continue;
    costByProject.set(p.project_id, (costByProject.get(p.project_id) ?? 0) + (Number(p.total_net) || 0));
  }

  return projects.map((proj) => {
    const offerTotal = offerByProject.get(proj.id) ?? 0;
    const costTotal = costByProject.get(proj.id) ?? 0;
    const progressPercent = proj.progress_percent ?? 0;
    const wipValue = offerTotal * (progressPercent / 100);
    const margin = offerTotal - costTotal;
    const marginPercent = offerTotal > 0 ? (margin / offerTotal) * 100 : 0;
    const createdDate = new Date(proj.created_at);
    const daysRunning = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    const clientData = proj.clients as unknown as { company_name: string } | null;

    return {
      id: proj.id,
      projectNumber: proj.project_number,
      name: proj.name,
      status: proj.status ?? "DRAFT",
      createdAt: proj.created_at,
      offerTotal,
      costTotal,
      progressPercent,
      wipValue,
      margin,
      marginPercent,
      daysRunning,
      clientName: clientData?.company_name ?? null,
    };
  });
}

export async function fetchCostsByCategory(): Promise<CostByCategory[]> {
  const { data, error } = await supabase
    .from("purchase_invoices")
    .select("expense_category, total_net, status")
    .not("status", "eq", "CANCELLED");

  if (error) throw error;

  const catMap = new Map<string, { total: number; count: number }>();
  for (const row of data ?? []) {
    const cat = row.expense_category ?? "OTHER";
    const existing = catMap.get(cat) ?? { total: 0, count: 0 };
    existing.total += Number(row.total_net) || 0;
    existing.count += 1;
    catMap.set(cat, existing);
  }

  return Array.from(catMap.entries())
    .map(([category, { total, count }]) => ({
      category,
      label: EXPENSE_CATEGORY_LABELS[category] ?? category,
      total,
      count,
    }))
    .sort((a, b) => b.total - a.total);
}

export async function fetchOpenPurchaseInvoices(): Promise<OpenInvoiceRow[]> {
  const { data, error } = await supabase
    .from("purchase_invoices")
    .select("id, invoice_number, supplier_id, project_id, total_net, total_gross, invoice_date, due_date, status, expense_category, paid_amount, lexware_voucher_id, suppliers(name), projects(name)")
    .not("status", "in", "(CANCELLED)")
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) throw error;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (data ?? []).map((row) => {
    const supplierData = row.suppliers as unknown as { name: string } | null;
    const projectData = row.projects as unknown as { name: string } | null;
    let daysOverdue = 0;
    if (row.due_date && row.status !== "PAID") {
      const due = new Date(row.due_date);
      due.setHours(0, 0, 0, 0);
      daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      supplierName: supplierData?.name ?? "Unbekannt",
      projectName: projectData?.name ?? null,
      totalNet: Number(row.total_net) || 0,
      totalGross: Number(row.total_gross) || 0,
      invoiceDate: row.invoice_date,
      dueDate: row.due_date,
      status: row.status ?? "DRAFT",
      expenseCategory: row.expense_category,
      paidAmount: Number(row.paid_amount) || 0,
      daysOverdue: Math.max(daysOverdue, 0),
      lexwareVoucherId: row.lexware_voucher_id,
    };
  });
}

export async function fetchSalesInvoices(): Promise<SalesInvoiceRow[]> {
  const { data, error } = await supabase
    .from("sales_invoices")
    .select("id, invoice_number, customer_name, project_id, total_net, total_gross, invoice_date, due_date, status, paid_amount, invoice_type, projects(name)")
    .not("status", "in", "(CANCELLED,VOIDED)")
    .order("invoice_date", { ascending: false });

  if (error) throw error;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (data ?? []).map((row) => {
    const projectData = row.projects as unknown as { name: string } | null;
    let daysOverdue = 0;
    if (row.due_date && row.status !== "PAID" && row.status !== "PAIDOFF") {
      const due = new Date(row.due_date);
      due.setHours(0, 0, 0, 0);
      daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      customerName: row.customer_name ?? null,
      projectName: projectData?.name ?? null,
      totalNet: Number(row.total_net) || 0,
      totalGross: Number(row.total_gross) || 0,
      invoiceDate: row.invoice_date,
      dueDate: row.due_date,
      status: row.status,
      paidAmount: Number(row.paid_amount) || 0,
      daysOverdue: Math.max(daysOverdue, 0),
      invoiceType: row.invoice_type,
    };
  });
}

export async function fetchOpenChangeOrders(): Promise<ChangeOrderRow[]> {
  const { data, error } = await supabase
    .from("change_orders")
    .select("id, change_order_number, title, project_id, amount_net, status, submitted_at, approved_at, projects(name)")
    .in("status", ["APPROVED", "APPROVED_BY_CUSTOMER", "SUBMITTED", "PENDING_APPROVAL", "PENDING_CUSTOMER"])
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const projectData = row.projects as unknown as { name: string } | null;
    return {
      id: row.id,
      changeOrderNumber: row.change_order_number,
      title: row.title,
      projectName: projectData?.name ?? null,
      amountNet: Number(row.amount_net) || 0,
      status: row.status,
      submittedAt: row.submitted_at,
      approvedAt: row.approved_at,
    };
  });
}
