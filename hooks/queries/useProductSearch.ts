import { useQuery } from "@tanstack/react-query";
import { searchProducts } from "@/lib/api/product-search";
import { queryKeys } from "@/lib/query-keys";

/**
 * Produktsuche für die Erstbegehung.
 * - Ohne Suchtext: zeigt Produkte gefiltert nach Trade (Gewerk)
 * - Mit Suchtext: sucht über alle Produkte (name, sku, supplier)
 */
export function useProductSearch(searchText?: string, trade?: string) {
  return useQuery({
    queryKey: queryKeys.productSearch(searchText, trade),
    queryFn: () => searchProducts(searchText, trade),
    enabled: true,
    staleTime: 30_000, // 30s Cache
  });
}
