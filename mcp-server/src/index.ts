#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ============================================
// Config
// ============================================

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? "https://yetwntwayhmzmhhgdkli.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!SERVICE_KEY) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY is required. Set it in environment or .claude/mcp.json"
  );
  process.exit(1);
}

// ============================================
// Edge Function Caller
// ============================================

async function callEdgeFunction(
  name: string,
  body: Record<string, unknown>
): Promise<unknown> {
  const url = `${SUPABASE_URL}/functions/v1/${name}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Edge Function ${name} failed (${response.status}): ${text}`);
  }

  return response.json();
}

// ============================================
// Direct DB Query Helper (for get-project)
// ============================================

async function querySupabase(
  table: string,
  select: string,
  filters: Record<string, string>
): Promise<unknown> {
  const params = new URLSearchParams();
  params.set("select", select);
  for (const [key, value] of Object.entries(filters)) {
    params.set(key, value);
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Query ${table} failed (${response.status}): ${text}`);
  }

  return response.json();
}

async function rpcCall(
  fn: string,
  params: Record<string, unknown>
): Promise<unknown> {
  const url = `${SUPABASE_URL}/rest/v1/rpc/${fn}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`RPC ${fn} failed (${response.status}): ${text}`);
  }

  return response.json();
}

// ============================================
// MCP Server Setup
// ============================================

const server = new McpServer({
  name: "baugenius",
  version: "1.0.0",
});

// --------------------------------------------
// Tool 1: bg_lookup_catalog
// --------------------------------------------
server.tool(
  "bg_lookup_catalog",
  "Katalogpositionen suchen — Stichwort, Gewerk, Positionscode. Durchsucht 1.833 Positionen aus 9 Katalogen (SAGA AV-2024, DBL-2026, WBS-Gewerke).",
  {
    query: z
      .string()
      .optional()
      .describe("Stichwort-Suche im Titel (z.B. 'Tapeten', 'Thermostatkopf')"),
    trade: z
      .string()
      .optional()
      .describe(
        "Gewerk filtern: Sanitär, Maler, Elektro, Fliesen, Trockenbau, Tischler, Heizung, Boden, Maurer, Reinigung"
      ),
    catalog_id: z.string().uuid().optional().describe("UUID eines bestimmten Katalogs"),
    position_code: z.string().optional().describe("Exakte Positionsnummer (z.B. '29.1')"),
    limit: z.number().optional().describe("Max Ergebnisse (default 20, max 100)"),
  },
  async (params) => {
    const result = await callEdgeFunction("lookup-catalog", params);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// --------------------------------------------
// Tool 2: bg_parse_lv
// --------------------------------------------
server.tool(
  "bg_parse_lv",
  "LV/GAEB/Excel/PDF parsen → strukturierte Positionen. Unterstützt GAEB XML (83/90), CSV, Excel, PDF (via Claude Vision). Matcht gegen Katalogpositionen.",
  {
    storage_path: z
      .string()
      .describe("Pfad in Supabase Storage (z.B. 'projects/uuid/dokumente/lv.pdf')"),
    catalog_id: z.string().uuid().optional().describe("Katalog-UUID für Position-Matching"),
    expected_trades: z
      .array(z.string())
      .optional()
      .describe("Erwartete Gewerke (z.B. ['Maler', 'Tischler'])"),
    confidence_threshold: z
      .number()
      .optional()
      .describe("Min. Confidence für Auto-Match (default 0.8)"),
  },
  async (params) => {
    const result = await callEdgeFunction("parse-lv", params);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// --------------------------------------------
// Tool 3: bg_create_offer
// --------------------------------------------
server.tool(
  "bg_create_offer",
  "Angebot mit Sektionen + Positionen anlegen. Erstellt draft-Angebot und verknüpft mit Projekt. Positionen werden als source='agent' markiert.",
  {
    project_id: z.string().uuid().describe("Projekt-UUID"),
    sections: z
      .array(
        z.object({
          title: z.string().describe("Sektionsname (z.B. 'Bad', 'Küche', 'Flur')"),
          positions: z.array(
            z.object({
              catalog_code: z.string().optional().describe("Katalog-Positionsnummer"),
              title: z.string().describe("Positionsbezeichnung"),
              description: z.string().optional().describe("Langtext"),
              quantity: z.number().describe("Menge"),
              unit: z.string().describe("Einheit (Stk, m², m, psch, kg)"),
              unit_price: z.number().optional().describe("Einzelpreis in €"),
              trade: z.string().optional().describe("Gewerk"),
              labor_minutes: z.number().optional().describe("Arbeitszeit in Minuten"),
              material_cost: z.number().optional().describe("Materialkosten pro Einheit in €"),
              is_optional: z.boolean().optional().describe("Optionale Position?"),
            })
          ),
        })
      )
      .describe("Angebotssektionen mit Positionen"),
  },
  async (params) => {
    const result = await callEdgeFunction("create-offer", params);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// --------------------------------------------
// Tool 4: bg_calculate_offer
// --------------------------------------------
server.tool(
  "bg_calculate_offer",
  "Angebots-Kalkulation: Enriched Positionen mit Richtzeitwerten, berechnet Kosten + Marge pro Position. Aktualisiert unit_price in der DB.",
  {
    offer_id: z.string().uuid().describe("Angebots-UUID"),
    hourly_rate: z
      .number()
      .optional()
      .describe("Stundensatz in € (default 55)"),
    margin_percent: z
      .number()
      .optional()
      .describe("Marge in % (default 15)"),
    material_markup: z
      .number()
      .optional()
      .describe("Material-Aufschlag in % (default 10)"),
  },
  async (params) => {
    const result = await callEdgeFunction("calculate-offer", params);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// --------------------------------------------
// Tool 5: bg_run_autoplan
// --------------------------------------------
server.tool(
  "bg_run_autoplan",
  "Staffellauf-Pipeline starten: Plausibilität → Zeitprüfer → Material → Einsatzplaner. Erstellt Schedule-Phasen, Material-Needs und Freigabe-Anträge.",
  {
    project_id: z.string().uuid().describe("Projekt-UUID"),
  },
  async (params) => {
    const result = await callEdgeFunction("run-autoplan", params);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// --------------------------------------------
// Tool 6: bg_generate_pdf
// --------------------------------------------
server.tool(
  "bg_generate_pdf",
  "Angebots-PDF generieren via Gotenberg und in Supabase Storage speichern.",
  {
    offer_id: z.string().uuid().describe("Angebots-UUID"),
  },
  async (params) => {
    const result = await callEdgeFunction("generate-pdf", params);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// --------------------------------------------
// Tool 7: bg_get_project
// --------------------------------------------
server.tool(
  "bg_get_project",
  "Projektdetails laden: Status, Angebote, Phasen, Material, Freigaben. Kompletübersicht eines Projekts.",
  {
    project_id: z.string().uuid().describe("Projekt-UUID"),
  },
  async ({ project_id }) => {
    // Parallel queries for complete project picture
    const [project, offers, phases, materials, approvals, pipelineRuns] =
      await Promise.all([
        querySupabase(
          "projects",
          "id,name,code,status,address,description,planned_start,planned_end,created_at,client:clients(name)",
          { id: `eq.${project_id}` }
        ),
        querySupabase(
          "offers",
          "id,offer_number,status,created_at",
          { project_id: `eq.${project_id}` }
        ),
        querySupabase(
          "schedule_phases",
          "id,trade,start_date,end_date,status,phase_number,assigned_team_member:team_members(name)",
          { project_id: `eq.${project_id}`, order: "phase_number" }
        ),
        querySupabase(
          "project_material_needs",
          "id,trade,material_type,label,total_quantity,quantity_unit,status,problem,needed_by",
          { project_id: `eq.${project_id}` }
        ),
        querySupabase(
          "approvals",
          "id,approval_type,status,request_summary,decided_at,decided_by,created_at",
          { project_id: `eq.${project_id}`, order: "created_at.desc" }
        ),
        querySupabase(
          "pipeline_runs",
          "id,status,current_agent,agents_completed,result_summary,started_at,completed_at",
          { project_id: `eq.${project_id}`, order: "created_at.desc", limit: "5" }
        ),
      ]);

    const result = {
      project: (project as unknown[])[0] ?? null,
      offers,
      schedule_phases: phases,
      material_needs: materials,
      approvals,
      pipeline_runs: pipelineRuns,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// --------------------------------------------
// Tool 8: bg_run_godmode
// --------------------------------------------
server.tool(
  "bg_run_godmode",
  "Godmode Learner: SOLL vs IST Vergleich nach Projektabschluss. Passt Richtzeitwerte per Exponential Moving Average an (alpha=0.3). Kann einzelnes Projekt oder auto-batch.",
  {
    project_id: z
      .string()
      .uuid()
      .optional()
      .describe("Projekt-UUID für einzelne Analyse"),
    auto: z
      .boolean()
      .optional()
      .describe(
        "true = alle kürzlich abgeschlossenen Projekte automatisch analysieren"
      ),
  },
  async (params) => {
    const result = await callEdgeFunction("run-godmode", params);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// --------------------------------------------
// Tool 9: bg_approve
// --------------------------------------------
server.tool(
  "bg_approve",
  "Freigabe erteilen oder ablehnen (HITL). Unterstützt: PROJECT_START, SCHEDULE, MATERIAL_ORDER.",
  {
    approval_id: z.string().uuid().describe("Freigabe-UUID"),
    action: z.enum(["approve", "reject"]).describe("Aktion: approve oder reject"),
    reason: z
      .string()
      .optional()
      .describe("Begründung (pflicht bei reject)"),
  },
  async ({ approval_id, action, reason }) => {
    // Approval-Typ ermitteln
    const approvals = (await querySupabase(
      "approvals",
      "id,approval_type,status",
      { id: `eq.${approval_id}` }
    )) as { id: string; approval_type: string; status: string }[];

    const approval = approvals[0];
    if (!approval) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: "Freigabe nicht gefunden" }) }],
      };
    }

    if (approval.status !== "PENDING") {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `Freigabe ist bereits ${approval.status}`,
            }),
          },
        ],
      };
    }

    // Passende RPC-Funktion aufrufen
    let rpcFn: string;
    const rpcParams: Record<string, unknown> = { p_approval_id: approval_id };

    if (action === "approve") {
      switch (approval.approval_type) {
        case "PROJECT_START":
          rpcFn = "fn_approve_intake";
          break;
        case "SCHEDULE":
          rpcFn = "fn_approve_schedule";
          break;
        case "MATERIAL_ORDER":
          rpcFn = "fn_approve_material_order";
          break;
        default:
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: `Unbekannter Approval-Typ: ${approval.approval_type}`,
                }),
              },
            ],
          };
      }
    } else {
      rpcFn = "fn_reject_intake";
      rpcParams.p_reason = reason ?? "Abgelehnt via Agent";
    }

    const result = await rpcCall(rpcFn, rpcParams);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// ============================================
// Start Server
// ============================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("BauGenius MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
