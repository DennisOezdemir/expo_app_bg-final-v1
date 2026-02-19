import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { useState, useMemo, useCallback, useEffect } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { supabase } from "@/lib/supabase";

const SCREEN_W = Dimensions.get("window").width;

// ── types ───────────────────────────────────────────────────────────

interface Trade {
  id: string;
  name: string;
  person: string;
  startDay: number;
  endDay: number;
  doneDay: number;
  positionen: { done: number; total: number };
  color: string;
  status: "fertig" | "aktiv" | "geplant" | "verzug";
  startDate: string;
  endDate: string;
}

interface TeamMember {
  name: string;
  role: string;
  days: string;
  project: string;
}

interface Meilenstein {
  label: string;
  date: string;
  status: "done" | "soon" | "future";
  daysInfo?: string;
}

interface ProjectData {
  id: string;
  project_number: string;
  name: string;
  object_street: string;
  planned_start: string | null;
  planned_end: string | null;
  status: string;
  inspection_date: string | null;
  handover_date: string | null;
}

// ── helpers ─────────────────────────────────────────────────────────

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function formatDateDE(d: string | null): string {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}.`;
}

function formatDateDEFull(d: string | null): string {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}.${dt.getFullYear()}`;
}

function getWeekLabel(start: Date, end: Date): string {
  const dayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const startDay = dayNames[start.getDay()];
  const endDay = dayNames[end.getDay()];
  return `${startDay}–${endDay}`;
}

function phaseStatus(phase: any, projectStart: Date, today: Date): "fertig" | "aktiv" | "geplant" | "verzug" {
  if (phase.status === "completed" || phase.progress >= 100) return "fertig";
  const phaseEnd = new Date(phase.end_date + "T00:00:00");
  const phaseStart = new Date(phase.start_date + "T00:00:00");
  if (today > phaseEnd && phase.progress < 100) return "verzug";
  if (today >= phaseStart && today <= phaseEnd) return "aktiv";
  return "geplant";
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  fertig: { label: "Fertig", color: Colors.raw.emerald500 },
  aktiv: { label: "Aktiv", color: Colors.raw.amber500 },
  geplant: { label: "Geplant", color: Colors.raw.zinc500 },
  verzug: { label: "Verzug", color: Colors.raw.rose500 },
};

// ── GanttBar ────────────────────────────────────────────────────────

function GanttBar({
  trade,
  totalDays,
  currentDay,
  onPress,
  expanded,
  hasConflict,
}: {
  trade: Trade;
  totalDays: number;
  currentDay: number;
  onPress: () => void;
  expanded: boolean;
  hasConflict: boolean;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const barLeft = ((trade.startDay - 1) / totalDays) * 100;
  const barWidth = ((trade.endDay - trade.startDay + 1) / totalDays) * 100;
  const doneWidth =
    trade.doneDay > 0
      ? (Math.min(trade.doneDay, trade.endDay - trade.startDay + 1) /
          (trade.endDay - trade.startDay + 1)) *
        100
      : 0;

  const todayInBar =
    currentDay >= trade.startDay && currentDay <= trade.endDay;
  const todayOffset =
    todayInBar
      ? ((currentDay - trade.startDay) / (trade.endDay - trade.startDay + 1)) * 100
      : -1;

  const statusCfg = STATUS_LABELS[trade.status];

  const getBarColor = () => {
    if (trade.status === "fertig") return Colors.raw.emerald500;
    if (trade.status === "verzug") return Colors.raw.rose500;
    return Colors.raw.zinc700;
  };

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
          setTimeout(() => {
            scale.value = withSpring(1, { damping: 15, stiffness: 300 });
          }, 150);
          onPress();
        }}
        style={ganttStyles.row}
      >
        <Text style={ganttStyles.label} numberOfLines={1}>
          {trade.name}
        </Text>
        <View style={ganttStyles.track}>
          <View
            style={[
              ganttStyles.bar,
              {
                left: `${barLeft}%`,
                width: `${barWidth}%`,
                backgroundColor: getBarColor(),
                borderWidth: hasConflict ? 2 : 0,
                borderColor: hasConflict ? Colors.raw.rose500 : "transparent",
              },
            ]}
          >
            {doneWidth > 0 && (
              <View
                style={[
                  ganttStyles.barDone,
                  {
                    width: `${doneWidth}%`,
                    backgroundColor: Colors.raw.emerald500,
                  },
                ]}
              />
            )}
            {todayInBar && trade.status === "aktiv" && (
              <View
                style={[
                  ganttStyles.barToday,
                  { left: `${todayOffset}%` },
                ]}
              />
            )}
          </View>
        </View>
      </Pressable>

      {expanded && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={ganttStyles.expandedCard}
        >
          <View style={ganttStyles.expandedRow}>
            <View>
              <Text style={ganttStyles.expandedTitle}>{trade.name}</Text>
              <Text style={ganttStyles.expandedPerson}>{trade.person}</Text>
            </View>
            <View style={[ganttStyles.statusPill, { backgroundColor: statusCfg.color + "18" }]}>
              <View style={[ganttStyles.statusDot, { backgroundColor: statusCfg.color }]} />
              <Text style={[ganttStyles.statusText, { color: statusCfg.color }]}>
                {statusCfg.label}
              </Text>
            </View>
          </View>
          <View style={ganttStyles.expandedMeta}>
            <Text style={ganttStyles.expandedDateLabel}>
              {formatDateDE(trade.startDate)} {"\u2192"} {formatDateDE(trade.endDate)}
            </Text>
            <Text style={ganttStyles.expandedPos}>
              {trade.positionen.done} von {trade.positionen.total} Positionen fertig
            </Text>
          </View>
          {hasConflict && (
            <View style={ganttStyles.conflictBanner}>
              <Ionicons name="warning" size={14} color={Colors.raw.rose500} />
              <Text style={ganttStyles.conflictText}>
                Doppelbelegung {trade.person}
              </Text>
            </View>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
}

const ganttStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    gap: 0,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc400,
    width: 60,
    textAlign: "right",
    paddingRight: 10,
  },
  track: {
    flex: 1,
    height: 28,
    backgroundColor: Colors.raw.zinc800 + "60",
    borderRadius: 6,
    position: "relative",
    overflow: "hidden",
  },
  bar: {
    position: "absolute",
    top: 0,
    height: 28,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  barDone: {
    height: "100%",
    borderRadius: 6,
  },
  barToday: {
    position: "absolute",
    width: 3,
    height: "100%",
    backgroundColor: Colors.raw.amber500,
    borderRadius: 2,
  },
  expandedCard: {
    marginLeft: 60,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
  },
  expandedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  expandedTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.white,
  },
  expandedPerson: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc400,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  expandedMeta: {
    gap: 4,
  },
  expandedDateLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc400,
  },
  expandedPos: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  conflictBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    backgroundColor: Colors.raw.rose500 + "14",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  conflictText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.rose500,
  },
});

// ── main screen ─────────────────────────────────────────────────────

export default function PlanungDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [meilensteine, setMeilensteine] = useState<Meilenstein[]>([]);
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    // Determine if id is UUID or project_number
    const isUuid = id.length === 36 && id.includes("-");

    // Load project
    const projectQuery = supabase
      .from("projects")
      .select("id, project_number, name, object_street, planned_start, planned_end, status, inspection_date, handover_date");

    const { data: proj } = isUuid
      ? await projectQuery.eq("id", id).single()
      : await projectQuery.eq("project_number", id).single();

    if (!proj) {
      setLoading(false);
      return;
    }
    setProject(proj);

    // Load schedule phases
    const { data: phases } = await supabase
      .from("schedule_phases")
      .select("*, team_members!assigned_team_member_id(name, role)")
      .eq("project_id", proj.id)
      .order("phase_number");

    if (phases && phases.length > 0 && proj.planned_start) {
      const projectStart = new Date(proj.planned_start + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tradesList: Trade[] = phases.map((phase: any) => {
        const phaseStart = new Date(phase.start_date + "T00:00:00");
        const phaseEnd = new Date(phase.end_date + "T00:00:00");
        const startDay = diffDays(projectStart, phaseStart) + 1;
        const endDay = diffDays(projectStart, phaseEnd) + 1;
        const status = phaseStatus(phase, projectStart, today);
        const doneDay = status === "fertig"
          ? endDay - startDay + 1
          : status === "aktiv"
          ? Math.max(0, diffDays(phaseStart, today) + 1)
          : 0;

        const tm = phase.team_members;
        return {
          id: phase.id,
          name: phase.trade || phase.name,
          person: tm?.name || (phase.is_external ? phase.external_name || "Extern" : "Offen"),
          startDay,
          endDay,
          doneDay,
          positionen: { done: Math.round((phase.progress || 0) / 100 * 1), total: 1 },
          color: status === "fertig" ? Colors.raw.emerald500 : Colors.raw.zinc700,
          status,
          startDate: phase.start_date,
          endDate: phase.end_date,
        };
      });

      setTrades(tradesList);
    } else {
      setTrades([]);
    }

    // Load team assignments
    const { data: assignments } = await supabase
      .from("project_assignments")
      .select("*, team_members!team_member_id(name, role)")
      .eq("project_id", proj.id);

    if (assignments && assignments.length > 0) {
      setTeam(
        assignments.map((a: any) => {
          const tm = a.team_members;
          const startDt = new Date(a.start_date + "T00:00:00");
          const endDt = new Date(a.end_date + "T00:00:00");
          return {
            name: tm?.name || "Unbekannt",
            role: a.role_in_project || tm?.role || "",
            days: `${getWeekLabel(startDt, endDt)} ${formatDateDE(a.start_date)}–${formatDateDE(a.end_date)}`,
            project: proj.object_street || proj.name || "",
          };
        })
      );
    } else if (phases && phases.length > 0) {
      // Fallback: derive team from phases
      const teamMap = new Map<string, TeamMember>();
      for (const phase of phases) {
        const tm = phase.team_members;
        if (tm && !teamMap.has(tm.name)) {
          teamMap.set(tm.name, {
            name: tm.name,
            role: phase.trade || tm.role,
            days: `${formatDateDE(phase.start_date)}–${formatDateDE(phase.end_date)}`,
            project: proj.object_street || proj.name || "",
          });
        }
      }
      setTeam(Array.from(teamMap.values()));
    } else {
      setTeam([]);
    }

    // Build milestones
    const ms: Meilenstein[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (proj.planned_start) {
      const startDt = new Date(proj.planned_start + "T00:00:00");
      const daysAgo = diffDays(startDt, today);
      ms.push({
        label: "Baustart",
        date: formatDateDE(proj.planned_start),
        status: daysAgo >= 0 ? "done" : "future",
      });
    }

    if (proj.inspection_date) {
      const inspDt = new Date(proj.inspection_date + "T00:00:00");
      const daysUntil = diffDays(today, inspDt);
      ms.push({
        label: "Zwischenbegehung",
        date: formatDateDE(proj.inspection_date),
        status: daysUntil < 0 ? "done" : daysUntil <= 7 ? "soon" : "future",
        daysInfo: daysUntil > 0 ? `in ${daysUntil} Tagen` : daysUntil === 0 ? "heute" : undefined,
      });
    }

    if (proj.planned_end) {
      const endDt = new Date(proj.planned_end + "T00:00:00");
      const daysUntil = diffDays(today, endDt);
      ms.push({
        label: "Abnahme",
        date: formatDateDE(proj.planned_end),
        status: daysUntil < 0 ? "done" : daysUntil <= 7 ? "soon" : "future",
        daysInfo: daysUntil > 0 ? `in ${daysUntil} Tagen` : undefined,
      });
    }

    setMeilensteine(ms);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalDays = useMemo(() => {
    if (!project?.planned_start || !project?.planned_end) return 15;
    return Math.max(diffDays(
      new Date(project.planned_start + "T00:00:00"),
      new Date(project.planned_end + "T00:00:00")
    ) + 1, 1);
  }, [project]);

  const currentDay = useMemo(() => {
    if (!project?.planned_start) return 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.max(1, diffDays(new Date(project.planned_start + "T00:00:00"), today) + 1);
  }, [project]);

  const progressPercent = Math.min(100, Math.max(0, Math.round((currentDay / totalDays) * 100)));
  const onSchedule = useMemo(() => {
    return !trades.some((t) => t.status === "verzug");
  }, [trades]);

  // Detect conflicts: same person in overlapping phases
  const conflictTradeIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < trades.length; i++) {
      for (let j = i + 1; j < trades.length; j++) {
        const a = trades[i];
        const b = trades[j];
        if (
          a.person === b.person &&
          a.person !== "Offen" &&
          a.startDay <= b.endDay &&
          b.startDay <= a.endDay
        ) {
          ids.add(a.id);
          ids.add(b.id);
        }
      }
    }
    return ids;
  }, [trades]);

  // Week chips from project dates
  const weeks = useMemo(() => {
    if (!project?.planned_start) return [];
    const start = new Date(project.planned_start + "T00:00:00");
    const result: { label: string; startDay: number; endDay: number }[] = [];
    let day = 1;
    let weekStart = new Date(start);
    // Go to Monday of first week
    const dow = weekStart.getDay();
    if (dow !== 1) {
      weekStart.setDate(weekStart.getDate() - ((dow + 6) % 7));
    }

    while (day <= totalDays + 5) {
      const kwDate = new Date(weekStart);
      const kw = getISOWeek(kwDate);
      result.push({ label: `KW ${kw}`, startDay: day, endDay: day + 4 });
      day += 5;
      weekStart.setDate(weekStart.getDate() + 7);
      if (result.length >= 8) break;
    }
    return result;
  }, [project, totalDays]);

  const [selectedWeek, setSelectedWeek] = useState(0);

  // Determine active week
  useEffect(() => {
    const idx = weeks.findIndex((w) => currentDay >= w.startDay && currentDay <= w.endDay);
    if (idx >= 0) setSelectedWeek(idx);
  }, [weeks, currentDay]);

  const DAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr"];

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.raw.amber500} />
        <Text style={{ color: Colors.raw.zinc500, marginTop: 12, fontFamily: "Inter_500Medium" }}>
          Lade Projektplanung...
        </Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.raw.zinc600} />
        <Text style={{ color: Colors.raw.zinc400, marginTop: 12, fontFamily: "Inter_600SemiBold", fontSize: 16 }}>
          Projekt nicht gefunden
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: Colors.raw.amber500, fontFamily: "Inter_600SemiBold" }}>Zurück</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.headerBar, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerProjectCode} numberOfLines={1}>
            {project.project_number}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topInset + 64, paddingBottom: bottomInset + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.titleText}>Planung</Text>
          <Text style={styles.subtitleText}>
            {project.project_number} {"\u2022"} {project.object_street || project.name}
          </Text>
        </View>

        {/* Hero card */}
        <View style={styles.card}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroDayLabel}>Tag</Text>
              <View style={styles.heroDayRow}>
                <Text style={styles.heroDayBig}>{Math.min(currentDay, totalDays)}</Text>
                <Text style={styles.heroDayOf}>von {totalDays}</Text>
              </View>
            </View>
            <View style={styles.heroRight}>
              <Text style={styles.heroDateRange}>
                {formatDateDE(project.planned_start)} {"\u2192"} {formatDateDEFull(project.planned_end)}
              </Text>
              <View
                style={[
                  styles.schedulePill,
                  {
                    backgroundColor: onSchedule
                      ? Colors.raw.emerald500 + "18"
                      : Colors.raw.rose500 + "18",
                  },
                ]}
              >
                <Ionicons
                  name="time"
                  size={14}
                  color={onSchedule ? Colors.raw.emerald500 : Colors.raw.rose500}
                />
                <Text
                  style={[
                    styles.scheduleText,
                    { color: onSchedule ? Colors.raw.emerald500 : Colors.raw.rose500 },
                  ]}
                >
                  {onSchedule ? "Im Plan" : "Verzug"}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.heroProgressBg}>
            <View
              style={[
                styles.heroProgressFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: onSchedule ? Colors.raw.emerald500 : Colors.raw.rose500,
                },
              ]}
            />
          </View>
          <Text style={styles.heroProgressLabel}>{progressPercent}% abgeschlossen</Text>
        </View>

        {/* Week chips */}
        {weeks.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.weekScroll}
            contentContainerStyle={styles.weekScrollContent}
          >
            {weeks.map((week, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setSelectedWeek(i);
                }}
                style={[
                  styles.weekChip,
                  selectedWeek === i && styles.weekChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.weekChipText,
                    selectedWeek === i && styles.weekChipTextActive,
                  ]}
                >
                  {week.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Gantt chart */}
        {trades.length > 0 ? (
          <View style={styles.card}>
            <View style={styles.ganttHeader}>
              <View style={styles.ganttLabelSpace} />
              <View style={styles.ganttDayHeaders}>
                {DAY_LABELS.map((d, i) => (
                  <Text key={i} style={styles.ganttDayLabel}>
                    {d}
                  </Text>
                ))}
              </View>
            </View>

            <View style={styles.ganttBody}>
              {trades.map((trade) => (
                <GanttBar
                  key={trade.id}
                  trade={trade}
                  totalDays={totalDays}
                  currentDay={currentDay}
                  onPress={() =>
                    setExpandedTrade(expandedTrade === trade.id ? null : trade.id)
                  }
                  expanded={expandedTrade === trade.id}
                  hasConflict={conflictTradeIds.has(trade.id)}
                />
              ))}
            </View>

            <View style={styles.ganttLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.raw.emerald500 }]} />
                <Text style={styles.legendText}>Erledigt</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.raw.amber500 }]} />
                <Text style={styles.legendText}>Heute</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.raw.zinc700 }]} />
                <Text style={styles.legendText}>Geplant</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.raw.rose500 }]} />
                <Text style={styles.legendText}>Verzug</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.card, { alignItems: "center", paddingVertical: 32 }]}>
            <Ionicons name="calendar-outline" size={40} color={Colors.raw.zinc600} />
            <Text style={{ color: Colors.raw.zinc400, fontFamily: "Inter_600SemiBold", fontSize: 15, marginTop: 12 }}>
              Noch kein Zeitplan vorhanden
            </Text>
            <Text style={{ color: Colors.raw.zinc600, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4 }}>
              Erstbegehung abschliessen um Zeitplan zu generieren
            </Text>
          </View>
        )}

        {/* Conflicts */}
        {conflictTradeIds.size > 0 && (
          <View style={styles.conflictCard}>
            <View style={styles.conflictIcon}>
              <Ionicons name="warning" size={18} color={Colors.raw.rose500} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.conflictMsg}>
                {conflictTradeIds.size / 2} Doppelbelegung(en) erkannt
              </Text>
            </View>
          </View>
        )}

        {/* Team */}
        {team.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Team</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{team.length}</Text>
              </View>
            </View>
            {team.map((member, i) => (
              <View
                key={i}
                style={[
                  styles.teamRow,
                  i < team.length - 1 && styles.teamRowBorder,
                ]}
              >
                <View style={styles.teamAvatar}>
                  <MaterialCommunityIcons
                    name="hard-hat"
                    size={20}
                    color={Colors.raw.amber500}
                  />
                </View>
                <View style={styles.teamInfo}>
                  <View style={styles.teamTopRow}>
                    <Text style={styles.teamName}>{member.name}</Text>
                    <Text style={styles.teamRole}>{member.role}</Text>
                  </View>
                  <Text style={styles.teamSchedule}>
                    {member.days} {"\u2022"} {member.project}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Milestones */}
        {meilensteine.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Meilensteine</Text>
            </View>
            {meilensteine.map((m, i) => {
              const isLast = i === meilensteine.length - 1;
              const dotColor =
                m.status === "done"
                  ? Colors.raw.emerald500
                  : m.status === "soon"
                  ? Colors.raw.amber500
                  : Colors.raw.zinc600;
              return (
                <View key={i} style={styles.milestoneRow}>
                  <View style={styles.milestoneTimeline}>
                    <View style={[styles.milestoneDot, { backgroundColor: dotColor }]}>
                      {m.status === "done" && (
                        <Ionicons name="checkmark" size={12} color="#000" />
                      )}
                    </View>
                    {!isLast && <View style={styles.milestoneLine} />}
                  </View>
                  <View style={[styles.milestoneContent]}>
                    <View>
                      <Text style={styles.milestoneLabel}>{m.label}</Text>
                      <Text style={styles.milestoneDate}>
                        {m.date}
                        {m.daysInfo ? ` \u2022 ${m.daysInfo}` : ""}
                      </Text>
                    </View>
                    {m.status === "done" && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.raw.emerald500} />
                    )}
                    {m.status === "soon" && (
                      <Ionicons name="time" size={20} color={Colors.raw.amber500} />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── ISO week helper ─────────────────────────────────────────────────

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ── styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  headerBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerProjectCode: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc500,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  titleSection: {
    marginBottom: 24,
  },
  titleText: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 28,
    color: Colors.raw.white,
    marginBottom: 6,
  },
  subtitleText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.zinc400,
  },
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  heroDayLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc500,
    marginBottom: 2,
  },
  heroDayRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  heroDayBig: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 40,
    color: Colors.raw.white,
    lineHeight: 44,
  },
  heroDayOf: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.raw.zinc500,
  },
  heroRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  heroDateRange: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc400,
  },
  schedulePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  scheduleText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  heroProgressBg: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.raw.zinc800,
    overflow: "hidden",
    marginBottom: 10,
  },
  heroProgressFill: {
    height: 10,
    borderRadius: 5,
  },
  heroProgressLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  weekScroll: {
    marginBottom: 16,
    marginHorizontal: -20,
  },
  weekScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  weekChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.raw.zinc900,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
  },
  weekChipActive: {
    backgroundColor: Colors.raw.amber500,
    borderColor: Colors.raw.amber500,
  },
  weekChipText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.raw.zinc400,
  },
  weekChipTextActive: {
    color: "#000",
  },
  ganttHeader: {
    flexDirection: "row",
    marginBottom: 4,
  },
  ganttLabelSpace: {
    width: 60,
  },
  ganttDayHeaders: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  ganttDayLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.raw.zinc600,
    textAlign: "center",
  },
  ganttBody: {
    position: "relative",
  },
  ganttLegend: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.raw.zinc500,
  },
  conflictCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.raw.rose500 + "14",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.rose500 + "30",
    padding: 16,
    marginBottom: 16,
  },
  conflictIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.raw.rose500 + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  conflictMsg: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.rose500,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.raw.white,
  },
  sectionBadge: {
    backgroundColor: Colors.raw.zinc700,
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },
  sectionBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: Colors.raw.zinc300,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
  },
  teamRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  teamAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.raw.amber500 + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  teamInfo: {
    flex: 1,
  },
  teamTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  teamName: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.white,
  },
  teamRole: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.amber500,
  },
  teamSchedule: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  milestoneRow: {
    flexDirection: "row",
  },
  milestoneTimeline: {
    width: 32,
    alignItems: "center",
  },
  milestoneDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  milestoneLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.raw.zinc800,
    marginTop: -2,
  },
  milestoneContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 12,
    paddingBottom: 20,
  },
  milestoneLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.white,
    marginBottom: 3,
  },
  milestoneDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
});
