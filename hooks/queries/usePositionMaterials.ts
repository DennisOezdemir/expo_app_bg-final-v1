import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMaterialRequirements,
  fetchCatalogDefaults,
  saveMaterialRequirements,
} from "@/lib/api/position-materials";
import type { SaveMaterialInput } from "@/lib/api/position-materials";
import { queryKeys } from "@/lib/query-keys";

/**
 * Fetch material requirements for a catalog position (position_material_requirements).
 */
export function usePositionMaterials(catalogPositionV2Id?: string) {
  return useQuery({
    queryKey: queryKeys.positionMaterials.byPosition(catalogPositionV2Id ?? ""),
    queryFn: () => fetchMaterialRequirements(catalogPositionV2Id!),
    enabled: !!catalogPositionV2Id,
    staleTime: 30_000,
  });
}

/**
 * Fetch catalog_material_mapping defaults as suggestions.
 */
export function useCatalogDefaults(catalogPositionNr?: string) {
  return useQuery({
    queryKey: queryKeys.positionMaterials.catalogDefaults(catalogPositionNr ?? ""),
    queryFn: () => fetchCatalogDefaults(catalogPositionNr!),
    enabled: !!catalogPositionNr,
    staleTime: 60_000,
  });
}

/**
 * Mutation: save (upsert) material requirements.
 */
export function useSaveMaterials() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      catalogPositionV2Id,
      materials,
    }: {
      catalogPositionV2Id: string;
      materials: SaveMaterialInput[];
    }) => saveMaterialRequirements(catalogPositionV2Id, materials),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.positionMaterials.byPosition(variables.catalogPositionV2Id),
      });
    },
  });
}
