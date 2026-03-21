import { supabase } from "@/lib/supabase";

// ── Types ──

export interface Supplier {
  id: string;
  supplier_code: string;
  name: string;
  short_name: string | null;
  supplier_type: string;
  categories: string[] | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  street: string | null;
  zip_code: string | null;
  city: string | null;
  payment_terms_days: number | null;
  discount_percent: number | null;
  min_order_value: number | null;
  delivery_days: number | null;
  our_customer_number: string | null;
  rating: number | null;
  notes: string | null;
  is_active: boolean;
  is_preferred: boolean;
  article_count?: number;
}

export interface SupplierArticle {
  id: string;
  supplier_id: string;
  supplier_article_number: string;
  supplier_article_name: string;
  internal_name: string | null;
  category: string | null;
  purchase_unit: string;
  manufacturer: string | null;
  is_active: boolean;
}

export interface CompanySetting {
  key: string;
  value: string | null;
  description: string | null;
}

// ── Suppliers ──

export async function fetchSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from("suppliers")
    .select(
      "id, supplier_code, name, short_name, supplier_type, categories, email, phone, website, street, zip_code, city, payment_terms_days, discount_percent, min_order_value, delivery_days, our_customer_number, rating, notes, is_active, is_preferred",
    )
    .eq("is_active", true)
    .order("name");

  if (error) throw error;

  // Article counts
  const { data: articles, error: artErr } = await supabase
    .from("supplier_articles")
    .select("supplier_id")
    .eq("is_active", true);

  if (artErr) throw artErr;

  const countMap = new Map<string, number>();
  for (const a of articles ?? []) {
    countMap.set(a.supplier_id, (countMap.get(a.supplier_id) ?? 0) + 1);
  }

  return (data ?? []).map((s: any) => ({
    ...s,
    discount_percent: s.discount_percent ? Number(s.discount_percent) : null,
    min_order_value: s.min_order_value ? Number(s.min_order_value) : null,
    article_count: countMap.get(s.id) ?? 0,
  }));
}

export async function fetchSupplierArticles(
  supplierId: string,
): Promise<SupplierArticle[]> {
  const { data, error } = await supabase
    .from("supplier_articles")
    .select(
      "id, supplier_id, supplier_article_number, supplier_article_name, internal_name, category, purchase_unit, manufacturer, is_active",
    )
    .eq("supplier_id", supplierId)
    .eq("is_active", true)
    .order("supplier_article_name");

  if (error) throw error;
  return (data ?? []) as SupplierArticle[];
}

// ── Company Settings ──

export async function fetchCompanySettings(): Promise<
  Record<string, string | null>
> {
  const { data, error } = await supabase
    .from("company_settings")
    .select("key, value");

  if (error) throw error;

  const map: Record<string, string | null> = {};
  for (const row of data ?? []) {
    map[row.key] = row.value;
  }
  return map;
}

export async function upsertCompanySetting(
  key: string,
  value: string,
  description?: string,
): Promise<void> {
  const { error } = await supabase.from("company_settings").upsert(
    {
      key,
      value,
      description: description ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) throw error;
}

export async function saveCompanySettings(
  settings: Record<string, string>,
): Promise<void> {
  const rows = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("company_settings")
    .upsert(rows, { onConflict: "key" });

  if (error) throw error;
}
