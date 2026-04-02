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
 * run-autoplan — Wrapper um auto_plan_full() RPC
 * Startet die Staffellauf-Pipeline als HTTPS-Endpoint.
 *
 * POST /functions/v1/run-autoplan
 * Body: { project_id: string }
 */
Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  let userAuthHeader: string | null = null;
  try {
    const auth = await authenticate(req, { allowServiceRole: true });
    if (auth.source === "user") {
      const user = await requireUserContext(req);
      assertRole(user, ["gf", "bauleiter"]);
      userAuthHeader = user.authHeader;
    }
  } catch (e) {
    const message = (e as Error).message;
    const status = message === "Forbidden" ? 403 : 401;
    return errorResponse(message, status, req);
  }

  try {
    const { project_id } = await req.json();

    if (!project_id) {
      return errorResponse("project_id ist erforderlich", 400, req);
    }

    if (userAuthHeader) {
      await requireProjectAccess(userAuthHeader, project_id);
    }

    const sb = createServiceClient();

    // Projekt existiert?
    const { data: project, error: projErr } = await sb
      .from("projects")
      .select("id, name, status, planned_start, planned_end")
      .eq("id", project_id)
      .single();

    if (projErr || !project) {
      return errorResponse("Projekt nicht gefunden", 404, req);
    }

    // auto_plan_full via RPC aufrufen
    const { data, error } = await sb.rpc("auto_plan_full", {
      p_project_id: project_id,
    });

    if (error) {
      console.error("auto_plan_full RPC error:", error);
      return errorResponse("Autoplanung fehlgeschlagen: " + error.message, 500, req);
    }

    // auto_plan_full returned bereits JSONB mit success, schedule, material, etc.
    return jsonResponse(data, 200, req);
  } catch (e) {
    console.error("run-autoplan error:", e);
    const message = (e as Error).message;
    const status = message === "Forbidden" ? 403 : 500;
    return errorResponse("Interner Fehler: " + message, status, req);
  }
});
