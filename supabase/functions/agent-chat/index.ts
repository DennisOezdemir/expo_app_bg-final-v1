// BauGenius Chat-Agent — Claude Tool Use Edge Function
// Projektbezogener KI-Assistent mit rollenbasiertem Zugriff

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
}

// ── System Prompts per Role ────────────────────────────────────────

function buildSystemPrompt(role: string, projectContext: string): string {
  const base = `Du bist der BauGenius Assistent. Du hilfst Handwerkern auf der Baustelle.
Du antwortest IMMER auf Deutsch. Sei kurz, direkt, hilfsbereit.
Nutze die verfügbaren Tools um echte Daten abzufragen — rate NIEMALS.

Aktueller Projektkontext:
${projectContext}`;

  const roleRestrictions: Record<string, string> = {
    gf: `\nDu sprichst mit dem Geschäftsführer. Er darf ALLES sehen: Margen, Finanzen, alle Projekte, Preise.`,
    bauleiter: `\nDu sprichst mit einem Bauleiter. Er darf sehen: Projektdaten, Positionen, Material, Planung.
VERBOTEN: Margen, Finanzen anderer Projekte, Einkaufspreise, Stundensätze.
Wenn nach Margen/Finanzen gefragt wird: "Diese Information ist nur für die Geschäftsführung verfügbar."`,
    monteur: `\nDu sprichst mit einem Monteur. Er darf sehen: Sein Projekt, seine Aufgaben, Materialien.
VERBOTEN: Preise, Margen, Finanzen, andere Projekte, Angebotssummen.
Wenn nach Preisen/Margen gefragt wird: "Diese Information ist nur für die Geschäftsführung verfügbar."`,
  };

  return base + (roleRestrictions[role] || roleRestrictions.monteur);
}

// ── Tool Definitions ───────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: "query_positions",
    description:
      "Angebotspositionen eines Projekts abfragen, optional nach Raum filtern. Zeigt Positionen mit Menge, Einheit und Gewerk.",
    input_schema: {
      type: "object" as const,
      properties: {
        project_id: { type: "string", description: "Projekt-UUID" },
        room: {
          type: "string",
          description: "Optional: Raumfilter (z.B. 'Küche', 'Bad')",
        },
      },
      required: ["project_id"],
    },
  },
  {
    name: "check_catalog",
    description:
      "Katalog durchsuchen nach Leistungspositionen. Findet passende Positionen mit Code, Beschreibung und Einheit.",
    input_schema: {
      type: "object" as const,
      properties: {
        catalog_id: {
          type: "string",
          description: "Katalog-UUID (optional, Default: DBL-2026)",
        },
        search_term: {
          type: "string",
          description: "Suchbegriff (z.B. 'Raufaser', 'Thermostat')",
        },
      },
      required: ["search_term"],
    },
  },
  {
    name: "create_change_order",
    description:
      "Nachtrag anlegen für ein Projekt. Erstellt einen Freigabe-Eintrag im Freigabecenter. Nur GF und BL dürfen das.",
    input_schema: {
      type: "object" as const,
      properties: {
        project_id: { type: "string", description: "Projekt-UUID" },
        description: {
          type: "string",
          description: "Beschreibung des Nachtrags",
        },
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
          description: "Nachtragspositionen",
        },
      },
      required: ["project_id", "description", "positions"],
    },
  },
  {
    name: "prepare_email",
    description:
      "E-Mail vorbereiten und zur Freigabe ins Freigabecenter stellen. Der GF muss vor dem Versand freigeben.",
    input_schema: {
      type: "object" as const,
      properties: {
        project_id: { type: "string", description: "Projekt-UUID" },
        to: { type: "string", description: "Empfänger-Email" },
        subject: { type: "string", description: "Betreff" },
        body: { type: "string", description: "Email-Text" },
      },
      required: ["project_id", "to", "subject", "body"],
    },
  },
  {
    name: "get_project_status",
    description:
      "Aktuellen Projektstatus abrufen: Status, Fortschritt, offene Aufgaben, letzte Aktivitäten.",
    input_schema: {
      type: "object" as const,
      properties: {
        project_id: { type: "string", description: "Projekt-UUID" },
      },
      required: ["project_id"],
    },
  },
  {
    name: "get_schedule",
    description:
      "Einsatzplan eines Projekts abrufen: Phasen, zugewiesene Monteure, Zeiträume.",
    input_schema: {
      type: "object" as const,
      properties: {
        project_id: { type: "string", description: "Projekt-UUID" },
      },
      required: ["project_id"],
    },
  },
];

// ── Tool Execution ─────────────────────────────────────────────────

async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  userRole: string,
  sb: ReturnType<typeof createServiceClient>
): Promise<string> {
  try {
    switch (toolName) {
      case "query_positions": {
        let query = sb
          .from("offer_positions")
          .select(
            "id, title, quantity, unit, trade_type, room, catalog_code, unit_price"
          )
          .eq("project_id", toolInput.project_id as string)
          .order("sort_order", { ascending: true });

        if (toolInput.room) {
          query = query.ilike("room", `%${toolInput.room}%`);
        }

        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });

        // Monteure und Bauleiter sehen keine Preise
        if (userRole === "monteur" || userRole === "bauleiter") {
          const filtered = (data || []).map(
            ({ unit_price: _up, ...rest }: Record<string, unknown>) => rest
          );
          return JSON.stringify({
            positions: filtered,
            count: filtered.length,
          });
        }
        return JSON.stringify({
          positions: data || [],
          count: (data || []).length,
        });
      }

      case "check_catalog": {
        const catalogId =
          (toolInput.catalog_id as string) ||
          "73cb8be2-a70e-43c8-bf08-34596a5c1e30"; // DBL-2026
        const term = toolInput.search_term as string;

        const { data, error } = await sb
          .from("catalog_positions_v2")
          .select("code, title, title_secondary, unit, trade_type")
          .eq("catalog_id", catalogId)
          .or(
            `title.ilike.%${term}%,title_secondary.ilike.%${term}%,code.ilike.%${term}%`
          )
          .limit(15);

        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({
          results: data || [],
          count: (data || []).length,
        });
      }

      case "create_change_order": {
        if (userRole === "monteur") {
          return JSON.stringify({
            error:
              "Monteure dürfen keine Nachträge anlegen. Bitte den Bauleiter informieren.",
          });
        }

        const { data, error } = await sb
          .from("approvals")
          .insert({
            project_id: toolInput.project_id as string,
            approval_type: "CHANGE_ORDER",
            status: "PENDING",
            requested_by: "chat_agent",
            request_summary: toolInput.description as string,
            request_data: {
              positions: toolInput.positions,
              source: "chat_agent",
            },
          })
          .select("id")
          .single();

        if (error) return JSON.stringify({ error: error.message });

        await logEvent(sb, {
          event_type: "CHANGE_ORDER_REQUESTED",
          project_id: toolInput.project_id as string,
          source_flow: "agent-chat",
          payload: {
            approval_id: data.id,
            description: toolInput.description,
            position_count: (toolInput.positions as unknown[]).length,
          },
        });

        return JSON.stringify({
          success: true,
          approval_id: data.id,
          message:
            "Nachtrag wurde im Freigabecenter erstellt. Der GF muss noch freigeben.",
        });
      }

      case "prepare_email": {
        const { data, error } = await sb
          .from("approvals")
          .insert({
            project_id: toolInput.project_id as string,
            approval_type: "EMAIL_SEND",
            status: "PENDING",
            requested_by: "chat_agent",
            request_summary: `Email an ${toolInput.to}: ${toolInput.subject}`,
            request_data: {
              to: toolInput.to,
              subject: toolInput.subject,
              body: toolInput.body,
              source: "chat_agent",
            },
          })
          .select("id")
          .single();

        if (error) return JSON.stringify({ error: error.message });

        await logEvent(sb, {
          event_type: "EMAIL_PREPARED",
          project_id: toolInput.project_id as string,
          source_flow: "agent-chat",
          payload: {
            approval_id: data.id,
            to: toolInput.to,
            subject: toolInput.subject,
          },
        });

        return JSON.stringify({
          success: true,
          approval_id: data.id,
          message:
            "Email wurde vorbereitet und liegt im Freigabecenter zur Freigabe.",
        });
      }

      case "get_project_status": {
        const { data: project, error } = await sb
          .from("projects")
          .select(
            "id, name, status, address, unit_count, client_name, trade_type, created_at"
          )
          .eq("id", toolInput.project_id as string)
          .single();

        if (error) return JSON.stringify({ error: error.message });

        const { count: pendingApprovals } = await sb
          .from("approvals")
          .select("id", { count: "exact", head: true })
          .eq("project_id", toolInput.project_id as string)
          .eq("status", "PENDING");

        const { count: positionCount } = await sb
          .from("offer_positions")
          .select("id", { count: "exact", head: true })
          .eq("project_id", toolInput.project_id as string);

        const result: Record<string, unknown> = {
          ...project,
          pending_approvals: pendingApprovals || 0,
          position_count: positionCount || 0,
        };

        if (userRole === "monteur") {
          delete result.client_name;
        }

        return JSON.stringify(result);
      }

      case "get_schedule": {
        const { data, error } = await sb
          .from("schedule_phases")
          .select(
            "id, trade_type, start_date, end_date, duration_days, status, assigned_member_name"
          )
          .eq("project_id", toolInput.project_id as string)
          .order("start_date", { ascending: true });

        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({
          phases: data || [],
          count: (data || []).length,
        });
      }

      default:
        return JSON.stringify({ error: `Unbekanntes Tool: ${toolName}` });
    }
  } catch (err) {
    console.error(`Tool ${toolName} error:`, err);
    return JSON.stringify({
      error: `Tool-Fehler: ${(err as Error).message}`,
    });
  }
}

// ── Main Handler ───────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    // Auth: Accept JWT from frontend
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse("Missing authorization", 401);
    }

    const body: ChatRequest = await req.json();
    const { project_id, message, user_role, user_name, user_id } = body;

    if (!project_id || !message || !user_role || !user_id) {
      return errorResponse(
        "project_id, message, user_role, user_id required"
      );
    }

    const sb = createServiceClient();

    // Projektkontext laden
    const { data: project } = await sb
      .from("projects")
      .select("name, address, status, trade_type, client_name")
      .eq("id", project_id)
      .single();

    const projectContext = project
      ? `Projekt: ${project.name}\nAdresse: ${project.address}\nStatus: ${project.status}\nGewerk: ${project.trade_type}\nAuftraggeber: ${user_role === "monteur" ? "[verborgen]" : project.client_name}`
      : "Kein Projektkontext verfügbar.";

    // User-Nachricht in DB speichern
    await sb.from("chat_messages").insert({
      project_id,
      user_id,
      role: "user",
      content: message,
    });

    // Chat-History aus DB laden (letzte 50 Nachrichten)
    const { data: historyRows } = await sb
      .from("chat_messages")
      .select("role, content")
      .eq("project_id", project_id)
      .eq("user_id", user_id)
      .in("role", ["user", "assistant"])
      .order("created_at", { ascending: true })
      .limit(50);

    const messages: Anthropic.MessageParam[] = (historyRows || []).map(
      (row: { role: string; content: string }) => ({
        role: row.role as "user" | "assistant",
        content: row.content,
      })
    );

    // Claude API Call mit Tool Use
    const anthropic = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
    });

    const systemPrompt = buildSystemPrompt(user_role, projectContext);

    // Tool Use Loop — max 5 iterations
    let currentMessages = [...messages];
    let finalText = "";
    const allToolCalls: { name: string; input: unknown }[] = [];
    const allToolResults: { name: string; result: unknown }[] = [];

    for (let i = 0; i < 5; i++) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: systemPrompt,
        tools: TOOLS,
        messages: currentMessages,
      });

      // Collect text blocks
      const textBlocks = response.content.filter(
        (b: Anthropic.ContentBlock) => b.type === "text"
      );
      const toolUseBlocks = response.content.filter(
        (b: Anthropic.ContentBlock) => b.type === "tool_use"
      );

      if (textBlocks.length > 0) {
        finalText += textBlocks
          .map((b: Anthropic.ContentBlock) =>
            b.type === "text" ? b.text : ""
          )
          .join("\n");
      }

      // If no tool use, we're done
      if (toolUseBlocks.length === 0 || response.stop_reason === "end_turn") {
        break;
      }

      // Execute tools
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of toolUseBlocks) {
        if (block.type === "tool_use") {
          allToolCalls.push({ name: block.name, input: block.input });
          const result = await executeTool(
            block.name,
            block.input as Record<string, unknown>,
            user_role,
            sb
          );
          allToolResults.push({
            name: block.name,
            result: JSON.parse(result),
          });
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      // Add assistant response + tool results to conversation
      currentMessages = [
        ...currentMessages,
        { role: "assistant" as const, content: response.content },
        { role: "user" as const, content: toolResults },
      ];
    }

    // Assistant-Antwort in DB speichern
    await sb.from("chat_messages").insert({
      project_id,
      user_id,
      role: "assistant",
      content: finalText,
      tool_calls: allToolCalls.length > 0 ? allToolCalls : null,
      tool_results: allToolResults.length > 0 ? allToolResults : null,
      metadata: {
        model: "claude-sonnet-4-20250514",
        user_role,
        user_name,
      },
    });

    // Event loggen
    await logEvent(sb, {
      event_type: "CHAT_AGENT_RESPONSE",
      project_id,
      source_flow: "agent-chat",
      payload: {
        user_role,
        tools_used: allToolCalls.map(
          (t: { name: string; input: unknown }) => t.name
        ),
        message_length: finalText.length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: finalText,
        tool_calls:
          allToolCalls.length > 0 ? allToolCalls : undefined,
        tool_results:
          allToolResults.length > 0 ? allToolResults : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("agent-chat error:", err);
    return errorResponse(
      `Agent-Fehler: ${(err as Error).message}`,
      500
    );
  }
});
