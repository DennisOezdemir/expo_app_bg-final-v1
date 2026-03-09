import { StyleSheet, Text, View, ScrollView, Platform, Pressable, FlatList, ActivityIndicator, Modal, TextInput, Alert, KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useState, useEffect, useCallback, useMemo } from "react";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { TopBar } from "@/components/TopBar";
import { ScreenState } from "@/components/ScreenState";
import { supabase } from "@/lib/supabase";
import { mapDbStatus, type ProjectStatus } from "@/lib/status";
import { useProjects } from "@/hooks/queries/useProjects";
import { useCreateProject } from "@/hooks/mutations/useCreateProject";

// --- Create Project Modal ---

interface ClientOption {
  id: string;
  company_name: string;
  customer_number: string | null;
}

function CreateProjectModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 20 : insets.top;
  const [name, setName] = useState("");
  const [street, setStreet] = useState("");
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [floor, setFloor] = useState("");
  const [notes, setNotes] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientType, setNewClientType] = useState<"PRIVATE" | "COMMERCIAL">("COMMERCIAL");
  const [newClientCompany, setNewClientCompany] = useState("");
  const [newClientSalutation, setNewClientSalutation] = useState("");
  const [newClientFirstName, setNewClientFirstName] = useState("");
  const [newClientLastName, setNewClientLastName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientStreet, setNewClientStreet] = useState("");
  const [newClientZip, setNewClientZip] = useState("");
  const [newClientCity, setNewClientCity] = useState("");
  const [newClientVatId, setNewClientVatId] = useState("");
  const [savingClient, setSavingClient] = useState(false);
  const createProjectMutation = useCreateProject();
  const saving = createProjectMutation.isPending;

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, company_name, customer_number")
        .order("company_name");
      if (data) setClients(data);
    })();
  }, [visible]);

  const reset = () => {
    setName("");
    setStreet("");
    setZip("");
    setCity("");
    setFloor("");
    setNotes("");
    setClientId(null);
    setShowNewClient(false);
    resetNewClient();
  };

  const resetNewClient = () => {
    setNewClientType("COMMERCIAL");
    setNewClientCompany("");
    setNewClientSalutation("");
    setNewClientFirstName("");
    setNewClientLastName("");
    setNewClientEmail("");
    setNewClientPhone("");
    setNewClientStreet("");
    setNewClientZip("");
    setNewClientCity("");
    setNewClientVatId("");
  };

  const handleCreateClient = async () => {
    const isCommercial = newClientType === "COMMERCIAL";
    if (isCommercial && !newClientCompany.trim()) {
      Alert.alert("Pflichtfeld", "Bitte Firmennamen eingeben.");
      return;
    }
    if (!isCommercial && !newClientLastName.trim()) {
      Alert.alert("Pflichtfeld", "Bitte Nachnamen eingeben.");
      return;
    }
    setSavingClient(true);
    const displayName = isCommercial
      ? newClientCompany.trim()
      : `${newClientFirstName.trim()} ${newClientLastName.trim()}`.trim();
    const { data, error } = await supabase
      .from("clients")
      .insert({
        client_type: newClientType,
        company_name: isCommercial ? newClientCompany.trim() : displayName,
        salutation: newClientSalutation || null,
        first_name: newClientFirstName.trim() || null,
        last_name: newClientLastName.trim() || null,
        email: newClientEmail.trim() || null,
        phone: newClientPhone.trim() || null,
        street: newClientStreet.trim() || null,
        zip_code: newClientZip.trim() || null,
        city: newClientCity.trim() || null,
        vat_id: (isCommercial && newClientVatId.trim()) ? newClientVatId.trim() : null,
      })
      .select("id, company_name, customer_number")
      .single();
    setSavingClient(false);
    if (error) {
      Alert.alert("Fehler", error.message);
      return;
    }
    if (data) {
      setClients((prev) => [...prev, data].sort((a, b) => (a.company_name || "").localeCompare(b.company_name || "")));
      setClientId(data.id);
      resetNewClient();
      setShowNewClient(false);
      setShowClientPicker(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !street.trim() || !zip.trim() || !city.trim()) {
      Alert.alert("Pflichtfelder", "Bitte Name, Straße, PLZ und Stadt ausfüllen.");
      return;
    }
    try {
      const data = await createProjectMutation.mutateAsync({
        name,
        street,
        zip,
        city,
        floor,
        notes,
        clientId,
      });

      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      reset();
      onClose();
      if (data?.id) {
        setTimeout(() => router.push({ pathname: "/project/[id]", params: { id: data.id } }), 300);
      }
    } catch (error) {
      Alert.alert("Fehler", error instanceof Error ? error.message : "Projekt konnte nicht angelegt werden.");
      return;
    }
  };

  const selectedClient = clients.find((c) => c.id === clientId);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={cpStyles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[cpStyles.header, { paddingTop: topInset + 8 }]}>
          <Pressable onPress={() => { reset(); onClose(); }} style={cpStyles.headerBtn}>
            <Ionicons name="close" size={24} color={Colors.raw.white} />
          </Pressable>
          <Text style={cpStyles.headerTitle}>Neues Projekt</Text>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [cpStyles.saveBtn, { opacity: pressed || saving ? 0.6 : 1 }]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={cpStyles.saveBtnText}>Speichern</Text>
            )}
          </Pressable>
        </View>

        <ScrollView style={cpStyles.scroll} contentContainerStyle={cpStyles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={cpStyles.label}>Projektname *</Text>
          <TextInput
            style={cpStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="z.B. Sanierung Musterstraße 5"
            placeholderTextColor={Colors.raw.zinc600}
          />

          <Text style={cpStyles.label}>Straße *</Text>
          <TextInput
            style={cpStyles.input}
            value={street}
            onChangeText={setStreet}
            placeholder="Musterstraße 5"
            placeholderTextColor={Colors.raw.zinc600}
          />

          <View style={cpStyles.row}>
            <View style={{ flex: 1 }}>
              <Text style={cpStyles.label}>PLZ *</Text>
              <TextInput
                style={cpStyles.input}
                value={zip}
                onChangeText={setZip}
                placeholder="22761"
                placeholderTextColor={Colors.raw.zinc600}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
            <View style={{ flex: 2 }}>
              <Text style={cpStyles.label}>Stadt *</Text>
              <TextInput
                style={cpStyles.input}
                value={city}
                onChangeText={setCity}
                placeholder="Hamburg"
                placeholderTextColor={Colors.raw.zinc600}
              />
            </View>
          </View>

          <Text style={cpStyles.label}>Etage / Wohnung</Text>
          <TextInput
            style={cpStyles.input}
            value={floor}
            onChangeText={setFloor}
            placeholder="z.B. 3. OG links"
            placeholderTextColor={Colors.raw.zinc600}
          />

          <Text style={cpStyles.label}>Auftraggeber</Text>
          <Pressable
            onPress={() => setShowClientPicker(!showClientPicker)}
            style={({ pressed }) => [cpStyles.input, cpStyles.picker, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={selectedClient ? cpStyles.pickerText : cpStyles.pickerPlaceholder}>
              {selectedClient
                ? `${selectedClient.company_name}${selectedClient.customer_number ? ` (${selectedClient.customer_number})` : ""}`
                : "Auftraggeber wählen..."}
            </Text>
            <Ionicons name="chevron-down" size={18} color={Colors.raw.zinc500} />
          </Pressable>
          {showClientPicker && (
            <View style={cpStyles.clientList}>
              <Pressable
                onPress={() => { setClientId(null); setShowClientPicker(false); }}
                style={cpStyles.clientOption}
              >
                <Text style={[cpStyles.clientText, { color: Colors.raw.zinc500 }]}>— Kein AG —</Text>
              </Pressable>
              {clients.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => { setClientId(c.id); setShowClientPicker(false); setShowNewClient(false); }}
                  style={[cpStyles.clientOption, c.id === clientId && cpStyles.clientSelected]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={cpStyles.clientText}>{c.company_name}</Text>
                    {c.customer_number && (
                      <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.raw.zinc500, marginTop: 2 }}>{c.customer_number}</Text>
                    )}
                  </View>
                  {c.id === clientId && <Ionicons name="checkmark" size={18} color={Colors.raw.amber500} />}
                </Pressable>
              ))}
              {/* + Neuer Auftraggeber */}
              <Pressable
                onPress={() => setShowNewClient(!showNewClient)}
                style={[cpStyles.clientOption, { borderBottomWidth: showNewClient ? 1 : 0 }]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="add-circle" size={20} color={Colors.raw.amber500} />
                  <Text style={[cpStyles.clientText, { color: Colors.raw.amber500 }]}>Neuer Auftraggeber</Text>
                </View>
              </Pressable>
              {showNewClient && (
                <View style={{ padding: 12, gap: 10 }}>
                  {/* Kundentyp Toggle */}
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable
                      onPress={() => setNewClientType("COMMERCIAL")}
                      style={[ncStyles.typeBtn, newClientType === "COMMERCIAL" && ncStyles.typeBtnActive]}
                    >
                      <Ionicons name="business" size={16} color={newClientType === "COMMERCIAL" ? "#000" : Colors.raw.zinc400} />
                      <Text style={[ncStyles.typeBtnText, newClientType === "COMMERCIAL" && ncStyles.typeBtnTextActive]}>Geschäftskunde</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setNewClientType("PRIVATE")}
                      style={[ncStyles.typeBtn, newClientType === "PRIVATE" && ncStyles.typeBtnActive]}
                    >
                      <Ionicons name="person" size={16} color={newClientType === "PRIVATE" ? "#000" : Colors.raw.zinc400} />
                      <Text style={[ncStyles.typeBtnText, newClientType === "PRIVATE" && ncStyles.typeBtnTextActive]}>Privatkunde</Text>
                    </Pressable>
                  </View>

                  {/* Firmenname - nur bei Geschäftskunde */}
                  {newClientType === "COMMERCIAL" && (
                    <TextInput
                      style={cpStyles.input}
                      value={newClientCompany}
                      onChangeText={setNewClientCompany}
                      placeholder="Firmenname *"
                      placeholderTextColor={Colors.raw.zinc600}
                      autoFocus
                    />
                  )}

                  {/* Anrede */}
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {["Herr", "Frau"].map((s) => (
                      <Pressable
                        key={s}
                        onPress={() => setNewClientSalutation(newClientSalutation === s ? "" : s)}
                        style={[ncStyles.salutationBtn, newClientSalutation === s && ncStyles.salutationBtnActive]}
                      >
                        <Text style={[ncStyles.salutationText, newClientSalutation === s && ncStyles.salutationTextActive]}>{s}</Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Name */}
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TextInput
                      style={[cpStyles.input, { flex: 1 }]}
                      value={newClientFirstName}
                      onChangeText={setNewClientFirstName}
                      placeholder="Vorname"
                      placeholderTextColor={Colors.raw.zinc600}
                      autoFocus={newClientType === "PRIVATE"}
                    />
                    <TextInput
                      style={[cpStyles.input, { flex: 1 }]}
                      value={newClientLastName}
                      onChangeText={setNewClientLastName}
                      placeholder={newClientType === "PRIVATE" ? "Nachname *" : "Nachname"}
                      placeholderTextColor={Colors.raw.zinc600}
                    />
                  </View>

                  {/* Kontakt */}
                  <TextInput
                    style={cpStyles.input}
                    value={newClientEmail}
                    onChangeText={setNewClientEmail}
                    placeholder="E-Mail"
                    placeholderTextColor={Colors.raw.zinc600}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={cpStyles.input}
                    value={newClientPhone}
                    onChangeText={setNewClientPhone}
                    placeholder="Telefon"
                    placeholderTextColor={Colors.raw.zinc600}
                    keyboardType="phone-pad"
                  />

                  {/* Adresse */}
                  <View style={{ marginTop: 4 }}>
                    <Text style={[cpStyles.label, { marginTop: 0, marginBottom: 8 }]}>Adresse</Text>
                    <TextInput
                      style={cpStyles.input}
                      value={newClientStreet}
                      onChangeText={setNewClientStreet}
                      placeholder="Straße + Hausnr."
                      placeholderTextColor={Colors.raw.zinc600}
                    />
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                      <TextInput
                        style={[cpStyles.input, { flex: 1 }]}
                        value={newClientZip}
                        onChangeText={setNewClientZip}
                        placeholder="PLZ"
                        placeholderTextColor={Colors.raw.zinc600}
                        keyboardType="number-pad"
                        maxLength={5}
                      />
                      <TextInput
                        style={[cpStyles.input, { flex: 2 }]}
                        value={newClientCity}
                        onChangeText={setNewClientCity}
                        placeholder="Stadt"
                        placeholderTextColor={Colors.raw.zinc600}
                      />
                    </View>
                  </View>

                  {/* USt-ID nur bei Geschäftskunde */}
                  {newClientType === "COMMERCIAL" && (
                    <TextInput
                      style={cpStyles.input}
                      value={newClientVatId}
                      onChangeText={setNewClientVatId}
                      placeholder="USt-IdNr. (z.B. DE123456789)"
                      placeholderTextColor={Colors.raw.zinc600}
                      autoCapitalize="characters"
                    />
                  )}

                  <Pressable
                    onPress={handleCreateClient}
                    disabled={savingClient}
                    style={({ pressed }) => [
                      cpStyles.saveBtn,
                      { opacity: pressed || savingClient ? 0.6 : 1, alignSelf: "flex-end" },
                    ]}
                  >
                    {savingClient ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={cpStyles.saveBtnText}>Anlegen</Text>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          )}

          <Text style={cpStyles.label}>Notizen</Text>
          <TextInput
            style={[cpStyles.input, cpStyles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Freitext..."
            placeholderTextColor={Colors.raw.zinc600}
            multiline
            numberOfLines={3}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const cpStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  headerBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.raw.white },
  saveBtn: {
    backgroundColor: Colors.raw.amber500,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center",
  },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#000" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60, gap: 4 },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc400,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.raw.zinc900,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.white,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 12 },
  picker: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pickerText: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.raw.white },
  pickerPlaceholder: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.raw.zinc600 },
  clientList: {
    backgroundColor: Colors.raw.zinc900,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    borderRadius: 12,
    marginTop: 4,
    overflow: "hidden",
  },
  clientOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  clientSelected: { backgroundColor: Colors.raw.amber500 + "10" },
  clientText: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.raw.white },
});

const ncStyles = StyleSheet.create({
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    backgroundColor: Colors.raw.zinc800,
  },
  typeBtnActive: {
    backgroundColor: Colors.raw.amber500,
    borderColor: Colors.raw.amber500,
  },
  typeBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc400 },
  typeBtnTextActive: { color: "#000" },
  salutationBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    backgroundColor: Colors.raw.zinc800,
  },
  salutationBtnActive: {
    backgroundColor: Colors.raw.amber500 + "20",
    borderColor: Colors.raw.amber500,
  },
  salutationText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc400 },
  salutationTextActive: { color: Colors.raw.amber500 },
});

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Project {
  id: string;
  code: string;
  name: string;
  address: string;
  status: ProjectStatus;
  progress: number;
  budget: string;
  deadline: string;
  team: number;
  phase: string;
}

const STATUS_CONFIG: Record<ProjectStatus, { color: string; label: string }> = {
  kritisch: { color: Colors.raw.rose500, label: "Kritisch" },
  achtung: { color: Colors.raw.amber500, label: "Achtung" },
  laeuft: { color: Colors.raw.emerald500, label: "Läuft" },
  fertig: { color: Colors.raw.zinc500, label: "Fertig" },
};

function formatBudget(budgetNet: number | null): string {
  if (budgetNet == null) return "—";
  if (budgetNet >= 1_000_000) return `${(budgetNet / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (budgetNet >= 1_000) return `${Math.round(budgetNet / 1_000)}K`;
  return `${Math.round(budgetNet)} €`;
}

function formatDeadline(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
}

type FilterKey = "alle" | "kritisch" | "achtung" | "laeuft" | "fertig";

const FILTERS: { key: FilterKey; label: string; dotColor?: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "kritisch", label: "Kritisch", dotColor: Colors.raw.rose500 },
  { key: "achtung", label: "Achtung", dotColor: Colors.raw.amber500 },
  { key: "laeuft", label: "Läuft", dotColor: Colors.raw.emerald500 },
  { key: "fertig", label: "Fertig", dotColor: Colors.raw.zinc500 },
];

function FilterChip({
  label,
  dotColor,
  active,
  onPress,
}: {
  label: string;
  dotColor?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active ? styles.chipActive : styles.chipInactive,
      ]}
    >
      {dotColor && !active && (
        <View style={[styles.chipDot, { backgroundColor: dotColor }]} />
      )}
      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const statusCfg = STATUS_CONFIG[project.status];
  const progressColor = statusCfg.color;

  return (
    <AnimatedPressable
      style={[styles.card, animStyle]}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPress={() => {
        router.push({ pathname: "/project/[id]", params: { id: project.id } });
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardCode}>{project.code}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusCfg.color + "18" }]}>
            <View style={[styles.statusPillDot, { backgroundColor: statusCfg.color }]} />
            <Text style={[styles.statusPillText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.raw.zinc600} />
      </View>

      <Text style={styles.cardName}>{project.name}</Text>
      <Text style={styles.cardAddress}>{project.address}</Text>

      <View style={styles.cardProgress}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${project.progress}%`, backgroundColor: progressColor },
            ]}
          />
        </View>
        <Text style={[styles.progressValue, { color: progressColor }]}>
          {project.progress}%
        </Text>
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="currency-eur" size={14} color={Colors.raw.zinc500} />
          <Text style={styles.metaText}>{project.budget}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="people" size={14} color={Colors.raw.zinc500} />
          <Text style={styles.metaText}>{project.team}</Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="calendar" size={13} color={Colors.raw.zinc500} />
          <Text style={styles.metaText}>{project.deadline}</Text>
        </View>
        {project.phase ? (
          <View style={styles.phasePill}>
            <Text style={styles.phaseText}>{project.phase}</Text>
          </View>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

export default function ProjekteScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 84 : 90;
  const [activeFilter, setActiveFilter] = useState<FilterKey>("alle");
  const [showCreate, setShowCreate] = useState(false);
  const {
    data: projectRows,
    isLoading: loading,
    error,
    refetch: refetchProjects,
  } = useProjects();

  const projects = useMemo<Project[]>(() => {
    return (projectRows ?? []).map((p) => ({
      id: p.id,
      code: p.project_number ?? "—",
      name: p.display_name || p.name || "Unbenannt",
      address: [p.object_street, `${p.object_zip ?? ""} ${p.object_city ?? ""}`.trim()].filter(Boolean).join(", "),
      status: mapDbStatus(p.status),
      progress: p.progress_percent ?? 0,
      budget: formatBudget(p.budget_net),
      deadline: formatDeadline(p.planned_end),
      team: 0,
      phase: "",
    }));
  }, [projectRows]);

  const handleFilter = useCallback((key: FilterKey) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveFilter(key);
  }, []);

  const filtered = activeFilter === "alle"
    ? projects.filter((p) => p.status !== "fertig")
    : projects.filter((p) => p.status === activeFilter);

  const kritischCount = projects.filter((p) => p.status === "kritisch").length;
  const aktivCount = projects.filter((p) => p.status !== "fertig").length;

  return (
    <View style={styles.container}>
      <TopBar hasNotification />
      <View style={[styles.headerSection, { paddingTop: topInset + 64 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Projekte</Text>
            <Text style={styles.headerSubtitle}>
              {aktivCount} aktiv{" "}
              <Text style={{ color: Colors.raw.zinc600 }}>{"\u2022"}</Text>{" "}
              <Text style={{ color: Colors.raw.rose400 }}>{kritischCount} überfällig</Text>
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              style={({ pressed }) => [styles.searchButton, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Feather name="search" size={22} color={Colors.raw.zinc400} />
            </Pressable>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowCreate(true);
              }}
              style={({ pressed }) => [styles.addButton, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="add" size={24} color="#000" />
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
          style={styles.chipsScroll}
        >
          {FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              dotColor={f.dotColor}
              active={activeFilter === f.key}
              onPress={() => handleFilter(f.key)}
            />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ScreenState kind="loading" />
      ) : error ? (
        <ScreenState
          kind="error"
          detail={error instanceof Error ? error.message : "Unbekannter Fehler"}
          onRetry={() => { void refetchProjects(); }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProjectCard project={item} />}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomInset + 20 }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={filtered.length > 0}
          ListEmptyComponent={
            <ScreenState kind="empty" title="Keine Projekte gefunden" />
          }
        />
      )}

      <CreateProjectModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  headerSection: {
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 30,
    color: Colors.raw.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.zinc500,
  },
  searchButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
  },
  addButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.raw.amber500,
    borderRadius: 14,
  },
  chipsScroll: {
    marginBottom: 20,
    marginHorizontal: -20,
  },
  chipsContainer: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: "row",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  chipActive: {
    backgroundColor: Colors.raw.amber500,
  },
  chipInactive: {
    backgroundColor: Colors.raw.zinc800,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  chipTextActive: {
    color: "#000",
  },
  chipTextInactive: {
    color: Colors.raw.zinc400,
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardCode: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc500,
    letterSpacing: 0.3,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusPillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  cardName: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
    marginBottom: 3,
  },
  cardAddress: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc500,
    marginBottom: 16,
  },
  cardProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.raw.zinc800,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  progressValue: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 16,
    minWidth: 42,
    textAlign: "right",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  phasePill: {
    marginLeft: "auto",
    backgroundColor: Colors.raw.zinc800,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  phaseText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.zinc400,
  },
});
