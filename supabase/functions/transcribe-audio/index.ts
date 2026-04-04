/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { handleCors } from "../_shared/cors.ts";
import { requireUserContext } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

/**
 * transcribe-audio — Sprachaufnahme transkribieren via OpenAI Whisper
 *
 * POST /functions/v1/transcribe-audio
 * Body: {
 *   audio_url: string  // Signed Supabase Storage URL (via lib/audio-capture.ts hochgeladen)
 * }
 *
 * Returns: {
 *   transcript: string,
 *   duration_ms: number,
 *   language: string
 * }
 */

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const WHISPER_MODEL = "whisper-1";

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    await requireUserContext(req);
  } catch (e) {
    const message = (e as Error).message;
    const status = message === "Forbidden" ? 403 : 401;
    return errorResponse(message, status, req);
  }

  if (!OPENAI_API_KEY) {
    return errorResponse("OPENAI_API_KEY nicht konfiguriert", 500, req);
  }

  let audio_url: string;
  try {
    const body = await req.json();
    audio_url = body.audio_url?.trim();
  } catch {
    return errorResponse("Ungültiger Request-Body", 400, req);
  }

  if (!audio_url) {
    return errorResponse("audio_url ist erforderlich", 400, req);
  }

  // Audio-Datei herunterladen
  let audioBuffer: ArrayBuffer;
  const startMs = Date.now();

  try {
    const audioRes = await fetch(audio_url);
    if (!audioRes.ok) {
      return errorResponse(`Audio-Datei nicht gefunden (HTTP ${audioRes.status})`, 400, req);
    }
    audioBuffer = await audioRes.arrayBuffer();
  } catch (fetchErr) {
    console.error("[transcribe-audio] Download failed:", (fetchErr as Error).message);
    return errorResponse("Audio-Datei konnte nicht heruntergeladen werden", 400, req);
  }

  if (audioBuffer.byteLength === 0) {
    return errorResponse("Audio-Datei ist leer", 400, req);
  }

  // Dateiname aus URL extrahieren für MIME-Type Erkennung
  let fileName = "audio.m4a";
  try {
    const urlPath = new URL(audio_url).pathname;
    fileName = urlPath.split("/").pop() || "audio.m4a";
  } catch { /* URL-Parse-Fehler ignorieren */ }

  const ext = fileName.split(".").pop()?.toLowerCase() || "m4a";

  // Whisper unterstützt: flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav, webm
  const mimeMap: Record<string, string> = {
    m4a: "audio/m4a",
    mp3: "audio/mpeg",
    mp4: "audio/mp4",
    wav: "audio/wav",
    webm: "audio/webm",
    ogg: "audio/ogg",
    flac: "audio/flac",
  };
  const mimeType = mimeMap[ext] || "audio/m4a";

  // Whisper API aufrufen
  const formData = new FormData();
  formData.append("file", new Blob([audioBuffer], { type: mimeType }), fileName);
  formData.append("model", WHISPER_MODEL);
  formData.append("language", "de");
  formData.append("response_format", "verbose_json");

  let whisperRes: Response;
  try {
    whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: formData,
    });
  } catch (whisperErr) {
    console.error("[transcribe-audio] Whisper API call failed:", (whisperErr as Error).message);
    return errorResponse("Transkription fehlgeschlagen", 422, req);
  }

  if (!whisperRes.ok) {
    const errBody = await whisperRes.text();
    console.error("[transcribe-audio] Whisper error:", whisperRes.status, errBody.slice(0, 200));
    return errorResponse("Transkription fehlgeschlagen: " + errBody.slice(0, 100), 422, req);
  }

  const whisperData = await whisperRes.json();
  const transcript: string = whisperData.text?.trim() || "";
  const duration_ms = Math.round((whisperData.duration || 0) * 1000);
  const language: string = whisperData.language || "de";
  const elapsed_ms = Date.now() - startMs;

  if (!transcript) {
    return errorResponse("Keine Sprache erkannt", 422, req);
  }

  console.log(`[transcribe-audio] OK — ${transcript.length} chars, ${duration_ms}ms audio, ${elapsed_ms}ms total`);

  return jsonResponse({ transcript, duration_ms, language }, 200, req);
});
