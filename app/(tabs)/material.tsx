import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { useState, useEffect, useCallback } from "react";
import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { TopBar } from "@/components/TopBar";
import { useOffline } from "@/contexts/OfflineContext";
import { OfflineBadge, OfflineBlockedHint } from "@/components/OfflineBanner";
import { supabase } from "@/lib/supabase";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/* ─── Progress Ring ──────────────────────────── */

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
  wrapper: { alignItems: "center", paddingVertical: 8 },
  container: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  svg: { position: "absolute" },
  center: { alignItems: "center" },
  value: { fontFamily: "Inter_800ExtraBold", fontSize: 40, lineHeight: 44 },
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

/* ─── Types ──────────────────────────────────── */

type MaterialStatus = "offen" | "fertig" | "bestellt";

interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: string;
  status: MaterialStatus;
  supplier?: string;
  productId?: string;
  trade: string;
}

interface TradeGroup {
  id: string;
  name: string;
  icon: string;
  totalMaterials: number;
  openCount: number;
  progress: number;
  statusColor: string;
  materials: MaterialItem[];
}

interface ProjectOption {
  id: string;
  project_number: string;
  name: string;
  materialCount: number;
}

/* ─── Helpers ────────────────────────────────── */

const TRADE_ICONS: Record<string, string> = {
  Maler: "color-palette",
  Sanitär: "water",
  Boden: "layers",
  Fliesen: "grid",
  Tischler: "construct",
  Elektro: "flash",
  Trockenbau: "cube",
  Sonstiges: "build",
};

function mapStatus(pm: { product_id: string | null; status: string }): MaterialStatus {
  if (pm.product_id && pm.status === "ordered") return "bestellt";
  if (pm.product_id) return "fertig";
  return "offen";
}

function fmtPrice(val: number | null): string {
  if (val == null || val === 0) return "—";
  return `€${val.toFixed(2).replace(".", ",")}`;
}

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

/* ─── MaterialRow ────────────────────────────── */

function MaterialRow({ item }: { item: MaterialItem }) {
  const cfg = STATUS_CONFIG[item.status];
  return (
    <View style={matStyles.row}>
      <View style={matStyles.rowLeft}>
        <Text style={matStyles.matName}>{item.name}</Text>
        <Text style={matStyles.matUnit}>
          {item.quantity > 0 ? `${Number(item.quantity).toFixed(1)} ${item.unit}` : item.unit}
          {item.price !== "—" ? ` • ${item.price}` : ""}
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
              router.push({
                pathname: "/assign-material",
                params: { name: item.name, materialId: item.id, trade: item.trade },
              });
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
  rowLeft: { flex: 1, marginRight: 12 },
  matName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.white,
    marginBottom: 3,
  },
  matUnit: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc500 },
  rowRight: { alignItems: "flex-end" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  assignBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  assignText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.amber500 },
});

/* ─── TradeCard ──────────────────────────────── */

function TradeCard({
  trade,
  defaultOpen,
  filter,
}: {
  trade: TradeGroup;
  defaultOpen?: boolean;
  filter: FilterKey;
}) {
  const [open, setOpen] = useState(defaultOpen || false);
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const filteredMaterials =
    filter === "alle"
      ? trade.materials
      : trade.materials.filter((m) => m.status === filter);

  return (
    <AnimatedPressable
      style={[tradeStyles.card, animStyle]}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setOpen(!open);
      }}
    >
      <View style={tradeStyles.header}>
        <View style={tradeStyles.headerLeft}>
          <Ionicons
            name={(TRADE_ICONS[trade.name] || "build") as any}
            size={22}
            color={Colors.raw.amber500}
          />
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
                backgroundColor:
                  trade.progress === 100 ? Colors.raw.emerald500 : Colors.raw.amber500,
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
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  tradeName: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.raw.white },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  openBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  openDot: { width: 7, height: 7, borderRadius: 4 },
  openText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  meta: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 10 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc500 },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 10,
  },
  progressBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.raw.zinc800 },
  progressFill: { height: 6, borderRadius: 3 },
  progressText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.raw.zinc400,
    minWidth: 36,
    textAlign: "right",
  },
  materialsSection: { borderTopWidth: 1, borderTopColor: Colors.raw.zinc800 },
  emptyMat: { paddingVertical: 20, alignItems: "center" },
  emptyMatText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc600 },
});

/* ─── Main Screen ────────────────────────────── */

export default function MaterialScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 84 : 90;
  const { isOnline, getCacheAge } = useOffline();

  const [activeFilter, setActiveFilter] = useState<FilterKey>("alle");
  const [loading, setLoading] = useState(true);
  const [trades, setTrades] = useState<TradeGroup[]>([]);
  const [totalMaterials, setTotalMaterials] = useState(0);
  const [assignedMaterials, setAssignedMaterials] = useState(0);
  const [orderedCount, setOrderedCount] = useState(0);
  const [orderedTotal, setOrderedTotal] = useState(0);

  // Project selection
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectOption | null>(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  // Load projects that have materials
  const loadProjects = useCallback(async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("id, project_number, name, status")
      .in("status", ["PLANNING", "IN_PROGRESS", "COMPLETION", "INSPECTION", "ACTIVE"])
      .order("project_number", { ascending: false });

    if (error || !data) return;

    // Count materials per project
    const projectOpts: ProjectOption[] = [];
    for (const p of data) {
      const { count } = await supabase
        .from("project_materials")
        .select("id", { count: "exact", head: true })
        .eq("project_id", p.id);

      if ((count ?? 0) > 0) {
        projectOpts.push({
          id: p.id,
          project_number: p.project_number,
          name: p.name,
          materialCount: count ?? 0,
        });
      }
    }

    setProjects(projectOpts);
    // Auto-select the project with most materials
    if (projectOpts.length > 0 && !selectedProject) {
      const best = projectOpts.reduce((a, b) => (a.materialCount > b.materialCount ? a : b));
      setSelectedProject(best);
    }
  }, [selectedProject]);

  // Load materials for selected project
  const loadMaterials = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);

    const { data: pmData, error } = await supabase
      .from("project_materials")
      .select(
        `id, material_type, trade, quantity, quantity_unit, product_id, status,
         line_total_net_eur, override_price_net_eur,
         products:product_id (name, last_price_net_eur, unit, sku, is_favorite, use_count,
           suppliers:supplier_id (name, short_name)
         )`
      )
      .eq("project_id", selectedProject.id)
      .order("trade")
      .order("material_type");

    if (error || !pmData) {
      setLoading(false);
      return;
    }

    // Group by trade
    const tradeMap = new Map<string, MaterialItem[]>();
    let total = 0;
    let assigned = 0;
    let ordered = 0;
    let orderedSum = 0;

    for (const pm of pmData as any[]) {
      const tradeName = pm.trade || "Sonstiges";
      const mStatus = mapStatus(pm);
      const product = pm.products;
      const supplier = product?.suppliers;
      const price =
        pm.override_price_net_eur || pm.line_total_net_eur || product?.last_price_net_eur || 0;

      const item: MaterialItem = {
        id: pm.id,
        name: pm.material_type,
        quantity: parseFloat(pm.quantity) || 0,
        unit: pm.quantity_unit || "Stk",
        price: fmtPrice(price),
        status: mStatus,
        supplier: supplier?.short_name || supplier?.name || undefined,
        productId: pm.product_id || undefined,
        trade: tradeName,
      };

      if (!tradeMap.has(tradeName)) tradeMap.set(tradeName, []);
      tradeMap.get(tradeName)!.push(item);

      total++;
      if (pm.product_id) assigned++;
      if (mStatus === "bestellt") {
        ordered++;
        orderedSum += price;
      }
    }

    // Build trade groups
    const tradeGroups: TradeGroup[] = [];
    for (const [name, materials] of tradeMap) {
      const openCount = materials.filter((m) => m.status === "offen").length;
      const assignedCount = materials.filter((m) => m.status !== "offen").length;
      const progress = materials.length > 0 ? Math.round((assignedCount / materials.length) * 100) : 0;

      tradeGroups.push({
        id: name,
        name,
        icon: TRADE_ICONS[name] || "build",
        totalMaterials: materials.length,
        openCount,
        progress,
        statusColor: openCount === 0 ? Colors.raw.emerald500 : Colors.raw.rose500,
        materials,
      });
    }

    // Sort: most materials first
    tradeGroups.sort((a, b) => b.totalMaterials - a.totalMaterials);

    setTrades(tradeGroups);
    setTotalMaterials(total);
    setAssignedMaterials(assigned);
    setOrderedCount(ordered);
    setOrderedTotal(orderedSum);
    setLoading(false);
  }, [selectedProject]);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Reload materials when project changes
  useEffect(() => {
    if (selectedProject) loadMaterials();
  }, [selectedProject]);

  // Refresh when screen gets focus (e.g. returning from assign-material)
  useFocusEffect(
    useCallback(() => {
      if (selectedProject) loadMaterials();
    }, [selectedProject])
  );

  const percent = totalMaterials > 0 ? Math.round((assignedMaterials / totalMaterials) * 100) : 0;
  const openCount = totalMaterials - assignedMaterials;

  return (
    <View style={styles.container}>
      <TopBar hasNotification />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topInset + 64, paddingBottom: bottomInset + 70 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={styles.headerTitle}>Material</Text>
                {!isOnline && <OfflineBadge cacheAge={getCacheAge("material")} />}
              </View>
              {/* Project Picker */}
              {selectedProject ? (
                <Pressable
                  onPress={() => {
                    if (projects.length > 1) setShowProjectPicker(!showProjectPicker);
                  }}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Text style={styles.headerSubtitle}>
                    {selectedProject.project_number} • {selectedProject.name}
                  </Text>
                  {projects.length > 1 && (
                    <Ionicons
                      name={showProjectPicker ? "chevron-up" : "chevron-down"}
                      size={14}
                      color={Colors.raw.zinc500}
                    />
                  )}
                </Pressable>
              ) : (
                <Text style={styles.headerSubtitle}>Kein Projekt mit Material</Text>
              )}
            </View>
            <Pressable
              onPress={() => router.push("/bestellung" as any)}
              style={({ pressed }) => [styles.cartButton, { opacity: pressed ? 0.7 : 1 }]}
              testID="cart-button"
            >
              <Ionicons name="cart" size={22} color={Colors.raw.zinc400} />
              {orderedCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{orderedCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Project Picker Dropdown */}
        {showProjectPicker && (
          <View style={styles.projectPicker}>
            {projects.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => {
                  setSelectedProject(p);
                  setShowProjectPicker(false);
                }}
                style={[
                  styles.projectOption,
                  selectedProject?.id === p.id && styles.projectOptionActive,
                ]}
              >
                <View>
                  <Text
                    style={[
                      styles.projectOptionText,
                      selectedProject?.id === p.id && styles.projectOptionTextActive,
                    ]}
                  >
                    {p.project_number}
                  </Text>
                  <Text style={styles.projectOptionSubtext}>{p.name}</Text>
                </View>
                <Text style={styles.projectOptionCount}>{p.materialCount}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Loading */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.raw.amber500} />
            <Text style={styles.loadingText}>Materialien werden geladen...</Text>
          </View>
        ) : trades.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={48} color={Colors.raw.zinc700} />
            <Text style={styles.emptyTitle}>Keine Materialien</Text>
            <Text style={styles.emptySubtitle}>
              Für dieses Projekt wurden noch keine Materialien berechnet.
            </Text>
          </View>
        ) : (
          <>
            {/* Progress Ring */}
            <View style={styles.heroCard}>
              <ProgressRing
                percent={percent}
                color={percent === 100 ? Colors.raw.emerald500 : Colors.raw.amber500}
                label={`${assignedMaterials} von ${totalMaterials} zugeordnet`}
                sublabel={openCount > 0 ? `${openCount} brauchen dich` : "Alles zugeordnet ✓"}
              />
            </View>

            {/* Filter Chips */}
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

            {/* Trade Cards */}
            <View style={styles.tradesSection}>
              <Text style={styles.sectionTitle}>Gewerke</Text>
              {trades.map((trade, i) => (
                <TradeCard
                  key={trade.id}
                  trade={trade}
                  defaultOpen={i === 0}
                  filter={activeFilter}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Sticky Bottom Bar */}
      {!loading && trades.length > 0 && (
        <View
          style={[styles.stickyBar, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 8 }]}
        >
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
              {
                opacity: !isOnline ? 0.4 : pressed ? 0.9 : 1,
                transform: [{ scale: pressed && isOnline ? 0.98 : 1 }],
              },
            ]}
            testID="cart-sticky-bar"
          >
            <View style={styles.stickyBarLeft}>
              <Ionicons name="cart" size={20} color="#fff" />
              <Text style={styles.stickyBarText}>
                {orderedCount > 0
                  ? `Warenkorb: ${orderedCount} Artikel`
                  : `${openCount} Materialien offen`}
              </Text>
            </View>
            <Text style={styles.stickyBarAmount}>
              {orderedTotal > 0
                ? `€${Math.round(orderedTotal).toLocaleString("de-DE")}`
                : `${percent}%`}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

/* ─── Styles ─────────────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  headerSection: { marginBottom: 24 },
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
  cartBadgeText: { fontFamily: "Inter_700Bold", fontSize: 10, color: "#000" },
  heroCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  chipsScroll: { marginBottom: 24, marginHorizontal: -20 },
  chipsContainer: { paddingHorizontal: 20, gap: 8, flexDirection: "row" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  chipActive: { backgroundColor: Colors.raw.amber500 },
  chipInactive: { backgroundColor: Colors.raw.zinc800 },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  chipTextActive: { color: "#000" },
  chipTextInactive: { color: Colors.raw.zinc400 },
  tradesSection: { marginBottom: 16 },
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
  stickyBarLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  stickyBarText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#000" },
  stickyBarAmount: { fontFamily: "Inter_800ExtraBold", fontSize: 17, color: "#000" },
  // Project Picker
  projectPicker: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    marginBottom: 16,
    overflow: "hidden",
  },
  projectOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  projectOptionActive: { backgroundColor: Colors.raw.amber500 + "18" },
  projectOptionText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc300,
  },
  projectOptionTextActive: { color: Colors.raw.amber500 },
  projectOptionSubtext: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginTop: 2,
  },
  projectOptionCount: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.raw.zinc500,
    backgroundColor: Colors.raw.zinc800,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  // Loading & Empty
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.zinc500,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.zinc400,
  },
  emptySubtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc600,
    textAlign: "center",
    maxWidth: 280,
  },
});
