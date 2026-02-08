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
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";
import Colors from "@/constants/colors";

interface Order {
  date: string;
  amount: string;
  project: string;
}

interface Supplier {
  id: string;
  name: string;
  favorite: boolean;
  kdNr: string;
  artikel: number;
  tel: string;
  contact: string;
  email: string;
  fax: string;
  rabatt: string;
  zahlungsziel: string;
  mindestbestellung: string;
  lieferzeit: string;
  bestellweg: string;
  bestellEmail: string;
  orders: Order[];
}

const SUPPLIERS: Supplier[] = [
  { id: "1", name: "MEGA eG", favorite: true, kdNr: "48291", artikel: 142, tel: "040-123456", contact: "Herr Schmidt", email: "bestellung@mega.de", fax: "040-123457", rabatt: "Handwerker 15%", zahlungsziel: "30 Tage", mindestbestellung: "50,00", lieferzeit: "2-3 Werktage", bestellweg: "email", bestellEmail: "bestellung@mega.de", orders: [{ date: "05.02.", amount: "709,80", project: "BL-2026-003" }, { date: "28.01.", amount: "1.240,00", project: "BL-2026-001" }] },
  { id: "2", name: "Süding & Soeken", favorite: true, kdNr: "S-1192", artikel: 38, tel: "040-789012", contact: "Frau Meyer", email: "info@sueding.de", fax: "", rabatt: "Standard 10%", zahlungsziel: "14 Tage", mindestbestellung: "100,00", lieferzeit: "3-5 Werktage", bestellweg: "online", bestellEmail: "", orders: [{ date: "02.02.", amount: "420,00", project: "BL-2026-002" }] },
  { id: "3", name: "Delmes Heitmann", favorite: false, kdNr: "DH-4420", artikel: 67, tel: "040-456789", contact: "Herr Weber", email: "order@delmes.de", fax: "040-456790", rabatt: "Neukunde 5%", zahlungsziel: "21 Tage", mindestbestellung: "75,00", lieferzeit: "1-2 Werktage", bestellweg: "fax", bestellEmail: "", orders: [] },
];

const BESTELLWEG_OPTIONS = [
  { key: "email", label: "Email" },
  { key: "fax", label: "Fax" },
  { key: "online", label: "Online-Portal" },
  { key: "telefon", label: "Telefon" },
];

function FormField({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (t: string) => void; placeholder?: string }) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor={Colors.raw.zinc600}
        selectionColor={Colors.raw.amber500}
      />
    </View>
  );
}

export default function LieferantenScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [suppliers, setSuppliers] = useState<Supplier[]>(SUPPLIERS);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [search, setSearch] = useState("");

  const [editContact, setEditContact] = useState("");
  const [editTel, setEditTel] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editFax, setEditFax] = useState("");
  const [editKdNr, setEditKdNr] = useState("");
  const [editRabatt, setEditRabatt] = useState("");
  const [editZahlungsziel, setEditZahlungsziel] = useState("");
  const [editMindestbestellung, setEditMindestbestellung] = useState("");
  const [editLieferzeit, setEditLieferzeit] = useState("");
  const [editBestellweg, setEditBestellweg] = useState("");
  const [editBestellEmail, setEditBestellEmail] = useState("");

  const selectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setEditContact(supplier.contact);
    setEditTel(supplier.tel);
    setEditEmail(supplier.email);
    setEditFax(supplier.fax);
    setEditKdNr(supplier.kdNr);
    setEditRabatt(supplier.rabatt);
    setEditZahlungsziel(supplier.zahlungsziel);
    setEditMindestbestellung(supplier.mindestbestellung);
    setEditLieferzeit(supplier.lieferzeit);
    setEditBestellweg(supplier.bestellweg);
    setEditBestellEmail(supplier.bestellEmail);
  };

  const toggleFavorite = () => {
    if (!selectedSupplier) return;
    const updated = { ...selectedSupplier, favorite: !selectedSupplier.favorite };
    setSelectedSupplier(updated);
    setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleSave = () => {
    if (!selectedSupplier) return;
    Alert.alert("Speichern", "Änderungen speichern?", [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Speichern",
        onPress: () => {
          const updated: Supplier = {
            ...selectedSupplier,
            contact: editContact,
            tel: editTel,
            email: editEmail,
            fax: editFax,
            kdNr: editKdNr,
            rabatt: editRabatt,
            zahlungsziel: editZahlungsziel,
            mindestbestellung: editMindestbestellung,
            lieferzeit: editLieferzeit,
            bestellweg: editBestellweg,
            bestellEmail: editBestellEmail,
          };
          setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          setSelectedSupplier(updated);
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!selectedSupplier) return;
    Alert.alert("Löschen", `"${selectedSupplier.name}" wirklich löschen?`, [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Löschen",
        style: "destructive",
        onPress: () => {
          setSuppliers((prev) => prev.filter((s) => s.id !== selectedSupplier.id));
          setSelectedSupplier(null);
        },
      },
    ]);
  };

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedSupplier) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 12, paddingBottom: bottomInset + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => setSelectedSupplier(null)}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.raw.white} />
          </Pressable>

          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>{selectedSupplier.name}</Text>
            <Pressable onPress={toggleFavorite}>
              <Ionicons
                name={selectedSupplier.favorite ? "star" : "star-outline"}
                size={24}
                color={Colors.raw.amber500}
              />
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Kontakt</Text>
          <View style={styles.card}>
            <FormField label="Ansprechpartner" value={editContact} onChangeText={setEditContact} />
            <View style={styles.divider} />
            <FormField label="Telefon" value={editTel} onChangeText={setEditTel} />
            <View style={styles.divider} />
            <FormField label="Email" value={editEmail} onChangeText={setEditEmail} />
            <View style={styles.divider} />
            <FormField label="Fax" value={editFax} onChangeText={setEditFax} />
          </View>

          <Text style={styles.sectionLabel}>Konditionen</Text>
          <View style={styles.card}>
            <FormField label="Kundennummer" value={editKdNr} onChangeText={setEditKdNr} />
            <View style={styles.divider} />
            <FormField label="Rabattgruppe" value={editRabatt} onChangeText={setEditRabatt} />
            <View style={styles.divider} />
            <FormField label="Zahlungsziel" value={editZahlungsziel} onChangeText={setEditZahlungsziel} />
            <View style={styles.divider} />
            <FormField label="Mindestbestellwert" value={editMindestbestellung} onChangeText={setEditMindestbestellung} />
            <View style={styles.divider} />
            <FormField label="Lieferzeit" value={editLieferzeit} onChangeText={setEditLieferzeit} />
          </View>

          <Text style={styles.sectionLabel}>Bestellweg</Text>
          <View style={styles.card}>
            <View style={styles.radioGroup}>
              {BESTELLWEG_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => setEditBestellweg(opt.key)}
                  style={[styles.radioBtn, editBestellweg === opt.key && styles.radioBtnActive]}
                >
                  <View style={[styles.radioDot, editBestellweg === opt.key && styles.radioDotActive]} />
                  <Text style={[styles.radioLabel, editBestellweg === opt.key && styles.radioLabelActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {editBestellweg === "email" && (
              <>
                <View style={styles.divider} />
                <FormField label="Bestell-Email" value={editBestellEmail} onChangeText={setEditBestellEmail} />
              </>
            )}
          </View>

          <View style={styles.artikelRow}>
            <View style={styles.artikelLeft}>
              <Ionicons name="cube-outline" size={20} color={Colors.raw.zinc400} />
              <Text style={styles.artikelText}>{selectedSupplier.artikel} Produkte gespeichert</Text>
            </View>
            <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Text style={styles.artikelLink}>Artikel ansehen</Text>
            </Pressable>
          </View>

          {selectedSupplier.orders.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Letzte Bestellungen</Text>
              <View style={styles.card}>
                {selectedSupplier.orders.map((order, i) => (
                  <View key={i}>
                    <View style={styles.orderRow}>
                      <Text style={styles.orderDate}>{order.date}</Text>
                      <Text style={styles.orderDash}>{" \u2014 "}</Text>
                      <Text style={styles.orderAmount}>{order.amount} \u20AC</Text>
                      <Text style={styles.orderDash}>{" \u2014 "}</Text>
                      <Text style={styles.orderProject}>{order.project}</Text>
                    </View>
                    {i < selectedSupplier.orders.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={styles.bottomButtons}>
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [styles.saveBtn, { opacity: pressed ? 0.9 : 1 }]}
            >
              <Text style={styles.saveBtnText}>Speichern</Text>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.9 : 1 }]}
            >
              <Text style={styles.deleteBtnText}>Löschen</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 12, paddingBottom: bottomInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.raw.white} />
        </Pressable>

        <Text style={styles.title}>Lieferanten</Text>

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

        <Text style={styles.countText}>21 Lieferanten</Text>

        {filteredSuppliers.map((supplier) => (
          <Pressable
            key={supplier.id}
            onPress={() => selectSupplier(supplier)}
            style={({ pressed }) => [styles.supplierCard, { opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={styles.supplierTop}>
              <Text style={styles.supplierName}>{supplier.name}</Text>
              <Ionicons
                name={supplier.favorite ? "star" : "star-outline"}
                size={20}
                color={Colors.raw.amber500}
              />
            </View>
            <Text style={styles.supplierMeta}>
              Kd.Nr: {supplier.kdNr}  {"\u00B7"}  {supplier.artikel} Artikel
            </Text>
            <View style={styles.supplierPhone}>
              <Ionicons name="call-outline" size={14} color={Colors.raw.zinc500} />
              <Text style={styles.supplierTel}>{supplier.tel}</Text>
            </View>
          </Pressable>
        ))}

        <Pressable style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.7 : 1 }]}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.raw.amber500} />
          <Text style={styles.addBtnText}>Lieferant hinzufügen</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  backBtn: { marginBottom: 12, width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.raw.zinc900, alignItems: "center", justifyContent: "center" },

  title: { fontFamily: "Inter_800ExtraBold", fontSize: 30, color: Colors.raw.white, marginBottom: 20 },

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

  supplierCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 18,
    marginBottom: 10,
  },
  supplierTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  supplierName: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.raw.white },
  supplierMeta: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc400, marginBottom: 6 },
  supplierPhone: { flexDirection: "row", alignItems: "center", gap: 6 },
  supplierTel: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc500 },

  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 18 },
  addBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.amber500 },

  detailHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  detailTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 26, color: Colors.raw.white, flex: 1, marginRight: 12 },

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
  fieldLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.zinc500, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 },
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

  artikelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 20,
  },
  artikelLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  artikelText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.raw.zinc400 },
  artikelLink: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.amber500 },

  orderRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  orderDate: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc300 },
  orderDash: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.raw.zinc600 },
  orderAmount: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.white },
  orderProject: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.raw.zinc400 },

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
