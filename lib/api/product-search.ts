import { supabase } from "@/lib/supabase";
import type { Product } from "./materials";

/**
 * Sucht Produkte mit optionalem Trade-Filter.
 * 1. Wenn trade gegeben → zuerst nur passende Produkte
 * 2. Wenn searchText gegeben → sucht über name, sku UND supplier.name (ILIKE)
 * 3. Fallback: wenn Trade-Filter 0 Ergebnisse → alle Produkte durchsuchen
 */
export async function searchProducts(
  searchText?: string,
  trade?: string
): Promise<Product[]> {
  // Erste Suche: mit Trade-Filter (wenn vorhanden)
  let query = supabase
    .from("products")
    .select(
      `id, name, sku, last_price_net_eur, unit, is_favorite, use_count, material_type, trade,
       suppliers:supplier_id (id, name, short_name)`
    )
    .eq("is_active", true)
    .order("is_favorite", { ascending: false })
    .order("use_count", { ascending: false })
    .limit(30);

  // Trade-Filter: nur wenn kein Suchtext oder als Erstfilter
  if (trade && !searchText) {
    query = query.eq("trade", trade);
  }

  // Suchtext: über name, sku und supplier (ILIKE)
  if (searchText) {
    query = query.or(
      `name.ilike.%${searchText}%,sku.ilike.%${searchText}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  let items = data as any[] | null;

  // Fallback: wenn Trade-Filter keine Ergebnisse bringt
  if ((!items || items.length === 0) && trade && !searchText) {
    const { data: allData } = await supabase
      .from("products")
      .select(
        `id, name, sku, last_price_net_eur, unit, is_favorite, use_count, material_type, trade,
         suppliers:supplier_id (id, name, short_name)`
      )
      .eq("is_active", true)
      .order("is_favorite", { ascending: false })
      .order("use_count", { ascending: false })
      .limit(30);
    items = allData as any[] | null;
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
