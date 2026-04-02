/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { handleCors } from "../_shared/cors.ts";
import {
  assertRole,
  authenticate,
  requireProjectAccess,
  requireUserContext,
} from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

/**
 * run-godmode — Godmode Learner: SOLL vs IST vergleichen
 *
 * POST /functions/v1/run-godmode
 * Body: {
 *   project_id?: string,   // Einzelnes Projekt analysieren
 *   auto?: boolean          // Alle kürzlich abgeschlossenen Projekte (für Cron)
 * }
 */
Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  let userAuthHeader: string | null = null;
  try {
    const auth = await authenticate(req, { allowServiceRole: true });
    if (auth.source === "user") {
      const user = await requireUserContext(req);
      assertRole(user, ["gf"]);
      userAuthHeader = user.authHeader;
    }
  } catch (e) {
    const message = (e as Error).message;
    const status = message === "Forbidden" ? 403 : 401;
    return errorResponse(message, status, req);
  }

  try {
    const body = await req.json();
    const { project_id, auto } = body;

    const sb = createServiceClient();

    if (project_id) {
      if (userAuthHeader) {
        await requireProjectAccess(userAuthHeader, project_id);
      }

      // Einzelnes Projekt
      const { data, error } = await sb.rpc("fn_godmode_learner", {
        p_project_id: project_id,
      });

      if (error) {
        return errorResponse("Godmode fehlgeschlagen: " + error.message, 500, req);
      }

      return jsonResponse(data, 200, req);
    }

    if (auto) {
      // Alle kürzlich abgeschlossenen Projekte (letzte 30 Tage) die noch nicht gelernt wurden
      const { data: projects, error: projErr } = await sb
        .from("projects")
        .select("id, name, status")
        .eq("status", "COMPLETED")
        .gte("updated_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (projErr) {
        return errorResponse("Projekte laden fehlgeschlagen: " + projErr.message, 500, req);
      }

      if (!projects?.length) {
        return jsonResponse({
          success: true,
          message: "Keine kürzlich abgeschlossenen Projekte gefunden",
          projects_processed: 0,
        }, 200, req);
      }

      // Prüfen welche schon gelernt wurden (Event exists)
      const results = [];
      for (const proj of projects) {
        const { data: existingEvent } = await sb
          .from("events")
          .select("id")
          .eq("event_type", "GODMODE_LEARNING_COMPLETED")
          .eq("project_id", proj.id)
          .limit(1)
          .maybeSingle();

        if (existingEvent) {
          results.push({ project_id: proj.id, name: proj.name, status: "already_learned" });
          continue;
        }

        const { data, error } = await sb.rpc("fn_godmode_learner", {
          p_project_id: proj.id,
        });

        results.push({
          project_id: proj.id,
          name: proj.name,
          status: error ? "error" : "learned",
          result: error ? error.message : data,
        });
      }

      return jsonResponse({
        success: true,
        projects_processed: results.length,
        results,
      }, 200, req);
    }

    return errorResponse("project_id oder auto=true ist erforderlich", 400, req);
  } catch (e) {
    console.error("run-godmode error:", e);
    const message = (e as Error).message;
    const status = message === "Forbidden" ? 403 : 500;
    return errorResponse("Interner Fehler: " + message, status, req);
  }
});
