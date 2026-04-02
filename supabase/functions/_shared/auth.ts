import { createServiceClient, createAnonClient } from "./supabase-client.ts";

export type AppRole = "gf" | "bauleiter" | "monteur";

interface AuthenticateOptions {
  allowAgent?: boolean;
  allowServiceRole?: boolean;
  requireUser?: boolean;
  requiredAgentPermission?: string;
}

export interface AuthResult {
  authenticated: true;
  source: "user" | "service_role" | "agent";
  agent_name?: string;
  user_id?: string;
  email?: string | null;
  authHeader?: string;
  permissions?: string[];
  user?: {
    id: string;
    email: string | null;
    user_metadata?: Record<string, unknown>;
  };
}

export interface UserContext {
  userId: string;
  email: string | null;
  authHeader: string;
  teamMemberId: string | null;
  name: string;
  role: AppRole;
  rawRole: string | null;
  isAdmin: boolean;
}

/**
 * Authenticate request via JWT, service_role key, or Agent API Key.
 */
export async function authenticate(
  req: Request,
  options: AuthenticateOptions = {},
): Promise<AuthResult> {
  // 1. Check for Agent API Key
  const agentKey = req.headers.get("x-agent-key");
  if (agentKey) {
    if (!options.allowAgent) {
      throw new Error("Agent authentication is not allowed");
    }

    const sb = createServiceClient();
    const { data, error } = await sb
      .from("agent_api_keys")
      .select("name, permissions, is_active, rate_limit_per_minute")
      .eq("key_hash", await hashKey(agentKey))
      .single();

    if (error || !data || !data.is_active) {
      throw new Error("Invalid or inactive agent API key");
    }

    const permissions = Array.isArray(data.permissions) ? data.permissions : [];
    if (
      options.requiredAgentPermission &&
      !permissions.includes("*") &&
      !permissions.includes(options.requiredAgentPermission)
    ) {
      throw new Error("Agent API key is not allowed to call this function");
    }

    return {
      authenticated: true,
      source: "agent",
      agent_name: data.name,
      permissions,
    };
  }

  // 2. Check Authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing authorization");
  }

  const token = authHeader.replace("Bearer ", "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  // 3. Explicit internal service auth via exact key match only.
  if (options.allowServiceRole && serviceRoleKey && token === serviceRoleKey) {
    return {
      authenticated: true,
      source: "service_role",
      authHeader,
    };
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

  if (options.requireUser && !user.id) {
    throw new Error("User authentication required");
  }

  return {
    authenticated: true,
    source: "user",
    user_id: user.id,
    email: user.email ?? null,
    authHeader,
    user: {
      id: user.id,
      email: user.email ?? null,
      user_metadata: user.user_metadata ?? {},
    },
  };
}

export function getUserClient(authHeader: string) {
  return createAnonClient(authHeader);
}

export async function requireUserContext(req: Request): Promise<UserContext> {
  const auth = await authenticate(req, { requireUser: true });
  if (auth.source !== "user" || !auth.user_id || !auth.authHeader) {
    throw new Error("User authentication required");
  }

  const sb = createServiceClient();
  const { data: member } = await sb
    .from("team_members")
    .select("id, name, role, is_admin")
    .eq("auth_id", auth.user_id)
    .maybeSingle();

  const metadata = auth.user?.user_metadata ?? {};
  const metadataName = readString(metadata.full_name) || readString(metadata.name);
  const rawRole = member?.role ?? readString(metadata.role);

  return {
    userId: auth.user_id,
    email: auth.email ?? null,
    authHeader: auth.authHeader,
    teamMemberId: member?.id ?? null,
    name: member?.name ?? metadataName ?? auth.email?.split("@")[0] ?? "Unbekannt",
    role: normalizeAppRole(rawRole, member?.is_admin ?? false),
    rawRole: rawRole ?? null,
    isAdmin: member?.is_admin ?? false,
  };
}

export async function requireProjectAccess(
  authHeader: string,
  projectId: string,
): Promise<void> {
  const userClient = getUserClient(authHeader);
  const { data, error } = await userClient
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Forbidden");
  }
}

export async function requireOfferAccess(
  authHeader: string,
  offerId: string,
): Promise<{ id: string; project_id: string }> {
  const userClient = getUserClient(authHeader);
  const { data, error } = await userClient
    .from("offers")
    .select("id, project_id")
    .eq("id", offerId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Forbidden");
  }

  return data;
}

export async function requireProtocolAccess(
  authHeader: string,
  protocolId: string,
): Promise<{ id: string; project_id: string; offer_id: string | null; protocol_type: string }> {
  const userClient = getUserClient(authHeader);
  const { data, error } = await userClient
    .from("inspection_protocols")
    .select("id, project_id, offer_id, protocol_type")
    .eq("id", protocolId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Forbidden");
  }

  return data;
}

export function assertRole(
  user: UserContext,
  allowedRoles: AppRole[],
  message = "Forbidden",
) {
  if (!allowedRoles.includes(user.role)) {
    throw new Error(message);
  }
}

export function normalizeAppRole(role?: string | null, isAdmin = false): AppRole {
  const normalized = role?.trim().toLowerCase();

  if (isAdmin || normalized === "gf" || normalized === "geschäftsführer" || normalized === "geschaeftsfuehrer") {
    return "gf";
  }

  if (normalized === "bauleiter" || normalized === "bauleiterin" || normalized === "polier") {
    return "bauleiter";
  }

  return "monteur";
}

export function extractProjectIdFromStoragePath(storagePath: string): string | null {
  const match = storagePath.match(/^projects\/([0-9a-f-]{36})\//i);
  return match?.[1] ?? null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
