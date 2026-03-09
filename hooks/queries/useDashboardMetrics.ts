import { useQuery } from "@tanstack/react-query";
import { fetchDashboardMetrics } from "@/lib/api/dashboard";
import { queryKeys } from "@/lib/query-keys";

export function useDashboardMetrics() {
  return useQuery({
    queryKey: queryKeys.dashboard.metrics(),
    queryFn: fetchDashboardMetrics,
  });
}
