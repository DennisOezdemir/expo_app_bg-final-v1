import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createChangeOrder,
  submitChangeOrder,
  approveChangeOrder,
  rejectChangeOrder,
  type CreateChangeOrderInput,
} from "@/lib/api/change-orders";
import { queryKeys } from "@/lib/query-keys";

export function useCreateChangeOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateChangeOrderInput) => createChangeOrder(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.changeOrders.byProject(variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.finance.changeOrders(),
      });
    },
  });
}

export function useSubmitChangeOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (changeOrderId: string) => submitChangeOrder(changeOrderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.changeOrders.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.finance.changeOrders(),
      });
    },
  });
}

export function useApproveChangeOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      approvedBy,
    }: {
      id: string;
      approvedBy?: string;
    }) => approveChangeOrder(id, approvedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.changeOrders.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.finance.changeOrders(),
      });
    },
  });
}

export function useRejectChangeOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      reason,
    }: {
      id: string;
      reason?: string;
    }) => rejectChangeOrder(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.changeOrders.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.finance.changeOrders(),
      });
    },
  });
}
