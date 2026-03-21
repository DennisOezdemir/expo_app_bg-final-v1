import { supabase } from "@/lib/supabase";

export interface GenerateProtokollPdfResult {
  storagePath: string;
  pdfSizeBytes: number;
  protocolId: string;
  protocolType: string;
}

/**
 * Ruft die generate-protokoll-pdf Edge Function auf und gibt den Storage-Pfad zurück.
 * Aktualisiert inspection_protocols.pdf_storage_path serverseitig automatisch.
 */
export async function generateProtokollPdf(
  protocolId: string,
  protocolType: "erstbegehung" | "zwischenbegehung" | "abnahme"
): Promise<GenerateProtokollPdfResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  if (!token) {
    throw new Error("Nicht angemeldet");
  }

  const { data: urlData } = supabase.storage.from("project-files").getPublicUrl("");
  // Basis-URL aus Supabase ableiten
  const supabaseUrl = (supabase as unknown as { supabaseUrl: string }).supabaseUrl
    ?? process.env.EXPO_PUBLIC_SUPABASE_URL
    ?? "";

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-protokoll-pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      protocol_id: protocolId,
      protocol_type: protocolType,
    }),
  });

  if (!response.ok) {
    let errMsg = `HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      errMsg = errJson.error ?? errMsg;
    } catch {
      // ignore
    }
    throw new Error(`PDF-Generierung fehlgeschlagen: ${errMsg}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error ?? "Unbekannter Fehler");
  }

  return {
    storagePath: result.storage_path,
    pdfSizeBytes: result.pdf_size_bytes ?? 0,
    protocolId: result.protocol_id,
    protocolType: result.protocol_type,
  };
}

/**
 * Gibt eine signierte Download-URL für einen Storage-Pfad zurück (60 Minuten gültig).
 */
export async function getProtokollPdfDownloadUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("project-files")
    .createSignedUrl(storagePath, 3600);

  if (error || !data?.signedUrl) {
    throw new Error("Download-URL konnte nicht erstellt werden: " + (error?.message ?? "Unbekannt"));
  }

  return data.signedUrl;
}
