import { supabase } from "@/lib/supabase";

// ── Types ──

export interface MaterialRequirement {
  id: string;
  catalog_position_v2_id: string;
  material_type: string;
  category: string | null;
  trade: string | null;
  default_quantity: number;
  quantity_unit: string;
  quantity_mode: string;
  default_product_id: string | null;
  is_optional: boolean;
  notes: string | null;
  // Joined
  product_name: string | null;
  last_price_net_eur: number | null;
  product_unit: string | null;
  supplier_name: string | null;
}

export interface SaveMaterialInput {
  id?: string; // existing pmr id, undefined for new
  material_type: string;
  default_quantity: number;
  quantity_unit: string;
  quantity_mode: string;
  default_product_id: string | null;
  is_optional: boolean;
  notes?: string;
  trade?: string;
  category?: string;
}

export interface CatalogDefault {
  id: string;
  material_name: string;
  default_qty: number;
  unit: string;
  gewerk: string;
  product_pool_id: string | null;
}

// ── API Functions ──

/**
 * Fetch existing material requirements for a catalog position.
 */
export async function fetchMaterialRequirements(
  catalogPositionV2Id: string,
): Promise<MaterialRequirement[]> {
  const { data, error } = await supabase
    .from("position_material_requirements")
    .select(
      `id, catalog_position_v2_id, material_type, category, trade,
       default_quantity, quantity_unit, quantity_mode, default_product_id,
       is_optional, notes, created_at,
       products:default_product_id (name, last_price_net_eur, unit, suppliers:supplier_id (name))`,
    )
    .eq("catalog_position_v2_id", catalogPositionV2Id)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!data) return [];

  return data.map((row: any) => ({
    id: row.id,
    catalog_position_v2_id: row.catalog_position_v2_id,
    material_type: row.material_type,
    category: row.category,
    trade: row.trade,
    default_quantity: Number(row.default_quantity),
    quantity_unit: row.quantity_unit,
    quantity_mode: row.quantity_mode,
    default_product_id: row.default_product_id,
    is_optional: row.is_optional ?? false,
    notes: row.notes,
    product_name: row.products?.name ?? null,
    last_price_net_eur: row.products?.last_price_net_eur
      ? Number(row.products.last_price_net_eur)
      : null,
    product_unit: row.products?.unit ?? null,
    supplier_name: row.products?.suppliers?.name ?? null,
  }));
}

/**
 * Fetch catalog_material_mapping defaults as suggestions.
 */
export async function fetchCatalogDefaults(
  catalogPositionNr: string,
): Promise<CatalogDefault[]> {
  const { data, error } = await supabase
    .from("catalog_material_mapping")
    .select("id, material_name, default_qty, unit, gewerk, product_pool_id")
    .eq("catalog_position_nr", catalogPositionNr)
    .eq("is_active", true);

  if (error) throw error;
  if (!data) return [];

  return data.map((row: any) => ({
    id: row.id,
    material_name: row.material_name,
    default_qty: Number(row.default_qty),
    unit: row.unit,
    gewerk: row.gewerk,
    product_pool_id: row.product_pool_id,
  }));
}

/**
 * Save (upsert) material requirements — delete removed, upsert rest.
 */
export async function saveMaterialRequirements(
  catalogPositionV2Id: string,
  materials: SaveMaterialInput[],
): Promise<void> {
  const keepIds: string[] = [];

  for (const mat of materials) {
    if (mat.id) {
      // UPDATE existing
      const { error } = await supabase
        .from("position_material_requirements")
        .update({
          material_type: mat.material_type,
          default_quantity: mat.default_quantity,
          quantity_unit: mat.quantity_unit,
          quantity_mode: mat.quantity_mode,
          default_product_id: mat.default_product_id,
          is_optional: mat.is_optional,
          notes: mat.notes ?? null,
          trade: mat.trade ?? null,
          category: mat.category ?? null,
        })
        .eq("id", mat.id);
      if (error) throw error;
      keepIds.push(mat.id);
    } else {
      // INSERT new
      const { data, error } = await supabase
        .from("position_material_requirements")
        .insert({
          catalog_position_v2_id: catalogPositionV2Id,
          material_type: mat.material_type,
          default_quantity: mat.default_quantity,
          quantity_unit: mat.quantity_unit,
          quantity_mode: mat.quantity_mode,
          default_product_id: mat.default_product_id,
          is_optional: mat.is_optional,
          notes: mat.notes ?? null,
          trade: mat.trade ?? null,
          category: mat.category ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      if (data) keepIds.push(data.id);
    }
  }

  // Delete rows that are no longer in the list
  if (keepIds.length > 0) {
    const { error } = await supabase
      .from("position_material_requirements")
      .delete()
      .eq("catalog_position_v2_id", catalogPositionV2Id)
      .not("id", "in", `(${keepIds.join(",")})`);
    if (error) throw error;
  } else {
    // No materials left — delete all for this position
    const { error } = await supabase
      .from("position_material_requirements")
      .delete()
      .eq("catalog_position_v2_id", catalogPositionV2Id);
    if (error) throw error;
  }
}

/**
 * Delete a single material requirement.
 */
export async function deleteMaterialRequirement(id: string): Promise<void> {
  const { error } = await supabase
    .from("position_material_requirements")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
