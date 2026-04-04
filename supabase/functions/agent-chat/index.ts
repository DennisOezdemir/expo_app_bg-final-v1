// BauGenius Chat-Agent — Cloud LLM Router
// Primary: Claude Sonnet (Tools + Vision)
// Fallback: Gemini Flash (Speed)
// Später: Lokaler Agent als Primary, Cloud als Fallback

import { handleCors } from "../_shared/cors.ts";
import {
  assertRole,
  getUserClient,
  requireProjectAccess,
  requireUserContext,
  type UserContext,
} from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { errorResponse, jsonResponse } from "../_shared/response.ts";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.52.0";

// ── Types ──────────────────────────────────────────────────────────

interface ChatRequest {
  project_id?: string | null;
  message: string;
  attachments?: { type: "image" | "pdf"; url: string }[];
}

interface LLMResponse {
  text: string;
  tool_calls: { name: string; input: Record<string, unknown> }[];
  tool_results: { name: string; result: Record<string, unknown> }[];
}

interface AgentChatContext {
  user: UserContext;
  serviceClient: any;
  userClient: any;
  currentProjectId: string | null;
}

function resolveToolProjectId(
  toolInput: Record<string, unknown>,
  context: AgentChatContext,
): string {
  const requestedProjectId = typeof toolInput.project_id === "string"
    ? toolInput.project_id.trim()
    : "";

  if (context.currentProjectId) {
    if (!requestedProjectId || requestedProjectId === context.currentProjectId) {
      return context.currentProjectId;
    }
    throw new Error("Projektwechsel innerhalb dieses Chats ist nicht erlaubt");
  }

  if (!requestedProjectId) {
    throw new Error("project_id erforderlich");
  }

  return requestedProjectId;
}

async function requireToolProjectAccess(
  toolInput: Record<string, unknown>,
  context: AgentChatContext,
): Promise<string> {
  const projectId = resolveToolProjectId(toolInput, context);
  await requireProjectAccess(context.user.authHeader, projectId);
  return projectId;
}

// ── Configuration ──────────────────────────────────────────────────

const CLAUDE_MODEL = Deno.env.get("CLAUDE_MODEL") || "claude-sonnet-4-6";
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
const GEMINI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY") || "";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ── Tool Definitions ──────────────────────────────────────────────

const TOOL_DEFS = [
  {
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
  {
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
  {
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
  {
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
  {
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
  {
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
  {
    name: "update_project_status",
    description: "Projektstatus ändern (z.B. auf abgeschlossen, in Arbeit, Rechnung versendet, etc.)",
    parameters: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Projekt-UUID" },
        status: { type: "string", description: "Neuer Status: DRAFT, INTAKE, INSPECTION, PLANNING, IN_PROGRESS, COMPLETED, INVOICED, ARCHIVED" },
      },
      required: ["project_id", "status"],
    },
  },
  {
    name: "remember",
    description: "Etwas merken für zukünftige Gespräche. Nutze dieses Tool wenn der User sagt 'merk dir das', 'denk dran', oder wenn du eine wichtige Präferenz erkennst.",
    parameters: {
      type: "object",
      properties: {
        key: { type: "string", description: "Kurzer Schlüssel (z.B. 'abdichtung_hersteller', 'langtext_stil')" },
        value: { type: "string", description: "Was gemerkt werden soll" },
        memory_type: { type: "string", description: "Art: style_rule, term_preference, correction_pattern" },
      },
      required: ["key", "value"],
    },
  },
  {
    name: "search_projects",
    description: "Projekte nach Name, Adresse oder Projektnummer suchen. Nutze dieses Tool wenn der User ein Projekt namentlich nennt und du die UUID brauchst.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Suchbegriff (Name, Adresse, Projektnummer)" },
      },
      required: ["query"],
    },
  },
  {
    name: "request_material",
    description: "Material für die Baustelle anfordern. Erstellt eine Freigabe-Anfrage die der GF genehmigen muss. Alle Rollen dürfen Material anfordern.",
    parameters: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Projekt-UUID" },
        description: { type: "string", description: "Was wird gebraucht (z.B. '12 Rollen Raufaser und 4 Eimer Kleber')" },
        urgency: { type: "string", description: "Dringlichkeit: normal oder dringend" },
      },
      required: ["project_id", "description"],
    },
  },
  {
    name: "request_tool",
    description: "Werkzeug oder Gerät für die Baustelle anfordern. Erstellt eine Freigabe-Anfrage die der GF koordinieren muss.",
    parameters: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Projekt-UUID" },
        description: { type: "string", description: "Was wird gebraucht, wann und wohin (z.B. 'Spritzmaschine morgen auf Tegelsbarg')" },
      },
      required: ["project_id", "description"],
    },
  },
  {
    name: "create_offer",
    description: "Angebot für ein Projekt erstellen — mit Sektionen und Positionen. Nutze dieses Tool wenn der User ein Angebot erstellen möchte (z.B. 'erstelle ein Angebot', 'ich brauche ein Angebot für...', 'mach ein Angebot'). Nur GF und Bauleiter.",
    parameters: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Projekt-UUID" },
        title: { type: "string", description: "Titel des Angebots (z.B. 'Malerarbeiten EG', 'Sanitär Bad OG')" },
        sections: {
          type: "array",
          description: "Sektionen des Angebots (mindestens eine)",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Sektionsname (z.B. 'Wohnzimmer', 'Bad OG')" },
              positions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Positionsbezeichnung" },
                    description: { type: "string", description: "Leistungsbeschreibung (optional)" },
                    quantity: { type: "number", description: "Menge" },
                    unit: { type: "string", description: "Einheit (z.B. m², Stk, lfd. m)" },
                    catalog_code: { type: "string", description: "Katalogcode falls bekannt (optional)" },
                    unit_price: { type: "number", description: "Einzelpreis in EUR (optional, 0 wenn unbekannt)" },
                    trade: { type: "string", description: "Gewerk (z.B. Maler, Sanitär, Elektro)" },
                  },
                  required: ["title", "quantity", "unit"],
                },
              },
            },
            required: ["title", "positions"],
          },
        },
        note_to_user: { type: "string", description: "Optionaler Hinweis an den User (z.B. 'Preise bitte noch prüfen')" },
      },
      required: ["project_id", "sections"],
    },
  },
];

// Claude format
const CLAUDE_TOOLS: Anthropic.Tool[] = TOOL_DEFS.map((t) => ({
  name: t.name,
  description: t.description,
  input_schema: t.parameters as Anthropic.Tool.InputSchema,
}));

// Gemini format — komplexe Typen (arrays/objects) zu STRING vereinfachen
function toGeminiType(prop: any): any {
  const t = (prop.type || "string").toLowerCase();
  if (t === "array" || t === "object") {
    return { type: "STRING", description: (prop.description || "") + " (als JSON-String)" };
  }
  return { type: t.toUpperCase(), description: prop.description || "" };
}

const GEMINI_TOOLS = [{
  functionDeclarations: TOOL_DEFS.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: {
      type: "OBJECT",
      properties: Object.fromEntries(
        Object.entries(t.parameters.properties).map(([k, v]: [string, any]) => [k, toGeminiType(v)])
      ),
      required: t.parameters.required,
    },
  })),
}];

// ── Tool Execution ────────────────────────────────────────────────

async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  context: AgentChatContext,
): Promise<string> {
  try {
    const userRole = context.user.role;
    const serviceClient = context.serviceClient;
    const userClient = context.userClient;

    switch (toolName) {
      case "query_positions": {
        // Positionen über offers → offer_positions laden (offer_positions hat kein project_id)
        const projectId = await requireToolProjectAccess(toolInput, context);

        // Erst alle Angebote des Projekts finden
        const { data: offers } = await userClient
          .from("offers")
          .select("id")
          .eq("project_id", projectId)
          .is("deleted_at", null);

        if (!offers || offers.length === 0) {
          return JSON.stringify({ positions: [], count: 0, info: "Kein Angebot für dieses Projekt vorhanden." });
        }

        const offerIds = offers.map((o: any) => o.id);

        // GF bekommt Preise, alle anderen NIE
        const cols = userRole === "gf"
          ? "id, title, description, quantity, unit, catalog_code, unit_price, sort_order, section_id, offer_sections(title, trade)"
          : "id, title, description, quantity, unit, catalog_code, sort_order, section_id, offer_sections(title, trade)";

        let query = userClient
          .from("offer_positions")
          .select(cols)
          .in("offer_id", offerIds)
          .is("deleted_at", null)
          .order("sort_order", { ascending: true });

        if (toolInput.room) {
          // Room-Filter: suche in position title oder description
          query = query.or(`title.ilike.%${toolInput.room}%,description.ilike.%${toolInput.room}%`);
        }

        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });

        // Ergebnis aufbereiten
        const positions = (data || []).map((p: any) => ({
          title: p.title,
          description: p.description,
          quantity: p.quantity,
          unit: p.unit,
          catalog_code: p.catalog_code,
          section: p.offer_sections?.title || "",
          trade: p.offer_sections?.trade || "",
          ...(userRole === "gf" ? { unit_price: p.unit_price } : {}),
        }));

        return JSON.stringify({ positions, count: positions.length });
      }

      case "check_catalog": {
        const catalogId = (toolInput.catalog_id as string) || "73cb8be2-a70e-43c8-bf08-34596a5c1e30";
        const term = toolInput.search_term as string;
        const { data, error } = await serviceClient
          .from("catalog_positions_v2")
          .select("code, title, title_secondary, unit, trade")
          .eq("catalog_id", catalogId)
          .or(`title.ilike.%${term}%,title_secondary.ilike.%${term}%,code.ilike.%${term}%`)
          .limit(15);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ results: data || [], count: (data || []).length });
      }

      case "create_change_order": {
        assertRole(context.user, ["gf", "bauleiter"], "Monteure dürfen keine Nachträge anlegen.");
        const projectId = await requireToolProjectAccess(toolInput, context);

        const { data, error } = await serviceClient.from("approvals").insert({
          project_id: projectId,
          approval_type: "CHANGE_ORDER",
          status: "PENDING",
          requested_by: `chat_agent:${context.user.userId}`,
          request_summary: toolInput.description as string,
          request_data: {
            positions: toolInput.positions,
            source: "chat_agent",
            requested_by_role: context.user.role,
            requested_by_user_id: context.user.userId,
          },
        }).select("id").single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, approval_id: data.id, message: "Nachtrag im Freigabecenter erstellt." });
      }

      case "prepare_email": {
        assertRole(context.user, ["gf", "bauleiter"], "Monteure dürfen keine E-Mails vorbereiten.");
        const projectId = await requireToolProjectAccess(toolInput, context);

        const { data, error } = await serviceClient.from("approvals").insert({
          project_id: projectId,
          approval_type: "EMAIL_SEND",
          status: "PENDING",
          requested_by: `chat_agent:${context.user.userId}`,
          request_summary: `Email an ${toolInput.to}: ${toolInput.subject}`,
          request_data: {
            to: toolInput.to,
            subject: toolInput.subject,
            body: toolInput.body,
            source: "chat_agent",
            requested_by_role: context.user.role,
            requested_by_user_id: context.user.userId,
          },
        }).select("id").single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, approval_id: data.id, message: "Email zur Freigabe vorbereitet." });
      }

      case "get_project_status": {
        const projectId = await requireToolProjectAccess(toolInput, context);
        const cols = "id, name, status, object_street, object_city, project_number, progress_percent, planned_start, planned_end";
        const { data: statusProject, error } = await userClient
          .from("projects")
          .select(cols)
          .eq("id", projectId)
          .single();
        if (error) return JSON.stringify({ error: error.message });
        const { count: pending } = await serviceClient
          .from("approvals")
          .select("id", { count: "exact", head: true })
          .eq("project_id", projectId)
          .eq("status", "PENDING");
        return JSON.stringify({ ...statusProject, pending_approvals: pending || 0 });
      }

      case "get_schedule": {
        const projectId = await requireToolProjectAccess(toolInput, context);
        const { data, error } = await userClient
          .from("schedule_phases")
          .select("id, trade, start_date, end_date, status, assigned_team_member_id, team_members:assigned_team_member_id (name)")
          .eq("project_id", projectId)
          .order("start_date", { ascending: true });
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ phases: data || [], count: (data || []).length });
      }

      case "remember": {
        assertRole(context.user, ["gf", "bauleiter"], "Monteure dürfen keine Team-Memories schreiben.");
        const memType = (toolInput.memory_type as string) || "style_rule";
        const { data, error } = await serviceClient.from("memory_entries").upsert({
          scope: "tenant",
          scope_id: null,
          memory_type: memType,
          key: toolInput.key as string,
          value: toolInput.value as string,
          confidence: 0.8,
          observation_count: 1,
          source: "manual",
          updated_at: new Date().toISOString(),
        }, { onConflict: "scope,memory_type,key", ignoreDuplicates: false }).select("id").single();
        if (error) {
          // Fallback: insert without upsert
          const { error: insertErr } = await serviceClient.from("memory_entries").insert({
            scope: "tenant", scope_id: null, memory_type: memType,
            key: toolInput.key as string, value: toolInput.value as string,
            confidence: 0.8, observation_count: 1, source: "manual",
          });
          if (insertErr) return JSON.stringify({ error: insertErr.message });
        }
        return JSON.stringify({ success: true, message: `Gemerkt: "${toolInput.key}" → "${toolInput.value}"` });
      }

      case "search_projects": {
        const q = toolInput.query as string;
        const cols = "id, project_number, name, object_street, object_city, status, progress_percent";
        const { data, error } = await userClient
          .from("projects")
          .select(cols)
          .or(`name.ilike.%${q}%,object_street.ilike.%${q}%,project_number.ilike.%${q}%,object_city.ilike.%${q}%`)
          .limit(10);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ projects: data || [], count: (data || []).length });
      }

      case "request_material": {
        const projectId = await requireToolProjectAccess(toolInput, context);
        const { data, error } = await serviceClient.from("approvals").insert({
          project_id: projectId,
          approval_type: "MATERIAL_ORDER",
          status: "PENDING",
          requested_by: `chat_agent:${context.user.userId}`,
          request_summary: `Materialanfrage${(toolInput.urgency as string) === "dringend" ? " (DRINGEND)" : ""}: ${toolInput.description}`,
          request_data: {
            description: toolInput.description,
            urgency: toolInput.urgency || "normal",
            source: "chat_agent",
            requested_by_role: userRole,
            requested_by_user_id: context.user.userId,
          },
        }).select("id").single();
        if (error) return JSON.stringify({ error: error.message });

        // Telegram-Freigabe via n8n Webhook
        try {
          const N8N_WEBHOOK = Deno.env.get("N8N_APPROVAL_WEBHOOK") || "https://n8n.srv1045913.hstgr.cloud/webhook/bg-approval";
          const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_GF_CHAT_ID") || "";
          await fetch(N8N_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ approval_id: data.id, telegram_chat_id: TELEGRAM_CHAT_ID }),
          });
        } catch (webhookErr) {
          console.error("[agent-chat] n8n webhook failed:", webhookErr);
        }

        return JSON.stringify({ success: true, approval_id: data.id, message: `Materialanfrage erstellt. Der GF wird per Telegram benachrichtigt.` });
      }

      case "request_tool": {
        const projectId = await requireToolProjectAccess(toolInput, context);
        const { data, error } = await serviceClient.from("approvals").insert({
          project_id: projectId,
          approval_type: "TOOL_REQUEST",
          status: "PENDING",
          requested_by: `chat_agent:${context.user.userId}`,
          request_summary: `Werkzeuganfrage: ${toolInput.description}`,
          request_data: {
            description: toolInput.description,
            source: "chat_agent",
            requested_by_role: userRole,
            requested_by_user_id: context.user.userId,
          },
        }).select("id").single();
        if (error) {
          // Falls TOOL_REQUEST als approval_type nicht existiert, Fallback auf MATERIAL_ORDER
          if (error.message.includes("check constraint") || error.message.includes("approval_type")) {
            const { data: d2, error: e2 } = await serviceClient.from("approvals").insert({
              project_id: projectId,
              approval_type: "MATERIAL_ORDER",
              status: "PENDING",
              requested_by: `chat_agent:${context.user.userId}`,
              request_summary: `Werkzeuganfrage: ${toolInput.description}`,
              request_data: {
                description: toolInput.description,
                source: "chat_agent",
                requested_by_role: userRole,
                requested_by_user_id: context.user.userId,
                type: "tool_request",
              },
            }).select("id").single();
            if (e2) return JSON.stringify({ error: e2.message });
            try {
              const N8N_WEBHOOK = Deno.env.get("N8N_APPROVAL_WEBHOOK") || "https://n8n.srv1045913.hstgr.cloud/webhook/bg-approval";
              const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_GF_CHAT_ID") || "";
              await fetch(N8N_WEBHOOK, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approval_id: d2.id, telegram_chat_id: TELEGRAM_CHAT_ID }) });
            } catch {}
            return JSON.stringify({ success: true, approval_id: d2.id, message: `Werkzeuganfrage erstellt. Der GF wird per Telegram benachrichtigt.` });
          }
          return JSON.stringify({ error: error.message });
        }
        try {
          const N8N_WEBHOOK = Deno.env.get("N8N_APPROVAL_WEBHOOK") || "https://n8n.srv1045913.hstgr.cloud/webhook/bg-approval";
          const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_GF_CHAT_ID") || "";
          await fetch(N8N_WEBHOOK, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approval_id: data.id, telegram_chat_id: TELEGRAM_CHAT_ID }) });
        } catch {}
        return JSON.stringify({ success: true, approval_id: data.id, message: `Werkzeuganfrage erstellt. Der GF wird per Telegram benachrichtigt.` });
      }

      case "update_project_status": {
        assertRole(context.user, ["gf", "bauleiter"], "Monteure dürfen den Projektstatus nicht ändern.");
        const projectId = await requireToolProjectAccess(toolInput, context);
        const validStatuses = ["DRAFT", "INTAKE", "INSPECTION", "PLANNING", "ACTIVE", "IN_PROGRESS", "COMPLETED", "INVOICED", "ARCHIVED"];
        const newStatus = (toolInput.status as string || "").toUpperCase();
        if (!validStatuses.includes(newStatus)) {
          return JSON.stringify({ error: `Ungültiger Status. Erlaubt: ${validStatuses.join(", ")}` });
        }
        const { error } = await serviceClient
          .from("projects")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("id", projectId);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, project_id: projectId, new_status: newStatus, message: `Projektstatus auf ${newStatus} gesetzt.` });
      }

      case "create_offer": {
        assertRole(context.user, ["gf", "bauleiter"], "Monteure dürfen keine Angebote erstellen.");
        const projectId = await requireToolProjectAccess(toolInput, context);

        const rawSections = toolInput.sections as any[];
        if (!rawSections?.length) {
          return JSON.stringify({ error: "Mindestens eine Sektion mit Positionen erforderlich." });
        }

        // Angebot anlegen
        const offerTitle = (toolInput.title as string) || null;
        const { data: offer, error: offerErr } = await serviceClient
          .from("offers")
          .insert({ project_id: projectId, status: "draft", ...(offerTitle ? { title: offerTitle } : {}) })
          .select("id, offer_number")
          .single();

        if (offerErr || !offer) {
          return JSON.stringify({ error: "Angebot konnte nicht erstellt werden: " + offerErr?.message });
        }

        let totalPositions = 0;
        const sectionSummaries: { title: string; position_count: number }[] = [];

        for (let si = 0; si < rawSections.length; si++) {
          const sec = rawSections[si];
          const { data: sectionRow, error: secErr } = await serviceClient
            .from("offer_sections")
            .insert({ offer_id: offer.id, title: sec.title, section_number: si + 1 })
            .select("id")
            .single();

          if (secErr || !sectionRow) {
            console.error("[create_offer] Section insert error:", secErr);
            continue;
          }

          const positions = (sec.positions || []).map((pos: any, pi: number) => ({
            offer_id: offer.id,
            section_id: sectionRow.id,
            catalog_code: pos.catalog_code ?? null,
            title: pos.title,
            description: pos.description ?? null,
            quantity: pos.quantity ?? 0,
            unit: pos.unit ?? "Stk",
            unit_price: pos.unit_price ?? 0,
            total_price: (pos.quantity ?? 0) * (pos.unit_price ?? 0),
            trade: pos.trade ?? null,
            is_optional: false,
            source: "agent_chat",
            position_number: pi + 1,
            sort_order: pi + 1,
          }));

          const { error: posErr } = await serviceClient.from("offer_positions").insert(positions);
          if (posErr) {
            console.error("[create_offer] Position insert error:", posErr);
          } else {
            totalPositions += positions.length;
          }

          sectionSummaries.push({ title: sec.title, position_count: sec.positions?.length ?? 0 });
        }

        // Event loggen
        try {
          await serviceClient.from("events").insert({
            event_type: "OFFER_CREATED_VIA_CHAT",
            project_id: projectId,
            source_system: "agent-chat",
            source_flow: "create_offer_tool",
            payload: {
              offer_id: offer.id,
              offer_number: offer.offer_number,
              sections_count: sectionSummaries.length,
              positions_count: totalPositions,
              requested_by_role: context.user.role,
              requested_by_user_id: context.user.userId,
            },
          });
        } catch (evtErr) {
          console.error("[create_offer] Event log error:", (evtErr as Error).message);
        }

        const note = toolInput.note_to_user as string | undefined;
        return JSON.stringify({
          success: true,
          offer_id: offer.id,
          offer_number: offer.offer_number,
          sections: sectionSummaries,
          total_positions: totalPositions,
          open_url: `/angebot/${offer.id}`,
          note: note ?? null,
          message: `Angebot ${offer.offer_number ? `#${offer.offer_number}` : ""} mit ${sectionSummaries.length} Sektion(en) und ${totalPositions} Position(en) erstellt.`,
        });
      }

      default:
        return JSON.stringify({ error: `Unbekanntes Tool: ${toolName}` });
    }
  } catch (err) {
    return JSON.stringify({ error: (err as Error).message });
  }
}

// ── Claude Implementation ─────────────────────────────────────────

async function callClaude(
  systemPrompt: string,
  messages: any[],
  context: AgentChatContext,
  attachments: any[] = []
): Promise<LLMResponse> {
  const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

  const anthropicMessages: any[] = messages.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));

  // Attachments als Vision-Blöcke anhängen
  if (attachments.length > 0 && anthropicMessages.length > 0) {
    const lastMsg = anthropicMessages[anthropicMessages.length - 1];
    if (lastMsg.role === "user") {
      const content: any[] = [{ type: "text", text: lastMsg.content }];
      for (const att of attachments) {
        if (att.type === "image" && att.url) {
          content.push({ type: "image", source: { type: "url", url: att.url } });
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
      max_tokens: 4096,
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
      const result = await executeTool(b.name, b.input as any, context);
      allToolResults.push({ name: b.name, result: JSON.parse(result) });
      toolResults.push({ type: "tool_result", tool_use_id: b.id, content: result });
    }

    anthropicMessages.push({ role: "assistant", content: response.content });
    anthropicMessages.push({ role: "user", content: toolResults });
  }

  return { text: finalText, tool_calls: allToolCalls, tool_results: allToolResults };
}

// ── Gemini Flash Implementation ───────────────────────────────────

async function callGemini(
  systemPrompt: string,
  messages: any[],
  context: AgentChatContext,
): Promise<LLMResponse> {
  if (!GEMINI_API_KEY) throw new Error("GOOGLE_AI_API_KEY not configured");

  const geminiMessages = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  let finalText = "";
  const allToolCalls: any[] = [];
  const allToolResults: any[] = [];

  for (let i = 0; i < 5; i++) {
    const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: geminiMessages,
        tools: GEMINI_TOOLS,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini error ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    if (!candidate?.content?.parts) break;

    const textParts = candidate.content.parts.filter((p: any) => p.text);
    const fnParts = candidate.content.parts.filter((p: any) => p.functionCall);

    if (textParts.length > 0) {
      finalText += textParts.map((p: any) => p.text).join("\n");
    }

    if (fnParts.length === 0) break;

    // Execute tools
    const fnResponses: any[] = [];
    for (const p of fnParts) {
      const fc = p.functionCall;
      allToolCalls.push({ name: fc.name, input: fc.args || {} });
      const result = await executeTool(fc.name, fc.args || {}, context);
      allToolResults.push({ name: fc.name, result: JSON.parse(result) });
      fnResponses.push({ functionResponse: { name: fc.name, response: JSON.parse(result) } });
    }

    // Append assistant + tool results to conversation
    geminiMessages.push({ role: "model", parts: candidate.content.parts });
    geminiMessages.push({ role: "user", parts: fnResponses });
  }

  return { text: finalText, tool_calls: allToolCalls, tool_results: allToolResults };
}

// ── Main Handler ──────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const body: ChatRequest = await req.json();
    const message = body.message?.trim();
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];
    if (!message) return errorResponse("message ist erforderlich", 400, req);

    const user = await requireUserContext(req);
    const rawProjectId = body.project_id?.trim();
    const project_id = !rawProjectId || rawProjectId === "general" ? null : rawProjectId;
    if (project_id) {
      await requireProjectAccess(user.authHeader, project_id);
    }

    const sb = createServiceClient();
    const userClient = getUserClient(user.authHeader);
    const context: AgentChatContext = {
      user,
      serviceClient: sb,
      userClient,
      currentProjectId: project_id,
    };

    // 1a. Memory laden (global + tenant + user scope, confidence >= 0.6)
    let memoryBlock = "";
    try {
      const { data: memories } = await sb
        .from("memory_entries")
        .select("key, value, memory_type, scope, scope_id, trade, confidence")
        .gte("confidence", 0.6)
        .order("confidence", { ascending: false })
        .limit(50);

      const scopedMemories = (memories ?? []).filter((memory: any) => {
        if (memory.scope === "global" || memory.scope === "tenant") return true;
        if (memory.scope === "user") return memory.scope_id === user.userId;
        if (memory.scope === "project") return project_id && memory.scope_id === project_id;
        return false;
      });

      if (scopedMemories.length > 0) {
        const rules = scopedMemories.filter((m: any) => m.memory_type === "style_rule").map((m: any) => `- ${m.value}`);
        const terms = scopedMemories.filter((m: any) => m.memory_type === "term_preference").map((m: any) => `- Verwende "${m.value}" statt "${m.key}"`);
        const examples = scopedMemories.filter((m: any) => m.memory_type === "few_shot_example").slice(0, 3);
        const corrections = scopedMemories.filter((m: any) => m.memory_type === "correction_pattern").map((m: any) => `- ${m.value}`);

        const parts: string[] = [];
        if (rules.length > 0) parts.push("GELERNTE REGELN:\n" + rules.join("\n"));
        if (terms.length > 0) parts.push("BEVORZUGTE BEGRIFFE:\n" + terms.join("\n"));
        if (corrections.length > 0) parts.push("KORREKTUREN (vermeide diese Fehler):\n" + corrections.join("\n"));
        if (examples.length > 0) parts.push("BEISPIELE:\n" + examples.map((e: any) => `${e.key}: ${e.value}`).join("\n"));

        if (parts.length > 0) {
          memoryBlock = "\n\nGEDÄCHTNIS (aus früheren Gesprächen gelernt):\n" + parts.join("\n\n");
        }
      }
    } catch (memErr) {
      console.error("[agent-chat] Memory load failed:", (memErr as Error).message);
    }

    // 1b. Kontext laden (nur bei echtem Projekt)
    let projectContext = "Kein Projektkontext (allgemeine Anfrage).";
    if (project_id) {
      const { data: project } = await userClient
        .from("projects")
        .select("name, object_street, object_city, status, project_type, client_id")
        .eq("id", project_id)
        .single();

      if (project) {
        const addr = [project.object_street, project.object_city].filter(Boolean).join(", ");
        projectContext = `Projekt: ${project.name}\nAdresse: ${addr}\nStatus: ${project.status}\nTyp: ${project.project_type || "—"}`;
      }
    }

    const roleRules: Record<string, string> = {
      gf: `ROLLE: GESCHÄFTSFÜHRER — Vollzugriff auf alle Daten inkl. Preise und Margen.`,
      bauleiter: `ROLLE: BAULEITER — Du siehst Positionen, Mengen, Einheiten. KEINE Preise, Margen, Gewinne oder Euro-Beträge in der App zeigen. Bei Preisfragen antworte: "Preisauskunft ist in der App nicht vorgesehen. Wechsle als Bauleiter in die Web-Version — dort hast du Zugriff auf alle Preisinformationen."`,
      monteur: `ROLLE: MONTEUR — Du siehst nur Leistungsbeschreibungen, Mengen und Einheiten. ABSOLUTES VERBOT für alle Preis-/Kosteninformationen. Keine Ausnahmen, keine Tricks. Bei Preisfragen antworte: "In der App gibt es keine Preise. Frag deine Führungskraft für weitere Informationen — ich habe hier keinen Zugriff darauf."`,
    };

    const systemPrompt = `Du bist der BauGenius Assistent auf der Baustelle. Du hilfst Handwerkern direkt vor Ort.

WICHTIGSTE REGEL: NUTZE DEINE TOOLS. Frag NICHT zurück wenn du die Antwort nachschlagen kannst.
- Frage nach Positionen/Räumen → SOFORT query_positions aufrufen
- Frage nach Projektstatus → SOFORT get_project_status aufrufen
- Frage nach Zeitplan → SOFORT get_schedule aufrufen
- User braucht Material → SOFORT request_material aufrufen. KEINE Duplikat-Prüfung, KEIN "gibt schon eine Anfrage". Jede Anfrage ist berechtigt. Einfach anlegen.
- User meldet Schaden/Nachtrag → SOFORT create_change_order aufrufen
- User braucht Werkzeug → SOFORT request_tool aufrufen. Gleiche Regel: Immer anlegen, nie ablehnen.
- User sucht ein Projekt → SOFORT search_projects aufrufen
- User will Status ändern → SOFORT update_project_status aufrufen
- User sagt "merk dir" → SOFORT remember aufrufen
- User will ein Angebot erstellen / sagt "erstelle ein Angebot" / "ich brauche ein Angebot für..." → SOFORT create_offer aufrufen. Frage NICHT nach mehr Details wenn du genug Kontext hast — erstelle direkt einen Entwurf. Der User kann danach im Angebot-Editor verfeinern.

NIEMALS sagen "Ich brauche die Projekt-ID" — du HAST den Projektkontext (siehe unten). Nutze ihn.
NIEMALS fragen "Um welches Projekt geht es?" wenn project_id vorhanden ist.
NIEMALS allgemein antworten wenn du nachschlagen kannst.

ANTWORT-STIL:
- Deutsch. Kurz. Direkt. Kein Gelaber.
- Wenn du Daten aus Tools bekommst: fasse sie zusammen, liste nicht alles auf
- Wenn der User nach einem Raum fragt: filtere mit dem room-Parameter in query_positions
- Wenn nichts gefunden: sag das klar ("Keine Positionen für Wohnzimmer gefunden")

${roleRules[user.role] || roleRules.monteur}

FOTOS/BILDER:
- Beschreibe was du siehst: Zustand, Schaden, Material, Gewerk
- Ordne es dem Projekt zu (welcher Raum, welche Position passt)
- Schlage Aktion vor: Nachtrag nötig? Material bestellen? Dokumentation?
- Bei Unklarheit: "Welcher Raum ist das?"

PROJEKTKONTEXT:
${projectContext}
${project_id ? `Projekt-ID: ${project_id} (nutze diese ID für alle Tool-Aufrufe!)` : "Kein Projekt ausgewählt."}
${memoryBlock}`;

    // 2. Nachricht speichern
    console.log("[agent-chat] Saving user message:", { project_id, user_id: user.userId, messageLen: message.length });
    const { error: insertErr } = await sb.from("chat_messages").insert({
      project_id,
      user_id: user.userId,
      role: "user",
      content: message,
      metadata: { user_role: user.role },
    });
    if (insertErr) {
      console.error("[agent-chat] User message insert failed:", insertErr.message, insertErr.details, insertErr.hint);
    }

    // 3. History laden (letzte 50 Nachrichten inkl. Tool-Kontext)
    // Query nach project_id (primär) + optional user_id
    let historyQuery = sb
      .from("chat_messages")
      .select("role, content, tool_calls, tool_results")
      .eq("user_id", user.userId)
      .order("created_at", { ascending: true })
      .limit(50);
    if (project_id) {
      historyQuery = historyQuery.eq("project_id", project_id);
    } else {
      historyQuery = historyQuery.is("project_id", null);
    }
    const { data: history } = await historyQuery;
    let chatMessages = (history || []).map((r: any) => {
      if (r.role === "assistant" && r.tool_calls && r.tool_calls.length > 0) {
        const toolSummary = r.tool_calls.map((tc: any) => `[Tool: ${tc.name}]`).join(" ");
        return { role: r.role, content: `${toolSummary}\n${r.content}` };
      }
      return { role: r.role, content: r.content };
    });

    // Sicherstellen dass die aktuelle Nachricht am Ende steht
    // (DB-Insert kann fehlschlagen, oder History-Query findet sie nicht)
    const lastMsg = chatMessages[chatMessages.length - 1];
    if (!lastMsg || lastMsg.role !== "user" || lastMsg.content !== message) {
      chatMessages.push({ role: "user", content: message });
    }

    // Claude/Gemini: Conversation darf nicht mit assistant anfangen
    // Entferne führende assistant-Nachrichten
    while (chatMessages.length > 0 && chatMessages[0].role === "assistant") {
      chatMessages.shift();
    }

    // Fallback: mindestens die aktuelle Nachricht
    if (chatMessages.length === 0) {
      chatMessages = [{ role: "user", content: message }];
    }

    // 4. Routing: Claude Primary, Gemini Fallback
    let response: LLMResponse;
    let usedModel: string;

    if (attachments.length > 0) {
      // Vision → nur Claude kann Bilder
      console.log("[agent-chat] → Claude (Vision)");
      response = await callClaude(systemPrompt, chatMessages, context, attachments);
      usedModel = `claude:${CLAUDE_MODEL}`;
    } else {
      // Text → Claude primary, Gemini fallback
      try {
        console.log("[agent-chat] → Claude (Primary)");
        response = await callClaude(systemPrompt, chatMessages, context);
        usedModel = `claude:${CLAUDE_MODEL}`;
      } catch (claudeErr: any) {
        console.error("[agent-chat] Claude failed, trying Gemini:", claudeErr.message);
        try {
          response = await callGemini(systemPrompt, chatMessages, context);
          usedModel = `gemini:${GEMINI_MODEL}`;
        } catch (geminiErr: any) {
          console.error("[agent-chat] Gemini also failed:", geminiErr.message);
          throw new Error(`Alle LLMs fehlgeschlagen. Claude: ${claudeErr.message}. Gemini: ${geminiErr.message}`);
        }
      }
    }

    // 5. Antwort speichern (immer)
    const { error: assistantErr } = await sb.from("chat_messages").insert({
      project_id,
      user_id: user.userId,
      role: "assistant",
      content: response.text,
      tool_calls: response.tool_calls.length > 0 ? response.tool_calls : null,
      tool_results: response.tool_results.length > 0 ? response.tool_results : null,
      metadata: { model: usedModel, user_role: user.role },
    });
    if (assistantErr) {
      console.error("[agent-chat] Assistant message insert failed:", assistantErr.message, assistantErr.details);
    }

    return jsonResponse({
      success: true,
      message: response.text,
      tool_calls: response.tool_calls,
      tool_results: response.tool_results,
      model: usedModel,
    }, 200, req);
  } catch (err) {
    const errMsg = (err as Error).message || String(err);
    const authErrors = new Set([
      "Missing authorization",
      "Invalid JWT token",
      "User authentication required",
    ]);
    const status = errMsg === "Forbidden"
      ? 403
      : authErrors.has(errMsg)
      ? 401
      : 500;
    console.error("[agent-chat] FATAL:", errMsg, (err as Error).stack || "");
    return errorResponse(errMsg, status, req);
  }
});
