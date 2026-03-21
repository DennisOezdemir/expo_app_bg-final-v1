import { useQuery } from "@tanstack/react-query";
import { fetchTeamMembers, fetchTeamMember, fetchProfileStats } from "@/lib/api/team";
import { queryKeys } from "@/lib/query-keys";

export function useTeamMembers() {
  return useQuery({
    queryKey: queryKeys.team.list(),
    queryFn: fetchTeamMembers,
  });
}

export function useTeamMember(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.team.detail(id ?? ""),
    queryFn: () => fetchTeamMember(id!),
    enabled: !!id,
  });
}

export function useProfileStats() {
  return useQuery({
    queryKey: queryKeys.team.stats(),
    queryFn: fetchProfileStats,
  });
}
