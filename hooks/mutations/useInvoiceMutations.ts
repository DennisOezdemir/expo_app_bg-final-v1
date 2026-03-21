import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  createInvoice,
  updateInvoice,
  deleteInvoice,
  upsertInvoiceItems,
  deleteInvoiceItem,
  recalcInvoiceTotals,
  duplicateInvoice,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
  type UpsertInvoiceItemInput,
} from "@/lib/api/invoices";

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => createInvoice(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
    },
  });
}

export function useUpdateInvoice(invoiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInvoiceInput) => updateInvoice(invoiceId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.list() });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => deleteInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
    },
  });
}

export function useUpsertInvoiceItems(invoiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: UpsertInvoiceItemInput[]) => upsertInvoiceItems(items),
    onSuccess: async () => {
      await recalcInvoiceTotals(invoiceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(invoiceId) });
    },
  });
}

export function useDeleteInvoiceItem(invoiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => deleteInvoiceItem(itemId),
    onSuccess: async () => {
      await recalcInvoiceTotals(invoiceId);
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(invoiceId) });
    },
  });
}

export function useDuplicateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => duplicateInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
    },
  });
}

export function useRecalcTotals(invoiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => recalcInvoiceTotals(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(invoiceId) });
    },
  });
}
