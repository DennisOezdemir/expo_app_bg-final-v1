import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";

// ── Types ──

interface Project {
  id: string;
  project_number: string;
  name: string;
  display_name: string | null;
  object_street: string;
  object_zip: string;
  object_city: string;
  status: string;
}

interface OfferRow {
  id: string;
  offer_number: string;
  status: string;
  total_net: number;
}

interface Position {
  id: string;
  offer_id: string;
  position_number: number;
  title: string;
  description: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  trade: string;
}

export interface AuftragData {
  project: Project;
  offers: OfferRow[];
  positions: Record<string, Position[]>;
}

// ── Fetch ──

async function fetchAuftragDetail(projectId: string): Promise<AuftragData | null> {
  const { data: proj, error: projErr } = await supabase
    .from("projects")
    .select(
      "id, project_number, name, display_name, object_street, object_zip, object_city, status"
    )
    .eq("id", projectId)
    .maybeSingle();

  if (projErr) throw projErr;
  if (!proj) return null;

  const { data: offersData, error: offersErr } = await supabase
    .from("offers")
    .select("id, offer_number, status, total_net")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (offersErr) throw offersErr;

  const offers = (offersData ?? []).map((o: any) => ({
    ...o,
    total_net: parseFloat(o.total_net) || 0,
  }));

  const offerIds = offers.map((o: any) => o.id);
  const positions: Record<string, Position[]> = {};

  if (offerIds.length > 0) {
    const { data: posData, error: posErr } = await supabase
      .from("offer_positions")
      .select(
        "id, offer_id, position_number, title, description, quantity, unit, unit_price, total_price, trade"
      )
      .in("offer_id", offerIds)
      .is("deleted_at", null)
      .order("position_number", { ascending: true });

    if (posErr) throw posErr;

    (posData ?? []).forEach((p: any) => {
      if (!positions[p.offer_id]) positions[p.offer_id] = [];
      positions[p.offer_id].push({
        ...p,
        quantity: parseFloat(p.quantity) || 0,
        unit_price: parseFloat(p.unit_price) || 0,
        total_price: parseFloat(p.total_price) || 0,
      });
    });
  }

  return { project: proj as Project, offers, positions };
}

// ── Hook ──

export function useAuftragDetail(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.auftrag.detail(projectId ?? ""),
    queryFn: () => fetchAuftragDetail(projectId!),
    enabled: !!projectId,
  });
}
