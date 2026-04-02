const baseCorsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-agent-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
};

export function getCorsHeaders(req?: Request): HeadersInit {
  const origin = req?.headers.get("origin");

  return {
    ...baseCorsHeaders,
    "Access-Control-Allow-Origin": origin?.trim() || "*",
  };
}

export const corsHeaders = getCorsHeaders();

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }
  return null;
}
