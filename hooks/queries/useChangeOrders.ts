import { useQuery } from "@tanstack/react-query";
import {
  fetchProjectChangeOrders,
  fetchChangeOrderDetail,
} from "@/lib/api/change-orders";
import { queryKeys } from "@/lib/query-keys";

export function useProjectChangeOrders(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.changeOrders.byProject(projectId ?? ""),
    queryFn: () => fetchProjectChangeOrders(projectId!),
    enabled: !!projectId,
  });
}

export function useChangeOrderDetail(changeOrderId?: string) {
  return useQuery({
    queryKey: queryKeys.changeOrders.detail(changeOrderId ?? ""),
    queryFn: () => fetchChangeOrderDetail(changeOrderId!),
    enabled: !!changeOrderId,
  });
}
