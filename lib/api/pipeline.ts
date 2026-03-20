import { supabase } from "@/lib/supabase";

// --- Types ---

export type PipelineRunStatus = "running" | "completed" | "stopped" | "failed";
export type PipelineStepStatus = "running" | "completed" | "stopped" | "failed" | "skipped";

export interface PipelineRun {
  id: string;
  project_id: string;
  status: PipelineRunStatus;
  current_agent: string | null;
  agents_completed: string[];
  stopped_by_agent: string | null;
  stop_reason: string | null;
  result_summary: Record<string, any> | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface PipelineStep {
  id: string;
  run_id: string;
  agent_name: string;
  step_order: number;
  status: PipelineStepStatus;
  input_data: Record<string, any> | null;
  output_data: Record<string, any> | null;
  warnings: string[];
  errors: string[];
  duration_ms: number | null;
  started_at: string;
  completed_at: string | null;
}

// --- Agent display config ---

export const AGENT_STEPS = [
  { key: "zeitpruefer", label: "Zeitprüfer", icon: "time-outline" },
  { key: "plausibility", label: "Plausibilität", icon: "shield-checkmark-outline" },
  { key: "material", label: "Material", icon: "cube-outline" },
  { key: "einsatzplaner", label: "Einsatzplaner", icon: "people-outline" },
  { key: "freigabe", label: "Freigabe", icon: "checkmark-done-outline" },
] as const;

// --- Queries ---

export async function fetchLatestPipelineRun(projectId: string): Promise<PipelineRun | null> {
  const { data, error } = await supabase
    .from("pipeline_runs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as PipelineRun | null;
}

export async function fetchPipelineSteps(runId: string): Promise<PipelineStep[]> {
  const { data, error } = await supabase
    .from("pipeline_steps")
    .select("*")
    .eq("run_id", runId)
    .order("step_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as PipelineStep[];
}

// --- Readiness check ---

export interface ReadinessItem {
  key: string;
  label: string;
  ok: boolean;
  hint: string;
}

export interface ReadinessResult {
  ready: boolean;
  items: ReadinessItem[];
}

export async function checkPipelineReadiness(projectId: string): Promise<ReadinessResult> {
  const [projectRes, offersRes, inspectionsRes] = await Promise.all([
    supabase
      .from("projects")
      .select("planned_start, planned_end")
      .eq("id", projectId)
      .single(),
    supabase
      .from("offers")
      .select("id, offer_positions(id)")
      .eq("project_id", projectId)
      .is("deleted_at", null),
    supabase
      .from("inspection_protocols")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .or("status.eq.completed,finalized_at.not.is.null")
  ]);

  const project = projectRes.data;
  const offers = offersRes.data ?? [];
  const offerCount = offers.length;
  const positionCount = offers.reduce((sum, o: any) => sum + (o.offer_positions?.length ?? 0), 0);
  const inspectionDoneCount = inspectionsRes.count ?? 0;

  const items: ReadinessItem[] = [
    {
      key: "inspection",
      label: "Aufmaß / Erstbegehung",
      ok: inspectionDoneCount > 0,
      hint: "Erstbegehung abschließen, damit Positionen vorhanden sind",
    },
    {
      key: "offer",
      label: "Angebot mit Positionen",
      ok: offerCount > 0 && positionCount > 0,
      hint: offerCount === 0
        ? "Ein Angebot erstellen"
        : "Positionen zum Angebot hinzufügen",
    },
    {
      key: "dates",
      label: "Start- und Enddatum",
      ok: !!project?.planned_start && !!project?.planned_end,
      hint: !project?.planned_start && !project?.planned_end
        ? "Start- und Enddatum im Projekt eintragen"
        : !project?.planned_start
        ? "Startdatum eintragen"
        : "Enddatum eintragen",
    },
  ];

  return {
    ready: items.every((i) => i.ok),
    items,
  };
}

export async function startAutoPlan(projectId: string): Promise<{ success: boolean; error?: string; schedule?: any; material?: any }> {
  const { data, error } = await supabase.rpc("auto_plan_full", { p_project_id: projectId });
  if (error) throw error;
  return data as any;
}

// --- Pipeline status for project list ---

export async function fetchPipelineStatusBatch(projectIds: string[]): Promise<Record<string, PipelineRunStatus | "not_started">> {
  if (projectIds.length === 0) return {};

  const { data, error } = await supabase
    .from("pipeline_runs")
    .select("project_id, status, created_at")
    .in("project_id", projectIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const result: Record<string, PipelineRunStatus | "not_started"> = {};
  for (const pid of projectIds) {
    result[pid] = "not_started";
  }

  // Take only the latest run per project
  const seen = new Set<string>();
  for (const row of data ?? []) {
    if (!seen.has(row.project_id)) {
      seen.add(row.project_id);
      result[row.project_id] = row.status as PipelineRunStatus;
    }
  }

  return result;
}
