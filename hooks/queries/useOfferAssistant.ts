import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  startBatchGeneration,
  approvePosition,
  editPosition,
  rejectPosition,
  approveAllPositions,
  commitAllPositions,
  fetchStagedPositions,
  type BatchResult,
  type ActionResult,
} from "@/lib/api/offer-assistant";

// ── Query Keys ──

export const assistantKeys = {
  all: ["offerAssistant"] as const,
  positions: (offerId: string) => ["offerAssistant", "positions", offerId] as const,
};

// ── Staged Positions Query ──

export function useStagedPositions(offerId: string) {
  return useQuery({
    queryKey: assistantKeys.positions(offerId),
    queryFn: () => fetchStagedPositions(offerId),
    enabled: !!offerId,
  });
}

// ── Mutations ──

export function useStartBatch(offerId: string) {
  const qc = useQueryClient();
  return useMutation<BatchResult, Error>({
    mutationFn: () => startBatchGeneration(offerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assistantKeys.positions(offerId) });
    },
  });
}

export function useApprovePosition(offerId: string) {
  const qc = useQueryClient();
  return useMutation<ActionResult, Error, { threadId: string; positionId: string }>({
    mutationFn: ({ threadId, positionId }) => approvePosition(offerId, threadId, positionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assistantKeys.positions(offerId) });
    },
  });
}

export function useEditPosition(offerId: string) {
  const qc = useQueryClient();
  return useMutation<ActionResult, Error, { threadId: string; positionId: string; finalText?: string; message?: string }>({
    mutationFn: ({ threadId, positionId, finalText, message }) =>
      editPosition(offerId, threadId, positionId, finalText, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assistantKeys.positions(offerId) });
    },
  });
}

export function useRejectPosition(offerId: string) {
  const qc = useQueryClient();
  return useMutation<ActionResult, Error, { threadId: string; positionId: string; reason?: string }>({
    mutationFn: ({ threadId, positionId, reason }) => rejectPosition(offerId, threadId, positionId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assistantKeys.positions(offerId) });
    },
  });
}

export function useApproveAll(offerId: string) {
  const qc = useQueryClient();
  return useMutation<ActionResult, Error, { threadId: string }>({
    mutationFn: ({ threadId }) => approveAllPositions(offerId, threadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assistantKeys.positions(offerId) });
    },
  });
}

export function useCommitAll(offerId: string) {
  const qc = useQueryClient();
  return useMutation<ActionResult, Error, { threadId: string }>({
    mutationFn: ({ threadId }) => commitAllPositions(offerId, threadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assistantKeys.positions(offerId) });
      qc.invalidateQueries({ queryKey: queryKeys.offers.withSections(offerId) });
    },
  });
}
