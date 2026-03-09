import { useQuery } from "@tanstack/react-query";
import { fetchPendingApprovalCount } from "@/lib/api/approvals";
import { queryKeys } from "@/lib/query-keys";

export function usePendingApprovalCount() {
  return useQuery({
    queryKey: queryKeys.approvals.count(),
    queryFn: fetchPendingApprovalCount,
  });
}
