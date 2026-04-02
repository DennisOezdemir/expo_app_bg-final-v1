/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { handleCors } from "../_shared/cors.ts";
import {
  assertRole,
  requireProjectAccess,
  requireUserContext,
} from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { logEvent } from "../_shared/events.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

/**
 * create-offer — Angebot mit Sektionen + Positionen anlegen
 *
 * POST /functions/v1/create-offer
 * Body: {
 *   project_id: string,
 *   sections: [{
 *     title: string,
 *     positions: [{
 *       catalog_code?: string,
 *       title: string,
 *       description?: string,
 *       quantity: number,
 *       unit: string,
 *       unit_price?: number,
 *       trade?: string,
 *       labor_minutes?: number,
 *       material_cost?: number,
 *       is_optional?: boolean
 *     }]
 *   }]
 * }
 */

interface PositionInput {
  catalog_code?: string;
  title: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price?: number;
  trade?: string;
  labor_minutes?: number;
  material_cost?: number;
  is_optional?: boolean;
}

interface SectionInput {
  title: string;
  positions: PositionInput[];
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  let authHeader = "";
  try {
    const user = await requireUserContext(req);
    assertRole(user, ["gf", "bauleiter"]);
    authHeader = user.authHeader;
  } catch (e) {
    const message = (e as Error).message;
    const status = message === "Forbidden" ? 403 : 401;
    return errorResponse(message, status, req);
  }

  try {
    const body = await req.json();
    const { project_id, sections } = body as {
      project_id: string;
      sections: SectionInput[];
    };

    if (!project_id) return errorResponse("project_id ist erforderlich", 400, req);
    if (!sections?.length) return errorResponse("Mindestens eine Sektion nötig", 400, req);

    await requireProjectAccess(authHeader, project_id);

    const sb = createServiceClient();

    // Projekt prüfen
    const { data: project, error: projErr } = await sb
      .from("projects")
      .select("id, name, status")
      .eq("id", project_id)
      .single();

    if (projErr || !project) {
      return errorResponse("Projekt nicht gefunden", 404, req);
    }

    // Angebot erstellen
    const { data: offer, error: offerErr } = await sb
      .from("offers")
      .insert({
        project_id,
        status: "draft",
      })
      .select("id, offer_number")
      .single();

    if (offerErr || !offer) {
      return errorResponse("Angebot konnte nicht erstellt werden: " + offerErr?.message, 500, req);
    }

    let totalPositions = 0;
    const sectionResults: { id: string; title: string; position_count: number }[] = [];

    // Sektionen + Positionen anlegen
    for (let si = 0; si < sections.length; si++) {
      const section = sections[si];

      const { data: sec, error: secErr } = await sb
        .from("offer_sections")
        .insert({
          offer_id: offer.id,
          title: section.title,
          section_number: si + 1,
        })
        .select("id")
        .single();

      if (secErr || !sec) {
        console.error("Section insert error:", secErr);
        continue;
      }

      // Positionen in dieser Sektion
      const positionsToInsert = section.positions.map((pos, pi) => ({
        offer_id: offer.id,
        section_id: sec.id,
        catalog_code: pos.catalog_code ?? null,
        title: pos.title,
        description: pos.description ?? null,
        quantity: pos.quantity,
        unit: pos.unit,
        unit_price: pos.unit_price ?? 0,
        total_price: (pos.quantity ?? 0) * (pos.unit_price ?? 0),
        trade: pos.trade ?? null,
        labor_minutes: pos.labor_minutes ?? null,
        material_cost: pos.material_cost ?? null,
        is_optional: pos.is_optional ?? false,
        source: "agent",
        position_number: pi + 1,
        sort_order: pi + 1,
      }));

      const { error: posErr } = await sb
        .from("offer_positions")
        .insert(positionsToInsert);

      if (posErr) {
        console.error("Position insert error:", posErr);
      } else {
        totalPositions += positionsToInsert.length;
      }

      sectionResults.push({
        id: sec.id,
        title: section.title,
        position_count: section.positions.length,
      });
    }

    // Event loggen
    await logEvent(sb, {
      event_type: "OFFER_CREATED",
      project_id,
      source_flow: "edge_create_offer",
      payload: {
        offer_id: offer.id,
        offer_number: offer.offer_number,
        sections_count: sectionResults.length,
        positions_count: totalPositions,
        source: "agent",
      },
    });

    return jsonResponse({
      success: true,
      offer_id: offer.id,
      offer_number: offer.offer_number,
      sections: sectionResults,
      total_positions: totalPositions,
    }, 200, req);
  } catch (e) {
    console.error("create-offer error:", e);
    const message = (e as Error).message;
    const status = message === "Forbidden" ? 403 : 500;
    return errorResponse("Interner Fehler: " + message, status, req);
  }
});
