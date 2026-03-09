import { useQuery } from "@tanstack/react-query";
import { fetchPendingApprovals } from "@/lib/api/approvals";
import { queryKeys } from "@/lib/query-keys";

export function useApprovals() {
  return useQuery({
    queryKey: queryKeys.approvals.list(),
    queryFn: fetchPendingApprovals,
  });
}
