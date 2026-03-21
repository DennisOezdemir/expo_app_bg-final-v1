import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  assignProductToMaterial,
  createAndAssignProduct,
} from "@/lib/api/materials";
import { queryKeys } from "@/lib/query-keys";

export function useAssignProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      materialId,
      productId,
      currentUseCount,
    }: {
      materialId: string;
      productId: string;
      currentUseCount: number;
    }) => assignProductToMaterial(materialId, productId, currentUseCount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.materials.all });
    },
  });
}

export function useCreateAndAssignProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAndAssignProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.materials.all });
    },
  });
}
