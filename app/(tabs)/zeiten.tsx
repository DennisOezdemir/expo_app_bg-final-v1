import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useState, useEffect, useMemo } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useTeamMember, useMonteurAufgaben } from "@/hooks/queries/useMonteurAufgaben";
import { useTodayEntries, useWeekEntries } from "@/hooks/queries/useZeiterfassung";
import { useCheckIn, useCheckOut } from "@/hooks/mutations/useZeitMutations";
import { useRealtimeInvalidation } from "@/hooks/realtime/useRealtimeInvalidation";
import { queryKeys } from "@/lib/query-keys";

const DAY_NAMES = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function formatTimer(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function formatHours(h: number): string {
  return `${h.toFixed(1)}h`;
}

export default function ZeitenScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 84 : 90;

  const { data: teamMember, isLoading: tmLoading } = useTeamMember();
  const teamMemberId = teamMember?.id;

  const { data: aufgaben = [] } = useMonteurAufgaben(teamMemberId);
  const { data: todayEntries = [], isLoading: todayLoading } = useTodayEntries(teamMemberId);
  const { data: weekEntries = [] } = useWeekEntries(teamMemberId);

  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  // Realtime
  useRealtimeInvalidation({
    channelName: "zeit-realtime",
    table: "time_entries",
    queryKeys: [queryKeys.zeiterfassung.all],
  });

  // Aktiver Eintrag = checked_in aber noch nicht checked_out
  const activeEntry = todayEntries.find((e) => e.notes === "checked_in");
  const isCheckedIn = !!activeEntry;

  // Timer: Sekunden seit Check-In
  const [timerSec, setTimerSec] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!activeEntry) {
      setTimerSec(0);
      return;
    }
    // Berechne vergangene Sekunden seit created_at
    const checkInTime = new Date(activeEntry.created_at).getTime();
    const elapsed = Math.floor((Date.now() - checkInTime) / 1000);
    setTimerSec(Math.max(0, elapsed));
  }, [activeEntry?.id, activeEntry?.created_at]);

  useEffect(() => {
    if (!isCheckedIn || isPaused) return;
    const interval = setInterval(() => {
      setTimerSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCheckedIn, isPaused]);

  // Check-In Uhrzeit
  const checkInTimeLabel = activeEntry
    ? new Date(activeEntry.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    : null;

  // Aktuelles Projekt des Monteurs
  const today = new Date().toISOString().split("T")[0];
  const currentAufgabe = aufgaben.find(
    (a) => a.start_date <= today && a.end_date >= today
  ) ?? aufgaben[0];

  const handleCheckIn = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!currentAufgabe) {
      Alert.alert("Kein Projekt", "Dir ist aktuell kein Projekt zugewiesen.");
      return;
    }
    if (!teamMemberId) return;

    checkInMutation.mutate({
      project_id: currentAufgabe.project_id,
      team_member_id: teamMemberId,
      trade: currentAufgabe.trade,
    });
  };

  const handleCheckOut = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!activeEntry) return;

    const hours = timerSec / 3600;
    checkOutMutation.mutate({
      entry_id: activeEntry.id,
      hours: Math.round(hours * 100) / 100,
    });
    setIsPaused(false);
  };

  const handlePause = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPaused(!isPaused);
  };

  // Wochenübersicht berechnen
  const weekData = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const days: { day: string; date: string; hours: number; status: "done" | "running" | "planned" }[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const dayEntries = weekEntries.filter((e) => e.date === dateStr);
      const totalHours = dayEntries.reduce((sum, e) => sum + e.hours, 0);
      const hasActiveEntry = dayEntries.some((e) => e.notes === "checked_in");

      let status: "done" | "running" | "planned" = "planned";
      if (dateStr === today && hasActiveEntry) status = "running";
      else if (dayEntries.length > 0) status = "done";

      days.push({
        day: DAY_NAMES[(d.getDay())],
        date: dateStr,
        hours: status === "running" ? timerSec / 3600 + totalHours : totalHours,
        status,
      });
    }
    return days;
  }, [weekEntries, today, timerSec]);

  const totalWeekHours = weekData.reduce((sum, d) => sum + d.hours, 0);

  const isLoading = tmLoading || todayLoading;

  return (
    <View style={s.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingTop: topInset + 20, paddingBottom: bottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>Zeiterfassung</Text>

        {isLoading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.raw.amber500} />
          </View>
        ) : isCheckedIn ? (
          /* ====== Timer läuft ====== */
          <View style={s.timerCard}>
            <View style={s.runningBadge}>
              <View style={[s.runningDot, isPaused && { backgroundColor: Colors.raw.zinc500 }]} />
              <Text style={[s.runningText, isPaused && { color: Colors.raw.zinc500 }]}>
                {isPaused ? "PAUSE" : "LÄUFT"}
              </Text>
            </View>
            <Text style={s.timerValue}>{formatTimer(timerSec)}</Text>
            <Text style={s.timerSince}>Seit {checkInTimeLabel} Uhr</Text>

            {currentAufgabe && (
              <View style={s.locationRow}>
                <Ionicons name="location" size={16} color={Colors.raw.zinc500} />
                <Text style={s.locationText}>{currentAufgabe.object_street}</Text>
              </View>
            )}

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
                onPress={handleCheckOut}
                disabled={checkOutMutation.isPending}
                style={({ pressed }) => [s.endBtn, { opacity: pressed ? 0.9 : 1 }]}
                testID="end-button"
              >
                {checkOutMutation.isPending ? (
                  <ActivityIndicator size={20} color="#000" />
                ) : (
                  <Ionicons name="home" size={20} color="#000" />
                )}
                <Text style={s.endBtnText}>Feierabend</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          /* ====== Nicht eingestempelt ====== */
          <View style={s.timerCard}>
            {todayEntries.length > 0 && todayEntries.every((e) => e.notes === "checked_out") ? (
              <>
                <Ionicons name="checkmark-circle" size={48} color={Colors.raw.emerald500} />
                <Text style={s.doneText}>Feierabend!</Text>
                <Text style={s.doneHours}>
                  {formatHours(todayEntries.reduce((sum, e) => sum + e.hours, 0))} gearbeitet
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="time-outline" size={48} color={Colors.raw.zinc500} />
                <Text style={s.notCheckedTitle}>Noch nicht eingestempelt</Text>
              </>
            )}
            <Pressable
              onPress={handleCheckIn}
              disabled={checkInMutation.isPending || !currentAufgabe}
              style={({ pressed }) => [
                s.checkInBtn,
                { opacity: pressed ? 0.9 : 1 },
                !currentAufgabe && { opacity: 0.5 },
              ]}
              testID="checkin-button"
            >
              {checkInMutation.isPending ? (
                <ActivityIndicator size={20} color="#000" />
              ) : (
                <Feather name="play" size={20} color="#000" />
              )}
              <Text style={s.checkInText}>
                {currentAufgabe ? `Einstempeln \u2022 ${currentAufgabe.object_street}` : "Kein Projekt"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Wochenübersicht */}
        <Text style={s.sectionTitle}>Diese Woche</Text>
        <View style={s.weekCard}>
          {weekData.map((entry, i) => {
            const isActive = entry.status === "running";
            const isDone = entry.status === "done";
            const isPlanned = entry.status === "planned";
            return (
              <View
                key={entry.date}
                style={[
                  s.weekRow,
                  i < weekData.length - 1 && s.weekBorder,
                  isActive && s.weekRowActive,
                ]}
              >
                <Text style={[s.weekDay, isActive && s.weekDayActive]}>{entry.day}</Text>
                <View style={{ flex: 1 }} />
                <Text style={[s.weekHours, isPlanned && s.weekTimePlanned]}>
                  {isPlanned ? "\u2014" : formatHours(entry.hours)}
                </Text>
                <View style={{ width: 24, alignItems: "center" }}>
                  {isDone && <Ionicons name="checkmark-circle" size={18} color={Colors.raw.emerald500} />}
                  {isActive && <Ionicons name="time" size={18} color={Colors.raw.amber500} />}
                </View>
              </View>
            );
          })}

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Gesamt:</Text>
            <Text style={s.totalValue}>{formatHours(totalWeekHours)}</Text>
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

  loadingWrap: { alignItems: "center", paddingTop: 60 },

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

  notCheckedTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.raw.zinc400, marginTop: 12, marginBottom: 20 },

  doneText: { fontFamily: "Inter_800ExtraBold", fontSize: 24, color: Colors.raw.emerald500, marginTop: 12, marginBottom: 4 },
  doneHours: { fontFamily: "Inter_500Medium", fontSize: 16, color: Colors.raw.zinc400, marginBottom: 20 },

  checkInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 24,
    width: "100%",
  },
  checkInText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#000" },

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
  weekHours: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.white, width: 60, textAlign: "right" },
  weekTimePlanned: { color: Colors.raw.zinc600 },
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
