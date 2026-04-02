import { useQuery } from "@tanstack/react-query";
import { fetchCurrentTeamMember, fetchMonteurAufgaben } from "@/lib/api/monteur";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Resolve auth user → team_member by email
 */
export function useTeamMember() {
  const { user } = useAuth();
  const authUserId = user?.id ?? "";

  return useQuery({
    queryKey: queryKeys.monteur.teamMember(authUserId),
    queryFn: () => fetchCurrentTeamMember(authUserId),
    enabled: !!authUserId,
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
