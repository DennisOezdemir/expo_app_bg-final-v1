import {
  StyleSheet,
  Text,
  View,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { useState, useCallback, useEffect } from "react";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import Colors from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { approveApproval, rejectApproval } from "@/lib/api/approvals";

// --- Types ---

type ApprovalUiType = "auftrag" | "angebot" | "material" | "nachtrag" | "rechnung" | "begehung" | "planung";

const APPROVAL_TYPE_MAP: Record<string, ApprovalUiType> = {
  PROJECT_START: "auftrag",
  INVOICE: "rechnung",
  MATERIAL_ORDER: "material",
  SUBCONTRACTOR_ORDER: "material",
  INSPECTION_ASSIGN: "angebot",
  SCHEDULE: "planung",
  COMPLETION: "angebot",
  INSPECTION: "angebot",
  SITE_INSPECTION: "begehung",
};

interface ApprovalDetail {
  id: string;
  uiType: ApprovalUiType;
  dbType: string;
  projectId: string;
  projectCode: string;
  projectAddress: string;
  clientName: string;
  status: string;
  submittedAgo: string;
  summary: string;
  requestData: any;
  // Project fields for auftrag editing
  projectName: string;
  plannedStart: string | null;
  plannedEnd: string | null;
  budgetNet: number | null;
  source: string | null;
  // Editable project fields
  objectStreet: string;
  objectZip: string;
  objectCity: string;
  clientId: string | null;
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `vor ${diffH} Stunde${diffH > 1 ? "n" : ""}`;
  const diffD = Math.floor(diffH / 24);
  return `vor ${diffD} Tag${diffD > 1 ? "en" : ""}`;
}

// --- Components ---

function StatusBadge({ status, color }: { status: string; color: string }) {
  return (
    <View style={[statusStyles.badge, { backgroundColor: color + "18" }]}>
      <View style={[statusStyles.dot, { backgroundColor: color }]} />
      <Text style={[statusStyles.text, { color }]}>{status}</Text>
    </View>
  );
}

const statusStyles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[s.card, style]}>{children}</View>;
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={s.sectionLabel}>{label}</Text>;
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <View style={s.infoRow}>
      {icon && <Ionicons name={icon as any} size={16} color={Colors.raw.zinc500} />}
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

function EditableInfoRow({
  label,
  value,
  icon,
  editing,
  editValue,
  onEditChange,
  onToggleEdit,
  placeholder,
  suggestions,
}: {
  label: string;
  value: string;
  icon?: string;
  editing: boolean;
  editValue: string;
  onEditChange: (v: string) => void;
  onToggleEdit: () => void;
  placeholder?: string;
  suggestions?: string[];
}) {
  const filtered = suggestions?.filter(
    (s) => s.toLowerCase().includes(editValue.toLowerCase()) && s.toLowerCase() !== editValue.toLowerCase()
  ) || [];

  return (
    <View style={{ zIndex: editing && filtered.length > 0 ? 10 : 0 }}>
      <View style={s.infoRow}>
        {icon && <Ionicons name={icon as any} size={16} color={Colors.raw.zinc500} />}
        <Text style={s.infoLabel}>{label}</Text>
        {editing ? (
          <TextInput
            style={s.inlineEditInput}
            value={editValue}
            onChangeText={onEditChange}
            placeholder={placeholder}
            placeholderTextColor={Colors.raw.zinc600}
            autoFocus
          />
        ) : (
          <Text style={s.infoValue}>{value || placeholder || "–"}</Text>
        )}
        <Pressable
          onPress={onToggleEdit}
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: 4 })}
        >
          <Feather name={editing ? "x" : "edit-2"} size={14} color={Colors.raw.zinc500} />
        </Pressable>
      </View>
      {editing && filtered.length > 0 && (
        <View style={s.suggestionsBox}>
          {filtered.slice(0, 5).map((item) => (
            <Pressable
              key={item}
              onPress={() => onEditChange(item)}
              style={({ pressed }) => [s.suggestionItem, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Ionicons name="business" size={14} color={Colors.raw.amber500} />
              <Text style={s.suggestionText}>{item}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function AuftragContent({ data, onDataUpdate, clientSuggestions }: { data: ApprovalDetail; onDataUpdate: (d: Partial<ApprovalDetail>) => void; clientSuggestions: string[] }) {
  const rd = data.requestData || {};

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editProject, setEditProject] = useState(data.projectName || data.projectCode);
  const [editStreet, setEditStreet] = useState(data.objectStreet);
  const [editZip, setEditZip] = useState(data.objectZip);
  const [editCity, setEditCity] = useState(data.objectCity);
  const [editClient, setEditClient] = useState(data.clientName);
  const [editEnd, setEditEnd] = useState(
    data.plannedEnd ? new Date(data.plannedEnd).toLocaleDateString("de-DE") : ""
  );
  const [editSource, setEditSource] = useState(data.source || "");
  const [saving, setSaving] = useState(false);

  const origEnd = data.plannedEnd ? new Date(data.plannedEnd).toLocaleDateString("de-DE") : "";
  const hasEdits =
    editProject !== (data.projectName || data.projectCode) ||
    editStreet !== data.objectStreet ||
    editZip !== data.objectZip ||
    editCity !== data.objectCity ||
    editClient !== data.clientName ||
    editEnd !== origEnd ||
    editSource !== (data.source || "");

  const handleSave = async () => {
    setSaving(true);
    // Parse DD.MM.YYYY → YYYY-MM-DD
    let parsedEnd: string | null = data.plannedEnd;
    if (editEnd.trim()) {
      const parts = editEnd.trim().split(".");
      if (parts.length === 3) {
        parsedEnd = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    } else {
      parsedEnd = null;
    }

    let hasError = false;

    // Project table updates
    const projUpdates: Record<string, any> = {};
    if (editProject !== (data.projectName || data.projectCode)) projUpdates.display_name = editProject;
    if (editStreet !== data.objectStreet) projUpdates.object_street = editStreet;
    if (editZip !== data.objectZip) projUpdates.object_zip = editZip;
    if (editCity !== data.objectCity) projUpdates.object_city = editCity;
    if (parsedEnd !== data.plannedEnd) projUpdates.planned_end = parsedEnd;
    if (editSource !== (data.source || "")) projUpdates.source = editSource || null;

    if (Object.keys(projUpdates).length > 0) {
      const { error } = await supabase
        .from("projects")
        .update(projUpdates)
        .eq("id", data.projectId);
      if (error) {
        console.error("Save project failed:", error);
        if (Platform.OS === "web") alert("Speichern fehlgeschlagen: " + error.message);
        hasError = true;
      }
    }

    // Client: link existing, update, or create
    if (!hasError && editClient !== data.clientName && editClient.trim()) {
      // Check if a client with this name already exists
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("company_name", editClient)
        .maybeSingle();

      if (existingClient) {
        // Link existing client to project
        const { error } = await supabase
          .from("projects")
          .update({ client_id: existingClient.id })
          .eq("id", data.projectId);
        if (error) {
          console.error("Link client failed:", error);
          hasError = true;
        } else {
          onDataUpdate({ clientId: existingClient.id });
        }
      } else if (data.clientId) {
        // Update existing linked client's name
        const { error } = await supabase
          .from("clients")
          .update({ company_name: editClient })
          .eq("id", data.clientId);
        if (error) {
          console.error("Save client failed:", error);
          if (Platform.OS === "web") alert("Auftraggeber speichern fehlgeschlagen: " + error.message);
          hasError = true;
        }
      } else {
        // Create new client and link to project
        const { data: newClient, error: createErr } = await supabase
          .from("clients")
          .insert({ company_name: editClient })
          .select("id")
          .single();
        if (createErr || !newClient) {
          console.error("Create client failed:", createErr);
          if (Platform.OS === "web") alert("Auftraggeber anlegen fehlgeschlagen: " + (createErr?.message || ""));
          hasError = true;
        } else {
          const { error: linkErr } = await supabase
            .from("projects")
            .update({ client_id: newClient.id })
            .eq("id", data.projectId);
          if (linkErr) {
            console.error("Link client failed:", linkErr);
            hasError = true;
          } else {
            onDataUpdate({ clientId: newClient.id });
          }
        }
      }
    }

    if (!hasError) {
      onDataUpdate({
        projectName: editProject,
        objectStreet: editStreet,
        objectZip: editZip,
        objectCity: editCity,
        clientName: editClient,
        plannedEnd: parsedEnd,
        source: editSource || null,
        projectAddress: [editStreet, editCity].filter(Boolean).join(", ") || "–",
      });
      setEditingField(null);
    }
    setSaving(false);
  };

  const toggleField = (field: string) => {
    if (editingField === field) {
      // Cancel: reset to original
      setEditProject(data.projectName || data.projectCode);
      setEditStreet(data.objectStreet);
      setEditZip(data.objectZip);
      setEditCity(data.objectCity);
      setEditClient(data.clientName);
      setEditEnd(origEnd);
      setEditSource(data.source || "");
      setEditingField(null);
    } else {
      setEditingField(field);
    }
  };

  return (
    <>
      <SectionLabel label="PROJEKT-DATEN" />
      <Card>
        <EditableInfoRow
          label="Projekt"
          value={editProject}
          icon="clipboard"
          editing={editingField === "project"}
          editValue={editProject}
          onEditChange={setEditProject}
          onToggleEdit={() => toggleField("project")}
        />
        <EditableInfoRow
          label="Straße"
          value={editStreet}
          icon="location"
          editing={editingField === "street"}
          editValue={editStreet}
          onEditChange={setEditStreet}
          onToggleEdit={() => toggleField("street")}
        />
        <EditableInfoRow
          label="PLZ"
          value={editZip}
          icon="location-outline"
          editing={editingField === "zip"}
          editValue={editZip}
          onEditChange={setEditZip}
          onToggleEdit={() => toggleField("zip")}
        />
        <EditableInfoRow
          label="Stadt"
          value={editCity}
          icon="location-outline"
          editing={editingField === "city"}
          editValue={editCity}
          onEditChange={setEditCity}
          onToggleEdit={() => toggleField("city")}
        />
        <EditableInfoRow
          label="Auftraggeber"
          value={editClient}
          icon="business"
          editing={editingField === "client"}
          editValue={editClient}
          onEditChange={setEditClient}
          onToggleEdit={() => toggleField("client")}
          placeholder="– Tippen zum Setzen"
          suggestions={clientSuggestions}
        />
        {data.budgetNet != null && (
          <InfoRow label="Budget netto" value={`€${data.budgetNet.toLocaleString("de-DE")}`} icon="cash" />
        )}
        {data.plannedStart && (
          <InfoRow label="Geplanter Start" value={new Date(data.plannedStart).toLocaleDateString("de-DE")} icon="calendar" />
        )}
        <EditableInfoRow
          label="Geplantes Ende"
          value={editEnd}
          icon="calendar-outline"
          editing={editingField === "end"}
          editValue={editEnd}
          onEditChange={setEditEnd}
          onToggleEdit={() => toggleField("end")}
          placeholder="– Tippen zum Setzen"
        />
        <EditableInfoRow
          label="Quelle"
          value={editSource}
          icon="mail"
          editing={editingField === "source"}
          editValue={editSource}
          onEditChange={setEditSource}
          onToggleEdit={() => toggleField("source")}
          placeholder="–"
        />
        {hasEdits && (
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              s.saveFieldButton,
              { opacity: saving ? 0.5 : pressed ? 0.8 : 1 },
            ]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={s.saveFieldText}>Speichern</Text>
              </>
            )}
          </Pressable>
        )}
      </Card>

      {rd.trades && rd.trades.length > 0 && (
        <>
          <SectionLabel label="GEWERKE" />
          <Card>
            {rd.trades.map((t: string, i: number) => (
              <View key={i} style={s.tradeChip}>
                <MaterialCommunityIcons name="hammer-wrench" size={14} color={Colors.raw.amber500} />
                <Text style={s.tradeText}>{t}</Text>
              </View>
            ))}
          </Card>
        </>
      )}

      {data.summary ? (
        <>
          <SectionLabel label="ZUSAMMENFASSUNG" />
          <Card>
            <Text style={s.summaryText}>{data.summary}</Text>
          </Card>
        </>
      ) : null}
    </>
  );
}

function MaterialContent({ data }: { data: ApprovalDetail }) {
  const rd = data.requestData || {};
  const trades = rd.trades_summary || rd.trades || [];
  const problems = rd.problems || [];
  const totalCost = rd.total_cost;
  const needsCount = rd.needs_count || rd.needs_created;

  return (
    <>
      {totalCost != null && (
        <>
          <SectionLabel label="GESAMTKOSTEN" />
          <Card>
            <View style={s.amountRow}>
              <Ionicons name="cash" size={20} color={Colors.raw.amber500} />
              <Text style={s.amountBig}>€{Number(totalCost).toLocaleString("de-DE", { minimumFractionDigits: 2 })}</Text>
            </View>
            {needsCount && (
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc500, marginTop: 8 }}>
                {needsCount} Positionen
              </Text>
            )}
          </Card>
        </>
      )}

      {trades.length > 0 && (
        <>
          <SectionLabel label="GEWERKE-ZUSAMMENFASSUNG" />
          <Card>
            {trades.map((t: any, i: number) => {
              const name = typeof t === "string" ? t : t.trade || t.name;
              const cost = typeof t === "object" ? t.cost || t.total : null;
              const count = typeof t === "object" ? t.count || t.positions : null;
              return (
                <View key={i} style={[s.tradeChip, { justifyContent: "space-between" }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <MaterialCommunityIcons name="hammer-wrench" size={14} color={Colors.raw.amber500} />
                    <Text style={s.tradeText}>{name}</Text>
                    {count != null && (
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc600 }}>
                        ({count} Pos.)
                      </Text>
                    )}
                  </View>
                  {cost != null && (
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc300 }}>
                      €{Number(cost).toLocaleString("de-DE")}
                    </Text>
                  )}
                </View>
              );
            })}
          </Card>
        </>
      )}

      {problems.length > 0 && (
        <>
          <SectionLabel label={`PROBLEME (${problems.length})`} />
          <Card>
            {problems.map((p: any, i: number) => {
              const PROBLEM_LABELS: Record<string, string> = {
                aufmass_fehlt: "Aufmaß fehlt",
                termin_fehlt: "Termin fehlt",
                mapping_fehlt: "Katalog-Zuordnung fehlt",
                preis_fehlt: "Preis fehlt",
              };
              let text: string;
              if (typeof p === "string") {
                text = p;
              } else if (p.trade && p.problem) {
                const label = PROBLEM_LABELS[p.problem] || p.problem;
                text = `${p.trade}: ${label}${p.count > 1 ? ` (${p.count} Pos.)` : ""}`;
              } else {
                text = p.message || p.description || JSON.stringify(p);
              }
              return (
                <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: i < problems.length - 1 ? 10 : 0 }}>
                  <Ionicons name="warning" size={16} color={Colors.raw.rose400} style={{ marginTop: 2 }} />
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.raw.zinc300, flex: 1 }}>
                    {text}
                  </Text>
                </View>
              );
            })}
          </Card>
        </>
      )}

      {data.summary ? (
        <>
          <SectionLabel label="ZUSAMMENFASSUNG" />
          <Card>
            <Text style={s.summaryText}>{data.summary}</Text>
          </Card>
        </>
      ) : null}
    </>
  );
}

function ScheduleContent({ data }: { data: ApprovalDetail }) {
  const rd = data.requestData || {};
  // assignments is the actual array; phases may be just a count
  const assignments: any[] = rd.assignments || [];
  const unassigned: string[] = rd.unassigned || [];

  // Compute date range from assignments
  const dates = assignments.flatMap((a: any) => [a.start_date, a.end_date].filter(Boolean)).sort();
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  return (
    <>
      <SectionLabel label="ÜBERSICHT" />
      <Card>
        <InfoRow label="Phasen" value={String(assignments.length || rd.phases || 0)} icon="layers" />
        <InfoRow label="Monteure zugewiesen" value={String(rd.assigned || assignments.length)} icon="people" />
        {startDate && <InfoRow label="Start" value={new Date(startDate).toLocaleDateString("de-DE")} icon="play-circle" />}
        {endDate && <InfoRow label="Ende" value={new Date(endDate).toLocaleDateString("de-DE")} icon="flag" />}
      </Card>

      {assignments.length > 0 && (
        <>
          <SectionLabel label={`PHASEN (${assignments.length})`} />
          <Card>
            {assignments.map((a: any, i: number) => (
              <View key={i} style={[s.posRow, i < assignments.length - 1 && s.posRowBorder]}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <MaterialCommunityIcons name="hammer-wrench" size={14} color={Colors.raw.amber500} />
                    <Text style={s.posName}>{a.trade || `Phase ${i + 1}`}</Text>
                  </View>
                  {(a.start_date || a.end_date) && (
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginTop: 4, marginLeft: 22 }}>
                      {a.start_date ? new Date(a.start_date).toLocaleDateString("de-DE") : "?"} – {a.end_date ? new Date(a.end_date).toLocaleDateString("de-DE") : "?"}
                    </Text>
                  )}
                  {a.member_name && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, marginLeft: 22 }}>
                      <Ionicons name="person" size={12} color={Colors.raw.amber500} />
                      <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.amber500 }}>
                        {a.member_name}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </Card>
        </>
      )}

      {unassigned.length > 0 && (
        <>
          <SectionLabel label="OHNE MONTEUR" />
          <Card>
            {unassigned.map((trade: string, i: number) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: i < unassigned.length - 1 ? 8 : 0 }}>
                <Ionicons name="warning" size={16} color={Colors.raw.rose400} />
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.raw.zinc300 }}>{trade}</Text>
              </View>
            ))}
          </Card>
        </>
      )}

      {data.summary ? (
        <>
          <SectionLabel label="ZUSAMMENFASSUNG" />
          <Card>
            <Text style={s.summaryText}>{data.summary}</Text>
          </Card>
        </>
      ) : null}
    </>
  );
}

function GenericContent({ data }: { data: ApprovalDetail }) {
  const rd = data.requestData || {};
  return (
    <>
      {data.summary ? (
        <>
          <SectionLabel label="DETAILS" />
          <Card>
            <Text style={s.summaryText}>{data.summary}</Text>
          </Card>
        </>
      ) : null}

      {rd.amount && (
        <>
          <SectionLabel label="BETRAG" />
          <Card>
            <View style={s.amountRow}>
              <Ionicons name="cash" size={20} color={Colors.raw.amber500} />
              <Text style={s.amountBig}>€{rd.amount}</Text>
            </View>
          </Card>
        </>
      )}

      {rd.positions && rd.positions.length > 0 && (
        <>
          <SectionLabel label="POSITIONEN" />
          <Card>
            {rd.positions.map((pos: any, i: number) => (
              <View key={i} style={[s.posRow, i < rd.positions.length - 1 && s.posRowBorder]}>
                <Text style={s.posName} numberOfLines={1}>{pos.name}</Text>
                {pos.amount && <Text style={s.posAmount}>€{pos.amount}</Text>}
              </View>
            ))}
          </Card>
        </>
      )}
    </>
  );
}

function RejectionSheet({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const insets = useSafeAreaInsets();

  const handleSubmit = () => {
    if (reason.trim().length === 0) return;
    onSubmit(reason);
    setReason("");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={rejStyles.overlay}>
        <Pressable style={rejStyles.dismissArea} onPress={onClose} />
        <View style={[rejStyles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={rejStyles.handle} />
          <Text style={rejStyles.title}>Grund für Ablehnung</Text>
          <TextInput
            style={rejStyles.input}
            placeholder="Begründung eingeben..."
            placeholderTextColor={Colors.raw.zinc600}
            multiline
            numberOfLines={4}
            value={reason}
            onChangeText={setReason}
            testID="rejection-reason"
          />
          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => [
              rejStyles.submitButton,
              { opacity: reason.trim().length === 0 ? 0.5 : pressed ? 0.8 : 1 },
            ]}
            disabled={reason.trim().length === 0}
            testID="submit-rejection"
          >
            <Ionicons name="close-circle" size={20} color="#fff" />
            <Text style={rejStyles.submitText}>Ablehnung senden</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const rejStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.raw.zinc900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.raw.zinc700,
    alignSelf: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.raw.white,
    marginBottom: 20,
  },
  input: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.white,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.rose500,
    borderRadius: 14,
    paddingVertical: 16,
  },
  submitText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#fff",
  },
});

function ApprovedToast({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(300)}
      style={toastStyles.container}
    >
      <View style={toastStyles.inner}>
        <Ionicons name="checkmark-circle" size={24} color={Colors.raw.emerald500} />
        <Text style={toastStyles.text}>Freigegeben</Text>
      </View>
    </Animated.View>
  );
}

const toastStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    zIndex: 100,
    alignItems: "center",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.raw.zinc800,
    borderWidth: 1,
    borderColor: Colors.raw.emerald500 + "40",
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  text: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.emerald500,
  },
});

export default function FreigabeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [data, setData] = useState<ApprovalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [rejectionVisible, setRejectionVisible] = useState(false);
  const [plannedDateInput, setPlannedDateInput] = useState("");
  const [savingDate, setSavingDate] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [acting, setActing] = useState(false);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [clientSuggestions, setClientSuggestions] = useState<string[]>([]);

  // Load client names for autocomplete
  useEffect(() => {
    supabase
      .from("clients")
      .select("company_name")
      .not("company_name", "is", null)
      .order("company_name")
      .then(({ data }) => {
        if (data) setClientSuggestions(data.map((c) => c.company_name).filter(Boolean));
      });
  }, []);

  const approveFlash = useSharedValue(0);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: approveFlash.value,
  }));

  // Fetch approval data
  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      const { data: row, error } = await supabase
        .from("approvals")
        .select("*, projects(id, project_number, name, display_name, object_street, object_city, object_zip, budget_net, planned_start, planned_end, source, client_id, clients(company_name, first_name, last_name))")
        .eq("id", id)
        .single();

      if (error || !row) {
        console.error("Approval detail laden:", error);
        setLoading(false);
        return;
      }

      const project = row.projects as any;
      const client = project?.clients;
      const clientName = client?.company_name || [client?.first_name, client?.last_name].filter(Boolean).join(" ") || "";

      setData({
        id: row.id,
        uiType: APPROVAL_TYPE_MAP[row.approval_type] || "angebot",
        dbType: row.approval_type,
        projectId: row.project_id,
        projectCode: project?.project_number || "–",
        projectAddress: [project?.object_street, project?.object_city].filter(Boolean).join(", ") || "–",
        clientName,
        status: "Wartet auf Freigabe",
        submittedAgo: formatTimeAgo(row.requested_at),
        summary: row.request_summary || "",
        requestData: row.request_data || {},
        projectName: project?.display_name || project?.name || "",
        plannedStart: project?.planned_start,
        plannedEnd: project?.planned_end,
        budgetNet: project?.budget_net,
        source: project?.source,
        objectStreet: project?.object_street || "",
        objectZip: project?.object_zip || "",
        objectCity: project?.object_city || "",
        clientId: project?.client_id || null,
      });
      setLoading(false);

      // Fetch PDF
      const { data: fileRow } = await supabase
        .from("project_files")
        .select("storage_path")
        .eq("project_id", row.project_id)
        .eq("file_type", "INTAKE_ORDER")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (fileRow?.storage_path) {
        setPdfPath(fileRow.storage_path);
      }
    };

    fetchDetail();
  }, [id]);

  const handleOpenPdf = useCallback(async () => {
    if (!pdfPath || pdfLoading) return;
    setPdfLoading(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const { data: urlData } = await supabase.storage
      .from("project-files")
      .createSignedUrl(pdfPath, 300);
    if (urlData?.signedUrl) {
      if (Platform.OS === "web") {
        window.open(urlData.signedUrl, "_blank");
      } else {
        Linking.openURL(urlData.signedUrl);
      }
    }
    setPdfLoading(false);
  }, [pdfPath, pdfLoading]);

  const handleDataUpdate = useCallback((updates: Partial<ApprovalDetail>) => {
    setData((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  // Sync termin input when data loads
  useEffect(() => {
    if (data?.requestData?.planned_date) {
      setPlannedDateInput(
        new Date(data.requestData.planned_date).toLocaleDateString("de-DE")
      );
    }
  }, [data?.requestData?.planned_date]);

  const handleApprove = useCallback(async () => {
    if (!data || acting) return;
    setActing(true);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    approveFlash.value = withSequence(
      withTiming(0.4, { duration: 150 }),
      withTiming(0, { duration: 400 })
    );

    try {
      await approveApproval(data.id, data.dbType);

      setShowToast(true);
      setTimeout(() => {
        if (Platform.OS === "web") {
          router.replace("/freigabe");
        } else {
          router.back();
        }
      }, 1200);
    } catch (e: any) {
      console.error("Approve error:", e);
      if (Platform.OS === "web") alert("Fehler: " + (e.message || "Freigabe fehlgeschlagen"));
      setActing(false);
    }
  }, [data, acting, router, approveFlash]);

  const handleReject = useCallback(() => {
    if (acting) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setRejectionVisible(true);
  }, [acting]);

  const handleRejectionSubmit = useCallback(
    async (reason: string) => {
      if (!data || acting) return;
      setActing(true);
      setRejectionVisible(false);

      try {
        await rejectApproval(data.id, data.dbType);

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        setTimeout(() => {
          if (Platform.OS === "web" && window.history.length <= 1) {
            router.replace("/freigabe");
          } else {
            router.back();
          }
        }, 300);
      } catch (e: any) {
        console.error("Reject error:", e);
        if (Platform.OS === "web") alert("Fehler: " + (e.message || "Ablehnung fehlgeschlagen"));
        setActing(false);
      }
    },
    [data, acting, router]
  );

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.raw.amber500} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="alert-circle" size={48} color={Colors.raw.zinc600} />
        <Text style={{ color: Colors.raw.zinc400, marginTop: 12, fontFamily: "Inter_500Medium", fontSize: 16 }}>
          Freigabe nicht gefunden
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: Colors.raw.amber500, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>Zurück</Text>
        </Pressable>
      </View>
    );
  }

  const typeTitle =
    data.uiType === "auftrag"
      ? "Auftrag freigeben"
      : data.uiType === "begehung"
      ? "Erstbegehung nötig"
      : data.uiType === "material"
      ? "Material bestellen"
      : data.uiType === "planung"
      ? "Planung freigeben"
      : data.uiType === "nachtrag"
      ? "Nachtrag genehmigen"
      : data.uiType === "rechnung"
      ? "Rechnung freigeben"
      : "Angebot freigeben";

  const approveLabel =
    data.uiType === "auftrag"
      ? "FREIGEBEN"
      : data.uiType === "begehung"
      ? "ERSTBEGEHUNG STARTEN"
      : data.uiType === "material"
      ? "BESTELLEN"
      : data.uiType === "planung"
      ? "PLANUNG BESTÄTIGEN"
      : data.uiType === "nachtrag"
      ? "GENEHMIGEN"
      : "FREIGEBEN";

  const handleBegehungStart = () => {
    const params: any = { type: "erstbegehung", projectId: data.projectId };
    if (data.requestData?.offer_id) params.offerId = data.requestData.offer_id;
    router.push({ pathname: "/begehung/[type]", params });
  };

  const handleSavePlannedDate = async () => {
    setSavingDate(true);
    try {
      const parts = plannedDateInput.trim().split(".");
      let isoDate: string | null = null;
      if (parts.length === 3) {
        isoDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
      const updatedData = { ...(data.requestData || {}), planned_date: isoDate };
      await supabase.from("approvals").update({ request_data: updatedData }).eq("id", data.id);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error("Save planned date failed:", e);
    } finally {
      setSavingDate(false);
    }
  };

  return (
    <View style={s.container}>
      <Animated.View
        style={[s.flashOverlay, { backgroundColor: Colors.raw.emerald500 }, flashStyle]}
        pointerEvents="none"
      />

      <ApprovedToast visible={showToast} />

      <View style={[s.backRow, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backButton, { opacity: pressed ? 0.7 : 1 }]}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <Text style={s.backLabel}>Freigaben</Text>
      </View>

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[
          s.scrollContent,
          {
            paddingTop: topInset + 64,
            paddingBottom: bottomInset + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.pageTitle}>{typeTitle}</Text>

        <StatusBadge status={data.status} color={Colors.raw.amber500} />
        <Text style={s.submittedAgo}>{data.submittedAgo} eingereicht</Text>

        <Card style={s.projectCard}>
          <Pressable
            style={({ pressed }) => [s.projectCardInner, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.push(`/project/${data.projectId}`)}
            testID="project-link"
          >
            <View style={s.projectLeft}>
              <Ionicons name="clipboard" size={18} color={Colors.raw.amber500} />
              <View style={{ flex: 1 }}>
                <Text style={s.projectCodeText}>
                  {data.projectCode} {"\u2022"} {data.projectAddress}
                </Text>
                <Text style={s.projectClientText}>
                  {data.clientName || "–"}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.raw.zinc600} />
          </Pressable>
        </Card>

        {pdfPath && (
          <Pressable
            onPress={handleOpenPdf}
            disabled={pdfLoading}
            style={({ pressed }) => [
              s.pdfButton,
              { opacity: pdfLoading ? 0.5 : pressed ? 0.8 : 1 },
            ]}
            testID="pdf-button"
          >
            {pdfLoading ? (
              <ActivityIndicator size="small" color={Colors.raw.amber500} />
            ) : (
              <Ionicons name="document-text" size={18} color={Colors.raw.amber500} />
            )}
            <Text style={s.pdfButtonText}>PDF anzeigen</Text>
            <Ionicons name="open-outline" size={16} color={Colors.raw.zinc500} />
          </Pressable>
        )}

        {data.uiType === "auftrag" ? (
          <AuftragContent data={data} onDataUpdate={handleDataUpdate} clientSuggestions={clientSuggestions} />
        ) : data.uiType === "begehung" ? (
          <>
            <SectionLabel label="AKTION ERFORDERLICH" />
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Ionicons name="eye" size={22} color={Colors.raw.amber500} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.raw.zinc200 }}>
                      Erstbegehung durchführen
                    </Text>
                    {data.requestData?.catalog_label ? (
                      <View style={{
                        paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
                        backgroundColor: data.requestData.catalog_label === "WABS"
                          ? "rgba(245,158,11,0.2)" : "rgba(99,102,241,0.2)",
                      }}>
                        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 11, color: Colors.raw.zinc200 }}>
                          {data.requestData.catalog_label}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc500 }}>
                    Vor-Ort-Begehung um Monteure, Material und Umfang zu klären
                  </Text>
                </View>
              </View>
            </Card>

            <SectionLabel label="TERMIN PLANEN" />
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Ionicons name="calendar-outline" size={18} color={Colors.raw.zinc500} />
                <TextInput
                  style={{ flex: 1, fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.raw.zinc200 }}
                  placeholder="TT.MM.JJJJ"
                  placeholderTextColor={Colors.raw.zinc600}
                  value={plannedDateInput}
                  onChangeText={setPlannedDateInput}
                  keyboardType="numbers-and-punctuation"
                />
                <Pressable
                  onPress={handleSavePlannedDate}
                  disabled={savingDate}
                  style={({ pressed }) => ({
                    paddingHorizontal: 14, paddingVertical: 8,
                    backgroundColor: Colors.raw.amber500,
                    borderRadius: 8,
                    opacity: savingDate ? 0.5 : pressed ? 0.8 : 1,
                  })}
                >
                  {savingDate
                    ? <ActivityIndicator size="small" color="#000" />
                    : <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#000" }}>Speichern</Text>
                  }
                </Pressable>
              </View>
              {data.requestData?.planned_date ? (
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.emerald500, marginTop: 8 }}>
                  ✓ Termin gesetzt: {new Date(data.requestData.planned_date).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}
                </Text>
              ) : null}
            </Card>

            {data.summary ? (
              <>
                <SectionLabel label="AUFTRAGSDETAILS" />
                <Card>
                  <Text style={s.summaryText}>{data.summary}</Text>
                </Card>
              </>
            ) : null}
          </>
        ) : data.uiType === "material" ? (
          <MaterialContent data={data} />
        ) : data.uiType === "planung" ? (
          <ScheduleContent data={data} />
        ) : (
          <GenericContent data={data} />
        )}
      </ScrollView>

      <View style={[s.stickyBottom, { paddingBottom: Math.max(bottomInset, 20) }]}>
        <TextInput
          style={s.commentInput}
          placeholder="Anmerkung (optional)..."
          placeholderTextColor={Colors.raw.zinc600}
          value={comment}
          onChangeText={setComment}
          testID="comment-input"
        />
        {data.uiType === "begehung" ? (
          <View style={s.actionButtons}>
            <Pressable
              onPress={() => {/* scroll to termin input — focus handled by card above */}}
              style={({ pressed }) => [
                s.rejectButton,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.raw.amber500} />
              <Text style={[s.rejectText, { color: Colors.raw.amber500 }]}>Termin oben</Text>
            </Pressable>
            <Pressable
              onPress={handleBegehungStart}
              style={({ pressed }) => [
                s.approveButton,
                { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
              testID="detail-approve-button"
            >
              <Ionicons name="play" size={22} color="#fff" />
              <Text style={s.approveText}>JETZT STARTEN</Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.actionButtons}>
            <Pressable
              onPress={handleReject}
              disabled={acting}
              style={({ pressed }) => [
                s.rejectButton,
                { opacity: acting ? 0.4 : pressed ? 0.8 : 1, transform: [{ scale: pressed && !acting ? 0.97 : 1 }] },
              ]}
              testID="detail-reject-button"
            >
              <Ionicons name="close" size={22} color={Colors.raw.rose400} />
              <Text style={s.rejectText}>Nein</Text>
            </Pressable>
            <Pressable
              onPress={handleApprove}
              disabled={acting}
              style={({ pressed }) => [
                s.approveButton,
                { opacity: acting ? 0.4 : pressed ? 0.9 : 1, transform: [{ scale: pressed && !acting ? 0.97 : 1 }] },
              ]}
              testID="detail-approve-button"
            >
              {acting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={24} color="#fff" />
                  <Text style={s.approveText}>{approveLabel}</Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </View>

      <RejectionSheet
        visible={rejectionVisible}
        onClose={() => setRejectionVisible(false)}
        onSubmit={handleRejectionSubmit}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 90,
  },
  backRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: Colors.raw.zinc950 + "E0",
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.raw.zinc400,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 28,
    color: Colors.raw.white,
    marginBottom: 12,
  },
  submittedAgo: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc500,
    marginTop: 8,
    marginBottom: 24,
  },
  projectCard: {
    marginBottom: 12,
  },
  pdfButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  pdfButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.amber500,
    flex: 1,
  },
  inlineEditInput: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.white,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.raw.amber500 + "60",
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: "right",
  },
  saveFieldButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#059669",
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12,
  },
  saveFieldText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#fff",
  },
  suggestionsBox: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    marginTop: -4,
    marginBottom: 4,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc700,
  },
  suggestionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc200,
  },
  projectCardInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  projectLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  projectCodeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc300,
    marginBottom: 4,
  },
  projectClientText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: Colors.raw.zinc500,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    marginBottom: 10,
    marginTop: 8,
  },
  // Info rows for auftrag
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  infoLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc400,
    minWidth: 100,
  },
  infoValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc200,
    flex: 1,
    textAlign: "right",
  },
  tradeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.raw.amber500 + "18",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  tradeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.amber500,
  },
  summaryText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.zinc300,
    lineHeight: 22,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  amountBig: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 32,
    color: Colors.raw.white,
  },
  posRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  posRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  posName: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.zinc300,
    flex: 1,
    marginRight: 16,
  },
  posAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.white,
  },
  stickyBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.raw.zinc950 + "F5",
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  commentInput: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.white,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  rejectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minWidth: 100,
  },
  rejectText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.rose400,
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    borderRadius: 14,
    paddingVertical: 16,
    flex: 1,
  },
  approveText: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 17,
    color: "#fff",
    letterSpacing: 0.5,
  },
});
