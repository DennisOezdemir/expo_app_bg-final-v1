// ── BG Offer Assistant ───────────────────────────────────────────
// Dialogbasierte Langtext-Generierung fuer Angebotspositionen
// Batch-Generierung mit Approve/Edit/Reject Workflow
// Logging fuer Godmode Text Learning

import { handleCors, corsHeaders } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";
import { callLLM, type LLMMessage, type SystemBlock, type LLMResult } from "../_shared/llm-router.ts";

// ── Types ──

interface AssistantRequest {
  offer_id: string;
  thread_id?: string;
  action: "start_batch" | "approve" | "approve_all" | "edit" | "reject" | "commit_all";
  position_id?: string;
  message?: string;
  final_text?: string;
}

// ── Auth Helper ──

async function getUserFromJWT(req: Request, sb: any): Promise<{ user_id: string; role: string; name: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");

  // Service-Role Key erkennen (fuer Backend-Calls und Tests)
  try {
    const payloadB64 = token.split(".")[1];
    if (payloadB64) {
      const payload = JSON.parse(atob(payloadB64));
      if (payload.role === "service_role") {
        // Use the only auth user as fallback for service_role calls
        return { user_id: "627ec3d9-9414-4427-99ad-5c2a914c9e29", role: "gf", name: "Service Role" };
      }
    }
  } catch { /* not a JWT */ }

  const { data: { user }, error } = await sb.auth.getUser(token);
  if (error || !user) return null;

  // Rolle aus team_members ableiten
  const { data: member } = await sb
    .from("team_members")
    .select("role, name")
    .eq("auth_id", user.id)
    .maybeSingle();

  return {
    user_id: user.id,
    role: member?.role || "gf",
    name: member?.name || user.email || "Unbekannt",
  };
}

// ── System Prompt Builder ──

function buildSystemPrompt(
  memoryEntries: any[],
  offerContext: any,
  approvedTexts: { title: string; long_text: string }[],
): SystemBlock[] {
  // Block 1: Rollen-Definition + Stil (selten aendernd → Cache)
  const styleRules = memoryEntries
    .filter((m: any) => m.memory_type === "style_rule")
    .map((m: any) => `- ${m.value}`)
    .join("\n");

  const termPrefs = memoryEntries
    .filter((m: any) => m.memory_type === "term_preference")
    .map((m: any) => `- Verwende "${m.value}" statt "${m.key}"`)
    .join("\n");

  const fewShots = memoryEntries
    .filter((m: any) => m.memory_type === "few_shot_example")
    .map((m: any) => `Beispiel (${m.key}):\n${m.value}`)
    .join("\n\n");

  const roleBlock: SystemBlock = {
    type: "text",
    text: `Du bist der BauGenius Langtext-Assistent fuer Angebote im Handwerk.

DEINE AUFGABE:
Du schreibst Langtexte fuer Angebotspositionen. Die Texte muessen VERKAUFEN — kein technisches Deutsch, kein Stock im Arsch.
Der Kunde soll verstehen was er bekommt und warum es sein Geld wert ist.

STIL-REGELN:
- Schreibe auf Deutsch, verstaendlich fuer Laien
- 2-4 Saetze pro Position, nicht mehr
- Erklaere den NUTZEN, nicht nur die Leistung
- Wenn Mengen vorlaeufig sind ("Menge nach Oeffnung"), erwaehne das
- Keine Herstellernamen im Kundentext, es sei denn explizit gewuenscht
${styleRules ? "\nGelernte Stil-Regeln:\n" + styleRules : ""}
${termPrefs ? "\nBevorzugte Begriffe:\n" + termPrefs : ""}

AUSGABEFORMAT:
Antworte NUR mit dem Langtext fuer die angeforderte Position. Kein Markdown, keine Ueberschriften, kein Drumherum.
Nur der reine Text der in das Angebot kommt.
${fewShots ? "\n\nBEISPIELE aus frueheren Angeboten:\n" + fewShots : ""}`,
    cache_control: { type: "ephemeral" },
  };

  // Block 2: Angebots-Kontext (aendert sich pro Angebot → Cache)
  const offer = offerContext.offer || {};
  const project = offerContext.project || {};
  const client = offerContext.client || {};
  const sections = offerContext.sections || [];

  let positionsList = "";
  for (const sec of sections) {
    positionsList += `\n--- ${sec.section_number}. ${sec.title} (${sec.trade || "Allgemein"}) ---\n`;
    for (const pos of (sec.positions || [])) {
      const status = pos.long_text ? " [hat Langtext]" : pos.staged_long_text ? " [Vorschlag vorhanden]" : "";
      positionsList += `  ${pos.position_number}. ${pos.title} | ${pos.quantity} ${pos.unit} | EP ${pos.unit_price}€${status}\n`;
    }
  }

  // Bereits freigegebene Texte als Konsistenz-Referenz
  let approvedRef = "";
  if (approvedTexts.length > 0) {
    approvedRef = "\n\nBEREITS FREIGEGEBENE LANGTEXTE (halte den Stil konsistent):\n" +
      approvedTexts.slice(0, 5).map((a) => `${a.title}: "${a.long_text}"`).join("\n");
  }

  const contextBlock: SystemBlock = {
    type: "text",
    text: `ANGEBOTS-KONTEXT:
Angebot: ${offer.offer_number || "?"} | Status: ${offer.status || "?"}
Projekt: ${project.name || "?"} | ${project.object_street || ""}, ${project.object_zip || ""} ${project.object_city || ""}
Kunde: ${client.company_name || client.last_name || "?"}
Netto: ${offer.total_net || 0}€

POSITIONEN:${positionsList}${approvedRef}`,
    cache_control: { type: "ephemeral" },
  };

  return [roleBlock, contextBlock];
}

// ── Generate Long Text for Single Position ──

async function generateForPosition(
  systemBlocks: SystemBlock[],
  position: any,
  userHint?: string,
): Promise<{ text: string; result: LLMResult }> {
  const positionPrompt = `Schreibe den Langtext fuer folgende Position:

Position: ${position.title}
Menge: ${position.quantity} ${position.unit}
EP: ${position.unit_price}€
${position.description ? "Hinweis: " + position.description : ""}
${position.catalog_code ? "Katalog: " + position.catalog_code : ""}
${userHint ? "\nUser-Anweisung: " + userHint : ""}`;

  const messages: LLMMessage[] = [{ role: "user", content: positionPrompt }];

  const result = await callLLM(
    { system: systemBlocks, messages, maxTokens: 512 },
    ["text"],
  );

  return { text: result.text.trim(), result };
}

// ── Action Handlers ──

async function handleStartBatch(sb: any, body: AssistantRequest, userId: string) {
  const { offer_id } = body;

  // 1. Offer-Kontext laden
  const { data: offerContext, error: ctxErr } = await sb.rpc("fn_get_offer_assistant_context", { p_offer_id: offer_id });
  if (ctxErr) return errorResponse(`Context load failed: ${ctxErr.message}`);

  // 2. Memory laden (global + tenant scope, confidence >= 0.6)
  const { data: memoryEntries } = await sb
    .from("memory_entries")
    .select("key, value, memory_type, trade, confidence")
    .in("scope", ["global", "tenant"])
    .gte("confidence", 0.6)
    .order("confidence", { ascending: false });

  // 3. Positionen ohne Langtext finden
  const allPositions: any[] = [];
  for (const sec of (offerContext.sections || [])) {
    for (const pos of (sec.positions || [])) {
      allPositions.push({ ...pos, section_title: sec.title, section_trade: sec.trade });
    }
  }
  const positionsToGenerate = allPositions.filter((p: any) => !p.long_text);

  if (positionsToGenerate.length === 0) {
    return jsonResponse({ success: true, message: "Alle Positionen haben bereits Langtexte.", positions_total: allPositions.length, positions_to_generate: 0 });
  }

  // 4. Thread anlegen
  const { data: thread, error: threadErr } = await sb
    .from("agent_threads")
    .insert({
      thread_type: "offer_longtext",
      project_id: offerContext.project?.id || null,
      offer_id,
      user_id: userId,
      status: "active",
      context_snapshot: offerContext,
      positions_total: allPositions.length,
      positions_completed: 0,
    })
    .select("id")
    .single();

  if (threadErr) return errorResponse(`Thread creation failed: ${threadErr.message}`);
  const threadId = thread.id;

  // 5. Event loggen
  await sb.from("events").insert({
    event_type: "OFFER_LONGTEXT_SESSION_STARTED",
    project_id: offerContext.project?.id || null,
    source_system: "offer-assistant",
    source_flow: "start_batch",
    payload: { thread_id: threadId, offer_id, positions_total: allPositions.length, positions_to_generate: positionsToGenerate.length },
  });

  // 6. System-Prompt bauen
  const approvedTexts = allPositions
    .filter((p: any) => p.long_text)
    .map((p: any) => ({ title: p.title, long_text: p.long_text }));

  const systemBlocks = buildSystemPrompt(memoryEntries || [], offerContext, approvedTexts);

  // 7. Batch-Generierung
  let completed = 0;
  const errors: string[] = [];

  for (const pos of positionsToGenerate) {
    try {
      const { text, result: llmResult } = await generateForPosition(systemBlocks, pos);

      // staged_long_text setzen
      await sb.from("offer_positions").update({
        staged_long_text: text,
        staged_at: new Date().toISOString(),
        staged_by: userId,
      }).eq("id", pos.id);

      // agent_message loggen
      await sb.from("agent_messages").insert({
        thread_id: threadId,
        role: "assistant",
        content: text,
        position_id: pos.id,
        action: "batch_propose",
        proposed_text: text,
        model_used: llmResult.model,
        tokens_in: llmResult.tokensIn,
        tokens_out: llmResult.tokensOut,
        latency_ms: llmResult.latencyMs,
        metadata: { provider: llmResult.provider, section: pos.section_title },
      });

      completed++;

      // Thread-Fortschritt aktualisieren
      await sb.from("agent_threads").update({ positions_completed: completed }).eq("id", threadId);

    } catch (err) {
      const errMsg = `Pos ${pos.position_number} (${pos.title}): ${(err as Error).message}`;
      console.error(`[offer-assistant] ${errMsg}`);
      errors.push(errMsg);
    }
  }

  // 8. Event + Status
  await sb.from("events").insert({
    event_type: "OFFER_LONGTEXT_BATCH_COMPLETED",
    project_id: offerContext.project?.id || null,
    source_system: "offer-assistant",
    source_flow: "start_batch",
    payload: { thread_id: threadId, offer_id, completed, errors: errors.length, total: positionsToGenerate.length },
  });

  if (completed === positionsToGenerate.length) {
    await sb.from("agent_threads").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", threadId);
  }

  return jsonResponse({
    success: true,
    thread_id: threadId,
    positions_total: allPositions.length,
    positions_generated: completed,
    positions_errors: errors.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}

async function handleApprove(sb: any, body: AssistantRequest, userId: string) {
  const { thread_id, position_id } = body;
  if (!thread_id || !position_id) return errorResponse("thread_id and position_id required");

  // Position laden
  const { data: pos } = await sb
    .from("offer_positions")
    .select("id, title, staged_long_text, catalog_code")
    .eq("id", position_id)
    .maybeSingle();

  if (!pos?.staged_long_text) return errorResponse("No staged text to approve");

  // Agent Message loggen
  await sb.from("agent_messages").insert({
    thread_id,
    role: "user",
    content: "Freigegeben",
    position_id,
    action: "approve",
    proposed_text: pos.staged_long_text,
    final_text: pos.staged_long_text,
    quality_score: 0.8,
  });

  // Observation loggen
  await sb.from("agent_observations").insert({
    thread_id,
    position_id,
    catalog_code: pos.catalog_code,
    observation_type: "text_approved",
    proposed_text: pos.staged_long_text,
    final_text: pos.staged_long_text,
    edit_distance: 0,
    quality_score: 0.8,
  });

  return jsonResponse({ success: true, position_id, action: "approved", quality_score: 0.8 });
}

async function handleEdit(sb: any, body: AssistantRequest, userId: string) {
  const { thread_id, position_id, final_text, message } = body;
  if (!thread_id || !position_id) return errorResponse("thread_id and position_id required");

  // Wenn message statt final_text: Regeneration mit User-Hinweis
  if (message && !final_text) {
    // Offer-Kontext vom Thread laden
    const { data: thread } = await sb
      .from("agent_threads")
      .select("context_snapshot, offer_id")
      .eq("id", thread_id)
      .single();

    const { data: pos } = await sb
      .from("offer_positions")
      .select("id, title, description, unit, unit_price, quantity, catalog_code")
      .eq("id", position_id)
      .single();

    const { data: memoryEntries } = await sb
      .from("memory_entries")
      .select("key, value, memory_type, trade, confidence")
      .in("scope", ["global", "tenant"])
      .gte("confidence", 0.6);

    const systemBlocks = buildSystemPrompt(memoryEntries || [], thread.context_snapshot, []);
    const { text, result: llmResult } = await generateForPosition(systemBlocks, pos, message);

    // Staged text aktualisieren
    await sb.from("offer_positions").update({
      staged_long_text: text,
      staged_at: new Date().toISOString(),
      staged_by: userId,
    }).eq("id", position_id);

    await sb.from("agent_messages").insert({
      thread_id,
      role: "assistant",
      content: text,
      position_id,
      action: "propose",
      proposed_text: text,
      model_used: llmResult.model,
      tokens_in: llmResult.tokensIn,
      tokens_out: llmResult.tokensOut,
      latency_ms: llmResult.latencyMs,
      metadata: { provider: llmResult.provider, user_hint: message },
    });

    return jsonResponse({ success: true, position_id, action: "regenerated", new_text: text });
  }

  // Manuell editierter Text
  if (!final_text) return errorResponse("final_text or message required");

  const { data: pos } = await sb
    .from("offer_positions")
    .select("id, staged_long_text, catalog_code")
    .eq("id", position_id)
    .maybeSingle();

  // Staged Text auf editierten Text setzen
  await sb.from("offer_positions").update({
    staged_long_text: final_text,
    staged_at: new Date().toISOString(),
    staged_by: userId,
  }).eq("id", position_id);

  // Levenshtein-Approximation
  const editDist = Math.abs((pos?.staged_long_text || "").length - final_text.length);

  await sb.from("agent_messages").insert({
    thread_id,
    role: "user",
    content: final_text,
    position_id,
    action: "edit",
    proposed_text: pos?.staged_long_text,
    final_text,
    quality_score: 1.0,
  });

  await sb.from("agent_observations").insert({
    thread_id,
    position_id,
    catalog_code: pos?.catalog_code,
    observation_type: "text_edited",
    proposed_text: pos?.staged_long_text,
    final_text,
    edit_distance: editDist,
    quality_score: 1.0,
  });

  return jsonResponse({ success: true, position_id, action: "edited", quality_score: 1.0 });
}

async function handleReject(sb: any, body: AssistantRequest, userId: string) {
  const { thread_id, position_id } = body;
  if (!thread_id || !position_id) return errorResponse("thread_id and position_id required");

  const { data: pos } = await sb
    .from("offer_positions")
    .select("id, staged_long_text, catalog_code")
    .eq("id", position_id)
    .maybeSingle();

  // Staged loeschen
  await sb.from("offer_positions").update({
    staged_long_text: null,
    staged_at: null,
    staged_by: null,
  }).eq("id", position_id);

  await sb.from("agent_messages").insert({
    thread_id,
    role: "user",
    content: body.message || "Abgelehnt",
    position_id,
    action: "reject",
    proposed_text: pos?.staged_long_text,
    quality_score: 0.0,
  });

  await sb.from("agent_observations").insert({
    thread_id,
    position_id,
    catalog_code: pos?.catalog_code,
    observation_type: "text_rejected",
    proposed_text: pos?.staged_long_text,
    quality_score: 0.0,
    payload: { reason: body.message || null },
  });

  return jsonResponse({ success: true, position_id, action: "rejected" });
}

async function handleApproveAll(sb: any, body: AssistantRequest, userId: string) {
  const { thread_id, offer_id } = body;
  if (!thread_id) return errorResponse("thread_id required");

  // Alle Positionen mit staged_long_text laden
  const { data: positions } = await sb
    .from("offer_positions")
    .select("id, title, staged_long_text, catalog_code")
    .eq("offer_id", offer_id)
    .not("staged_long_text", "is", null)
    .is("deleted_at", null);

  let approved = 0;
  for (const pos of (positions || [])) {
    await sb.from("agent_messages").insert({
      thread_id,
      role: "user",
      content: "Freigegeben (Batch)",
      position_id: pos.id,
      action: "approve",
      proposed_text: pos.staged_long_text,
      final_text: pos.staged_long_text,
      quality_score: 0.8,
    });

    await sb.from("agent_observations").insert({
      thread_id,
      position_id: pos.id,
      catalog_code: pos.catalog_code,
      observation_type: "text_approved",
      proposed_text: pos.staged_long_text,
      final_text: pos.staged_long_text,
      edit_distance: 0,
      quality_score: 0.8,
    });

    approved++;
  }

  return jsonResponse({ success: true, approved });
}

async function handleCommitAll(sb: any, body: AssistantRequest, userId: string) {
  const { thread_id, offer_id } = body;
  if (!thread_id) return errorResponse("thread_id required");

  // Alle Positionen mit staged_long_text committen
  const { data: positions } = await sb
    .from("offer_positions")
    .select("id")
    .eq("offer_id", offer_id)
    .not("staged_long_text", "is", null)
    .is("deleted_at", null);

  let committed = 0;
  for (const pos of (positions || [])) {
    const { data: result } = await sb.rpc("fn_commit_staged_longtext", {
      p_position_id: pos.id,
      p_user_id: userId,
    });

    if (result?.success) {
      await sb.from("agent_messages").insert({
        thread_id,
        role: "system",
        content: "Committed",
        position_id: pos.id,
        action: "commit",
      });
      committed++;
    }
  }

  // Thread abschliessen
  await sb.from("agent_threads").update({
    status: "completed",
    updated_at: new Date().toISOString(),
  }).eq("id", thread_id);

  return jsonResponse({ success: true, committed });
}

// ── Main Handler ──

Deno.serve(async (req: Request) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const sb = createServiceClient();

    // Server-authoritative Auth
    const user = await getUserFromJWT(req, sb);
    if (!user) return errorResponse("Unauthorized", 401);
    if (user.role === "monteur") return errorResponse("Monteure koennen keine Angebots-Texte generieren", 403);

    const body: AssistantRequest = await req.json();
    if (!body.offer_id) return errorResponse("offer_id required");

    console.log(`[offer-assistant] ${body.action} by ${user.name} (${user.role}) for offer ${body.offer_id}`);

    switch (body.action) {
      case "start_batch":
        return await handleStartBatch(sb, body, user.user_id);
      case "approve":
        return await handleApprove(sb, body, user.user_id);
      case "approve_all":
        return await handleApproveAll(sb, body, user.user_id);
      case "edit":
        return await handleEdit(sb, body, user.user_id);
      case "reject":
        return await handleReject(sb, body, user.user_id);
      case "commit_all":
        return await handleCommitAll(sb, body, user.user_id);
      default:
        return errorResponse(`Unknown action: ${body.action}`);
    }
  } catch (err) {
    console.error("[offer-assistant] FATAL:", (err as Error).message, (err as Error).stack);
    return errorResponse((err as Error).message, 500);
  }
});
