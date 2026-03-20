import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  fetchInvoices,
  fetchInvoiceDetail,
  fetchPreviousAbschlaege,
  fetchClients,
  fetchProjectOptions,
  fetchOffersByProject,
  fetchOfferPositions,
  fetchTextBlocks,
} from "@/lib/api/invoices";

export function useInvoices() {
  return useQuery({
    queryKey: queryKeys.invoices.list(),
    queryFn: fetchInvoices,
  });
}

export function useInvoiceDetail(invoiceId?: string) {
  return useQuery({
    queryKey: queryKeys.invoices.detail(invoiceId ?? ""),
    queryFn: () => fetchInvoiceDetail(invoiceId ?? ""),
    enabled: !!invoiceId,
  });
}

export function usePreviousAbschlaege(projectId?: string, excludeInvoiceId?: string) {
  return useQuery({
    queryKey: queryKeys.invoices.previousAbschlaege(projectId ?? ""),
    queryFn: () => fetchPreviousAbschlaege(projectId!, excludeInvoiceId),
    enabled: !!projectId,
  });
}

export function useClients() {
  return useQuery({
    queryKey: queryKeys.clients.list(),
    queryFn: fetchClients,
  });
}

export function useProjectOptions() {
  return useQuery({
    queryKey: ["projectOptions"] as const,
    queryFn: fetchProjectOptions,
  });
}

export function useOffersByProject(projectId?: string) {
  return useQuery({
    queryKey: ["offers", "byProject", projectId] as const,
    queryFn: () => fetchOffersByProject(projectId!),
    enabled: !!projectId,
  });
}

export function useOfferPositions(offerId?: string) {
  return useQuery({
    queryKey: ["offerPositions", offerId] as const,
    queryFn: () => fetchOfferPositions(offerId!),
    enabled: !!offerId,
  });
}

export function useTextBlocks(category?: string) {
  return useQuery({
    queryKey: category ? queryKeys.textBlocks.byCategory(category) : queryKeys.textBlocks.all,
    queryFn: () => fetchTextBlocks(category),
  });
}
