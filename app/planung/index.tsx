import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  Dimensions,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useMemo, useCallback, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { PipelineBadge } from "@/components/PipelineProgress";
import { fetchPipelineStatusBatch, checkPipelineReadiness, type PipelineRunStatus, type ReadinessResult } from "@/lib/api/pipeline";
import { useWeekSchedule, useMonthSchedule } from "@/hooks/queries/usePlanning";
import { queryKeys } from "@/lib/query-keys";

const SCREEN_W = Dimensions.get("window").width;
const NAME_COL_W = 76;
const DAY_COL_W = Math.max((SCREEN_W - NAME_COL_W - 40) / 5, 56);
const BAR_H = 28;
const ROW_H = 72;

const BLUE = "#3b82f6";

// ── helpers ──────────────────────────────────────────────────────────

interface WeekDay {
  key: string;
  short: string;
  dateStr: string;
  dayNum: number;
  date: Date;
}

interface Assignment {
  id: string;
  person: string;
  role: string;
  days: boolean[];
  projectId: string;
  projectName: string;
  projectShort: string;
  address: string;
  addressDetail: string;
  color: string;
  confirmed: boolean;
  isProposed: boolean;
  positionen: string[];
}

interface ConflictInfo {
  person: string;
  dayLabel: string;
  dayIndex: number;
  projects: string[];
}

interface UnassignedProject {
  id: string;
  projectId: string;
  name: string;
  note: string;
}

function getMonday(offset: number): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  monday.setDate(monday.getDate() + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getWeekDays(monday: Date): WeekDay[] {
  const dayNames = ["Mo", "Di", "Mi", "Do", "Fr"];
  return dayNames.map((d, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    return {
      key: d + dt.getDate(),
      short: d,
      dateStr: `${String(dt.getDate()).padStart(2, "0")}.`,
      dayNum: dt.getDate(),
      date: dt,
    };
  });
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getPersonRows(assignments: Assignment[]) {
  const personMap = new Map<string, { role: string; assignments: Assignment[] }>();
  for (const a of assignments) {
    if (!personMap.has(a.person)) {
      personMap.set(a.person, { role: a.role, assignments: [] });
    }
    personMap.get(a.person)!.assignments.push(a);
  }
  return Array.from(personMap.entries()).map(([person, data]) => ({
    person,
    role: data.role,
    assignments: data.assignments,
  }));
}

function detectConflicts(assignments: Assignment[], weekDays: WeekDay[]): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];
  const personMap = new Map<string, Assignment[]>();
  for (const a of assignments) {
    if (!personMap.has(a.person)) personMap.set(a.person, []);
    personMap.get(a.person)!.push(a);
  }
  for (const [person, pAssignments] of personMap) {
    for (let di = 0; di < 5; di++) {
      const activeOnDay = pAssignments.filter((a) => a.days[di]);
      if (activeOnDay.length > 1) {
        conflicts.push({
          person,
          dayLabel: `${weekDays[di].short} ${weekDays[di].dateStr}`,
          dayIndex: di,
          projects: activeOnDay.map((a) => a.projectShort),
        });
      }
    }
  }
  return conflicts;
}

const TRADE_COLORS: Record<string, string> = {
  Maler: Colors.raw.emerald500,
  Fliesen: "#3b82f6",
  "Sanitär": "#06b6d4",
  Elektro: Colors.raw.amber500,
  Trockenbau: "#8b5cf6",
  Sonstiges: Colors.raw.zinc500,
};

function phaseToAssignments(
  phase: any,
  weekDays: WeekDay[],
): Assignment | null {
  const phaseStart = new Date(phase.start_date + "T00:00:00");
  const phaseEnd = new Date(phase.end_date + "T00:00:00");
  const tm = phase.team_members;
  const proj = phase.projects;

  if (!proj) return null;

  const days = weekDays.map((wd) => {
    return wd.date >= phaseStart && wd.date <= phaseEnd;
  });

  if (!days.some(Boolean)) return null;

  const street = proj.object_street || proj.name || "";
  const shortName = street.length > 14 ? street.slice(0, 12) + ".." : street;

  const isProposed = phase.status === "proposed";

  return {
    id: phase.id,
    person: tm?.name || (phase.is_external ? phase.external_name || "Extern" : "Offen"),
    role: phase.trade || tm?.role || "",
    days,
    projectId: phase.project_id,
    projectName: `${proj.project_number} ${street}`,
    projectShort: shortName,
    address: street,
    addressDetail: phase.trade || "",
    color: TRADE_COLORS[phase.trade] || Colors.raw.zinc500,
    confirmed: phase.status !== "planned" && !isProposed,
    isProposed,
    positionen: [`${phase.trade}: ${phase.estimated_qty || "?"} Einheiten`],
  };
}

// ── components ──────────────────────────────────────────────────────

function AssignmentBar({
  assignment,
  dayIndex,
  onPress,
}: {
  assignment: Assignment;
  dayIndex: number;
  onPress: () => void;
}) {
  if (!assignment.days[dayIndex]) return null;

  const isStart = dayIndex === 0 || !assignment.days[dayIndex - 1];
  const isEnd = dayIndex === 4 || !assignment.days[dayIndex + 1];
  const isProposed = assignment.isProposed;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        barStyles.bar,
        {
          backgroundColor: isProposed
            ? Colors.raw.amber500 + "30"
            : assignment.color + (assignment.confirmed ? "CC" : "50"),
          borderTopLeftRadius: isStart ? 6 : 0,
          borderBottomLeftRadius: isStart ? 6 : 0,
          borderTopRightRadius: isEnd ? 6 : 0,
          borderBottomRightRadius: isEnd ? 6 : 0,
          opacity: pressed ? 0.75 : 1,
          borderWidth: isProposed ? 1.5 : 0,
          borderColor: isProposed ? Colors.raw.amber500 + "80" : "transparent",
        },
      ]}
    >
      {isStart && (
        <Text style={[barStyles.barLabel, isProposed && { color: Colors.raw.amber500 }]} numberOfLines={1}>
          {isProposed ? "\u26A1 " : ""}{assignment.projectShort}
        </Text>
      )}
    </Pressable>
  );
}

const barStyles = StyleSheet.create({
  bar: {
    height: BAR_H,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  barLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#fff",
    letterSpacing: -0.2,
  },
});

function DetailSheet({
  visible,
  assignment,
  weekDays,
  onClose,
  onConfirm,
  onDiscard,
}: {
  visible: boolean;
  assignment: Assignment | null;
  weekDays: WeekDay[];
  onClose: () => void;
  onConfirm?: (projectId: string) => void;
  onDiscard?: (projectId: string) => void;
}) {
  if (!assignment) return null;

  const startIdx = assignment.days.indexOf(true);
  const endIdx = assignment.days.lastIndexOf(true);
  const dayLabels = ["Mo", "Di", "Mi", "Do", "Fr"];
  const dayRange =
    startIdx === endIdx
      ? `${dayLabels[startIdx]} ${weekDays[startIdx]?.dateStr}`
      : startIdx === 0 && endIdx === 4
      ? `Mo ${weekDays[0]?.dateStr} – Fr ${weekDays[4]?.dateStr} (ganze Woche)`
      : `${dayLabels[startIdx]} ${weekDays[startIdx]?.dateStr} – ${dayLabels[endIdx]} ${weekDays[endIdx]?.dateStr}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={dsStyles.overlay} onPress={onClose}>
        <Pressable style={dsStyles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={dsStyles.handle} />
          <View style={dsStyles.row}>
            <MaterialCommunityIcons name="hard-hat" size={20} color={Colors.raw.amber500} />
            <Text style={dsStyles.personText}>
              {assignment.person} {"\u2022"} {assignment.role}
            </Text>
          </View>
          <View style={dsStyles.row}>
            <Ionicons name="clipboard" size={18} color={Colors.raw.zinc400} />
            <Text style={dsStyles.infoText}>{assignment.projectName}</Text>
          </View>
          <View style={dsStyles.row}>
            <Ionicons name="calendar" size={18} color={Colors.raw.zinc400} />
            <Text style={dsStyles.infoText}>{dayRange}</Text>
          </View>
          <View style={dsStyles.row}>
            <Ionicons name="location" size={18} color={Colors.raw.zinc400} />
            <Text style={dsStyles.infoText}>
              {assignment.address}, {assignment.addressDetail}
            </Text>
          </View>

          {assignment.positionen.length > 0 && (
            <View style={dsStyles.posSection}>
              <Text style={dsStyles.posTitle}>Positionen diese Woche:</Text>
              {assignment.positionen.map((p, i) => (
                <View key={i} style={dsStyles.posRow}>
                  <View style={dsStyles.posDot} />
                  <Text style={dsStyles.posText}>{p}</Text>
                </View>
              ))}
            </View>
          )}

          {assignment.isProposed ? (
            <View style={dsStyles.actions}>
              <Pressable
                onPress={() => {
                  onDiscard?.(assignment.projectId);
                  onClose();
                }}
                style={({ pressed }) => [dsStyles.actionBtn, { backgroundColor: Colors.raw.zinc800, opacity: pressed ? 0.8 : 1 }]}
              >
                <Ionicons name="close" size={16} color={Colors.raw.zinc300} />
                <Text style={dsStyles.actionSecondaryText}>Verwerfen</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onConfirm?.(assignment.projectId);
                  onClose();
                }}
                style={({ pressed }) => [dsStyles.actionBtn, { backgroundColor: Colors.raw.emerald500, opacity: pressed ? 0.9 : 1 }]}
              >
                <Ionicons name="checkmark" size={16} color="#000" />
                <Text style={[dsStyles.actionPrimaryText, { color: "#000" }]}>Freigeben</Text>
              </Pressable>
            </View>
          ) : (
            <View style={dsStyles.actions}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [dsStyles.actionBtn, dsStyles.actionSecondary, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Feather name="move" size={16} color={Colors.raw.zinc300} />
                <Text style={dsStyles.actionSecondaryText}>Umplanen</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onClose();
                  router.push(`/planung/${assignment.projectId}` as any);
                }}
                style={({ pressed }) => [dsStyles.actionBtn, dsStyles.actionPrimary, { opacity: pressed ? 0.9 : 1 }]}
              >
                <Text style={dsStyles.actionPrimaryText}>Details</Text>
                <Ionicons name="arrow-forward" size={16} color="#000" />
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const dsStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.raw.zinc900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 24,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.raw.zinc700,
    alignSelf: "center",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  personText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.raw.white,
  },
  infoText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc300,
    flex: 1,
  },
  posSection: {
    marginTop: 8,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  posTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc400,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  posRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  posDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.raw.amber500,
  },
  posText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc200,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  actionSecondary: {
    backgroundColor: Colors.raw.zinc800,
  },
  actionSecondaryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.zinc300,
  },
  actionPrimary: {
    backgroundColor: Colors.raw.amber500,
  },
  actionPrimaryText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#000",
  },
});

function ConflictBanner({
  conflict,
  onPress,
}: {
  conflict: ConflictInfo;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [cbStyles.banner, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={cbStyles.left}>
        <Ionicons name="warning" size={16} color={Colors.raw.rose500} />
        <Text style={cbStyles.text}>
          {conflict.person}: Doppelbelegung {conflict.dayLabel}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.raw.rose400} />
    </Pressable>
  );
}

const cbStyles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.raw.rose500 + "14",
    borderLeftWidth: 3,
    borderLeftColor: Colors.raw.rose500,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.rose400,
  },
});

function MonthCalendar({
  month,
  year,
  phases,
  onDayPress,
}: {
  month: number;
  year: number;
  phases: any[];
  onDayPress: (day: number) => void;
}) {
  const dayHeaders = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const workerMap = new Map<number, number>();
  for (const phase of phases) {
    const ps = new Date(phase.start_date + "T00:00:00");
    const pe = new Date(phase.end_date + "T00:00:00");
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      if (dt >= ps && dt <= pe && dt.getDay() !== 0 && dt.getDay() !== 6) {
        workerMap.set(d, (workerMap.get(d) || 0) + 1);
      }
    }
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDay = isCurrentMonth ? today.getDate() : -1;

  return (
    <View style={mcStyles.container}>
      <View style={mcStyles.headerRow}>
        {dayHeaders.map((d) => (
          <View key={d} style={mcStyles.headerCell}>
            <Text style={mcStyles.headerText}>{d}</Text>
          </View>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={mcStyles.weekRow}>
          {cells.slice(row * 7, row * 7 + 7).map((day, ci) => {
            const workers = day ? workerMap.get(day) || 0 : 0;
            const isWeekend = ci >= 5;
            const isToday = day === todayDay;

            const dotColor =
              workers >= 4
                ? Colors.raw.emerald500
                : workers >= 2
                ? Colors.raw.amber500
                : workers >= 1
                ? BLUE
                : Colors.raw.zinc700;

            return (
              <Pressable
                key={ci}
                onPress={() => day && onDayPress(day)}
                style={[mcStyles.dayCell, isToday && mcStyles.dayCellToday]}
                disabled={!day}
              >
                {day ? (
                  <>
                    <Text
                      style={[
                        mcStyles.dayNum,
                        isWeekend && mcStyles.dayNumWeekend,
                        isToday && mcStyles.dayNumToday,
                      ]}
                    >
                      {day}
                    </Text>
                    {workers > 0 && (
                      <View style={mcStyles.dotsRow}>
                        {Array.from({ length: Math.min(workers, 4) }, (_, i) => (
                          <View
                            key={i}
                            style={[mcStyles.dot, { backgroundColor: dotColor }]}
                          />
                        ))}
                      </View>
                    )}
                  </>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const mcStyles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  headerCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  headerText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.zinc500,
  },
  weekRow: {
    flexDirection: "row",
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    minHeight: 48,
    borderRadius: 8,
  },
  dayCellToday: {
    backgroundColor: Colors.raw.amber500 + "18",
  },
  dayNum: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc300,
    marginBottom: 4,
  },
  dayNumWeekend: {
    color: Colors.raw.zinc600,
  },
  dayNumToday: {
    color: Colors.raw.amber500,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});

function WeekGrid({
  personRows,
  conflicts,
  weekDays,
  onBarPress,
}: {
  personRows: ReturnType<typeof getPersonRows>;
  conflicts: ConflictInfo[];
  weekDays: WeekDay[];
  onBarPress: (a: Assignment) => void;
}) {
  const conflictSet = useMemo(() => {
    const s = new Set<string>();
    for (const c of conflicts) {
      s.add(`${c.person}-${c.dayIndex}`);
    }
    return s;
  }, [conflicts]);

  return (
    <View style={wgStyles.container}>
      <View style={wgStyles.headerRow}>
        <View style={[wgStyles.nameCol, wgStyles.headerNameCol]} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          contentContainerStyle={wgStyles.daysHeaderContent}
        >
          {weekDays.map((d) => (
            <View key={d.key} style={[wgStyles.dayHeader, { width: DAY_COL_W }]}>
              <Text style={wgStyles.dayShort}>{d.short}</Text>
              <Text style={wgStyles.dayDate}>{d.dateStr}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {personRows.map(({ person, role, assignments: pAssignments }) => (
        <View key={person} style={wgStyles.row}>
          <View style={wgStyles.nameCol}>
            <Text style={wgStyles.personName} numberOfLines={1}>
              {person}
            </Text>
            <Text style={wgStyles.personRole}>{role}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            contentContainerStyle={wgStyles.barRowContent}
          >
            {weekDays.map((d, di) => {
              const dayAssignments = pAssignments.filter((a) => a.days[di]);
              const hasConflict = conflictSet.has(`${person}-${di}`);

              return (
                <View
                  key={d.key}
                  style={[
                    wgStyles.dayCell,
                    { width: DAY_COL_W },
                    hasConflict && wgStyles.dayCellConflict,
                  ]}
                >
                  {dayAssignments.length === 0 && (
                    <View style={wgStyles.emptyCell} />
                  )}
                  {dayAssignments.map((a) => (
                    <AssignmentBar
                      key={a.id}
                      assignment={a}
                      dayIndex={di}
                      onPress={() => onBarPress(a)}
                    />
                  ))}
                </View>
              );
            })}
          </ScrollView>
        </View>
      ))}
    </View>
  );
}

const wgStyles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 20,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  headerNameCol: {
    borderRightWidth: 1,
    borderRightColor: Colors.raw.zinc800,
    justifyContent: "center",
  },
  daysHeaderContent: {
    flexDirection: "row",
  },
  dayHeader: {
    alignItems: "center",
    paddingVertical: 10,
  },
  dayShort: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.raw.zinc300,
  },
  dayDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.raw.zinc500,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
    minHeight: ROW_H,
  },
  nameCol: {
    width: NAME_COL_W,
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: Colors.raw.zinc800,
  },
  personName: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.raw.white,
    marginBottom: 2,
  },
  personRole: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.raw.zinc500,
  },
  barRowContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  dayCell: {
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 1,
    minHeight: ROW_H - 8,
    gap: 2,
  },
  dayCellConflict: {
    backgroundColor: Colors.raw.rose500 + "12",
  },
  emptyCell: {
    height: BAR_H,
  },
});

function ProposedBanner({
  count,
  onConfirmAll,
  onDiscardAll,
}: {
  count: number;
  onConfirmAll: () => void;
  onDiscardAll: () => void;
}) {
  if (count === 0) return null;
  return (
    <View style={pbStyles.banner}>
      <View style={pbStyles.left}>
        <Ionicons name="flash" size={16} color={Colors.raw.amber500} />
        <Text style={pbStyles.text}>
          {count} Vorschläge warten auf Freigabe
        </Text>
      </View>
      <View style={pbStyles.actions}>
        <Pressable
          onPress={onDiscardAll}
          style={({ pressed }) => [pbStyles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={pbStyles.discardText}>Verwerfen</Text>
        </Pressable>
        <Pressable
          onPress={onConfirmAll}
          style={({ pressed }) => [pbStyles.confirmBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={pbStyles.confirmText}>Alle Freigeben</Text>
        </Pressable>
      </View>
    </View>
  );
}

const pbStyles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.raw.amber500 + "14",
    borderLeftWidth: 3,
    borderLeftColor: Colors.raw.amber500,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.amber500,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discardText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.zinc400,
  },
  confirmBtn: {
    backgroundColor: Colors.raw.emerald500,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  confirmText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "#000",
  },
});

function LegendRow() {
  const items = [
    { color: Colors.raw.emerald500, label: "Maler" },
    { color: Colors.raw.amber500, label: "Elektro" },
    { color: BLUE, label: "Fliesen" },
    { color: Colors.raw.zinc500, label: "Sonstige" },
    { color: Colors.raw.rose500, label: "Konflikt" },
  ];

  return (
    <View style={legStyles.row}>
      {items.map((it) => (
        <View key={it.label} style={legStyles.item}>
          <View style={[legStyles.dot, { backgroundColor: it.color }]} />
          <Text style={legStyles.label}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

const legStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.zinc500,
  },
});

// ── main screen ─────────────────────────────────────────────────────

export default function PlanungScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [autoPlanning, setAutoPlanning] = useState<string | null>(null);
  const [pipelineStatuses, setPipelineStatuses] = useState<Record<string, PipelineRunStatus | "not_started">>({});

  const queryClient = useQueryClient();

  const monday = useMemo(() => getMonday(weekOffset), [weekOffset]);
  const weekDays = useMemo(() => getWeekDays(monday), [monday]);
  const kwNum = useMemo(() => getWeekNumber(monday), [monday]);
  const friday = useMemo(() => {
    const f = new Date(monday);
    f.setDate(monday.getDate() + 4);
    return f;
  }, [monday]);

  const monthDate = useMemo(() => monday, [monday]);

  // ── React Query: week schedule ──
  const weekStartStr = useMemo(() => formatDate(monday), [monday]);
  const weekEndStr = useMemo(() => formatDate(friday), [friday]);
  const { data: weekData, isLoading: weekLoading } = useWeekSchedule(weekStartStr, weekEndStr);
  const phases = weekData?.phases ?? [];
  const loading = weekLoading;

  // Derive unassigned projects from query data
  const unassigned = useMemo(() => {
    return (weekData?.unassignedProjects ?? []).map((p) => ({
      id: p.project_number || p.id,
      projectId: p.id,
      name: p.object_street || p.name || "",
      note: p.planned_start
        ? `ab ${new Date(p.planned_start).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}`
        : "kein Startdatum",
    }));
  }, [weekData]);

  // Fetch pipeline statuses when unassigned list changes
  useEffect(() => {
    const ids = unassigned.map((p) => p.projectId);
    if (ids.length > 0) {
      fetchPipelineStatusBatch(ids).then(setPipelineStatuses).catch(() => {});
    }
  }, [unassigned]);

  // ── React Query: month schedule ──
  const { data: monthPhasesData } = useMonthSchedule(
    monthDate.getFullYear(),
    monthDate.getMonth(),
    viewMode === "month"
  );
  const monthPhases = monthPhasesData ?? [];

  const assignments = useMemo(() => {
    return phases
      .map((p) => phaseToAssignments(p, weekDays))
      .filter(Boolean) as Assignment[];
  }, [phases, weekDays]);

  const personRows = useMemo(() => getPersonRows(assignments), [assignments]);
  const conflicts = useMemo(() => detectConflicts(assignments, weekDays), [assignments, weekDays]);

  const handleBarPress = useCallback((a: Assignment) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedAssignment(a);
    setShowDetail(true);
  }, []);

  const handleWeekPrev = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setWeekOffset((o) => o - 1);
  }, []);

  const handleWeekNext = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setWeekOffset((o) => o + 1);
  }, []);

  const doAutoPlan = useCallback(async (projectId: string) => {
    try {
      const { data, error } = await supabase.rpc("auto_plan_full", {
        p_project_id: projectId,
      });
      if (error) {
        Alert.alert("Fehler", error.message);
        return;
      }
      const result = data as any;
      if (!result?.success) {
        Alert.alert("Fehler", result?.error || "Unbekannter Fehler");
        return;
      }
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      const sched = result.schedule || {};
      const mat = result.material || {};
      const unassignedTrades = sched.unassigned_trades || [];
      const lines = [
        sched.phases_created ? `${sched.phases_created} Phasen erstellt` : null,
        sched.assigned_count ? `${sched.assigned_count} Monteure zugewiesen` : null,
        unassignedTrades.length > 0 ? `Ohne Monteur: ${unassignedTrades.join(", ")}` : null,
        mat.needs_created ? `${mat.needs_created} Material-Bedarfe erstellt` : null,
        mat.total_cost ? `Material-Kosten: €${Number(mat.total_cost).toLocaleString("de-DE")}` : null,
        "\nFreigaben im Freigabecenter prüfen.",
      ].filter(Boolean);
      Alert.alert("Planung erstellt", lines.join("\n"));
      queryClient.invalidateQueries({ queryKey: queryKeys.planning.all });
    } catch (e: any) {
      Alert.alert("Fehler", e.message || "Auto-Planung fehlgeschlagen");
    } finally {
      setAutoPlanning(null);
    }
  }, [queryClient]);

  const handleAutoPlan = useCallback(async (projectId: string) => {
    setAutoPlanning(projectId);
    try {
      const readiness = await checkPipelineReadiness(projectId);
      if (!readiness.ready) {
        const missing = readiness.items
          .filter((i) => !i.ok)
          .map((i) => `• ${i.label}: ${i.hint}`)
          .join("\n");
        setAutoPlanning(null);
        Alert.alert(
          "Noch nicht bereit",
          `Um die Autoplanung zu starten brauche ich noch:\n\n${missing}`,
        );
        return;
      }
      // Readiness OK — ask for confirmation
      Alert.alert(
        "Autoplanung starten?",
        "Alle Informationen sind vorhanden. Soll die Autoplanung jetzt gestartet werden?",
        [
          { text: "Abbrechen", style: "cancel", onPress: () => setAutoPlanning(null) },
          { text: "Ja, starten", onPress: () => doAutoPlan(projectId) },
        ],
      );
    } catch (e: any) {
      setAutoPlanning(null);
      Alert.alert("Fehler", e.message || "Prüfung fehlgeschlagen");
    }
  }, [doAutoPlan]);

  const handleConfirmProposed = useCallback(async (projectId: string) => {
    const { data, error } = await supabase.rpc("confirm_proposed_phases", {
      p_project_id: projectId,
    });
    if (error) {
      Alert.alert("Fehler", error.message);
      return;
    }
    const result = data as any;
    if (!result?.success) {
      Alert.alert("Fehler", result?.error || "Unbekannter Fehler");
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.planning.all });
  }, [queryClient]);

  const handleDiscardProposed = useCallback(async (projectId: string) => {
    Alert.alert("Vorschläge verwerfen", "Alle Vorschläge für dieses Projekt löschen?", [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Verwerfen",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.rpc("discard_proposed_phases", {
            p_project_id: projectId,
          });
          if (error) {
            Alert.alert("Fehler", error.message);
            return;
          }
          queryClient.invalidateQueries({ queryKey: queryKeys.planning.all });
        },
      },
    ]);
  }, [queryClient]);

  const proposedCount = useMemo(() => {
    return assignments.filter((a) => a.isProposed).length;
  }, [assignments]);

  const proposedProjectIds = useMemo(() => {
    const ids = new Set<string>();
    assignments.filter((a) => a.isProposed).forEach((a) => ids.add(a.projectId));
    return ids;
  }, [assignments]);

  const handleConfirmAll = useCallback(() => {
    proposedProjectIds.forEach((pid) => {
      handleConfirmProposed(pid);
    });
  }, [proposedProjectIds, handleConfirmProposed]);

  const handleDiscardAll = useCallback(() => {
    const count = proposedProjectIds.size;
    Alert.alert("Alle Vorschläge verwerfen", `${count} Projekt-Vorschläge verwerfen?`, [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Alle Verwerfen",
        style: "destructive",
        onPress: () => {
          proposedProjectIds.forEach(async (pid) => {
            await supabase.rpc("discard_proposed_phases", { p_project_id: pid });
          });
          queryClient.invalidateQueries({ queryKey: queryKeys.planning.all });
        },
      },
    ]);
  }, [proposedProjectIds, queryClient]);

  const startDateStr = `${String(weekDays[0]?.dayNum).padStart(2, "0")}.${String(monday.getMonth() + 1).padStart(2, "0")}.`;
  const endDateStr = `${String(weekDays[4]?.dayNum).padStart(2, "0")}.${String(friday.getMonth() + 1).padStart(2, "0")}.${friday.getFullYear()}`;

  const mitarbeiterCount = personRows.length;
  const projekteCount = new Set(assignments.map((a) => a.projectId)).size;
  const totalSlots = Math.max(mitarbeiterCount * 5, 1);
  const filledSlots = assignments.reduce(
    (acc, a) => acc + a.days.filter(Boolean).length,
    0
  );
  const auslastung = mitarbeiterCount > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;
  const auslastungColor =
    auslastung >= 80
      ? Colors.raw.emerald500
      : auslastung >= 50
      ? Colors.raw.amber500
      : Colors.raw.rose500;

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          style={({ pressed }) => [s.addBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Ionicons name="add" size={18} color="#000" />
          <Text style={s.addBtnText}>Eintrag</Text>
        </Pressable>
      </View>

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[
          s.scrollContent,
          { paddingTop: topInset + 64, paddingBottom: bottomInset + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.pageTitle}>Planung</Text>

        <View style={s.weekSelector}>
          <Pressable
            onPress={handleWeekPrev}
            style={({ pressed }) => [s.weekArrow, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.raw.zinc400} />
          </Pressable>
          <Text style={s.weekLabel}>
            KW {kwNum} {"\u2022"} {startDateStr}–{endDateStr}
          </Text>
          <Pressable
            onPress={handleWeekNext}
            style={({ pressed }) => [s.weekArrow, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="chevron-forward" size={20} color={Colors.raw.zinc400} />
          </Pressable>
        </View>

        <View style={s.toggleRow}>
          <Pressable
            onPress={() => setViewMode("week")}
            style={[
              s.toggleBtn,
              viewMode === "week" ? s.toggleActive : s.toggleInactive,
            ]}
          >
            <Text
              style={[
                s.toggleText,
                viewMode === "week" ? s.toggleTextActive : s.toggleTextInactive,
              ]}
            >
              Woche
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode("month")}
            style={[
              s.toggleBtn,
              viewMode === "month" ? s.toggleActive : s.toggleInactive,
            ]}
          >
            <Text
              style={[
                s.toggleText,
                viewMode === "month" ? s.toggleTextActive : s.toggleTextInactive,
              ]}
            >
              Monat
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={s.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.raw.amber500} />
            <Text style={s.loadingText}>Lade Planung...</Text>
          </View>
        ) : viewMode === "week" ? (
          <>
            <ProposedBanner
              count={proposedCount}
              onConfirmAll={handleConfirmAll}
              onDiscardAll={handleDiscardAll}
            />

            {conflicts.length > 0 &&
              conflicts.map((c, i) => (
                <ConflictBanner
                  key={`conflict-${i}`}
                  conflict={c}
                  onPress={() => {}}
                />
              ))}

            {personRows.length === 0 ? (
              <View style={s.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={Colors.raw.zinc600} />
                <Text style={s.emptyTitle}>Keine Einsätze in KW {kwNum}</Text>
                <Text style={s.emptySubtitle}>
                  In dieser Woche sind keine Mitarbeiter eingeplant.
                </Text>
              </View>
            ) : (
              <WeekGrid
                personRows={personRows}
                conflicts={conflicts}
                weekDays={weekDays}
                onBarPress={handleBarPress}
              />
            )}
            <LegendRow />

            {unassigned.length > 0 && (
              <View style={s.unassignedSection}>
                <View style={s.unassignedHeader}>
                  <Ionicons name="flash" size={18} color={Colors.raw.amber500} />
                  <Text style={s.unassignedTitle}>Nicht eingeplant:</Text>
                </View>
                {unassigned.map((p) => (
                  <View key={p.id} style={s.unassignedRow}>
                    <Pressable
                      onPress={() => router.push(`/project/${p.projectId}` as any)}
                      style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={s.unassignedId}>{p.id}</Text>
                        <Text style={s.unassignedName}>{p.name}</Text>
                        <PipelineBadge status={pipelineStatuses[p.projectId] || "not_started"} />
                      </View>
                      <Text style={s.unassignedNote}>{p.note}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleAutoPlan(p.projectId)}
                      disabled={autoPlanning === p.projectId}
                      style={({ pressed }) => [
                        s.autoPlanBtn,
                        { opacity: pressed || autoPlanning === p.projectId ? 0.6 : 1 },
                      ]}
                    >
                      {autoPlanning === p.projectId ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <>
                          <Ionicons name="flash" size={14} color="#000" />
                          <Text style={s.autoPlanBtnText}>Planen</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            <MonthCalendar
              month={monthDate.getMonth()}
              year={monthDate.getFullYear()}
              phases={monthPhases}
              onDayPress={() => {}}
            />

            {unassigned.length > 0 && (
              <View style={s.unassignedSection}>
                <View style={s.unassignedHeader}>
                  <Ionicons name="flash" size={18} color={Colors.raw.amber500} />
                  <Text style={s.unassignedTitle}>Nicht eingeplant:</Text>
                </View>
                {unassigned.map((p) => (
                  <View key={p.id} style={s.unassignedRow}>
                    <Pressable
                      onPress={() => router.push(`/project/${p.projectId}` as any)}
                      style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={s.unassignedId}>{p.id}</Text>
                        <Text style={s.unassignedName}>{p.name}</Text>
                        <PipelineBadge status={pipelineStatuses[p.projectId] || "not_started"} />
                      </View>
                      <Text style={s.unassignedNote}>{p.note}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleAutoPlan(p.projectId)}
                      disabled={autoPlanning === p.projectId}
                      style={({ pressed }) => [
                        s.autoPlanBtn,
                        { opacity: pressed || autoPlanning === p.projectId ? 0.6 : 1 },
                      ]}
                    >
                      {autoPlanning === p.projectId ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <>
                          <Ionicons name="flash" size={14} color="#000" />
                          <Text style={s.autoPlanBtnText}>Planen</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={[s.statsBar, { paddingBottom: Math.max(bottomInset, 16) }]}>
        <Text style={s.statsText}>
          KW {kwNum}: {mitarbeiterCount} Mitarbeiter {"\u2022"} {projekteCount} Projekte{" "}
          {"\u2022"}{" "}
          <Text style={{ color: auslastungColor }}>{auslastung}% Auslastung</Text>
        </Text>
        <View style={[s.statsDot, { backgroundColor: auslastungColor }]} />
      </View>

      <DetailSheet
        visible={showDetail}
        assignment={selectedAssignment}
        weekDays={weekDays}
        onClose={() => setShowDetail(false)}
        onConfirm={handleConfirmProposed}
        onDiscard={handleDiscardProposed}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: Colors.raw.zinc950 + "E6",
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 4,
  },
  addBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#000",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  pageTitle: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 28,
    color: Colors.raw.white,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  weekSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  weekArrow: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.raw.zinc900,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    alignItems: "center",
    justifyContent: "center",
  },
  weekLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.zinc300,
    textAlign: "center",
  },
  toggleRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: Colors.raw.zinc900,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  toggleActive: {
    backgroundColor: Colors.raw.amber500,
  },
  toggleInactive: {
    backgroundColor: "transparent",
  },
  toggleText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  toggleTextActive: {
    color: "#000",
  },
  toggleTextInactive: {
    color: Colors.raw.zinc500,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc500,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    marginHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.raw.zinc400,
    marginTop: 8,
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc600,
    textAlign: "center",
  },
  unassignedSection: {
    marginHorizontal: 20,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 16,
    marginBottom: 16,
  },
  unassignedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  unassignedTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.amber500,
  },
  unassignedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
  },
  autoPlanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
  },
  autoPlanBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#000",
  },
  unassignedId: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.zinc500,
  },
  unassignedName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc300,
  },
  unassignedNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc600,
    marginTop: 2,
  },
  statsBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.zinc900,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  statsText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc400,
    textAlign: "center",
  },
  statsDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});