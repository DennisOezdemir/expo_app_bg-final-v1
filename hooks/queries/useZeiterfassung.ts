import { useQuery } from "@tanstack/react-query";
import { fetchTodayEntries, fetchWeekEntries } from "@/lib/api/zeiterfassung";
import { queryKeys } from "@/lib/query-keys";

export function useTodayEntries(teamMemberId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.zeiterfassung.today(teamMemberId ?? ""),
    queryFn: () => fetchTodayEntries(teamMemberId!),
    enabled: !!teamMemberId,
  });
}

export function useWeekEntries(teamMemberId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.zeiterfassung.week(teamMemberId ?? ""),
    queryFn: () => fetchWeekEntries(teamMemberId!),
    enabled: !!teamMemberId,
  });
}
