import { supabase } from "@/lib/supabase";

export interface DashboardMetrics {
  activeProjects: number;
  criticalProjects: number;
  pendingApprovals: number;
  openOffers: number;
  totalOfferVolume: number;
  teamCount: number;
  openInspections: number;
  openInvoices: number;
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const [
    activeProjectsRes,
    pendingApprovalsRes,
    openOffersRes,
    offerVolumeRes,
    teamCountRes,
    openInspectionsRes,
    openInvoicesRes,
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("status, progress_percent", { count: "exact" }),
    supabase
      .from("approvals")
      .select("id", { count: "exact", head: true })
      .eq("status", "PENDING"),
    supabase
      .from("offers")
      .select("id", { count: "exact", head: true })
      .in("status", ["DRAFT", "SENT"]),
    supabase
      .from("offers")
      .select("total_net")
      .not("total_net", "is", null),
    supabase
      .from("team_members_public")
      .select("id", { count: "exact", head: true })
      .eq("active", true),
    supabase
      .from("inspection_protocols")
      .select("id", { count: "exact", head: true })
      .neq("status", "completed"),
    supabase
      .from("sales_invoices")
      .select("id", { count: "exact", head: true })
      .in("status", ["DRAFT", "OPEN", "SENT"]),
  ]);

  if (activeProjectsRes.error) throw activeProjectsRes.error;
  if (pendingApprovalsRes.error) throw pendingApprovalsRes.error;
  if (openOffersRes.error) throw openOffersRes.error;
  if (offerVolumeRes.error) throw offerVolumeRes.error;
  if (teamCountRes.error) throw teamCountRes.error;
  if (openInspectionsRes.error) throw openInspectionsRes.error;
  if (openInvoicesRes.error) throw openInvoicesRes.error;

  const projectRows = activeProjectsRes.data ?? [];
  const activeProjects = projectRows.filter((project) => (project.status ?? "") !== "COMPLETED" && (project.status ?? "") !== "ARCHIVED").length;
  const criticalProjects = projectRows.filter((project) => {
    const progress = project.progress_percent ?? 0;
    return (project.status ?? "") !== "COMPLETED" && progress > 0 && progress < 25;
  }).length;
  const totalOfferVolume = (offerVolumeRes.data ?? []).reduce((sum, offer) => sum + (Number(offer.total_net) || 0), 0);

  return {
    activeProjects,
    criticalProjects,
    pendingApprovals: pendingApprovalsRes.count ?? 0,
    openOffers: openOffersRes.count ?? 0,
    totalOfferVolume,
    teamCount: teamCountRes.count ?? 0,
    openInspections: openInspectionsRes.count ?? 0,
    openInvoices: openInvoicesRes.count ?? 0,
  };
}
