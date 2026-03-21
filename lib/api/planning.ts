import { supabase } from "@/lib/supabase";

// ── Types ──

export interface SchedulePhase {
  id: string;
  project_id: string;
  trade: string;
  start_date: string;
  end_date: string;
  status: string;
  progress: number;
  estimated_qty: number | null;
  is_external: boolean;
  external_name: string | null;
  assigned_team_member_id: string | null;
  phase_number: number | null;
  team_members: { name: string; role: string; skills?: string[] } | null;
  projects: {
    project_number: string;
    name: string;
    object_street: string;
    object_city: string;
    status: string;
  } | null;
}

export interface UnassignedProjectRaw {
  id: string;
  project_number: string;
  name: string;
  object_street: string;
  status: string;
  planned_start: string | null;
}

export interface ProjectPlanningData {
  project: {
    id: string;
    project_number: string;
    name: string;
    object_street: string;
    planned_start: string | null;
    planned_end: string | null;
    status: string;
    inspection_date: string | null;
    handover_date: string | null;
  } | null;
  phases: any[];
  assignments: any[];
}

// ── Fetch Functions ──

export async function fetchWeekSchedule(
  weekStart: string,
  weekEnd: string
): Promise<{
  phases: SchedulePhase[];
  unassignedProjects: UnassignedProjectRaw[];
}> {
  const { data: phaseData, error: phaseErr } = await supabase
    .from("schedule_phases")
    .select(
      `*,
      team_members!assigned_team_member_id(name, role, skills),
      projects!project_id(project_number, name, object_street, object_city, status)`
    )
    .gte("end_date", weekStart)
    .lte("start_date", weekEnd)
    .order("start_date");

  if (phaseErr) throw phaseErr;

  const phases = (phaseData ?? []) as SchedulePhase[];

  // Projects in PLANNING/IN_PROGRESS without schedule_phases
  const { data: unassignedData } = await supabase
    .from("projects")
    .select("id, project_number, name, object_street, status, planned_start")
    .in("status", ["PLANNING", "IN_PROGRESS"])
    .order("created_at", { ascending: false });

  let unassignedProjects: UnassignedProjectRaw[] = [];

  if (unassignedData) {
    const projectsWithPhases = new Set(phases.map((p) => p.project_id));

    const { data: allPhasedProjects } = await supabase
      .from("schedule_phases")
      .select("project_id")
      .in(
        "project_id",
        unassignedData.map((p: any) => p.id)
      );

    const phasedIds = new Set(
      (allPhasedProjects || []).map((p: any) => p.project_id)
    );

    unassignedProjects = unassignedData.filter(
      (p: any) => !projectsWithPhases.has(p.id) && !phasedIds.has(p.id)
    ) as UnassignedProjectRaw[];
  }

  return { phases, unassignedProjects };
}

export async function fetchMonthSchedule(
  year: number,
  month: number
): Promise<SchedulePhase[]> {
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("schedule_phases")
    .select(
      `*,
      team_members!assigned_team_member_id(name, role),
      projects!project_id(project_number, name, object_street, object_city, status)`
    )
    .gte("end_date", monthStart)
    .lte("start_date", monthEnd)
    .order("start_date");

  if (error) throw error;
  return (data ?? []) as SchedulePhase[];
}

export async function fetchProjectPlanning(
  projectId: string
): Promise<ProjectPlanningData> {
  // Determine if id is UUID or project_number
  const isUuid = projectId.length === 36 && projectId.includes("-");

  const projectQuery = supabase
    .from("projects")
    .select(
      "id, project_number, name, object_street, planned_start, planned_end, status, inspection_date, handover_date"
    );

  const { data: proj } = isUuid
    ? await projectQuery.eq("id", projectId).single()
    : await projectQuery.eq("project_number", projectId).single();

  if (!proj) return { project: null, phases: [], assignments: [] };

  const { data: phases } = await supabase
    .from("schedule_phases")
    .select("*, team_members!assigned_team_member_id(name, role)")
    .eq("project_id", proj.id)
    .order("phase_number");

  const { data: assignments } = await supabase
    .from("project_assignments")
    .select("*, team_members!team_member_id(name, role)")
    .eq("project_id", proj.id);

  return {
    project: proj,
    phases: phases ?? [],
    assignments: assignments ?? [],
  };
}
