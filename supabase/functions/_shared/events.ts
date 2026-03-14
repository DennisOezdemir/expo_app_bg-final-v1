import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * Log an event to the events table (event-driven architecture).
 */
export async function logEvent(
  sb: SupabaseClient,
  params: {
    event_type: string;
    project_id?: string;
    source_system?: string;
    source_flow: string;
    payload: Record<string, unknown>;
    idempotency_key?: string;
  }
) {
  const { error } = await sb.from("events").insert({
    event_type: params.event_type,
    project_id: params.project_id ?? null,
    source_system: params.source_system ?? "edge_function",
    source_flow: params.source_flow,
    payload: params.payload,
    idempotency_key: params.idempotency_key ?? null,
  });

  if (error) {
    console.error("Failed to log event:", error.message);
  }
}
