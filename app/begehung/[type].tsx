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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback, useMemo, useEffect } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { apiRequest, getApiUrl } from "@/lib/query-client";

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

const INITIAL_ROOMS: BegehungRoom[] = [
  {
    id: "r1", icon: "water", name: "Bad",
    positions: [
      { id: "p1", nr: "01", title: "Wandfliesen Bad", desc: "Wandfliesen im D\u00FCnnbett verlegen inkl. Grundierung, Kleber und Verfugung.", qty: 28, unit: "m\u00B2", price: 54.4, trade: "Fliesen" },
      { id: "p2", nr: "02", title: "Bodenfliesen Bad", desc: "Bodenfliesen im D\u00FCnnbett verlegen inkl. Grundierung, Kleber und Verfugung.", qty: 6, unit: "m\u00B2", price: 70, trade: "Fliesen" },
      { id: "p3", nr: "03", title: "Waschtisch montieren", desc: "Waschtisch inkl. Einhandmischer und Siphon montieren.", qty: 1, unit: "Stk", price: 180, trade: "Sanit\u00E4r" },
      { id: "p4", nr: "04", title: "WC montieren", desc: "Wand-WC inkl. Bet\u00E4tigungsplatte und Anschluss montieren.", qty: 1, unit: "Stk", price: 220, trade: "Sanit\u00E4r" },
      { id: "p5", nr: "05", title: "Silikonfugen", desc: "Silikonfugen erneuern, Altsilikon entfernen.", qty: 15, unit: "lfm", price: 8.5, trade: "Fliesen" },
      { id: "p6", nr: "06", title: "Decke streichen", desc: "Deckenfl. mit Dispersionsfarbe streichen.", qty: 6, unit: "m\u00B2", price: 5.2, trade: "Maler" },
    ],
  },
  {
    id: "r2", icon: "restaurant", name: "K\u00FCche",
    positions: [
      { id: "p7", nr: "01", title: "W\u00E4nde tapezieren (Vlies)", desc: "Malervlies glatt auf vorbereiteten Untergrund tapezieren.", qty: 32, unit: "m\u00B2", price: 9.6, trade: "Maler" },
      { id: "p8", nr: "02", title: "W\u00E4nde streichen", desc: "Wandfl\u00E4chen streichen mit Dispersionsfarbe, deckend.", qty: 32, unit: "m\u00B2", price: 4.8, trade: "Maler" },
      { id: "p9", nr: "03", title: "Decke streichen", desc: "Deckenfl\u00E4chen mit Dispersionsfarbe streichen.", qty: 12, unit: "m\u00B2", price: 5.2, trade: "Maler" },
      { id: "p10", nr: "04", title: "Boden schleifen", desc: "Parkettboden maschinell schleifen.", qty: 12, unit: "m\u00B2", price: 38, trade: "Boden" },
      { id: "p11", nr: "05", title: "Boden versiegeln", desc: "Parkettboden 2x versiegeln mit Parkettlack.", qty: 12, unit: "m\u00B2", price: 38, trade: "Boden" },
    ],
  },
  {
    id: "r3", icon: "home", name: "Wohnzimmer",
    positions: [
      { id: "p12", nr: "01", title: "Altbelag entfernen", desc: "Vorhandenen Bodenbelag entfernen und entsorgen.", qty: 25, unit: "m\u00B2", price: 6.5, trade: "Boden" },
      { id: "p13", nr: "02", title: "Untergrund spachteln", desc: "Untergrund ausgleichen mit Nivelliermasse.", qty: 25, unit: "m\u00B2", price: 8, trade: "Boden" },
      { id: "p14", nr: "03", title: "W\u00E4nde spachteln Q3", desc: "Spachtelarbeiten Q3 auf Gipskartonplatten.", qty: 45, unit: "m\u00B2", price: 6.8, trade: "Maler" },
      { id: "p15", nr: "04", title: "W\u00E4nde streichen 2x", desc: "Dispersionsfarbe deckend in zwei Anstrichen.", qty: 45, unit: "m\u00B2", price: 4.8, trade: "Maler" },
      { id: "p16", nr: "05", title: "Decke streichen", desc: "Deckenfl\u00E4chen streichen.", qty: 25, unit: "m\u00B2", price: 5.2, trade: "Maler" },
      { id: "p17", nr: "06", title: "Laminat verlegen", desc: "Laminat NK32 schwimmend verlegen inkl. Trittschalld\u00E4mmung.", qty: 25, unit: "m\u00B2", price: 24.5, trade: "Boden" },
      { id: "p18", nr: "07", title: "Sockelleisten montieren", desc: "Sockelleisten aus MDF montieren.", qty: 20, unit: "lfm", price: 12.5, trade: "Boden" },
      { id: "p19", nr: "08", title: "Endreinigung", desc: "Endreinigung nach Abschluss aller Arbeiten.", qty: 1, unit: "Pauschal", price: 180, trade: "Allg." },
    ],
  },
  {
    id: "r4", icon: "bed", name: "Schlafzimmer",
    positions: [
      { id: "p20", nr: "01", title: "Raufaser tapezieren", desc: "Raufasertapete auf vorbereiteten Untergrund.", qty: 38, unit: "m\u00B2", price: 8.4, trade: "Maler" },
      { id: "p21", nr: "02", title: "W\u00E4nde streichen", desc: "Dispersionsfarbe deckend.", qty: 38, unit: "m\u00B2", price: 4.8, trade: "Maler" },
      { id: "p22", nr: "03", title: "Decke streichen", desc: "Deckenfl\u00E4chen streichen.", qty: 14, unit: "m\u00B2", price: 5.2, trade: "Maler" },
      { id: "p23", nr: "04", title: "Laminat verlegen", desc: "Laminat NK32 schwimmend verlegen.", qty: 14, unit: "m\u00B2", price: 24.5, trade: "Boden" },
    ],
  },
];

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

export default function BegehungScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();

  if (type === "zwischenbegehung") return <ZwischenbegehungView />;
  if (type === "abnahme") return <AbnahmeView />;
  return <ErstbegehungView type={type || "erstbegehung"} />;
}

function ErstbegehungView({ type }: { type: string }) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const label = TYPE_LABELS[type] || "Begehung";

  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set(["r1"]));
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

  const addPhoto = useCallback((posId: string) => {
    if (finalized) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPosStates((prev) => {
      const current = prev[posId] || { status: "none", photoCount: 0, note: "" };
      return { ...prev, [posId]: { ...current, photoCount: current.photoCount + 1 } };
    });
  }, [finalized]);

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
      const positions: any[] = [];
      INITIAL_ROOMS.forEach((room) => {
        room.positions.forEach((pos) => {
          const ps = posStates[pos.id] || { status: "none", photoCount: 0, note: "" };
          positions.push({ room_id: room.id, room_name: room.name, position_id: pos.id, position_nr: pos.nr, title: pos.title, description: pos.desc, qty: pos.qty, unit: pos.unit, price: pos.price, trade: pos.trade, status: ps.status, photo_count: ps.photoCount, note: ps.note, is_mehrleistung: false, from_catalog: false });
        });
        (mehrleistungen[room.id] || []).forEach((ml) => {
          positions.push({ room_id: room.id, room_name: room.name, position_id: ml.id, position_nr: "ML", title: ml.title, description: ml.desc, qty: ml.qty, unit: ml.unit, price: ml.price, trade: ml.trade, status: "confirmed", photo_count: 0, note: "", is_mehrleistung: true, from_catalog: ml.fromCatalog });
        });
      });
      await apiRequest("POST", "/api/begehungen", { project_id: "BL-2026-023", type, positions });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFinalized(true);
      setShowFinalizeConfirm(false);
    } catch (err: any) {
      Alert.alert("Fehler", "Festschreiben fehlgeschlagen: " + (err.message || "Unbekannter Fehler"));
    } finally {
      setFinalizing(false);
    }
  }, [posStates, mehrleistungen, type]);

  const filteredCatalogEntries = useMemo(() => {
    const catalog = CATALOGS[selectedCatalog];
    if (!catalog) return [];
    if (!catalogSearch.trim()) return catalog.entries;
    const q = catalogSearch.toLowerCase();
    return catalog.entries.filter((e) => e.title.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q) || e.trade.toLowerCase().includes(q));
  }, [selectedCatalog, catalogSearch]);

  const summary = useMemo(() => {
    let total = 0, confirmed = 0, rejected = 0, unchecked = 0;
    INITIAL_ROOMS.forEach((room) => {
      room.positions.forEach((pos) => {
        total++;
        const st = posStates[pos.id]?.status || "none";
        if (st === "confirmed") confirmed++; else if (st === "rejected") rejected++; else unchecked++;
      });
    });
    return { total, confirmed, rejected, unchecked };
  }, [posStates]);

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]} testID="back-button">
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerCode}>BL-2026-023</Text>
          <Text style={s.headerTitle}>{label}</Text>
          <Text style={s.headerAddress}>Schillerstra{"\u00DF"}e 12, 80336 M{"\u00FC"}nchen</Text>
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
        {INITIAL_ROOMS.map((room) => {
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
                    return (
                      <View key={pos.id} style={s.posRow} testID={`pos-${pos.id}`}>
                        <View style={s.posActions}>
                          <Pressable onPress={() => togglePosStatus(pos.id, "confirmed")} style={({ pressed }) => [s.posActionBtn, ps.status === "confirmed" && s.posActionConfirmed, { opacity: pressed ? 0.7 : 1 }]} testID={`confirm-${pos.id}`}>
                            <Ionicons name="checkmark" size={18} color={ps.status === "confirmed" ? Colors.raw.white : Colors.raw.zinc600} />
                          </Pressable>
                          <Pressable onPress={() => togglePosStatus(pos.id, "rejected")} style={({ pressed }) => [s.posActionBtn, ps.status === "rejected" && s.posActionRejected, { opacity: pressed ? 0.7 : 1 }]} testID={`reject-${pos.id}`}>
                            <Ionicons name="close" size={18} color={ps.status === "rejected" ? Colors.raw.white : Colors.raw.zinc600} />
                          </Pressable>
                        </View>
                        <View style={s.posBody}>
                          <View style={s.posTitleRow}><Text style={s.posNr}>{pos.nr}</Text><Text style={[s.posTitle, ps.status === "rejected" && s.posTitleRejected]} numberOfLines={1}>{pos.title}</Text></View>
                          <Text style={s.posDesc} numberOfLines={2}>{pos.desc}</Text>
                          <View style={s.posMetaRow}>
                            <Text style={s.posMeta}>{pos.qty} {pos.unit}</Text><View style={s.posDot} /><Text style={s.posMeta}>{formatEuro(pos.price)}/{pos.unit}</Text><View style={s.posDot} />
                            <View style={s.posTradeBadge}><Text style={s.posTradeText}>{pos.trade}</Text></View>
                          </View>
                        </View>
                        <Pressable onPress={() => addPhoto(pos.id)} style={({ pressed }) => [s.posPhotoBtn, { opacity: pressed ? 0.7 : 1 }]} testID={`photo-${pos.id}`}>
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
          <Pressable style={({ pressed }) => [s.finalizeBtn, { opacity: pressed ? 0.85 : 1 }]} onPress={() => setShowFinalizeConfirm(true)} testID="finalize-button">
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
        <Pressable style={s.confirmOverlay} onPress={() => setShowFinalizeConfirm(false)}>
          <View style={s.confirmCard}>
            <View style={s.confirmIconWrap}><Ionicons name="lock-closed" size={28} color={Colors.raw.amber500} /></View>
            <Text style={s.confirmTitle}>Leistungen festschreiben?</Text>
            <Text style={s.confirmDesc}>Nach dem Festschreiben k{"\u00F6"}nnen die erfassten Leistungen nicht mehr ge{"\u00E4"}ndert werden.{"\n\n"}{summary.confirmed} best{"\u00E4"}tigt {"\u00B7"} {summary.rejected} abgelehnt {"\u00B7"} {summary.unchecked} offen</Text>
            <View style={s.confirmBtns}>
              <Pressable style={({ pressed }) => [s.confirmCancelBtn, { opacity: pressed ? 0.7 : 1 }]} onPress={() => setShowFinalizeConfirm(false)}><Text style={s.confirmCancelText}>Abbrechen</Text></Pressable>
              <Pressable style={({ pressed }) => [s.confirmSubmitBtn, { opacity: pressed ? 0.85 : 1 }]} onPress={handleFinalize} disabled={finalizing} testID="confirm-finalize">
                {finalizing ? <ActivityIndicator size="small" color={Colors.raw.zinc950} /> : <Text style={s.confirmSubmitText}>Festschreiben</Text>}
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function ZwischenbegehungView() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set(["r1"]));
  const [zbStates, setZbStates] = useState<Record<string, ZBPosState>>({});
  const [finalized, setFinalized] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [loadingPrevious, setLoadingPrevious] = useState(true);
  const [previousBegehungDate, setPreviousBegehungDate] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = new URL("/api/begehungen/BL-2026-023/latest/zwischenbegehung", getApiUrl());
        const resp = await fetch(url.toString());
        if (!resp.ok) throw new Error("fetch failed");
        const data = await resp.json();
        if (cancelled || !data || !data.positions) { setLoadingPrevious(false); return; }
        const restored: Record<string, ZBPosState> = {};
        for (const pos of data.positions) {
          const parts = (pos.status || "").split(":");
          const ws = (["nicht_gestartet", "geplant", "in_arbeit"].includes(parts[0]) ? parts[0] : "nicht_gestartet") as ZBWorkStatus;
          const prog = ([0, 25, 50, 75, 100].includes(Number(parts[1])) ? Number(parts[1]) : 0) as ZBProgress;
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
  }, []);

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

  const addPhoto = useCallback((posId: string) => {
    if (finalized) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setZbStates((prev) => {
      const current = prev[posId] || { workStatus: "nicht_gestartet", progress: 0, photoCount: 0 };
      return { ...prev, [posId]: { ...current, photoCount: current.photoCount + 1 } };
    });
  }, [finalized]);

  const overallProgress = useMemo(() => {
    let totalPositions = 0;
    let sumProgress = 0;
    INITIAL_ROOMS.forEach((room) => {
      room.positions.forEach((pos) => {
        totalPositions++;
        sumProgress += (zbStates[pos.id]?.progress || 0);
      });
    });
    return totalPositions > 0 ? Math.round(sumProgress / totalPositions) : 0;
  }, [zbStates]);

  const handleFinalize = useCallback(async () => {
    setFinalizing(true);
    try {
      const positions: any[] = [];
      INITIAL_ROOMS.forEach((room) => {
        room.positions.forEach((pos) => {
          const zs = zbStates[pos.id] || { workStatus: "nicht_gestartet", progress: 0, photoCount: 0 };
          positions.push({ room_id: room.id, room_name: room.name, position_id: pos.id, position_nr: pos.nr, title: pos.title, description: pos.desc, qty: pos.qty, unit: pos.unit, price: pos.price, trade: pos.trade, status: `${zs.workStatus}:${zs.progress}`, photo_count: zs.photoCount, note: "", is_mehrleistung: false, from_catalog: false });
        });
      });
      await apiRequest("POST", "/api/begehungen", { project_id: "BL-2026-023", type: "zwischenbegehung", positions });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFinalized(true);
      setShowFinalizeConfirm(false);
    } catch (err: any) {
      Alert.alert("Fehler", "Festschreiben fehlgeschlagen: " + (err.message || "Unbekannter Fehler"));
    } finally {
      setFinalizing(false);
    }
  }, [zbStates]);

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]} testID="back-button">
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerCode}>BL-2026-023</Text>
          <Text style={s.headerTitle}>Zwischenbegehung</Text>
          <Text style={s.headerAddress}>Schillerstra{"\u00DF"}e 12, 80336 M{"\u00FC"}nchen</Text>
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
        {INITIAL_ROOMS.map((room) => {
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
                          <Pressable onPress={() => addPhoto(pos.id)} style={({ pressed }) => [s.posPhotoBtn, { opacity: pressed ? 0.7 : 1 }]} testID={`zb-photo-${pos.id}`}>
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

function AbnahmeView() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = new URL("/api/begehungen/BL-2026-023/latest/zwischenbegehung", getApiUrl());
        const resp = await fetch(url.toString());
        if (!resp.ok) throw new Error("fetch failed");
        const data = await resp.json();
        if (cancelled) return;
        if (!data || !data.positions) { setLoading(false); return; }
        const completed: AbnahmePosition[] = [];
        for (const pos of data.positions) {
          const parts = (pos.status || "").split(":");
          const prog = Number(parts[1]) || 0;
          if (prog === 100) {
            completed.push({
              id: pos.position_id,
              nr: pos.position_nr,
              title: pos.title,
              desc: pos.description || pos.desc || "",
              qty: Number(pos.qty) || 0,
              unit: pos.unit,
              price: Number(pos.price) || 0,
              trade: pos.trade,
              roomName: pos.room_name,
            });
          }
        }
        if (!cancelled) setPositions(completed);
      } catch (_e) {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleCheck = useCallback((posId: string) => {
    if (finalized) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(posId)) next.delete(posId); else next.add(posId);
      return next;
    });
  }, [finalized]);

  const addPhoto = useCallback(() => {
    if (finalized) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotos((p) => p + 1);
  }, [finalized]);

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
      const posData = positions.map((pos) => ({
        room_id: pos.id.startsWith("p") ? "r1" : "r1",
        room_name: pos.roomName,
        position_id: pos.id,
        position_nr: pos.nr,
        title: pos.title,
        description: pos.desc,
        qty: pos.qty,
        unit: pos.unit,
        price: pos.price,
        trade: pos.trade,
        status: checked.has(pos.id) ? "abgenommen" : "offen",
        photo_count: 0,
        note: "",
        is_mehrleistung: false,
        from_catalog: false,
      }));
      await apiRequest("POST", "/api/begehungen", { project_id: "BL-2026-023", type: "abnahme", positions: posData });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFinalized(true);
      setShowFinalizeConfirm(false);
    } catch (err: any) {
      Alert.alert("Fehler", "Festschreiben fehlgeschlagen: " + (err.message || "Unbekannter Fehler"));
    } finally {
      setFinalizing(false);
    }
  }, [positions, checked]);

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
      const d = line.map((p, j) => `${j === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
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
          <Pressable onPress={() => router.back()} style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}><Ionicons name="arrow-back" size={24} color={Colors.raw.white} /></Pressable>
          <View style={s.headerCenter}><Text style={s.headerCode}>BL-2026-023</Text><Text style={s.headerTitle}>Abnahme</Text><Text style={s.headerAddress}>Schillerstra{"\u00DF"}e 12, 80336 M{"\u00FC"}nchen</Text></View>
        </View>
        <View style={s.loadingWrap}><ActivityIndicator size="small" color={Colors.raw.amber500} /><Text style={s.loadingText}>Leistungen laden...</Text></View>
      </View>
    );
  }

  if (positions.length === 0) {
    return (
      <View style={s.container}>
        <View style={[s.header, { paddingTop: topInset + 8 }]}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}><Ionicons name="arrow-back" size={24} color={Colors.raw.white} /></Pressable>
          <View style={s.headerCenter}><Text style={s.headerCode}>BL-2026-023</Text><Text style={s.headerTitle}>Abnahme</Text><Text style={s.headerAddress}>Schillerstra{"\u00DF"}e 12, 80336 M{"\u00FC"}nchen</Text></View>
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
        <Pressable onPress={() => router.back()} style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]} testID="back-button">
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerCode}>BL-2026-023</Text>
          <Text style={s.headerTitle}>Abnahme</Text>
          <Text style={s.headerAddress}>Schillerstra{"\u00DF"}e 12, 80336 M{"\u00FC"}nchen</Text>
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
