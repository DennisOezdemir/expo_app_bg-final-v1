/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { handleCors } from "../_shared/cors.ts";
import { authenticate } from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { logEvent } from "../_shared/events.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

/**
 * calculate-offer — Kalkulation: Katalogpreise + Richtzeitwerte → Marge pro Position
 *
 * POST /functions/v1/calculate-offer
 * Body: {
 *   offer_id: string,
 *   hourly_rate?: number,       // Stundensatz in € (default 55)
 *   margin_percent?: number,    // Aufschlag in % (default 15)
 *   material_markup?: number    // Material-Aufschlag % (default 10)
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
    const {
      offer_id,
      hourly_rate = 55,
      margin_percent = 15,
      material_markup = 10,
    } = body;

    if (!offer_id) return errorResponse("offer_id ist erforderlich");

    const sb = createServiceClient();

    // Angebot laden
    const { data: offer, error: offerErr } = await sb
      .from("offers")
      .select("id, project_id, status")
      .eq("id", offer_id)
      .single();

    if (offerErr || !offer) {
      return errorResponse("Angebot nicht gefunden", 404);
    }

    const { data: positions, error: posErr } = await sb
      .from("offer_positions")
      .select("id, catalog_code, title, quantity, unit, unit_price, labor_minutes, material_cost, trade")
      .eq("offer_id", offer_id)
      .is("deleted_at", null);

    if (posErr) {
      return errorResponse("Positionen konnten nicht geladen werden", 500);
    }

    if (!positions?.length) {
      return errorResponse("Keine Positionen im Angebot");
    }

    // Richtzeitwerte laden (key = catalog_position_nr which maps to catalog_code)
    const catalogCodes = positions
      .map((p) => p.catalog_code)
      .filter(Boolean) as string[];

    let richtzeitMap: Record<string, { labor_minutes: number; material_cost: number; confidence: number }> = {};

    if (catalogCodes.length > 0) {
      const { data: rzw } = await sb
        .from("richtzeitwerte")
        .select("catalog_position_nr, labor_minutes_per_unit, material_cost_per_unit, confidence")
        .in("catalog_position_nr", catalogCodes);

      if (rzw) {
        for (const r of rzw) {
          richtzeitMap[r.catalog_position_nr] = {
            labor_minutes: r.labor_minutes_per_unit,
            material_cost: r.material_cost_per_unit ?? 0,
            confidence: r.confidence,
          };
        }
      }
    }

    // Kalkulation pro Position
    const marginFactor = 1 + margin_percent / 100;
    const materialFactor = 1 + material_markup / 100;
    let totalRevenue = 0;
    let totalCost = 0;
    let enrichedCount = 0;

    const calculatedPositions = positions.map((pos) => {
      const rzw = pos.catalog_code ? richtzeitMap[pos.catalog_code] : null;

      const laborMinutes = rzw?.labor_minutes ?? pos.labor_minutes ?? 0;
      const materialCostPerUnit = rzw?.material_cost ?? pos.material_cost ?? 0;

      const laborCost = (laborMinutes / 60) * hourly_rate * pos.quantity;
      const materialCost = materialCostPerUnit * pos.quantity * materialFactor;
      const totalCostPos = laborCost + materialCost;

      const sellingPrice = totalCostPos * marginFactor;
      const unitPrice = pos.quantity > 0 ? sellingPrice / pos.quantity : 0;

      if (rzw) enrichedCount++;

      totalRevenue += sellingPrice;
      totalCost += totalCostPos;

      return {
        id: pos.id,
        catalog_code: pos.catalog_code,
        title: pos.title,
        quantity: pos.quantity,
        unit: pos.unit,
        labor_minutes_per_unit: laborMinutes,
        material_cost_per_unit: materialCostPerUnit,
        labor_cost: Math.round(laborCost * 100) / 100,
        material_cost_total: Math.round(materialCost * 100) / 100,
        total_cost: Math.round(totalCostPos * 100) / 100,
        selling_price: Math.round(sellingPrice * 100) / 100,
        unit_price: Math.round(unitPrice * 100) / 100,
        margin_euro: Math.round((sellingPrice - totalCostPos) * 100) / 100,
        confidence: rzw?.confidence ?? null,
        source: rzw ? "richtzeitwert" : (pos.labor_minutes ? "existing" : "none"),
      };
    });

    // Positionen in DB aktualisieren
    for (const calc of calculatedPositions) {
      await sb
        .from("offer_positions")
        .update({
          unit_price: calc.unit_price,
          total_price: calc.selling_price,
          labor_minutes: calc.labor_minutes_per_unit,
          material_cost: calc.material_cost_per_unit,
          has_calculation: true,
        })
        .eq("id", calc.id);
    }

    // Angebot-Summen aktualisieren
    const totalNet = Math.round(totalRevenue * 100) / 100;
    const vatRate = 19;
    const totalVat = Math.round(totalNet * vatRate / 100 * 100) / 100;
    const totalGross = Math.round((totalNet + totalVat) * 100) / 100;

    await sb
      .from("offers")
      .update({
        total_net: totalNet,
        vat_rate: vatRate,
        total_vat: totalVat,
        total_gross: totalGross,
        has_missing_prices: false,
      })
      .eq("id", offer_id);

    const totalMargin = totalRevenue - totalCost;
    const marginPercentActual = totalCost > 0 ? (totalMargin / totalCost) * 100 : 0;

    await logEvent(sb, {
      event_type: "OFFER_CALCULATED",
      project_id: offer.project_id,
      source_flow: "edge_calculate_offer",
      payload: {
        offer_id,
        positions_count: positions.length,
        enriched_from_richtzeitwerte: enrichedCount,
        total_revenue: totalNet,
        total_cost: Math.round(totalCost * 100) / 100,
        margin_percent: Math.round(marginPercentActual * 10) / 10,
      },
    });

    return jsonResponse({
      success: true,
      offer_id,
      summary: {
        positions_count: positions.length,
        enriched_from_richtzeitwerte: enrichedCount,
        hourly_rate,
        margin_percent,
        material_markup,
        total_net: totalNet,
        total_vat: totalVat,
        total_gross: totalGross,
        total_cost: Math.round(totalCost * 100) / 100,
        total_margin: Math.round(totalMargin * 100) / 100,
        margin_percent_actual: Math.round(marginPercentActual * 10) / 10,
      },
      positions: calculatedPositions,
    });
  } catch (e) {
    console.error("calculate-offer error:", e);
    return errorResponse("Interner Fehler: " + (e as Error).message, 500);
  }
});
