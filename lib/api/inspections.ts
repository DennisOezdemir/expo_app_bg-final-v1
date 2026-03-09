import { supabase } from "@/lib/supabase";

export interface LatestInspectionProtocolItem {
  position_id: string | null;
  status: string | null;
  progress_percent: number | null;
}

export interface LatestInspectionProtocol {
  id: string;
  finalized_at: string | null;
  items: LatestInspectionProtocolItem[];
}

type ProtocolType = "erstbegehung" | "zwischenbegehung" | "abnahme";

interface ProtocolInsertInput {
  projectId: string;
  protocolType: ProtocolType;
  totalItems: number;
  completedItems: number;
  itemsWithIssues?: number;
  signaturePath?: string | null;
}

interface ProtocolItemInsertInput {
  offer_position_id?: string | null;
  sort_order: number;
  status: string;
  notes?: string | null;
  has_defect?: boolean;
  is_additional?: boolean;
  catalog_position_nr?: string | null;
  progress_percent?: number | null;
}

interface PositionUpdateInput {
  positionId: string;
  data: Record<string, unknown>;
}

type SignaturePoint = { x: number; y: number };
type SignatureLine = SignaturePoint[];

export async function fetchLatestInspectionProtocol(
  projectId: string,
  protocolType: "erstbegehung" | "zwischenbegehung" | "abnahme"
): Promise<LatestInspectionProtocol | null> {
  const { data: protocol, error: protocolError } = await supabase
    .from("inspection_protocols")
    .select("id, finalized_at")
    .eq("project_id", projectId)
    .eq("protocol_type", protocolType)
    .order("finalized_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (protocolError) throw protocolError;
  if (!protocol) return null;

  const { data: items, error: itemsError } = await supabase
    .from("inspection_protocol_items")
    .select("offer_position_id, status, progress_percent")
    .eq("protocol_id", protocol.id)
    .order("sort_order", { ascending: true });

  if (itemsError) throw itemsError;

  return {
    id: protocol.id,
    finalized_at: protocol.finalized_at,
    items: (items ?? []).map((item) => ({
      position_id: item.offer_position_id ?? null,
      status: item.status ?? null,
      progress_percent: item.progress_percent ?? null,
    })),
  };
}

export async function createInspectionProtocol(input: ProtocolInsertInput): Promise<{ id: string; protocol_number: string | null }> {
  const { data, error } = await supabase
    .from("inspection_protocols")
    .insert({
      project_id: input.projectId,
      protocol_type: input.protocolType,
      inspection_date: new Date().toISOString().split("T")[0],
      status: "completed",
      finalized_at: new Date().toISOString(),
      total_items: input.totalItems,
      completed_items: input.completedItems,
      items_with_issues: input.itemsWithIssues ?? 0,
      signature_path: input.signaturePath ?? null,
    })
    .select("id, protocol_number")
    .single();

  if (error) throw error;
  return data;
}

export async function insertInspectionProtocolItems(protocolId: string, items: ProtocolItemInsertInput[]): Promise<void> {
  if (items.length === 0) return;

  const payload = items.map((item) => ({
    protocol_id: protocolId,
    offer_position_id: item.offer_position_id ?? null,
    sort_order: item.sort_order,
    status: item.status,
    notes: item.notes ?? null,
    has_defect: item.has_defect ?? false,
    is_additional: item.is_additional ?? false,
    catalog_position_nr: item.catalog_position_nr ?? null,
    progress_percent: item.progress_percent ?? null,
  }));

  const { error } = await supabase.from("inspection_protocol_items").insert(payload);
  if (error) throw error;
}

export async function updateOfferPositions(updates: PositionUpdateInput[]): Promise<void> {
  if (updates.length === 0) return;

  const results = await Promise.all(
    updates.map(({ positionId, data }) =>
      supabase.from("offer_positions").update(data).eq("id", positionId)
    )
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}

export async function updateProjectInspectionState(
  projectId: string,
  data: { status?: string; progress_percent?: number }
): Promise<void> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof data.status === "string") payload.status = data.status;
  if (typeof data.progress_percent === "number") payload.progress_percent = data.progress_percent;

  const { error } = await supabase.from("projects").update(payload).eq("id", projectId);
  if (error) throw error;
}

export async function emitInspectionCompletedEvent(input: {
  projectId: string;
  protocolId: string;
  protocolType: ProtocolType;
  protocolNumber?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.from("events").insert({
    event_type: "INSPECTION_PROTOCOL_COMPLETED",
    project_id: input.projectId,
    source_system: "app",
    source_flow: "inspection_finalize",
    payload: {
      protocol_id: input.protocolId,
      protocol_type: input.protocolType,
      protocol_number: input.protocolNumber ?? null,
      ...(input.payload ?? {}),
    },
  });

  if (error) throw error;
}

function buildSignatureSvg(lines: SignatureLine[]): string {
  const pathData = lines
    .filter((line) => line.length > 1)
    .map((line) =>
      line
        .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
        .join(" ")
    )
    .join(" ");

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="150" viewBox="0 0 400 150">',
    '<rect width="400" height="150" fill="#09090b"/>',
    `<path d="${pathData}" fill="none" stroke="#fafafa" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    "</svg>",
  ].join("");
}

export async function uploadInspectionSignature(
  projectId: string,
  protocolId: string,
  lines: SignatureLine[]
): Promise<string> {
  const storagePath = `signatures/${projectId}/${protocolId}.svg`;
  const svg = buildSignatureSvg(lines);
  const payload = new TextEncoder().encode(svg);

  const { error } = await supabase.storage
    .from("project-files")
    .upload(storagePath, payload, {
      contentType: "image/svg+xml",
      upsert: true,
    });

  if (error) throw error;
  return storagePath;
}

export async function updateInspectionProtocol(
  protocolId: string,
  data: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from("inspection_protocols")
    .update(data)
    .eq("id", protocolId);

  if (error) throw error;
}
