import { supabase } from "@/lib/supabase";
import type { Product } from "./materials";

/**
 * Trade-Normalisierung: UI hat "Elektro"/"Sanitär", DB hat "elektro"/"sanitaer"
 */
const TRADE_MAP: Record<string, string> = {
  "Elektro": "elektro",
  "Sanitär": "sanitaer",
  "Maler": "maler",
  "Fliesen": "fliesen",
  "Trockenbau": "trockenbau",
  "Tischler": "tischler",
  "Heizung": "heizung",
  "Boden": "boden",
  "Maurer": "maurer",
  "Reinigung": "reinigung",
  "Sonstiges": "allgemein",
};

/**
 * Sucht Produkte mit optionalem Trade-Filter.
 * - Trade-Filter ist case-insensitive und schließt trade=NULL Produkte mit ein
 * - Suchtext sucht über name, sku (ILIKE)
 */
export async function searchProducts(
  searchText?: string,
  trade?: string
): Promise<Product[]> {
  const SELECT_COLS = `id, name, sku, last_price_net_eur, unit, is_favorite, use_count, material_type, trade,
       suppliers:supplier_id (id, name, short_name)`;

  // Normalisiere Trade von UI-Format zu DB-Format
  const dbTrade = trade ? (TRADE_MAP[trade] || trade.toLowerCase()) : null;

  let items: any[] | null = null;

  if (searchText) {
    // Freitextsuche: über alle Produkte
    const { data, error } = await supabase
      .from("products")
      .select(SELECT_COLS)
      .eq("is_active", true)
      .or(`name.ilike.%${searchText}%,sku.ilike.%${searchText}%,material_type.ilike.%${searchText}%`)
      .order("use_count", { ascending: false })
      .limit(30);
    if (error) throw error;
    items = data;
  } else if (dbTrade) {
    // Trade-gefiltert: passende Trades PLUS trade=NULL (Querschnitts-Artikel)
    // Supabase .or() mit is.null
    const { data, error } = await supabase
      .from("products")
      .select(SELECT_COLS)
      .eq("is_active", true)
      .or(`trade.ilike.${dbTrade},trade.is.null`)
      .order("is_favorite", { ascending: false })
      .order("use_count", { ascending: false })
      .limit(30);
    if (error) throw error;
    items = data;
  } else {
    // Kein Filter: alle Produkte nach Nutzung
    const { data, error } = await supabase
      .from("products")
      .select(SELECT_COLS)
      .eq("is_active", true)
      .order("is_favorite", { ascending: false })
      .order("use_count", { ascending: false })
      .limit(30);
    if (error) throw error;
    items = data;
  }

  if (!items) return [];

  return items.map((p) => {
    const supplier = p.suppliers;
    return {
      id: p.id,
      name: p.name,
      supplier: supplier?.short_name || supplier?.name || "—",
      supplierId: supplier?.id,
      articleNr: p.sku || "—",
      price: p.last_price_net_eur
        ? Number(p.last_price_net_eur).toFixed(2).replace(".", ",")
        : "—",
      priceNum: p.last_price_net_eur ? Number(p.last_price_net_eur) : 0,
      unit: p.unit || "Stk",
      favorite: p.is_favorite || false,
      useCount: p.use_count || 0,
    };
  });
}

/**
 * Prüft ob dieselbe catalog_position_nr mehrfach im selben Angebot vorkommt.
 * Gibt die Anzahl und die Position-IDs zurück.
 */
export async function findDuplicatePositions(
  offerId: string,
  positionNumber: string
): Promise<{ count: number; positionIds: string[] }> {
  const { data, error } = await supabase
    .from("offer_positions")
    .select("id")
    .eq("offer_id", offerId)
    .eq("position_number", positionNumber)
    .is("deleted_at", null);

  if (error) throw error;

  return {
    count: data?.length ?? 0,
    positionIds: (data ?? []).map((d) => d.id),
  };
}

/**
 * Speichert Materialzuordnung für eine oder mehrere Positionen.
 * Schreibt in project_material_needs mit source = 'manual_eb'.
 */
export async function assignProductToPositions(
  projectId: string,
  productId: string,
  positionIds: string[],
  productName: string,
  trade: string,
): Promise<void> {
  for (const posId of positionIds) {
    // Upsert: wenn schon ein Eintrag existiert, aktualisieren
    const { data: existing } = await supabase
      .from("project_material_needs")
      .select("id")
      .eq("project_id", projectId)
      .eq("offer_position_id", posId)
      .limit(1)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("project_material_needs")
        .update({
          product_id: productId,
          product_name: productName,
          source: "manual_eb",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("project_material_needs")
        .insert({
          project_id: projectId,
          offer_position_id: posId,
          product_id: productId,
          product_name: productName,
          trade: trade,
          source: "manual_eb",
          status: "planned",
        });
    }
  }

  // Increment use_count on product
  const { error: rpcError } = await supabase.rpc("increment_use_count", {
    product_id_param: productId,
  });
  if (rpcError) {
    // Fallback: direct update
    await supabase
      .from("products")
      .update({
        last_used_at: new Date().toISOString(),
      })
      .eq("id", productId);
  }
}
