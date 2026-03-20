import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useClients, useProjectOptions } from "@/hooks/queries/useInvoices";
import { useCreateInvoice } from "@/hooks/mutations/useInvoiceMutations";
import type { SalesInvoiceType, ClientOption, ProjectOption } from "@/lib/api/invoices";

// ── Types ──────────────────────────────────────────────────

const INVOICE_TYPES: { key: SalesInvoiceType; label: string; desc: string }[] = [
  { key: "SCHLUSS", label: "Schlussrechnung", desc: "Komplettabrechnung nach Fertigstellung" },
  { key: "ABSCHLAG", label: "Abschlagsrechnung", desc: "Teilzahlung nach Fortschritt" },
  { key: "TEIL", label: "Teilrechnung", desc: "Teilabrechnung einzelner Leistungen" },
  { key: "GUTSCHRIFT", label: "Gutschrift", desc: "Rechnungskorrektur / Gutschrift" },
];

// ── Picker Components ──────────────────────────────────────

function ClientPicker({
  clients,
  selected,
  onSelect,
}: {
  clients: ClientOption[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedClient = clients.find((c) => c.id === selected);
  const filtered = search
    ? clients.filter((c) => (c.company_name ?? "").toLowerCase().includes(search.toLowerCase()))
    : clients;

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} style={pickerS.trigger}>
        <Ionicons name="business-outline" size={18} color={Colors.raw.zinc400} />
        <Text style={selectedClient ? pickerS.triggerValue : pickerS.triggerPlaceholder}>
          {selectedClient?.company_name ?? "Auftraggeber wählen"}
        </Text>
        <Ionicons name="chevron-down" size={18} color={Colors.raw.zinc500} />
      </Pressable>
    );
  }

  return (
    <View style={pickerS.dropdown}>
      <View style={pickerS.searchRow}>
        <Ionicons name="search" size={16} color={Colors.raw.zinc500} />
        <TextInput
          style={pickerS.searchInput}
          placeholder="Suchen..."
          placeholderTextColor={Colors.raw.zinc600}
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
        <Pressable onPress={() => { setOpen(false); setSearch(""); }}>
          <Ionicons name="close" size={20} color={Colors.raw.zinc400} />
        </Pressable>
      </View>
      <ScrollView style={{ maxHeight: 200 }}>
        {filtered.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => { onSelect(c.id); setOpen(false); setSearch(""); }}
            style={[pickerS.option, selected === c.id && pickerS.optionActive]}
          >
            <Text style={[pickerS.optionText, selected === c.id && pickerS.optionTextActive]}>
              {c.company_name || "Unbenannt"}
            </Text>
            {selected === c.id && (
              <Ionicons name="checkmark" size={18} color={Colors.raw.amber500} />
            )}
          </Pressable>
        ))}
        {filtered.length === 0 && (
          <Text style={pickerS.noResults}>Kein Auftraggeber gefunden</Text>
        )}
      </ScrollView>
    </View>
  );
}

function ProjectPicker({
  projects,
  selected,
  onSelect,
}: {
  projects: ProjectOption[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedProject = projects.find((p) => p.id === selected);
  const filtered = search
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.project_number ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (p.object_street ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : projects;

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} style={pickerS.trigger}>
        <Ionicons name="clipboard-outline" size={18} color={Colors.raw.zinc400} />
        <Text style={selectedProject ? pickerS.triggerValue : pickerS.triggerPlaceholder}>
          {selectedProject
            ? `${selectedProject.project_number ?? ""} ${selectedProject.name}`.trim()
            : "Projekt wählen (optional)"}
        </Text>
        <Ionicons name="chevron-down" size={18} color={Colors.raw.zinc500} />
      </Pressable>
    );
  }

  return (
    <View style={pickerS.dropdown}>
      <View style={pickerS.searchRow}>
        <Ionicons name="search" size={16} color={Colors.raw.zinc500} />
        <TextInput
          style={pickerS.searchInput}
          placeholder="Suchen..."
          placeholderTextColor={Colors.raw.zinc600}
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
        <Pressable onPress={() => { setOpen(false); setSearch(""); }}>
          <Ionicons name="close" size={20} color={Colors.raw.zinc400} />
        </Pressable>
      </View>
      <ScrollView style={{ maxHeight: 200 }}>
        <Pressable
          onPress={() => { onSelect(null); setOpen(false); setSearch(""); }}
          style={[pickerS.option, !selected && pickerS.optionActive]}
        >
          <Text style={[pickerS.optionText, !selected && pickerS.optionTextActive]}>
            Kein Projekt
          </Text>
        </Pressable>
        {filtered.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => { onSelect(p.id); setOpen(false); setSearch(""); }}
            style={[pickerS.option, selected === p.id && pickerS.optionActive]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[pickerS.optionText, selected === p.id && pickerS.optionTextActive]}>
                {p.name}
              </Text>
              {p.object_street && (
                <Text style={pickerS.optionSub}>{p.project_number} \u2022 {p.object_street}</Text>
              )}
            </View>
            {selected === p.id && (
              <Ionicons name="checkmark" size={18} color={Colors.raw.amber500} />
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const pickerS = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 50,
  },
  triggerValue: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.raw.white },
  triggerPlaceholder: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.raw.zinc500 },
  dropdown: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    overflow: "hidden",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  searchInput: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.white },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800 + "60",
  },
  optionActive: { backgroundColor: Colors.raw.amber500 + "10" },
  optionText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc300 },
  optionTextActive: { color: Colors.raw.amber500, fontFamily: "Inter_700Bold" },
  optionSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc600, marginTop: 2 },
  noResults: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc600, padding: 16, textAlign: "center" },
});

// ── Main ───────────────────────────────────────────────────

export default function NeueRechnungScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: clients = [] } = useClients();
  const { data: projects = [] } = useProjectOptions();
  const createMutation = useCreateInvoice();

  const [invoiceType, setInvoiceType] = useState<SalesInvoiceType>("SCHLUSS");
  const [clientId, setClientId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [reverseCharge, setReverseCharge] = useState(true);
  const [paymentDays, setPaymentDays] = useState("14");

  const handleCreate = useCallback(async () => {
    if (!clientId) {
      Alert.alert("Fehler", "Bitte wähle einen Auftraggeber.");
      return;
    }

    try {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const result = await createMutation.mutateAsync({
        client_id: clientId,
        project_id: projectId,
        invoice_type: invoiceType,
        description: description.trim() || null,
        is_reverse_charge: reverseCharge,
        payment_days: parseInt(paymentDays, 10) || 14,
      });

      router.replace(`/rechnung/${result.id}` as any);
    } catch (err: any) {
      Alert.alert("Fehler", err.message || "Rechnung konnte nicht erstellt werden.");
    }
  }, [clientId, projectId, invoiceType, description, reverseCharge, paymentDays, createMutation]);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="close" size={24} color={Colors.raw.white} />
        </Pressable>
        <Text style={s.headerTitle}>Neue Rechnung</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingTop: topInset + 64, paddingBottom: bottomInset + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Invoice Type */}
        <Text style={s.sectionLabel}>TYP</Text>
        <View style={s.typeGrid}>
          {INVOICE_TYPES.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setInvoiceType(t.key)}
              style={[s.typeCard, invoiceType === t.key && s.typeCardActive]}
            >
              <View style={[s.typeRadio, invoiceType === t.key && s.typeRadioActive]}>
                {invoiceType === t.key && <View style={s.typeRadioInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.typeLabel, invoiceType === t.key && s.typeLabelActive]}>{t.label}</Text>
                <Text style={s.typeDesc}>{t.desc}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Client */}
        <Text style={s.sectionLabel}>AUFTRAGGEBER *</Text>
        <ClientPicker clients={clients} selected={clientId} onSelect={setClientId} />

        {/* Project */}
        <Text style={[s.sectionLabel, { marginTop: 20 }]}>PROJEKT</Text>
        <ProjectPicker projects={projects} selected={projectId} onSelect={setProjectId} />

        {/* Description */}
        <Text style={[s.sectionLabel, { marginTop: 20 }]}>BEZEICHNUNG</Text>
        <TextInput
          style={s.textInput}
          placeholder="z.B. Malerarbeiten WE 03.02"
          placeholderTextColor={Colors.raw.zinc600}
          value={description}
          onChangeText={setDescription}
        />

        {/* Options */}
        <Text style={[s.sectionLabel, { marginTop: 20 }]}>OPTIONEN</Text>
        <View style={s.optionsCard}>
          <Pressable
            onPress={() => setReverseCharge(!reverseCharge)}
            style={s.optionRow}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.optionLabel}>Reverse Charge (0% MwSt)</Text>
              <Text style={s.optionSub}>Standard für Subunternehmer</Text>
            </View>
            <View style={[s.toggle, reverseCharge && s.toggleActive]}>
              <View style={[s.toggleThumb, reverseCharge && s.toggleThumbActive]} />
            </View>
          </Pressable>

          <View style={s.optionDivider} />

          <View style={s.optionRow}>
            <Text style={s.optionLabel}>Zahlungsziel</Text>
            <View style={s.daysInput}>
              <TextInput
                style={s.daysText}
                value={paymentDays}
                onChangeText={setPaymentDays}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={s.daysUnit}>Tage</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Create Button */}
      <View style={[s.stickyBottom, { paddingBottom: Math.max(bottomInset, 16) }]}>
        <Pressable
          onPress={handleCreate}
          disabled={createMutation.isPending || !clientId}
          style={({ pressed }) => [
            s.createBtn,
            { opacity: pressed ? 0.9 : 1 },
            (!clientId || createMutation.isPending) && s.createBtnDisabled,
          ]}
          testID="create-invoice-btn"
        >
          {createMutation.isPending ? (
            <Text style={s.createBtnText}>Wird erstellt...</Text>
          ) : (
            <>
              <Ionicons name="document-text" size={18} color="#000" />
              <Text style={s.createBtnText}>RECHNUNG ERSTELLEN</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: Colors.raw.zinc950 + "E6",
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 20, color: Colors.raw.white },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },

  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: Colors.raw.zinc500,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 24,
  },

  // Type selection
  typeGrid: { gap: 8 },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 14,
  },
  typeCardActive: { borderColor: Colors.raw.amber500 + "60", backgroundColor: Colors.raw.amber500 + "08" },
  typeRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.raw.zinc600,
    alignItems: "center",
    justifyContent: "center",
  },
  typeRadioActive: { borderColor: Colors.raw.amber500 },
  typeRadioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.raw.amber500 },
  typeLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.raw.zinc300 },
  typeLabelActive: { color: Colors.raw.white },
  typeDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc600, marginTop: 2 },

  // Text input
  textInput: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.white,
  },

  // Options
  optionsCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 16,
  },
  optionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
  optionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc300 },
  optionSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc600, marginTop: 2 },
  optionDivider: { height: 1, backgroundColor: Colors.raw.zinc800, marginVertical: 12 },

  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.raw.zinc700,
    padding: 3,
    justifyContent: "center",
  },
  toggleActive: { backgroundColor: Colors.raw.amber500 },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.raw.zinc400,
  },
  toggleThumbActive: { backgroundColor: "#000", alignSelf: "flex-end" },

  daysInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  daysText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.white, minWidth: 30, textAlign: "right" },
  daysUnit: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc500 },

  // Sticky
  stickyBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.raw.zinc900,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 14,
    paddingVertical: 16,
  },
  createBtnDisabled: { opacity: 0.4 },
  createBtnText: { fontFamily: "Inter_800ExtraBold", fontSize: 15, color: "#000", letterSpacing: 0.5 },
});
