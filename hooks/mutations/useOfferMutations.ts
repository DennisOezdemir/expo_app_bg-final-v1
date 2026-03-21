import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addOfferPosition,
  updateOfferPosition,
  deleteOfferPosition,
  addOfferSection,
  saveOffer,
  type AddPositionInput,
  type UpdatePositionInput,
  type AddSectionInput,
  type SaveOfferInput,
} from "@/lib/api/offers";
import { queryKeys } from "@/lib/query-keys";

export function useAddPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddPositionInput) => addOfferPosition(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.offers.withSections(variables.offer_id),
      });
    },
  });
}

export function useUpdatePosition(offerId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdatePositionInput) => updateOfferPosition(input),
    onSuccess: () => {
      if (offerId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.offers.withSections(offerId),
        });
      }
    },
  });
}

export function useDeletePosition(offerId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (posId: string) => deleteOfferPosition(posId),
    onSuccess: () => {
      if (offerId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.offers.withSections(offerId),
        });
      }
    },
  });
}

export function useAddSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddSectionInput) => addOfferSection(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.offers.withSections(variables.offer_id),
      });
    },
  });
}

export function useSaveOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveOfferInput) => saveOffer(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.offers.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.offers.withSections(variables.id),
      });
    },
  });
}
