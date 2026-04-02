import { getCorsHeaders } from "./cors.ts";

export function jsonResponse(data: unknown, status = 200, req?: Request): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, status = 400, req?: Request): Response {
  return jsonResponse({ error: message, success: false }, status, req);
}
