import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback, useMemo, useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { captureAndUploadPhoto } from "@/lib/photo-capture";
import { useOffline } from "@/contexts/OfflineContext";
import {
  createInspectionProtocol,
  emitInspectionCompletedEvent,
  fetchLatestInspectionProtocol,
  insertInspectionProtocolItems,
  updateInspectionProtocol,
  updateOfferPositions,
  updateProjectInspectionState,
  uploadInspectionSignature,
} from "@/lib/api/inspections";
import { useProductSearch } from "@/hooks/queries/useProductSearch";
import { searchProducts, findDuplicatePositions, assignProductToPositions } from "@/lib/api/product-search";
import type { Product } from "@/lib/api/materials";
import {
  fetchTeamForTrade,
  fetchSubcontractorsForTrade,
  assignTeamToPositions,
  assignSubcontractorToPositions,
} from "@/lib/api/team-assignment";
import type { TeamMemberRow } from "@/lib/api/team";
import type { SubcontractorRow } from "@/lib/api/team-assignment";

type PosCheckStatus = "none" | "confirmed" | "rejected";
type ZBWorkStatus = "nicht_gestartet" | "geplant" | "in_arbeit";
type ZBProgress = 0 | 25 | 50 | 75 | 100;

interface BegehungPosition {
  id: string;
  nr: string;
  title: string;
  desc: string;
  qty: number;
  unit: string;
  price: number;
  trade: string;
}

interface BegehungRoom {
  id: string;
  icon: string;
  name: string;
  positions: BegehungPosition[];
}

interface PosState {
  status: PosCheckStatus;
  photoCount: number;
  note: string;
}

interface ZBPosState {
  workStatus: ZBWorkStatus;
  progress: ZBProgress;
  photoCount: number;
}

interface MehrleistungItem {
  id: string;
  title: string;
  desc: string;
  qty: number;
  unit: string;
  price: number;
  trade: string;
  fromCatalog: boolean;
}

interface CatalogEntry {
  id: string;
  nr: string;
  title: string;
  desc: string;
  unit: string;
  price: number;
  trade: string;
}

const CATALOGS: Record<string, { label: string; entries: CatalogEntry[] }> = {
  saga: {
    label: "SAGA Katalog",
    entries: [
      { id: "c1", nr: "S-01", title: "T\u00FCrdr\u00FCcker wechseln", desc: "T\u00FCrdr\u00FCcker demontieren und neuen montieren.", unit: "Stk", price: 35, trade: "Tischler" },
      { id: "c2", nr: "S-02", title: "Buntbartschloss tauschen", desc: "Buntbartschloss ausbauen, neues einbauen inkl. Schl\u00FCssel.", unit: "Stk", price: 45, trade: "Tischler" },
      { id: "c3", nr: "S-03", title: "Thermostatk\u00F6pfe tauschen", desc: "Heizk\u00F6rper-Thermostatk\u00F6pfe abschrauben, neue montieren.", unit: "Stk", price: 28, trade: "Heizung" },
      { id: "c4", nr: "S-04", title: "Steckdose tauschen", desc: "Unterputz-Steckdose demontieren, neue einsetzen.", unit: "Stk", price: 22, trade: "Elektro" },
      { id: "c5", nr: "S-05", title: "Lichtschalter tauschen", desc: "Unterputz-Schalter demontieren, neuen montieren.", unit: "Stk", price: 22, trade: "Elektro" },
      { id: "c6", nr: "S-06", title: "Silikonfuge erneuern", desc: "Altsilikon entfernen, neu verfugen.", unit: "lfm", price: 8.5, trade: "Fliesen" },
      { id: "c7", nr: "S-07", title: "T\u00FCrblatt lackieren", desc: "T\u00FCrblatt abschleifen, grundieren, 2x lackieren.", unit: "Stk", price: 180, trade: "Maler" },
      { id: "c8", nr: "S-08", title: "T\u00FCrzarge lackieren", desc: "T\u00FCrzarge schleifen und 2x lackieren.", unit: "Stk", price: 95, trade: "Maler" },
      { id: "c9", nr: "S-09", title: "Heizk\u00F6rper lackieren", desc: "Heizk\u00F6rper reinigen, schleifen, 2x lackieren.", unit: "Stk", price: 120, trade: "Maler" },
      { id: "c10", nr: "S-10", title: "Rauchmelder montieren", desc: "Rauchmelder nach DIN 14676 montieren.", unit: "Stk", price: 38, trade: "Allg." },
      { id: "c11", nr: "S-11", title: "Sp\u00FClkasten-Innenleben", desc: "Sp\u00FClkasten-Garnitur erneuern.", unit: "Stk", price: 65, trade: "Sanit\u00E4r" },
      { id: "c12", nr: "S-12", title: "Waschmaschinenanschluss", desc: "Waschmaschinenanschluss herstellen inkl. Eckventil.", unit: "Stk", price: 85, trade: "Sanit\u00E4r" },
    ],
  },
  intern: {
    label: "Interner Katalog",
    entries: [
      { id: "i1", nr: "I-01", title: "Rigipsdecke abh\u00E4ngen", desc: "Unterkonstruktion und GK-Platten an Decke montieren.", unit: "m\u00B2", price: 48, trade: "Trockenbau" },
      { id: "i2", nr: "I-02", title: "Vorsatzschale", desc: "Vorsatzschale aus GK auf Unterkonstruktion.", unit: "m\u00B2", price: 42, trade: "Trockenbau" },
      { id: "i3", nr: "I-03", title: "Fu\u00DFbodenheizung pr\u00FCfen", desc: "Fu\u00DFbodenheizkreise sp\u00FClen und Druckpr\u00FCfung.", unit: "Pauschal", price: 220, trade: "Heizung" },
      { id: "i4", nr: "I-04", title: "Fensterbank innen", desc: "Fensterbank aus Kunststein montieren.", unit: "Stk", price: 75, trade: "Allg." },
    ],
  },
};

const TYPE_LABELS: Record<string, string> = {
  erstbegehung: "Erstbegehung",
  zwischenbegehung: "Zwischenbegehung",
  abnahme: "Abnahme",
};

const PROGRESS_STEPS: ZBProgress[] = [0, 25, 50, 75, 100];

const WS_CONFIG: Record<ZBWorkStatus, { label: string; color: string; icon: string }> = {
  nicht_gestartet: { label: "Nicht gestartet", color: Colors.raw.zinc600, icon: "radio-button-off" },
  geplant: { label: "Geplant", color: Colors.raw.blue500, icon: "calendar" },
  in_arbeit: { label: "In Arbeit", color: Colors.raw.amber500, icon: "hammer" },
};

function formatEuro(amount: number): string {
  return "\u20AC" + amount.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function genId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

interface ProjectInfo {
  projectNumber: string;
  address: string;
}

function getSectionIcon(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("bad") || lower.includes("wc") || lower.includes("dusch") || lower.includes("sanitär")) return "water";
  if (lower.includes("küch")) return "restaurant";
  if (lower.includes("schlaf")) return "bed";
  if (lower.includes("kind")) return "happy";
  if (lower.includes("flur") || lower.includes("diele") || lower.includes("eingang")) return "walk";
  if (lower.includes("balkon") || lower.includes("terrass") || lower.includes("loggia")) return "sunny";
  if (lower.includes("keller") || lower.includes("abst")) return "cube";
  if (lower.includes("wohn")) return "tv";
  return "home";
}

async function fetchProjectInfo(projectId: string): Promise<ProjectInfo | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("project_number, object_street, object_zip, object_city")
    .eq("id", projectId)
    .single();
  if (error || !data) return null;
  return {
    projectNumber: data.project_number,
    address: [data.object_street, [data.object_zip, data.object_city].filter(Boolean).join(" ")].filter(Boolean).join(", "),
  };
}

async function fetchRoomsForProject(projectId: string, offerId?: string): Promise<BegehungRoom[]> {
  // 1. Find the offer — specific one if offerId given, otherwise first
  let offerData: { id: string } | null = null;
  if (offerId) {
    const { data, error } = await supabase
      .from("offers")
      .select("id")
      .eq("id", offerId)
      .single();
    if (!error && data) offerData = data;
  }
  if (!offerData) {
    const { data, error } = await supabase
      .from("offers")
      .select("id")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();
    if (error || !data) return [];
    offerData = data;
  }

  // 2. Load sections (rooms)
  const { data: sections, error: secError } = await supabase
    .from("offer_sections")
    .select("id, title, section_number")
    .eq("offer_id", offerData.id)
    .order("section_number", { ascending: true });
  if (secError || !sections || sections.length === 0) return [];

  // 3. Load positions
  const sectionIds = sections.map((s) => s.id);
  const { data: positions, error: posError } = await supabase
    .from("offer_positions")
    .select("id, section_id, position_number, title, description, quantity, unit, unit_price, trade, sort_order")
    .in("section_id", sectionIds)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });
  if (posError || !positions) return [];

  // 4. Group positions by section
  const posBySection: Record<string, typeof positions> = {};
  for (const pos of positions) {
    if (!posBySection[pos.section_id]) posBySection[pos.section_id] = [];
    posBySection[pos.section_id].push(pos);
  }

  return sections.map((sec) => ({
    id: sec.id,
    icon: getSectionIcon(sec.title),
    name: sec.title,
    positions: (posBySection[sec.id] || []).map((pos) => ({
      id: pos.id,
      nr: String(pos.position_number ?? ""),
      title: pos.title || "",
      desc: pos.description || "",
      qty: Number(pos.quantity) || 0,
      unit: pos.unit || "Stk",
      price: Number(pos.unit_price) || 0,
      trade: pos.trade || "Sonstiges",
    })),
  }));
}

export default function BegehungScreen() {
  const { type, projectId, protocolId, offerId } = useLocalSearchParams<{ type: string; projectId: string; protocolId?: string; offerId?: string }>();

  if (!projectId) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.raw.zinc950, alignItems: "center", justifyContent: "center", padding: 32 }}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.raw.zinc600} />
        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.raw.zinc400, textAlign: "center", marginTop: 16 }}>Bitte von der Projektseite starten</Text>
        <Pressable onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)"); }} style={{ marginTop: 20, backgroundColor: Colors.raw.amber500, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 }}>
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc950 }}>Zurück</Text>
        </Pressable>
      </View>
    );
  }

  if (type === "zwischenbegehung") return <ZwischenbegehungView projectId={projectId} protocolId={protocolId} offerId={offerId} />;
  if (type === "abnahme") return <AbnahmeView projectId={projectId} protocolId={protocolId} offerId={offerId} />;
  return <ErstbegehungView type={type || "erstbegehung"} projectId={projectId} protocolId={protocolId} offerId={offerId} />;
}

/* ─── Material Types ───────────────────────── */

interface MaterialAssignment {
  productId: string;
  productName: string;
  price: string;
  supplier: string;
}

interface TeamAssignment {
  type: "eigen" | "fremd";
  name: string;
  entityId: string;
}

/* ─── PulsingBadge ─────────────────────────── */
/* Pulsierendes Badge für "Material zuordnen" */

function PulsingMaterialBadge({ onPress, assigned }: { onPress: () => void; assigned?: MaterialAssignment | null }) {
  const pulseAnim = useSharedValue(0.15);

  useEffect(() => {
    if (!assigned) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(0.35, { duration: 1200 }),
          withTiming(0.15, { duration: 1200 }),
        ),
        -1,
        false,
      );
    }
  }, [assigned]);

  const pulseStyle = useAnimatedStyle(() => ({
    backgroundColor: assigned
      ? Colors.raw.emerald500 + "20"
      : `rgba(245, 158, 11, ${pulseAnim.value})`,
  }));

  if (assigned) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        <View style={ms.badgeAssigned}>
          <Ionicons name="cube" size={14} color={Colors.raw.emerald500} />
          <Text style={ms.badgeAssignedText} numberOfLines={1}>{assigned.productName}</Text>
          <Text style={ms.badgeAssignedPrice}>{"\u20AC"}{assigned.price}</Text>
          <Ionicons name="swap-horizontal" size={12} color={Colors.raw.zinc500} />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <Animated.View style={[ms.badgePulse, pulseStyle]}>
        <Ionicons name="cube-outline" size={16} color={Colors.raw.amber500} />
        <Text style={ms.badgePulseText}>Material zuordnen</Text>
        <Ionicons name="chevron-forward" size={14} color={Colors.raw.amber500} />
      </Animated.View>
    </Pressable>
  );
}

const ms = StyleSheet.create({
  badgePulse: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.raw.amber500 + "50",
    marginTop: 6,
  },
  badgePulseText: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.amber500, flex: 1 },
  badgeAssigned: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.raw.emerald500 + "15",
    borderWidth: 1,
    borderColor: Colors.raw.emerald500 + "30",
    marginTop: 6,
  },
  badgeAssignedText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.emerald400, flex: 1 },
  badgeAssignedPrice: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.raw.emerald400 },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: Colors.raw.zinc900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.raw.zinc600, alignSelf: "center", marginTop: 10, marginBottom: 8 },
  modalHeader: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.raw.zinc800 },
  modalPosNr: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.amber500 },
  modalPosTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.raw.white, marginTop: 4 },
  modalPosMeta: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc400, marginTop: 4 },
  modalSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginHorizontal: 20,
    marginTop: 16,
  },
  modalSearchInput: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.raw.white, height: 48 },
  modalTradeHint: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginLeft: 24, marginTop: 8, marginBottom: 4 },
  modalProductRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  modalProductInfo: { flex: 1 },
  modalProductName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.raw.white },
  modalProductMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginTop: 2 },
  modalProductPrice: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.raw.white, marginRight: 10 },
  modalSelectBtn: {
    backgroundColor: Colors.raw.amber500,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: "center",
  },
  modalSelectText: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.raw.zinc950 },
  modalEmpty: { alignItems: "center", paddingVertical: 32, gap: 8 },
  modalEmptyText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc600 },
  modalLoading: { alignItems: "center", paddingVertical: 32 },
  // Duplikat dialog (shared with team)
  dupeOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 24 },
  dupeCard: { backgroundColor: Colors.raw.zinc900, borderRadius: 16, borderWidth: 1, borderColor: Colors.raw.zinc700, padding: 24, maxWidth: 380, width: "100%" },
  dupeTitle: { fontFamily: "Inter_700Bold", fontSize: 17, color: Colors.raw.white, textAlign: "center", marginBottom: 8 },
  dupeDesc: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.raw.zinc300, textAlign: "center", lineHeight: 20 },
  dupeHint: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, textAlign: "center", marginTop: 8, fontStyle: "italic" },
  dupeBtns: { flexDirection: "row", gap: 10, marginTop: 20 },
  dupeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  dupeBtnSecondary: { backgroundColor: Colors.raw.zinc800 },
  dupeBtnSecondaryText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc300 },
  dupeBtnPrimary: { backgroundColor: Colors.raw.amber500 },
  dupeBtnPrimaryText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.zinc950 },
});

/* ─── PulsingTeamBadge ────────────────────────── */
/* Pulsierendes Badge für "Team zuweisen" (blau) */

function PulsingTeamBadge({ onPress, assigned }: { onPress: () => void; assigned?: TeamAssignment | null }) {
  const pulseAnim = useSharedValue(0.15);

  useEffect(() => {
    if (!assigned) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(0.35, { duration: 1200 }),
          withTiming(0.15, { duration: 1200 }),
        ),
        -1,
        false,
      );
    }
  }, [assigned]);

  const pulseStyle = useAnimatedStyle(() => ({
    backgroundColor: assigned
      ? Colors.raw.emerald500 + "20"
      : `rgba(59, 130, 246, ${pulseAnim.value})`,
  }));

  if (assigned) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        <View style={teamS.badgeAssigned}>
          <Ionicons name="people" size={14} color={Colors.raw.emerald500} />
          <Text style={teamS.badgeAssignedText} numberOfLines={1}>{assigned.name}</Text>
          <Text style={teamS.badgeAssignedType}>{assigned.type === "eigen" ? "Eigen" : "NU"}</Text>
          <Ionicons name="swap-horizontal" size={12} color={Colors.raw.zinc500} />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <Animated.View style={[teamS.badgePulse, pulseStyle]}>
        <Ionicons name="people-outline" size={16} color={Colors.raw.blue500} />
        <Text style={teamS.badgePulseText}>Team zuweisen</Text>
        <Ionicons name="chevron-forward" size={14} color={Colors.raw.blue500} />
      </Animated.View>
    </Pressable>
  );
}

const teamS = StyleSheet.create({
  badgePulse: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.raw.blue500 + "50",
    marginTop: 6,
  },
  badgePulseText: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.blue500, flex: 1 },
  badgeAssigned: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.raw.emerald500 + "15",
    borderWidth: 1,
    borderColor: Colors.raw.emerald500 + "30",
    marginTop: 6,
  },
  badgeAssignedText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.emerald400, flex: 1 },
  badgeAssignedType: { fontFamily: "Inter_700Bold", fontSize: 11, color: Colors.raw.emerald400 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: Colors.raw.zinc900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.raw.zinc600, alignSelf: "center", marginTop: 10, marginBottom: 8 },
  modalHeader: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.raw.zinc800 },
  modalPosNr: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.blue500 },
  modalPosTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.raw.white, marginTop: 4 },
  modalPosMeta: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc400, marginTop: 4 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.raw.zinc800 + "80",
  },
  sectionHeaderText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.white },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.raw.blue500 + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  memberInfo: { flex: 1 },
  memberName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.raw.white },
  memberRole: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginTop: 2 },
  memberSelectBtn: {
    backgroundColor: Colors.raw.blue500,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 44,
    alignItems: "center",
  },
  memberSelectText: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.raw.white },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.raw.zinc700 },
  dividerText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.zinc500 },
  modalEmpty: { alignItems: "center", paddingVertical: 20, gap: 4 },
  modalEmptyText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc600 },
  modalLoading: { alignItems: "center", paddingVertical: 32 },
});

function ErstbegehungView({ type, projectId, protocolId, offerId }: { type: string; projectId: string; protocolId?: string; offerId?: string }) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const label = TYPE_LABELS[type] || "Begehung";
  const { isOnline, addToSyncQueue } = useOffline();

  // --- React Query: initial data fetching ---
  const { data: rooms = [], isLoading: roomsLoading, error: roomsError } = useQuery({
    queryKey: queryKeys.begehung.rooms(projectId, offerId),
    queryFn: () => fetchRoomsForProject(projectId, offerId),
    enabled: !!projectId,
  });
  const { data: projectInfo = null, isLoading: projectInfoLoading } = useQuery({
    queryKey: queryKeys.begehung.projectInfo(projectId),
    queryFn: () => fetchProjectInfo(projectId),
    enabled: !!projectId,
  });
  const loadingData = roomsLoading || projectInfoLoading;
  const loadError = roomsError ? (roomsError as Error).message || "Laden fehlgeschlagen" : null;

  const [resolvedOfferId, setResolvedOfferId] = useState<string | null>(offerId || null);
  const [catalogLabel, setCatalogLabel] = useState<string | null>(null);

  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [posStates, setPosStates] = useState<Record<string, PosState>>({});
  const [mehrleistungen, setMehrleistungen] = useState<Record<string, MehrleistungItem[]>>({});
  const [catalogModalRoom, setCatalogModalRoom] = useState<string | null>(null);
  const [selectedCatalog, setSelectedCatalog] = useState<string>("saga");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogStep, setCatalogStep] = useState<"pick" | "browse" | "free">("pick");
  const [freeTitle, setFreeTitle] = useState("");
  const [freeDesc, setFreeDesc] = useState("");
  const [freeQty, setFreeQty] = useState("1");
  const [freeUnit, setFreeUnit] = useState("Stk");
  const [freePrice, setFreePrice] = useState("");
  const [freeTrade, setFreeTrade] = useState("");
  const [finalized, setFinalized] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [plannedStart, setPlannedStart] = useState("");
  const [plannedEnd, setPlannedEnd] = useState("");
  const [materialAssignments, setMaterialAssignments] = useState<Record<string, MaterialAssignment>>({});
  const [materialModalPos, setMaterialModalPos] = useState<BegehungPosition | null>(null);
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialProducts, setMaterialProducts] = useState<Product[]>([]);
  const [materialLoading, setMaterialLoading] = useState(false);
  const [materialAssigning, setMaterialAssigning] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{ count: number; positionIds: string[] }>({ count: 0, positionIds: [] });
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);

  // Team assignment state
  const [teamAssignments, setTeamAssignments] = useState<Record<string, TeamAssignment>>({});
  const [teamModalPos, setTeamModalPos] = useState<BegehungPosition | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberRow[]>([]);
  const [teamSubcontractors, setTeamSubcontractors] = useState<SubcontractorRow[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamAssigning, setTeamAssigning] = useState(false);
  const [showTeamDuplicateDialog, setShowTeamDuplicateDialog] = useState(false);
  const [teamDuplicateInfo, setTeamDuplicateInfo] = useState<{ count: number; positionIds: string[] }>({ count: 0, positionIds: [] });
  const [pendingTeamChoice, setPendingTeamChoice] = useState<{ type: "eigen" | "fremd"; entityId: string; name: string } | null>(null);

  const handleMaterialAssigned = useCallback((posId: string, product: MaterialAssignment) => {
    setMaterialAssignments((prev) => ({ ...prev, [posId]: product }));
  }, []);

  const openMaterialModal = useCallback((pos: BegehungPosition) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMaterialModalPos(pos);
    setMaterialSearch("");
    setMaterialLoading(true);
    // Initial load: trade-filtered products
    searchProducts(undefined, pos.trade).then((prods) => {
      setMaterialProducts(prods);
      setMaterialLoading(false);
    }).catch(() => setMaterialLoading(false));
  }, []);

  const closeMaterialModal = useCallback(() => {
    setMaterialModalPos(null);
    setMaterialSearch("");
    setMaterialProducts([]);
    setShowDuplicateDialog(false);
  }, []);

  // Debounced search when user types
  useEffect(() => {
    if (!materialModalPos) return;
    const timer = setTimeout(() => {
      setMaterialLoading(true);
      searchProducts(materialSearch || undefined, materialSearch ? undefined : materialModalPos.trade)
        .then((prods) => { setMaterialProducts(prods); setMaterialLoading(false); })
        .catch(() => setMaterialLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [materialSearch, materialModalPos]);

  const handleSelectMaterialProduct = useCallback(async (product: Product) => {
    if (!materialModalPos) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Check duplicates
    if (resolvedOfferId && materialModalPos.nr) {
      try {
        const dupes = await findDuplicatePositions(resolvedOfferId, materialModalPos.nr);
        if (dupes.count > 1) {
          setDuplicateInfo(dupes);
          setPendingProduct(product);
          setShowDuplicateDialog(true);
          return;
        }
      } catch { /* ignore */ }
    }
    await doMaterialAssign(product, [materialModalPos.id]);
  }, [materialModalPos, resolvedOfferId]);

  const doMaterialAssign = useCallback(async (product: Product, posIds: string[]) => {
    if (!materialModalPos) return;
    setMaterialAssigning(true);
    try {
      await assignProductToPositions(projectId, product.id, posIds, product.name, materialModalPos.trade);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      for (const pId of posIds) {
        handleMaterialAssigned(pId, { productId: product.id, productName: product.name, price: product.price, supplier: product.supplier });
      }
      closeMaterialModal();
    } catch (err: any) {
      Alert.alert("Fehler", err.message || "Zuordnung fehlgeschlagen");
    } finally {
      setMaterialAssigning(false);
    }
  }, [materialModalPos, projectId, handleMaterialAssigned, closeMaterialModal]);

  const handleDuplicateChoice = useCallback((applyToAll: boolean) => {
    if (!pendingProduct || !materialModalPos) return;
    if (applyToAll) {
      doMaterialAssign(pendingProduct, duplicateInfo.positionIds);
    } else {
      doMaterialAssign(pendingProduct, [materialModalPos.id]);
    }
  }, [pendingProduct, duplicateInfo, materialModalPos, doMaterialAssign]);

  const handleNuBesorgtMaterial = useCallback(async () => {
    if (!materialModalPos) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nuInfo = teamAssignments[materialModalPos.id];
    const nuName = nuInfo?.name || "NU";
    const marker: MaterialAssignment = { productId: "nu_self", productName: "NU besorgt Material", price: "\u2014", supplier: nuName };

    if (resolvedOfferId && materialModalPos.nr) {
      try {
        const dupes = await findDuplicatePositions(resolvedOfferId, materialModalPos.nr);
        if (dupes.count > 1) {
          Alert.alert(
            `Position kommt ${dupes.count}x vor`,
            `"NU besorgt Material" auch f\u00FCr die anderen ${dupes.count - 1}?`,
            [
              { text: "Nur diese", onPress: () => { handleMaterialAssigned(materialModalPos.id, marker); closeMaterialModal(); } },
              { text: `Alle ${dupes.count}`, onPress: () => { for (const pId of dupes.positionIds) handleMaterialAssigned(pId, marker); closeMaterialModal(); } },
            ],
          );
          return;
        }
      } catch { /* ignore */ }
    }
    handleMaterialAssigned(materialModalPos.id, marker);
    closeMaterialModal();
  }, [materialModalPos, teamAssignments, resolvedOfferId, handleMaterialAssigned, closeMaterialModal]);

  // --- Team assignment handlers ---
  const handleTeamAssigned = useCallback((posId: string, assignment: TeamAssignment) => {
    setTeamAssignments((prev) => ({ ...prev, [posId]: assignment }));
  }, []);

  const openTeamModal = useCallback((pos: BegehungPosition) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTeamModalPos(pos);
    setTeamLoading(true);
    Promise.all([
      fetchTeamForTrade(pos.trade),
      fetchSubcontractorsForTrade(pos.trade),
    ]).then(([members, subs]) => {
      setTeamMembers(members);
      setTeamSubcontractors(subs);
      setTeamLoading(false);
    }).catch(() => setTeamLoading(false));
  }, []);

  const closeTeamModal = useCallback(() => {
    setTeamModalPos(null);
    setTeamMembers([]);
    setTeamSubcontractors([]);
    setShowTeamDuplicateDialog(false);
  }, []);

  const doTeamAssign = useCallback(async (assignType: "eigen" | "fremd", entityId: string, name: string, posIds: string[]) => {
    setTeamAssigning(true);
    try {
      if (assignType === "eigen") {
        await assignTeamToPositions(posIds, entityId);
      } else {
        await assignSubcontractorToPositions(posIds, entityId);
      }
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      for (const pId of posIds) {
        handleTeamAssigned(pId, { type: assignType, name, entityId });
      }
      closeTeamModal();
    } catch (err: any) {
      Alert.alert("Fehler", err.message || "Zuweisung fehlgeschlagen");
    } finally {
      setTeamAssigning(false);
    }
  }, [handleTeamAssigned, closeTeamModal]);

  const handleSelectTeamMember = useCallback(async (member: TeamMemberRow) => {
    if (!teamModalPos) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (resolvedOfferId && teamModalPos.nr) {
      try {
        const dupes = await findDuplicatePositions(resolvedOfferId, teamModalPos.nr);
        if (dupes.count > 1) {
          setTeamDuplicateInfo(dupes);
          setPendingTeamChoice({ type: "eigen", entityId: member.id, name: member.name });
          setShowTeamDuplicateDialog(true);
          return;
        }
      } catch { /* ignore */ }
    }
    await doTeamAssign("eigen", member.id, member.name, [teamModalPos.id]);
  }, [teamModalPos, resolvedOfferId, doTeamAssign]);

  const handleSelectSubcontractor = useCallback(async (sub: SubcontractorRow) => {
    if (!teamModalPos) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (resolvedOfferId && teamModalPos.nr) {
      try {
        const dupes = await findDuplicatePositions(resolvedOfferId, teamModalPos.nr);
        if (dupes.count > 1) {
          setTeamDuplicateInfo(dupes);
          setPendingTeamChoice({ type: "fremd", entityId: sub.id, name: sub.short_name || sub.name });
          setShowTeamDuplicateDialog(true);
          return;
        }
      } catch { /* ignore */ }
    }
    await doTeamAssign("fremd", sub.id, sub.short_name || sub.name, [teamModalPos.id]);
  }, [teamModalPos, resolvedOfferId, doTeamAssign]);

  const handleTeamDuplicateChoice = useCallback((applyToAll: boolean) => {
    if (!pendingTeamChoice || !teamModalPos) return;
    if (applyToAll) {
      doTeamAssign(pendingTeamChoice.type, pendingTeamChoice.entityId, pendingTeamChoice.name, teamDuplicateInfo.positionIds);
    } else {
      doTeamAssign(pendingTeamChoice.type, pendingTeamChoice.entityId, pendingTeamChoice.name, [teamModalPos.id]);
    }
  }, [pendingTeamChoice, teamDuplicateInfo, teamModalPos, doTeamAssign]);

  const [showDateModal, setShowDateModal] = useState(false);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  // Expand all rooms once loaded
  useEffect(() => {
    if (rooms.length > 0) {
      setExpandedRooms(new Set(rooms.map((r) => r.id)));
    }
  }, [rooms]);

  // Resolve offerId + catalog label + load saved protocol data
  useEffect(() => {
    if (loadingData) return;
    let cancelled = false;
    (async () => {
      try {
        // Resolve offerId + catalog label for protocol creation
        if (offerId) {
          setResolvedOfferId(offerId);
          const { data: offerInfo } = await supabase.from("offers").select("internal_notes").eq("id", offerId).single();
          if (offerInfo?.internal_notes) {
            const notes = offerInfo.internal_notes.toUpperCase();
            if (notes.includes("WABS")) setCatalogLabel("WABS");
            else if (notes.includes("AV")) setCatalogLabel("AV");
          }
        } else {
          // Fallback: first offer
          const { data: firstOffer } = await supabase.from("offers").select("id, internal_notes").eq("project_id", projectId).is("deleted_at", null).order("created_at").limit(1).single();
          if (firstOffer) {
            setResolvedOfferId(firstOffer.id);
            if (firstOffer.internal_notes) {
              const notes = firstOffer.internal_notes.toUpperCase();
              if (notes.includes("WABS")) setCatalogLabel("WABS");
              else if (notes.includes("AV")) setCatalogLabel("AV");
            }
          }
        }

        // Load saved protocol data if viewing a finalized inspection
        if (protocolId) {
          const { data: items } = await supabase
            .from("inspection_protocol_items")
            .select("offer_position_id, status, notes, has_defect")
            .eq("protocol_id", protocolId);
          if (!cancelled && items) {
            const restored: Record<string, PosState> = {};
            for (const item of items) {
              if (!item.offer_position_id) continue;
              restored[item.offer_position_id] = {
                status: item.status === "ja" ? "confirmed" : item.status === "nein" ? "rejected" : "none",
                photoCount: 0,
                note: item.notes || "",
              };
            }
            setPosStates(restored);
            setFinalized(true);
          }
        }
      } catch (_err) {
        // secondary data errors are non-critical
      }
    })();
    return () => { cancelled = true; };
  }, [loadingData, projectId, protocolId, offerId]);

  // Load existing planned dates
  useEffect(() => {
    supabase
      .from("projects")
      .select("planned_start, planned_end")
      .eq("id", projectId)
      .single()
      .then(({ data }) => {
        if (data?.planned_start) setPlannedStart(data.planned_start.substring(0, 10));
        if (data?.planned_end) setPlannedEnd(data.planned_end.substring(0, 10));
      });
  }, [projectId]);

  const toggleRoom = useCallback((roomId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId); else next.add(roomId);
      return next;
    });
  }, []);

  const getPosState = useCallback((posId: string): PosState => {
    return posStates[posId] || { status: "none", photoCount: 0, note: "" };
  }, [posStates]);

  const togglePosStatus = useCallback((posId: string, newStatus: PosCheckStatus) => {
    if (finalized) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPosStates((prev) => {
      const current = prev[posId] || { status: "none", photoCount: 0, note: "" };
      return { ...prev, [posId]: { ...current, status: current.status === newStatus ? "none" : newStatus } };
    });
  }, [finalized]);

  const addPhoto = useCallback(async (posId: string, roomId: string, roomName: string, posTitle: string) => {
    if (finalized) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await captureAndUploadPhoto({
      projectId,
      inspectionType: (type as "erstbegehung" | "zwischenbegehung" | "abnahme") || "erstbegehung",
      sectionId: roomId,
      positionId: posId,
      roomName,
      positionTitle: posTitle,
      isOnline,
      queueOfflineUpload: ({ label: queueLabel, detail, data }) => {
        addToSyncQueue({ type: "photo", label: queueLabel, detail, data });
      },
    });
    if (result) {
      setPosStates((prev) => {
        const current = prev[posId] || { status: "none", photoCount: 0, note: "" };
        return { ...prev, [posId]: { ...current, photoCount: current.photoCount + 1 } };
      });
      if (result.queued && Platform.OS === "web") {
        window.alert("Foto offline gespeichert. Upload folgt automatisch.");
      }
    }
  }, [finalized, projectId, type, isOnline, addToSyncQueue]);

  const openCatalogModal = useCallback((roomId: string) => {
    if (finalized) return;
    setCatalogModalRoom(roomId);
    setCatalogStep("pick");
    setCatalogSearch("");
    setFreeTitle(""); setFreeDesc(""); setFreeQty("1"); setFreeUnit("Stk"); setFreePrice(""); setFreeTrade("");
  }, [finalized]);

  const closeCatalogModal = useCallback(() => { setCatalogModalRoom(null); }, []);

  const addFromCatalog = useCallback((entry: CatalogEntry) => {
    if (!catalogModalRoom) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const item: MehrleistungItem = { id: genId(), title: entry.title, desc: entry.desc, qty: 1, unit: entry.unit, price: entry.price, trade: entry.trade, fromCatalog: true };
    setMehrleistungen((prev) => ({ ...prev, [catalogModalRoom]: [...(prev[catalogModalRoom] || []), item] }));
    closeCatalogModal();
  }, [catalogModalRoom, closeCatalogModal]);

  const addFreeEntry = useCallback(() => {
    if (!catalogModalRoom || !freeTitle.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const item: MehrleistungItem = { id: genId(), title: freeTitle.trim(), desc: freeDesc.trim(), qty: parseFloat(freeQty) || 1, unit: freeUnit || "Stk", price: parseFloat(freePrice.replace(",", ".")) || 0, trade: freeTrade.trim() || "Allg.", fromCatalog: false };
    setMehrleistungen((prev) => ({ ...prev, [catalogModalRoom]: [...(prev[catalogModalRoom] || []), item] }));
    closeCatalogModal();
  }, [catalogModalRoom, freeTitle, freeDesc, freeQty, freeUnit, freePrice, freeTrade, closeCatalogModal]);

  const removeMehrleistung = useCallback((roomId: string, itemId: string) => {
    if (finalized) return;
    setMehrleistungen((prev) => ({ ...prev, [roomId]: (prev[roomId] || []).filter((m) => m.id !== itemId) }));
  }, [finalized]);

  const handleFinalize = useCallback(async () => {
    setFinalizing(true);
    try {
      // 1. Create inspection_protocol
      const totalItems = rooms.reduce((sum, r) => sum + r.positions.length, 0);
      const completedItems = rooms.reduce((sum, r) => sum + r.positions.filter((p) => (posStates[p.id]?.status || "none") !== "none").length, 0);
      const itemsWithIssues = rooms.reduce((sum, r) => sum + r.positions.filter((p) => posStates[p.id]?.status === "rejected").length, 0);

      const protocol = await createInspectionProtocol({
        projectId,
        protocolType: (type || "erstbegehung") as "erstbegehung",
        totalItems,
        completedItems,
        itemsWithIssues,
        offerId: resolvedOfferId,
        catalogLabel,
      });

      let sortOrder = 0;
      const items: Record<string, unknown>[] = [];
      const positionUpdates: { positionId: string; data: Record<string, unknown> }[] = [];
      rooms.forEach((room) => {
        room.positions.forEach((pos) => {
          const ps = posStates[pos.id] || { status: "none", photoCount: 0, note: "" };
          items.push({
            offer_position_id: pos.id,
            sort_order: sortOrder++,
            status: ps.status === "confirmed" ? "ja" : ps.status === "rejected" ? "nein" : "offen",
            notes: ps.note || null,
            has_defect: ps.status === "rejected",
            is_additional: false,
          });

          positionUpdates.push({
            positionId: pos.id,
            data: {
              phase: ps.status === "confirmed" ? "zwischenbegehung" : "erstbegehung",
              inspection_status:
                ps.status === "confirmed"
                  ? "confirmed"
                  : ps.status === "rejected"
                    ? "pending_correction"
                    : "pending",
              last_inspection_id: protocol.id,
              updated_at: new Date().toISOString(),
            },
          });
        });
        (mehrleistungen[room.id] || []).forEach((ml) => {
          items.push({
            sort_order: sortOrder++,
            status: "ja",
            is_additional: true,
            catalog_position_nr: ml.fromCatalog ? "ML" : null,
            notes: `${ml.title}: ${ml.desc} (${ml.qty} ${ml.unit} × ${ml.price})`,
          });
        });
      });
      await insertInspectionProtocolItems(protocol.id, items as any[]);
      await updateOfferPositions(positionUpdates);

      // Save planned dates (use editStart/editEnd which are current in the modal)
      if (editStart || editEnd) {
        await supabase.from("projects").update({
          planned_start: editStart || null,
          planned_end: editEnd || null,
        }).eq("id", projectId);
      }

      await updateProjectInspectionState(projectId, { status: "IN_PROGRESS" });
      await emitInspectionCompletedEvent({
        projectId,
        protocolId: protocol.id,
        protocolType: "erstbegehung",
        protocolNumber: protocol.protocol_number,
        payload: { completed_items: completedItems, items_with_issues: itemsWithIssues },
      });

      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFinalized(true);
      setShowFinalizeConfirm(false);
    } catch (err: any) {
      Alert.alert("Fehler", "Festschreiben fehlgeschlagen: " + (err.message || "Unbekannter Fehler"));
    } finally {
      setFinalizing(false);
    }
  }, [rooms, posStates, mehrleistungen, type, projectId, editStart, editEnd, resolvedOfferId, catalogLabel]);

  const filteredCatalogEntries = useMemo(() => {
    const catalog = CATALOGS[selectedCatalog];
    if (!catalog) return [];
    if (!catalogSearch.trim()) return catalog.entries;
    const q = catalogSearch.toLowerCase();
    return catalog.entries.filter((e) => e.title.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q) || e.trade.toLowerCase().includes(q));
  }, [selectedCatalog, catalogSearch]);

  const summary = useMemo(() => {
    let total = 0, confirmed = 0, rejected = 0, unchecked = 0;
    rooms.forEach((room) => {
      room.positions.forEach((pos) => {
        total++;
        const st = posStates[pos.id]?.status || "none";
        if (st === "confirmed") confirmed++; else if (st === "rejected") rejected++; else unchecked++;
      });
    });
    return { total, confirmed, rejected, unchecked };
  }, [rooms, posStates]);

  if (loadingData) {
    return (
      <View style={s.container}>
        <View style={[s.header, { paddingTop: topInset + 8 }]}>
          <Pressable onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)"); }} style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}><Ionicons name="arrow-back" size={24} color={Colors.raw.white} /></Pressable>
          <View style={s.headerCenter}><Text style={s.headerCode}>{projectInfo?.projectNumber || "..."}</Text><Text style={s.headerTitle}>{label}</Text></View>
        </View>
        <View style={s.loadingWrap}><ActivityIndicator size="small" color={Colors.raw.amber500} /><Text style={s.loadingText}>Positionen laden...</Text></View>
      </View>
    );
  }

  if (loadError || rooms.length === 0) {
    return (
      <View style={s.container}>
        <View style={[s.header, { paddingTop: topInset + 8 }]}>
          <Pressable onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)"); }} style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}><Ionicons name="arrow-back" size={24} color={Colors.raw.white} /></Pressable>
          <View style={s.headerCenter}><Text style={s.headerCode}>{projectInfo?.projectNumber || "..."}</Text><Text style={s.headerTitle}>{label}</Text></View>
        </View>
        <View style={s.loadingWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.raw.zinc600} />
          <Text style={s.loadingText}>{loadError || "Kein Angebot mit Positionen gefunden"}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)"); }} style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]} testID="back-button">
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerCode}>{projectInfo?.projectNumber || "..."}</Text>
          <Text style={s.headerTitle}>{label}</Text>
          <Text style={s.headerAddress}>{projectInfo?.address || ""}</Text>
        </View>
      </View>

      <View style={s.summaryBar}>
        <View style={s.summaryItem}><Ionicons name="checkmark-circle" size={16} color={Colors.raw.emerald500} /><Text style={[s.summaryCount, { color: Colors.raw.emerald500 }]}>{summary.confirmed}</Text></View>
        <View style={s.summaryItem}><Ionicons name="close-circle" size={16} color={Colors.raw.rose500} /><Text style={[s.summaryCount, { color: Colors.raw.rose500 }]}>{summary.rejected}</Text></View>
        <View style={s.summaryItem}><Ionicons name="radio-button-off" size={16} color={Colors.raw.zinc600} /><Text style={[s.summaryCount, { color: Colors.raw.zinc500 }]}>{summary.unchecked}</Text></View>
        <View style={s.summaryDivider} />
        <Text style={s.summaryTotal}>{summary.confirmed + summary.rejected}/{summary.total}</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: bottomInset + 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {rooms.map((room) => {
          const isExpanded = expandedRooms.has(room.id);
          const roomMehr = mehrleistungen[room.id] || [];
          const roomConfirmed = room.positions.filter((p) => (posStates[p.id]?.status || "none") === "confirmed").length;
          const roomRejected = room.positions.filter((p) => (posStates[p.id]?.status || "none") === "rejected").length;
          const roomDone = roomConfirmed + roomRejected;

          return (
            <View key={room.id} style={s.roomCard} testID={`room-${room.id}`}>
              <Pressable style={s.roomHeader} onPress={() => toggleRoom(room.id)}>
                <View style={s.roomIconWrap}><Ionicons name={room.icon as any} size={18} color={Colors.raw.amber500} /></View>
                <View style={s.roomInfo}>
                  <Text style={s.roomName}>{room.name}</Text>
                  <Text style={s.roomMeta}>{roomDone}/{room.positions.length} gepr{"\u00FC"}ft{roomMehr.length > 0 ? ` \u00B7 ${roomMehr.length} Mehrleistung${roomMehr.length > 1 ? "en" : ""}` : ""}</Text>
                </View>
                <View style={s.roomProgress}>
                  {roomConfirmed > 0 && <View style={[s.roomDot, { backgroundColor: Colors.raw.emerald500 }]}><Text style={s.roomDotText}>{roomConfirmed}</Text></View>}
                  {roomRejected > 0 && <View style={[s.roomDot, { backgroundColor: Colors.raw.rose500 }]}><Text style={s.roomDotText}>{roomRejected}</Text></View>}
                </View>
                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color={Colors.raw.zinc500} />
              </Pressable>

              {isExpanded && (
                <View style={s.roomBody}>
                  {room.positions.map((pos) => {
                    const ps = getPosState(pos.id);
                    const hasMaterial = !!materialAssignments[pos.id];
                    const hasTeam = !!teamAssignments[pos.id];
                    const isConfirmed = ps.status === "confirmed";
                    const isRejected = ps.status === "rejected";
                    // Farb-Status: grün = bestätigt + Material + Team, amber = bestätigt (eins fehlt), default = keine Aktion
                    const posRowBg = isConfirmed && hasMaterial && hasTeam
                      ? Colors.raw.emerald500 + "12"
                      : isConfirmed
                        ? Colors.raw.amber500 + "12"
                        : isRejected
                          ? Colors.raw.rose500 + "08"
                          : "transparent";
                    const posBorderColor = isConfirmed && hasMaterial && hasTeam
                      ? Colors.raw.emerald500 + "30"
                      : isConfirmed
                        ? Colors.raw.amber500 + "30"
                        : Colors.raw.zinc800 + "60";

                    return (
                      <View key={pos.id} testID={`pos-${pos.id}`} style={[s.posRow, { backgroundColor: posRowBg, borderBottomColor: posBorderColor }]}>
                        <View style={s.posActions}>
                          <Pressable onPress={() => togglePosStatus(pos.id, "confirmed")} style={({ pressed }) => [s.posActionBtn, isConfirmed && s.posActionConfirmed, { opacity: pressed ? 0.7 : 1 }]} testID={`confirm-${pos.id}`}>
                            <Ionicons name="checkmark" size={18} color={isConfirmed ? Colors.raw.white : Colors.raw.zinc600} />
                          </Pressable>
                          <Pressable onPress={() => togglePosStatus(pos.id, "rejected")} style={({ pressed }) => [s.posActionBtn, isRejected && s.posActionRejected, { opacity: pressed ? 0.7 : 1 }]} testID={`reject-${pos.id}`}>
                            <Ionicons name="close" size={18} color={isRejected ? Colors.raw.white : Colors.raw.zinc600} />
                          </Pressable>
                        </View>
                        <View style={s.posBody}>
                          <View style={s.posTitleRow}><Text style={s.posNr}>{pos.nr}</Text><Text style={[s.posTitle, isRejected && s.posTitleRejected]} numberOfLines={1}>{pos.title}</Text></View>
                          <Text style={s.posDesc} numberOfLines={2}>{pos.desc}</Text>
                          <View style={s.posMetaRow}>
                            <Text style={s.posMeta}>{pos.qty} {pos.unit}</Text><View style={s.posDot} /><Text style={s.posMeta}>{formatEuro(pos.price)}/{pos.unit}</Text><View style={s.posDot} />
                            <View style={s.posTradeBadge}><Text style={s.posTradeText}>{pos.trade}</Text></View>
                          </View>
                          {/* Material Badge */}
                          {!finalized && (
                            <PulsingMaterialBadge
                              onPress={() => openMaterialModal(pos)}
                              assigned={materialAssignments[pos.id] || null}
                            />
                          )}
                          {/* Team Badge */}
                          {!finalized && (
                            <PulsingTeamBadge
                              onPress={() => openTeamModal(pos)}
                              assigned={teamAssignments[pos.id] || null}
                            />
                          )}
                        </View>
                        <Pressable onPress={() => addPhoto(pos.id, room.id, room.name, pos.title)} style={({ pressed }) => [s.posPhotoBtn, { opacity: pressed ? 0.7 : 1 }]} testID={`photo-${pos.id}`}>
                          <Ionicons name="camera" size={18} color={Colors.raw.zinc500} />
                          {ps.photoCount > 0 && <View style={s.photoBadge}><Text style={s.photoBadgeText}>{ps.photoCount}</Text></View>}
                        </Pressable>
                      </View>
                    );
                  })}
                  {roomMehr.length > 0 && (
                    <View style={s.mehrSection}>
                      <Text style={s.mehrLabel}>Mehrleistungen</Text>
                      {roomMehr.map((ml) => (
                        <View key={ml.id} style={s.mehrRow}>
                          <View style={s.mehrIconWrap}><Ionicons name="add-circle" size={16} color={Colors.raw.amber500} /></View>
                          <View style={s.mehrBody}><Text style={s.mehrTitle}>{ml.title}</Text><Text style={s.mehrMeta}>{ml.qty} {ml.unit} {"\u00B7"} {formatEuro(ml.price)}/{ml.unit} {"\u00B7"} {ml.trade}{ml.fromCatalog ? "" : " \u00B7 Freitext"}</Text></View>
                          <Pressable onPress={() => removeMehrleistung(room.id, ml.id)} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: 4 })}><Ionicons name="trash-outline" size={16} color={Colors.raw.zinc600} /></Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                  {!finalized && (
                    <Pressable style={({ pressed }) => [s.addMehrBtn, { opacity: pressed ? 0.7 : 1 }]} onPress={() => openCatalogModal(room.id)} testID={`add-mehr-${room.id}`}>
                      <Ionicons name="add" size={18} color={Colors.raw.amber500} /><Text style={s.addMehrText}>Mehrleistung hinzuf{"\u00FC"}gen</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {finalized ? (
          <View style={s.finalizedBanner}><Ionicons name="lock-closed" size={20} color={Colors.raw.emerald500} /><View style={s.finalizedBannerText}><Text style={s.finalizedTitle}>Festgeschrieben</Text><Text style={s.finalizedDesc}>Die Leistungen wurden erfasst und k{"\u00F6"}nnen nicht mehr ge{"\u00E4"}ndert werden.</Text></View></View>
        ) : (
          <Pressable style={({ pressed }) => [s.finalizeBtn, { opacity: pressed ? 0.85 : 1 }]} onPress={() => { setEditStart(plannedStart); setEditEnd(plannedEnd); setShowFinalizeConfirm(true); }} testID="finalize-button">
            <Ionicons name="lock-closed" size={18} color={Colors.raw.zinc950} /><Text style={s.finalizeBtnText}>Leistungen festschreiben</Text>
          </Pressable>
        )}
      </ScrollView>

      <CatalogModal
        visible={catalogModalRoom !== null}
        step={catalogStep}
        selectedCatalog={selectedCatalog}
        catalogSearch={catalogSearch}
        filteredEntries={filteredCatalogEntries}
        freeTitle={freeTitle} freeDesc={freeDesc} freeQty={freeQty} freeUnit={freeUnit} freePrice={freePrice} freeTrade={freeTrade}
        onClose={closeCatalogModal}
        onSetStep={setCatalogStep}
        onSelectCatalog={(key) => { setSelectedCatalog(key); setCatalogStep("browse"); setCatalogSearch(""); }}
        onSearchChange={setCatalogSearch}
        onAddFromCatalog={addFromCatalog}
        onAddFree={addFreeEntry}
        onSetFreeTitle={setFreeTitle} onSetFreeDesc={setFreeDesc} onSetFreeQty={setFreeQty} onSetFreeUnit={setFreeUnit} onSetFreePrice={setFreePrice} onSetFreeTrade={setFreeTrade}
        bottomInset={bottomInset}
      />

      <Modal visible={showFinalizeConfirm} transparent animationType="fade" onRequestClose={() => setShowFinalizeConfirm(false)}>
        <View style={s.confirmOverlay}>
          <View style={s.confirmCard}>
            <View style={s.confirmIconWrap}><Ionicons name="lock-closed" size={28} color={Colors.raw.amber500} /></View>
            <Text style={s.confirmTitle}>Leistungen festschreiben?</Text>
            <Text style={s.confirmDesc}>{summary.confirmed} best{"\u00E4"}tigt {"\u00B7"} {summary.rejected} abgelehnt {"\u00B7"} {summary.unchecked} offen</Text>

            {/* Datum-Eingabe */}
            <View style={s.dateSection}>
              <Text style={s.dateSectionTitle}>Bauphase Zeitraum</Text>
              <Text style={s.dateSectionHint}>Pflichtfeld f{"\u00FC"}r die Autoplanung</Text>
              <View style={s.dateRow}>
                <View style={s.dateCol}>
                  <Text style={s.dateLbl}>Start</Text>
                  <TextInput
                    style={s.dateInp}
                    value={editStart}
                    onChangeText={setEditStart}
                    placeholder="2026-04-01"
                    placeholderTextColor={Colors.raw.zinc600}
                  />
                </View>
                <View style={s.dateCol}>
                  <Text style={s.dateLbl}>Ende</Text>
                  <TextInput
                    style={s.dateInp}
                    value={editEnd}
                    onChangeText={setEditEnd}
                    placeholder="2026-04-15"
                    placeholderTextColor={Colors.raw.zinc600}
                  />
                </View>
              </View>
            </View>

            {!editStart || !editEnd ? (
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.rose500, textAlign: "center", marginTop: 8 }}>
                Bitte beide Daten eintragen um festzuschreiben
              </Text>
            ) : null}

            <View style={[s.confirmBtns, { marginTop: 16 }]}>
              <Pressable style={({ pressed }) => [s.confirmCancelBtn, { opacity: pressed ? 0.7 : 1 }]} onPress={() => setShowFinalizeConfirm(false)}><Text style={s.confirmCancelText}>Abbrechen</Text></Pressable>
              <Pressable
                style={({ pressed }) => [s.confirmSubmitBtn, (!editStart || !editEnd) && { backgroundColor: Colors.raw.zinc700 }, { opacity: pressed && editStart && editEnd ? 0.85 : 1 }]}
                onPress={() => {
                  if (!editStart || !editEnd) return;
                  setPlannedStart(editStart);
                  setPlannedEnd(editEnd);
                  handleFinalize();
                }}
                disabled={finalizing || !editStart || !editEnd}
                testID="confirm-finalize"
              >
                {finalizing ? <ActivityIndicator size="small" color={Colors.raw.zinc950} /> : <Text style={[s.confirmSubmitText, (!editStart || !editEnd) && { color: Colors.raw.zinc500 }]}>Festschreiben</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Material-Zuordnung Modal ─── */}
      <Modal visible={!!materialModalPos} transparent animationType="slide" onRequestClose={closeMaterialModal}>
        <View style={ms.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={closeMaterialModal} />
          <View style={ms.modalSheet}>
            <View style={ms.modalHandle} />

            {materialModalPos && (
              <>
                {/* Position-Info */}
                <View style={ms.modalHeader}>
                  <Text style={ms.modalPosNr}>Position {materialModalPos.nr}</Text>
                  <Text style={ms.modalPosTitle}>{materialModalPos.title}</Text>
                  <Text style={ms.modalPosMeta}>
                    {materialModalPos.qty} {materialModalPos.unit} {"\u00B7"} {formatEuro(materialModalPos.price)}/{materialModalPos.unit} {"\u00B7"} {materialModalPos.trade}
                  </Text>
                </View>

                {/* NU besorgt Material — Quick Button */}
                {teamAssignments[materialModalPos.id]?.type === "fremd" && (
                  <Pressable
                    onPress={handleNuBesorgtMaterial}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      marginHorizontal: 20,
                      marginTop: 16,
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      backgroundColor: Colors.raw.blue500 + "15",
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: Colors.raw.blue500 + "40",
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Ionicons name="business" size={20} color={Colors.raw.blue500} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.blue500 }}>NU BESORGT MATERIAL</Text>
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc400, marginTop: 2 }}>{teamAssignments[materialModalPos.id]?.name} beschafft selbst</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={22} color={Colors.raw.blue500} />
                  </Pressable>
                )}

                {/* Suchfeld */}
                <View style={ms.modalSearchRow}>
                  <Ionicons name="search" size={18} color={Colors.raw.zinc500} />
                  <TextInput
                    style={ms.modalSearchInput}
                    placeholder="Material suchen..."
                    placeholderTextColor={Colors.raw.zinc600}
                    value={materialSearch}
                    onChangeText={setMaterialSearch}
                    autoCapitalize="none"
                    autoFocus
                  />
                  {materialSearch.length > 0 && (
                    <Pressable onPress={() => setMaterialSearch("")}>
                      <Ionicons name="close-circle" size={18} color={Colors.raw.zinc500} />
                    </Pressable>
                  )}
                </View>

                {!materialSearch && (
                  <Text style={ms.modalTradeHint}>
                    Vorschl{"\u00E4"}ge f{"\u00FC"}r {materialModalPos.trade}
                  </Text>
                )}

                {/* Produktliste */}
                <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {materialLoading ? (
                    <View style={ms.modalLoading}>
                      <ActivityIndicator size="large" color={Colors.raw.amber500} />
                    </View>
                  ) : materialProducts.length === 0 ? (
                    <View style={ms.modalEmpty}>
                      <Ionicons name="search-outline" size={32} color={Colors.raw.zinc700} />
                      <Text style={ms.modalEmptyText}>Keine Produkte gefunden</Text>
                    </View>
                  ) : (
                    materialProducts.map((product) => (
                      <Pressable
                        key={product.id}
                        onPress={() => handleSelectMaterialProduct(product)}
                        style={({ pressed }) => [ms.modalProductRow, { opacity: pressed ? 0.85 : 1 }]}
                        disabled={materialAssigning}
                      >
                        <View style={ms.modalProductInfo}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            {product.favorite && <Ionicons name="star" size={14} color={Colors.raw.amber500} />}
                            <Text style={ms.modalProductName} numberOfLines={1}>{product.name}</Text>
                          </View>
                          <Text style={ms.modalProductMeta}>
                            {product.supplier} {"\u00B7"} {product.useCount}x verwendet
                          </Text>
                        </View>
                        <Text style={ms.modalProductPrice}>{"\u20AC"}{product.price}</Text>
                        <View style={ms.modalSelectBtn}>
                          <Text style={ms.modalSelectText}>W{"\u00C4"}HLEN</Text>
                        </View>
                      </Pressable>
                    ))
                  )}

                  {materialAssigning && (
                    <View style={ms.modalLoading}>
                      <ActivityIndicator size="small" color={Colors.raw.amber500} />
                      <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc400, marginTop: 8 }}>Wird zugeordnet...</Text>
                    </View>
                  )}

                  <View style={{ height: 40 }} />
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Duplikat-Dialog */}
      <Modal visible={showDuplicateDialog} transparent animationType="fade" onRequestClose={() => setShowDuplicateDialog(false)}>
        <View style={ms.dupeOverlay}>
          <View style={ms.dupeCard}>
            <Ionicons name="copy-outline" size={28} color={Colors.raw.amber500} style={{ alignSelf: "center", marginBottom: 12 }} />
            <Text style={ms.dupeTitle}>Position kommt {duplicateInfo.count}x vor</Text>
            <Text style={ms.dupeDesc}>
              {materialModalPos?.nr ? `"${materialModalPos.nr}"` : "Diese Position"} kommt {duplicateInfo.count}x in diesem Angebot vor.{"\n"}
              {pendingProduct?.name} auch f{"\u00FC"}r die anderen {"\u00FC"}bernehmen?
            </Text>
            <Text style={ms.dupeHint}>
              Gleiche Position kann unterschiedliches Material brauchen (z.B. UP vs. AP)
            </Text>
            <View style={ms.dupeBtns}>
              <Pressable
                onPress={() => handleDuplicateChoice(false)}
                style={({ pressed }) => [ms.dupeBtn, ms.dupeBtnSecondary, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={ms.dupeBtnSecondaryText}>Nur diese</Text>
              </Pressable>
              <Pressable
                onPress={() => handleDuplicateChoice(true)}
                style={({ pressed }) => [ms.dupeBtn, ms.dupeBtnPrimary, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={ms.dupeBtnPrimaryText}>Alle {duplicateInfo.count}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Team-Zuordnung Modal ─── */}
      <Modal visible={!!teamModalPos} transparent animationType="slide" onRequestClose={closeTeamModal}>
        <View style={teamS.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={closeTeamModal} />
          <View style={teamS.modalSheet}>
            <View style={teamS.modalHandle} />
            {teamModalPos && (
              <>
                <View style={teamS.modalHeader}>
                  <Text style={teamS.modalPosNr}>Position {teamModalPos.nr}</Text>
                  <Text style={teamS.modalPosTitle}>{teamModalPos.title}</Text>
                  <Text style={teamS.modalPosMeta}>
                    {teamModalPos.qty} {teamModalPos.unit} {"\u00B7"} {formatEuro(teamModalPos.price)}/{teamModalPos.unit} {"\u00B7"} {teamModalPos.trade}
                  </Text>
                </View>

                <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {teamLoading ? (
                    <View style={teamS.modalLoading}>
                      <ActivityIndicator size="large" color={Colors.raw.blue500} />
                    </View>
                  ) : (
                    <>
                      {/* EIGENLEISTUNG */}
                      <View style={teamS.sectionHeader}>
                        <Ionicons name="flash" size={16} color={Colors.raw.amber500} />
                        <Text style={teamS.sectionHeaderText}>EIGENLEISTUNG</Text>
                      </View>
                      {teamMembers.length === 0 ? (
                        <View style={teamS.modalEmpty}>
                          <Text style={teamS.modalEmptyText}>Keine Monteure f{"\u00FC"}r {teamModalPos.trade}</Text>
                        </View>
                      ) : (
                        teamMembers.map((member) => (
                          <Pressable
                            key={member.id}
                            onPress={() => handleSelectTeamMember(member)}
                            style={({ pressed }) => [teamS.memberRow, { opacity: pressed ? 0.85 : 1 }]}
                            disabled={teamAssigning}
                          >
                            <View style={teamS.memberAvatar}>
                              <Ionicons name="person" size={18} color={Colors.raw.blue500} />
                            </View>
                            <View style={teamS.memberInfo}>
                              <Text style={teamS.memberName}>{member.name}</Text>
                              <Text style={teamS.memberRole}>{member.role}{member.gewerk ? ` \u00B7 ${member.gewerk}` : ""}</Text>
                            </View>
                            <View style={teamS.memberSelectBtn}>
                              <Ionicons name="arrow-forward" size={14} color={Colors.raw.white} />
                            </View>
                          </Pressable>
                        ))
                      )}

                      {/* Divider */}
                      <View style={teamS.dividerRow}>
                        <View style={teamS.dividerLine} />
                        <Text style={teamS.dividerText}>oder</Text>
                        <View style={teamS.dividerLine} />
                      </View>

                      {/* NACHUNTERNEHMER */}
                      <View style={teamS.sectionHeader}>
                        <Ionicons name="business" size={16} color={Colors.raw.amber500} />
                        <Text style={teamS.sectionHeaderText}>NACHUNTERNEHMER</Text>
                      </View>
                      {teamSubcontractors.length === 0 ? (
                        <View style={teamS.modalEmpty}>
                          <Text style={teamS.modalEmptyText}>Keine NUs f{"\u00FC"}r {teamModalPos.trade}</Text>
                        </View>
                      ) : (
                        teamSubcontractors.map((sub) => (
                          <Pressable
                            key={sub.id}
                            onPress={() => handleSelectSubcontractor(sub)}
                            style={({ pressed }) => [teamS.memberRow, { opacity: pressed ? 0.85 : 1 }]}
                            disabled={teamAssigning}
                          >
                            <View style={[teamS.memberAvatar, { backgroundColor: Colors.raw.amber500 + "20" }]}>
                              <Ionicons name="business" size={18} color={Colors.raw.amber500} />
                            </View>
                            <View style={teamS.memberInfo}>
                              <Text style={teamS.memberName}>{sub.short_name || sub.name}</Text>
                              <Text style={teamS.memberRole}>{sub.contact_person ? `${sub.contact_person} \u00B7 ` : ""}{sub.name}</Text>
                            </View>
                            <View style={[teamS.memberSelectBtn, { backgroundColor: Colors.raw.amber500 }]}>
                              <Ionicons name="arrow-forward" size={14} color={Colors.raw.zinc950} />
                            </View>
                          </Pressable>
                        ))
                      )}

                      {teamAssigning && (
                        <View style={teamS.modalLoading}>
                          <ActivityIndicator size="small" color={Colors.raw.blue500} />
                          <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc400, marginTop: 8 }}>Wird zugewiesen...</Text>
                        </View>
                      )}

                      <View style={{ height: 40 }} />
                    </>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Team-Duplikat-Dialog */}
      <Modal visible={showTeamDuplicateDialog} transparent animationType="fade" onRequestClose={() => setShowTeamDuplicateDialog(false)}>
        <View style={ms.dupeOverlay}>
          <View style={ms.dupeCard}>
            <Ionicons name="people" size={28} color={Colors.raw.blue500} style={{ alignSelf: "center", marginBottom: 12 }} />
            <Text style={ms.dupeTitle}>Position kommt {teamDuplicateInfo.count}x vor</Text>
            <Text style={ms.dupeDesc}>
              {teamModalPos?.nr ? `"${teamModalPos.nr}"` : "Diese Position"} kommt {teamDuplicateInfo.count}x in diesem Angebot vor.{"\n"}
              {pendingTeamChoice?.name} auch f{"\u00FC"}r die anderen {"\u00FC"}bernehmen?
            </Text>
            <View style={ms.dupeBtns}>
              <Pressable
                onPress={() => handleTeamDuplicateChoice(false)}
                style={({ pressed }) => [ms.dupeBtn, ms.dupeBtnSecondary, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={ms.dupeBtnSecondaryText}>Nur diese</Text>
              </Pressable>
              <Pressable
                onPress={() => handleTeamDuplicateChoice(true)}
                style={({ pressed }) => [ms.dupeBtn, ms.dupeBtnPrimary, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={ms.dupeBtnPrimaryText}>Alle {teamDuplicateInfo.count}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ZwischenbegehungView({ projectId, protocolId, offerId }: { projectId: string; protocolId?: string; offerId?: string }) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  // --- React Query: initial data fetching ---
  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: queryKeys.begehung.rooms(projectId, offerId),
    queryFn: () => fetchRoomsForProject(projectId, offerId),
    enabled: !!projectId,
  });
  const { data: projectInfo = null, isLoading: projectInfoLoading } = useQuery({
    queryKey: queryKeys.begehung.projectInfo(projectId),
    queryFn: () => fetchProjectInfo(projectId),
    enabled: !!projectId,
  });
  const loadingRooms = roomsLoading || projectInfoLoading;

  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [zbStates, setZbStates] = useState<Record<string, ZBPosState>>({});
  const [finalized, setFinalized] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [loadingPrevious, setLoadingPrevious] = useState(true);
  const [previousBegehungDate, setPreviousBegehungDate] = useState<string | null>(null);
  const { isOnline, addToSyncQueue } = useOffline();

  // Expand all rooms once loaded
  useEffect(() => {
    if (rooms.length > 0) {
      setExpandedRooms(new Set(rooms.map((r) => r.id)));
    }
  }, [rooms]);

  // Load saved protocol data if viewing a finalized inspection
  useEffect(() => {
    if (loadingRooms || !protocolId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: items } = await supabase
          .from("inspection_protocol_items")
          .select("offer_position_id, status, progress_percent, notes")
          .eq("protocol_id", protocolId);
        if (!cancelled && items) {
          const restored: Record<string, ZBPosState> = {};
          for (const item of items) {
            if (!item.offer_position_id) continue;
            const prog = (item.progress_percent ?? 0) as ZBProgress;
            restored[item.offer_position_id] = {
              workStatus: prog === 100 ? "in_arbeit" : prog > 0 ? "in_arbeit" : "nicht_gestartet",
              progress: ([0, 25, 50, 75, 100].includes(prog) ? prog : 0) as ZBProgress,
              photoCount: 0,
            };
          }
          setZbStates(restored);
          setFinalized(true);
          setLoadingPrevious(false);
        }
      } catch (_e) {}
    })();
    return () => { cancelled = true; };
  }, [loadingRooms, protocolId]);

  // Load previous begehung (depends on projectInfo)
  useEffect(() => {
    if (loadingRooms || !projectInfo) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchLatestInspectionProtocol(projectId, "zwischenbegehung");
        if (cancelled || !data || !data.items) { setLoadingPrevious(false); return; }
        const restored: Record<string, ZBPosState> = {};
        for (const pos of data.items) {
          if (!pos.position_id) continue;
          const prog = ([0, 25, 50, 75, 100].includes(Number(pos.progress_percent)) ? Number(pos.progress_percent) : 0) as ZBProgress;
          const ws = prog > 0 ? "in_arbeit" : "nicht_gestartet";
          restored[pos.position_id] = { workStatus: ws, progress: prog, photoCount: 0 };
        }
        if (!cancelled) {
          setZbStates(restored);
          if (data.finalized_at) {
            const d = new Date(data.finalized_at);
            setPreviousBegehungDate(d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }));
          }
        }
      } catch (_e) {}
      if (!cancelled) setLoadingPrevious(false);
    })();
    return () => { cancelled = true; };
  }, [loadingRooms, projectId, projectInfo]);

  const toggleRoom = useCallback((roomId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId); else next.add(roomId);
      return next;
    });
  }, []);

  const getZbState = useCallback((posId: string): ZBPosState => {
    return zbStates[posId] || { workStatus: "nicht_gestartet", progress: 0, photoCount: 0 };
  }, [zbStates]);

  const setWorkStatus = useCallback((posId: string, ws: ZBWorkStatus) => {
    if (finalized) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setZbStates((prev) => {
      const current = prev[posId] || { workStatus: "nicht_gestartet", progress: 0, photoCount: 0 };
      const newWs = current.workStatus === ws ? "nicht_gestartet" : ws;
      return { ...prev, [posId]: { ...current, workStatus: newWs, progress: newWs === "nicht_gestartet" ? 0 : current.progress } };
    });
  }, [finalized]);

  const setProgress = useCallback((posId: string, pct: ZBProgress) => {
    if (finalized) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setZbStates((prev) => {
      const current = prev[posId] || { workStatus: "nicht_gestartet", progress: 0, photoCount: 0 };
      return { ...prev, [posId]: { ...current, progress: pct, workStatus: pct > 0 ? "in_arbeit" : current.workStatus } };
    });
  }, [finalized]);

  const addPhoto = useCallback(async (posId: string, roomId: string, roomName: string, posTitle: string) => {
    if (finalized) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await captureAndUploadPhoto({
      projectId,
      inspectionType: "zwischenbegehung",
      sectionId: roomId,
      positionId: posId,
      roomName,
      positionTitle: posTitle,
      isOnline,
      queueOfflineUpload: ({ label: queueLabel, detail, data }) => {
        addToSyncQueue({ type: "photo", label: queueLabel, detail, data });
      },
    });
    if (result) {
      setZbStates((prev) => {
        const current = prev[posId] || { workStatus: "nicht_gestartet", progress: 0, photoCount: 0 };
        return { ...prev, [posId]: { ...current, photoCount: current.photoCount + 1 } };
      });
      if (result.queued && Platform.OS === "web") {
        window.alert("Foto offline gespeichert. Upload folgt automatisch.");
      }
    }
  }, [finalized, projectId, isOnline, addToSyncQueue]);

  const overallProgress = useMemo(() => {
    let totalPositions = 0;
    let sumProgress = 0;
    rooms.forEach((room) => {
      room.positions.forEach((pos) => {
        totalPositions++;
        sumProgress += (zbStates[pos.id]?.progress || 0);
      });
    });
    return totalPositions > 0 ? Math.round(sumProgress / totalPositions) : 0;
  }, [rooms, zbStates]);

  const handleFinalize = useCallback(async () => {
    setFinalizing(true);
    try {
      const totalItems = rooms.reduce((sum, r) => sum + r.positions.length, 0);
      const completedItems = rooms.reduce((sum, r) => sum + r.positions.filter((p) => (zbStates[p.id]?.progress || 0) > 0).length, 0);

      const protocol = await createInspectionProtocol({
        projectId,
        protocolType: "zwischenbegehung",
        totalItems,
        completedItems,
      });

      let sortOrder = 0;
      const items: Record<string, unknown>[] = [];
      const positionUpdates: { positionId: string; data: Record<string, unknown> }[] = [];
      rooms.forEach((room) => {
        room.positions.forEach((pos) => {
          const zs = zbStates[pos.id] || { workStatus: "nicht_gestartet", progress: 0, photoCount: 0 };
          items.push({
            offer_position_id: pos.id,
            sort_order: sortOrder++,
            status: zs.progress === 100 ? "ja" : zs.progress > 0 ? "teilweise" : "offen",
            progress_percent: zs.progress,
            notes: null,
            is_additional: false,
          });

          positionUpdates.push({
            positionId: pos.id,
            data: {
              progress_percent: zs.progress,
              progress_updated_at: new Date().toISOString(),
              last_inspection_id: protocol.id,
              phase: zs.progress === 100 ? "abnahme" : "zwischenbegehung",
              completed_at: zs.progress === 100 ? new Date().toISOString() : null,
              updated_at: new Date().toISOString(),
            },
          });
        });
      });
      await insertInspectionProtocolItems(protocol.id, items as any[]);
      await updateOfferPositions(positionUpdates);
      await updateProjectInspectionState(projectId, {
        status: overallProgress === 100 ? "COMPLETION" : "IN_PROGRESS",
        progress_percent: overallProgress,
      });
      await emitInspectionCompletedEvent({
        projectId,
        protocolId: protocol.id,
        protocolType: "zwischenbegehung",
        protocolNumber: protocol.protocol_number,
        payload: { average_progress: overallProgress, completed_items: completedItems },
      });

      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFinalized(true);
      setShowFinalizeConfirm(false);
    } catch (err: any) {
      Alert.alert("Fehler", "Festschreiben fehlgeschlagen: " + (err.message || "Unbekannter Fehler"));
    } finally {
      setFinalizing(false);
    }
  }, [rooms, zbStates, projectId, overallProgress]);

  if (loadingRooms) {
    return (
      <View style={s.container}>
        <View style={[s.header, { paddingTop: topInset + 8 }]}>
          <Pressable onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)"); }} style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}><Ionicons name="arrow-back" size={24} color={Colors.raw.white} /></Pressable>
          <View style={s.headerCenter}><Text style={s.headerCode}>{projectInfo?.projectNumber || "..."}</Text><Text style={s.headerTitle}>Zwischenbegehung</Text></View>
        </View>
        <View style={s.loadingWrap}><ActivityIndicator size="small" color={Colors.raw.amber500} /><Text style={s.loadingText}>Positionen laden...</Text></View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)"); }} style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]} testID="back-button">
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerCode}>{projectInfo?.projectNumber || "..."}</Text>
          <Text style={s.headerTitle}>Zwischenbegehung</Text>
          <Text style={s.headerAddress}>{projectInfo?.address || ""}</Text>
        </View>
      </View>

      <View style={s.progressSection}>
        <View style={s.progressHeader}>
          <Text style={s.progressLabel}>Gesamtfortschritt</Text>
          <Text style={[s.progressPct, overallProgress === 100 && { color: Colors.raw.emerald500 }]}>{overallProgress}%</Text>
        </View>
        <View style={s.progressBarBg}>
          <View style={[s.progressBarFill, { width: `${overallProgress}%` }, overallProgress === 100 && { backgroundColor: Colors.raw.emerald500 }]} />
        </View>
        {previousBegehungDate && !loadingPrevious && (
          <View style={s.previousBanner}>
            <Ionicons name="time" size={14} color={Colors.raw.zinc500} />
            <Text style={s.previousBannerText}>Fortgesetzt von {previousBegehungDate}</Text>
          </View>
        )}
      </View>

      {loadingPrevious ? (
        <View style={s.loadingWrap}><ActivityIndicator size="small" color={Colors.raw.amber500} /><Text style={s.loadingText}>Letzte Begehung laden...</Text></View>
      ) : (<>
      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: bottomInset + 40 }} showsVerticalScrollIndicator={false}>
        {rooms.map((room) => {
          const isExpanded = expandedRooms.has(room.id);
          const roomPosCount = room.positions.length;
          const roomAvgProg = roomPosCount > 0 ? Math.round(room.positions.reduce((sum, p) => sum + (zbStates[p.id]?.progress || 0), 0) / roomPosCount) : 0;

          return (
            <View key={room.id} style={s.roomCard} testID={`zb-room-${room.id}`}>
              <Pressable style={s.roomHeader} onPress={() => toggleRoom(room.id)}>
                <View style={s.roomIconWrap}><Ionicons name={room.icon as any} size={18} color={Colors.raw.amber500} /></View>
                <View style={s.roomInfo}>
                  <Text style={s.roomName}>{room.name}</Text>
                  <Text style={s.roomMeta}>{roomPosCount} Positionen {"\u00B7"} {roomAvgProg}%</Text>
                </View>
                <View style={s.zbRoomProgressWrap}>
                  <View style={s.zbRoomBarBg}><View style={[s.zbRoomBarFill, { width: `${roomAvgProg}%` }, roomAvgProg === 100 && { backgroundColor: Colors.raw.emerald500 }]} /></View>
                </View>
                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color={Colors.raw.zinc500} />
              </Pressable>

              {isExpanded && (
                <View style={s.roomBody}>
                  {room.positions.map((pos) => {
                    const zs = getZbState(pos.id);
                    const wsCfg = WS_CONFIG[zs.workStatus];
                    return (
                      <View key={pos.id} style={s.zbPosRow} testID={`zb-pos-${pos.id}`}>
                        <View style={s.zbPosTop}>
                          <View style={s.posBody}>
                            <View style={s.posTitleRow}><Text style={s.posNr}>{pos.nr}</Text><Text style={s.posTitle} numberOfLines={1}>{pos.title}</Text></View>
                            <Text style={s.posDesc} numberOfLines={2}>{pos.desc}</Text>
                            <View style={s.posMetaRow}>
                              <Text style={s.posMeta}>{pos.qty} {pos.unit}</Text><View style={s.posDot} /><Text style={s.posMeta}>{formatEuro(pos.price)}/{pos.unit}</Text><View style={s.posDot} />
                              <View style={s.posTradeBadge}><Text style={s.posTradeText}>{pos.trade}</Text></View>
                            </View>
                          </View>
                          <Pressable onPress={() => addPhoto(pos.id, room.id, room.name, pos.title)} style={({ pressed }) => [s.posPhotoBtn, { opacity: pressed ? 0.7 : 1 }]} testID={`zb-photo-${pos.id}`}>
                            <Ionicons name="camera" size={18} color={Colors.raw.zinc500} />
                            {zs.photoCount > 0 && <View style={s.photoBadge}><Text style={s.photoBadgeText}>{zs.photoCount}</Text></View>}
                          </Pressable>
                        </View>

                        <View style={s.zbControls}>
                          <View style={s.zbStatusBtns}>
                            <View
                              style={[s.zbStatusBtn, s.zbStatusBtnDisabled, zs.workStatus === "geplant" && { backgroundColor: Colors.raw.blue500 + "20", borderColor: Colors.raw.blue500 + "40" }]}
                              testID={`zb-geplant-${pos.id}`}
                            >
                              <Ionicons name="calendar" size={14} color={zs.workStatus === "geplant" ? Colors.raw.blue500 : Colors.raw.zinc600} />
                              <Text style={[s.zbStatusBtnText, { color: zs.workStatus === "geplant" ? Colors.raw.blue500 : Colors.raw.zinc600 }]}>Geplant</Text>
                            </View>
                            <Pressable
                              onPress={() => setWorkStatus(pos.id, "in_arbeit")}
                              style={[s.zbStatusBtn, zs.workStatus === "in_arbeit" && { backgroundColor: Colors.raw.amber500, borderColor: Colors.raw.amber500 }]}
                              testID={`zb-inarbeit-${pos.id}`}
                            >
                              <Ionicons name="hammer" size={14} color={zs.workStatus === "in_arbeit" ? Colors.raw.zinc950 : Colors.raw.zinc500} />
                              <Text style={[s.zbStatusBtnText, zs.workStatus === "in_arbeit" && { color: Colors.raw.zinc950 }]}>In Arbeit</Text>
                            </Pressable>
                            <View style={[s.zbStatusIndicator, { backgroundColor: wsCfg.color + "20", borderColor: wsCfg.color + "40" }]}>
                              <View style={[s.zbStatusDot, { backgroundColor: wsCfg.color }]} />
                              <Text style={[s.zbStatusIndicatorText, { color: wsCfg.color }]}>{wsCfg.label}</Text>
                            </View>
                          </View>

                          {(zs.workStatus === "in_arbeit" || zs.progress > 0) && (
                            <View style={s.zbProgressRow}>
                              {PROGRESS_STEPS.map((pct) => (
                                <Pressable
                                  key={pct}
                                  onPress={() => setProgress(pos.id, pct)}
                                  style={[s.zbProgressBtn, zs.progress === pct && s.zbProgressBtnActive]}
                                  testID={`zb-prog-${pos.id}-${pct}`}
                                >
                                  <Text style={[s.zbProgressBtnText, zs.progress === pct && s.zbProgressBtnTextActive]}>{pct}%</Text>
                                </Pressable>
                              ))}
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {finalized ? (
          <View style={s.finalizedBanner}><Ionicons name="lock-closed" size={20} color={Colors.raw.emerald500} /><View style={s.finalizedBannerText}><Text style={s.finalizedTitle}>Festgeschrieben</Text><Text style={s.finalizedDesc}>Die Zwischenbegehung wurde erfasst und k{"\u00F6"}nnen nicht mehr ge{"\u00E4"}ndert werden.</Text></View></View>
        ) : (
          <Pressable style={({ pressed }) => [s.finalizeBtn, { opacity: pressed ? 0.85 : 1 }]} onPress={() => setShowFinalizeConfirm(true)} testID="zb-finalize-button">
            <Ionicons name="lock-closed" size={18} color={Colors.raw.zinc950} /><Text style={s.finalizeBtnText}>Zwischenbegehung festschreiben</Text>
          </Pressable>
        )}
      </ScrollView>

      <Modal visible={showFinalizeConfirm} transparent animationType="fade" onRequestClose={() => setShowFinalizeConfirm(false)}>
        <Pressable style={s.confirmOverlay} onPress={() => setShowFinalizeConfirm(false)}>
          <View style={s.confirmCard}>
            <View style={s.confirmIconWrap}><Ionicons name="lock-closed" size={28} color={Colors.raw.amber500} /></View>
            <Text style={s.confirmTitle}>Zwischenbegehung festschreiben?</Text>
            <Text style={s.confirmDesc}>Nach dem Festschreiben k{"\u00F6"}nnen die erfassten Daten nicht mehr ge{"\u00E4"}ndert werden.{"\n\n"}Gesamtfortschritt: {overallProgress}%</Text>
            <View style={s.confirmBtns}>
              <Pressable style={({ pressed }) => [s.confirmCancelBtn, { opacity: pressed ? 0.7 : 1 }]} onPress={() => setShowFinalizeConfirm(false)}><Text style={s.confirmCancelText}>Abbrechen</Text></Pressable>
              <Pressable style={({ pressed }) => [s.confirmSubmitBtn, { opacity: pressed ? 0.85 : 1 }]} onPress={handleFinalize} disabled={finalizing} testID="zb-confirm-finalize">
                {finalizing ? <ActivityIndicator size="small" color={Colors.raw.zinc950} /> : <Text style={s.confirmSubmitText}>Festschreiben</Text>}
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
      </>)}
    </View>
  );
}

interface AbnahmePosition {
  id: string;
  nr: string;
  title: string;
  desc: string;
  qty: number;
  unit: string;
  price: number;
  trade: string;
  roomName: string;
}

function AbnahmeView({ projectId, protocolId, offerId }: { projectId: string; protocolId?: string; offerId?: string }) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  // --- React Query: initial data fetching ---
  const { data: projectInfo = null, isLoading: projectInfoLoading } = useQuery({
    queryKey: queryKeys.begehung.projectInfo(projectId),
    queryFn: () => fetchProjectInfo(projectId),
    enabled: !!projectId,
  });
  const { data: abnahmeRooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: queryKeys.begehung.rooms(projectId, offerId),
    queryFn: () => fetchRoomsForProject(projectId, offerId),
    enabled: !!projectId,
  });

  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState<AbnahmePosition[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [photos, setPhotos] = useState<number>(0);
  const [signatureLines, setSignatureLines] = useState<{ x: number; y: number }[][]>([]);
  const [currentLine, setCurrentLine] = useState<{ x: number; y: number }[]>([]);
  const [isSigning, setIsSigning] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const { isOnline, addToSyncQueue } = useOffline();

  // Process positions once query data is available
  useEffect(() => {
    if (projectInfoLoading || roomsLoading) return;
    if (!projectInfo) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        // Build position lookup from rooms query data
        const allPositions: Record<string, { nr: string; title: string; desc: string; qty: number; unit: string; price: number; trade: string; roomName: string }> = {};
        abnahmeRooms.forEach((r) => r.positions.forEach((p) => {
          allPositions[p.id] = { nr: p.nr, title: p.title, desc: p.desc, qty: p.qty, unit: p.unit, price: p.price, trade: p.trade, roomName: r.name };
        }));

        // If viewing a finalized protocol, load saved items directly
        if (protocolId) {
          const { data: items } = await supabase
            .from("inspection_protocol_items")
            .select("offer_position_id, status, progress_percent, notes")
            .eq("protocol_id", protocolId);

          if (!cancelled && items) {
            const restored: AbnahmePosition[] = [];
            const checkedIds = new Set<string>();
            for (const item of items) {
              if (!item.offer_position_id) continue;
              const posInfo = allPositions[item.offer_position_id];
              if (posInfo) {
                restored.push({ id: item.offer_position_id, nr: posInfo.nr, title: posInfo.title, desc: posInfo.desc, qty: posInfo.qty, unit: posInfo.unit, price: posInfo.price, trade: posInfo.trade, roomName: posInfo.roomName });
                if (item.status === "ja") checkedIds.add(item.offer_position_id);
              }
            }
            setPositions(restored);
            setChecked(checkedIds);
            setFinalized(true);
          }
        } else {
          // Load positions from latest ZB protocol in Supabase
          const data = await fetchLatestInspectionProtocol(projectId, "zwischenbegehung");
          if (cancelled) return;
          if (!data || !data.items) { setLoading(false); return; }
          const completed: AbnahmePosition[] = [];
          for (const pos of data.items) {
            const prog = Number(pos.progress_percent) || 0;
            if (!pos.position_id) continue;
            if (prog === 100) {
              const posInfo = allPositions[pos.position_id];
              if (!posInfo) continue;
              completed.push({
                id: pos.position_id,
                nr: posInfo.nr,
                title: posInfo.title,
                desc: posInfo.desc,
                qty: posInfo.qty,
                unit: posInfo.unit,
                price: posInfo.price,
                trade: posInfo.trade,
                roomName: posInfo.roomName,
              });
            }
          }
          if (!cancelled) setPositions(completed);
        }
      } catch (_e) {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [projectInfoLoading, roomsLoading, projectInfo, abnahmeRooms, projectId, protocolId, offerId]);

  const toggleCheck = useCallback((posId: string) => {
    if (finalized) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(posId)) next.delete(posId); else next.add(posId);
      return next;
    });
  }, [finalized]);

  const addPhoto = useCallback(async () => {
    if (finalized) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await captureAndUploadPhoto({
      projectId,
      inspectionType: "abnahme",
      isOnline,
      queueOfflineUpload: ({ label: queueLabel, detail, data }) => {
        addToSyncQueue({ type: "photo", label: queueLabel, detail, data });
      },
    });
    if (result) {
      setPhotos((p) => p + 1);
      if (result.queued && Platform.OS === "web") {
        window.alert("Foto offline gespeichert. Upload folgt automatisch.");
      }
    }
  }, [finalized, projectId, isOnline, addToSyncQueue]);

  const clearSignature = useCallback(() => {
    setSignatureLines([]);
    setCurrentLine([]);
  }, []);

  const hasSignature = signatureLines.length > 0;
  const allChecked = positions.length > 0 && checked.size === positions.length;
  const canFinalize = allChecked && hasSignature;

  const groupedPositions = useMemo(() => {
    const groups: Record<string, AbnahmePosition[]> = {};
    positions.forEach((p) => {
      if (!groups[p.roomName]) groups[p.roomName] = [];
      groups[p.roomName].push(p);
    });
    return groups;
  }, [positions]);

  const handleFinalize = useCallback(async () => {
    setFinalizing(true);
    try {
      const totalItems = positions.length;
      const completedItems = checked.size;

      const protocol = await createInspectionProtocol({
        projectId,
        protocolType: "abnahme",
        totalItems,
        completedItems,
      });
      const allLines = [...signatureLines, ...(currentLine.length > 0 ? [currentLine] : [])];
      const signaturePath = await uploadInspectionSignature(projectId, protocol.id, allLines);
      await updateInspectionProtocol(protocol.id, { signature_path: signaturePath });

      const items = positions.map((pos, i) => ({
        offer_position_id: pos.id,
        sort_order: i,
        status: checked.has(pos.id) ? "ja" : "offen",
        progress_percent: checked.has(pos.id) ? 100 : 0,
        is_additional: false,
      }));
      await insertInspectionProtocolItems(protocol.id, items as any[]);
      await updateOfferPositions(
        positions.map((pos) => ({
          positionId: pos.id,
          data: {
            phase: "abnahme",
            progress_percent: checked.has(pos.id) ? 100 : 0,
            last_inspection_id: protocol.id,
            completed_at: checked.has(pos.id) ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
        }))
      );
      await updateProjectInspectionState(projectId, { status: "COMPLETED", progress_percent: 100 });
      await emitInspectionCompletedEvent({
        projectId,
        protocolId: protocol.id,
        protocolType: "abnahme",
        protocolNumber: protocol.protocol_number,
        payload: { signature_path: signaturePath, completed_items: completedItems },
      });

      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFinalized(true);
      setShowFinalizeConfirm(false);
    } catch (err: any) {
      Alert.alert("Fehler", "Festschreiben fehlgeschlagen: " + (err.message || "Unbekannter Fehler"));
    } finally {
      setFinalizing(false);
    }
  }, [positions, checked, projectId, signatureLines, currentLine]);

  const onSignatureTouch = useCallback((evt: any) => {
    if (finalized) return;
    const { locationX, locationY } = evt.nativeEvent;
    setCurrentLine((prev) => [...prev, { x: locationX, y: locationY }]);
    setIsSigning(true);
  }, [finalized]);

  const onSignatureRelease = useCallback(() => {
    if (currentLine.length > 0) {
      setSignatureLines((prev) => [...prev, currentLine]);
      setCurrentLine([]);
    }
    setIsSigning(false);
  }, [currentLine]);

  const renderSignatureSVG = useMemo(() => {
    const allLines = [...signatureLines, ...(currentLine.length > 0 ? [currentLine] : [])];
    if (allLines.length === 0) return null;
    return allLines.map((line, i) => {
      if (line.length < 2) return null;
      return (
        <View key={i} style={StyleSheet.absoluteFill} pointerEvents="none">
          {line.map((point, j) => {
            if (j === 0) return null;
            const prev = line[j - 1];
            const dx = point.x - prev.x;
            const dy = point.y - prev.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            return (
              <View
                key={j}
                style={{
                  position: "absolute",
                  left: prev.x,
                  top: prev.y - 1,
                  width: len,
                  height: 2,
                  backgroundColor: Colors.raw.white,
                  transform: [{ rotate: `${angle}deg` }],
                  transformOrigin: "0 50%",
                }}
              />
            );
          })}
        </View>
      );
    });
  }, [signatureLines, currentLine]);

  if (loading) {
    return (
      <View style={s.container}>
        <View style={[s.header, { paddingTop: topInset + 8 }]}>
          <Pressable onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)"); }} style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}><Ionicons name="arrow-back" size={24} color={Colors.raw.white} /></Pressable>
          <View style={s.headerCenter}><Text style={s.headerCode}>{projectInfo?.projectNumber || "..."}</Text><Text style={s.headerTitle}>Abnahme</Text><Text style={s.headerAddress}>{projectInfo?.address || ""}</Text></View>
        </View>
        <View style={s.loadingWrap}><ActivityIndicator size="small" color={Colors.raw.amber500} /><Text style={s.loadingText}>Leistungen laden...</Text></View>
      </View>
    );
  }

  if (positions.length === 0) {
    return (
      <View style={s.container}>
        <View style={[s.header, { paddingTop: topInset + 8 }]}>
          <Pressable onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)"); }} style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}><Ionicons name="arrow-back" size={24} color={Colors.raw.white} /></Pressable>
          <View style={s.headerCenter}><Text style={s.headerCode}>{projectInfo?.projectNumber || "..."}</Text><Text style={s.headerTitle}>Abnahme</Text><Text style={s.headerAddress}>{projectInfo?.address || ""}</Text></View>
        </View>
        <View style={s.loadingWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.raw.zinc600} />
          <Text style={s.loadingText}>Keine Positionen mit 100% Fortschritt</Text>
          <Text style={[s.loadingText, { fontSize: 12, marginTop: 4 }]}>Alle Leistungen m{"\u00FC"}ssen in der Zwischenbegehung auf 100% stehen.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)"); }} style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]} testID="back-button">
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerCode}>{projectInfo?.projectNumber || "..."}</Text>
          <Text style={s.headerTitle}>Abnahme</Text>
          <Text style={s.headerAddress}>{projectInfo?.address || ""}</Text>
        </View>
      </View>

      <View style={s.abnahmeSummary}>
        <Text style={s.abnahmeSummaryText}>{checked.size}/{positions.length} abgenommen</Text>
        <View style={s.progressBarBg}>
          <View style={[s.progressBarFill, { width: `${positions.length > 0 ? Math.round((checked.size / positions.length) * 100) : 0}%` }, allChecked && { backgroundColor: Colors.raw.emerald500 }]} />
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: bottomInset + 40 }} showsVerticalScrollIndicator={false}>
        {Object.entries(groupedPositions).map(([roomName, roomPositions]) => (
          <View key={roomName} style={s.abnahmeRoomSection}>
            <Text style={s.abnahmeRoomTitle}>{roomName}</Text>
            {roomPositions.map((pos) => {
              const isChecked = checked.has(pos.id);
              return (
                <Pressable
                  key={pos.id}
                  onPress={() => toggleCheck(pos.id)}
                  style={({ pressed }) => [s.abnahmePosRow, { opacity: pressed ? 0.8 : 1 }]}
                  testID={`abnahme-pos-${pos.id}`}
                >
                  <View style={[s.abnahmeCheckbox, isChecked && s.abnahmeCheckboxChecked]}>
                    {isChecked && <Ionicons name="checkmark" size={16} color={Colors.raw.zinc950} />}
                  </View>
                  <View style={s.posBody}>
                    <View style={s.posTitleRow}>
                      <Text style={s.posNr}>{pos.nr}</Text>
                      <Text style={[s.posTitle, isChecked && { color: Colors.raw.zinc500 }]} numberOfLines={1}>{pos.title}</Text>
                    </View>
                    <View style={s.posMetaRow}>
                      <Text style={s.posMeta}>{pos.qty} {pos.unit}</Text>
                      <View style={s.posDot} />
                      <Text style={s.posMeta}>{formatEuro(pos.price)}/{pos.unit}</Text>
                      <View style={s.posDot} />
                      <View style={s.posTradeBadge}><Text style={s.posTradeText}>{pos.trade}</Text></View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}

        <View style={s.abnahmeSection}>
          <Text style={s.abnahmeSectionTitle}>Fotos der fertigen Wohnung</Text>
          <Text style={s.abnahmeSectionDesc}>Dokumentieren Sie den Zustand bei Abnahme</Text>
          <View style={s.abnahmePhotoRow}>
            {!finalized && (
              <Pressable onPress={addPhoto} style={({ pressed }) => [s.abnahmePhotoAddBtn, { opacity: pressed ? 0.7 : 1 }]} testID="abnahme-add-photo">
                <Ionicons name="camera" size={24} color={Colors.raw.amber500} />
                <Text style={s.abnahmePhotoAddText}>Foto aufnehmen</Text>
              </Pressable>
            )}
            {photos > 0 && (
              <View style={s.abnahmePhotoCount}>
                <Ionicons name="images" size={18} color={Colors.raw.zinc400} />
                <Text style={s.abnahmePhotoCountText}>{photos} Foto{photos > 1 ? "s" : ""} aufgenommen</Text>
              </View>
            )}
          </View>
        </View>

        <View style={s.abnahmeSection}>
          <Text style={s.abnahmeSectionTitle}>Unterschrift</Text>
          <Text style={s.abnahmeSectionDesc}>Bitte im Feld unten unterschreiben</Text>
          <View style={s.signaturePad}>
            <View
              style={s.signatureCanvas}
              onStartShouldSetResponder={() => !finalized}
              onMoveShouldSetResponder={() => !finalized}
              onResponderGrant={onSignatureTouch}
              onResponderMove={onSignatureTouch}
              onResponderRelease={onSignatureRelease}
              testID="signature-pad"
            >
              {!hasSignature && !isSigning && (
                <Text style={s.signaturePlaceholder}>Hier unterschreiben</Text>
              )}
              {renderSignatureSVG}
            </View>
            {hasSignature && !finalized && (
              <Pressable onPress={clearSignature} style={({ pressed }) => [s.signatureClearBtn, { opacity: pressed ? 0.7 : 1 }]} testID="clear-signature">
                <Ionicons name="trash-outline" size={16} color={Colors.raw.zinc500} />
                <Text style={s.signatureClearText}>L{"\u00F6"}schen</Text>
              </Pressable>
            )}
          </View>
        </View>

        {finalized ? (
          <View style={s.finalizedBanner}>
            <Ionicons name="lock-closed" size={20} color={Colors.raw.emerald500} />
            <View style={s.finalizedBannerText}>
              <Text style={s.finalizedTitle}>Abnahme abgeschlossen</Text>
              <Text style={s.finalizedDesc}>Der Abrechnungsprozess wurde angesto{"\u00DF"}en. Die Freigabe finden Sie im Freigabe-Center.</Text>
            </View>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [s.finalizeBtn, !canFinalize && s.finalizeBtnDisabled, { opacity: pressed && canFinalize ? 0.85 : 1 }]}
            onPress={() => canFinalize && setShowFinalizeConfirm(true)}
            disabled={!canFinalize}
            testID="abnahme-finalize-button"
          >
            <Ionicons name="checkmark-done" size={18} color={canFinalize ? Colors.raw.zinc950 : Colors.raw.zinc600} />
            <Text style={[s.finalizeBtnText, !canFinalize && { color: Colors.raw.zinc600 }]}>Abnahme abschlie{"\u00DF"}en</Text>
          </Pressable>
        )}

        {!finalized && !canFinalize && (
          <View style={s.abnahmeHintRow}>
            {!allChecked && <Text style={s.abnahmeHintText}><Ionicons name="information-circle" size={14} color={Colors.raw.zinc600} /> Alle Positionen abhaken</Text>}
            {!hasSignature && <Text style={s.abnahmeHintText}><Ionicons name="information-circle" size={14} color={Colors.raw.zinc600} /> Unterschrift erforderlich</Text>}
          </View>
        )}
      </ScrollView>

      <Modal visible={showFinalizeConfirm} transparent animationType="fade" onRequestClose={() => setShowFinalizeConfirm(false)}>
        <Pressable style={s.confirmOverlay} onPress={() => setShowFinalizeConfirm(false)}>
          <View style={s.confirmCard}>
            <View style={s.confirmIconWrap}><Ionicons name="checkmark-done" size={28} color={Colors.raw.emerald500} /></View>
            <Text style={s.confirmTitle}>Abnahme abschlie{"\u00DF"}en?</Text>
            <Text style={s.confirmDesc}>{positions.length} Leistungen werden als abgenommen dokumentiert.{"\n\n"}Der Abrechnungsprozess wird automatisch angesto{"\u00DF"}en.</Text>
            <View style={s.confirmBtns}>
              <Pressable style={({ pressed }) => [s.confirmCancelBtn, { opacity: pressed ? 0.7 : 1 }]} onPress={() => setShowFinalizeConfirm(false)}><Text style={s.confirmCancelText}>Abbrechen</Text></Pressable>
              <Pressable style={({ pressed }) => [s.confirmSubmitBtn, { backgroundColor: Colors.raw.emerald500 }, { opacity: pressed ? 0.85 : 1 }]} onPress={handleFinalize} disabled={finalizing} testID="abnahme-confirm-finalize">
                {finalizing ? <ActivityIndicator size="small" color={Colors.raw.white} /> : <Text style={[s.confirmSubmitText, { color: Colors.raw.white }]}>Abnahme abschlie{"\u00DF"}en</Text>}
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function CatalogModal({
  visible, step, selectedCatalog, catalogSearch, filteredEntries,
  freeTitle, freeDesc, freeQty, freeUnit, freePrice, freeTrade,
  onClose, onSetStep, onSelectCatalog, onSearchChange, onAddFromCatalog, onAddFree,
  onSetFreeTitle, onSetFreeDesc, onSetFreeQty, onSetFreeUnit, onSetFreePrice, onSetFreeTrade,
  bottomInset,
}: {
  visible: boolean; step: "pick" | "browse" | "free"; selectedCatalog: string;
  catalogSearch: string; filteredEntries: CatalogEntry[];
  freeTitle: string; freeDesc: string; freeQty: string; freeUnit: string; freePrice: string; freeTrade: string;
  onClose: () => void; onSetStep: (s: "pick" | "browse" | "free") => void;
  onSelectCatalog: (key: string) => void; onSearchChange: (s: string) => void;
  onAddFromCatalog: (e: CatalogEntry) => void; onAddFree: () => void;
  onSetFreeTitle: (s: string) => void; onSetFreeDesc: (s: string) => void;
  onSetFreeQty: (s: string) => void; onSetFreeUnit: (s: string) => void;
  onSetFreePrice: (s: string) => void; onSetFreeTrade: (s: string) => void;
  bottomInset: number;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.modalFlex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={s.modalOverlay} onPress={onClose} />
        <View style={[s.modalSheet, { paddingBottom: bottomInset + 16 }]}>
          {step === "pick" && (
            <>
              <View style={s.modalHandle} />
              <Text style={s.modalTitle}>Mehrleistung hinzuf{"\u00FC"}gen</Text>
              <Text style={s.modalSubtitle}>Quelle w{"\u00E4"}hlen</Text>
              {Object.entries(CATALOGS).map(([key, cat]) => (
                <Pressable key={key} style={({ pressed }) => [s.catalogOption, { opacity: pressed ? 0.7 : 1 }]} onPress={() => onSelectCatalog(key)}>
                  <View style={s.catalogOptionIcon}><Ionicons name="book" size={20} color={Colors.raw.amber500} /></View>
                  <View style={s.catalogOptionText}><Text style={s.catalogOptionLabel}>{cat.label}</Text><Text style={s.catalogOptionDesc}>{cat.entries.length} Positionen</Text></View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.raw.zinc600} />
                </Pressable>
              ))}
              <Pressable style={({ pressed }) => [s.catalogOption, { opacity: pressed ? 0.7 : 1 }]} onPress={() => onSetStep("free")}>
                <View style={s.catalogOptionIcon}><Ionicons name="create" size={20} color={Colors.raw.amber500} /></View>
                <View style={s.catalogOptionText}><Text style={s.catalogOptionLabel}>Freitext</Text><Text style={s.catalogOptionDesc}>Position manuell erfassen</Text></View>
                <Ionicons name="chevron-forward" size={18} color={Colors.raw.zinc600} />
              </Pressable>
              <Pressable style={({ pressed }) => [s.modalCancelBtn, { opacity: pressed ? 0.7 : 1 }]} onPress={onClose}><Text style={s.modalCancelText}>Abbrechen</Text></Pressable>
            </>
          )}
          {step === "browse" && (
            <>
              <View style={s.modalHandle} />
              <View style={s.browseHeader}>
                <Pressable onPress={() => onSetStep("pick")} style={{ padding: 4 }}><Ionicons name="arrow-back" size={22} color={Colors.raw.white} /></Pressable>
                <Text style={s.modalTitle}>{CATALOGS[selectedCatalog]?.label}</Text>
              </View>
              <View style={s.searchWrap}>
                <Ionicons name="search" size={16} color={Colors.raw.zinc500} />
                <TextInput style={s.searchInput} placeholder="Suchen..." placeholderTextColor={Colors.raw.zinc600} value={catalogSearch} onChangeText={onSearchChange} autoCapitalize="none" />
                {catalogSearch.length > 0 && <Pressable onPress={() => onSearchChange("")}><Ionicons name="close-circle" size={18} color={Colors.raw.zinc600} /></Pressable>}
              </View>
              <ScrollView style={s.catalogList} showsVerticalScrollIndicator={false}>
                {filteredEntries.length === 0 && <Text style={s.catalogEmpty}>Keine Treffer</Text>}
                {filteredEntries.map((entry) => (
                  <Pressable key={entry.id} style={({ pressed }) => [s.catalogEntry, { opacity: pressed ? 0.7 : 1 }]} onPress={() => onAddFromCatalog(entry)}>
                    <View style={s.catalogEntryBody}>
                      <View style={s.catalogEntryTitleRow}><Text style={s.catalogEntryNr}>{entry.nr}</Text><Text style={s.catalogEntryTitle} numberOfLines={1}>{entry.title}</Text></View>
                      <Text style={s.catalogEntryDesc} numberOfLines={1}>{entry.desc}</Text>
                      <View style={s.catalogEntryMeta}><Text style={s.catalogEntryPrice}>{formatEuro(entry.price)}/{entry.unit}</Text><View style={s.posTradeBadge}><Text style={s.posTradeText}>{entry.trade}</Text></View></View>
                    </View>
                    <Ionicons name="add-circle" size={22} color={Colors.raw.amber500} />
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
          {step === "free" && (
            <>
              <View style={s.modalHandle} />
              <View style={s.browseHeader}>
                <Pressable onPress={() => onSetStep("pick")} style={{ padding: 4 }}><Ionicons name="arrow-back" size={22} color={Colors.raw.white} /></Pressable>
                <Text style={s.modalTitle}>Freitext-Position</Text>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={s.fieldLabel}>Bezeichnung *</Text>
                <TextInput style={s.fieldInput} placeholder="z.B. Buntbartschloss tauschen" placeholderTextColor={Colors.raw.zinc600} value={freeTitle} onChangeText={onSetFreeTitle} />
                <Text style={s.fieldLabel}>Beschreibung</Text>
                <TextInput style={[s.fieldInput, s.fieldMultiline]} placeholder="Optionale Beschreibung" placeholderTextColor={Colors.raw.zinc600} value={freeDesc} onChangeText={onSetFreeDesc} multiline />
                <View style={s.fieldRow}>
                  <View style={s.fieldHalf}><Text style={s.fieldLabel}>Menge</Text><TextInput style={s.fieldInput} placeholder="1" placeholderTextColor={Colors.raw.zinc600} value={freeQty} onChangeText={onSetFreeQty} keyboardType="numeric" /></View>
                  <View style={s.fieldHalf}><Text style={s.fieldLabel}>Einheit</Text><TextInput style={s.fieldInput} placeholder="Stk" placeholderTextColor={Colors.raw.zinc600} value={freeUnit} onChangeText={onSetFreeUnit} /></View>
                </View>
                <View style={s.fieldRow}>
                  <View style={s.fieldHalf}><Text style={s.fieldLabel}>Preis/Einheit</Text><TextInput style={s.fieldInput} placeholder="0,00" placeholderTextColor={Colors.raw.zinc600} value={freePrice} onChangeText={onSetFreePrice} keyboardType="numeric" /></View>
                  <View style={s.fieldHalf}><Text style={s.fieldLabel}>Gewerk</Text><TextInput style={s.fieldInput} placeholder="z.B. Tischler" placeholderTextColor={Colors.raw.zinc600} value={freeTrade} onChangeText={onSetFreeTrade} /></View>
                </View>
                <Pressable style={({ pressed }) => [s.freeSubmitBtn, !freeTitle.trim() && s.freeSubmitDisabled, { opacity: pressed ? 0.8 : 1 }]} onPress={onAddFree} disabled={!freeTitle.trim()}>
                  <Text style={s.freeSubmitText}>Hinzuf{"\u00FC"}gen</Text>
                </Pressable>
              </ScrollView>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.raw.zinc800 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1 },
  headerCode: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.raw.zinc500, letterSpacing: 0.5 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.raw.white },
  headerAddress: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginTop: 2 },
  summaryBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10, gap: 16, borderBottomWidth: 1, borderBottomColor: Colors.raw.zinc800 + "80" },
  summaryItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  summaryCount: { fontFamily: "Inter_700Bold", fontSize: 14 },
  summaryDivider: { flex: 1 },
  summaryTotal: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc400 },
  progressSection: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.raw.zinc800 + "80" },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  progressLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc400 },
  progressPct: { fontFamily: "Inter_800ExtraBold", fontSize: 22, color: Colors.raw.amber500 },
  progressBarBg: { height: 8, borderRadius: 4, backgroundColor: Colors.raw.zinc800, overflow: "hidden" },
  progressBarFill: { height: 8, borderRadius: 4, backgroundColor: Colors.raw.amber500 },
  previousBanner: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, paddingHorizontal: 4 },
  previousBannerText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc500 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  roomCard: { backgroundColor: Colors.raw.zinc900, borderRadius: 14, borderWidth: 1, borderColor: Colors.raw.zinc800, marginTop: 12, overflow: "hidden" },
  roomHeader: { flexDirection: "row", alignItems: "center", padding: 16, gap: 10 },
  roomIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.raw.amber500 + "14", alignItems: "center", justifyContent: "center" },
  roomInfo: { flex: 1 },
  roomName: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.white },
  roomMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginTop: 1 },
  roomProgress: { flexDirection: "row", gap: 4 },
  roomDot: { minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  roomDotText: { fontFamily: "Inter_700Bold", fontSize: 11, color: Colors.raw.white },
  roomBody: { borderTopWidth: 1, borderTopColor: Colors.raw.zinc800 },
  posRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 12, paddingHorizontal: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: Colors.raw.zinc800 + "60" },
  posActions: { gap: 6, paddingTop: 2 },
  posActionBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.raw.zinc700, alignItems: "center", justifyContent: "center" },
  posActionConfirmed: { backgroundColor: Colors.raw.emerald500, borderColor: Colors.raw.emerald500 },
  posActionRejected: { backgroundColor: Colors.raw.rose500, borderColor: Colors.raw.rose500 },
  posBody: { flex: 1 },
  posTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
  posNr: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 11, color: Colors.raw.amber500, minWidth: 22 },
  posTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.white, flex: 1 },
  posTitleRejected: { textDecorationLine: "line-through", color: Colors.raw.zinc600 },
  posDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginBottom: 6, lineHeight: 17 },
  posMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  posMeta: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.raw.zinc500 },
  posDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.raw.zinc700 },
  posTradeBadge: { backgroundColor: Colors.raw.amber500 + "14", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  posTradeText: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: Colors.raw.amber500, textTransform: "uppercase", letterSpacing: 0.3 },
  posPhotoBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.raw.zinc800, alignItems: "center", justifyContent: "center", marginTop: 2 },
  photoBadge: { position: "absolute", top: -2, right: -2, backgroundColor: Colors.raw.amber500, borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  photoBadgeText: { fontFamily: "Inter_700Bold", fontSize: 9, color: Colors.raw.zinc950 },
  mehrSection: { paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.raw.amber500 + "20", backgroundColor: Colors.raw.amber500 + "08" },
  mehrLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.amber500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  mehrRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: Colors.raw.zinc800 + "40" },
  mehrIconWrap: { width: 24, alignItems: "center" },
  mehrBody: { flex: 1 },
  mehrTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.white },
  mehrMeta: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.raw.zinc500, marginTop: 1 },
  addMehrBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.raw.zinc800 + "60" },
  addMehrText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.amber500 },
  zbPosRow: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: Colors.raw.zinc800 + "60" },
  zbPosTop: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  zbControls: { marginTop: 10, gap: 8 },
  zbStatusBtns: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  zbStatusBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.raw.zinc700 },
  zbStatusBtnDisabled: { borderStyle: "dashed" as any, opacity: 0.7 },
  zbStatusBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.zinc500 },
  zbStatusIndicator: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  zbStatusDot: { width: 6, height: 6, borderRadius: 3 },
  zbStatusIndicatorText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  zbProgressRow: { flexDirection: "row", gap: 6 },
  zbProgressBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.raw.zinc700, backgroundColor: Colors.raw.zinc800 + "60" },
  zbProgressBtnActive: { backgroundColor: Colors.raw.amber500, borderColor: Colors.raw.amber500 },
  zbProgressBtnText: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.raw.zinc500 },
  zbProgressBtnTextActive: { color: Colors.raw.zinc950 },
  zbRoomProgressWrap: { width: 48 },
  zbRoomBarBg: { height: 4, borderRadius: 2, backgroundColor: Colors.raw.zinc800, overflow: "hidden" },
  zbRoomBarFill: { height: 4, borderRadius: 2, backgroundColor: Colors.raw.amber500 },
  finalizeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.raw.amber500, borderRadius: 14, paddingVertical: 16, marginTop: 20, marginHorizontal: 4 },
  finalizeBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.raw.zinc950 },
  finalizedBanner: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: Colors.raw.emerald500 + "14", borderWidth: 1, borderColor: Colors.raw.emerald500 + "30", borderRadius: 14, padding: 16, marginTop: 20, marginHorizontal: 4 },
  finalizedBannerText: { flex: 1 },
  finalizedTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.emerald500 },
  finalizedDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc400, marginTop: 3 },
  confirmOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
  confirmCard: { backgroundColor: Colors.raw.zinc900, borderRadius: 20, padding: 24, width: "100%", maxWidth: 360, alignItems: "center" },
  confirmIconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.raw.amber500 + "14", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  confirmTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.raw.white, textAlign: "center", marginBottom: 8 },
  confirmDesc: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.raw.zinc400, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  confirmBtns: { flexDirection: "row", gap: 12, width: "100%" },
  confirmCancelBtn: { flex: 1, backgroundColor: Colors.raw.zinc800, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  confirmCancelText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.raw.zinc400 },
  confirmSubmitBtn: { flex: 1, backgroundColor: Colors.raw.amber500, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  confirmSubmitText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.zinc950 },
  modalFlex: { flex: 1, justifyContent: "flex-end" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { backgroundColor: Colors.raw.zinc900, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 12, maxHeight: "80%" },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.raw.zinc700, alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.raw.white, marginBottom: 4 },
  modalSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc500, marginBottom: 16 },
  catalogOption: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.raw.zinc800, gap: 14 },
  catalogOptionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.raw.amber500 + "14", alignItems: "center", justifyContent: "center" },
  catalogOptionText: { flex: 1 },
  catalogOptionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.raw.white },
  catalogOptionDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginTop: 2 },
  modalCancelBtn: { alignItems: "center", paddingVertical: 16, marginTop: 8 },
  modalCancelText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.raw.zinc500 },
  browseHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.raw.zinc800, borderRadius: 10, paddingHorizontal: 12, gap: 8, marginBottom: 12, height: 42 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.raw.white, height: 42 },
  catalogList: { flex: 1 },
  catalogEmpty: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.raw.zinc600, textAlign: "center", paddingVertical: 24 },
  catalogEntry: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.raw.zinc800 + "60", gap: 12 },
  catalogEntryBody: { flex: 1 },
  catalogEntryTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  catalogEntryNr: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 11, color: Colors.raw.amber500 },
  catalogEntryTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.white, flex: 1 },
  catalogEntryDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginBottom: 4 },
  catalogEntryMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  catalogEntryPrice: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.zinc400 },
  fieldLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.zinc400, marginBottom: 6, marginTop: 12 },
  fieldInput: { backgroundColor: Colors.raw.zinc800, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.raw.white },
  fieldMultiline: { minHeight: 72, textAlignVertical: "top" },
  fieldRow: { flexDirection: "row", gap: 12 },
  fieldHalf: { flex: 1 },
  freeSubmitBtn: { backgroundColor: Colors.raw.amber500, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 20, marginBottom: 12 },
  freeSubmitDisabled: { opacity: 0.4 },
  freeSubmitText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.zinc950 },
  finalizeBtnDisabled: { backgroundColor: Colors.raw.zinc800, borderWidth: 1, borderColor: Colors.raw.zinc700 },
  dateSection: { backgroundColor: Colors.raw.zinc900, borderRadius: 14, borderWidth: 1, borderColor: Colors.raw.zinc800, padding: 16, marginTop: 20, marginHorizontal: 4 },
  dateSectionTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.white, marginBottom: 4 },
  dateSectionHint: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginBottom: 14 },
  dateRow: { flexDirection: "row", gap: 12 },
  dateCol: { flex: 1 },
  dateLbl: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.zinc400, marginBottom: 6 },
  dateInp: { backgroundColor: Colors.raw.zinc800, borderRadius: 10, borderWidth: 1, borderColor: Colors.raw.zinc700, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.raw.white },
  dateValue: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.raw.white, marginTop: 2 },
  abnahmeSummary: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.raw.zinc800 + "80", gap: 8 },
  abnahmeSummaryText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc400 },
  abnahmeRoomSection: { marginTop: 16 },
  abnahmeRoomTitle: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.amber500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  abnahmePosRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.raw.zinc900, borderRadius: 12, padding: 14, marginBottom: 6, borderWidth: 1, borderColor: Colors.raw.zinc800 },
  abnahmeCheckbox: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: Colors.raw.zinc600, alignItems: "center", justifyContent: "center" },
  abnahmeCheckboxChecked: { backgroundColor: Colors.raw.emerald500, borderColor: Colors.raw.emerald500 },
  abnahmeSection: { marginTop: 24, backgroundColor: Colors.raw.zinc900, borderRadius: 14, borderWidth: 1, borderColor: Colors.raw.zinc800, padding: 16 },
  abnahmeSectionTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.white, marginBottom: 4 },
  abnahmeSectionDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginBottom: 14 },
  abnahmePhotoRow: { gap: 10 },
  abnahmePhotoAddBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: Colors.raw.zinc800, borderRadius: 12, paddingVertical: 16, borderWidth: 1, borderColor: Colors.raw.zinc700, borderStyle: "dashed" as any },
  abnahmePhotoAddText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.amber500 },
  abnahmePhotoCount: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 8 },
  abnahmePhotoCountText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc400 },
  signaturePad: { gap: 8 },
  signatureCanvas: { height: 150, borderRadius: 12, backgroundColor: Colors.raw.zinc800, borderWidth: 1, borderColor: Colors.raw.zinc700, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  signaturePlaceholder: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.raw.zinc600 },
  signatureClearBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-end" },
  signatureClearText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.raw.zinc500 },
  abnahmeHintRow: { gap: 6, marginTop: 12, marginHorizontal: 4 },
  abnahmeHintText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc600 },
});
