import { createServiceClient } from "./supabase-client.ts";

/**
 * Authenticate request via JWT, service_role key, or Agent API Key.
 */
export async function authenticate(req: Request): Promise<{
  authenticated: boolean;
  source: "jwt" | "service_role" | "agent";
  agent_name?: string;
  user_id?: string;
}> {
  // 1. Check for Agent API Key
  const agentKey = req.headers.get("x-agent-key");
  if (agentKey) {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from("agent_api_keys")
      .select("name, is_active, rate_limit_per_minute")
      .eq("key_hash", await hashKey(agentKey))
      .single();

    if (error || !data || !data.is_active) {
      throw new Error("Invalid or inactive agent API key");
    }
    return { authenticated: true, source: "agent", agent_name: data.name };
  }

  // 2. Check Authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing authorization");
  }

  const token = authHeader.replace("Bearer ", "");

  // 3. Decode JWT payload to check role (without full verification — Supabase handles that)
  try {
    const payloadB64 = token.split(".")[1];
    if (payloadB64) {
      const payload = JSON.parse(atob(payloadB64));
      // service_role JWT has role: "service_role"
      if (payload.role === "service_role") {
        return { authenticated: true, source: "service_role" };
      }
      // anon key also allowed — RLS handles access control
      if (payload.role === "anon") {
        return { authenticated: true, source: "jwt" };
      }
    }
  } catch {
    // Not a valid JWT structure, continue to user check
  }

  // 4. Try to validate as user JWT
  const sb = createServiceClient();
  const {
    data: { user },
    error,
  } = await sb.auth.getUser(token);

  if (error || !user) {
    throw new Error("Invalid JWT token");
  }

  return { authenticated: true, source: "jwt", user_id: user.id };
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
