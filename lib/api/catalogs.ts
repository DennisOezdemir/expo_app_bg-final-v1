import { supabase } from "@/lib/supabase";

// ── Types ──

export interface Catalog {
  id: string;
  code: string;
  name: string;
  description: string | null;
  valid_from: string;
  valid_to: string | null;
  is_active: boolean;
  position_count: number;
}

export interface CatalogPosition {
  id: string;
  catalog_id: string;
  position_code: string;
  parent_code: string | null;
  title: string;
  title_secondary: string | null;
  description: string | null;
  trade: string | null;
  category: string | null;
  unit: string | null;
  base_price_eur: number;
}

// ── Fetch ──

export async function fetchCatalogs(): Promise<Catalog[]> {
  const { data, error } = await supabase
    .from("catalogs")
    .select("id, code, name, description, valid_from, valid_to, is_active")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;

  // Get position counts per catalog
  const { data: counts, error: countErr } = await supabase
    .from("catalog_positions_v2")
    .select("catalog_id")
    .eq("is_active", true);

  if (countErr) throw countErr;

  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    countMap.set(row.catalog_id, (countMap.get(row.catalog_id) ?? 0) + 1);
  }

  return (data ?? []).map((c: any) => ({
    ...c,
    position_count: countMap.get(c.id) ?? 0,
  }));
}

export async function fetchCatalogPositions(
  catalogId: string,
  query?: string,
  trade?: string,
): Promise<CatalogPosition[]> {
  let q = supabase
    .from("catalog_positions_v2")
    .select(
      "id, catalog_id, position_code, parent_code, title, title_secondary, description, trade, category, unit, base_price_eur",
    )
    .eq("catalog_id", catalogId)
    .eq("is_active", true)
    .order("position_code")
    .limit(100);

  if (trade && trade !== "Alle") {
    q = q.eq("trade", trade);
  }

  if (query && query.trim()) {
    q = q.or(
      `position_code.ilike.%${query}%,title.ilike.%${query}%,title_secondary.ilike.%${query}%`,
    );
  }

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((p: any) => ({
    ...p,
    base_price_eur: Number(p.base_price_eur) || 0,
  }));
}

export async function fetchCatalogTrades(catalogId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("catalog_positions_v2")
    .select("trade")
    .eq("catalog_id", catalogId)
    .eq("is_active", true)
    .not("trade", "is", null);

  if (error) throw error;

  const trades = new Set<string>();
  for (const row of data ?? []) {
    if (row.trade) trades.add(row.trade);
  }
  return Array.from(trades).sort();
}
