import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback, useEffect } from "react";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { supabase } from "@/lib/supabase";

export type ClientType = "COMMERCIAL" | "PRIVATE";

export interface Client {
  id: string;
  company_name: string | null;
  vat_id: string | null;
  customer_number: string | null;
  contact_person: string | null;
  client_type: ClientType | null;
  email: string | null;
  phone: string | null;
  street: string | null;
  zip_code: string | null;
  city: string | null;
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={Colors.raw.zinc600}
        selectionColor={Colors.raw.amber500}
      />
    </View>
  );
}

const CLIENT_TYPE_OPTIONS: { key: ClientType; label: string }[] = [
  { key: "COMMERCIAL", label: "Gewerbe" },
  { key: "PRIVATE", label: "Privat" },
];

export default function KundenScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");

  const [editCompanyName, setEditCompanyName] = useState("");
  const [editVatId, setEditVatId] = useState("");
  const [editCustomerNumber, setEditCustomerNumber] = useState("");
  const [editContactPerson, setEditContactPerson] = useState("");
  const [editClientType, setEditClientType] = useState<ClientType>("COMMERCIAL");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStreet, setEditStreet] = useState("");
  const [editZipCode, setEditZipCode] = useState("");
  const [editCity, setEditCity] = useState("");
  const [formMode, setFormMode] = useState<"list" | "new" | "edit">("list");

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("id, company_name, vat_id, customer_number, contact_person, client_type, email, phone, street, zip_code, city")
      .order("company_name", { nullsFirst: false });
    setLoading(false);
    if (error) {
      console.error("Kunden laden:", error);
      return;
    }
    setClients((data as Client[]) ?? []);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setEditCompanyName(client.company_name ?? "");
    setEditVatId(client.vat_id ?? "");
    setEditCustomerNumber(client.customer_number ?? "");
    setEditContactPerson(client.contact_person ?? "");
    setEditClientType((client.client_type as ClientType) ?? "COMMERCIAL");
    setEditEmail(client.email ?? "");
    setEditPhone(client.phone ?? "");
    setEditStreet(client.street ?? "");
    setEditZipCode(client.zip_code ?? "");
    setEditCity(client.city ?? "");
    setFormMode("edit");
  };

  const startNewClient = () => {
    setSelectedClient(null);
    setEditCompanyName("");
    setEditVatId("");
    setEditCustomerNumber("");
    setEditContactPerson("");
    setEditClientType("COMMERCIAL");
    setEditEmail("");
    setEditPhone("");
    setEditStreet("");
    setEditZipCode("");
    setEditCity("");
    setFormMode("new");
  };

  const backToList = () => {
    setFormMode("list");
    setSelectedClient(null);
  };

  const handleSave = async () => {
    const companyName = editCompanyName.trim();
    if (!companyName) {
      Alert.alert("Fehler", "Firmenname ist Pflicht.");
      return;
    }

    setSaving(true);
    if (selectedClient) {
      const { error } = await supabase
        .from("clients")
        .update({
          company_name: companyName,
          vat_id: editVatId.trim() || null,
          customer_number: editCustomerNumber.trim() || null,
          contact_person: editContactPerson.trim() || null,
          client_type: editClientType,
          email: editEmail.trim() || null,
          phone: editPhone.trim() || null,
          street: editStreet.trim() || null,
          zip_code: editZipCode.trim() || null,
          city: editCity.trim() || null,
        })
        .eq("id", selectedClient.id);

      setSaving(false);
      if (error) {
        Alert.alert("Fehler", error.message);
        return;
      }
      setClients((prev) =>
        prev.map((c) =>
          c.id === selectedClient.id
            ? {
                ...c,
                company_name: companyName,
                vat_id: editVatId.trim() || null,
                customer_number: editCustomerNumber.trim() || null,
                contact_person: editContactPerson.trim() || null,
                client_type: editClientType,
                email: editEmail.trim() || null,
                phone: editPhone.trim() || null,
                street: editStreet.trim() || null,
                zip_code: editZipCode.trim() || null,
                city: editCity.trim() || null,
              }
            : c
        )
      );
      backToList();
    } else {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          company_name: companyName,
          vat_id: editVatId.trim() || null,
          customer_number: editCustomerNumber.trim() || null,
          contact_person: editContactPerson.trim() || null,
          client_type: editClientType,
          email: editEmail.trim() || null,
          phone: editPhone.trim() || null,
          street: editStreet.trim() || null,
          zip_code: editZipCode.trim() || null,
          city: editCity.trim() || null,
        })
        .select("id, company_name, vat_id, customer_number, contact_person, client_type, email, phone, street, zip_code, city")
        .single();

      setSaving(false);
      if (error) {
        Alert.alert("Fehler", error.message);
        return;
      }
      if (data) setClients((prev) => [...prev, data as Client]);
      backToList();
    }
  };

  const handleDelete = () => {
    if (!selectedClient) return;
    Alert.alert(
      "Kunde löschen",
      `"${selectedClient.company_name ?? "Kunde"}" wirklich löschen? Projekte mit diesem Kunden bleiben erhalten, die Zuordnung wird entfernt.`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            const { error } = await supabase.from("clients").delete().eq("id", selectedClient.id);
            setSaving(false);
            if (error) {
              Alert.alert("Fehler", error.message);
              return;
            }
            setClients((prev) => prev.filter((c) => c.id !== selectedClient.id));
            backToList();
          },
        },
      ]
    );
  };

  const filteredClients = clients.filter((c) =>
    (c.company_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (formMode === "new" || formMode === "edit") {
    const isNew = formMode === "new";
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: topInset + 12, paddingBottom: bottomInset + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={backToList}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.raw.white} />
          </Pressable>

          <Text style={styles.detailTitle}>{isNew ? "Neuer Kunde" : "Kunde bearbeiten"}</Text>

          <Text style={styles.sectionLabel}>Stammdaten</Text>
          <View style={styles.card}>
            <FormField
              label="Firmenname / Name"
              value={editCompanyName}
              onChangeText={setEditCompanyName}
              placeholder="z. B. besser zuhause GmbH"
            />
            <View style={styles.divider} />
            <FormField
              label="USt-ID"
              value={editVatId}
              onChangeText={setEditVatId}
              placeholder="z. B. DE123456789"
            />
            <View style={styles.divider} />
            <FormField
              label="Kundennummer (intern)"
              value={editCustomerNumber}
              onChangeText={setEditCustomerNumber}
            />
            <View style={styles.divider} />
            <FormField
              label="Ansprechpartner"
              value={editContactPerson}
              onChangeText={setEditContactPerson}
            />
          </View>

          <Text style={styles.sectionLabel}>Kontakt</Text>
          <View style={styles.card}>
            <FormField
              label="E-Mail"
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="z. B. info@firma.de"
            />
            <View style={styles.divider} />
            <FormField
              label="Telefon"
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="z. B. 040 123456"
            />
          </View>

          <Text style={styles.sectionLabel}>Adresse</Text>
          <View style={styles.card}>
            <FormField
              label="Straße und Hausnummer"
              value={editStreet}
              onChangeText={setEditStreet}
            />
            <View style={styles.divider} />
            <View style={styles.rowFields}>
              <View style={styles.halfField}>
                <FormField
                  label="PLZ"
                  value={editZipCode}
                  onChangeText={setEditZipCode}
                  placeholder="PLZ"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  label="Ort"
                  value={editCity}
                  onChangeText={setEditCity}
                  placeholder="Ort"
                />
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Kundenart</Text>
          <View style={styles.card}>
            <View style={styles.radioGroup}>
              {CLIENT_TYPE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => setEditClientType(opt.key)}
                  style={[styles.radioBtn, editClientType === opt.key && styles.radioBtnActive]}
                >
                  <View style={[styles.radioDot, editClientType === opt.key && styles.radioDotActive]} />
                  <Text style={[styles.radioLabel, editClientType === opt.key && styles.radioLabelActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.bottomButtons}>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => [styles.saveBtn, { opacity: saving || pressed ? 0.8 : 1 }]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.saveBtnText}>Speichern</Text>
              )}
            </Pressable>
            {!isNew && (
              <Pressable
                onPress={handleDelete}
                disabled={saving}
                style={({ pressed }) => [styles.deleteBtn, { opacity: saving || pressed ? 0.8 : 1 }]}
              >
                <Text style={styles.deleteBtnText}>Löschen</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topInset + 12, paddingBottom: bottomInset + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.raw.white} />
        </Pressable>

        <Text style={styles.title}>Kunden</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.raw.zinc500} />
          <TextInput
            style={styles.searchInput}
            placeholder="Suchen..."
            placeholderTextColor={Colors.raw.zinc500}
            value={search}
            onChangeText={setSearch}
            selectionColor={Colors.raw.amber500}
          />
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.raw.amber500} />
          </View>
        ) : (
          <>
            <Text style={styles.countText}>{filteredClients.length} Kunden</Text>

            {filteredClients.map((client) => (
              <Pressable
                key={client.id}
                onPress={() => selectClient(client)}
                style={({ pressed }) => [styles.clientCard, { opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={styles.clientName}>{client.company_name ?? "—"}</Text>
                <View style={styles.clientMeta}>
                  {client.customer_number ? (
                    <Text style={styles.clientMetaText}>Kd.Nr: {client.customer_number}</Text>
                  ) : null}
                  {client.client_type ? (
                    <Text style={styles.clientMetaText}>
                      {client.client_type === "COMMERCIAL" ? "Gewerbe" : "Privat"}
                    </Text>
                  ) : null}
                </View>
                {(client.contact_person || client.email || client.phone) ? (
                  <View style={styles.clientContact}>
                    {client.contact_person ? (
                      <View style={styles.clientContactRow}>
                        <Ionicons name="person-outline" size={14} color={Colors.raw.zinc500} />
                        <Text style={styles.clientContactText}>{client.contact_person}</Text>
                      </View>
                    ) : null}
                    {client.email ? (
                      <View style={styles.clientContactRow}>
                        <Ionicons name="mail-outline" size={14} color={Colors.raw.zinc500} />
                        <Text style={styles.clientContactText} numberOfLines={1}>{client.email}</Text>
                      </View>
                    ) : null}
                    {client.phone ? (
                      <View style={styles.clientContactRow}>
                        <Ionicons name="call-outline" size={14} color={Colors.raw.zinc500} />
                        <Text style={styles.clientContactText}>{client.phone}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
                {(client.street || client.city) ? (
                  <View style={styles.clientAddress}>
                    <Ionicons name="location-outline" size={14} color={Colors.raw.zinc500} />
                    <Text style={styles.clientAddressText} numberOfLines={1}>
                      {[client.street, [client.zip_code, client.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            ))}

            <Pressable
              onPress={startNewClient}
              style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.raw.amber500} />
              <Text style={styles.addBtnText}>Kunde anlegen</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  backBtn: {
    marginBottom: 12,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.raw.zinc900,
    alignItems: "center",
    justifyContent: "center",
  },

  title: { fontFamily: "Inter_800ExtraBold", fontSize: 30, color: Colors.raw.white, marginBottom: 20 },
  detailTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 26, color: Colors.raw.white, marginBottom: 24 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, color: Colors.raw.white, padding: 0 },

  countText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc500, marginBottom: 14 },
  loadingWrap: { paddingVertical: 40, alignItems: "center" },

  clientCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 18,
    marginBottom: 10,
  },
  clientName: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.raw.white, marginBottom: 6 },
  clientMeta: { flexDirection: "row", gap: 8, marginBottom: 4 },
  clientMetaText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc400 },
  clientContact: { gap: 4 },
  clientContactRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  clientContactText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc500, flex: 1 },
  clientAddress: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  clientAddressText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc500, flex: 1 },
  rowFields: { flexDirection: "row", gap: 12 },
  halfField: { flex: 1 },

  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 18 },
  addBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.amber500 },

  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.raw.zinc400,
    marginBottom: 10,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginBottom: 20,
  },
  divider: { height: 1, backgroundColor: Colors.raw.zinc800 },

  fieldContainer: { paddingVertical: 12 },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  fieldInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.white,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  radioGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 12 },
  radioBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.raw.zinc800,
  },
  radioBtnActive: { backgroundColor: Colors.raw.amber500 + "20" },
  radioDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.raw.zinc600 },
  radioDotActive: { borderColor: Colors.raw.amber500, backgroundColor: Colors.raw.amber500 },
  radioLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc400 },
  radioLabelActive: { color: Colors.raw.amber500 },

  bottomButtons: { gap: 10, marginTop: 8 },
  saveBtn: {
    backgroundColor: Colors.raw.amber500,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#000" },
  deleteBtn: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  deleteBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.raw.rose500 },
});
