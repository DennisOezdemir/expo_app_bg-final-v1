/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { handleCors } from "../_shared/cors.ts";
import { authenticate } from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { logEvent } from "../_shared/events.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

/**
 * lookup-catalog — Katalogpositionen suchen
 *
 * POST /functions/v1/lookup-catalog
 * Body: {
 *   query?: string,           // Volltextsuche im Titel
 *   trade?: string,           // Gewerk filtern (z.B. "Maler")
 *   catalog_id?: string,      // Bestimmter Katalog
 *   position_code?: string,   // Exakte Positionsnummer (z.B. "29.1")
 *   limit?: number            // Max Ergebnisse (default 20, max 100)
 * }
 */
Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    await authenticate(req);
  } catch (e) {
    return errorResponse((e as Error).message, 401);
  }

  try {
    const body = await req.json();
    const { query, trade, catalog_id, position_code, limit: rawLimit } = body;
    const limit = Math.min(rawLimit ?? 20, 100);

    if (!query && !trade && !catalog_id && !position_code) {
      return errorResponse(
        "Mindestens ein Suchkriterium nötig: query, trade, catalog_id oder position_code"
      );
    }

    const sb = createServiceClient();

    let dbQuery = sb
      .from("catalog_positions_v2")
      .select(
        `id, position_code, title, title_secondary, unit, base_price_eur, trade, category,
        catalog:catalogs(name)`
      )
      .eq("is_active", true)
      .limit(limit);

    // Stichwortsuche im Titel
    if (query) {
      dbQuery = dbQuery.or(
        `title.ilike.%${query}%,title_secondary.ilike.%${query}%,position_code.ilike.%${query}%`
      );
    }

    // Gewerk-Filter (trade ist direkte Spalte)
    if (trade) {
      dbQuery = dbQuery.eq("trade", trade);
    }

    // Katalog-Filter
    if (catalog_id) {
      dbQuery = dbQuery.eq("catalog_id", catalog_id);
    }

    // Exakte Positionsnummer
    if (position_code) {
      dbQuery = dbQuery.eq("position_code", position_code);
    }

    const { data: positions, error } = await dbQuery;

    if (error) {
      console.error("Catalog query error:", error);
      return errorResponse("Datenbankfehler: " + error.message, 500);
    }

    // Flatten nested joins
    const results = (positions ?? []).map((p: Record<string, unknown>) => ({
      id: p.id,
      position_code: p.position_code,
      title: p.title,
      title_secondary: p.title_secondary,
      unit: p.unit,
      base_price_eur: p.base_price_eur,
      trade: p.trade,
      category: p.category,
      catalog: (p.catalog as Record<string, unknown>)?.name ?? null,
    }));

    await logEvent(sb, {
      event_type: "CATALOG_LOOKUP",
      source_flow: "edge_lookup_catalog",
      payload: {
        query,
        trade,
        catalog_id,
        results_count: results.length,
      },
    });

    return jsonResponse({
      success: true,
      count: results.length,
      positions: results,
    });
  } catch (e) {
    console.error("lookup-catalog error:", e);
    return errorResponse("Interner Fehler: " + (e as Error).message, 500);
  }
});
