// ── LLM Provider Router ──────────────────────────────────────────
// DB-konfigurierbarer Multi-Provider Router
// Priority-based failover: Claude → Gemini → Local
// Prompt Caching Support (Anthropic)

import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.52.0";
import { createServiceClient } from "./supabase-client.ts";

// ── Types ──

export interface LLMMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

export interface ContentBlock {
  type: "text" | "image";
  text?: string;
  source?: { type: "url" | "base64"; url?: string; data?: string; media_type?: string };
  cache_control?: { type: "ephemeral" };
}

export interface LLMRequest {
  system: string | SystemBlock[];
  messages: LLMMessage[];
  tools?: ToolDef[];
  maxTokens?: number;
}

export interface SystemBlock {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
}

export interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface LLMResult {
  text: string;
  toolCalls: { id: string; name: string; input: Record<string, unknown> }[];
  stopReason: string;
  model: string;
  provider: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
}

interface ProviderRow {
  name: string;
  provider: string;
  model_id: string;
  endpoint_url: string | null;
  priority: number;
  capabilities: string[];
  max_tokens: number;
  config: Record<string, unknown>;
}

// ── Provider Cache ──

let cachedProviders: ProviderRow[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

async function getProviders(requiredCapabilities: string[] = ["text"]): Promise<ProviderRow[]> {
  const now = Date.now();
  if (!cachedProviders || now - cacheTimestamp > CACHE_TTL_MS) {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from("llm_providers")
      .select("name, provider, model_id, endpoint_url, priority, capabilities, max_tokens, config")
      .eq("is_active", true)
      .order("priority", { ascending: true });
    if (error) throw new Error(`LLM providers query failed: ${error.message}`);
    cachedProviders = (data || []) as ProviderRow[];
    cacheTimestamp = now;
  }

  return cachedProviders.filter((p) =>
    requiredCapabilities.every((cap) => p.capabilities.includes(cap))
  );
}

// ── Main Router ──

export async function callLLM(
  request: LLMRequest,
  requiredCapabilities: string[] = ["text"],
): Promise<LLMResult> {
  const providers = await getProviders(requiredCapabilities);
  if (providers.length === 0) {
    throw new Error(`No active LLM provider with capabilities: ${requiredCapabilities.join(", ")}`);
  }

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      const start = Date.now();
      let result: LLMResult;

      switch (provider.provider) {
        case "anthropic":
          result = await callAnthropic(provider, request);
          break;
        case "google":
          result = await callGoogle(provider, request);
          break;
        case "openai":
        case "local":
          result = await callOpenAICompat(provider, request);
          break;
        default:
          throw new Error(`Unknown provider: ${provider.provider}`);
      }

      result.latencyMs = Date.now() - start;
      result.provider = provider.name;
      console.log(`[llm-router] ${provider.name}: ${result.tokensIn}in/${result.tokensOut}out, ${result.latencyMs}ms`);
      return result;
    } catch (err) {
      lastError = err as Error;
      console.error(`[llm-router] ${provider.name} failed: ${lastError.message}, trying next...`);
    }
  }

  throw new Error(`All LLM providers failed. Last: ${lastError?.message}`);
}

// ── Anthropic (Claude) ──

async function callAnthropic(provider: ProviderRow, request: LLMRequest): Promise<LLMResult> {
  const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

  const tools: Anthropic.Tool[] = (request.tools || []).map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters as Anthropic.Tool.InputSchema,
  }));

  const response = await anthropic.messages.create({
    model: provider.model_id,
    max_tokens: request.maxTokens || provider.max_tokens,
    system: request.system as any,
    tools: tools.length > 0 ? tools : undefined,
    messages: request.messages as any,
  });

  const textBlocks = response.content.filter((b: any) => b.type === "text");
  const toolBlocks = response.content.filter((b: any) => b.type === "tool_use");

  return {
    text: textBlocks.map((b: any) => b.text).join("\n"),
    toolCalls: toolBlocks.map((b: any) => ({ id: b.id, name: b.name, input: b.input })),
    stopReason: response.stop_reason || "end_turn",
    model: provider.model_id,
    provider: provider.name,
    tokensIn: response.usage?.input_tokens || 0,
    tokensOut: response.usage?.output_tokens || 0,
    latencyMs: 0,
  };
}

// ── Google (Gemini) ──

async function callGoogle(provider: ProviderRow, request: LLMRequest): Promise<LLMResult> {
  const apiKey = Deno.env.get("GOOGLE_AI_API_KEY");
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY not configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${provider.model_id}:generateContent?key=${apiKey}`;

  const systemText = typeof request.system === "string"
    ? request.system
    : request.system.map((b) => b.text).join("\n\n");

  const geminiMessages = request.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: typeof m.content === "string" ? m.content : m.content.map((b) => b.text || "").join("\n") }],
  }));

  const geminiTools = request.tools && request.tools.length > 0 ? [{
    functionDeclarations: request.tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    })),
  }] : undefined;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemText }] },
      contents: geminiMessages,
      tools: geminiTools,
    }),
  });

  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts || [];

  const textParts = parts.filter((p: any) => p.text);
  const fnParts = parts.filter((p: any) => p.functionCall);

  return {
    text: textParts.map((p: any) => p.text).join("\n"),
    toolCalls: fnParts.map((p: any, i: number) => ({
      id: `gemini_${i}`,
      name: p.functionCall.name,
      input: p.functionCall.args || {},
    })),
    stopReason: fnParts.length > 0 ? "tool_use" : "end_turn",
    model: provider.model_id,
    provider: provider.name,
    tokensIn: data.usageMetadata?.promptTokenCount || 0,
    tokensOut: data.usageMetadata?.candidatesTokenCount || 0,
    latencyMs: 0,
  };
}

// ── OpenAI-Compatible (Ollama, Local LLM) ──

async function callOpenAICompat(provider: ProviderRow, request: LLMRequest): Promise<LLMResult> {
  const endpoint = provider.endpoint_url;
  if (!endpoint) throw new Error(`No endpoint_url for local provider ${provider.name}`);

  const systemText = typeof request.system === "string"
    ? request.system
    : request.system.map((b) => b.text).join("\n\n");

  const messages = [
    { role: "system", content: systemText },
    ...request.messages.map((m) => ({
      role: m.role,
      content: typeof m.content === "string" ? m.content : m.content.map((b) => b.text || "").join("\n"),
    })),
  ];

  const openaiTools = request.tools?.map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));

  const res = await fetch(`${endpoint}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: provider.model_id,
      messages,
      tools: openaiTools && openaiTools.length > 0 ? openaiTools : undefined,
      max_tokens: request.maxTokens || provider.max_tokens,
      ...(provider.config || {}),
    }),
  });

  if (!res.ok) throw new Error(`Local LLM ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const data = await res.json();
  const choice = data.choices?.[0];
  const msg = choice?.message;

  const toolCalls = (msg?.tool_calls || []).map((tc: any) => ({
    id: tc.id || `local_${Math.random().toString(36).slice(2)}`,
    name: tc.function.name,
    input: JSON.parse(tc.function.arguments || "{}"),
  }));

  return {
    text: msg?.content || "",
    toolCalls,
    stopReason: toolCalls.length > 0 ? "tool_use" : "end_turn",
    model: provider.model_id,
    provider: provider.name,
    tokensIn: data.usage?.prompt_tokens || 0,
    tokensOut: data.usage?.completion_tokens || 0,
    latencyMs: 0,
  };
}
