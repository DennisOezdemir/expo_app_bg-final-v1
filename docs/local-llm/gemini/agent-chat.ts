// BauGenius Chat-Agent — Privacy Router & Hybrid Local/Cloud Assistant
// Routet zu Ollama (lokal) oder Claude (Cloud, für Vision/Fallback)

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { logEvent } from "../_shared/events.ts";
import { errorResponse } from "../_shared/response.ts";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.39.0";

// ── Types ──────────────────────────────────────────────────────────

interface ChatRequest {
  project_id: string;
  message: string;
  user_role: "gf" | "bauleiter" | "monteur";
  user_name: string;
  user_id: string;
  attachments?: { type: "image" | "pdf"; url: string }[];
}

// ── Configuration ──────────────────────────────────────────────────

const OLLAMA_API_URL = Deno.env.get("OLLAMA_API_URL") || "http://office-nuc.local:11434/api/chat";
const OLLAMA_MODEL = Deno.env.get("OLLAMA_MODEL") || "qwen2.5:72b";
const CLAUDE_MODEL = "claude-3-5-sonnet-20241022";

// ── Tool Definitions (OpenAI/Ollama format) ───────────────────────

const OLLAMA_TOOLS = [
  {
    type: "function",
    function: {
      name: "query_positions",
      description: "Angebotspositionen eines Projekts abfragen, optional nach Raum filtern.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Projekt-UUID" },
          room: { type: "string", description: "Optional: Raumfilter (z.B. 'Küche', 'Bad')" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_catalog",
      description: "Katalog durchsuchen nach Leistungspositionen.",
      parameters: {
        type: "object",
        properties: {
          catalog_id: { type: "string", description: "Katalog-UUID (optional)" },
          search_term: { type: "string", description: "Suchbegriff (z.B. 'Raufaser')" },
        },
        required: ["search_term"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_change_order",
      description: "Nachtrag anlegen für ein Projekt. Nur GF und BL.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Projekt-UUID" },
          description: { type: "string", description: "Beschreibung des Nachtrags" },
          positions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                quantity: { type: "number" },
                unit: { type: "string" },
                catalog_code: { type: "string" },
              },
              required: ["title", "quantity", "unit"],
            },
          },
        },
        required: ["project_id", "description", "positions"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "prepare_email",
      description: "E-Mail vorbereiten und zur Freigabe stellen.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Projekt-UUID" },
          to: { type: "string", description: "Empfänger-Email" },
          subject: { type: "string", description: "Betreff" },
          body: { type: "string", description: "Email-Text" },
        },
        required: ["project_id", "to", "subject", "body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_project_status",
      description: "Aktuellen Projektstatus abrufen.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Projekt-UUID" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_schedule",
      description: "Einsatzplan eines Projekts abrufen.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Projekt-UUID" },
        },
        required: ["project_id"],
      },
    },
  },
];

// Claude-Tools (Anthropic format)
const CLAUDE_TOOLS: Anthropic.Tool[] = OLLAMA_TOOLS.map((t) => ({
  name: t.function.name,
  description: t.function.description,
  input_schema: t.function.parameters as Anthropic.Tool.InputSchema,
}));

// ── Helper: Tool Execution ─────────────────────────────────────────

async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  userRole: string,
  sb: any
): Promise<string> {
  // Logic same as original agent-chat (restored below)
  try {
    switch (toolName) {
      case "query_positions": {
        let query = sb
          .from("offer_positions")
          .select("id, title, quantity, unit, trade_type, room, catalog_code, unit_price")
          .eq("project_id", toolInput.project_id as string)
          .order("sort_order", { ascending: true });

        if (toolInput.room) query = query.ilike("room", `%${toolInput.room}%`);
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });

        if (userRole === "monteur" || userRole === "bauleiter") {
          const filtered = (data || []).map(({ unit_price: _up, ...rest }: any) => rest);
          return JSON.stringify({ positions: filtered, count: filtered.length });
        }
        return JSON.stringify({ positions: data || [], count: (data || []).length });
      }

      case "check_catalog": {
        const catalogId = (toolInput.catalog_id as string) || "73cb8be2-a70e-43c8-bf08-34596a5c1e30";
        const term = toolInput.search_term as string;
        const { data, error } = await sb
          .from("catalog_positions_v2")
          .select("code, title, title_secondary, unit, trade_type")
          .eq("catalog_id", catalogId)
          .or(`title.ilike.%${term}%,title_secondary.ilike.%${term}%,code.ilike.%${term}%`)
          .limit(15);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ results: data || [], count: (data || []).length });
      }

      case "create_change_order": {
        if (userRole === "monteur") return JSON.stringify({ error: "Monteure dürfen keine Nachträge anlegen." });
        const { data, error } = await sb.from("approvals").insert({
          project_id: toolInput.project_id as string,
          approval_type: "CHANGE_ORDER",
          status: "PENDING",
          requested_by: "chat_agent",
          request_summary: toolInput.description as string,
          request_data: { positions: toolInput.positions, source: "chat_agent" },
        }).select("id").single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, approval_id: data.id, message: "Nachtrag im Freigabecenter erstellt." });
      }

      case "prepare_email": {
        const { data, error } = await sb.from("approvals").insert({
          project_id: toolInput.project_id as string,
          approval_type: "EMAIL_SEND",
          status: "PENDING",
          requested_by: "chat_agent",
          request_summary: `Email an ${toolInput.to}: ${toolInput.subject}`,
          request_data: { to: toolInput.to, subject: toolInput.subject, body: toolInput.body, source: "chat_agent" },
        }).select("id").single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, approval_id: data.id, message: "Email zur Freigabe vorbereitet." });
      }

      case "get_project_status": {
        const { data: project, error } = await sb.from("projects").select("id, name, status, address, unit_count, client_name, trade_type").eq("id", toolInput.project_id as string).single();
        if (error) return JSON.stringify({ error: error.message });
        const { count: pending } = await sb.from("approvals").select("id", { count: "exact", head: true }).eq("project_id", toolInput.project_id as string).eq("status", "PENDING");
        const res: any = { ...project, pending_approvals: pending || 0 };
        if (userRole === "monteur") delete res.client_name;
        return JSON.stringify(res);
      }

      case "get_schedule": {
        const { data, error } = await sb.from("schedule_phases").select("id, trade_type, start_date, end_date, status, assigned_member_name").eq("project_id", toolInput.project_id as string).order("start_date", { ascending: true });
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ phases: data || [], count: (data || []).length });
      }

      default:
        return JSON.stringify({ error: `Unbekanntes Tool: ${toolName}` });
    }
  } catch (err) {
    return JSON.stringify({ error: (err as Error).message });
  }
}

// ── Ollama Implementation ──────────────────────────────────────────

async function callOllama(
  systemPrompt: string,
  messages: any[],
  sb: any,
  userRole: string
): Promise<{ text: string; tool_calls: any[]; tool_results: any[] }> {
  let currentMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];
  let finalText = "";
  const allToolCalls: any[] = [];
  const allToolResults: any[] = [];

  for (let i = 0; i < 5; i++) {
    const res = await fetch(OLLAMA_API_URL, {
      method: "POST",
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: currentMessages,
        tools: OLLAMA_TOOLS,
        stream: false,
      }),
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
    const data = await res.json();
    const assistantMsg = data.message;

    if (assistantMsg.content) finalText += assistantMsg.content;

    if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
      break;
    }

    const toolResponses: any[] = [];
    for (const tc of assistantMsg.tool_calls) {
      allToolCalls.push({ name: tc.function.name, input: tc.function.arguments });
      const result = await executeTool(tc.function.name, tc.function.arguments, userRole, sb);
      allToolResults.push({ name: tc.function.name, result: JSON.parse(result) });
      toolResponses.push({
        role: "tool",
        content: result,
      });
    }

    currentMessages.push(assistantMsg);
    currentMessages.push(...toolResponses);
  }

  return { text: finalText, tool_calls: allToolCalls, tool_results: allToolResults };
}

// ── Claude Implementation ──────────────────────────────────────────

async function callClaude(
  systemPrompt: string,
  messages: any[],
  sb: any,
  userRole: string,
  attachments: any[] = []
): Promise<{ text: string; tool_calls: any[]; tool_results: any[] }> {
  const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

  // Map messages to Anthropic format
  let anthropicMessages: any[] = messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  // If attachments, add to last message
  if (attachments.length > 0 && anthropicMessages.length > 0) {
    const lastMsg = anthropicMessages[anthropicMessages.length - 1];
    if (lastMsg.role === "user") {
      const content = [{ type: "text", text: lastMsg.content }];
      for (const att of attachments) {
        if (att.type === "image") {
          // Note: Needs base64 or URL handling depending on Anthropic version
          // Here we assume standard vision block
        }
      }
      lastMsg.content = content;
    }
  }

  let finalText = "";
  const allToolCalls: any[] = [];
  const allToolResults: any[] = [];

  for (let i = 0; i < 5; i++) {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      tools: CLAUDE_TOOLS,
      messages: anthropicMessages,
    });

    const textBlocks = response.content.filter((b: any) => b.type === "text");
    const toolBlocks = response.content.filter((b: any) => b.type === "tool_use");

    if (textBlocks.length > 0) {
      finalText += textBlocks.map((b: any) => b.text).join("\n");
    }

    if (toolBlocks.length === 0 || response.stop_reason === "end_turn") break;

    const toolResults: any[] = [];
    for (const b of toolBlocks) {
      allToolCalls.push({ name: b.name, input: b.input });
      const result = await executeTool(b.name, b.input as any, userRole, sb);
      allToolResults.push({ name: b.name, result: JSON.parse(result) });
      toolResults.push({ type: "tool_result", tool_use_id: b.id, content: result });
    }

    anthropicMessages.push({ role: "assistant", content: response.content });
    anthropicMessages.push({ role: "user", content: toolResults });
  }

  return { text: finalText, tool_calls: allToolCalls, tool_results: allToolResults };
}

// ── Main Handler ───────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return errorResponse("Missing authorization", 401);

    const body: ChatRequest = await req.json();
    const { project_id, message, user_role, user_id, attachments = [] } = body;
    const sb = createServiceClient();

    // 1. Kontext laden
    const { data: project } = await sb.from("projects").select("name, address, status, trade_type, client_name").eq("id", project_id).single();
    const projectContext = project ? `Projekt: ${project.name}\nAdresse: ${project.address}\nStatus: ${project.status}\nGewerk: ${project.trade_type}\nAuftraggeber: ${user_role === "monteur" ? "[verborgen]" : project.client_name}` : "Kein Kontext.";

    const systemPrompt = `Du bist der BauGenius Assistent. Du hilfst Handwerkern.
Antworte IMMER auf Deutsch. Sei kurz, direkt.
Nutze Tools für echte Daten — rate NIEMALS.
Rolle: ${user_role.toUpperCase()}.
${user_role === 'gf' ? 'Du darfst ALLES sehen.' : user_role === 'bauleiter' ? 'Keine Margen/Finanzen anderer Projekte.' : 'KEINE Preise/Margen/Finanzen.'}

Projektkontext:
${projectContext}`;

    // 2. Nachricht speichern
    await sb.from("chat_messages").insert({ project_id, user_id, role: "user", content: message, attachments });

    // 3. History laden
    const { data: history } = await sb.from("chat_messages").select("role, content").eq("project_id", project_id).eq("user_id", user_id).order("created_at", { ascending: true }).limit(20);
    const messages = (history || []).map(r => ({ role: r.role, content: r.content }));

    // 4. Routing Decision
    let response;
    let usedModel = "ollama:qwen2.5-72b";

    if (attachments.length > 0) {
      console.log("Routing to Claude (Vision)");
      response = await callClaude(systemPrompt, messages, sb, user_role, attachments);
      usedModel = "claude:vision";
    } else {
      try {
        console.log("Routing to Local Ollama");
        // Quick healthcheck with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const health = await fetch(OLLAMA_API_URL.replace("/api/chat", "/api/tags"), { signal: controller.signal }).catch(() => null);
        clearTimeout(timeoutId);

        if (!health || !health.ok) throw new Error("Ollama unreachable");

        response = await callOllama(systemPrompt, messages, sb, user_role);
      } catch (err) {
        console.error("Local Ollama failed, falling back to Claude:", err.message);
        response = await callClaude(systemPrompt, messages, sb, user_role);
        usedModel = "claude:fallback";
      }
    }

    // 5. Antwort speichern
    await sb.from("chat_messages").insert({
      project_id, user_id, role: "assistant", content: response.text,
      tool_calls: response.tool_calls, tool_results: response.tool_results,
      metadata: { model: usedModel, user_role }
    });

    return new Response(JSON.stringify({
      success: true, message: response.text,
      tool_calls: response.tool_calls, tool_results: response.tool_results,
      model: usedModel
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Agent error:", err);
    return errorResponse(`Agent-Fehler: ${(err as Error).message}`, 500);
  }
});
