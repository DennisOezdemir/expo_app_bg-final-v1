import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface DayEntry {
  day: string;
  start: string;
  end: string;
  hours: string;
  status: "done" | "running" | "planned";
}

const WEEK_ENTRIES: DayEntry[] = [
  { day: "Mo", start: "7:15", end: "16:00", hours: "8:00h", status: "done" },
  { day: "Di", start: "7:30", end: "15:45", hours: "7:30h", status: "done" },
  { day: "Mi", start: "7:15", end: "...", hours: "4:32h", status: "running" },
  { day: "Do", start: "\u2014", end: "", hours: "\u2014", status: "planned" },
  { day: "Fr", start: "\u2014", end: "", hours: "\u2014", status: "planned" },
];

export default function ZeitenScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 84 : 90;

  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(4 * 3600 + 32 * 60 + 15);

  useEffect(() => {
    if (!isRunning || isPaused) return;
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  const formatTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const sec = totalSec % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const totalWeekHours = "20:02h";

  const handlePause = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPaused(!isPaused);
  };

  const handleEnd = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsRunning(false);
  };

  return (
    <View style={s.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingTop: topInset + 20, paddingBottom: bottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>Zeiterfassung</Text>

        <View style={s.timerCard}>
          {isRunning ? (
            <>
              <View style={s.runningBadge}>
                <View style={s.runningDot} />
                <Text style={s.runningText}>{isPaused ? "PAUSE" : "LÄUFT"}</Text>
              </View>
              <Text style={s.timerValue}>{formatTime(seconds)}</Text>
              <Text style={s.timerSince}>Seit 07:15 Uhr</Text>

              <View style={s.locationRow}>
                <Ionicons name="location" size={16} color={Colors.raw.zinc500} />
                <Text style={s.locationText}>Schwentnerring 13c</Text>
              </View>

              <View style={s.timerButtons}>
                <Pressable
                  onPress={handlePause}
                  style={({ pressed }) => [s.pauseBtn, { opacity: pressed ? 0.8 : 1 }]}
                  testID="pause-button"
                >
                  <Feather name={isPaused ? "play" : "coffee"} size={20} color={Colors.raw.zinc300} />
                  <Text style={s.pauseBtnText}>{isPaused ? "Weiter" : "Pause"}</Text>
                </Pressable>
                <Pressable
                  onPress={handleEnd}
                  style={({ pressed }) => [s.endBtn, { opacity: pressed ? 0.9 : 1 }]}
                  testID="end-button"
                >
                  <Ionicons name="home" size={20} color="#000" />
                  <Text style={s.endBtnText}>Feierabend</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={48} color={Colors.raw.emerald500} />
              <Text style={s.doneText}>Feierabend!</Text>
              <Text style={s.doneHours}>{formatTime(seconds)} gearbeitet</Text>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setIsRunning(true);
                  setIsPaused(false);
                }}
                style={({ pressed }) => [s.restartBtn, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Feather name="play" size={16} color={Colors.raw.amber500} />
                <Text style={s.restartText}>Erneut starten</Text>
              </Pressable>
            </>
          )}
        </View>

        <Text style={s.sectionTitle}>Diese Woche</Text>
        <View style={s.weekCard}>
          {WEEK_ENTRIES.map((entry, i) => {
            const isActive = entry.status === "running";
            const isDone = entry.status === "done";
            const isPlanned = entry.status === "planned";
            return (
              <View
                key={entry.day}
                style={[
                  s.weekRow,
                  i < WEEK_ENTRIES.length - 1 && s.weekBorder,
                  isActive && s.weekRowActive,
                ]}
              >
                <Text style={[s.weekDay, isActive && s.weekDayActive]}>{entry.day}</Text>
                <Text style={[s.weekTime, isPlanned && s.weekTimePlanned]}>
                  {entry.start}{entry.end ? ` \u2014 ${entry.end}` : ""}
                </Text>
                <Text style={[s.weekHours, isPlanned && s.weekTimePlanned]}>
                  {entry.hours}
                </Text>
                <View style={{ width: 24, alignItems: "center" }}>
                  {isDone && <Ionicons name="checkmark-circle" size={18} color={Colors.raw.emerald500} />}
                  {isActive && <Ionicons name="time" size={18} color={Colors.raw.amber500} />}
                  {isPlanned && <Text style={s.plannedText}>geplant</Text>}
                </View>
              </View>
            );
          })}

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Gesamt:</Text>
            <Text style={s.totalValue}>{totalWeekHours}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  scroll: { paddingHorizontal: 20 },
  title: { fontFamily: "Inter_800ExtraBold", fontSize: 30, color: Colors.raw.white, marginBottom: 24 },

  timerCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 28,
    alignItems: "center",
    marginBottom: 32,
  },
  runningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.raw.amber500 + "18",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 16,
  },
  runningDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.raw.amber500 },
  runningText: { fontFamily: "Inter_800ExtraBold", fontSize: 13, color: Colors.raw.amber500, letterSpacing: 1 },
  timerValue: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 44,
    fontWeight: "800",
    color: Colors.raw.white,
    marginBottom: 4,
    letterSpacing: -1,
  },
  timerSince: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.raw.zinc500, marginBottom: 16 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 24 },
  locationText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc500 },
  timerButtons: { flexDirection: "row", gap: 10, width: "100%" },
  pauseBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 14,
    paddingVertical: 18,
  },
  pauseBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.raw.zinc300 },
  endBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 14,
    paddingVertical: 18,
  },
  endBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#000" },

  doneText: { fontFamily: "Inter_800ExtraBold", fontSize: 24, color: Colors.raw.emerald500, marginTop: 12, marginBottom: 4 },
  doneHours: { fontFamily: "Inter_500Medium", fontSize: 16, color: Colors.raw.zinc400, marginBottom: 20 },
  restartBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.raw.amber500 + "18",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  restartText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.amber500 },

  sectionTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 18, color: Colors.raw.white, marginBottom: 12 },
  weekCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    overflow: "hidden",
  },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  weekBorder: { borderBottomWidth: 1, borderBottomColor: Colors.raw.zinc800 },
  weekRowActive: { backgroundColor: Colors.raw.amber500 + "08" },
  weekDay: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.white, width: 30 },
  weekDayActive: { color: Colors.raw.amber500 },
  weekTime: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc400, flex: 1 },
  weekTimePlanned: { color: Colors.raw.zinc600 },
  weekHours: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.white, width: 60, textAlign: "right" },
  plannedText: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.raw.zinc600 },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc700,
  },
  totalLabel: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.zinc400 },
  totalValue: { fontFamily: "Inter_800ExtraBold", fontSize: 18, color: Colors.raw.white },
});
