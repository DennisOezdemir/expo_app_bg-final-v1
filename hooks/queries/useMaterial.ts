import { useQuery } from "@tanstack/react-query";
import {
  fetchProjectsWithMaterials,
  fetchMaterialNeeds,
  fetchProducts,
  fetchSuppliers,
  fetchMaterialInfo,
} from "@/lib/api/materials";
import { queryKeys } from "@/lib/query-keys";

export function useProjectsWithMaterials() {
  return useQuery({
    queryKey: queryKeys.materials.projects(),
    queryFn: fetchProjectsWithMaterials,
  });
}

export function useMaterialNeeds(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.materials.needs(projectId ?? ""),
    queryFn: () => fetchMaterialNeeds(projectId!),
    enabled: !!projectId,
  });
}

export function useProducts(name?: string, trade?: string) {
  return useQuery({
    queryKey: queryKeys.materials.products(name, trade),
    queryFn: () => fetchProducts(name, trade),
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: queryKeys.materials.suppliers(),
    queryFn: fetchSuppliers,
  });
}

export function useMaterialInfo(materialId?: string) {
  return useQuery({
    queryKey: ["materials", "info", materialId ?? ""],
    queryFn: () => fetchMaterialInfo(materialId!),
    enabled: !!materialId,
  });
}
