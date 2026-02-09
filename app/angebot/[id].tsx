import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

type AngebotStatus = "entwurf" | "freigabe" | "freigegeben" | "versendet" | "beauftragt";

interface Position {
  nr: string;
  title: string;
  desc?: string;
  qty?: string;
  unit?: string;
  unitPrice?: string;
  total: number;
  isPauschal?: boolean;
  hasNachtrag?: boolean;
}

interface RoomGroup {
  id: string;
  icon: string;
  name: string;
  positions: Position[];
}

interface Nachtrag {
  id: string;
  nr: string;
  title: string;
  room: string;
  reason: string;
  amount: number;
  status: "offen" | "genehmigt" | "abgelehnt";
}

interface Version {
  nr: number;
  status: string;
  active: boolean;
  date?: string;
}

const STATUS_CONFIG: Record<AngebotStatus, { label: string; color: string; icon: string }> = {
  entwurf: { label: "Entwurf", color: Colors.raw.amber500, icon: "create" },
  freigabe: { label: "Zur Freigabe", color: "#3b82f6", icon: "time" },
  freigegeben: { label: "Freigegeben", color: Colors.raw.emerald500, icon: "checkmark-circle" },
  versendet: { label: "Versendet", color: "#8b5cf6", icon: "send" },
  beauftragt: { label: "Beauftragt", color: Colors.raw.emerald500, icon: "checkmark-done" },
};

const ROOMS: RoomGroup[] = [
  {
    id: "bad",
    icon: "water",
    name: "Badezimmer",
    positions: [
      { nr: "01.01", title: "Wandfliesen liefern\nund verlegen", qty: "12,5", unit: "m\u00B2", unitPrice: "54,40", total: 680 },
      { nr: "01.02", title: "Bodenfliesen liefern\nund verlegen", qty: "6,0", unit: "m\u00B2", unitPrice: "70,00", total: 420 },
      { nr: "01.03", title: "Sanit\u00E4robjekte\nmontieren", total: 1740, isPauschal: true },
    ],
  },
  {
    id: "kueche",
    icon: "restaurant",
    name: "K\u00FCche",
    positions: [
      { nr: "02.01", title: "K\u00FCchenzeile demontieren", total: 280, isPauschal: true },
      { nr: "02.02", title: "Fliesenspiegel\nliefern und verlegen", qty: "4,8", unit: "m\u00B2", unitPrice: "62,00", total: 297.6 },
      { nr: "02.03", title: "Wasseranschluss\nerneuern", total: 520, isPauschal: true },
      { nr: "02.04", title: "Elektroinstallation\nK\u00FCche", qty: "8", unit: "Stk", unitPrice: "45,00", total: 360 },
      { nr: "02.05", title: "Malerarbeiten W\u00E4nde\nund Decke", qty: "28,0", unit: "m\u00B2", unitPrice: "18,00", total: 504 },
    ],
  },
  {
    id: "wohnzimmer",
    icon: "home",
    name: "Wohnzimmer",
    positions: [
      { nr: "03.01", title: "Parkettboden schleifen\nund versiegeln", qty: "32,0", unit: "m\u00B2", unitPrice: "38,00", total: 1216 },
      { nr: "03.02", title: "Sockelleisten\nmontieren", qty: "24,0", unit: "lfm", unitPrice: "12,50", total: 300 },
      { nr: "03.03", title: "Malerarbeiten W\u00E4nde", qty: "56,0", unit: "m\u00B2", unitPrice: "16,00", total: 896 },
      { nr: "03.04", title: "Stuckdecke\nausbessern", total: 380, isPauschal: true },
      { nr: "03.05", title: "Fensterbank erneuern", qty: "3", unit: "Stk", unitPrice: "85,00", total: 255 },
      { nr: "03.06", title: "Heizkörper\nlackieren", qty: "2", unit: "Stk", unitPrice: "120,00", total: 240 },
      { nr: "03.07", title: "T\u00FCrzarge montieren", qty: "1", unit: "Stk", unitPrice: "180,00", total: 180 },
      { nr: "03.08", title: "Elektro Steckdosen\nerneuern", qty: "6", unit: "Stk", unitPrice: "38,00", total: 228 },
    ],
  },
  {
    id: "schlafzimmer",
    icon: "bed",
    name: "Schlafzimmer",
    positions: [
      { nr: "04.01", title: "Laminat verlegen", qty: "18,0", unit: "m\u00B2", unitPrice: "42,00", total: 756 },
      { nr: "04.02", title: "Malerarbeiten", qty: "38,0", unit: "m\u00B2", unitPrice: "16,00", total: 608 },
      { nr: "04.03", title: "Einbauschrank\ndemontieren", total: 180, isPauschal: true },
    ],
  },
  {
    id: "flur",
    icon: "exit",
    name: "Flur",
    positions: [
      { nr: "05.01", title: "Fliesen verlegen", qty: "8,0", unit: "m\u00B2", unitPrice: "58,00", total: 464 },
      { nr: "05.02", title: "Garderobenleiste\nmontieren", total: 95, isPauschal: true },
      { nr: "05.03", title: "Wohnungst\u00FCr\neinstellen", total: 120, isPauschal: true },
    ],
  },
  {
    id: "keller",
    icon: "layers",
    name: "Keller",
    positions: [
      { nr: "06.01", title: "Entrümpelung", total: 350, isPauschal: true },
      { nr: "06.02", title: "Kellert\u00FCr lackieren", total: 180, isPauschal: true },
      { nr: "06.03", title: "Beleuchtung\nerneuern", qty: "2", unit: "Stk", unitPrice: "65,00", total: 130 },
    ],
  },
];

const NACHTRAEGE: Nachtrag[] = [
  { id: "1", nr: "NT-001", title: "Zus\u00E4tzliche Steckdose", room: "K\u00FCche", reason: "nicht im LV", amount: 180, status: "offen" },
  { id: "2", nr: "NT-002", title: "Wasserschaden Decke", room: "Bad", reason: "Trocknung n\u00F6tig", amount: 420, status: "genehmigt" },
];

const VERSIONS: Version[] = [
  { nr: 1, status: "archiviert", active: false },
  { nr: 2, status: "aktiv", active: true, date: "05.02.2026" },
  { nr: 3, status: "Entwurf", active: false },
];

function formatEuro(amount: number): string {
  return "\u20AC" + amount.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function getRoomTotal(room: RoomGroup): number {
  return room.positions.reduce((sum, p) => sum + p.total, 0);
}

const totalPositionen = ROOMS.reduce((sum, r) => sum + r.positions.length, 0);
const totalRooms = ROOMS.length;
const lvNetto = ROOMS.reduce((sum, r) => sum + getRoomTotal(r), 0);
const nachtragTotal = NACHTRAEGE.reduce((sum, n) => sum + n.amount, 0);
const gesamtNetto = lvNetto + nachtragTotal;
const mwst = gesamtNetto * 0.19;
const gesamtBrutto = gesamtNetto + mwst;
const materialkosten = 4200;
const lohnkosten = 5824;
const ergebnis = gesamtNetto - materialkosten - lohnkosten;
const margePercent = (ergebnis / gesamtNetto) * 100;

function NachtragStatusBadge({ status }: { status: Nachtrag["status"] }) {
  const config = {
    offen: { label: "offen", color: Colors.raw.amber500 },
    genehmigt: { label: "genehmigt", color: Colors.raw.emerald500 },
    abgelehnt: { label: "abgelehnt", color: Colors.raw.rose500 },
  }[status];
  return (
    <View style={[ntStyles.badge, { backgroundColor: config.color + "18" }]}>
      <View style={[ntStyles.badgeDot, { backgroundColor: config.color }]} />
      <Text style={[ntStyles.badgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const ntStyles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.3 },
});

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
          {pos.hasNachtrag && (
            <View style={posStyles.nachtragIndicator}>
              <Ionicons name="alert-circle" size={14} color={Colors.raw.amber500} />
              <Text style={posStyles.nachtragText}>Nachtrag vorhanden</Text>
            </View>
          )}
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
  nachtragIndicator: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  nachtragText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.amber500 },
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

function MenuModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const actions = [
    { icon: "copy", label: "Duplizieren" },
    { icon: "document-text", label: "PDF erstellen" },
    { icon: "send", label: "Versenden" },
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={menuStyles.overlay} onPress={onClose}>
        <View style={menuStyles.sheet}>
          {actions.map((a, i) => (
            <Pressable
              key={a.label}
              onPress={onClose}
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

export default function AngebotScreen() {
  const { id: _id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [status] = useState<AngebotStatus>("entwurf");
  const [activeVersion, setActiveVersion] = useState(2);
  const [showMenu, setShowMenu] = useState(false);

  const statusConfig = STATUS_CONFIG[status];
  const lvBrutto = lvNetto * 1.19;

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
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.screenTitle}>Angebot</Text>
            <Text style={styles.angebotNr}>ANG-2026-003-01</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + "18" }]}>
            <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push({ pathname: "/project/[id]", params: { id: "1" } })}
          style={({ pressed }) => [styles.projectBar, { opacity: pressed ? 0.85 : 1 }]}
          testID="project-link"
        >
          <View style={styles.projectBarLeft}>
            <Ionicons name="clipboard" size={16} color={Colors.raw.amber500} />
            <Text style={styles.projectBarCode}>BL-2026-003</Text>
            <View style={styles.projectDot} />
            <Text style={styles.projectBarName}>Schwentnerring 13c</Text>
          </View>
          <View style={styles.projectBarRight}>
            <Text style={styles.projectBarClient}>SAGA GWG</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.raw.zinc500} />
          </View>
        </Pressable>

        <View style={styles.summenCard} testID="summen-hero">
          <Text style={styles.summenLabel}>Angebotssumme</Text>
          <Text style={styles.summenNetto}>{formatEuro(lvNetto)} netto</Text>
          <Text style={styles.summenBrutto}>{formatEuro(lvBrutto)} brutto</Text>
          <View style={styles.summenMeta}>
            <Text style={styles.summenMetaText}>{totalPositionen} Positionen \u2022 {totalRooms} R\u00E4ume</Text>
            <View style={styles.margeBadge}>
              <Text style={styles.margeText}>Marge: {margePercent.toFixed(0)}% ({formatEuro(ergebnis)})</Text>
              <View style={[styles.margeDot, { backgroundColor: margePercent >= 20 ? Colors.raw.emerald500 : margePercent >= 10 ? Colors.raw.amber500 : Colors.raw.rose500 }]} />
            </View>
          </View>
        </View>

        <View style={styles.versionSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.versionScroll}>
            {VERSIONS.map((v) => (
              <Pressable
                key={v.nr}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                  setActiveVersion(v.nr);
                }}
                style={[
                  styles.versionPill,
                  activeVersion === v.nr && styles.versionPillActive,
                ]}
              >
                <Text style={[styles.versionPillText, activeVersion === v.nr && styles.versionPillTextActive]}>
                  v{v.nr}{v.active ? " \u2190aktiv" : v.status === "Entwurf" ? " Entwurf" : ""}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {VERSIONS.find((v) => v.nr === activeVersion)?.date && (
            <Text style={styles.versionDate}>v{activeVersion} freigegeben am {VERSIONS.find((v) => v.nr === activeVersion)!.date}</Text>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Positionen</Text>
          <Text style={styles.sectionCount}>{totalPositionen}</Text>
        </View>
        {ROOMS.map((room, i) => (
          <RoomAccordion key={room.id} room={room} defaultOpen={i === 0} />
        ))}

        {NACHTRAEGE.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 28 }]}>
              <Text style={styles.sectionTitle}>Nachtr\u00E4ge</Text>
              <View style={styles.nachtragCount}>
                <Text style={styles.nachtragCountText}>{NACHTRAEGE.length}</Text>
              </View>
            </View>
            <View style={styles.nachtragList}>
              {NACHTRAEGE.map((nt) => (
                <View key={nt.id} style={styles.nachtragRow}>
                  <View style={styles.nachtragContent}>
                    <View style={styles.nachtragTop}>
                      <Text style={styles.nachtragNr}>{nt.nr}</Text>
                      <Text style={styles.nachtragTitle}>{nt.title}</Text>
                    </View>
                    <Text style={styles.nachtragMeta}>{nt.room}, {nt.reason}</Text>
                  </View>
                  <View style={styles.nachtragRight}>
                    <Text style={styles.nachtragAmount}>+{formatEuro(nt.amount)}</Text>
                    <NachtragStatusBadge status={nt.status} />
                  </View>
                </View>
              ))}
              <View style={styles.nachtragSumRow}>
                <Text style={styles.nachtragSumLabel}>Nachtr\u00E4ge gesamt:</Text>
                <Text style={styles.nachtragSumAmount}>+{formatEuro(nachtragTotal)}</Text>
              </View>
            </View>
          </>
        )}

        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <Text style={styles.sectionTitle}>Kosten\u00FCbersicht</Text>
        </View>
        <View style={styles.kostenCard} testID="kosten-card">
          <View style={styles.kostenRow}>
            <Text style={styles.kostenLabel}>Angebot (LV)</Text>
            <Text style={styles.kostenValue}>{formatEuro(lvNetto)}</Text>
          </View>
          <View style={styles.kostenRow}>
            <Text style={styles.kostenLabel}>Nachtr\u00E4ge</Text>
            <Text style={styles.kostenValue}>{formatEuro(nachtragTotal)}</Text>
          </View>
          <View style={styles.kostenDivider} />
          <View style={styles.kostenRow}>
            <Text style={styles.kostenLabelBold}>Gesamt netto</Text>
            <Text style={styles.kostenValueBold}>{formatEuro(gesamtNetto)}</Text>
          </View>
          <View style={styles.kostenRow}>
            <Text style={styles.kostenLabel}>MwSt 19%</Text>
            <Text style={styles.kostenValue}>{formatEuro(mwst)}</Text>
          </View>
          <View style={styles.kostenDivider} />
          <View style={styles.kostenRow}>
            <Text style={styles.kostenLabelBold}>Gesamt brutto</Text>
            <Text style={styles.kostenValueBold}>{formatEuro(gesamtBrutto)}</Text>
          </View>

          <View style={styles.kostenSpacer} />

          <View style={styles.kostenRow}>
            <Text style={styles.kostenLabel}>Materialkosten</Text>
            <Text style={styles.kostenValue}>{formatEuro(materialkosten)}</Text>
          </View>
          <View style={styles.kostenRow}>
            <Text style={styles.kostenLabel}>Lohnkosten</Text>
            <Text style={styles.kostenValue}>{formatEuro(lohnkosten)}</Text>
          </View>
          <View style={styles.kostenDivider} />
          <View style={styles.kostenRow}>
            <Text style={styles.kostenLabelBold}>Ergebnis</Text>
            <Text style={styles.kostenValueBold}>{formatEuro(ergebnis)}</Text>
          </View>
          <View style={styles.kostenRow}>
            <Text style={styles.kostenLabel}>Marge</Text>
            <View style={styles.margeRow}>
              <Text style={styles.kostenValueBold}>{margePercent.toFixed(1)}%</Text>
              <View style={[styles.margeDotLarge, { backgroundColor: margePercent >= 20 ? Colors.raw.emerald500 : margePercent >= 10 ? Colors.raw.amber500 : Colors.raw.rose500 }]} />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.stickyActions, { paddingBottom: bottomInset + 12 }]}>
        {status === "entwurf" && (
          <>
            <Pressable onPress={() => router.push({ pathname: "/angebot/editor", params: { offerId: params.id } })} style={({ pressed }) => [styles.actionOutline, { flex: 1, opacity: pressed ? 0.85 : 1 }]}>
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
            <Pressable style={({ pressed }) => [styles.actionOutline, { flex: 1, opacity: pressed ? 0.85 : 1 }]}>
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

      <MenuModal visible={showMenu} onClose={() => setShowMenu(false)} />
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
  projectBarLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  projectBarCode: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.white },
  projectDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.raw.zinc600 },
  projectBarName: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc300 },
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
  margeText: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.emerald500 },
  margeDot: { width: 8, height: 8, borderRadius: 4 },

  versionSection: { marginBottom: 24 },
  versionScroll: { gap: 8 },
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
  versionDate: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginTop: 8, marginLeft: 4 },

  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 20, color: Colors.raw.white },
  sectionCount: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.zinc500, backgroundColor: Colors.raw.zinc800, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },

  nachtragCount: { backgroundColor: Colors.raw.amber500, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  nachtragCountText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#000" },
  nachtragList: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    overflow: "hidden",
  },
  nachtragRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderLeftWidth: 3,
    borderLeftColor: Colors.raw.amber500,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  nachtragContent: { flex: 1, marginRight: 12 },
  nachtragTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  nachtragNr: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 12, color: Colors.raw.zinc500 },
  nachtragTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.white },
  nachtragMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500 },
  nachtragRight: { alignItems: "flex-end", gap: 6 },
  nachtragAmount: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.amber500 },
  nachtragSumRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: Colors.raw.zinc800 + "60",
  },
  nachtragSumLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc400 },
  nachtragSumAmount: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.amber500 },

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
