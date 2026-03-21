import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useState, useMemo } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useOfferWithSections } from "@/hooks/queries/useOffers";
import type { OfferWithSections, OfferSection, OfferPositionRow } from "@/lib/api/offers";

// ── Status-Mapping: DB-Status → UI ──

type AngebotStatus = "entwurf" | "freigabe" | "freigegeben" | "versendet" | "beauftragt";

function mapStatus(dbStatus: string): AngebotStatus {
  switch (dbStatus) {
    case "DRAFT": return "entwurf";
    case "SENT": return "versendet";
    case "APPROVED":
    case "ACCEPTED": return "beauftragt";
    case "REVIEW": return "freigabe";
    default: return "entwurf";
  }
}

const STATUS_CONFIG: Record<AngebotStatus, { label: string; color: string; icon: string }> = {
  entwurf: { label: "Entwurf", color: Colors.raw.amber500, icon: "create" },
  freigabe: { label: "Zur Freigabe", color: "#3b82f6", icon: "time" },
  freigegeben: { label: "Freigegeben", color: Colors.raw.emerald500, icon: "checkmark-circle" },
  versendet: { label: "Versendet", color: "#8b5cf6", icon: "send" },
  beauftragt: { label: "Beauftragt", color: Colors.raw.emerald500, icon: "checkmark-done" },
};

// ── Types für Darstellung ──

interface Position {
  nr: string;
  title: string;
  desc?: string;
  qty?: string;
  unit?: string;
  unitPrice?: string;
  total: number;
  isPauschal?: boolean;
}

interface RoomGroup {
  id: string;
  icon: string;
  name: string;
  positions: Position[];
}

function formatEuro(amount: number): string {
  return "\u20AC" + amount.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function getRoomTotal(room: RoomGroup): number {
  return room.positions.reduce((sum, p) => sum + p.total, 0);
}

function tradeToIcon(trade: string | null): string {
  switch (trade) {
    case "Sanitär": return "water";
    case "Maler": return "color-palette";
    case "Elektro": return "flash";
    case "Fliesen": return "grid";
    case "Boden": return "layers";
    case "Tischler": return "construct";
    default: return "cube";
  }
}

/** Konvertiert DB-Sections+Positionen in die RoomGroup-Darstellung */
function sectionsToRooms(sections: (OfferSection & { positions: OfferPositionRow[] })[]): RoomGroup[] {
  return sections.map((sec) => ({
    id: sec.id,
    icon: tradeToIcon(sec.trade),
    name: sec.title,
    positions: sec.positions.map((p, idx) => {
      const ep = p.unit_price * (1 + p.surcharge_profit_percent / 100);
      const total = ep * p.quantity;
      const isPauschal = p.unit?.toLowerCase() === "psch" || p.unit?.toLowerCase() === "pauschal";
      return {
        nr: `${String(sec.section_number).padStart(2, "0")}.${String(idx + 1).padStart(2, "0")}`,
        title: p.title,
        desc: p.long_text ?? p.description ?? undefined,
        qty: isPauschal ? undefined : p.quantity.toString().replace(".", ","),
        unit: isPauschal ? undefined : p.unit,
        unitPrice: isPauschal ? undefined : ep.toFixed(2).replace(".", ","),
        total,
        isPauschal,
      };
    }),
  }));
}

// ── Sub-Components ──

function PositionRow({ pos, expanded, onToggle }: { pos: Position; expanded: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={({ pressed }) => [posStyles.row, { opacity: pressed ? 0.85 : 1 }]}>
      <View style={posStyles.rowMain}>
        <Text style={posStyles.nr}>{pos.nr}</Text>
        <View style={posStyles.mid}>
          <Text style={posStyles.title}>{pos.title}</Text>
          {!expanded && (
            <Text style={posStyles.qty}>
              {pos.isPauschal ? "Pauschal" : `${pos.qty} ${pos.unit} \u00D7 \u20AC${pos.unitPrice}/${pos.unit}`}
            </Text>
          )}
        </View>
        <Text style={posStyles.total}>{formatEuro(pos.total)}</Text>
      </View>
      {expanded && (
        <View style={posStyles.expanded}>
          <Text style={posStyles.qty}>
            {pos.isPauschal ? "Pauschal" : `${pos.qty} ${pos.unit} \u00D7 \u20AC${pos.unitPrice}/${pos.unit}`}
          </Text>
          {pos.desc && <Text style={posStyles.descFull}>{pos.desc}</Text>}
        </View>
      )}
    </Pressable>
  );
}

const posStyles = StyleSheet.create({
  row: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.raw.zinc800 + "80" },
  rowMain: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  nr: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 12, color: Colors.raw.zinc500, width: 38, paddingTop: 2 },
  mid: { flex: 1 },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.white, lineHeight: 20 },
  qty: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginTop: 3 },
  total: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.white, minWidth: 75, textAlign: "right" },
  expanded: { marginTop: 10, marginLeft: 48, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.raw.zinc800 },
  descFull: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc400, marginTop: 6, lineHeight: 19 },
});

function RoomAccordion({ room, defaultOpen }: { room: RoomGroup; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [expandedPos, setExpandedPos] = useState<string | null>(null);
  const total = getRoomTotal(room);

  return (
    <View style={accordStyles.container}>
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") Haptics.selectionAsync();
          setOpen(!open);
        }}
        style={({ pressed }) => [accordStyles.header, { opacity: pressed ? 0.85 : 1 }]}
        testID={`room-${room.id}`}
      >
        <View style={accordStyles.headerLeft}>
          <View style={accordStyles.iconWrap}>
            <Ionicons name={room.icon as any} size={18} color={Colors.raw.amber500} />
          </View>
          <Text style={accordStyles.roomName}>{room.name}</Text>
        </View>
        <View style={accordStyles.headerRight}>
          <Text style={accordStyles.meta}>{room.positions.length} Pos. \u2022 {formatEuro(total)}</Text>
          <Ionicons name={open ? "chevron-down" : "chevron-forward"} size={18} color={Colors.raw.zinc500} />
        </View>
      </Pressable>
      {open && (
        <View style={accordStyles.body}>
          {room.positions.map((pos) => (
            <PositionRow
              key={pos.nr}
              pos={pos}
              expanded={expandedPos === pos.nr}
              onToggle={() => setExpandedPos(expandedPos === pos.nr ? null : pos.nr)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const accordStyles = StyleSheet.create({
  container: { marginBottom: 2 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.raw.zinc900,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.raw.amber500 + "14", alignItems: "center", justifyContent: "center" },
  roomName: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.white },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  meta: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.raw.zinc400 },
  body: {
    backgroundColor: Colors.raw.zinc900,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    marginTop: -2,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Colors.raw.zinc800,
    overflow: "hidden",
  },
});

function MenuModal({ visible, onClose, offerId }: { visible: boolean; onClose: () => void; offerId: string }) {
  const actions = [
    { icon: "create", label: "Bearbeiten", action: () => { onClose(); router.push({ pathname: "/angebot/editor", params: { offerId } }); } },
    { icon: "copy", label: "Duplizieren", action: onClose },
    { icon: "document-text", label: "PDF erstellen", action: onClose },
    { icon: "send", label: "Versenden", action: onClose },
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={menuStyles.overlay} onPress={onClose}>
        <View style={menuStyles.sheet}>
          {actions.map((a, i) => (
            <Pressable
              key={a.label}
              onPress={a.action}
              style={({ pressed }) => [
                menuStyles.item,
                i < actions.length - 1 && menuStyles.itemBorder,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons name={a.icon as any} size={20} color={Colors.raw.white} />
              <Text style={menuStyles.itemText}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const menuStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-start", alignItems: "flex-end", paddingTop: 100, paddingRight: 20 },
  sheet: { backgroundColor: Colors.raw.zinc800, borderRadius: 16, minWidth: 200, overflow: "hidden" },
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16, paddingHorizontal: 20 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.raw.zinc700 },
  itemText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.raw.white },
});

// ── Main Screen ──

export default function AngebotScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: offer, isLoading, error } = useOfferWithSections(id);
  const [showMenu, setShowMenu] = useState(false);

  // Aus DB-Daten ableiten
  const status = offer ? mapStatus(offer.status) : "entwurf";
  const statusConfig = STATUS_CONFIG[status];

  const rooms = useMemo(() => {
    if (!offer?.sections) return [];
    return sectionsToRooms(offer.sections);
  }, [offer?.sections]);

  const totalPositionen = useMemo(() => rooms.reduce((s, r) => s + r.positions.length, 0), [rooms]);
  const totalRooms = rooms.length;

  // Netto aus DB oder aus Positionen berechnen
  const lvNetto = useMemo(() => {
    if (offer?.total_net && offer.total_net > 0) return offer.total_net;
    return rooms.reduce((s, r) => s + getRoomTotal(r), 0);
  }, [offer?.total_net, rooms]);

  const mwst = lvNetto * 0.19;
  const brutto = lvNetto + mwst;

  // Marge: geschätzt 66% Kosten (bis echte Kostendaten vorliegen)
  const estimatedCost = lvNetto * 0.66;
  const ergebnis = lvNetto - estimatedCost;
  const margePercent = lvNetto > 0 ? (ergebnis / lvNetto) * 100 : 0;

  // Adresse zusammenbauen
  const address = [offer?.object_street, [offer?.object_zip, offer?.object_city].filter(Boolean).join(" ")].filter(Boolean).join(", ");

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.raw.amber500} />
        <Text style={{ fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.raw.zinc500, marginTop: 12 }}>Angebot laden...</Text>
      </View>
    );
  }

  if (error || !offer) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", paddingHorizontal: 40 }]}>
        <Ionicons name="warning" size={48} color={Colors.raw.rose500} />
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.raw.white, marginTop: 12, textAlign: "center" }}>
          Angebot nicht gefunden
        </Text>
        <Pressable onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, marginTop: 20 })}>
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.raw.amber500 }}>Zurück</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.7 : 1 }]}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => setShowMenu(true)}
          style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.7 : 1 }]}
          testID="menu-button"
        >
          <Ionicons name="ellipsis-vertical" size={22} color={Colors.raw.white} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 60, paddingBottom: bottomInset + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Titel + Status */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.screenTitle}>Angebot</Text>
            <Text style={styles.angebotNr}>{offer.offer_number}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + "18" }]}>
            <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
        </View>

        {/* Projekt-Info */}
        <Pressable
          onPress={() => router.push({ pathname: "/project/[id]", params: { id: offer.project_id } })}
          style={({ pressed }) => [styles.projectBar, { opacity: pressed ? 0.85 : 1 }]}
          testID="project-link"
        >
          <View style={styles.projectBarLeft}>
            <Ionicons name="clipboard" size={16} color={Colors.raw.amber500} />
            <Text style={styles.projectBarCode}>{offer.project_number || "—"}</Text>
            <View style={styles.projectDot} />
            <Text style={styles.projectBarName} numberOfLines={1}>{offer.object_street || offer.project_name || "—"}</Text>
          </View>
          <View style={styles.projectBarRight}>
            <Text style={styles.projectBarClient}>{offer.client_name}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.raw.zinc500} />
          </View>
        </Pressable>

        {/* Summen-Hero */}
        <View style={styles.summenCard} testID="summen-hero">
          <Text style={styles.summenLabel}>Angebotssumme</Text>
          <Text style={styles.summenNetto}>{formatEuro(lvNetto)} netto</Text>
          <Text style={styles.summenBrutto}>{formatEuro(brutto)} brutto</Text>
          <View style={styles.summenMeta}>
            <Text style={styles.summenMetaText}>{totalPositionen} Positionen \u2022 {totalRooms} Titel</Text>
            <View style={styles.margeBadge}>
              <Text style={[styles.margeText, { color: margePercent >= 25 ? Colors.raw.emerald500 : margePercent >= 15 ? Colors.raw.amber500 : Colors.raw.rose500 }]}>
                Marge: {margePercent.toFixed(0)}%
              </Text>
              <View style={[styles.margeDot, { backgroundColor: margePercent >= 25 ? Colors.raw.emerald500 : margePercent >= 15 ? Colors.raw.amber500 : Colors.raw.rose500 }]} />
            </View>
          </View>
        </View>

        {/* Version */}
        <View style={styles.versionSection}>
          <View style={[styles.versionPill, styles.versionPillActive]}>
            <Text style={[styles.versionPillText, styles.versionPillTextActive]}>
              v{offer.version} {status === "entwurf" ? "Entwurf" : "\u2190aktiv"}
            </Text>
          </View>
        </View>

        {/* Positionen */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Positionen</Text>
          <Text style={styles.sectionCount}>{totalPositionen}</Text>
        </View>
        {rooms.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={32} color={Colors.raw.zinc600} />
            <Text style={styles.emptyText}>Noch keine Positionen</Text>
          </View>
        ) : (
          rooms.map((room, i) => (
            <RoomAccordion key={room.id} room={room} defaultOpen={i === 0} />
          ))
        )}

        {/* Kostenübersicht */}
        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <Text style={styles.sectionTitle}>Kosten\u00FCbersicht</Text>
        </View>
        <View style={styles.kostenCard} testID="kosten-card">
          <View style={styles.kostenRow}>
            <Text style={styles.kostenLabelBold}>Gesamt netto</Text>
            <Text style={styles.kostenValueBold}>{formatEuro(lvNetto)}</Text>
          </View>
          <View style={styles.kostenRow}>
            <Text style={styles.kostenLabel}>MwSt 19%</Text>
            <Text style={styles.kostenValue}>{formatEuro(mwst)}</Text>
          </View>
          <View style={styles.kostenDivider} />
          <View style={styles.kostenRow}>
            <Text style={styles.kostenLabelBold}>Gesamt brutto</Text>
            <Text style={styles.kostenValueBold}>{formatEuro(brutto)}</Text>
          </View>

          <View style={styles.kostenSpacer} />

          <View style={styles.kostenRow}>
            <Text style={styles.kostenLabel}>Marge (gesch.)</Text>
            <View style={styles.margeRow}>
              <Text style={styles.kostenValueBold}>{margePercent.toFixed(1)}%</Text>
              <View style={[styles.margeDotLarge, { backgroundColor: margePercent >= 25 ? Colors.raw.emerald500 : margePercent >= 15 ? Colors.raw.amber500 : Colors.raw.rose500 }]} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Actions */}
      <View style={[styles.stickyActions, { paddingBottom: bottomInset + 12 }]}>
        {status === "entwurf" && (
          <>
            <Pressable
              onPress={() => router.push({ pathname: "/angebot/editor", params: { offerId: id } })}
              style={({ pressed }) => [styles.actionOutline, { flex: 1, opacity: pressed ? 0.85 : 1 }]}
            >
              <Feather name="edit-2" size={18} color={Colors.raw.amber500} />
              <Text style={styles.actionOutlineText}>Bearbeiten</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.actionPrimary, { flex: 1, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
              <Ionicons name="checkmark-circle" size={18} color="#000" />
              <Text style={styles.actionPrimaryText}>Zur Freigabe</Text>
            </Pressable>
          </>
        )}
        {status === "freigabe" && (
          <>
            <Pressable
              onPress={() => router.push({ pathname: "/angebot/editor", params: { offerId: id } })}
              style={({ pressed }) => [styles.actionOutline, { flex: 1, opacity: pressed ? 0.85 : 1 }]}
            >
              <Feather name="edit-2" size={18} color={Colors.raw.amber500} />
              <Text style={styles.actionOutlineText}>Anpassen</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.actionPrimary, { flex: 1, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
              <Ionicons name="send" size={16} color="#000" />
              <Text style={styles.actionPrimaryText}>Freigeben & Senden</Text>
            </Pressable>
          </>
        )}
        {(status === "freigegeben" || status === "versendet" || status === "beauftragt") && (
          <>
            <Pressable style={({ pressed }) => [styles.actionOutline, { opacity: pressed ? 0.85 : 1 }]}>
              <Ionicons name="document-text" size={18} color={Colors.raw.amber500} />
              <Text style={styles.actionOutlineText}>PDF</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.actionOutline, { opacity: pressed ? 0.85 : 1 }]}>
              <Ionicons name="mail" size={18} color={Colors.raw.amber500} />
              <Text style={styles.actionOutlineText}>Erneut senden</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.actionOutline, { opacity: pressed ? 0.85 : 1 }]}>
              <Ionicons name="copy" size={18} color={Colors.raw.amber500} />
              <Text style={styles.actionOutlineText}>Duplizieren</Text>
            </Pressable>
          </>
        )}
      </View>

      <MenuModal visible={showMenu} onClose={() => setShowMenu(false)} offerId={id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: Colors.raw.zinc950 + "E6",
  },
  headerBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  screenTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 28, color: Colors.raw.white, marginBottom: 4 },
  angebotNr: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 14, color: Colors.raw.zinc400 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 4,
  },
  statusText: { fontFamily: "Inter_700Bold", fontSize: 12 },

  projectBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  projectBarLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  projectBarCode: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.white },
  projectDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.raw.zinc600 },
  projectBarName: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc300, flex: 1 },
  projectBarRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  projectBarClient: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.raw.zinc500 },

  summenCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 24,
    marginBottom: 20,
  },
  summenLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  summenNetto: { fontFamily: "Inter_800ExtraBold", fontSize: 32, color: Colors.raw.white, marginBottom: 4 },
  summenBrutto: { fontFamily: "Inter_500Medium", fontSize: 16, color: Colors.raw.zinc400, marginBottom: 18 },
  summenMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  summenMetaText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc400 },
  margeBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  margeText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  margeDot: { width: 8, height: 8, borderRadius: 4 },

  versionSection: { marginBottom: 24, flexDirection: "row" },
  versionPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.raw.zinc900,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
  },
  versionPillActive: { backgroundColor: Colors.raw.amber500, borderColor: Colors.raw.amber500 },
  versionPillText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc400 },
  versionPillTextActive: { color: "#000" },

  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 20, color: Colors.raw.white },
  sectionCount: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.zinc500, backgroundColor: Colors.raw.zinc800, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },

  emptyCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 40,
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc500 },

  kostenCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginBottom: 8,
  },
  kostenRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 9 },
  kostenLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc400 },
  kostenValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc300 },
  kostenLabelBold: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.white },
  kostenValueBold: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.white },
  kostenDivider: { height: 1, backgroundColor: Colors.raw.zinc700, marginVertical: 6 },
  kostenSpacer: { height: 16 },
  margeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  margeDotLarge: { width: 10, height: 10, borderRadius: 5 },

  stickyActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: Colors.raw.zinc950 + "F2",
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
  },
  actionOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.amber500,
  },
  actionOutlineText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.amber500 },
  actionPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: Colors.raw.amber500,
  },
  actionPrimaryText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#000" },
});
