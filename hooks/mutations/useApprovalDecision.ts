import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveApproval, rejectApproval } from "@/lib/api/approvals";
import { queryKeys } from "@/lib/query-keys";

function useApprovalMutation(action: "approve" | "reject") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (approvalId: string) => action === "approve" ? approveApproval(approvalId) : rejectApproval(approvalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
    },
  });
}

export function useApproveApproval() {
  return useApprovalMutation("approve");
}

export function useRejectApproval() {
  return useApprovalMutation("reject");
}
