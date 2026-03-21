import { supabase } from "@/lib/supabase";

// ── Types ──

export type ClientType = "COMMERCIAL" | "PRIVATE";

export interface Client {
  id: string;
  company_name: string | null;
  vat_id: string | null;
  customer_number: string | null;
  contact_person: string | null;
  client_type: ClientType | null;
  email: string | null;
  phone: string | null;
  street: string | null;
  zip_code: string | null;
  city: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  role_label: string | null;
  gewerk: string | null;
  active: boolean;
}

export interface CompanySettings {
  [key: string]: string;
}

// ── Fetch Functions ──

export async function fetchCompanySettings(): Promise<CompanySettings> {
  const { data, error } = await supabase
    .from("company_settings")
    .select("key, value");

  if (error) throw error;

  const map: CompanySettings = {};
  (data ?? []).forEach((r) => {
    map[r.key] = r.value ?? "";
  });
  return map;
}

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, company_name, vat_id, customer_number, contact_person, client_type, email, phone, street, zip_code, city"
    )
    .order("company_name", { nullsFirst: false });

  if (error) throw error;
  return (data as Client[]) ?? [];
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("team_members")
    .select("id, name, email, phone, role, role_label, gewerk, active")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data as TeamMember[]) ?? [];
}

export async function fetchTeamMemberCount(): Promise<number> {
  const { count, error } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}

// ── Mutations ──

export async function saveCompanySettings(
  settings: { key: string; value: string }[]
): Promise<void> {
  for (const row of settings) {
    const { error } = await supabase
      .from("company_settings")
      .upsert({ key: row.key, value: row.value }, { onConflict: "key" });
    if (error) throw error;
  }
}

export async function createClient(
  input: Omit<Client, "id">
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert(input)
    .select(
      "id, company_name, vat_id, customer_number, contact_person, client_type, email, phone, street, zip_code, city"
    )
    .single();

  if (error) throw error;
  return data as Client;
}

export async function updateClient(
  id: string,
  input: Partial<Omit<Client, "id">>
): Promise<void> {
  const { error } = await supabase.from("clients").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}

export async function createTeamMember(input: {
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  role_label: string;
  gewerk: string | null;
  active: boolean;
  sort_order: number;
}): Promise<void> {
  const { error } = await supabase.from("team_members").insert(input);
  if (error) throw error;
}

export async function updateTeamMember(
  id: string,
  input: {
    name: string;
    email: string | null;
    phone: string | null;
    role: string;
    role_label: string;
    gewerk: string | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from("team_members")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTeamMember(id: string): Promise<void> {
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
