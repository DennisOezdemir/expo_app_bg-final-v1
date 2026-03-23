import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useMemo, useCallback, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { useTeamMembers } from "@/hooks/queries/useTeam";
import { queryKeys } from "@/lib/query-keys";

// ── Types ──

interface PlanungRow {
  id: string; // schedule_phases.id (oder temp-id für neue)
  projectId: string;
  projectName: string;
  address: string;
  trade: string;
  assignedMemberId: string | null;
  assignedMemberName: string | null;
  kwStart: string; // z.B. "14"
  kwEnd: string;
  isNew?: boolean;
  isDirty?: boolean;
}

interface ProjectForPlanning {
  id: string;
  name: string;
  address: string;
  trades: string[];
}

// ── Helpers ──

const TRADE_COLORS: Record<string, string> = {
  Maler: "#22c55e",
  Elektro: "#f59e0b",
  "Sanitär": "#3b82f6",
  Fliesen: "#a855f7",
  Trockenbau: "#ec4899",
  Tischler: "#f97316",
  Heizung: "#ef4444",
  Boden: "#14b8a6",
  Maurer: "#6b7280",
  Reinigung: "#06b6d4",
  Sonstiges: "#71717a",
};

function getCurrentKW(): number {
  const d = new Date();
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ── Main Screen ──

export default function PlanungScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 84 : insets.bottom;
  const qc = useQueryClient();

  const { data: teamMembers = [], isLoading: teamLoading } = useTeamMembers();
  const [rows, setRows] = useState<PlanungRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerRow, setPickerRow] = useState<string | null>(null); // row id for open dropdown
  const currentKW = useMemo(() => getCurrentKW(), []);

  // Lade bestehende Planungsdaten
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: phases } = await supabase
          .from("schedule_phases")
          .select(`
            id, project_id, trade, start_date, end_date, status,
            assigned_team_member_id,
            team_members:assigned_team_member_id (id, name),
            projects!inner (name, object_street, object_city)
          `)
          .in("status", ["planned", "proposed", "in_progress"])
          .order("start_date");

        if (phases) {
          setRows(
            phases.map((p: any) => {
              const startDate = p.start_date ? new Date(p.start_date) : null;
              const endDate = p.end_date ? new Date(p.end_date) : null;
              return {
                id: p.id,
                projectId: p.project_id,
                projectName: p.projects?.name ?? "—",
                address: [p.projects?.object_street, p.projects?.object_city].filter(Boolean).join(", "),
                trade: p.trade || "Sonstiges",
                assignedMemberId: p.assigned_team_member_id,
                assignedMemberName: p.team_members?.name ?? null,
                kwStart: startDate ? String(getKWFromDate(startDate)) : "",
                kwEnd: endDate ? String(getKWFromDate(endDate)) : "",
              };
            })
          );
        }
      } catch {
        // Error loading
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function getKWFromDate(d: Date): number {
    const dayNum = d.getDay() || 7;
    const target = new Date(d);
    target.setDate(target.getDate() + 4 - dayNum);
    const yearStart = new Date(target.getFullYear(), 0, 1);
    return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  // Monteur zuweisen
  const assignMember = useCallback(async (rowId: string, memberId: string, memberName: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? { ...r, assignedMemberId: memberId, assignedMemberName: memberName, isDirty: true }
          : r
      )
    );
    setPickerRow(null);

    // Direkt speichern
    try {
      await supabase
        .from("schedule_phases")
        .update({
          assigned_team_member_id: memberId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rowId);
      qc.invalidateQueries({ queryKey: queryKeys.planning.all });
    } catch {
      // Fehler beim Speichern
    }
  }, [qc]);

  // KW ändern
  const updateKW = useCallback(async (rowId: string, field: "kwStart" | "kwEnd", value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [field]: value, isDirty: true } : r))
    );

    const kwNum = parseInt(value, 10);
    if (isNaN(kwNum) || kwNum < 1 || kwNum > 53) return;

    // KW → Datum berechnen (Montag der KW)
    const year = new Date().getFullYear();
    const jan1 = new Date(year, 0, 1);
    const days = (kwNum - 1) * 7;
    const dayOfWeek = jan1.getDay() || 7;
    const monday = new Date(year, 0, 1 + days - dayOfWeek + 1);
    const dateStr = monday.toISOString().split("T")[0];

    const dbField = field === "kwStart" ? "start_date" : "end_date";
    try {
      await supabase
        .from("schedule_phases")
        .update({
          [dbField]: dateStr,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rowId);
      qc.invalidateQueries({ queryKey: queryKeys.planning.all });
    } catch {
      // Fehler
    }
  }, [qc]);

  // Projekte gruppieren
  const groupedByProject = useMemo(() => {
    const map = new Map<string, PlanungRow[]>();
    for (const row of rows) {
      const group = map.get(row.projectId) ?? [];
      group.push(row);
      map.set(row.projectId, group);
    }
    return Array.from(map.entries());
  }, [rows]);

  if (loading || teamLoading) {
    return (
      <View style={[s.container, { paddingTop: topInset + 20 }]}>
        <View style={s.headerRow}>
          <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
          </Pressable>
          <Text style={s.headerTitle}>Planung</Text>
        </View>
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.raw.amber500} />
          <Text style={s.loadingText}>Planung laden...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: topInset + 12 }]}>
      <View style={s.headerRow}>
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <Text style={s.headerTitle}>Planung</Text>
        <Text style={s.headerKW}>KW {currentKW}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomInset + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {groupedByProject.length === 0 ? (
          <View style={s.emptyCard}>
            <Ionicons name="calendar-outline" size={48} color={Colors.raw.zinc600} />
            <Text style={s.emptyTitle}>Keine Planungen</Text>
            <Text style={s.emptyText}>Erstbegehung abschlie{"\u00DF"}en, um Gewerke zu planen.</Text>
          </View>
        ) : (
          groupedByProject.map(([projectId, projectRows]) => (
            <View key={projectId} style={s.projectCard}>
              {/* Projekt-Header */}
              <View style={s.projectHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.projectName}>{projectRows[0].projectName}</Text>
                  <Text style={s.projectAddress}>{projectRows[0].address}</Text>
                </View>
                <Pressable onPress={() => router.push(`/project/${projectId}`)} style={{ padding: 6 }}>
                  <Ionicons name="open-outline" size={18} color={Colors.raw.zinc500} />
                </Pressable>
              </View>

              {/* Tabellen-Header */}
              <View style={s.tableHeader}>
                <Text style={[s.thCell, { flex: 2 }]}>Gewerk</Text>
                <Text style={[s.thCell, { flex: 3 }]}>Monteur</Text>
                <Text style={[s.thCell, { flex: 1 }]}>Von</Text>
                <Text style={[s.thCell, { flex: 1 }]}>Bis</Text>
              </View>

              {/* Zeilen */}
              {projectRows.map((row) => (
                <View key={row.id} style={s.tableRow}>
                  {/* Gewerk */}
                  <View style={[s.tdCell, { flex: 2 }]}>
                    <View style={[s.tradeDot, { backgroundColor: TRADE_COLORS[row.trade] ?? Colors.raw.zinc500 }]} />
                    <Text style={s.tradeText} numberOfLines={1}>{row.trade}</Text>
                  </View>

                  {/* Monteur Dropdown */}
                  <View style={[s.tdCell, { flex: 3 }]}>
                    <Pressable
                      onPress={() => {
                        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPickerRow(pickerRow === row.id ? null : row.id);
                      }}
                      style={({ pressed }) => [s.dropdownBtn, { opacity: pressed ? 0.7 : 1 }]}
                    >
                      <Text style={[s.dropdownText, !row.assignedMemberName && { color: Colors.raw.zinc600 }]} numberOfLines={1}>
                        {row.assignedMemberName || "---"}
                      </Text>
                      <Ionicons name="chevron-down" size={14} color={Colors.raw.zinc500} />
                    </Pressable>
                    {pickerRow === row.id && (
                      <View style={s.dropdownList}>
                        {teamMembers
                          .filter((tm) => tm.is_active)
                          .map((tm) => (
                            <Pressable
                              key={tm.id}
                              onPress={() => assignMember(row.id, tm.id, tm.name)}
                              style={({ pressed }) => [
                                s.dropdownOption,
                                tm.id === row.assignedMemberId && s.dropdownOptionActive,
                                { opacity: pressed ? 0.7 : 1 },
                              ]}
                            >
                              <Text style={[
                                s.dropdownOptionText,
                                tm.id === row.assignedMemberId && { color: Colors.raw.amber500 },
                              ]}>
                                {tm.name}
                              </Text>
                              {tm.gewerk && (
                                <Text style={s.dropdownOptionMeta}>{tm.gewerk}</Text>
                              )}
                            </Pressable>
                          ))}
                      </View>
                    )}
                  </View>

                  {/* KW Start */}
                  <View style={[s.tdCell, { flex: 1 }]}>
                    <TextInput
                      style={s.kwInput}
                      value={row.kwStart}
                      onChangeText={(v) => updateKW(row.id, "kwStart", v)}
                      keyboardType="number-pad"
                      placeholder="KW"
                      placeholderTextColor={Colors.raw.zinc600}
                      maxLength={2}
                    />
                  </View>

                  {/* KW Ende */}
                  <View style={[s.tdCell, { flex: 1 }]}>
                    <TextInput
                      style={s.kwInput}
                      value={row.kwEnd}
                      onChangeText={(v) => updateKW(row.id, "kwEnd", v)}
                      keyboardType="number-pad"
                      placeholder="KW"
                      placeholderTextColor={Colors.raw.zinc600}
                      maxLength={2}
                    />
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ──

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 24, color: Colors.raw.white, flex: 1 },
  headerKW: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.amber500 },

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
    marginTop: 20,
  },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.raw.white },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc500, textAlign: "center" },

  projectCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    marginBottom: 16,
    overflow: "hidden",
  },
  projectHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  projectName: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.raw.white },
  projectAddress: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc500, marginTop: 2 },

  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.raw.zinc800 + "40",
  },
  thCell: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.raw.zinc500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },

  tableRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
    minHeight: 48,
  },
  tdCell: {
    paddingHorizontal: 4,
    justifyContent: "center",
  },

  tradeDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6, marginTop: 4 },
  tradeText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc300 },

  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 32,
  },
  dropdownText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.white, flex: 1 },
  dropdownList: {
    position: "absolute",
    top: 38,
    left: 0,
    right: 0,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    zIndex: 100,
    maxHeight: 200,
    overflow: "hidden",
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc700,
  },
  dropdownOptionActive: { backgroundColor: Colors.raw.amber500 + "18" },
  dropdownOptionText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc300 },
  dropdownOptionMeta: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.raw.zinc500, marginTop: 2 },

  kwInput: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.white,
    textAlign: "center",
    minHeight: 32,
  },
});
