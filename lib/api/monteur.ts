import { supabase } from "@/lib/supabase";

export interface MonteurAufgabe {
  id: string;
  phase_number: number;
  name: string;
  trade: string;
  start_date: string;
  end_date: string;
  status: string;
  progress: number;
  estimated_hours: number | null;
  project_id: string;
  project_name: string;
  object_street: string;
  object_city: string;
}

export interface TeamMemberInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  gewerk: string | null;
}

/**
 * Resolve auth user -> team_members row
 */
export async function fetchCurrentTeamMember(authUserId: string): Promise<TeamMemberInfo | null> {
  const { data, error } = await supabase
    .from("team_members")
    .select("id, name, email, role, gewerk")
    .eq("auth_id", authUserId)
    .eq("active", true)
    .maybeSingle();

  if (error) throw error;
  return data as TeamMemberInfo | null;
}

/**
 * Aufgaben für einen Monteur: schedule_phases mit zugewiesenem team_member,
 * gefiltert auf aktuelle/kommende Phasen (nicht abgeschlossen).
 */
export async function fetchMonteurAufgaben(teamMemberId: string): Promise<MonteurAufgabe[]> {
  const { data, error } = await supabase
    .from("schedule_phases")
    .select(`
      id,
      phase_number,
      name,
      trade,
      start_date,
      end_date,
      status,
      progress,
      estimated_hours,
      project_id,
      projects!inner (
        name,
        object_street,
        object_city
      )
    `)
    .eq("assigned_team_member_id", teamMemberId)
    .in("status", ["planned", "proposed", "in_progress"])
    .order("start_date", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    phase_number: row.phase_number,
    name: row.name,
    trade: row.trade,
    start_date: row.start_date,
    end_date: row.end_date,
    status: row.status,
    progress: row.progress ?? 0,
    estimated_hours: row.estimated_hours ? Number(row.estimated_hours) : null,
    project_id: row.project_id,
    project_name: row.projects.name,
    object_street: row.projects.object_street,
    object_city: row.projects.object_city,
  }));
}
