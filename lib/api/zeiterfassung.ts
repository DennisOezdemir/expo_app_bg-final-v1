import { supabase } from "@/lib/supabase";

export interface TimeEntry {
  id: string;
  project_id: string;
  team_member_id: string;
  date: string;
  hours: number;
  activity_type: string;
  trade: string | null;
  notes: string | null;
  approved: boolean;
  created_at: string;
  updated_at: string;
  // Joined project info
  project_name?: string;
  object_street?: string;
}

export interface CheckInInput {
  project_id: string;
  team_member_id: string;
  trade?: string;
}

export interface CheckOutInput {
  entry_id: string;
  hours: number;
}

/**
 * Heutige Zeiteinträge für einen Monteur
 */
export async function fetchTodayEntries(teamMemberId: string): Promise<TimeEntry[]> {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("time_entries")
    .select(`
      id, project_id, team_member_id, date, hours, activity_type,
      trade, notes, approved, created_at, updated_at,
      projects!inner ( name, object_street )
    `)
    .eq("team_member_id", teamMemberId)
    .eq("date", today)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    ...row,
    hours: Number(row.hours),
    project_name: row.projects?.name,
    object_street: row.projects?.object_street,
  }));
}

/**
 * Wocheneinträge für einen Monteur (Mo–So der aktuellen Woche)
 */
export async function fetchWeekEntries(teamMemberId: string): Promise<TimeEntry[]> {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=So, 1=Mo...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startDate = monday.toISOString().split("T")[0];
  const endDate = sunday.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("time_entries")
    .select(`
      id, project_id, team_member_id, date, hours, activity_type,
      trade, notes, approved, created_at, updated_at,
      projects!inner ( name, object_street )
    `)
    .eq("team_member_id", teamMemberId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    ...row,
    hours: Number(row.hours),
    project_name: row.projects?.name,
    object_street: row.projects?.object_street,
  }));
}

/**
 * Check-In: Neuen Zeiteintrag mit 0h anlegen
 */
export async function checkIn(input: CheckInInput): Promise<TimeEntry> {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("time_entries")
    .insert({
      project_id: input.project_id,
      team_member_id: input.team_member_id,
      date: today,
      hours: 0,
      activity_type: "work",
      trade: input.trade ?? null,
      notes: "checked_in",
    })
    .select()
    .single();

  if (error) throw error;
  return { ...data, hours: Number(data.hours) } as TimeEntry;
}

/**
 * Check-Out: Stunden aktualisieren
 */
export async function checkOut(input: CheckOutInput): Promise<TimeEntry> {
  const { data, error } = await supabase
    .from("time_entries")
    .update({
      hours: input.hours,
      notes: "checked_out",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.entry_id)
    .select()
    .single();

  if (error) throw error;
  return { ...data, hours: Number(data.hours) } as TimeEntry;
}
