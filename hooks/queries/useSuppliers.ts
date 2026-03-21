import { useQuery } from "@tanstack/react-query";
import {
  fetchSuppliers,
  fetchSupplierArticles,
  fetchCompanySettings,
} from "@/lib/api/suppliers";
import { queryKeys } from "@/lib/query-keys";

export function useSuppliers() {
  return useQuery({
    queryKey: queryKeys.suppliers.all,
    queryFn: fetchSuppliers,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSupplierArticles(supplierId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.suppliers.articles(supplierId ?? ""),
    queryFn: () => fetchSupplierArticles(supplierId!),
    enabled: !!supplierId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompanySettings() {
  return useQuery({
    queryKey: queryKeys.suppliers.companySettings(),
    queryFn: fetchCompanySettings,
    staleTime: 10 * 60 * 1000,
  });
}
