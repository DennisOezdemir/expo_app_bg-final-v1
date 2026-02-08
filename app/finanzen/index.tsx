import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

function formatEuro(amount: number): string {
  if (amount >= 1000) {
    return (
      "\u20AC" +
      amount
        .toFixed(0)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    );
  }
  return "\u20AC" + amount.toFixed(2).replace(".", ",");
}

function formatEuroK(amount: number): string {
  if (amount >= 1000) {
    return "\u20AC" + (amount / 1000).toFixed(0) + "k";
  }
  return formatEuro(amount);
}

interface HeroCardProps {
  value: string;
  label: string;
  sub1: string;
  sub2?: string;
  sub1Color?: string;
}

function HeroCard({ value, label, sub1, sub2, sub1Color }: HeroCardProps) {
  return (
    <View style={heroStyles.card}>
      <Text style={heroStyles.value}>{value}</Text>
      <Text style={heroStyles.label}>{label}</Text>
      <Text style={[heroStyles.sub, sub1Color ? { color: sub1Color } : undefined]}>{sub1}</Text>
      {sub2 && <Text style={heroStyles.sub2}>{sub2}</Text>}
    </View>
  );
}

const heroStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 18,
    minHeight: 120,
  },
  value: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 24,
    color: Colors.raw.white,
    marginBottom: 4,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc400,
    marginBottom: 8,
  },
  sub: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.emerald500,
  },
  sub2: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.raw.zinc500,
    marginTop: 2,
  },
});

interface ProjectMargin {
  id: string;
  code: string;
  name: string;
  trade: string;
  client: string;
  margin: number;
  profit: number;
  status: "red" | "yellow" | "green";
  warning?: string;
}

const PROJECTS: ProjectMargin[] = [
  { id: "1", code: "BL-2026-003", name: "Schwentnerring", trade: "Maler+Boden", client: "SAGA", margin: 12, profit: 1488, status: "red", warning: "Material \u20AC800 \u00FCber Plan" },
  { id: "2", code: "BL-2026-007", name: "Haferweg", trade: "Sanit\u00E4r", client: "SAGA", margin: 21, profit: 1869, status: "yellow" },
  { id: "3", code: "BL-2026-001", name: "Bramfelder Str.", trade: "Komplett", client: "Privat", margin: 34, profit: 4080, status: "green" },
  { id: "4", code: "BL-2026-005", name: "Billhorner Deich", trade: "Maler", client: "GWG", margin: 31, profit: 2790, status: "green" },
];

function MarginBar({ percent, status }: { percent: number; status: string }) {
  const barColor = status === "red" ? Colors.raw.rose500 : status === "yellow" ? Colors.raw.amber500 : Colors.raw.emerald500;
  const filled = Math.min(percent / 40, 1);
  return (
    <View style={marginBarStyles.track}>
      <View style={[marginBarStyles.fill, { width: `${filled * 100}%`, backgroundColor: barColor }]} />
    </View>
  );
}

const marginBarStyles = StyleSheet.create({
  track: { height: 6, borderRadius: 3, backgroundColor: Colors.raw.zinc800, flex: 1 },
  fill: { height: 6, borderRadius: 3 },
});

function ProjectMarginRow({ project }: { project: ProjectMargin }) {
  const statusColor = project.status === "red" ? Colors.raw.rose500 : project.status === "yellow" ? Colors.raw.amber500 : Colors.raw.emerald500;
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/project/[id]", params: { id: project.id } });
      }}
      style={({ pressed }) => [projStyles.row, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={projStyles.rowTop}>
        <View style={projStyles.rowLeft}>
          <View style={[projStyles.dot, { backgroundColor: statusColor }]} />
          <Text style={projStyles.code}>{project.code}</Text>
          <Text style={projStyles.name} numberOfLines={1}>{project.name}</Text>
        </View>
        <View style={projStyles.rowRight}>
          <Text style={[projStyles.margin, { color: statusColor }]}>{project.margin}%</Text>
          <Text style={projStyles.profit}>{formatEuro(project.profit)}</Text>
        </View>
      </View>
      <View style={projStyles.rowMid}>
        <Text style={projStyles.trade}>{project.trade}</Text>
        <Text style={projStyles.client}>{project.client}</Text>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <MarginBar percent={project.margin} status={project.status} />
        </View>
      </View>
      {project.warning && (
        <View style={projStyles.warningRow}>
          <Ionicons name="warning" size={13} color={Colors.raw.amber500} />
          <Text style={projStyles.warningText}>{project.warning}</Text>
        </View>
      )}
    </Pressable>
  );
}

const projStyles = StyleSheet.create({
  row: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 16,
    marginBottom: 8,
  },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  code: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.white },
  name: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc300, flex: 1 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  margin: { fontFamily: "Inter_800ExtraBold", fontSize: 16 },
  profit: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc300 },
  rowMid: { flexDirection: "row", alignItems: "center", gap: 6 },
  trade: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.raw.zinc500 },
  client: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.raw.zinc600 },
  warningRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.raw.zinc800 },
  warningText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.amber500 },
});

const CASHFLOW_MONTHS = ["Sep", "Okt", "Nov", "Dez", "Jan", "Feb"];
const CASHFLOW_EINNAHMEN = [7200, 8400, 9100, 8800, 9500, 9400];
const CASHFLOW_AUSGABEN = [5400, 6200, 7000, 6500, 6800, 6300];
const maxCF = Math.max(...CASHFLOW_EINNAHMEN, ...CASHFLOW_AUSGABEN);

interface OffenerPosten {
  client: string;
  ref: string;
  project: string;
  amount: number;
  days: string;
  status: "red" | "yellow" | "green";
  action?: string;
}

const FORDERUNGEN: OffenerPosten[] = [
  { client: "SAGA", ref: "RE-2026-012", project: "Schwentnerring", amount: 4200, days: "21 Tage!", status: "red", action: "Mahnen" },
  { client: "GWG", ref: "RE-2026-008", project: "Billhorner Deich", amount: 2890, days: "8 Tage", status: "yellow" },
  { client: "Privat", ref: "RE-2026-014", project: "Bramfelder Str.", amount: 1550, days: "2 Tage", status: "green" },
];

const VERBINDLICHKEITEN: OffenerPosten[] = [
  { client: "MEGA eG", ref: "ER-4521", project: "", amount: 1840, days: "f\u00E4llig Mi", status: "yellow" },
  { client: "S\u00FCding", ref: "ER-4498", project: "", amount: 620, days: "f\u00E4llig 28.02.", status: "green" },
];

const KOSTEN_SEGMENTS = [
  { label: "Material", percent: 45, color: Colors.raw.amber500, amount: 16268 },
  { label: "Lohn", percent: 35, color: "#3b82f6", amount: 12653 },
  { label: "Subunternehmer", percent: 12, color: "#8b5cf6", amount: 4338 },
  { label: "Sonstiges", percent: 8, color: Colors.raw.zinc500, amount: 2892 },
];

export default function FinanzenScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [month, setMonth] = useState("Februar 2026");
  const [postenTab, setPostenTab] = useState<"forderungen" | "verbindlichkeiten">("forderungen");

  const postenData = postenTab === "forderungen" ? FORDERUNGEN : VERBINDLICHKEITEN;
  const totalOpen = FORDERUNGEN.reduce((s, f) => s + f.amount, 0) + VERBINDLICHKEITEN.reduce((s, v) => s + v.amount, 0);

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
        <Pressable style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.7 : 1 }]}>
          <Feather name="download" size={22} color={Colors.raw.white} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 60, paddingBottom: bottomInset + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Finanzen</Text>

        <View style={styles.monthRow}>
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.selectionAsync();
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons name="chevron-back" size={22} color={Colors.raw.zinc400} />
          </Pressable>
          <Text style={styles.monthText}>{month}</Text>
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.selectionAsync();
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons name="chevron-forward" size={22} color={Colors.raw.zinc400} />
          </Pressable>
        </View>

        <View style={styles.heroGrid}>
          <View style={styles.heroRow}>
            <HeroCard value="\u20AC48.200" label="Auftr\u00E4ge" sub1="6 aktiv" sub1Color={Colors.raw.zinc400} />
            <HeroCard value="\u20AC36.150" label="Kosten" sub1="Material+" sub1Color={Colors.raw.zinc400} sub2="Lohn+Subs" />
          </View>
          <View style={styles.heroRow}>
            <HeroCard value="\u20AC12.050" label="Ergebnis" sub1="+8% vs. Jan" />
            <HeroCard value="24,9%" label="\u00D8 Marge" sub1="Ziel: 20%" sub2="" />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Projekte nach Marge</Text>
        </View>
        {PROJECTS.map((p) => (
          <ProjectMarginRow key={p.id} project={p} />
        ))}

        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Cashflow</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.chartArea}>
            {CASHFLOW_MONTHS.map((m, i) => (
              <View key={m} style={styles.chartCol}>
                <View style={styles.barsWrap}>
                  <View
                    style={[
                      styles.barEinnahmen,
                      { height: (CASHFLOW_EINNAHMEN[i] / maxCF) * 80 },
                    ]}
                  />
                  <View
                    style={[
                      styles.barAusgaben,
                      { height: (CASHFLOW_AUSGABEN[i] / maxCF) * 80 },
                    ]}
                  />
                </View>
                <Text style={styles.chartLabel}>{m}</Text>
              </View>
            ))}
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.raw.emerald500 }]} />
              <Text style={styles.legendLabel}>Einnahmen:</Text>
              <Text style={[styles.legendValue, { color: Colors.raw.emerald500 }]}>\u20AC52.400</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.raw.rose500 }]} />
              <Text style={styles.legendLabel}>Ausgaben:</Text>
              <Text style={[styles.legendValue, { color: Colors.raw.rose500 }]}>\u20AC38.200</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.raw.white }]} />
              <Text style={styles.legendLabel}>Ergebnis:</Text>
              <Text style={[styles.legendValue, { color: Colors.raw.white }]}>\u20AC14.200</Text>
            </View>
          </View>
        </View>

        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Offene Posten</Text>
          <View style={styles.openBadge}>
            <Text style={styles.openBadgeText}>{formatEuro(totalOpen)}</Text>
          </View>
        </View>
        <View style={styles.card}>
          <View style={styles.postenTabs}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setPostenTab("forderungen");
              }}
              style={[styles.postenTab, postenTab === "forderungen" && styles.postenTabActive]}
            >
              <Text style={[styles.postenTabText, postenTab === "forderungen" && styles.postenTabTextActive]}>Forderungen</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setPostenTab("verbindlichkeiten");
              }}
              style={[styles.postenTab, postenTab === "verbindlichkeiten" && styles.postenTabActive]}
            >
              <Text style={[styles.postenTabText, postenTab === "verbindlichkeiten" && styles.postenTabTextActive]}>Verbindlichkeiten</Text>
            </Pressable>
          </View>
          {postenData.map((item, i) => {
            const dotColor = item.status === "red" ? Colors.raw.rose500 : item.status === "yellow" ? Colors.raw.amber500 : Colors.raw.emerald500;
            return (
              <Pressable
                key={item.ref}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/rechnung/${item.ref}` as any);
                }}
                style={({ pressed }) => [styles.postenRow, i < postenData.length - 1 && styles.postenRowBorder, { opacity: pressed ? 0.85 : 1 }]}
                testID={`invoice-${item.ref}`}
              >
                <View style={styles.postenLeft}>
                  <View style={styles.postenHeader}>
                    <View style={[styles.postenDot, { backgroundColor: dotColor }]} />
                    <Text style={styles.postenClient}>{item.client}</Text>
                    <Text style={styles.postenRef}>{item.ref}</Text>
                  </View>
                  {item.project ? <Text style={styles.postenProject}>{item.project}</Text> : null}
                </View>
                <View style={styles.postenRight}>
                  <Text style={styles.postenAmount}>{formatEuro(item.amount)}</Text>
                  <Text style={[styles.postenDays, { color: dotColor }]}>{item.days}</Text>
                  {item.action && (
                    <View style={styles.postenAction}>
                      <Text style={styles.postenActionText}>{item.action}</Text>
                      <Ionicons name="arrow-forward" size={12} color={Colors.raw.amber500} />
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Kostenverteilung</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.donutRow}>
            <View style={styles.donutContainer}>
              <View style={styles.donutOuter}>
                {(() => {
                  let rotation = 0;
                  return KOSTEN_SEGMENTS.map((seg) => {
                    const segAngle = (seg.percent / 100) * 360;
                    const currentRotation = rotation;
                    rotation += segAngle;
                    return (
                      <View
                        key={seg.label}
                        style={[
                          styles.donutSegment,
                          {
                            transform: [{ rotate: `${currentRotation}deg` }],
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.donutSegmentFill,
                            {
                              backgroundColor: seg.color,
                              transform: [{ rotate: `${Math.min(segAngle, 180)}deg` }],
                            },
                          ]}
                        />
                      </View>
                    );
                  });
                })()}
                <View style={styles.donutInner}>
                  <Text style={styles.donutTotal}>\u20AC36,2k</Text>
                  <Text style={styles.donutLabel}>Gesamt</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.kostenLegend}>
            {KOSTEN_SEGMENTS.map((seg) => (
              <View key={seg.label} style={styles.kostenLegendRow}>
                <View style={styles.kostenLegendLeft}>
                  <View style={[styles.kostenLegendDot, { backgroundColor: seg.color }]} />
                  <Text style={styles.kostenLegendLabel}>{seg.label}</Text>
                </View>
                <View style={styles.kostenLegendRight}>
                  <Text style={styles.kostenLegendPercent}>{seg.percent}%</Text>
                  <Text style={styles.kostenLegendAmount}>{formatEuro(seg.amount)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
  title: { fontFamily: "Inter_800ExtraBold", fontSize: 30, color: Colors.raw.white, marginBottom: 16 },

  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 24,
  },
  monthText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.raw.white },

  heroGrid: { gap: 10, marginBottom: 28 },
  heroRow: { flexDirection: "row", gap: 10 },

  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 20, color: Colors.raw.white },

  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginBottom: 8,
  },

  chartArea: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, height: 100 },
  chartCol: { alignItems: "center", flex: 1 },
  barsWrap: { flexDirection: "row", alignItems: "flex-end", gap: 3, marginBottom: 8 },
  barEinnahmen: { width: 14, borderRadius: 4, backgroundColor: Colors.raw.emerald500 },
  barAusgaben: { width: 14, borderRadius: 4, backgroundColor: Colors.raw.rose500 + "80" },
  chartLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.raw.zinc500 },
  chartLegend: { gap: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc400 },
  legendValue: { fontFamily: "Inter_700Bold", fontSize: 14 },

  openBadge: { backgroundColor: Colors.raw.rose500 + "18", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  openBadgeText: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.rose500 },

  postenTabs: { flexDirection: "row", gap: 6, marginBottom: 16 },
  postenTab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.raw.zinc800, alignItems: "center" },
  postenTabActive: { backgroundColor: Colors.raw.amber500 },
  postenTabText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc400 },
  postenTabTextActive: { color: "#000" },
  postenRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 14 },
  postenRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.raw.zinc800 },
  postenLeft: { flex: 1 },
  postenHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  postenDot: { width: 8, height: 8, borderRadius: 4 },
  postenClient: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.white },
  postenRef: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 12, color: Colors.raw.zinc500 },
  postenProject: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginLeft: 16 },
  postenRight: { alignItems: "flex-end" },
  postenAmount: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.white, marginBottom: 2 },
  postenDays: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  postenAction: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  postenActionText: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.raw.amber500 },

  donutRow: { alignItems: "center", marginBottom: 20 },
  donutContainer: { width: 140, height: 140 },
  donutOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.raw.zinc800,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  donutSegment: {
    position: "absolute",
    width: 140,
    height: 140,
  },
  donutSegmentFill: {
    width: 70,
    height: 140,
    borderTopRightRadius: 70,
    borderBottomRightRadius: 70,
    position: "absolute",
    left: 70,
    transformOrigin: "left center",
  },
  donutInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.raw.zinc900,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  donutTotal: { fontFamily: "Inter_800ExtraBold", fontSize: 18, color: Colors.raw.white },
  donutLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.raw.zinc500 },

  kostenLegend: { gap: 12 },
  kostenLegendRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  kostenLegendLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  kostenLegendDot: { width: 12, height: 12, borderRadius: 6 },
  kostenLegendLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc300 },
  kostenLegendRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  kostenLegendPercent: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.zinc400, width: 36, textAlign: "right" },
  kostenLegendAmount: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.white, width: 75, textAlign: "right" },
});
