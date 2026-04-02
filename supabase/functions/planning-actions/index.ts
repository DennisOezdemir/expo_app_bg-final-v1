/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { handleCors } from "../_shared/cors.ts";
import {
  assertRole,
  requireProjectAccess,
  requireUserContext,
} from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { errorResponse, jsonResponse } from "../_shared/response.ts";

interface PlanningActionRequest {
  action: "start_auto_plan" | "confirm_proposed_phases" | "discard_proposed_phases";
  project_id: string;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const user = await requireUserContext(req);
    assertRole(user, ["gf", "bauleiter"]);

    const body = await req.json() as PlanningActionRequest;
    if (!body.project_id || !body.action) {
      return errorResponse("project_id und action sind erforderlich", 400, req);
    }

    await requireProjectAccess(user.authHeader, body.project_id);

    const sb = createServiceClient();

    switch (body.action) {
      case "start_auto_plan": {
        const { data, error } = await sb.rpc("auto_plan_full", {
          p_project_id: body.project_id,
        });
        if (error) throw new Error(error.message);
        return jsonResponse(data, 200, req);
      }

      case "confirm_proposed_phases": {
        const { data, error } = await sb.rpc("confirm_proposed_phases", {
          p_project_id: body.project_id,
        });
        if (error) throw new Error(error.message);
        return jsonResponse(data, 200, req);
      }

      case "discard_proposed_phases": {
        const { data, error } = await sb.rpc("discard_proposed_phases", {
          p_project_id: body.project_id,
        });
        if (error) throw new Error(error.message);
        return jsonResponse(data, 200, req);
      }

      default:
        return errorResponse(`Unbekannte action: ${body.action}`, 400, req);
    }
  } catch (err) {
    const message = (err as Error).message;
    const authErrors = new Set([
      "Missing authorization",
      "Invalid JWT token",
      "User authentication required",
    ]);
    const status = message === "Forbidden"
      ? 403
      : authErrors.has(message)
      ? 401
      : 500;
    console.error("[planning-actions] Error:", message, (err as Error).stack || "");
    return errorResponse(message, status, req);
  }
});
