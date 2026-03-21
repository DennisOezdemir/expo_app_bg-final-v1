import { supabase } from "@/lib/supabase";

export interface ChatMessageRow {
  id: string;
  project_id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  tool_calls: { name: string; input: Record<string, unknown> }[] | null;
  tool_results: { name: string; result: Record<string, unknown> }[] | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  tool_calls?: { name: string; input: Record<string, unknown> }[];
  tool_results?: { name: string; result: Record<string, unknown> }[];
}

/**
 * Chat-Verlauf eines Projekts laden
 */
export async function fetchChatHistory(
  projectId: string
): Promise<ChatMessageRow[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) throw new Error(error.message);
  return (data || []) as ChatMessageRow[];
}

/**
 * Nachricht an den Chat-Agent senden (Edge Function)
 */
export async function sendChatMessage(params: {
  project_id: string;
  message: string;
  user_role: string;
  user_name: string;
  user_id: string;
}): Promise<SendMessageResponse> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("Supabase URL not configured");

  const res = await fetch(`${supabaseUrl}/functions/v1/agent-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ""}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      (errBody as { error?: string }).error || `Agent error: ${res.status}`
    );
  }

  return res.json();
}
