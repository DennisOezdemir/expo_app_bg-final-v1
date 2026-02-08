import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
} from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { useState, useCallback } from "react";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { TopBar } from "@/components/TopBar";
import { useOffline } from "@/contexts/OfflineContext";
import { OfflineBadge, OfflineBlockedHint } from "@/components/OfflineBanner";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const RING_SIZE = 150;
const STROKE_WIDTH = 12;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ProgressRing({
  percent,
  color,
  label,
  sublabel,
}: {
  percent: number;
  color: string;
  label: string;
  sublabel: string;
}) {
  const strokeDashoffset = CIRCUMFERENCE * (1 - percent / 100);
  return (
    <View style={ringStyles.wrapper}>
      <View style={ringStyles.container}>
        <Svg width={RING_SIZE} height={RING_SIZE} style={ringStyles.svg}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={Colors.raw.zinc800}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>
        <View style={ringStyles.center}>
          <Text style={[ringStyles.value, { color }]}>{percent}%</Text>
        </View>
      </View>
      <Text style={ringStyles.label}>{label}</Text>
      <Text style={ringStyles.sublabel}>{sublabel}</Text>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    paddingVertical: 8,
  },
  container: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  svg: {
    position: "absolute",
  },
  center: {
    alignItems: "center",
  },
  value: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 40,
    lineHeight: 44,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.zinc400,
    marginBottom: 4,
  },
  sublabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.rose400,
  },
});

type MaterialStatus = "offen" | "fertig" | "bestellt";

interface MaterialItem {
  id: string;
  name: string;
  unit: string;
  price: string;
  status: MaterialStatus;
  supplier?: string;
}

interface Trade {
  id: string;
  name: string;
  icon: string;
  iconSet: "ionicons" | "material";
  totalMaterials: number;
  openCount: number;
  progress: number;
  statusColor: string;
  materials: MaterialItem[];
}

const TRADES: Trade[] = [
  {
    id: "1",
    name: "Maler",
    icon: "color-palette",
    iconSet: "ionicons",
    totalMaterials: 120,
    openCount: 22,
    progress: 82,
    statusColor: Colors.raw.rose500,
    materials: [
      { id: "m1", name: "Dispersionsfarbe", unit: "10L Eimer", price: "\u20AC42,90", status: "fertig", supplier: "MEGA" },
      { id: "m2", name: "Vliesraufaser", unit: "Rolle 25m", price: "\u20AC18,50", status: "offen" },
      { id: "m3", name: "Vlieskleber", unit: "Eimer 16kg", price: "\u20AC32,40", status: "offen" },
      { id: "m4", name: "Tiefengrund", unit: "10L Kanister", price: "\u20AC28,90", status: "bestellt", supplier: "Weber" },
      { id: "m5", name: "Acryl weiss", unit: "Kartusche 310ml", price: "\u20AC4,20", status: "fertig", supplier: "MEGA" },
      { id: "m6", name: "Abdeckfolie", unit: "Rolle 50m\u00B2", price: "\u20AC12,80", status: "offen" },
    ],
  },
  {
    id: "2",
    name: "Sanitär",
    icon: "water",
    iconSet: "ionicons",
    totalMaterials: 28,
    openCount: 0,
    progress: 100,
    statusColor: Colors.raw.emerald500,
    materials: [
      { id: "s1", name: "Kupferrohr 15mm", unit: "3m Stange", price: "\u20AC18,40", status: "fertig", supplier: "Schmidt" },
      { id: "s2", name: "Fitting-Set", unit: "20er Pack", price: "\u20AC34,90", status: "fertig", supplier: "Weber" },
    ],
  },
  {
    id: "3",
    name: "Boden",
    icon: "layers",
    iconSet: "ionicons",
    totalMaterials: 12,
    openCount: 5,
    progress: 58,
    statusColor: Colors.raw.amber500,
    materials: [
      { id: "b1", name: "Vinyl Designboden", unit: "Paket 2,5m\u00B2", price: "\u20AC67,90", status: "bestellt", supplier: "Brillux" },
      { id: "b2", name: "Trittschalldämmung", unit: "Rolle 15m\u00B2", price: "\u20AC24,50", status: "offen" },
      { id: "b3", name: "Sockelleiste", unit: "2,4m Stück", price: "\u20AC8,90", status: "offen" },
    ],
  },
];

const STATUS_CONFIG: Record<MaterialStatus, { label: string; color: string; icon: string }> = {
  fertig: { label: "", color: Colors.raw.emerald500, icon: "checkmark-circle" },
  offen: { label: "offen", color: Colors.raw.amber500, icon: "alert-circle" },
  bestellt: { label: "bestellt", color: "#3b82f6", icon: "cart" },
};

type FilterKey = "alle" | "offen" | "fertig" | "bestellt";
const FILTERS: { key: FilterKey; label: string; dotColor?: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "offen", label: "Offen", dotColor: Colors.raw.amber500 },
  { key: "fertig", label: "Fertig", dotColor: Colors.raw.emerald500 },
  { key: "bestellt", label: "Bestellt", dotColor: "#3b82f6" },
];

function MaterialRow({ item }: { item: MaterialItem }) {
  const cfg = STATUS_CONFIG[item.status];
  return (
    <View style={matStyles.row}>
      <View style={matStyles.rowLeft}>
        <Text style={matStyles.matName}>{item.name}</Text>
        <Text style={matStyles.matUnit}>
          {item.unit} {"\u2022"} {item.price}
        </Text>
      </View>
      <View style={matStyles.rowRight}>
        {item.status === "fertig" && item.supplier ? (
          <View style={[matStyles.statusPill, { backgroundColor: cfg.color + "18" }]}>
            <Ionicons name="checkmark-circle" size={14} color={cfg.color} />
            <Text style={[matStyles.statusText, { color: cfg.color }]}>{item.supplier}</Text>
          </View>
        ) : item.status === "bestellt" ? (
          <View style={[matStyles.statusPill, { backgroundColor: cfg.color + "18" }]}>
            <Ionicons name="cart" size={14} color={cfg.color} />
            <Text style={[matStyles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        ) : (
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push({ pathname: "/assign-material", params: { name: item.name } });
            }}
            style={({ pressed }) => [matStyles.assignBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={matStyles.assignText}>Zuordnen</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.raw.amber500} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const matStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  rowLeft: {
    flex: 1,
    marginRight: 12,
  },
  matName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.white,
    marginBottom: 3,
  },
  matUnit: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  rowRight: {
    alignItems: "flex-end",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  assignBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  assignText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.amber500,
  },
});

function TradeCard({ trade, defaultOpen, filter }: { trade: Trade; defaultOpen?: boolean; filter: FilterKey }) {
  const [open, setOpen] = useState(defaultOpen || false);
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const filteredMaterials = filter === "alle"
    ? trade.materials
    : trade.materials.filter((m) => m.status === filter);

  return (
    <AnimatedPressable
      style={[tradeStyles.card, animStyle]}
      onPressIn={() => { scale.value = withSpring(0.98, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setOpen(!open);
      }}
    >
      <View style={tradeStyles.header}>
        <View style={tradeStyles.headerLeft}>
          <Ionicons name={trade.icon as any} size={22} color={Colors.raw.amber500} />
          <Text style={tradeStyles.tradeName}>{trade.name}</Text>
        </View>
        <View style={tradeStyles.headerRight}>
          {trade.openCount > 0 ? (
            <View style={[tradeStyles.openBadge, { backgroundColor: trade.statusColor + "18" }]}>
              <View style={[tradeStyles.openDot, { backgroundColor: trade.statusColor }]} />
              <Text style={[tradeStyles.openText, { color: trade.statusColor }]}>
                {trade.openCount} offen
              </Text>
            </View>
          ) : (
            <Ionicons name="checkmark-circle" size={20} color={Colors.raw.emerald500} />
          )}
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={18}
            color={Colors.raw.zinc500}
          />
        </View>
      </View>

      <View style={tradeStyles.meta}>
        <Text style={tradeStyles.metaText}>{trade.totalMaterials} Materialien</Text>
      </View>

      <View style={tradeStyles.progressRow}>
        <View style={tradeStyles.progressBg}>
          <View
            style={[
              tradeStyles.progressFill,
              {
                width: `${trade.progress}%`,
                backgroundColor: trade.progress === 100 ? Colors.raw.emerald500 : Colors.raw.amber500,
              },
            ]}
          />
        </View>
        <Text style={tradeStyles.progressText}>{trade.progress}%</Text>
      </View>

      {open && (
        <View style={tradeStyles.materialsSection}>
          {filteredMaterials.length === 0 ? (
            <View style={tradeStyles.emptyMat}>
              <Text style={tradeStyles.emptyMatText}>Keine Materialien für diesen Filter</Text>
            </View>
          ) : (
            filteredMaterials.map((m) => <MaterialRow key={m.id} item={m} />)
          )}
        </View>
      )}
    </AnimatedPressable>
  );
}

const tradeStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    overflow: "hidden",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tradeName: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  openBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  openDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  openText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  meta: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 10,
  },
  metaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 10,
  },
  progressBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.raw.zinc800,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.raw.zinc400,
    minWidth: 36,
    textAlign: "right",
  },
  materialsSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
  },
  emptyMat: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyMatText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc600,
  },
});

export default function MaterialScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 84 : 90;
  const { isOnline, getCacheAge } = useOffline();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("alle");

  const cartCount = 5;
  const cartTotal = "\u20AC709";

  return (
    <View style={styles.container}>
      <TopBar hasNotification />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 64,
            paddingBottom: bottomInset + 70,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={styles.headerTitle}>Material</Text>
                {!isOnline && <OfflineBadge cacheAge={getCacheAge("material")} />}
              </View>
              <Text style={styles.headerSubtitle}>
                BL-2026-003 {"\u2022"} Schwentnerring
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/bestellung" as any)}
              style={({ pressed }) => [styles.cartButton, { opacity: pressed ? 0.7 : 1 }]}
              testID="cart-button"
            >
              <Ionicons name="cart" size={22} color={Colors.raw.zinc400} />
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.heroCard}>
          <ProgressRing
            percent={26}
            color={Colors.raw.amber500}
            label="42 von 160 zugeordnet"
            sublabel="118 brauchen dich"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
          style={styles.chipsScroll}
        >
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setActiveFilter(f.key);
              }}
              style={[
                styles.chip,
                activeFilter === f.key ? styles.chipActive : styles.chipInactive,
              ]}
            >
              {f.dotColor && activeFilter !== f.key && (
                <View style={[styles.chipDot, { backgroundColor: f.dotColor }]} />
              )}
              <Text
                style={[
                  styles.chipText,
                  activeFilter === f.key ? styles.chipTextActive : styles.chipTextInactive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.tradesSection}>
          <Text style={styles.sectionTitle}>Gewerke</Text>
          {TRADES.map((trade, i) => (
            <TradeCard
              key={trade.id}
              trade={trade}
              defaultOpen={i === 0}
              filter={activeFilter}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 8 }]}>
        {!isOnline && (
          <View style={{ marginBottom: 8 }}>
            <OfflineBlockedHint message="Bestellen nur online möglich" />
          </View>
        )}
        <Pressable
          onPress={() => router.push("/bestellung" as any)}
          disabled={!isOnline}
          style={({ pressed }) => [
            styles.stickyBarButton,
            { opacity: !isOnline ? 0.4 : pressed ? 0.9 : 1, transform: [{ scale: pressed && isOnline ? 0.98 : 1 }] },
          ]}
          testID="cart-sticky-bar"
        >
          <View style={styles.stickyBarLeft}>
            <Ionicons name="cart" size={20} color="#fff" />
            <Text style={styles.stickyBarText}>
              Warenkorb: {cartCount} Artikel
            </Text>
          </View>
          <Text style={styles.stickyBarAmount}>{cartTotal}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  headerSection: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 30,
    color: Colors.raw.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.zinc500,
  },
  cartButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#000",
  },
  heroCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  chipsScroll: {
    marginBottom: 24,
    marginHorizontal: -20,
  },
  chipsContainer: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: "row",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  chipActive: {
    backgroundColor: Colors.raw.amber500,
  },
  chipInactive: {
    backgroundColor: Colors.raw.zinc800,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  chipTextActive: {
    color: "#000",
  },
  chipTextInactive: {
    color: Colors.raw.zinc400,
  },
  tradesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
    marginBottom: 16,
  },
  stickyBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.raw.zinc950,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
  },
  stickyBarButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.raw.amber500,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  stickyBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stickyBarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#000",
  },
  stickyBarAmount: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 17,
    color: "#000",
  },
});
