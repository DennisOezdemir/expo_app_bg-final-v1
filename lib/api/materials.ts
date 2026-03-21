import { supabase } from "@/lib/supabase";

// ── Types ──

export interface ProjectWithMaterials {
  id: string;
  project_number: string;
  name: string;
  needCount: number;
}

export type NeedStatus = "planned" | "ordered" | "delivered";
export type ProblemType =
  | "aufmass_fehlt"
  | "mapping_fehlt"
  | "termin_fehlt"
  | "lieferant_fehlt"
  | null;

export interface MaterialNeed {
  id: string;
  trade: string;
  material_type: string;
  label: string;
  total_quantity: number;
  quantity_unit: string;
  room: string | null;
  status: NeedStatus;
  problem: ProblemType;
  needed_by: string | null;
  product_name: string | null;
  supplier_name: string | null;
  unit_price_net: number | null;
  line_total_net: number | null;
}

export interface Product {
  id: string;
  name: string;
  supplier: string;
  supplierId?: string;
  articleNr: string;
  price: string;
  priceNum: number;
  unit: string;
  favorite: boolean;
  useCount: number;
  isNew?: boolean;
}

export interface MaterialInfo {
  id: string;
  materialType: string;
  trade: string;
  quantity: number;
  unit: string;
  positionCount: number;
}

// ── Fetch Functions ──

export async function fetchProjectsWithMaterials(): Promise<ProjectWithMaterials[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, project_number, name, status")
    .in("status", ["PLANNING", "IN_PROGRESS", "COMPLETION", "INSPECTION", "ACTIVE", "INTAKE"])
    .order("name", { ascending: true });

  if (error) throw error;
  if (!data) return [];

  const projectOpts: ProjectWithMaterials[] = [];
  for (const p of data) {
    const { count } = await supabase
      .from("project_material_needs")
      .select("id", { count: "exact", head: true })
      .eq("project_id", p.id);

    if ((count ?? 0) > 0) {
      projectOpts.push({
        id: p.id,
        project_number: p.project_number,
        name: p.name,
        needCount: count ?? 0,
      });
    }
  }

  return projectOpts;
}

export async function fetchMaterialNeeds(projectId: string): Promise<MaterialNeed[]> {
  const { data, error } = await supabase
    .from("project_material_needs")
    .select(
      "id, trade, material_type, label, total_quantity, quantity_unit, room, status, problem, needed_by, product_name, supplier_name, unit_price_net, line_total_net"
    )
    .eq("project_id", projectId)
    .order("trade")
    .order("label");

  if (error) throw error;
  if (!data) return [];

  return (data as any[]).map((row) => ({
    id: row.id,
    trade: row.trade || "Sonstiges",
    material_type: row.material_type,
    label: row.label,
    total_quantity: parseFloat(row.total_quantity) || 0,
    quantity_unit: row.quantity_unit || "Stk",
    room: row.room,
    status: row.status as NeedStatus,
    problem: row.problem as ProblemType,
    needed_by: row.needed_by,
    product_name: row.product_name,
    supplier_name: row.supplier_name,
    unit_price_net: row.unit_price_net ? parseFloat(row.unit_price_net) : null,
    line_total_net: row.line_total_net ? parseFloat(row.line_total_net) : null,
  }));
}

export async function fetchProducts(
  name?: string,
  trade?: string
): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select(
      `id, name, sku, last_price_net_eur, unit, is_favorite, use_count, material_type,
       suppliers:supplier_id (id, name, short_name)`
    )
    .eq("is_active", true)
    .order("is_favorite", { ascending: false })
    .order("use_count", { ascending: false })
    .limit(50);

  if (name) {
    query = query.or(`material_type.ilike.%${name}%,name.ilike.%${name}%`);
  }

  const { data, error } = await query;

  if (error) throw error;

  let items = data as any[] | null;

  // If no products found with filter, load all
  if ((!items || items.length === 0) && name) {
    const { data: allData } = await supabase
      .from("products")
      .select(
        `id, name, sku, last_price_net_eur, unit, is_favorite, use_count, material_type,
         suppliers:supplier_id (id, name, short_name)`
      )
      .eq("is_active", true)
      .order("is_favorite", { ascending: false })
      .order("use_count", { ascending: false })
      .limit(50);
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

export async function fetchSuppliers(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, name")
    .eq("is_active", true)
    .order("is_preferred", { ascending: false })
    .order("name")
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

export async function fetchMaterialInfo(materialId: string): Promise<MaterialInfo | null> {
  const { data } = await supabase
    .from("project_materials")
    .select("id, material_type, trade, quantity, quantity_unit")
    .eq("id", materialId)
    .single();

  if (!data) return null;

  const { data: projectData } = await supabase
    .from("project_materials")
    .select("project_id")
    .eq("id", materialId)
    .single();

  const { count } = await supabase
    .from("project_materials")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectData?.project_id || "")
    .eq("material_type", data.material_type);

  return {
    id: data.id,
    materialType: data.material_type,
    trade: data.trade || "Sonstiges",
    quantity: parseFloat(data.quantity) || 0,
    unit: data.quantity_unit || "Stk",
    positionCount: count ?? 1,
  };
}

// ── Mutations ──

export async function assignProductToMaterial(
  materialId: string,
  productId: string,
  currentUseCount: number
): Promise<void> {
  const { error } = await supabase
    .from("project_materials")
    .update({
      product_id: productId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", materialId);

  if (error) throw error;

  const { error: rpcError } = await supabase.rpc("increment_use_count", {
    product_id_param: productId,
  });
  if (rpcError) {
    await supabase
      .from("products")
      .update({
        use_count: currentUseCount + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", productId);
  }
}

export async function createAndAssignProduct(input: {
  name: string;
  supplierId?: string;
  articleNr: string;
  price: number;
  unit: string;
  materialType?: string;
  trade?: string;
  materialId?: string;
}): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: input.name,
      name_normalized: input.name.toLowerCase(),
      supplier_id: input.supplierId || null,
      sku: input.articleNr !== "-" ? input.articleNr : null,
      last_price_net_eur: input.price,
      unit: input.unit,
      material_type: input.materialType || null,
      trade: input.trade || null,
      is_active: true,
      is_favorite: false,
      use_count: 1,
      source: "manual",
    })
    .select("id")
    .single();

  if (error || !data) throw error || new Error("Produkt konnte nicht erstellt werden");

  if (input.materialId) {
    await supabase
      .from("project_materials")
      .update({
        product_id: data.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.materialId);
  }

  return data;
}
