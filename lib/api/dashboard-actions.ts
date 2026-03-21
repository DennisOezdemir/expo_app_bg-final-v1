import { supabase } from "@/lib/supabase";

export type ActionSeverity = "rot" | "gelb";
export type ActionType =
  | "approval"
  | "overdue_invoice"
  | "missing_material"
  | "no_schedule";

export interface DashboardAction {
  id: string;
  type: ActionType;
  severity: ActionSeverity;
  title: string;
  subtitle: string;
  route: string;
}

export interface DashboardActionsData {
  actions: DashboardAction[];
  totalCount: number;
  newToday: number;
}

export async function fetchDashboardActions(): Promise<DashboardActionsData> {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const [
    pendingApprovalsRes,
    overdueInvoicesRes,
    materialNeedsRes,
    noScheduleRes,
    newApprovalsRes,
  ] = await Promise.all([
    // Freigaben die seit >24h warten
    supabase
      .from("approvals")
      .select("id, approval_type, request_summary, requested_at")
      .eq("status", "PENDING")
      .lt("requested_at", twentyFourHoursAgo.toISOString())
      .order("requested_at", { ascending: true })
      .limit(5),

    // Ueberfaellige Rechnungen
    supabase
      .from("purchase_invoices")
      .select("id, invoice_number, supplier_name, total_gross, due_date")
      .lt("due_date", now.toISOString())
      .not("status", "in", "(PAID,CANCELLED)")
      .order("due_date", { ascending: true })
      .limit(5),

    // Material fuer naechste Woche fehlt
    supabase
      .from("project_material_needs")
      .select("id, project_id, label, needed_by, status, material_type")
      .lt("needed_by", nextWeek.toISOString())
      .in("status", ["planned"])
      .order("needed_by", { ascending: true })
      .limit(5),

    // Aktive Projekte ohne geplanten Start
    supabase
      .from("projects")
      .select("id, project_number, name, status, planned_start")
      .in("status", ["ACTIVE", "IN_PROGRESS", "PLANNING"])
      .is("planned_start", null)
      .limit(5),

    // Trend: neue Freigaben seit heute 00:00
    supabase
      .from("approvals")
      .select("id", { count: "exact", head: true })
      .eq("status", "PENDING")
      .gte("requested_at", todayStart.toISOString()),
  ]);

  const actions: DashboardAction[] = [];

  // Freigaben
  if (!pendingApprovalsRes.error && pendingApprovalsRes.data) {
    for (const a of pendingApprovalsRes.data) {
      const waitH = Math.floor(
        (now.getTime() - new Date(a.requested_at).getTime()) / 3_600_000
      );
      const days = Math.floor(waitH / 24);
      actions.push({
        id: `approval-${a.id}`,
        type: "approval",
        severity: waitH > 48 ? "rot" : "gelb",
        title: `Freigabe wartet ${days > 0 ? days + "d" : waitH + "h"}`,
        subtitle: a.request_summary || a.approval_type || "Ausstehend",
        route: "/(tabs)/freigaben",
      });
    }
  }

  // Ueberfaellige Rechnungen
  if (!overdueInvoicesRes.error && overdueInvoicesRes.data) {
    for (const inv of overdueInvoicesRes.data) {
      const overdueDays = Math.floor(
        (now.getTime() - new Date(inv.due_date).getTime()) / 86_400_000
      );
      actions.push({
        id: `invoice-${inv.id}`,
        type: "overdue_invoice",
        severity: overdueDays > 14 ? "rot" : "gelb",
        title: `Rechnung ${overdueDays}d ueberfaellig`,
        subtitle: `${inv.supplier_name ?? "Unbekannt"} — ${inv.invoice_number ?? ""}`,
        route: "/finanzen",
      });
    }
  }

  // Material
  if (!materialNeedsRes.error && materialNeedsRes.data) {
    for (const mat of materialNeedsRes.data) {
      const daysUntil = Math.ceil(
        (new Date(mat.needed_by!).getTime() - now.getTime()) / 86_400_000
      );
      actions.push({
        id: `material-${mat.id}`,
        type: "missing_material",
        severity: daysUntil <= 2 ? "rot" : "gelb",
        title:
          daysUntil <= 0
            ? "Material ueberfaellig!"
            : `Material in ${daysUntil}d noetig`,
        subtitle: mat.label ?? mat.material_type ?? "Material fehlt",
        route: "/(tabs)/material",
      });
    }
  }

  // Projekte ohne Termin
  if (!noScheduleRes.error && noScheduleRes.data) {
    for (const proj of noScheduleRes.data) {
      actions.push({
        id: `schedule-${proj.id}`,
        type: "no_schedule",
        severity: "gelb",
        title: "Kein Starttermin",
        subtitle: proj.name ?? proj.project_number ?? "Projekt",
        route: `/project/${proj.id}`,
      });
    }
  }

  // Sortierung: rot vor gelb
  actions.sort((a, b) => {
    if (a.severity === "rot" && b.severity !== "rot") return -1;
    if (a.severity !== "rot" && b.severity === "rot") return 1;
    return 0;
  });

  return {
    actions: actions.slice(0, 5),
    totalCount: actions.length,
    newToday: newApprovalsRes.count ?? 0,
  };
}
