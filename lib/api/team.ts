import { supabase } from "@/lib/supabase";

export interface TeamMemberRow {
  id: string;
  name: string;
  initials: string | null;
  role: string | null;
  gewerk: string | null;
  active: boolean;
  is_active: boolean;
  sort_order: number;
  email: string | null;
  phone: string | null;
  hourly_rate: number | null;
  skill_level: string | null;
  skills: string[] | null;
  max_hours_per_week: number | null;
}

export async function fetchTeamMembers(): Promise<TeamMemberRow[]> {
  const { data, error } = await supabase
    .from("team_members")
    .select(
      "id, name, initials, role, gewerk, active, is_active, sort_order, email, phone, hourly_rate, skill_level, skills, max_hours_per_week"
    )
    .eq("active", true)
    .order("sort_order")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function fetchTeamMember(id: string): Promise<TeamMemberRow> {
  const { data, error } = await supabase
    .from("team_members")
    .select(
      "id, name, initials, role, gewerk, active, is_active, sort_order, email, phone, hourly_rate, skill_level, skills, max_hours_per_week"
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export interface UpdateTeamMemberInput {
  name?: string;
  role?: string;
  gewerk?: string;
  email?: string;
  phone?: string;
  hourly_rate?: number;
  active?: boolean;
}

export async function updateTeamMember(
  id: string,
  input: UpdateTeamMemberInput
): Promise<TeamMemberRow> {
  const { data, error } = await supabase
    .from("team_members")
    .update(input)
    .eq("id", id)
    .select(
      "id, name, initials, role, gewerk, active, is_active, sort_order, email, phone, hourly_rate, skill_level, skills, max_hours_per_week"
    )
    .single();

  if (error) throw error;
  return data;
}

export interface ProfileStats {
  totalProjects: number;
  activeProjects: number;
  teamCount: number;
}

export async function fetchProfileStats(): Promise<ProfileStats> {
  const [projectsRes, teamRes] = await Promise.all([
    supabase
      .from("projects")
      .select("status"),
    supabase
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("active", true),
  ]);

  if (projectsRes.error) throw projectsRes.error;
  if (teamRes.error) throw teamRes.error;

  const projects = projectsRes.data ?? [];
  const inactive = new Set(["COMPLETED", "CANCELLED", "ARCHIVED"]);

  return {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => !inactive.has(p.status ?? "")).length,
    teamCount: teamRes.count ?? 0,
  };
}
