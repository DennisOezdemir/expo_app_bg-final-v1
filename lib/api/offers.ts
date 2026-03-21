import { supabase } from "@/lib/supabase";

// ── Types ──

export interface Offer {
  id: string;
  offer_number: string;
  version: number;
  status: string;
  total_net: number;
  total_vat: number;
  total_gross: number;
  is_lump_sum: boolean;
  lump_sum_amount: number | null;
  hide_position_prices: boolean;
  project_id: string;
  created_at: string;
  updated_at: string;
  // Joined
  project_number?: string;
  project_name?: string;
  object_street?: string;
  object_zip?: string;
  object_city?: string;
  client_name?: string;
  client_salutation?: string;
  client_last_name?: string;
}

export interface OfferSection {
  id: string;
  offer_id: string;
  section_number: number;
  title: string;
  trade: string | null;
}

export interface OfferPositionRow {
  id: string;
  offer_id: string;
  section_id: string;
  position_number: number;
  title: string;
  description: string | null;
  long_text: string | null;
  unit: string;
  unit_price: number;
  quantity: number;
  total_price: number | null;
  catalog_code: string | null;
  catalog_position_v2_id: string | null;
  surcharge_profit_percent: number;
  sort_order: number;
  position_type: string;
  source: string | null;
}

export interface OfferWithSections extends Offer {
  sections: (OfferSection & { positions: OfferPositionRow[] })[];
}

export interface CatalogRow {
  id: string;
  code: string;
  name: string;
}

export interface CatalogPositionRow {
  id: string;
  position_code: string;
  title: string;
  title_secondary: string | null;
  description: string | null;
  trade: string;
  unit: string;
  base_price_eur: number;
}

// ── Fetch functions ──

/**
 * Einzelnes Angebot mit Projekt-Join laden
 */
export async function fetchOffer(offerId: string): Promise<Offer | null> {
  const { data, error } = await supabase
    .from("offers")
    .select(`
      id, offer_number, version, status, total_net, total_vat, total_gross,
      is_lump_sum, lump_sum_amount, hide_position_prices, project_id,
      created_at, updated_at,
      projects!inner (
        project_number, name, object_street, object_zip, object_city,
        clients ( company_name, salutation, last_name )
      )
    `)
    .eq("id", offerId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const p = (data as any).projects;
  return {
    ...data,
    total_net: Number(data.total_net) || 0,
    total_vat: Number(data.total_vat) || 0,
    total_gross: Number(data.total_gross) || 0,
    is_lump_sum: data.is_lump_sum ?? false,
    lump_sum_amount: data.lump_sum_amount ? Number(data.lump_sum_amount) : null,
    hide_position_prices: data.hide_position_prices ?? false,
    project_number: p?.project_number ?? "",
    project_name: p?.name ?? "",
    object_street: p?.object_street ?? "",
    object_zip: p?.object_zip ?? "",
    object_city: p?.object_city ?? "",
    client_name: p?.clients?.company_name ?? "—",
    client_salutation: p?.clients?.salutation ?? "",
    client_last_name: p?.clients?.last_name ?? "",
  } as Offer;
}

/**
 * Angebot MIT Sections + Positionen laden (für [id].tsx Detail-Ansicht)
 */
export async function fetchOfferWithSections(offerId: string): Promise<OfferWithSections | null> {
  const offer = await fetchOffer(offerId);
  if (!offer) return null;

  const { data: sections, error: secErr } = await supabase
    .from("offer_sections")
    .select("id, offer_id, section_number, title, trade")
    .eq("offer_id", offerId)
    .order("section_number");

  if (secErr) throw secErr;

  const { data: positions, error: posErr } = await supabase
    .from("offer_positions")
    .select(`
      id, offer_id, section_id, position_number, title, description, long_text,
      unit, unit_price, quantity, total_price, catalog_code, catalog_position_v2_id,
      surcharge_profit_percent, sort_order, position_type, source
    `)
    .eq("offer_id", offerId)
    .is("deleted_at", null)
    .order("sort_order");

  if (posErr) throw posErr;

  const sectionList = (sections ?? []).map((sec: any) => ({
    ...sec,
    positions: (positions ?? [])
      .filter((p: any) => p.section_id === sec.id)
      .map((p: any) => ({
        ...p,
        unit_price: Number(p.unit_price) || 0,
        quantity: Number(p.quantity) || 0,
        total_price: p.total_price ? Number(p.total_price) : null,
        surcharge_profit_percent: Number(p.surcharge_profit_percent) || 0,
        sort_order: Number(p.sort_order) || 0,
      })),
  }));

  return { ...offer, sections: sectionList };
}

/**
 * Alle Angebote eines Projekts laden
 */
export async function fetchOffersByProject(projectId: string): Promise<Offer[]> {
  const { data, error } = await supabase
    .from("offers")
    .select(`
      id, offer_number, version, status, total_net, total_vat, total_gross,
      is_lump_sum, lump_sum_amount, hide_position_prices, project_id,
      created_at, updated_at
    `)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((d: any) => ({
    ...d,
    total_net: Number(d.total_net) || 0,
    total_vat: Number(d.total_vat) || 0,
    total_gross: Number(d.total_gross) || 0,
    is_lump_sum: d.is_lump_sum ?? false,
    lump_sum_amount: d.lump_sum_amount ? Number(d.lump_sum_amount) : null,
    hide_position_prices: d.hide_position_prices ?? false,
  }));
}

// ── Katalog ──

export async function fetchCatalogs(): Promise<CatalogRow[]> {
  const { data, error } = await supabase
    .from("catalogs")
    .select("id, code, name")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return (data ?? []) as CatalogRow[];
}

export async function fetchCatalogPositions(
  catalogId: string,
  query?: string,
  trade?: string,
): Promise<CatalogPositionRow[]> {
  let q = supabase
    .from("catalog_positions_v2")
    .select("id, position_code, title, title_secondary, description, trade, unit, base_price_eur")
    .eq("catalog_id", catalogId)
    .eq("is_active", true)
    .order("position_code");

  if (trade && trade !== "Alle") {
    q = q.eq("trade", trade);
  }

  if (query && query.trim()) {
    q = q.or(`position_code.ilike.%${query}%,title.ilike.%${query}%,description.ilike.%${query}%,trade.ilike.%${query}%`);
  }

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((p: any) => ({
    ...p,
    base_price_eur: Number(p.base_price_eur) || 0,
  }));
}

// ── Mutations ──

export interface AddPositionInput {
  offer_id: string;
  section_id: string;
  title: string;
  description?: string;
  long_text?: string;
  unit: string;
  unit_price: number;
  quantity: number;
  catalog_code?: string;
  catalog_position_v2_id?: string;
  surcharge_profit_percent?: number;
  position_type?: string;
  source?: string;
}

export async function addOfferPosition(input: AddPositionInput): Promise<OfferPositionRow> {
  // Nächste freie position_number
  const { data: maxPos } = await supabase
    .from("offer_positions")
    .select("position_number")
    .eq("offer_id", input.offer_id)
    .order("position_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const posNumber = (maxPos?.position_number ?? 0) + 1;

  const { data, error } = await supabase
    .from("offer_positions")
    .insert({
      offer_id: input.offer_id,
      section_id: input.section_id,
      position_number: posNumber,
      title: input.title,
      description: input.description ?? null,
      long_text: input.long_text ?? input.description ?? null,
      unit: input.unit,
      unit_price: input.unit_price,
      quantity: input.quantity,
      catalog_code: input.catalog_code ?? null,
      catalog_position_v2_id: input.catalog_position_v2_id ?? null,
      surcharge_profit_percent: input.surcharge_profit_percent ?? 0,
      position_type: input.position_type ?? "STANDARD",
      sort_order: posNumber,
      source: input.source ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    unit_price: Number(data.unit_price) || 0,
    quantity: Number(data.quantity) || 0,
    surcharge_profit_percent: Number(data.surcharge_profit_percent) || 0,
  } as OfferPositionRow;
}

export interface UpdatePositionInput {
  id: string;
  title?: string;
  description?: string;
  long_text?: string;
  unit?: string;
  unit_price?: number;
  quantity?: number;
  surcharge_profit_percent?: number;
  position_type?: string;
}

export async function updateOfferPosition(input: UpdatePositionInput): Promise<void> {
  const { id, ...updates } = input;
  const { error } = await supabase
    .from("offer_positions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteOfferPosition(posId: string): Promise<void> {
  const { error } = await supabase
    .from("offer_positions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", posId);

  if (error) throw error;
}

export interface AddSectionInput {
  offer_id: string;
  section_number: number;
  title: string;
  trade?: string;
}

export async function addOfferSection(input: AddSectionInput): Promise<OfferSection> {
  const { data, error } = await supabase
    .from("offer_sections")
    .insert({
      offer_id: input.offer_id,
      section_number: input.section_number,
      title: input.title,
      trade: input.trade ?? null,
    })
    .select("id, offer_id, section_number, title, trade")
    .single();

  if (error) throw error;
  return data as OfferSection;
}

export interface SaveOfferInput {
  id: string;
  total_net: number;
  total_vat: number;
  total_gross: number;
  status?: string;
  is_lump_sum?: boolean;
  lump_sum_amount?: number | null;
  hide_position_prices?: boolean;
}

export async function saveOffer(input: SaveOfferInput): Promise<void> {
  const { id, ...updates } = input;
  const { error } = await supabase
    .from("offers")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
