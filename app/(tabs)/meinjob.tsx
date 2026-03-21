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
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useTeamMember, useMonteurAufgaben } from "@/hooks/queries/useMonteurAufgaben";
import { useTodayEntries } from "@/hooks/queries/useZeiterfassung";
import { useRealtimeInvalidation } from "@/hooks/realtime/useRealtimeInvalidation";
import { queryKeys } from "@/lib/query-keys";
import type { MonteurAufgabe } from "@/lib/api/monteur";

/** Ampelfarbe: Grün = läuft/ok, Gelb = bald fällig, Rot = überfällig */
function getAmpelColor(aufgabe: MonteurAufgabe): string {
  const today = new Date().toISOString().split("T")[0];
  const end = aufgabe.end_date;
  const start = aufgabe.start_date;

  if (aufgabe.status === "in_progress") return Colors.raw.emerald500;
  if (end < today) return Colors.raw.rose500; // überfällig
  // Bald fällig: Endtermin ist heute oder morgen
  const endDate = new Date(end);
  const todayDate = new Date(today);
  const diffDays = Math.ceil((endDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return Colors.raw.amber500;
  if (start <= today) return Colors.raw.emerald500; // läuft
  return Colors.raw.zinc500; // noch nicht gestartet
}

function getAmpelLabel(aufgabe: MonteurAufgabe): string {
  const today = new Date().toISOString().split("T")[0];
  if (aufgabe.status === "in_progress") return "Läuft";
  if (aufgabe.end_date < today) return "Überfällig";
  const endDate = new Date(aufgabe.end_date);
  const todayDate = new Date(today);
  const diffDays = Math.ceil((endDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return "Bald fällig";
  if (aufgabe.start_date <= today) return "Aktiv";
  return "Geplant";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

function getTodayLabel(): { label: string; date: string } {
  const now = new Date();
  const days = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  return {
    label: "Heute",
    date: `${days[now.getDay()]} ${now.getDate()}. ${months[now.getMonth()]}`,
  };
}

export default function MeinJobScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 84 : 90;

  const { data: teamMember, isLoading: tmLoading } = useTeamMember();
  const teamMemberId = teamMember?.id;

  const {
    data: aufgaben = [],
    isLoading: aufgabenLoading,
    error: aufgabenError,
  } = useMonteurAufgaben(teamMemberId);

  const { data: todayEntries = [] } = useTodayEntries(teamMemberId);

  // Realtime: schedule_phases Änderungen invalidieren
  useRealtimeInvalidation({
    channelName: "monteur-aufgaben",
    table: "schedule_phases",
    queryKeys: [queryKeys.monteur.all],
  });

  const { label: dayLabel, date: dayDate } = getTodayLabel();
  const today = new Date().toISOString().split("T")[0];

  // Aufgaben sortieren: heute zuerst, dann nach Ampel-Dringlichkeit
  const todayAufgaben = aufgaben.filter(
    (a) => a.start_date <= today && a.end_date >= today
  );
  const kommendeAufgaben = aufgaben.filter(
    (a) => a.start_date > today
  );

  const isLoading = tmLoading || aufgabenLoading;

  // Gearbeitete Stunden heute
  const todayHours = todayEntries.reduce((sum, e) => sum + e.hours, 0);
  const activeEntry = todayEntries.find((e) => e.notes === "checked_in");

  const handleAufgabeTap = (aufgabe: MonteurAufgabe) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/project/${aufgabe.project_id}`);
  };

  return (
    <View style={s.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingTop: topInset + 20, paddingBottom: bottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.dayLabel}>{dayLabel}</Text>
        <Text style={s.dayDate}>{dayDate}</Text>

        {isLoading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.raw.amber500} />
            <Text style={s.loadingText}>Aufgaben laden...</Text>
          </View>
        ) : aufgabenError ? (
          <View style={s.emptyCard}>
            <Ionicons name="warning" size={32} color={Colors.raw.rose500} />
            <Text style={s.emptyText}>Fehler beim Laden</Text>
          </View>
        ) : aufgaben.length === 0 ? (
          <View style={s.emptyCard}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.raw.emerald500} />
            <Text style={s.emptyTitle}>Keine Aufgaben</Text>
            <Text style={s.emptyText}>Aktuell sind dir keine Aufgaben zugewiesen.</Text>
          </View>
        ) : (
          <>
            {/* Heutige Aufgaben */}
            {todayAufgaben.length > 0 && (
              <>
                <Text style={s.sectionTitle}>
                  Heute ({todayAufgaben.length})
                </Text>
                <View style={s.card}>
                  {todayAufgaben.map((aufgabe, i) => {
                    const ampelColor = getAmpelColor(aufgabe);
                    const ampelLabel = getAmpelLabel(aufgabe);
                    return (
                      <Pressable
                        key={aufgabe.id}
                        onPress={() => handleAufgabeTap(aufgabe)}
                        style={({ pressed }) => [
                          s.aufgabeRow,
                          i < todayAufgaben.length - 1 && s.aufgabeBorder,
                          { opacity: pressed ? 0.85 : 1 },
                        ]}
                        testID={`aufgabe-${aufgabe.id}`}
                      >
                        <View style={[s.ampelDot, { backgroundColor: ampelColor }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.aufgabeProject} numberOfLines={1}>
                            {aufgabe.object_street}
                          </Text>
                          <Text style={s.aufgabeTrade}>{aufgabe.trade}</Text>
                          <Text style={s.aufgabeMeta}>
                            {aufgabe.object_city} {aufgabe.estimated_hours ? `\u2022 ${aufgabe.estimated_hours}h geplant` : ""}
                          </Text>
                        </View>
                        <View style={s.aufgabeRight}>
                          <View style={[s.statusBadge, { backgroundColor: ampelColor + "20" }]}>
                            <Text style={[s.statusText, { color: ampelColor }]}>{ampelLabel}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color={Colors.raw.zinc600} />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {/* Kommende Aufgaben */}
            {kommendeAufgaben.length > 0 && (
              <>
                <Text style={s.sectionTitle}>
                  Kommende ({kommendeAufgaben.length})
                </Text>
                <View style={s.card}>
                  {kommendeAufgaben.map((aufgabe, i) => {
                    const ampelColor = getAmpelColor(aufgabe);
                    return (
                      <Pressable
                        key={aufgabe.id}
                        onPress={() => handleAufgabeTap(aufgabe)}
                        style={({ pressed }) => [
                          s.aufgabeRow,
                          i < kommendeAufgaben.length - 1 && s.aufgabeBorder,
                          { opacity: pressed ? 0.85 : 1 },
                        ]}
                      >
                        <View style={[s.ampelDot, { backgroundColor: ampelColor }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.aufgabeProject} numberOfLines={1}>
                            {aufgabe.object_street}
                          </Text>
                          <Text style={s.aufgabeTrade}>{aufgabe.trade}</Text>
                        </View>
                        <View style={s.aufgabeRight}>
                          <Text style={s.aufgabeDate}>
                            {formatDate(aufgabe.start_date)}
                          </Text>
                          <Ionicons name="chevron-forward" size={18} color={Colors.raw.zinc600} />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}

        {/* Kurzinfo Zeiterfassung */}
        {(activeEntry || todayHours > 0) && (
          <>
            <Text style={s.sectionTitle}>Zeit heute</Text>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/zeiten");
              }}
              style={({ pressed }) => [s.timeCard, { opacity: pressed ? 0.9 : 1 }]}
            >
              <View style={s.timeTop}>
                <Ionicons name="time-outline" size={22} color={Colors.raw.amber500} />
                <Text style={s.stampTime}>
                  {activeEntry ? "Eingestempelt" : `${todayHours.toFixed(1)}h gearbeitet`}
                </Text>
              </View>
              {activeEntry && (
                <View style={[s.statusBadge, { backgroundColor: Colors.raw.emerald500 + "20", alignSelf: "flex-start" }]}>
                  <View style={s.runningDot} />
                  <Text style={[s.statusText, { color: Colors.raw.emerald500 }]}>Läuft</Text>
                </View>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  scroll: { paddingHorizontal: 20 },

  dayLabel: { fontFamily: "Inter_800ExtraBold", fontSize: 30, color: Colors.raw.white, marginBottom: 2 },
  dayDate: { fontFamily: "Inter_500Medium", fontSize: 16, color: Colors.raw.zinc500, marginBottom: 20 },

  loadingWrap: { alignItems: "center", paddingTop: 60, gap: 12 },
  loadingText: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.raw.zinc500 },

  emptyCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 40,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.raw.white },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc500, textAlign: "center" },

  sectionTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 18, color: Colors.raw.white, marginBottom: 12, marginTop: 8 },

  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    overflow: "hidden",
    marginBottom: 8,
  },

  aufgabeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  aufgabeBorder: { borderBottomWidth: 1, borderBottomColor: Colors.raw.zinc800 },

  ampelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  aufgabeProject: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.raw.white },
  aufgabeTrade: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc400, marginTop: 2 },
  aufgabeMeta: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc500, marginTop: 2 },

  aufgabeRight: { alignItems: "flex-end", gap: 6 },
  aufgabeDate: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc500 },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontFamily: "Inter_700Bold", fontSize: 12 },

  timeCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginBottom: 20,
  },
  timeTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  stampTime: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc400 },
  runningDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.raw.emerald500 },
});
