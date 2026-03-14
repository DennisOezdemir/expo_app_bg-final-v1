/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { handleCors } from "../_shared/cors.ts";
import { authenticate } from "../_shared/auth.ts";
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

  try {
    await authenticate(req);
  } catch (e) {
    return errorResponse((e as Error).message, 401);
  }

  try {
    const body = await req.json();
    const { project_id, auto } = body;

    const sb = createServiceClient();

    if (project_id) {
      // Einzelnes Projekt
      const { data, error } = await sb.rpc("fn_godmode_learner", {
        p_project_id: project_id,
      });

      if (error) {
        return errorResponse("Godmode fehlgeschlagen: " + error.message, 500);
      }

      return jsonResponse(data);
    }

    if (auto) {
      // Alle kürzlich abgeschlossenen Projekte (letzte 30 Tage) die noch nicht gelernt wurden
      const { data: projects, error: projErr } = await sb
        .from("projects")
        .select("id, name, status")
        .eq("status", "COMPLETED")
        .gte("updated_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (projErr) {
        return errorResponse("Projekte laden fehlgeschlagen: " + projErr.message, 500);
      }

      if (!projects?.length) {
        return jsonResponse({
          success: true,
          message: "Keine kürzlich abgeschlossenen Projekte gefunden",
          projects_processed: 0,
        });
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
      });
    }

    return errorResponse("project_id oder auto=true ist erforderlich");
  } catch (e) {
    console.error("run-godmode error:", e);
    return errorResponse("Interner Fehler: " + (e as Error).message, 500);
  }
});
