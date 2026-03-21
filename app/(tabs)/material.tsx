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
import { useState, useMemo } from "react";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { TopBar } from "@/components/TopBar";
import { useOffline } from "@/contexts/OfflineContext";
import { OfflineBadge, OfflineBlockedHint } from "@/components/OfflineBanner";
import { useProjectsWithMaterials, useMaterialNeeds } from "@/hooks/queries/useMaterial";
import type { MaterialNeed, ProjectWithMaterials } from "@/lib/api/materials";

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

interface TradeGroup {
  id: string;
  name: string;
  icon: string;
  totalNeeds: number;
  problemCount: number;
  readyCount: number;
  orderedCount: number;
  progress: number;
  statusColor: string;
  needs: MaterialNeed[];
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
  Heizung: "flame",
  Allgemein: "build",
  Sonstiges: "build",
};

const PROBLEM_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  aufmass_fehlt: { label: "Aufmaß fehlt", color: Colors.raw.rose400, icon: "warning" },
  mapping_fehlt: { label: "Kein Mapping", color: Colors.raw.amber500, icon: "help-circle" },
  termin_fehlt: { label: "Kein Termin", color: Colors.raw.zinc500, icon: "time" },
  lieferant_fehlt: { label: "Lieferant fehlt", color: Colors.raw.amber500, icon: "storefront" },
};

function fmtPrice(val: number | null): string {
  if (val == null || val === 0) return "—";
  return `€${val.toFixed(2).replace(".", ",")}`;
}

type FilterKey = "alle" | "probleme" | "bereit" | "bestellt";
const FILTERS: { key: FilterKey; label: string; dotColor?: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "probleme", label: "Probleme", dotColor: Colors.raw.rose400 },
  { key: "bereit", label: "Bereit", dotColor: Colors.raw.emerald500 },
  { key: "bestellt", label: "Bestellt", dotColor: Colors.raw.amber500 },
];

/* ─── NeedRow ────────────────────────────────── */

function NeedRow({ item }: { item: MaterialNeed }) {
  const problemCfg = item.problem ? PROBLEM_CONFIG[item.problem] : null;

  return (
    <View style={matStyles.row}>
      <View style={matStyles.rowLeft}>
        <Text style={matStyles.matName} numberOfLines={2}>{item.label}</Text>
        <Text style={matStyles.matUnit}>
          {item.total_quantity > 0 ? `${Number(item.total_quantity).toFixed(0)} ${item.quantity_unit}` : item.quantity_unit}
          {item.room ? ` • ${item.room}` : ""}
          {item.needed_by ? ` • bis ${new Date(item.needed_by).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}` : ""}
        </Text>
        {item.product_name && (
          <Text style={matStyles.productName}>{item.product_name}</Text>
        )}
      </View>
      <View style={matStyles.rowRight}>
        {item.status === "ordered" ? (
          <View style={[matStyles.statusPill, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
            <Ionicons name="cart" size={14} color={Colors.raw.amber500} />
            <Text style={[matStyles.statusText, { color: Colors.raw.amber500 }]}>bestellt</Text>
          </View>
        ) : problemCfg ? (
          <View style={[matStyles.statusPill, { backgroundColor: problemCfg.color + "18" }]}>
            <Ionicons name={problemCfg.icon as any} size={14} color={problemCfg.color} />
            <Text style={[matStyles.statusText, { color: problemCfg.color }]}>{problemCfg.label}</Text>
          </View>
        ) : (
          <View style={[matStyles.statusPill, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.raw.emerald500} />
            <Text style={[matStyles.statusText, { color: Colors.raw.emerald500 }]}>bereit</Text>
          </View>
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
  productName: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc600, marginTop: 2 },
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

  const filteredNeeds =
    filter === "alle"
      ? trade.needs
      : filter === "probleme"
      ? trade.needs.filter((n) => n.problem !== null)
      : filter === "bereit"
      ? trade.needs.filter((n) => n.problem === null && n.status === "planned")
      : trade.needs.filter((n) => n.status === "ordered");

  return (
    <AnimatedPressable
      style={[tradeStyles.card, animStyle]}
      onPressIn={() => { scale.value = withSpring(0.98, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
          {trade.problemCount > 0 ? (
            <View style={[tradeStyles.openBadge, { backgroundColor: Colors.raw.rose500 + "18" }]}>
              <View style={[tradeStyles.openDot, { backgroundColor: Colors.raw.rose500 }]} />
              <Text style={[tradeStyles.openText, { color: Colors.raw.rose500 }]}>
                {trade.problemCount} Probleme
              </Text>
            </View>
          ) : trade.orderedCount === trade.totalNeeds ? (
            <Ionicons name="checkmark-circle" size={20} color={Colors.raw.emerald500} />
          ) : (
            <View style={[tradeStyles.openBadge, { backgroundColor: Colors.raw.emerald500 + "18" }]}>
              <Text style={[tradeStyles.openText, { color: Colors.raw.emerald500 }]}>
                {trade.readyCount} bereit
              </Text>
            </View>
          )}
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={18}
            color={Colors.raw.zinc500}
          />
        </View>
      </View>

      <View style={tradeStyles.meta}>
        <Text style={tradeStyles.metaText}>
          {trade.totalNeeds} Materialien
          {trade.orderedCount > 0 ? ` • ${trade.orderedCount} bestellt` : ""}
        </Text>
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
          {filteredNeeds.length === 0 ? (
            <View style={tradeStyles.emptyMat}>
              <Text style={tradeStyles.emptyMatText}>Keine Materialien für diesen Filter</Text>
            </View>
          ) : (
            filteredNeeds.map((n) => <NeedRow key={n.id} item={n} />)
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
  const [selectedProject, setSelectedProject] = useState<ProjectWithMaterials | null>(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  // Query: projects with material needs
  const { data: projects = [], isLoading: projectsLoading } = useProjectsWithMaterials();

  // Auto-select best project when projects load
  const effectiveProject = useMemo(() => {
    if (selectedProject) return selectedProject;
    if (projects.length > 0) {
      return projects.reduce((a, b) => (a.needCount > b.needCount ? a : b));
    }
    return null;
  }, [projects, selectedProject]);

  // Query: material needs for selected project
  const { data: needsData = [], isLoading: needsLoading } = useMaterialNeeds(effectiveProject?.id);

  const loading = projectsLoading || needsLoading;

  // Derive trade groups from needs data
  const { trades, totalNeeds, readyCount, problemCount, orderedCount } = useMemo(() => {
    const tradeMap = new Map<string, MaterialNeed[]>();
    let total = 0;
    let ready = 0;
    let problems = 0;
    let ordered = 0;

    for (const need of needsData) {
      const tradeName = need.trade || "Sonstiges";
      if (!tradeMap.has(tradeName)) tradeMap.set(tradeName, []);
      tradeMap.get(tradeName)!.push(need);
      total++;
      if (need.status === "ordered") ordered++;
      else if (need.problem) problems++;
      else ready++;
    }

    const tradeGroups: TradeGroup[] = [];
    for (const [name, needs] of tradeMap) {
      const tProblems = needs.filter((n) => n.problem !== null && n.status !== "ordered").length;
      const tReady = needs.filter((n) => n.problem === null && n.status === "planned").length;
      const tOrdered = needs.filter((n) => n.status === "ordered").length;
      const okCount = tReady + tOrdered;
      const progress = needs.length > 0 ? Math.round((okCount / needs.length) * 100) : 0;

      tradeGroups.push({
        id: name,
        name,
        icon: TRADE_ICONS[name] || "build",
        totalNeeds: needs.length,
        problemCount: tProblems,
        readyCount: tReady,
        orderedCount: tOrdered,
        progress,
        statusColor: tProblems > 0 ? Colors.raw.rose500 : Colors.raw.emerald500,
        needs,
      });
    }

    tradeGroups.sort((a, b) => b.totalNeeds - a.totalNeeds);

    return { trades: tradeGroups, totalNeeds: total, readyCount: ready, problemCount: problems, orderedCount: ordered };
  }, [needsData]);

  const percent = totalNeeds > 0 ? Math.round(((readyCount + orderedCount) / totalNeeds) * 100) : 0;

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
              {effectiveProject ? (
                <Pressable
                  onPress={() => { if (projects.length > 1) setShowProjectPicker(!showProjectPicker); }}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Text style={styles.headerSubtitle}>
                    {effectiveProject.project_number ? `${effectiveProject.project_number} • ` : ""}{effectiveProject.name}
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
          </View>
        </View>

        {/* Project Picker Dropdown */}
        {showProjectPicker && (
          <View style={styles.projectPicker}>
            {projects.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => { setSelectedProject(p); setShowProjectPicker(false); }}
                style={[
                  styles.projectOption,
                  effectiveProject?.id === p.id && styles.projectOptionActive,
                ]}
              >
                <View>
                  <Text
                    style={[
                      styles.projectOptionText,
                      effectiveProject?.id === p.id && styles.projectOptionTextActive,
                    ]}
                  >
                    {p.project_number || p.name}
                  </Text>
                  <Text style={styles.projectOptionSubtext}>{p.name}</Text>
                </View>
                <Text style={styles.projectOptionCount}>{p.needCount}</Text>
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
                label={`${readyCount + orderedCount} von ${totalNeeds} bereit`}
                sublabel={
                  problemCount > 0
                    ? `${problemCount} Probleme • ${orderedCount} bestellt`
                    : orderedCount > 0
                    ? `${orderedCount} bestellt`
                    : "Alles bereit ✓"
                }
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
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      {!loading && trades.length > 0 && problemCount > 0 && (
        <View
          style={[styles.stickyBar, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 8 }]}
        >
          <Pressable
            onPress={() => setActiveFilter("probleme")}
            style={({ pressed }) => [
              styles.stickyBarButton,
              { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
          >
            <View style={styles.stickyBarLeft}>
              <Ionicons name="warning" size={20} color="#000" />
              <Text style={styles.stickyBarText}>
                {problemCount} Probleme klären
              </Text>
            </View>
            <Text style={styles.stickyBarAmount}>{percent}%</Text>
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
