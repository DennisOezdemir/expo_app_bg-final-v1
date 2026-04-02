import { supabase } from "@/lib/supabase";
import type { TeamMemberRow } from "./team";

export interface SubcontractorRow {
  id: string;
  name: string;
  short_name: string | null;
  contact_person: string | null;
  trades: string[] | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
}

/**
 * Eigene Monteure nach Gewerk gefiltert.
 * Gewerk=NULL Mitglieder (Polier, BL) werden auch angezeigt.
 */
export async function fetchTeamForTrade(trade: string): Promise<TeamMemberRow[]> {
  const { data, error } = await supabase
    .from("team_members_public")
    .select(
      "id, name, initials, role, gewerk, active, is_active, sort_order, skill_level, skills, max_hours_per_week"
    )
    .eq("active", true)
    .order("sort_order")
    .order("name");

  if (error) throw error;
  if (!data) return [];

  const tradeLower = trade.toLowerCase();
  return data
    .map((member: any) => ({
      id: member.id,
      name: member.name,
      initials: member.initials ?? null,
      role: member.role ?? null,
      gewerk: member.gewerk ?? null,
      active: !!member.active,
      is_active: !!member.is_active,
      sort_order: Number(member.sort_order ?? 0),
      email: member.email ?? null,
      phone: member.phone ?? null,
      hourly_rate: member.hourly_rate ?? null,
      skill_level: member.skill_level ?? null,
      skills: member.skills ?? null,
      max_hours_per_week: member.max_hours_per_week ?? null,
    }))
    .filter((m) => !m.gewerk || m.gewerk.toLowerCase() === tradeLower);
}

/**
 * Nachunternehmer nach Trade gefiltert.
 * NUs mit 'Sonstiges' im trades-Array werden auch angezeigt.
 */
export async function fetchSubcontractorsForTrade(trade: string): Promise<SubcontractorRow[]> {
  const { data, error } = await supabase
    .from("subcontractors")
    .select("id, name, short_name, contact_person, trades, phone, email, is_active")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  if (!data) return [];

  const tradeLower = trade.toLowerCase();
  return data.filter((s) => {
    if (!s.trades || s.trades.length === 0) return false;
    return s.trades.some(
      (t: string) => t.toLowerCase() === tradeLower || t === "Sonstiges"
    );
  });
}

/**
 * Team-Mitglied einer Position zuweisen (Eigenleistung)
 */
export async function assignTeamToPosition(
  positionId: string,
  teamMemberId: string
): Promise<void> {
  const { error } = await supabase
    .from("offer_positions")
    .update({
      assigned_team_member_id: teamMemberId,
      assigned_subcontractor_id: null,
      assignment_type: "eigen",
      updated_at: new Date().toISOString(),
    })
    .eq("id", positionId);
  if (error) throw error;
}

/**
 * Nachunternehmer einer Position zuweisen (Fremdleistung)
 */
export async function assignSubcontractorToPosition(
  positionId: string,
  subcontractorId: string
): Promise<void> {
  const { error } = await supabase
    .from("offer_positions")
    .update({
      assigned_team_member_id: null,
      assigned_subcontractor_id: subcontractorId,
      assignment_type: "fremd",
      updated_at: new Date().toISOString(),
    })
    .eq("id", positionId);
  if (error) throw error;
}

/**
 * Team-Mitglied mehreren Positionen zuweisen (Duplikat-Fall)
 */
export async function assignTeamToPositions(
  positionIds: string[],
  teamMemberId: string
): Promise<void> {
  for (const posId of positionIds) {
    await assignTeamToPosition(posId, teamMemberId);
  }
}

/**
 * Nachunternehmer mehreren Positionen zuweisen (Duplikat-Fall)
 */
export async function assignSubcontractorToPositions(
  positionIds: string[],
  subcontractorId: string
): Promise<void> {
  for (const posId of positionIds) {
    await assignSubcontractorToPosition(posId, subcontractorId);
  }
}
