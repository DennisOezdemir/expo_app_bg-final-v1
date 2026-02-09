import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  Dimensions,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useMemo, useCallback } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const SCREEN_W = Dimensions.get("window").width;
const NAME_COL_W = 76;
const DAY_COL_W = Math.max((SCREEN_W - NAME_COL_W - 40) / 5, 56);
const BAR_H = 28;
const ROW_H = 72;

const BLUE = "#3b82f6";

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
  positionen: string[];
}

interface ConflictInfo {
  person: string;
  dayLabel: string;
  dayIndex: number;
  projects: string[];
}

const WEEK_DATA: { kw: number; startDate: string; endDate: string; year: number; mon: number; startDay: number } = {
  kw: 6,
  startDate: "03.02.2026",
  endDate: "07.02.2026",
  year: 2026,
  mon: 1,
  startDay: 3,
};

function getWeekDays(startDay: number, month: number, year: number): WeekDay[] {
  const dayNames = ["Mo", "Di", "Mi", "Do", "Fr"];
  const _monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  return dayNames.map((d, i) => {
    const dayNum = startDay + i;
    const dt = new Date(year, month, dayNum);
    return {
      key: d + dayNum,
      short: d,
      dateStr: `${String(dayNum).padStart(2, "0")}.`,
      dayNum,
      date: dt,
    };
  });
}

const WEEK_DAYS = getWeekDays(WEEK_DATA.startDay, WEEK_DATA.mon, WEEK_DATA.year);

const ASSIGNMENTS: Assignment[] = [
  {
    id: "a1",
    person: "Mehmet",
    role: "Maler",
    days: [true, true, true, true, true],
    projectId: "BL-2026-003",
    projectName: "Schwentnerring 13c",
    projectShort: "Schwentnerring",
    address: "Schwentnerring 13c",
    addressDetail: "EG Links",
    color: Colors.raw.emerald500,
    confirmed: true,
    positionen: ["Wände spachteln (Wohnzimmer)", "Decken streichen (Flur, Küche)"],
  },
  {
    id: "a2",
    person: "Ali",
    role: "Fliese",
    days: [false, false, true, true, true],
    projectId: "BL-2026-005",
    projectName: "Haferweg 42",
    projectShort: "Haferweg",
    address: "Haferweg 42",
    addressDetail: "2. OG",
    color: Colors.raw.emerald500,
    confirmed: true,
    positionen: ["Bodenfliesen Bad", "Wandfliesen Küche"],
  },
  {
    id: "a3",
    person: "Ayse",
    role: "PL",
    days: [true, false, false, false, false],
    projectId: "BL-2026-003",
    projectName: "Schwentnerring 13c",
    projectShort: "Schwentn.",
    address: "Schwentnerring 13c",
    addressDetail: "Baustellenbesichtigung",
    color: Colors.raw.amber500,
    confirmed: true,
    positionen: ["Baufortschritt prüfen", "Aufmaß kontrollieren"],
  },
  {
    id: "a4",
    person: "Ayse",
    role: "PL",
    days: [false, false, true, false, false],
    projectId: "BL-2026-005",
    projectName: "Haferweg 42",
    projectShort: "Haferweg",
    address: "Haferweg 42",
    addressDetail: "Baustellencheck",
    color: Colors.raw.amber500,
    confirmed: true,
    positionen: ["Material-Anlieferung prüfen"],
  },
  {
    id: "a5",
    person: "Ayse",
    role: "PL",
    days: [false, false, false, false, true],
    projectId: "BL-2026-003",
    projectName: "Schwentnerring 13c",
    projectShort: "Schwentn.",
    address: "Schwentnerring 13c",
    addressDetail: "Abnahme vorbereiten",
    color: Colors.raw.amber500,
    confirmed: true,
    positionen: ["Abnahmeprotokoll vorbereiten"],
  },
  {
    id: "a6",
    person: "Dennis",
    role: "Chef",
    days: [false, false, true, false, false],
    projectId: "BL-2026-003",
    projectName: "Schwentnerring 13c",
    projectShort: "Zwischenbegehung",
    address: "Schwentnerring 13c",
    addressDetail: "Zwischenbegehung",
    color: Colors.raw.amber500,
    confirmed: true,
    positionen: ["Zwischenbegehung mit BH"],
  },
  {
    id: "a7",
    person: "Tomasz",
    role: "Sub",
    days: [true, true, true, true, false],
    projectId: "BL-2026-003",
    projectName: "Schwentnerring 13c",
    projectShort: "Schwentnerring",
    address: "Schwentnerring 13c",
    addressDetail: "EG Rechts",
    color: BLUE,
    confirmed: true,
    positionen: ["Trockenbau Wände", "Deckenabhängung"],
  },
  {
    id: "a8",
    person: "Fatih",
    role: "Maler",
    days: [true, true, false, false, false],
    projectId: "BL-2026-007",
    projectName: "Bramfelder Str. 90",
    projectShort: "Bramfelder",
    address: "Bramfelder Str. 90",
    addressDetail: "3. OG",
    color: Colors.raw.zinc700,
    confirmed: false,
    positionen: ["Tapezierarbeiten (geplant)"],
  },
];

const MONTH_DAYS_DATA = [
  { d: 2, workers: 1 }, { d: 3, workers: 4 }, { d: 4, workers: 3 },
  { d: 5, workers: 4 }, { d: 6, workers: 4 }, { d: 7, workers: 3 },
  { d: 9, workers: 2 }, { d: 10, workers: 3 }, { d: 11, workers: 4 },
  { d: 12, workers: 3 }, { d: 13, workers: 4 }, { d: 14, workers: 2 },
  { d: 16, workers: 3 }, { d: 17, workers: 4 }, { d: 18, workers: 3 },
  { d: 19, workers: 3 }, { d: 20, workers: 4 }, { d: 21, workers: 1 },
  { d: 23, workers: 4 }, { d: 24, workers: 3 }, { d: 25, workers: 4 },
  { d: 26, workers: 3 }, { d: 27, workers: 4 }, { d: 28, workers: 2 },
];

const UNASSIGNED_PROJECTS = [
  { id: "BL-2026-009", name: "Bramfelder Str.", note: "ab KW 8, kein Team" },
  { id: "BL-2026-012", name: "Billstedt", note: "Material ausstehend" },
];

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

function detectConflicts(assignments: Assignment[]): ConflictInfo[] {
  const dayLabels = ["Mo 03.02.", "Di 04.02.", "Mi 05.02.", "Do 06.02.", "Fr 07.02."];
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
          dayLabel: dayLabels[di],
          dayIndex: di,
          projects: activeOnDay.map((a) => a.projectShort),
        });
      }
    }
  }
  return conflicts;
}

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

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        barStyles.bar,
        {
          backgroundColor: assignment.color + (assignment.confirmed ? "CC" : "50"),
          borderLeftWidth: isStart ? 0 : 0,
          borderTopLeftRadius: isStart ? 6 : 0,
          borderBottomLeftRadius: isStart ? 6 : 0,
          borderTopRightRadius: isEnd ? 6 : 0,
          borderBottomRightRadius: isEnd ? 6 : 0,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
      testID={`bar-${assignment.id}-${dayIndex}`}
    >
      {isStart && (
        <Text style={barStyles.barLabel} numberOfLines={1}>
          {assignment.projectShort}
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
  onClose,
}: {
  visible: boolean;
  assignment: Assignment | null;
  onClose: () => void;
}) {
  if (!assignment) return null;

  const startIdx = assignment.days.indexOf(true);
  const endIdx = assignment.days.lastIndexOf(true);
  const dayLabels = ["Mo", "Di", "Mi", "Do", "Fr"];
  const dayRange =
    startIdx === endIdx
      ? `${dayLabels[startIdx]} ${WEEK_DAYS[startIdx]?.dateStr} Feb`
      : startIdx === 0 && endIdx === 4
      ? `Mo 03. – Fr 07. Feb (ganze Woche)`
      : `${dayLabels[startIdx]} ${WEEK_DAYS[startIdx]?.dateStr} – ${dayLabels[endIdx]} ${WEEK_DAYS[endIdx]?.dateStr} Feb`;

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
            <Text style={dsStyles.infoText}>
              {assignment.projectId} {assignment.projectName}
            </Text>
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
              testID="detail-btn"
            >
              <Text style={dsStyles.actionPrimaryText}>Details</Text>
              <Ionicons name="arrow-forward" size={16} color="#000" />
            </Pressable>
          </View>
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
      testID="conflict-banner"
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

function MonthCalendar({ onDayPress }: { onDayPress: (day: number) => void }) {
  const dayHeaders = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const febDays = 28;
  const startWeekday = 6;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= febDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const workerMap = new Map<number, number>();
  for (const md of MONTH_DAYS_DATA) {
    workerMap.set(md.d, md.workers);
  }

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
            const isToday = day === 8;

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
  onBarPress,
}: {
  personRows: ReturnType<typeof getPersonRows>;
  conflicts: ConflictInfo[];
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
          {WEEK_DAYS.map((d, _di) => (
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
            {WEEK_DAYS.map((d, di) => {
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

function LegendRow() {
  const items = [
    { color: Colors.raw.emerald500, label: "Arbeit" },
    { color: Colors.raw.amber500, label: "Termin" },
    { color: BLUE, label: "Sub" },
    { color: Colors.raw.zinc700, label: "Geplant" },
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

export default function PlanungScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const personRows = useMemo(() => getPersonRows(ASSIGNMENTS), []);
  const conflicts = useMemo(() => detectConflicts(ASSIGNMENTS), []);

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

  const kwNum = WEEK_DATA.kw + weekOffset;

  const mitarbeiterCount = personRows.length;
  const projekteCount = new Set(ASSIGNMENTS.map((a) => a.projectId)).size;
  const totalSlots = mitarbeiterCount * 5;
  const filledSlots = ASSIGNMENTS.reduce(
    (acc, a) => acc + a.days.filter(Boolean).length,
    0
  );
  const auslastung = Math.round((filledSlots / totalSlots) * 100);
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
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          style={({ pressed }) => [s.addBtn, { opacity: pressed ? 0.8 : 1 }]}
          testID="add-entry"
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
            testID="week-prev"
          >
            <Ionicons name="chevron-back" size={20} color={Colors.raw.zinc400} />
          </Pressable>
          <Text style={s.weekLabel}>
            KW {kwNum} {"\u2022"} {WEEK_DATA.startDate.slice(0, 6)}–{WEEK_DATA.endDate} 
          </Text>
          <Pressable
            onPress={handleWeekNext}
            style={({ pressed }) => [s.weekArrow, { opacity: pressed ? 0.6 : 1 }]}
            testID="week-next"
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
            testID="toggle-week"
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
            testID="toggle-month"
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

        {conflicts.length > 0 &&
          viewMode === "week" &&
          conflicts.map((c, i) => (
            <ConflictBanner
              key={`conflict-${i}`}
              conflict={c}
              onPress={() => {}}
            />
          ))}

        {viewMode === "week" ? (
          <>
            <WeekGrid
              personRows={personRows}
              conflicts={conflicts}
              onBarPress={handleBarPress}
            />
            <LegendRow />
          </>
        ) : (
          <>
            <MonthCalendar onDayPress={() => {}} />

            <View style={s.unassignedSection}>
              <View style={s.unassignedHeader}>
                <Ionicons name="warning" size={18} color={Colors.raw.amber500} />
                <Text style={s.unassignedTitle}>Nicht eingeplant:</Text>
              </View>
              {UNASSIGNED_PROJECTS.map((p) => (
                <View key={p.id} style={s.unassignedRow}>
                  <Text style={s.unassignedId}>{p.id}</Text>
                  <Text style={s.unassignedName}>{p.name}</Text>
                  <Text style={s.unassignedNote}>{p.note}</Text>
                </View>
              ))}
            </View>
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
        onClose={() => setShowDetail(false)}
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
  unassignedId: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.zinc500,
  },
  unassignedName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc300,
    flex: 1,
  },
  unassignedNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc600,
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
