import { useQuery } from "@tanstack/react-query";
import { fetchDashboardActions } from "@/lib/api/dashboard-actions";
import { queryKeys } from "@/lib/query-keys";

export function useDashboardActions() {
  return useQuery({
    queryKey: queryKeys.dashboard.actions(),
    queryFn: fetchDashboardActions,
  });
}
