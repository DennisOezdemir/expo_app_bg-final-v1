import { StyleSheet, Text, View, ScrollView, Platform, Pressable, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useState, useCallback } from "react";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { TopBar } from "@/components/TopBar";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ProjectStatus = "kritisch" | "achtung" | "laeuft" | "fertig";

interface Project {
  id: string;
  code: string;
  name: string;
  address: string;
  status: ProjectStatus;
  progress: number;
  budget: string;
  deadline: string;
  team: number;
  phase: string;
}

const STATUS_CONFIG: Record<ProjectStatus, { color: string; label: string }> = {
  kritisch: { color: Colors.raw.rose500, label: "Kritisch" },
  achtung: { color: Colors.raw.amber500, label: "Achtung" },
  laeuft: { color: Colors.raw.emerald500, label: "Läuft" },
  fertig: { color: Colors.raw.zinc500, label: "Fertig" },
};

const PROJECTS: Project[] = [
  {
    id: "1",
    code: "BL-2026-001",
    name: "Wohnanlage Seeblick",
    address: "Seestrasse 42, Zürich",
    status: "laeuft",
    progress: 72,
    budget: "2.4M",
    deadline: "15. Jun 2026",
    team: 14,
    phase: "Rohbau",
  },
  {
    id: "2",
    code: "BL-2026-003",
    name: "Bürogebäude Mitte",
    address: "Hauptstrasse 15, Bern",
    status: "achtung",
    progress: 45,
    budget: "1.8M",
    deadline: "30. Aug 2026",
    team: 9,
    phase: "Fundament",
  },
  {
    id: "3",
    code: "BL-2026-007",
    name: "Parkhaus Nord",
    address: "Industrieweg 8, Basel",
    status: "kritisch",
    progress: 18,
    budget: "3.1M",
    deadline: "01. Mär 2026",
    team: 22,
    phase: "Planung",
  },
  {
    id: "4",
    code: "BL-2026-012",
    name: "Kita Sonnenschein",
    address: "Gartenweg 3, Luzern",
    status: "laeuft",
    progress: 89,
    budget: "980K",
    deadline: "20. Apr 2026",
    team: 6,
    phase: "Innenausbau",
  },
  {
    id: "5",
    code: "BL-2025-044",
    name: "Lagerhalle Ost",
    address: "Hafenstrasse 21, Winterthur",
    status: "fertig",
    progress: 100,
    budget: "1.2M",
    deadline: "12. Jan 2026",
    team: 8,
    phase: "Abnahme",
  },
  {
    id: "6",
    code: "BL-2026-015",
    name: "Sanierung Altstadt",
    address: "Marktplatz 7, St. Gallen",
    status: "kritisch",
    progress: 31,
    budget: "4.5M",
    deadline: "10. Feb 2026",
    team: 18,
    phase: "Abbruch",
  },
  {
    id: "7",
    code: "BL-2026-018",
    name: "Turnhalle Westpark",
    address: "Sportweg 12, Aarau",
    status: "laeuft",
    progress: 56,
    budget: "1.6M",
    deadline: "15. Sep 2026",
    team: 11,
    phase: "Rohbau",
  },
];

type FilterKey = "alle" | "kritisch" | "achtung" | "laeuft" | "fertig";

const FILTERS: { key: FilterKey; label: string; dotColor?: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "kritisch", label: "Kritisch", dotColor: Colors.raw.rose500 },
  { key: "achtung", label: "Achtung", dotColor: Colors.raw.amber500 },
  { key: "laeuft", label: "Läuft", dotColor: Colors.raw.emerald500 },
  { key: "fertig", label: "Fertig", dotColor: Colors.raw.zinc500 },
];

function FilterChip({
  label,
  dotColor,
  active,
  onPress,
}: {
  label: string;
  dotColor?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active ? styles.chipActive : styles.chipInactive,
      ]}
    >
      {dotColor && !active && (
        <View style={[styles.chipDot, { backgroundColor: dotColor }]} />
      )}
      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const statusCfg = STATUS_CONFIG[project.status];
  const progressColor = statusCfg.color;

  return (
    <AnimatedPressable
      style={[styles.card, animStyle]}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPress={() => {
        router.push({ pathname: "/project/[id]", params: { id: project.id } });
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardCode}>{project.code}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusCfg.color + "18" }]}>
            <View style={[styles.statusPillDot, { backgroundColor: statusCfg.color }]} />
            <Text style={[styles.statusPillText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.raw.zinc600} />
      </View>

      <Text style={styles.cardName}>{project.name}</Text>
      <Text style={styles.cardAddress}>{project.address}</Text>

      <View style={styles.cardProgress}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${project.progress}%`, backgroundColor: progressColor },
            ]}
          />
        </View>
        <Text style={[styles.progressValue, { color: progressColor }]}>
          {project.progress}%
        </Text>
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="currency-eur" size={14} color={Colors.raw.zinc500} />
          <Text style={styles.metaText}>{project.budget}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="people" size={14} color={Colors.raw.zinc500} />
          <Text style={styles.metaText}>{project.team}</Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="calendar" size={13} color={Colors.raw.zinc500} />
          <Text style={styles.metaText}>{project.deadline}</Text>
        </View>
        <View style={styles.phasePill}>
          <Text style={styles.phaseText}>{project.phase}</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export default function ProjekteScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 84 : 90;
  const [activeFilter, setActiveFilter] = useState<FilterKey>("alle");

  const handleFilter = useCallback((key: FilterKey) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveFilter(key);
  }, []);

  const filtered = activeFilter === "alle"
    ? PROJECTS
    : PROJECTS.filter((p) => p.status === activeFilter);

  const kritischCount = PROJECTS.filter((p) => p.status === "kritisch").length;
  const aktivCount = PROJECTS.filter((p) => p.status !== "fertig").length;

  return (
    <View style={styles.container}>
      <TopBar hasNotification />
      <View style={[styles.headerSection, { paddingTop: topInset + 64 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Projekte</Text>
            <Text style={styles.headerSubtitle}>
              {aktivCount} aktiv{" "}
              <Text style={{ color: Colors.raw.zinc600 }}>{"\u2022"}</Text>{" "}
              <Text style={{ color: Colors.raw.rose400 }}>{kritischCount} überfällig</Text>
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.searchButton, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather name="search" size={22} color={Colors.raw.zinc400} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
          style={styles.chipsScroll}
        >
          {FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              dotColor={f.dotColor}
              active={activeFilter === f.key}
              onPress={() => handleFilter(f.key)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProjectCard project={item} />}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={filtered.length > 0}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color={Colors.raw.zinc700} />
            <Text style={styles.emptyText}>Keine Projekte gefunden</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  headerSection: {
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
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
  searchButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
  },
  chipsScroll: {
    marginBottom: 20,
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
  listContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardCode: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc500,
    letterSpacing: 0.3,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusPillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  cardName: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
    marginBottom: 3,
  },
  cardAddress: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc500,
    marginBottom: 16,
  },
  cardProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.raw.zinc800,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  progressValue: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 16,
    minWidth: 42,
    textAlign: "right",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  phasePill: {
    marginLeft: "auto",
    backgroundColor: Colors.raw.zinc800,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  phaseText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.zinc400,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.raw.zinc600,
  },
});
