import { supabase } from "@/lib/supabase";

export interface ProjectListItem {
  id: string;
  project_number: string | null;
  name: string;
  display_name: string | null;
  object_street: string | null;
  object_zip: string | null;
  object_city: string | null;
  status: string | null;
  budget_net: number | null;
  progress_percent: number | null;
  planned_start: string | null;
  planned_end: string | null;
  created_at?: string | null;
}

export interface ProjectDetail extends ProjectListItem {
  object_floor: string | null;
  notes: string | null;
  client_id: string | null;
  source: string | null;
  price_catalog: string | null;
}

export interface CreateProjectInput {
  name: string;
  street: string;
  zip: string;
  city: string;
  floor?: string | null;
  notes?: string | null;
  clientId?: string | null;
}

export interface CreateProjectResult {
  id: string;
  project_number: string | null;
}

export async function fetchProjects(): Promise<ProjectListItem[]> {
  const { data, error } = await supabase
    .from("projects")
    .select(`
      id,
      project_number,
      name,
      display_name,
      object_street,
      object_zip,
      object_city,
      status,
      budget_net,
      progress_percent,
      planned_start,
      planned_end,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ProjectListItem[];
}

export async function fetchProjectDetail(projectId: string): Promise<ProjectDetail | null> {
  const { data, error } = await supabase
    .from("projects")
    .select(`
      id,
      project_number,
      name,
      display_name,
      object_street,
      object_zip,
      object_city,
      object_floor,
      status,
      budget_net,
      progress_percent,
      planned_start,
      planned_end,
      notes,
      client_id,
      source,
      price_catalog,
      created_at
    `)
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as ProjectDetail | null;
}

export async function createProject(input: CreateProjectInput): Promise<CreateProjectResult> {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: input.name.trim(),
      object_street: input.street.trim(),
      object_zip: input.zip.trim(),
      object_city: input.city.trim(),
      object_floor: input.floor?.trim() || null,
      notes: input.notes?.trim() || null,
      client_id: input.clientId ?? null,
      status: "DRAFT",
      source: "MANUAL",
    })
    .select("id, project_number")
    .single();

  if (error) throw error;

  if (data?.id) {
    const { error: eventError } = await supabase.from("events").insert({
      event_type: "PROJECT_CREATED",
      project_id: data.id,
      source_system: "app",
      source_flow: "manual_create",
      payload: { source: "MANUAL", project_number: data.project_number },
    });

    if (eventError) throw eventError;
  }

  return data as CreateProjectResult;
}
