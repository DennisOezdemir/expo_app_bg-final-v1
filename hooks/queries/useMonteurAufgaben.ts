import { useQuery } from "@tanstack/react-query";
import { fetchMonteurAufgaben, fetchTeamMemberByEmail } from "@/lib/api/monteur";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Resolve auth user → team_member by email
 */
export function useTeamMember() {
  const { user } = useAuth();
  const email = user?.email ?? "";

  return useQuery({
    queryKey: queryKeys.monteur.teamMember(email),
    queryFn: () => fetchTeamMemberByEmail(email),
    enabled: !!email,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Aufgaben des eingeloggten Monteurs (schedule_phases + project info)
 */
export function useMonteurAufgaben(teamMemberId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.monteur.aufgaben(teamMemberId ?? ""),
    queryFn: () => fetchMonteurAufgaben(teamMemberId!),
    enabled: !!teamMemberId,
  });
}
