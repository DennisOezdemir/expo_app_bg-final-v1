// BauGenius Push-Notification Edge Function
// Sendet Push-Notifications via Expo Push API
//
// ── Trigger-Szenarien (für n8n Flows / Sweeper) ──────────────────
//
// 1. Freigabe offen seit 24h → Push an alle GFs
//    event_type: 'approval_reminder'
//    payload: { project_name, intake_id, hours_pending }
//
// 2. Material fehlt für morgen → Push an zuständigen Bauleiter
//    event_type: 'material_missing'
//    payload: { project_name, material_items, scheduled_date }
//
// 3. Rechnung überfällig → Push an GF
//    event_type: 'invoice_overdue'
//    payload: { invoice_number, client_name, days_overdue, amount }
//
// 4. Neuer Auftrag eingegangen → Push an GF
//    event_type: 'new_intake'
//    payload: { project_name, client_name, source }
//
// 5. Planung fertig → Push an Bauleiter
//    event_type: 'planning_complete'
//    payload: { project_name, scheduled_date, team_members }

import { handleCors } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { authenticate } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";
import { logEvent } from "../_shared/events.ts";

// ── Types ──────────────────────────────────────────────────────────

interface PushRequest {
  // Einzelner User
  user_id?: string;
  // Oder nach Rolle (alle aktiven team_members mit dieser Rolle)
  role?: "GF" | "Bauleiter" | "Monteur";
  // Notification Content
  title: string;
  body: string;
  // Optional: Navigation Data (screen + params)
  data?: Record<string, unknown>;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  sound: "default";
  data?: Record<string, unknown>;
  channelId?: string;
}

// ── Handler ────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Auth prüfen (service_role oder agent key)
    const auth = await authenticate(req);
    if (!auth.authenticated) {
      return errorResponse("Unauthorized", 401);
    }

    // Nur service_role oder agents dürfen Pushes senden
    if (auth.source !== "service_role" && auth.source !== "agent") {
      return errorResponse("Push senden nur mit service_role oder agent key erlaubt", 403);
    }

    const payload: PushRequest = await req.json();

    // Validierung
    if (!payload.title || !payload.body) {
      return errorResponse("title und body sind Pflichtfelder");
    }
    if (!payload.user_id && !payload.role) {
      return errorResponse("user_id oder role muss angegeben werden");
    }

    const sb = createServiceClient();

    // Push-Tokens sammeln
    let query = sb
      .from("team_members")
      .select("id, name, push_token")
      .eq("active", true)
      .not("push_token", "is", null);

    if (payload.user_id) {
      query = query.eq("auth_id", payload.user_id);
    } else if (payload.role) {
      query = query.eq("role", payload.role);
    }

    const { data: members, error: queryError } = await query;

    if (queryError) {
      return errorResponse(`DB Fehler: ${queryError.message}`, 500);
    }

    if (!members || members.length === 0) {
      return jsonResponse({
        success: true,
        sent: 0,
        message: "Keine Push-Tokens gefunden",
      });
    }

    // Expo Push Messages bauen
    const messages: ExpoPushMessage[] = members
      .filter((m) => m.push_token)
      .map((m) => ({
        to: m.push_token!,
        title: payload.title,
        body: payload.body,
        sound: "default" as const,
        data: payload.data,
        channelId: "default",
      }));

    if (messages.length === 0) {
      return jsonResponse({
        success: true,
        sent: 0,
        message: "Keine gültigen Push-Tokens",
      });
    }

    // Expo Push API aufrufen (Batches von max 100)
    const results = [];
    for (let i = 0; i < messages.length; i += 100) {
      const batch = messages.slice(i, i + 100);
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(batch),
      });

      const result = await response.json();
      results.push(result);
    }

    // Event loggen
    await logEvent(sb, {
      event_type: "push_notification_sent",
      source_flow: "send-push",
      payload: {
        title: payload.title,
        role: payload.role || null,
        user_id: payload.user_id || null,
        recipients: members.map((m) => m.name),
        count: messages.length,
      },
    });

    return jsonResponse({
      success: true,
      sent: messages.length,
      recipients: members.map((m) => m.name),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[send-push] Error:", message);
    return errorResponse(message, 500);
  }
});
