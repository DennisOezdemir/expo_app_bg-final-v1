/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { handleCors } from "../_shared/cors.ts";
import { requireUserContext } from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { errorResponse, jsonResponse } from "../_shared/response.ts";

interface SavePushTokenRequest {
  token: string;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const user = await requireUserContext(req);
    const body = await req.json() as SavePushTokenRequest;
    const token = body.token?.trim();

    if (!token) {
      return errorResponse("token ist erforderlich", 400, req);
    }

    const sb = createServiceClient();
    let matched = 0;

    const { error: updateByAuthId, count: authIdCount } = await sb
      .from("team_members")
      .update({ push_token: token, updated_at: new Date().toISOString() })
      .eq("auth_id", user.userId)
      .select("id", { count: "exact" });

    if (updateByAuthId) {
      throw new Error(updateByAuthId.message);
    }

    matched = authIdCount ?? 0;

    if (matched === 0 && user.email) {
      const { error: updateByEmail, count: emailCount } = await sb
        .from("team_members")
        .update({
          push_token: token,
          auth_id: user.userId,
          updated_at: new Date().toISOString(),
        })
        .eq("email", user.email)
        .select("id", { count: "exact" });

      if (updateByEmail) {
        throw new Error(updateByEmail.message);
      }

      matched = emailCount ?? 0;
    }

    if (matched === 0) {
      return errorResponse("Kein passendes Team-Mitglied für diesen Nutzer gefunden", 404, req);
    }

    return jsonResponse({ success: true, matched }, 200, req);
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
    console.error("[save-push-token] Error:", message, (err as Error).stack || "");
    return errorResponse(message, status, req);
  }
});
