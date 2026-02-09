import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  Dimensions,
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
import { useState, useMemo, useRef } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const SCREEN_W = Dimensions.get("window").width;

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

const TOTAL_DAYS = 15;
const _START_DATE = "03.02.2026";
const _END_DATE = "21.02.2026";
const CURRENT_DAY = 5;

const WEEKS = [
  { label: "KW 5", startDay: 1, endDay: 5 },
  { label: "KW 6", startDay: 6, endDay: 10 },
  { label: "KW 7", startDay: 11, endDay: 15 },
  { label: "KW 8", startDay: 16, endDay: 20 },
  { label: "KW 9", startDay: 21, endDay: 25 },
];
const ACTIVE_WEEK = 1;

const DAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr"];

const TRADES: Trade[] = [
  {
    id: "t1",
    name: "Maler",
    person: "Mehmet",
    startDay: 1,
    endDay: 10,
    doneDay: 5,
    positionen: { done: 3, total: 8 },
    color: Colors.raw.emerald500,
    status: "aktiv",
  },
  {
    id: "t2",
    name: "Boden",
    person: "Stefan",
    startDay: 6,
    endDay: 12,
    doneDay: 0,
    positionen: { done: 0, total: 5 },
    color: Colors.raw.zinc700,
    status: "geplant",
  },
  {
    id: "t3",
    name: "Sanit\u00E4r",
    person: "Ali",
    startDay: 10,
    endDay: 14,
    doneDay: 0,
    positionen: { done: 0, total: 4 },
    color: Colors.raw.zinc700,
    status: "geplant",
  },
  {
    id: "t4",
    name: "Elektro",
    person: "Mehmet",
    startDay: 3,
    endDay: 4,
    doneDay: 2,
    positionen: { done: 2, total: 2 },
    color: Colors.raw.emerald500,
    status: "fertig",
  },
];

const TEAM: TeamMember[] = [
  { name: "Mehmet", role: "Maler", days: "Mo\u2013Fr KW 6", project: "Schwentnerring" },
  { name: "Ayse", role: "Bauleitung", days: "Mo, Mi, Fr", project: "Schwentnerring" },
  { name: "Stefan", role: "Bodenleger", days: "Mo\u2013Fr KW 7", project: "Schwentnerring" },
  { name: "Ali", role: "Sanit\u00E4r", days: "Mi\u2013Fr KW 8", project: "Schwentnerring" },
];

const MEILENSTEINE: Meilenstein[] = [
  { label: "Material geliefert", date: "05.02.", status: "done" },
  { label: "Zwischenbegehung", date: "10.02.", status: "soon", daysInfo: "in 5 Tagen" },
  { label: "Abnahme", date: "21.02.", status: "future" },
];

const CONFLICTS = [
  { person: "Mehmet", date: "12.02.", trades: ["Maler", "Elektro"] },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  fertig: { label: "Fertig", color: Colors.raw.emerald500 },
  aktiv: { label: "Aktiv", color: Colors.raw.amber500 },
  geplant: { label: "Geplant", color: Colors.raw.zinc500 },
  verzug: { label: "Verzug", color: Colors.raw.rose500 },
};

function GanttBar({
  trade,
  onPress,
  expanded,
  isEditing,
  hasConflict,
}: {
  trade: Trade;
  onPress: () => void;
  expanded: boolean;
  isEditing: boolean;
  hasConflict: boolean;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const barLeft = ((trade.startDay - 1) / TOTAL_DAYS) * 100;
  const barWidth = ((trade.endDay - trade.startDay + 1) / TOTAL_DAYS) * 100;
  const doneWidth =
    trade.doneDay > 0
      ? ((Math.min(trade.doneDay, trade.endDay - trade.startDay + 1)) /
          (trade.endDay - trade.startDay + 1)) *
        100
      : 0;

  const todayInBar =
    CURRENT_DAY >= trade.startDay && CURRENT_DAY <= trade.endDay;
  const todayOffset =
    todayInBar
      ? ((CURRENT_DAY - trade.startDay) / (trade.endDay - trade.startDay + 1)) *
        100
      : -1;

  const statusCfg = STATUS_LABELS[trade.status];

  const getBarColor = () => {
    if (trade.status === "fertig") return Colors.raw.emerald500;
    if (trade.status === "verzug") return Colors.raw.rose500;
    return Colors.raw.zinc700;
  };

  const getDoneColor = () => {
    if (trade.status === "fertig") return Colors.raw.emerald500;
    return Colors.raw.emerald500;
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
                    backgroundColor: getDoneColor(),
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
            {isEditing && (
              <>
                <View style={ganttStyles.dragHandleLeft}>
                  <Ionicons name="code" size={10} color={Colors.raw.zinc300} />
                </View>
                <View style={ganttStyles.dragHandleRight}>
                  <Ionicons name="code" size={10} color={Colors.raw.zinc300} />
                </View>
              </>
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
              Tag {trade.startDay} {"\u2192"} Tag {trade.endDay}
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
  dragHandleLeft: {
    position: "absolute",
    left: 2,
    top: 0,
    bottom: 0,
    width: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  dragHandleRight: {
    position: "absolute",
    right: 2,
    top: 0,
    bottom: 0,
    width: 16,
    justifyContent: "center",
    alignItems: "center",
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

export default function PlanungScreen() {
  const { id: _id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [selectedWeek, setSelectedWeek] = useState(ACTIVE_WEEK);
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const _ganttScrollRef = useRef<ScrollView>(null);

  const progressPercent = Math.round((CURRENT_DAY / TOTAL_DAYS) * 100);
  const onSchedule = true;

  const conflictTradeIds = useMemo(() => {
    const ids = new Set<string>();
    CONFLICTS.forEach((c) => {
      TRADES.forEach((t) => {
        if (c.trades.includes(t.name) && t.person === c.person) {
          ids.add(t.id);
        }
      });
    });
    return ids;
  }, []);

  const handleWeekPress = (index: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedWeek(index);
  };

  const toggleEdit = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsEditing(!isEditing);
    setExpandedTrade(null);
  };

  const todayLinePos = ((CURRENT_DAY - 0.5) / TOTAL_DAYS) * 100;

  return (
    <View style={styles.container}>
      <View style={[styles.headerBar, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerProjectCode} numberOfLines={1}>
            BL-2026-003
          </Text>
        </View>
        <Pressable
          onPress={toggleEdit}
          style={({ pressed }) => [
            styles.editButton,
            isEditing && styles.editButtonActive,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          testID="edit-button"
        >
          <Feather name="edit-2" size={18} color={isEditing ? "#000" : Colors.raw.amber500} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 64,
            paddingBottom: isEditing ? bottomInset + 90 : bottomInset + 30,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.titleText}>Planung</Text>
          <Text style={styles.subtitleText}>
            BL-2026-003 {"\u2022"} Schwentnerring 13c
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroDayLabel}>Tag</Text>
              <View style={styles.heroDayRow}>
                <Text style={styles.heroDayBig}>{CURRENT_DAY}</Text>
                <Text style={styles.heroDayOf}>von {TOTAL_DAYS}</Text>
              </View>
            </View>
            <View style={styles.heroRight}>
              <Text style={styles.heroDateRange}>
                03.02. {"\u2192"} 21.02.2026
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
                    {
                      color: onSchedule
                        ? Colors.raw.emerald500
                        : Colors.raw.rose500,
                    },
                  ]}
                >
                  {onSchedule ? "Im Plan" : "2 Tage \u00FCber"}
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
                  backgroundColor: onSchedule
                    ? Colors.raw.emerald500
                    : Colors.raw.rose500,
                },
              ]}
            />
          </View>
          <Text style={styles.heroProgressLabel}>{progressPercent}% abgeschlossen</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.weekScroll}
          contentContainerStyle={styles.weekScrollContent}
        >
          {WEEKS.map((week, i) => (
            <Pressable
              key={i}
              onPress={() => handleWeekPress(i)}
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
            <View
              style={[
                styles.todayLine,
                { left: `${60 + ((SCREEN_W - 80) * todayLinePos) / 100}` },
              ]}
            />

            {TRADES.map((trade) => (
              <GanttBar
                key={trade.id}
                trade={trade}
                onPress={() =>
                  setExpandedTrade(
                    expandedTrade === trade.id ? null : trade.id
                  )
                }
                expanded={expandedTrade === trade.id}
                isEditing={isEditing}
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

        {CONFLICTS.length > 0 && (
          <View style={styles.conflictCard}>
            <View style={styles.conflictIcon}>
              <Ionicons name="warning" size={18} color={Colors.raw.rose500} />
            </View>
            <View style={{ flex: 1 }}>
              {CONFLICTS.map((c, i) => (
                <Text key={i} style={styles.conflictMsg}>
                  {c.person}: Doppelbelegung am {c.date}
                </Text>
              ))}
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Team diese Woche</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{TEAM.length}</Text>
            </View>
          </View>
          {TEAM.map((member, i) => (
            <View
              key={i}
              style={[
                styles.teamRow,
                i < TEAM.length - 1 && styles.teamRowBorder,
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

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Meilensteine</Text>
          </View>
          {MEILENSTEINE.map((m, i) => {
            const isLast = i === MEILENSTEINE.length - 1;
            const dotColor =
              m.status === "done"
                ? Colors.raw.emerald500
                : m.status === "soon"
                ? Colors.raw.amber500
                : Colors.raw.zinc600;
            return (
              <View key={i} style={styles.milestoneRow}>
                <View style={styles.milestoneTimeline}>
                  <View
                    style={[styles.milestoneDot, { backgroundColor: dotColor }]}
                  >
                    {m.status === "done" && (
                      <Ionicons name="checkmark" size={12} color="#000" />
                    )}
                  </View>
                  {!isLast && <View style={styles.milestoneLine} />}
                </View>
                <View
                  style={[
                    styles.milestoneContent,
                    !isLast && styles.milestoneContentBorder,
                  ]}
                >
                  <View>
                    <Text style={styles.milestoneLabel}>{m.label}</Text>
                    <Text style={styles.milestoneDate}>
                      {m.date}
                      {m.daysInfo ? ` \u2022 ${m.daysInfo}` : ""}
                    </Text>
                  </View>
                  {m.status === "done" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={Colors.raw.emerald500}
                    />
                  )}
                  {m.status === "soon" && (
                    <Ionicons
                      name="time"
                      size={20}
                      color={Colors.raw.amber500}
                    />
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {isEditing && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[
            styles.stickyBar,
            { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 8 },
          ]}
        >
          <Pressable
            onPress={toggleEdit}
            style={({ pressed }) => [
              styles.cancelBtn,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.cancelBtnText}>Abbrechen</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
              }
              setIsEditing(false);
            }}
            style={({ pressed }) => [
              styles.saveBtn,
              {
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Feather name="save" size={18} color="#000" />
            <Text style={styles.saveBtnText}>Speichern</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

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
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    alignItems: "center",
    justifyContent: "center",
  },
  editButtonActive: {
    backgroundColor: Colors.raw.amber500,
    borderColor: Colors.raw.amber500,
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
  todayLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.raw.amber500,
    opacity: 0.4,
    zIndex: 5,
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
  milestoneContentBorder: {},
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
  stickyBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.raw.zinc950,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
  },
  cancelBtn: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.zinc400,
  },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 14,
    paddingVertical: 16,
  },
  saveBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#000",
  },
});
