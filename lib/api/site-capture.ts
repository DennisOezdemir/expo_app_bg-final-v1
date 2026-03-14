import { supabase } from "@/lib/supabase";

export interface SiteCapture {
  id: string;
  project_id: string;
  status: "recording" | "processing" | "draft_ready" | "completed";
  capture_date: string;
  notes: string | null;
  checklist_data: Record<string, any>;
  transcript_raw: string | null;
  transcript_structured: any | null;
  magicplan_matched: boolean;
  offer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistData {
  zugang: boolean;
  strom: boolean;
  wasser: boolean;
  aufzug: boolean;
  parken: boolean;
  besonderheiten: string;
}

export const DEFAULT_CHECKLIST: ChecklistData = {
  zugang: false,
  strom: false,
  wasser: false,
  aufzug: false,
  parken: false,
  besonderheiten: "",
};

export async function createSiteCapture(projectId: string): Promise<SiteCapture> {
  const { data, error } = await supabase
    .from("site_captures")
    .insert({
      project_id: projectId,
      status: "recording",
      checklist_data: DEFAULT_CHECKLIST,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateSiteCapture(
  captureId: string,
  updates: Partial<Pick<SiteCapture, "notes" | "checklist_data" | "status">>
): Promise<void> {
  const { error } = await supabase
    .from("site_captures")
    .update(updates)
    .eq("id", captureId);

  if (error) throw error;
}

export async function fetchSiteCapture(captureId: string): Promise<SiteCapture | null> {
  const { data, error } = await supabase
    .from("site_captures")
    .select("*")
    .eq("id", captureId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchSiteCapturesForProject(projectId: string): Promise<SiteCapture[]> {
  const { data, error } = await supabase
    .from("site_captures")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function completeSiteCapture(
  captureId: string,
  projectId: string,
  payload?: Record<string, unknown>
): Promise<void> {
  // Update status
  const { error: updateError } = await supabase
    .from("site_captures")
    .update({ status: "processing" })
    .eq("id", captureId);

  if (updateError) throw updateError;

  // Emit event for n8n pipeline
  const { error: eventError } = await supabase.from("events").insert({
    event_type: "SITE_CAPTURE_COMPLETED",
    project_id: projectId,
    source_system: "app",
    source_flow: "baustellenaufnahme",
    payload: {
      site_capture_id: captureId,
      ...(payload ?? {}),
    },
  });

  if (eventError) throw eventError;
}
