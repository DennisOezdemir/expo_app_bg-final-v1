import { supabase } from "@/lib/supabase";

export interface Activity {
  id: string;
  project_id: string;
  activity_type: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  project_number: string | null;
  project_name: string | null;
}

const PAGE_SIZE = 20;

export async function fetchActivities(page: number): Promise<Activity[]> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from("project_activities")
    .select(
      "id, project_id, activity_type, title, description, metadata, created_by, created_at, projects!inner(project_number, name)"
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    project_id: row.project_id,
    activity_type: row.activity_type,
    title: row.title,
    description: row.description,
    metadata: row.metadata,
    created_by: row.created_by,
    created_at: row.created_at,
    project_number: row.projects?.project_number ?? null,
    project_name: row.projects?.name ?? null,
  }));
}

export async function fetchProjectActivities(projectId: string, page: number): Promise<Activity[]> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from("project_activities")
    .select(
      "id, project_id, activity_type, title, description, metadata, created_by, created_at, projects!inner(project_number, name)"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    project_id: row.project_id,
    activity_type: row.activity_type,
    title: row.title,
    description: row.description,
    metadata: row.metadata,
    created_by: row.created_by,
    created_at: row.created_at,
    project_number: row.projects?.project_number ?? null,
    project_name: row.projects?.name ?? null,
  }));
}
