import { useQuery } from "@tanstack/react-query";
import {
  fetchFinanceOverview,
  fetchProjectControlling,
  fetchCostsByCategory,
  fetchOpenPurchaseInvoices,
  fetchSalesInvoices,
  fetchOpenChangeOrders,
} from "@/lib/api/finance";
import { queryKeys } from "@/lib/query-keys";

export function useFinanceOverview() {
  return useQuery({
    queryKey: queryKeys.finance.overview(),
    queryFn: fetchFinanceOverview,
  });
}

export function useProjectControlling() {
  return useQuery({
    queryKey: queryKeys.finance.projectControlling(),
    queryFn: fetchProjectControlling,
  });
}

export function useCostsByCategory() {
  return useQuery({
    queryKey: queryKeys.finance.costsByCategory(),
    queryFn: fetchCostsByCategory,
  });
}

export function useOpenPurchaseInvoices() {
  return useQuery({
    queryKey: queryKeys.finance.purchaseInvoices(),
    queryFn: fetchOpenPurchaseInvoices,
  });
}

export function useSalesInvoices() {
  return useQuery({
    queryKey: queryKeys.finance.salesInvoices(),
    queryFn: fetchSalesInvoices,
  });
}

export function useOpenChangeOrders() {
  return useQuery({
    queryKey: queryKeys.finance.changeOrders(),
    queryFn: fetchOpenChangeOrders,
  });
}
