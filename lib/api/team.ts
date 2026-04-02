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

function toTeamMemberRow(row: Record<string, any>): TeamMemberRow {
  return {
    id: row.id,
    name: row.name,
    initials: row.initials ?? null,
    role: row.role ?? null,
    gewerk: row.gewerk ?? null,
    active: !!row.active,
    is_active: !!row.is_active,
    sort_order: Number(row.sort_order ?? 0),
    email: row.email ?? null,
    phone: row.phone ?? null,
    hourly_rate: row.hourly_rate ?? null,
    skill_level: row.skill_level ?? null,
    skills: row.skills ?? null,
    max_hours_per_week: row.max_hours_per_week ?? null,
  };
}

export async function fetchTeamMembers(): Promise<TeamMemberRow[]> {
  const { data, error } = await supabase
    .from("team_members_public")
    .select(
      "id, name, initials, role, gewerk, active, is_active, sort_order, skill_level, skills, max_hours_per_week"
    )
    .eq("active", true)
    .order("sort_order")
    .order("name");

  if (error) throw error;
  return (data ?? []).map((row) => toTeamMemberRow(row as Record<string, any>));
}

export async function fetchTeamMember(id: string): Promise<TeamMemberRow> {
  const { data, error } = await supabase
    .from("team_members_public")
    .select(
      "id, name, initials, role, gewerk, active, is_active, sort_order, skill_level, skills, max_hours_per_week"
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return toTeamMemberRow(data as Record<string, any>);
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
      .from("team_members_public")
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
