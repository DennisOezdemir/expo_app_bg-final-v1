import { useQuery } from "@tanstack/react-query";
import {
  fetchWeekSchedule,
  fetchMonthSchedule,
  fetchProjectPlanning,
} from "@/lib/api/planning";
import { queryKeys } from "@/lib/query-keys";

export function useWeekSchedule(weekStart: string, weekEnd: string) {
  return useQuery({
    queryKey: queryKeys.planning.week(weekStart, weekEnd),
    queryFn: () => fetchWeekSchedule(weekStart, weekEnd),
    enabled: !!weekStart && !!weekEnd,
  });
}

export function useMonthSchedule(year: number, month: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.planning.month(year, month),
    queryFn: () => fetchMonthSchedule(year, month),
    enabled,
  });
}

export function useProjectPlanning(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.planning.projectDetail(projectId ?? ""),
    queryFn: () => fetchProjectPlanning(projectId!),
    enabled: !!projectId,
  });
}
