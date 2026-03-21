import { useQuery } from "@tanstack/react-query";
import {
  fetchCatalogs,
  fetchCatalogPositions,
  fetchCatalogTrades,
} from "@/lib/api/catalogs";
import { queryKeys } from "@/lib/query-keys";

export function useCatalogs() {
  return useQuery({
    queryKey: queryKeys.catalogs.all,
    queryFn: fetchCatalogs,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCatalogPositions(
  catalogId: string | undefined,
  query?: string,
  trade?: string,
) {
  return useQuery({
    queryKey: queryKeys.catalogs.positions(catalogId ?? "", query, trade),
    queryFn: () => fetchCatalogPositions(catalogId!, query, trade),
    enabled: !!catalogId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCatalogTrades(catalogId: string | undefined) {
  return useQuery({
    queryKey: ["catalogs", "trades", catalogId ?? ""] as const,
    queryFn: () => fetchCatalogTrades(catalogId!),
    enabled: !!catalogId,
    staleTime: 10 * 60 * 1000,
  });
}
