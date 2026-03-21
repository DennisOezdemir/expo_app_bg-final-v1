import { supabase } from "@/lib/supabase";

export interface FotoCapture {
  id: string;
  project_id: string;
  capture_date: string;
  notes: string | null;
  checklist_data: Record<string, any>;
  status: string;
  created_at: string;
}

export interface UploadFotoInput {
  project_id: string;
  uri: string;
  type?: string; // "Fortschritt" | "Mangel" | "Material" | "Vorher" | "Nachher"
  notes?: string;
}

/**
 * Foto hochladen: Storage + site_captures Eintrag
 */
export async function uploadFoto(input: UploadFotoInput): Promise<FotoCapture> {
  const fileName = `${input.project_id}/${Date.now()}.jpg`;

  // 1. Foto in Storage hochladen
  const response = await fetch(input.uri);
  const blob = await response.blob();

  const { error: storageError } = await supabase.storage
    .from("site-photos")
    .upload(fileName, blob, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (storageError) throw storageError;

  // 2. Metadaten in site_captures speichern
  const { data, error } = await supabase
    .from("site_captures")
    .insert({
      project_id: input.project_id,
      status: "completed",
      capture_date: new Date().toISOString().split("T")[0],
      notes: input.notes ?? input.type ?? null,
      checklist_data: {
        storage_path: fileName,
        photo_type: input.type ?? "Fortschritt",
      },
    })
    .select()
    .single();

  if (error) throw error;
  return data as FotoCapture;
}

/**
 * Letzte Fotos für ein Projekt laden
 */
export async function fetchRecentFotos(projectId: string): Promise<FotoCapture[]> {
  const { data, error } = await supabase
    .from("site_captures")
    .select("id, project_id, capture_date, notes, checklist_data, status, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data ?? []) as FotoCapture[];
}

/**
 * Alle Fotos für einen Monteur (über seine zugewiesenen Projekte)
 */
export async function fetchFotosByTeamMember(teamMemberId: string): Promise<FotoCapture[]> {
  // Erst die zugewiesenen Projekte holen
  const { data: phases, error: phaseError } = await supabase
    .from("schedule_phases")
    .select("project_id")
    .eq("assigned_team_member_id", teamMemberId);

  if (phaseError) throw phaseError;

  const projectIds = [...new Set((phases ?? []).map((p: any) => p.project_id))];
  if (projectIds.length === 0) return [];

  const { data, error } = await supabase
    .from("site_captures")
    .select("id, project_id, capture_date, notes, checklist_data, status, created_at")
    .in("project_id", projectIds)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data ?? []) as FotoCapture[];
}
