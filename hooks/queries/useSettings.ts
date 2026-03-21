import { useQuery } from "@tanstack/react-query";
import {
  fetchCompanySettings,
  fetchClients,
  fetchTeamMembers,
  fetchTeamMemberCount,
} from "@/lib/api/settings";
import { queryKeys } from "@/lib/query-keys";

export function useCompanySettings() {
  return useQuery({
    queryKey: queryKeys.settings.company(),
    queryFn: fetchCompanySettings,
  });
}

export function useClients() {
  return useQuery({
    queryKey: queryKeys.clients.list(),
    queryFn: fetchClients,
  });
}

export function useTeamMembers() {
  return useQuery({
    queryKey: queryKeys.settings.team(),
    queryFn: fetchTeamMembers,
  });
}

export function useTeamMemberCount() {
  return useQuery({
    queryKey: [...queryKeys.settings.team(), "count"],
    queryFn: fetchTeamMemberCount,
  });
}
