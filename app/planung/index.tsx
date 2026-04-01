import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  ActivityIndicator,
  TextInput,
  Dimensions,
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
  id: string;
  projectId: string;
  projectName: string;
  address: string;
  trade: string;
  assignedMemberId: string | null;
  assignedMemberName: string | null;
  kwStart: string;
  kwEnd: string;
  startDateRaw: string | null;
  endDateRaw: string | null;
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

const DE_DAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function getCurrentKW(): number {
  const d = new Date();
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getKWFromDate(d: Date): number {
  const dayNum = d.getDay() || 7;
  const target = new Date(d);
  target.setDate(target.getDate() + 4 - dayNum);
  const yearStart = new Date(target.getFullYear(), 0, 1);
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const day = DE_DAYS[d.getDay()];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${day} ${dd}.${mm}.`;
}

function formatDateRange(startRaw: string | null, endRaw: string | null, kwStart: string, kwEnd: string): string {
  if (startRaw && endRaw) {
    return `${formatDate(startRaw)} \u2013 ${formatDate(endRaw)}`;
  }
  if (startRaw) return `ab ${formatDate(startRaw)}`;
  if (endRaw) return `bis ${formatDate(endRaw)}`;
  if (kwStart || kwEnd) return `KW ${kwStart || "?"} \u2013 KW ${kwEnd || "?"}`;
  return "Nicht geplant";
}

function kwToMonday(kw: number): Date {
  const year = new Date().getFullYear();
  const jan1 = new Date(year, 0, 1);
  const dayOfWeek = jan1.getDay() || 7;
  const monday = new Date(year, 0, 1 + (kw - 1) * 7 - dayOfWeek + 1);
  return monday;
}

// ── GanttChart ──

function GanttChart({ rows, currentKW }: { rows: PlanungRow[]; currentKW: number }) {
  const kwRange = useMemo(() => {
    const kwNums: number[] = [];
    for (const r of rows) {
      if (r.kwStart) kwNums.push(parseInt(r.kwStart, 10));
      if (r.kwEnd) kwNums.push(parseInt(r.kwEnd, 10));
    }
    if (kwNums.length === 0) return { start: currentKW, count: 6 };
    const minKW = Math.min(...kwNums);
    const maxKW = Math.max(...kwNums);
    const start = Math.max(1, minKW - 1);
    const count = Math.max(6, maxKW - start + 2);
    return { start, count: Math.min(count, 12) };
  }, [rows, currentKW]);

  const kwLabels = Array.from({ length: kwRange.count }, (_, i) => kwRange.start + i);

  return (
    <View style={g.section}>
      <Text style={g.title}>KW-Zeitplan</Text>

      {/* KW Header */}
      <View style={g.headerRow}>
        {kwLabels.map((kw) => (
          <View key={kw} style={[g.headerCell, kw === currentKW && g.headerCellActive]}>
            <Text style={[g.headerText, kw === currentKW && g.headerTextActive]}>{kw}</Text>
          </View>
        ))}
      </View>

      {/* Bars */}
      <View style={g.body}>
        {/* Grid lines */}
        {kwLabels.map((kw, i) => (
          <View
            key={`grid-${kw}`}
            style={[
              g.gridLine,
              { left: `${(i / kwRange.count) * 100}%` },
            ]}
          />
        ))}

        {/* Today marker */}
        {currentKW >= kwRange.start && currentKW < kwRange.start + kwRange.count && (
          <View
            style={[
              g.todayLine,
              { left: `${((currentKW - kwRange.start + 0.5) / kwRange.count) * 100}%` },
            ]}
          />
        )}

        {rows.map((row) => {
          const kwS = parseInt(row.kwStart, 10);
          const kwE = parseInt(row.kwEnd, 10);
          if (isNaN(kwS)) return null;
          const effectiveEnd = isNaN(kwE) ? kwS : kwE;
          const leftPct = ((kwS - kwRange.start) / kwRange.count) * 100;
          const widthPct = ((effectiveEnd - kwS + 1) / kwRange.count) * 100;
          if (leftPct + widthPct <= 0 || leftPct >= 100) return null;

          return (
            <View key={row.id} style={g.barRow}>
              <View
                style={[
                  g.bar,
                  {
                    left: `${Math.max(0, leftPct)}%`,
                    width: `${Math.min(widthPct, 100 - Math.max(0, leftPct))}%`,
                    backgroundColor: TRADE_COLORS[row.trade] ?? Colors.raw.zinc500,
                  },
                ]}
              >
                <Text style={g.barText} numberOfLines={1}>{row.trade}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const g = StyleSheet.create({
  section: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.raw.zinc800 },
  title: {
    fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.zinc500,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10,
  },
  headerRow: { flexDirection: "row", marginBottom: 6 },
  headerCell: { flex: 1, alignItems: "center", paddingVertical: 4 },
  headerCellActive: { backgroundColor: "#f59e0b20", borderRadius: 6 },
  headerText: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.raw.zinc600 },
  headerTextActive: { color: "#f59e0b", fontFamily: "Inter_700Bold" },
  body: { position: "relative", minHeight: 20 },
  gridLine: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: Colors.raw.zinc800 + "60" },
  todayLine: { position: "absolute", top: -4, bottom: -4, width: 2, backgroundColor: "#f59e0b", zIndex: 10, borderRadius: 1 },
  barRow: { height: 26, marginBottom: 3, position: "relative" },
  bar: { position: "absolute", top: 0, height: 26, borderRadius: 7, justifyContent: "center", paddingHorizontal: 6 },
  barText: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: "#FFFFFF" },
});

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
  const [pickerRow, setPickerRow] = useState<string | null>(null);
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
                projectName: p.projects?.name ?? "\u2014",
                address: [p.projects?.object_street, p.projects?.object_city].filter(Boolean).join(", "),
                trade: p.trade || "Sonstiges",
                assignedMemberId: p.assigned_team_member_id,
                assignedMemberName: p.team_members?.name ?? null,
                kwStart: startDate ? String(getKWFromDate(startDate)) : "",
                kwEnd: endDate ? String(getKWFromDate(endDate)) : "",
                startDateRaw: p.start_date ?? null,
                endDateRaw: p.end_date ?? null,
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
    const kwNum = parseInt(value, 10);
    const dateStr = !isNaN(kwNum) && kwNum >= 1 && kwNum <= 53
      ? kwToMonday(kwNum).toISOString().split("T")[0]
      : null;

    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          [field]: value,
          isDirty: true,
          ...(field === "kwStart" && dateStr ? { startDateRaw: dateStr } : {}),
          ...(field === "kwEnd" && dateStr ? { endDateRaw: dateStr } : {}),
        };
      })
    );

    if (!dateStr) return;

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

              {/* Gantt-Diagramm */}
              <GanttChart rows={projectRows} currentKW={currentKW} />

              {/* Gewerke-Liste (vertikal) */}
              {projectRows.map((row) => (
                <View key={row.id} style={s.tradeCard}>
                  {/* Gewerk-Name */}
                  <View style={s.tradeNameRow}>
                    <View style={[s.tradeDot, { backgroundColor: TRADE_COLORS[row.trade] ?? Colors.raw.zinc500 }]} />
                    <Text style={s.tradeName}>{row.trade}</Text>
                  </View>

                  {/* Monteur */}
                  <View>
                    <Text style={s.fieldLabel}>Monteur</Text>
                    <Pressable
                      onPress={() => {
                        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPickerRow(pickerRow === row.id ? null : row.id);
                      }}
                      style={({ pressed }) => [s.dropdownBtn, { opacity: pressed ? 0.7 : 1 }]}
                    >
                      <Text style={[s.dropdownText, !row.assignedMemberName && { color: Colors.raw.zinc600 }]}>
                        {row.assignedMemberName || "Nicht zugewiesen"}
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

                  {/* Zeitraum */}
                  <View>
                    <Text style={s.fieldLabel}>Zeitraum</Text>
                    <Text style={s.dateDisplay}>
                      {formatDateRange(row.startDateRaw, row.endDateRaw, row.kwStart, row.kwEnd)}
                    </Text>
                    <View style={s.kwRow}>
                      <Text style={s.kwLabel}>Von KW</Text>
                      <TextInput
                        style={s.kwInput}
                        value={row.kwStart}
                        onChangeText={(v) => updateKW(row.id, "kwStart", v)}
                        keyboardType="number-pad"
                        placeholder="\u2014"
                        placeholderTextColor={Colors.raw.zinc600}
                        maxLength={2}
                      />
                      <Text style={s.kwLabel}>Bis KW</Text>
                      <TextInput
                        style={s.kwInput}
                        value={row.kwEnd}
                        onChangeText={(v) => updateKW(row.id, "kwEnd", v)}
                        keyboardType="number-pad"
                        placeholder="\u2014"
                        placeholderTextColor={Colors.raw.zinc600}
                        maxLength={2}
                      />
                    </View>
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
    overflow: "visible",
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

  // Trade Card (vertical layout)
  tradeCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
    gap: 10,
  },
  tradeNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tradeDot: { width: 10, height: 10, borderRadius: 5 },
  tradeName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.raw.zinc200 },

  fieldLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginBottom: 4,
  },

  dateDisplay: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc300,
    marginBottom: 6,
  },

  kwRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  kwLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
  },
  kwInput: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.white,
    textAlign: "center",
    width: 52,
    minHeight: 40,
  },

  // Dropdown
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
  },
  dropdownText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.white, flex: 1 },
  dropdownList: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    marginTop: 6,
    maxHeight: 200,
    overflow: "hidden",
  },
  dropdownOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc700,
  },
  dropdownOptionActive: { backgroundColor: Colors.raw.amber500 + "18" },
  dropdownOptionText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc300 },
  dropdownOptionMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginTop: 2 },
});
