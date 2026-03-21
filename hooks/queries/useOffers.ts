import { useQuery } from "@tanstack/react-query";
import {
  fetchOffer,
  fetchOfferWithSections,
  fetchOffersByProject,
  fetchCatalogs,
  fetchCatalogPositions,
} from "@/lib/api/offers";
import { queryKeys } from "@/lib/query-keys";

/**
 * Einzelnes Angebot mit Projekt-Daten
 */
export function useOffer(offerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.offers.detail(offerId ?? ""),
    queryFn: () => fetchOffer(offerId!),
    enabled: !!offerId,
  });
}

/**
 * Angebot MIT Sections + Positionen (für Detail-Ansicht)
 */
export function useOfferWithSections(offerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.offers.withSections(offerId ?? ""),
    queryFn: () => fetchOfferWithSections(offerId!),
    enabled: !!offerId,
  });
}

/**
 * Alle Angebote eines Projekts
 */
export function useOffersByProject(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.offers.byProject(projectId ?? ""),
    queryFn: () => fetchOffersByProject(projectId!),
    enabled: !!projectId,
  });
}

/**
 * Verfügbare Kataloge
 */
export function useCatalogs() {
  return useQuery({
    queryKey: queryKeys.catalogs.all,
    queryFn: fetchCatalogs,
    staleTime: 10 * 60 * 1000, // 10 Min Cache
  });
}

/**
 * Katalog-Positionen mit optionaler Suche + Trade-Filter
 */
export function useCatalogSearch(
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
