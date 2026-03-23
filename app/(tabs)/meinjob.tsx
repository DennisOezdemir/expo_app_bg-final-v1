import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState, useCallback } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { supabase } from "@/lib/supabase";
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

  // ── Checkliste State ──
  const [selectedAufgabe, setSelectedAufgabe] = useState<MonteurAufgabe | null>(null);
  const [checklistLang, setChecklistLang] = useState<"DE" | "TR" | "RU" | null>(null);
  const [checklistPositions, setChecklistPositions] = useState<{ id: string; nr: string; title: string; done: boolean }[]>([]);
  const [checklistLoading, setChecklistLoading] = useState(false);

  const handleAufgabeTap = (aufgabe: MonteurAufgabe) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedAufgabe(aufgabe);
    setChecklistLang(null);
    setChecklistPositions([]);
  };

  const handleLangSelect = useCallback(async (lang: "DE" | "TR" | "RU") => {
    if (!selectedAufgabe) return;
    setChecklistLang(lang);
    setChecklistLoading(true);
    try {
      // Lade Positionen für dieses Projekt (aus offer_positions via offers)
      const { data: offers } = await supabase
        .from("offers")
        .select("id")
        .eq("project_id", selectedAufgabe.project_id)
        .is("deleted_at", null)
        .order("created_at")
        .limit(1);

      if (offers && offers.length > 0) {
        const { data: positions } = await supabase
          .from("offer_positions")
          .select("id, position_number, title, progress_percent, trade, section_id")
          .eq("offer_id", offers[0].id)
          .is("deleted_at", null)
          .order("sort_order");

        // Filtere nach Trade wenn Aufgabe ein spezifisches Gewerk hat
        const filtered = (positions ?? []).filter(
          (p: any) => !selectedAufgabe.trade || selectedAufgabe.trade === "Allgemein" || p.trade === selectedAufgabe.trade
        );

        setChecklistPositions(
          filtered.map((p: any) => ({
            id: p.id,
            nr: String(p.position_number ?? ""),
            title: p.title || "",
            done: (p.progress_percent ?? 0) >= 100,
          }))
        );
      }
    } catch {
      // Fehler beim Laden
    } finally {
      setChecklistLoading(false);
    }
  }, [selectedAufgabe]);

  const togglePosition = useCallback(async (posId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChecklistPositions((prev) =>
      prev.map((p) =>
        p.id === posId ? { ...p, done: !p.done } : p
      )
    );
    const pos = checklistPositions.find((p) => p.id === posId);
    const newProgress = pos?.done ? 0 : 100;
    await supabase
      .from("offer_positions")
      .update({ progress_percent: newProgress, updated_at: new Date().toISOString() })
      .eq("id", posId);
  }, [checklistPositions]);

  const closeChecklist = useCallback(() => {
    setSelectedAufgabe(null);
    setChecklistLang(null);
    setChecklistPositions([]);
  }, []);

  const doneCount = checklistPositions.filter((p) => p.done).length;
  const totalCount = checklistPositions.length;

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

      {/* Checkliste Modal */}
      <Modal visible={!!selectedAufgabe} transparent animationType="slide" onRequestClose={closeChecklist}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { paddingTop: topInset + 12, paddingBottom: bottomInset + 12 }]}>
            {/* Header */}
            <View style={s.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.modalTitle}>{selectedAufgabe?.object_street}</Text>
                <Text style={s.modalSubtitle}>{selectedAufgabe?.trade} {"\u2022"} {selectedAufgabe?.object_city}</Text>
              </View>
              <Pressable onPress={closeChecklist} style={{ padding: 8 }}>
                <Ionicons name="close" size={24} color={Colors.raw.zinc400} />
              </Pressable>
            </View>

            {!checklistLang ? (
              /* Sprachauswahl */
              <View style={s.langSection}>
                <Ionicons name="language" size={32} color={Colors.raw.amber500} style={{ alignSelf: "center", marginBottom: 12 }} />
                <Text style={s.langTitle}>Sprache w{"\u00E4"}hlen</Text>
                <View style={s.langRow}>
                  {(["DE", "TR", "RU"] as const).map((lang) => (
                    <Pressable
                      key={lang}
                      onPress={() => handleLangSelect(lang)}
                      style={({ pressed }) => [s.langBtn, { opacity: pressed ? 0.7 : 1 }]}
                    >
                      <Text style={s.langFlag}>
                        {lang === "DE" ? "\uD83C\uDDE9\uD83C\uDDEA" : lang === "TR" ? "\uD83C\uDDF9\uD83C\uDDF7" : "\uD83C\uDDF7\uD83C\uDDFA"}
                      </Text>
                      <Text style={s.langLabel}>{lang}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : checklistLoading ? (
              <View style={s.loadingWrap}>
                <ActivityIndicator size="large" color={Colors.raw.amber500} />
                <Text style={s.loadingText}>Positionen laden...</Text>
              </View>
            ) : (
              /* Checkliste */
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <View style={s.progressHeader}>
                  <Text style={s.progressText}>{doneCount}/{totalCount} erledigt</Text>
                  <View style={s.progressBarBg}>
                    <View style={[s.progressBarFill, { width: totalCount > 0 ? `${(doneCount / totalCount) * 100}%` : "0%" }]} />
                  </View>
                </View>

                {checklistPositions.length === 0 ? (
                  <View style={s.emptyCard}>
                    <Ionicons name="document-outline" size={32} color={Colors.raw.zinc600} />
                    <Text style={s.emptyText}>Keine Positionen gefunden</Text>
                  </View>
                ) : (
                  checklistPositions.map((pos) => (
                    <Pressable
                      key={pos.id}
                      onPress={() => togglePosition(pos.id)}
                      style={({ pressed }) => [s.checkRow, { opacity: pressed ? 0.85 : 1 }]}
                    >
                      <View style={[s.checkBox, pos.done && s.checkBoxDone]}>
                        {pos.done && <Ionicons name="checkmark" size={18} color={Colors.raw.white} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.checkNr, pos.done && s.checkTextDone]}>{pos.nr}</Text>
                        <Text style={[s.checkTitle, pos.done && s.checkTextDone]} numberOfLines={2}>{pos.title}</Text>
                      </View>
                    </Pressable>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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

  // ── Modal / Checkliste ──
  modalOverlay: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  modalCard: { flex: 1, paddingHorizontal: 20 },
  modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.raw.white },
  modalSubtitle: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc400, marginTop: 2 },

  langSection: { flex: 1, justifyContent: "center", paddingBottom: 80 },
  langTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.raw.white, textAlign: "center", marginBottom: 24 },
  langRow: { flexDirection: "row", justifyContent: "center", gap: 16 },
  langBtn: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingVertical: 20,
    paddingHorizontal: 28,
    alignItems: "center",
    gap: 8,
    minWidth: 90,
  },
  langFlag: { fontSize: 32 },
  langLabel: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.raw.white },

  progressHeader: { marginBottom: 16 },
  progressText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc400, marginBottom: 8 },
  progressBarBg: { height: 6, backgroundColor: Colors.raw.zinc800, borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: 6, backgroundColor: Colors.raw.emerald500, borderRadius: 3 },

  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  checkBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.raw.zinc600,
    alignItems: "center",
    justifyContent: "center",
  },
  checkBoxDone: {
    backgroundColor: Colors.raw.emerald500,
    borderColor: Colors.raw.emerald500,
  },
  checkNr: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.zinc500 },
  checkTitle: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.raw.white, marginTop: 2 },
  checkTextDone: { textDecorationLine: "line-through", color: Colors.raw.zinc500 },
});
