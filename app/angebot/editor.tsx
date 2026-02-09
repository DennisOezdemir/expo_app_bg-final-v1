import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useState, useCallback, useMemo, useEffect } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface Project {
  id: string;
  code: string;
  name: string;
  address: string;
  client: string;
}

const PROJECTS: Project[] = [
  { id: "1", code: "BL-2026-003", name: "Schwentnerring", address: "Schwentnerring 13c, 22045 Hamburg", client: "SAGA GWG" },
  { id: "2", code: "BL-2026-007", name: "Haferweg", address: "Haferweg 44, 22769 Hamburg", client: "SAGA GWG" },
  { id: "3", code: "BL-2026-001", name: "Bramfelder Str.", address: "Bramfelder Str. 140, 22305 Hamburg", client: "Privat" },
  { id: "4", code: "BL-2026-005", name: "Billhorner Deich", address: "Billhorner Deich 72, 20539 Hamburg", client: "GWG" },
];

interface CatalogPosition {
  nr: string;
  title: string;
  desc: string;
  price: number;
  unit: string;
  trade: string;
  useCount?: number;
}

const CATALOG: CatalogPosition[] = [
  { nr: "01.01", title: "Wandfl\u00E4chen grundieren", desc: "Wandfl\u00E4chen fachgerecht grundieren mit Tiefengrund LF. Untergrund muss trocken, sauber und tragf\u00E4hig sein.", price: 3.2, unit: "m\u00B2", trade: "Maler", useCount: 5 },
  { nr: "01.02", title: "Wandfl\u00E4chen streichen", desc: "Wandfl\u00E4chen streichen mit Dispersionsfarbe, deckend in einem Anstrich. Farbton nach Absprache.", price: 4.8, unit: "m\u00B2", trade: "Maler", useCount: 9 },
  { nr: "01.03", title: "Raufaser tapezieren", desc: "Raufasertapete Typ mittel auf vorbereiteten Untergrund tapezieren inkl. Kleister und Zuschnitt.", price: 8.4, unit: "m\u00B2", trade: "Maler", useCount: 12 },
  { nr: "01.04", title: "Vliestapete tapezieren", desc: "Malervlies glatt auf vorbereiteten Untergrund tapezieren inkl. Spezialkleber.", price: 9.6, unit: "m\u00B2", trade: "Maler", useCount: 4 },
  { nr: "01.05", title: "Decke streichen", desc: "Deckenfl\u00E4chen mit Dispersionsfarbe streichen, deckend. Abkleben und Abdeckarbeiten inklusive.", price: 5.2, unit: "m\u00B2", trade: "Maler", useCount: 6 },
  { nr: "01.06", title: "Lackarbeiten T\u00FCrzargen", desc: "T\u00FCrzargen schleifen, grundieren und zweimal lackieren mit Acryllack seidenmatt.", price: 28, unit: "Stk", trade: "Maler", useCount: 3 },
  { nr: "01.07", title: "Lackarbeiten Fenster", desc: "Fensterrahmen innen schleifen, grundieren und zweimal lackieren mit Acryllack seidenmatt.", price: 32, unit: "Stk", trade: "Maler", useCount: 2 },
  { nr: "01.08", title: "Spachtelarbeiten Q3", desc: "Spachtelarbeiten Qualit\u00E4tsstufe Q3 auf Gipskartonplatten inkl. Fugen und Schraubenk\u00F6pfe.", price: 6.8, unit: "m\u00B2", trade: "Maler", useCount: 1 },
  { nr: "03.01", title: "Laminat verlegen", desc: "Laminat Nutzungsklasse 32 schwimmend verlegen inkl. Trittschalld\u00E4mmung und Randleisten.", price: 24.5, unit: "m\u00B2", trade: "Boden", useCount: 7 },
  { nr: "03.02", title: "PVC-Belag verlegen", desc: "PVC-Belag vollfl\u00E4chig verkleben. Untergrund muss eben und sauber sein.", price: 18, unit: "m\u00B2", trade: "Boden", useCount: 3 },
  { nr: "03.03", title: "Sockelleisten montieren", desc: "Sockelleisten aus MDF montieren inkl. D\u00FCbel, Schrauben und Eckst\u00FCcke.", price: 12.5, unit: "lfm", trade: "Boden", useCount: 4 },
  { nr: "03.04", title: "Parkettboden schleifen", desc: "Parkettboden maschinell schleifen und 2x versiegeln mit Parkettlack seidenmatt.", price: 38, unit: "m\u00B2", trade: "Boden", useCount: 2 },
  { nr: "05.01", title: "Waschtisch montieren", desc: "Waschtisch inkl. Einhandmischer und Siphon montieren, Anschl\u00FCsse herstellen.", price: 180, unit: "Stk", trade: "Sanit\u00E4r", useCount: 3 },
  { nr: "05.02", title: "WC montieren", desc: "Wand-WC inkl. Bet\u00E4tigungsplatte und Anschluss montieren.", price: 220, unit: "Stk", trade: "Sanit\u00E4r", useCount: 2 },
  { nr: "05.03", title: "Thermostat tauschen", desc: "Heizk\u00F6rperthermostat austauschen inkl. Material und Entl\u00FCftung.", price: 38.4, unit: "Stk", trade: "Sanit\u00E4r", useCount: 7 },
  { nr: "07.01", title: "Wandfliesen verlegen", desc: "Wandfliesen im D\u00FCnnbett verlegen inkl. Grundierung, Kleber und Verfugung.", price: 54.4, unit: "m\u00B2", trade: "Fliesen", useCount: 5 },
  { nr: "07.02", title: "Bodenfliesen verlegen", desc: "Bodenfliesen im D\u00FCnnbett verlegen inkl. Grundierung, Kleber und Verfugung.", price: 70, unit: "m\u00B2", trade: "Fliesen", useCount: 4 },
  { nr: "07.12", title: "Heizk\u00F6rper lackieren", desc: "Heizk\u00F6rper bis 10 Glieder reinigen, grundieren und 2x Lackieren.", price: 38.4, unit: "Stk", trade: "Maler", useCount: 3 },
  { nr: "09.01", title: "Steckdose setzen", desc: "Unterputz-Steckdose setzen inkl. Schlitz, Dose und Verdrahtung.", price: 45, unit: "Stk", trade: "Elektro", useCount: 2 },
  { nr: "09.02", title: "Lichtschalter setzen", desc: "Unterputz-Lichtschalter setzen inkl. Schlitz, Dose und Verdrahtung.", price: 42, unit: "Stk", trade: "Elektro", useCount: 1 },
];

const TRADE_FILTERS = ["Alle", "Maler", "Boden", "Sanit\u00E4r", "Fliesen", "Elektro"];

interface CatalogSource {
  id: string;
  label: string;
  icon: string;
  desc: string;
}

const CATALOG_SOURCES: CatalogSource[] = [
  { id: "wabs", label: "WABS Katalog", icon: "layers", desc: "Standardleistungsverzeichnis" },
  { id: "stlb", label: "StLB-Bau", icon: "library", desc: "Standardleistungsbuch Bau" },
  { id: "eigen", label: "Eigenleistungen", icon: "construct", desc: "Eigene Leistungspositionen" },
  { id: "firma", label: "Firmenpreise", icon: "business", desc: "Interne Preisliste" },
];

interface JumboTemplate {
  id: string;
  title: string;
  desc: string;
  icon: string;
  trade: string;
  posCount: number;
  avgValue: number;
  positions: { nr: string; title: string; desc: string; price: number; unit: string; qty: number; trade: string }[];
}

const JUMBO_TEMPLATES: JumboTemplate[] = [
  {
    id: "bad-komplett",
    title: "Badsanierung komplett",
    desc: "Komplettpaket: Fliesen, Sanit\u00E4r, Maler inkl. aller Standardpositionen",
    icon: "water",
    trade: "Komplett",
    posCount: 8,
    avgValue: 8500,
    positions: [
      { nr: "01", title: "Wandfliesen Bad", desc: "Wandfliesen im D\u00FCnnbett verlegen inkl. Grundierung, Kleber und Verfugung.", price: 54.4, unit: "m\u00B2", qty: 28, trade: "Fliesen" },
      { nr: "02", title: "Bodenfliesen Bad", desc: "Bodenfliesen im D\u00FCnnbett verlegen inkl. Grundierung, Kleber und Verfugung.", price: 70, unit: "m\u00B2", qty: 6, trade: "Fliesen" },
      { nr: "03", title: "Waschtisch montieren", desc: "Waschtisch inkl. Einhandmischer und Siphon montieren.", price: 180, unit: "Stk", qty: 1, trade: "Sanit\u00E4r" },
      { nr: "04", title: "WC montieren", desc: "Wand-WC inkl. Bet\u00E4tigungsplatte und Anschluss montieren.", price: 220, unit: "Stk", qty: 1, trade: "Sanit\u00E4r" },
      { nr: "05", title: "Badewanne / Dusche", desc: "Badewanne oder Duschwanne einbauen inkl. Anschluss und Abdichtung.", price: 380, unit: "Stk", qty: 1, trade: "Sanit\u00E4r" },
      { nr: "06", title: "Silikonfugen", desc: "Silikonfugen in K\u00FCche/Bad erneuern, Altsilikon entfernen.", price: 8.5, unit: "lfm", qty: 15, trade: "Fliesen" },
      { nr: "07", title: "Decke streichen", desc: "Deckenfl\u00E4chen mit Dispersionsfarbe streichen.", price: 5.2, unit: "m\u00B2", qty: 6, trade: "Maler" },
      { nr: "08", title: "Armaturen", desc: "Brauseset und Armaturen montieren inkl. Anschluss.", price: 120, unit: "Stk", qty: 1, trade: "Sanit\u00E4r" },
    ],
  },
  {
    id: "wohnung-renovierung",
    title: "Wohnungsrenovierung Standard",
    desc: "Tapezieren, Streichen, Boden \u2013 alle R\u00E4ume einer 3-Zimmer-Wohnung",
    icon: "home",
    trade: "Komplett",
    posCount: 6,
    avgValue: 6200,
    positions: [
      { nr: "01", title: "Raufaser tapezieren", desc: "Raufasertapete Typ mittel auf vorbereiteten Untergrund tapezieren.", price: 8.4, unit: "m\u00B2", qty: 120, trade: "Maler" },
      { nr: "02", title: "Wandfl\u00E4chen streichen", desc: "Wandfl\u00E4chen streichen mit Dispersionsfarbe, deckend.", price: 4.8, unit: "m\u00B2", qty: 120, trade: "Maler" },
      { nr: "03", title: "Decken streichen", desc: "Deckenfl\u00E4chen mit Dispersionsfarbe streichen.", price: 5.2, unit: "m\u00B2", qty: 65, trade: "Maler" },
      { nr: "04", title: "Laminat verlegen", desc: "Laminat NK32 schwimmend verlegen inkl. Trittschalld\u00E4mmung.", price: 24.5, unit: "m\u00B2", qty: 55, trade: "Boden" },
      { nr: "05", title: "Sockelleisten", desc: "Sockelleisten aus MDF montieren inkl. Zubeh\u00F6r.", price: 12.5, unit: "lfm", qty: 42, trade: "Boden" },
      { nr: "06", title: "T\u00FCrzargen lackieren", desc: "T\u00FCrzargen schleifen, grundieren und lackieren.", price: 28, unit: "Stk", qty: 6, trade: "Maler" },
    ],
  },
  {
    id: "maler-standard",
    title: "Malerarbeiten Standard",
    desc: "Grundierung, Tapezierung und Anstrich f\u00FCr einen Raum",
    icon: "color-palette",
    trade: "Maler",
    posCount: 4,
    avgValue: 1800,
    positions: [
      { nr: "01", title: "Wandfl\u00E4chen grundieren", desc: "Wandfl\u00E4chen fachgerecht grundieren mit Tiefengrund LF.", price: 3.2, unit: "m\u00B2", qty: 40, trade: "Maler" },
      { nr: "02", title: "Raufaser tapezieren", desc: "Raufasertapete Typ mittel auf vorbereiteten Untergrund.", price: 8.4, unit: "m\u00B2", qty: 40, trade: "Maler" },
      { nr: "03", title: "Wandfl\u00E4chen streichen", desc: "Dispersionsfarbe deckend in einem Anstrich.", price: 4.8, unit: "m\u00B2", qty: 40, trade: "Maler" },
      { nr: "04", title: "Decke streichen", desc: "Deckenfl\u00E4chen streichen mit Dispersionsfarbe.", price: 5.2, unit: "m\u00B2", qty: 12, trade: "Maler" },
    ],
  },
  {
    id: "elektro-wohnung",
    title: "Elektro-Grundausstattung",
    desc: "Steckdosen, Schalter und Leitungen f\u00FCr eine Wohneinheit",
    icon: "flash",
    trade: "Elektro",
    posCount: 4,
    avgValue: 3200,
    positions: [
      { nr: "01", title: "Steckdosen setzen", desc: "Unterputz-Steckdose setzen inkl. Schlitz und Verdrahtung.", price: 45, unit: "Stk", qty: 24, trade: "Elektro" },
      { nr: "02", title: "Lichtschalter setzen", desc: "Unterputz-Lichtschalter setzen inkl. Verdrahtung.", price: 42, unit: "Stk", qty: 12, trade: "Elektro" },
      { nr: "03", title: "Deckenleuchte anschlie\u00DFen", desc: "Deckenauslass inkl. L\u00FCsterklemme und Baldachin.", price: 35, unit: "Stk", qty: 8, trade: "Elektro" },
      { nr: "04", title: "Sicherungskasten", desc: "Sicherungskasten pr\u00FCfen und ggf. Sicherungen tauschen.", price: 180, unit: "Pauschal", qty: 1, trade: "Elektro" },
    ],
  },
  {
    id: "boden-komplett",
    title: "Bodenarbeiten komplett",
    desc: "Boden vorbereiten, verlegen und Sockelleisten f\u00FCr einen Raum",
    icon: "grid",
    trade: "Boden",
    posCount: 4,
    avgValue: 2400,
    positions: [
      { nr: "01", title: "Altbelag entfernen", desc: "Vorhandenen Bodenbelag entfernen und entsorgen.", price: 6.5, unit: "m\u00B2", qty: 25, trade: "Boden" },
      { nr: "02", title: "Untergrund spachteln", desc: "Untergrund ausgleichen mit Nivelliermasse.", price: 8, unit: "m\u00B2", qty: 25, trade: "Boden" },
      { nr: "03", title: "Laminat verlegen", desc: "Laminat NK32 schwimmend verlegen inkl. Trittschalld\u00E4mmung.", price: 24.5, unit: "m\u00B2", qty: 25, trade: "Boden" },
      { nr: "04", title: "Sockelleisten", desc: "Sockelleisten montieren inkl. Eckst\u00FCcke.", price: 12.5, unit: "lfm", qty: 20, trade: "Boden" },
    ],
  },
];

const ROOM_SUGGESTIONS: { icon: string; name: string }[] = [
  { icon: "water", name: "Bad" },
  { icon: "restaurant", name: "K\u00FCche" },
  { icon: "home", name: "Wohnzimmer" },
  { icon: "bed", name: "Schlafzimmer" },
  { icon: "people", name: "Kinderzimmer" },
  { icon: "footsteps", name: "Flur" },
  { icon: "business", name: "Au\u00DFen" },
  { icon: "cube", name: "Abstellraum" },
  { icon: "arrow-down", name: "Keller" },
];

const UNITS = ["m\u00B2", "Stk", "Pauschal", "lfm", "m\u00B3"];

interface OfferPosition {
  id: string;
  nr: string;
  title: string;
  desc: string;
  qty: number;
  unit: string;
  basePrice: number;
  markup: number;
  catalogNr?: string;
}

interface Room {
  id: string;
  icon: string;
  name: string;
  positions: OfferPosition[];
  collapsed: boolean;
}

function formatEuro(amount: number): string {
  return "\u20AC" + amount.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatEuroShort(amount: number): string {
  if (amount >= 1000) {
    return "\u20AC" + (amount / 1000).toFixed(1).replace(".", ",") + "k";
  }
  return formatEuro(amount);
}

function genId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function ProjectSelector({ onSelect }: { onSelect: (p: Project) => void }) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const [search, setSearch] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newClient, setNewClient] = useState("");

  const filtered = search
    ? PROJECTS.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.client.toLowerCase().includes(search.toLowerCase())
      )
    : PROJECTS;

  const handleCreateProject = () => {
    if (!newName.trim()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const nextNr = String(PROJECTS.length + 1).padStart(3, "0");
    const newProject: Project = {
      id: genId(),
      code: `BL-2026-${nextNr}`,
      name: newName.trim(),
      address: newAddress.trim() || "Adresse ausstehend",
      client: newClient.trim() || "Kunde ausstehend",
    };
    PROJECTS.push(newProject);
    onSelect(newProject);
  };

  return (
    <View style={ps.container}>
      <View style={[ps.header, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, width: 44, height: 44, alignItems: "center", justifyContent: "center" })} testID="back-button">
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[ps.content, { paddingTop: topInset + 64, paddingBottom: bottomInset + 20 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={ps.title}>Projekt w\u00E4hlen</Text>
        <Text style={ps.subtitle}>W\u00E4hle ein bestehendes Projekt oder lege ein neues an.</Text>

        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowNewForm(!showNewForm);
          }}
          style={({ pressed }) => [ps.newProjectBtn, { opacity: pressed ? 0.85 : 1 }]}
          testID="new-project-btn"
        >
          <View style={ps.newProjectIcon}>
            <Ionicons name={showNewForm ? "chevron-up" : "add"} size={20} color="#000" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ps.newProjectTitle}>Neues Projekt anlegen</Text>
            <Text style={ps.newProjectSub}>Projekt wird automatisch erstellt</Text>
          </View>
        </Pressable>

        {showNewForm && (
          <View style={ps.newFormCard}>
            <Text style={ps.formLabel}>Projektname *</Text>
            <TextInput
              style={ps.formInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="z.B. Schwentnerring 13c"
              placeholderTextColor={Colors.raw.zinc600}
              autoFocus
              testID="new-project-name"
            />
            <Text style={ps.formLabel}>Adresse</Text>
            <TextInput
              style={ps.formInput}
              value={newAddress}
              onChangeText={setNewAddress}
              placeholder="Stra\u00DFe, PLZ Ort"
              placeholderTextColor={Colors.raw.zinc600}
              testID="new-project-address"
            />
            <Text style={ps.formLabel}>Kunde</Text>
            <TextInput
              style={ps.formInput}
              value={newClient}
              onChangeText={setNewClient}
              placeholder="z.B. SAGA GWG"
              placeholderTextColor={Colors.raw.zinc600}
              testID="new-project-client"
            />
            <Pressable
              onPress={handleCreateProject}
              style={({ pressed }) => [ps.createBtn, { opacity: newName.trim() ? (pressed ? 0.85 : 1) : 0.4 }]}
              testID="create-project-btn"
            >
              <Ionicons name="checkmark-circle" size={18} color="#000" />
              <Text style={ps.createBtnText}>Projekt anlegen & weiter</Text>
            </Pressable>
          </View>
        )}

        <View style={ps.searchBar}>
          <Ionicons name="search" size={18} color={Colors.raw.zinc500} />
          <TextInput
            style={ps.searchInput}
            placeholder="Projekt suchen..."
            placeholderTextColor={Colors.raw.zinc500}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={Colors.raw.zinc500} />
            </Pressable>
          )}
        </View>
        <Text style={ps.recentLabel}>Zuletzt verwendet</Text>
        {filtered.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(p);
            }}
            style={({ pressed }) => [ps.card, { opacity: pressed ? 0.85 : 1 }]}
            testID={`project-${p.id}`}
          >
            <View style={ps.cardIcon}>
              <Ionicons name="business" size={20} color={Colors.raw.amber500} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ps.cardCode}>{p.code}</Text>
              <Text style={ps.cardName}>{p.name}</Text>
              <Text style={ps.cardAddr}>{p.address}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.raw.zinc600} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const ps = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  header: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingBottom: 12, backgroundColor: Colors.raw.zinc950 + "E6" },
  content: { paddingHorizontal: 20 },
  title: { fontFamily: "Inter_800ExtraBold", fontSize: 28, color: Colors.raw.white, marginBottom: 6 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.raw.zinc400, marginBottom: 20 },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.raw.zinc900, borderRadius: 14, borderWidth: 1, borderColor: Colors.raw.zinc800, paddingHorizontal: 14, paddingVertical: 12, gap: 10, marginBottom: 24 },
  searchInput: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.raw.white, padding: 0 },
  recentLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc500, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.raw.zinc900, borderRadius: 16, borderWidth: 1, borderColor: Colors.raw.zinc800, padding: 16, gap: 14, marginBottom: 10 },
  cardIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.raw.amber500 + "18", alignItems: "center", justifyContent: "center" },
  cardCode: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.amber500, marginBottom: 2 },
  cardName: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.raw.white, marginBottom: 2 },
  cardAddr: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500 },
  newProjectBtn: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.raw.amber500 + "18", borderRadius: 16, borderWidth: 1, borderColor: Colors.raw.amber500 + "40", padding: 16, gap: 14, marginBottom: 16 },
  newProjectIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.raw.amber500, alignItems: "center", justifyContent: "center" },
  newProjectTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.white, marginBottom: 2 },
  newProjectSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc400 },
  newFormCard: { backgroundColor: Colors.raw.zinc900, borderRadius: 18, borderWidth: 1, borderColor: Colors.raw.zinc800, padding: 18, marginBottom: 20 },
  formLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc400, marginBottom: 6, marginTop: 10 },
  formInput: { backgroundColor: Colors.raw.zinc800, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.white },
  createBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.raw.amber500, borderRadius: 14, paddingVertical: 14, marginTop: 16 },
  createBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#000" },
});

type AddTab = "katalog" | "letzte" | "frei" | "jumbos";

function AddPositionSheet({
  visible,
  onClose,
  onAdd,
  onAddMultiple,
  roomNr,
  nextPosNr,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (pos: OfferPosition) => void;
  onAddMultiple?: (positions: OfferPosition[]) => void;
  roomNr: string;
  nextPosNr: number;
}) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<AddTab>("katalog");
  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState("Alle");
  const [addedItem, setAddedItem] = useState<CatalogPosition | null>(null);
  const [qty, setQty] = useState("");
  const [priceOverride, setPriceOverride] = useState("");
  const [markup, setMarkup] = useState("15");
  const [selectedCatalog, setSelectedCatalog] = useState<string>("wabs");
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const [selectedJumbo, setSelectedJumbo] = useState<JumboTemplate | null>(null);

  const [freiNr, setFreiNr] = useState(`${roomNr}.${String(nextPosNr).padStart(2, "0")}`);
  const [freiTitle, setFreiTitle] = useState("");
  const [freiDesc, setFreiDesc] = useState("");
  const [freiUnit, setFreiUnit] = useState("m\u00B2");
  const [freiQty, setFreiQty] = useState("");
  const [freiPrice, setFreiPrice] = useState("");

  const filteredCatalog = useMemo(() => {
    let items = CATALOG;
    if (tradeFilter !== "Alle") {
      items = items.filter((c) => c.trade === tradeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((c) =>
        c.nr.includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.desc.toLowerCase().includes(q) ||
        c.trade.toLowerCase().includes(q)
      );
    }
    return items;
  }, [search, tradeFilter]);

  const recentItems = useMemo(() => {
    return [...CATALOG].sort((a, b) => (b.useCount ?? 0) - (a.useCount ?? 0)).slice(0, 8);
  }, []);

  const handleAddCatalog = useCallback((item: CatalogPosition) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAddedItem(item);
    setQty("");
    setPriceOverride(item.price.toFixed(2).replace(".", ","));
    setMarkup("15");
  }, []);

  const handleConfirmCatalog = useCallback(() => {
    if (!addedItem) return;
    const qtyNum = parseFloat(qty.replace(",", ".")) || 0;
    const priceNum = parseFloat(priceOverride.replace(",", ".")) || addedItem.price;
    const markupNum = parseFloat(markup) || 0;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd({
      id: genId(),
      nr: `${roomNr}.${String(nextPosNr).padStart(2, "0")}`,
      title: addedItem.title,
      desc: addedItem.desc,
      qty: qtyNum,
      unit: addedItem.unit,
      basePrice: priceNum,
      markup: markupNum,
      catalogNr: addedItem.nr,
    });
    setAddedItem(null);
    onClose();
  }, [addedItem, qty, priceOverride, markup, roomNr, nextPosNr, onAdd, onClose]);

  const handleFreiSubmit = useCallback(() => {
    if (!freiTitle.trim()) return;
    const qtyNum = parseFloat(freiQty.replace(",", ".")) || 0;
    const priceNum = parseFloat(freiPrice.replace(",", ".")) || 0;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd({
      id: genId(),
      nr: freiNr,
      title: freiTitle,
      desc: freiDesc,
      qty: qtyNum,
      unit: freiUnit,
      basePrice: priceNum,
      markup: 0,
    });
    onClose();
  }, [freiNr, freiTitle, freiDesc, freiUnit, freiQty, freiPrice, onAdd, onClose]);

  const effectivePrice = addedItem ? (() => {
    const base = parseFloat(priceOverride.replace(",", ".")) || addedItem.price;
    const m = parseFloat(markup) || 0;
    return base * (1 + m / 100);
  })() : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={apStyles.overlay}>
          <View style={[apStyles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={apStyles.handle} />
            <View style={apStyles.sheetHeader}>
              <Text style={apStyles.sheetTitle}>{addedItem ? "Position konfigurieren" : "Position hinzuf\u00FCgen"}</Text>
              <Pressable onPress={() => { setAddedItem(null); onClose(); }} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
                <Ionicons name="close" size={24} color={Colors.raw.zinc400} />
              </Pressable>
            </View>

            {addedItem ? (
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                <View style={apStyles.addedBanner}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.raw.emerald500} />
                  <Text style={apStyles.addedText}>{addedItem.nr} {addedItem.title}</Text>
                </View>
                <Text style={apStyles.fieldLabel}>Menge</Text>
                <View style={apStyles.fieldRow}>
                  <TextInput style={apStyles.fieldInput} value={qty} onChangeText={setQty} placeholder="0" placeholderTextColor={Colors.raw.zinc600} keyboardType="decimal-pad" testID="qty-input" />
                  <Text style={apStyles.fieldUnit}>{addedItem.unit}</Text>
                </View>
                <Text style={apStyles.fieldLabel}>Preis</Text>
                <View style={apStyles.fieldRow}>
                  <Text style={apStyles.euroPrefix}>{"\u20AC"}</Text>
                  <TextInput style={[apStyles.fieldInput, { flex: 1 }]} value={priceOverride} onChangeText={setPriceOverride} keyboardType="decimal-pad" />
                  <Text style={apStyles.fieldUnit}>/{addedItem.unit}</Text>
                </View>
                <Text style={apStyles.fieldLabel}>Aufschlag</Text>
                <View style={apStyles.fieldRow}>
                  <TextInput style={[apStyles.fieldInput, { width: 60 }]} value={markup} onChangeText={setMarkup} keyboardType="decimal-pad" />
                  <Text style={apStyles.fieldUnit}>%</Text>
                </View>
                <View style={apStyles.calcRow}>
                  <Text style={apStyles.calcLabel}>Endpreis</Text>
                  <Text style={apStyles.calcValue}>{formatEuro(effectivePrice)} /{addedItem.unit}</Text>
                </View>
                <Pressable onPress={handleConfirmCatalog} style={({ pressed }) => [apStyles.confirmBtn, { opacity: pressed ? 0.85 : 1 }]} testID="confirm-pos-btn">
                  <Ionicons name="checkmark-circle" size={18} color="#000" />
                  <Text style={apStyles.confirmBtnText}>{"\u00DCbernehmen"}</Text>
                </Pressable>
              </ScrollView>
            ) : (
              <>
                <View style={apStyles.tabs}>
                  {([
                    { key: "katalog" as AddTab, icon: "search", label: "Katalog" },
                    { key: "jumbos" as AddTab, icon: "rocket", label: "Jumbos" },
                    { key: "letzte" as AddTab, icon: "time", label: "Letzte" },
                    { key: "frei" as AddTab, icon: "create", label: "Frei" },
                  ]).map((t) => (
                    <Pressable key={t.key} onPress={() => setTab(t.key)} style={[apStyles.tab, tab === t.key && apStyles.tabActive]}>
                      <Ionicons name={t.icon as any} size={15} color={tab === t.key ? "#000" : Colors.raw.zinc400} />
                      <Text style={[apStyles.tabText, tab === t.key && apStyles.tabTextActive]}>{t.label}</Text>
                    </Pressable>
                  ))}
                </View>

                {tab === "katalog" && (
                  <View style={{ flex: 1 }}>
                    <Pressable
                      onPress={() => setShowCatalogPicker(!showCatalogPicker)}
                      style={({ pressed }) => [apStyles.catalogSelector, { opacity: pressed ? 0.85 : 1 }]}
                      testID="catalog-source-picker"
                    >
                      <Ionicons name={(CATALOG_SOURCES.find(c => c.id === selectedCatalog)?.icon || "layers") as any} size={16} color={Colors.raw.amber500} />
                      <Text style={apStyles.catalogSelectorText}>{CATALOG_SOURCES.find(c => c.id === selectedCatalog)?.label}</Text>
                      <Ionicons name={showCatalogPicker ? "chevron-up" : "chevron-down"} size={14} color={Colors.raw.zinc500} />
                    </Pressable>
                    {showCatalogPicker && (
                      <View style={apStyles.catalogPickerList}>
                        {CATALOG_SOURCES.map((cs) => (
                          <Pressable
                            key={cs.id}
                            onPress={() => {
                              setSelectedCatalog(cs.id);
                              setShowCatalogPicker(false);
                              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            style={({ pressed }) => [apStyles.catalogPickerItem, selectedCatalog === cs.id && apStyles.catalogPickerItemActive, { opacity: pressed ? 0.85 : 1 }]}
                          >
                            <View style={[apStyles.catalogPickerIcon, selectedCatalog === cs.id && { backgroundColor: Colors.raw.amber500 + "30" }]}>
                              <Ionicons name={cs.icon as any} size={16} color={selectedCatalog === cs.id ? Colors.raw.amber500 : Colors.raw.zinc500} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[apStyles.catalogPickerLabel, selectedCatalog === cs.id && { color: Colors.raw.amber500 }]}>{cs.label}</Text>
                              <Text style={apStyles.catalogPickerDesc}>{cs.desc}</Text>
                            </View>
                            {selectedCatalog === cs.id && <Ionicons name="checkmark-circle" size={18} color={Colors.raw.amber500} />}
                          </Pressable>
                        ))}
                      </View>
                    )}
                    <View style={apStyles.searchRow}>
                      <Ionicons name="search" size={16} color={Colors.raw.zinc500} />
                      <TextInput style={apStyles.searchInput} placeholder="Position suchen..." placeholderTextColor={Colors.raw.zinc600} value={search} onChangeText={setSearch} autoCapitalize="none" testID="catalog-search" />
                      {search.length > 0 && <Pressable onPress={() => setSearch("")}><Ionicons name="close-circle" size={16} color={Colors.raw.zinc500} /></Pressable>}
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 12 }}>
                      {TRADE_FILTERS.map((tf) => (
                        <Pressable key={tf} onPress={() => setTradeFilter(tf)} style={[apStyles.filterChip, tradeFilter === tf && apStyles.filterChipActive]}>
                          <Text style={[apStyles.filterChipText, tradeFilter === tf && apStyles.filterChipTextActive]}>{tf}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                    <FlatList
                      data={filteredCatalog}
                      keyExtractor={(item) => item.nr}
                      showsVerticalScrollIndicator={false}
                      style={{ flex: 1 }}
                      renderItem={({ item }) => (
                        <View style={apStyles.catalogItem}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <Text style={apStyles.catalogNr}>{item.nr}</Text>
                              <Text style={apStyles.catalogTitle} numberOfLines={1}>{item.title}</Text>
                            </View>
                            <Text style={apStyles.catalogDesc} numberOfLines={2}>{item.desc}</Text>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
                              <Text style={apStyles.catalogPrice}>{formatEuro(item.price)}/{item.unit}</Text>
                              <View style={apStyles.tradeBadge}><Text style={apStyles.tradeText}>{item.trade}</Text></View>
                            </View>
                          </View>
                          <Pressable onPress={() => handleAddCatalog(item)} style={({ pressed }) => [apStyles.addBtn, { opacity: pressed ? 0.8 : 1 }]} testID={`add-${item.nr}`}>
                            <Ionicons name="add" size={16} color="#000" />
                          </Pressable>
                        </View>
                      )}
                      ListEmptyComponent={<Text style={apStyles.emptyText}>Keine Positionen gefunden</Text>}
                    />
                  </View>
                )}

                {tab === "letzte" && (
                  <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                    <Text style={apStyles.sectionLabel}>Zuletzt verwendet</Text>
                    {recentItems.map((item) => (
                      <View key={item.nr} style={apStyles.catalogItem}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <Text style={apStyles.catalogNr}>{item.nr}</Text>
                            <Text style={apStyles.catalogTitle} numberOfLines={1}>{item.title}</Text>
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Text style={apStyles.catalogPrice}>{formatEuro(item.price)}/{item.unit}</Text>
                            <Text style={apStyles.useCount}>{item.useCount}x verwendet</Text>
                          </View>
                        </View>
                        <Pressable onPress={() => handleAddCatalog(item)} style={({ pressed }) => [apStyles.addBtn, { opacity: pressed ? 0.8 : 1 }]}>
                          <Ionicons name="add" size={16} color="#000" />
                        </Pressable>
                      </View>
                    ))}
                  </ScrollView>
                )}

                {tab === "frei" && (
                  <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                    <Text style={apStyles.sectionLabel}>Freie Position</Text>
                    <Text style={apStyles.fieldLabel}>Pos.Nr</Text>
                    <TextInput style={apStyles.freiInput} value={freiNr} onChangeText={setFreiNr} placeholderTextColor={Colors.raw.zinc600} />
                    <Text style={apStyles.fieldLabel}>Bezeichnung</Text>
                    <TextInput style={apStyles.freiInput} value={freiTitle} onChangeText={setFreiTitle} placeholder="Sonderarbeit..." placeholderTextColor={Colors.raw.zinc600} testID="frei-title" />
                    <Text style={apStyles.fieldLabel}>Langtext</Text>
                    <TextInput style={[apStyles.freiInput, { height: 80, textAlignVertical: "top" }]} value={freiDesc} onChangeText={setFreiDesc} multiline placeholder="Beschreibung..." placeholderTextColor={Colors.raw.zinc600} />
                    <Text style={apStyles.fieldLabel}>Einheit</Text>
                    <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                      {UNITS.map((u) => (
                        <Pressable key={u} onPress={() => setFreiUnit(u)} style={[apStyles.unitChip, freiUnit === u && apStyles.unitChipActive]}>
                          <Text style={[apStyles.unitChipText, freiUnit === u && apStyles.unitChipTextActive]}>{u}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={apStyles.fieldLabel}>Menge</Text>
                        <TextInput style={apStyles.freiInput} value={freiQty} onChangeText={setFreiQty} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={Colors.raw.zinc600} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={apStyles.fieldLabel}>Preis pro Einheit</Text>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <TextInput style={[apStyles.freiInput, { flex: 1 }]} value={freiPrice} onChangeText={setFreiPrice} keyboardType="decimal-pad" placeholder="\u20AC0,00" placeholderTextColor={Colors.raw.zinc600} />
                        </View>
                      </View>
                    </View>
                    <Pressable onPress={handleFreiSubmit} style={({ pressed }) => [apStyles.confirmBtn, { opacity: pressed ? 0.85 : 1, marginTop: 16 }]} testID="frei-submit-btn">
                      <Ionicons name="checkmark-circle" size={18} color="#000" />
                      <Text style={apStyles.confirmBtnText}>{"\u00DCbernehmen"}</Text>
                    </Pressable>
                  </ScrollView>
                )}

                {tab === "jumbos" && (
                  <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                    {selectedJumbo ? (
                      <View>
                        <Pressable onPress={() => setSelectedJumbo(null)} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 }}>
                          <Ionicons name="arrow-back" size={18} color={Colors.raw.zinc400} />
                          <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc400 }}>Zur\u00FCck</Text>
                        </Pressable>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <View style={apStyles.jumboDetailIcon}>
                            <Ionicons name={selectedJumbo.icon as any} size={20} color={Colors.raw.amber500} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.raw.white }}>{selectedJumbo.title}</Text>
                            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc400, marginTop: 2 }}>{selectedJumbo.desc}</Text>
                          </View>
                        </View>
                        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16, marginTop: 10 }}>
                          <View style={apStyles.jumboStatBadge}>
                            <Text style={apStyles.jumboStatText}>{selectedJumbo.positions.length} Positionen</Text>
                          </View>
                          <View style={apStyles.jumboStatBadge}>
                            <Text style={apStyles.jumboStatText}>{"\u2248"} {formatEuro(selectedJumbo.positions.reduce((s, p) => s + p.price * p.qty, 0))}</Text>
                          </View>
                        </View>
                        <Text style={apStyles.sectionLabel}>Enthaltene Positionen</Text>
                        {selectedJumbo.positions.map((p, idx) => (
                          <View key={idx} style={apStyles.catalogItem}>
                            <View style={{ flex: 1 }}>
                              <Text style={apStyles.catalogTitle}>{p.title}</Text>
                              <Text style={apStyles.catalogDesc} numberOfLines={1}>{p.desc}</Text>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                                <Text style={apStyles.catalogPrice}>{p.qty} {p.unit} x {formatEuro(p.price)}</Text>
                                <View style={apStyles.tradeBadge}><Text style={apStyles.tradeText}>{p.trade}</Text></View>
                              </View>
                            </View>
                          </View>
                        ))}
                        <Pressable
                          onPress={() => {
                            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            const positions: OfferPosition[] = selectedJumbo.positions.map((p, idx) => ({
                              id: genId() + idx,
                              nr: `${roomNr}.${String(nextPosNr + idx).padStart(2, "0")}`,
                              title: p.title,
                              desc: p.desc,
                              qty: p.qty,
                              unit: p.unit,
                              basePrice: p.price,
                              markup: 15,
                            }));
                            if (onAddMultiple) {
                              onAddMultiple(positions);
                            } else {
                              positions.forEach((pos) => onAdd(pos));
                            }
                            setSelectedJumbo(null);
                            onClose();
                          }}
                          style={({ pressed }) => [apStyles.confirmBtn, { opacity: pressed ? 0.85 : 1, marginTop: 16 }]}
                          testID="jumbo-apply-btn"
                        >
                          <Ionicons name="rocket" size={18} color="#000" />
                          <Text style={apStyles.confirmBtnText}>Alle {selectedJumbo.positions.length} Positionen \u00FCbernehmen</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View>
                        <Text style={apStyles.sectionLabel}>Vorgefertigte Angebotstemplates</Text>
                        {JUMBO_TEMPLATES.map((jt) => (
                          <Pressable
                            key={jt.id}
                            onPress={() => {
                              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              setSelectedJumbo(jt);
                            }}
                            style={({ pressed }) => [apStyles.jumboCard, { opacity: pressed ? 0.85 : 1 }]}
                            testID={`jumbo-${jt.id}`}
                          >
                            <View style={apStyles.jumboIcon}>
                              <Ionicons name={jt.icon as any} size={22} color={Colors.raw.amber500} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={apStyles.jumboTitle}>{jt.title}</Text>
                              <Text style={apStyles.jumboDesc} numberOfLines={2}>{jt.desc}</Text>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                                <View style={apStyles.jumboBadge}><Text style={apStyles.jumboBadgeText}>{jt.posCount} Pos.</Text></View>
                                <View style={apStyles.jumboBadge}><Text style={apStyles.jumboBadgeText}>{"\u2248"} {formatEuroShort(jt.avgValue)}</Text></View>
                                <View style={apStyles.jumboBadge}><Text style={apStyles.jumboBadgeText}>{jt.trade}</Text></View>
                              </View>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={Colors.raw.zinc600} />
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </ScrollView>
                )}
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const apStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.raw.zinc900, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, maxHeight: "90%", flex: 1 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.raw.zinc600, alignSelf: "center", marginTop: 12, marginBottom: 12 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sheetTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 20, color: Colors.raw.white },
  tabs: { flexDirection: "row", gap: 6, marginBottom: 16 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.raw.zinc800 },
  tabActive: { backgroundColor: Colors.raw.amber500 },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc400 },
  tabTextActive: { color: "#000" },
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.raw.zinc800, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.white, padding: 0 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: Colors.raw.zinc800 },
  filterChipActive: { backgroundColor: Colors.raw.amber500 },
  filterChipText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.zinc400 },
  filterChipTextActive: { color: "#000" },
  catalogItem: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.raw.zinc800, borderRadius: 14, padding: 14, marginBottom: 8, gap: 12 },
  catalogNr: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 12, color: Colors.raw.amber500 },
  catalogTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.white, flex: 1 },
  catalogDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc400, lineHeight: 17 },
  catalogPrice: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.emerald500 },
  tradeBadge: { backgroundColor: Colors.raw.zinc700, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tradeText: { fontFamily: "Inter_500Medium", fontSize: 10, color: Colors.raw.zinc300 },
  addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.raw.amber500, alignItems: "center", justifyContent: "center" },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc500, textAlign: "center", paddingVertical: 40 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc500, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 },
  useCount: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.raw.zinc500 },
  addedBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.raw.emerald500 + "18", padding: 14, borderRadius: 12, marginBottom: 20 },
  addedText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.emerald500, flex: 1 },
  fieldLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc400, marginBottom: 6, marginTop: 12 },
  fieldRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  fieldInput: { backgroundColor: Colors.raw.zinc800, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.raw.white, minWidth: 80 },
  fieldUnit: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc400 },
  euroPrefix: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.raw.zinc400 },
  calcRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.raw.zinc700, marginTop: 16 },
  calcLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc400 },
  calcValue: { fontFamily: "Inter_800ExtraBold", fontSize: 16, color: Colors.raw.white },
  confirmBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.raw.amber500, borderRadius: 14, paddingVertical: 14, marginTop: 8 },
  confirmBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#000" },
  freiInput: { backgroundColor: Colors.raw.zinc800, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.white, marginBottom: 4 },
  unitChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.raw.zinc800 },
  unitChipActive: { backgroundColor: Colors.raw.amber500 },
  unitChipText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc400 },
  unitChipTextActive: { color: "#000" },
  catalogSelector: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.raw.zinc800, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10, borderWidth: 1, borderColor: Colors.raw.zinc700 },
  catalogSelectorText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.white, flex: 1 },
  catalogPickerList: { backgroundColor: Colors.raw.zinc800, borderRadius: 14, borderWidth: 1, borderColor: Colors.raw.zinc700, marginBottom: 12, overflow: "hidden" as const },
  catalogPickerItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.raw.zinc700 },
  catalogPickerItemActive: { backgroundColor: Colors.raw.amber500 + "10" },
  catalogPickerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.raw.zinc700, alignItems: "center", justifyContent: "center" },
  catalogPickerLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.white },
  catalogPickerDesc: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.raw.zinc500, marginTop: 1 },
  jumboCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.raw.zinc800, borderRadius: 16, borderWidth: 1, borderColor: Colors.raw.zinc700, padding: 16, gap: 14, marginBottom: 10 },
  jumboIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.raw.amber500 + "18", alignItems: "center", justifyContent: "center" },
  jumboTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.white, marginBottom: 2 },
  jumboDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc400, lineHeight: 17 },
  jumboBadge: { backgroundColor: Colors.raw.zinc700, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  jumboBadgeText: { fontFamily: "Inter_500Medium", fontSize: 10, color: Colors.raw.zinc300 },
  jumboDetailIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.raw.amber500 + "18", alignItems: "center", justifyContent: "center" },
  jumboStatBadge: { backgroundColor: Colors.raw.zinc800, borderWidth: 1, borderColor: Colors.raw.zinc700, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  jumboStatText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.zinc300 },
});

function EditPositionSheet({
  visible,
  onClose,
  position,
  onSave,
  onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  position: OfferPosition | null;
  onSave: (pos: OfferPosition) => void;
  onDelete: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [markupVal, setMarkupVal] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    if (position) {
      setQty(position.qty > 0 ? position.qty.toString().replace(".", ",") : "");
      setPrice(position.basePrice.toFixed(2).replace(".", ","));
      setMarkupVal(position.markup.toString());
      setDesc(position.desc);
    }
  }, [position]);

  if (!position) return null;

  const basePrice = parseFloat(price.replace(",", ".")) || 0;
  const markupNum = parseFloat(markupVal) || 0;
  const endPrice = basePrice * (1 + markupNum / 100);
  const qtyNum = parseFloat(qty.replace(",", ".")) || 0;
  const total = endPrice * qtyNum;

  const handleSave = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      ...position,
      qty: qtyNum,
      basePrice,
      markup: markupNum,
      desc,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={apStyles.overlay}>
          <View style={[apStyles.sheet, { paddingBottom: Math.max(insets.bottom, 20), maxHeight: "80%" }]}>
            <View style={apStyles.handle} />
            <View style={apStyles.sheetHeader}>
              <Text style={apStyles.sheetTitle}>{position.nr} bearbeiten</Text>
              <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
                <Ionicons name="close" size={24} color={Colors.raw.zinc400} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={epStyles.posTitle}>{position.title}</Text>
              <Text style={apStyles.fieldLabel}>Langtext</Text>
              <TextInput
                style={[apStyles.freiInput, { height: 80, textAlignVertical: "top" }]}
                value={desc}
                onChangeText={setDesc}
                multiline
                placeholderTextColor={Colors.raw.zinc600}
              />
              {position.catalogNr && (
                <Pressable onPress={() => {
                  const orig = CATALOG.find((c) => c.nr === position.catalogNr);
                  if (orig) setDesc(orig.desc);
                }} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, marginTop: 6, marginBottom: 8 })}>
                  <Text style={epStyles.restoreText}>Originaltext wiederherstellen</Text>
                </Pressable>
              )}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={apStyles.fieldLabel}>Menge</Text>
                  <View style={apStyles.fieldRow}>
                    <TextInput style={[apStyles.fieldInput, { flex: 1 }]} value={qty} onChangeText={setQty} keyboardType="decimal-pad" />
                    <Text style={apStyles.fieldUnit}>{position.unit}</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={apStyles.fieldLabel}>Preis</Text>
                  <View style={apStyles.fieldRow}>
                    <Text style={apStyles.euroPrefix}>{"\u20AC"}</Text>
                    <TextInput style={[apStyles.fieldInput, { flex: 1 }]} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
                  </View>
                </View>
              </View>
              {position.catalogNr && (
                <Text style={epStyles.catalogRef}>Katalogpreis: {formatEuro(CATALOG.find((c) => c.nr === position.catalogNr)?.price ?? 0)}</Text>
              )}
              <Text style={apStyles.fieldLabel}>Aufschlag</Text>
              <View style={apStyles.fieldRow}>
                <TextInput style={[apStyles.fieldInput, { width: 60 }]} value={markupVal} onChangeText={setMarkupVal} keyboardType="decimal-pad" />
                <Text style={apStyles.fieldUnit}>%</Text>
              </View>
              <View style={epStyles.summaryBlock}>
                <View style={epStyles.summaryRow}>
                  <Text style={epStyles.summaryLabel}>Endpreis</Text>
                  <Text style={epStyles.summaryValue}>{formatEuro(endPrice)} /{position.unit}</Text>
                </View>
                <View style={epStyles.summaryRow}>
                  <Text style={epStyles.summaryLabel}>Gesamt</Text>
                  <Text style={epStyles.summaryTotal}>{formatEuro(total)}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <Pressable onPress={() => { onDelete(position.id); onClose(); }} style={({ pressed }) => [epStyles.deleteBtn, { opacity: pressed ? 0.8 : 1 }]} testID="delete-pos-btn">
                  <Ionicons name="trash" size={18} color={Colors.raw.rose500} />
                </Pressable>
                <Pressable onPress={handleSave} style={({ pressed }) => [apStyles.confirmBtn, { flex: 1, opacity: pressed ? 0.85 : 1 }]} testID="save-pos-btn">
                  <Feather name="save" size={16} color="#000" />
                  <Text style={apStyles.confirmBtnText}>Speichern</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const epStyles = StyleSheet.create({
  posTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.raw.white, marginBottom: 4 },
  restoreText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.raw.amber500 },
  catalogRef: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.raw.zinc500, marginTop: 4 },
  summaryBlock: { backgroundColor: Colors.raw.zinc800, borderRadius: 12, padding: 14, marginTop: 16, gap: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc400 },
  summaryValue: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.white },
  summaryTotal: { fontFamily: "Inter_800ExtraBold", fontSize: 18, color: Colors.raw.amber500 },
  deleteBtn: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, borderColor: Colors.raw.rose500 + "40", alignItems: "center", justifyContent: "center" },
});

function AddRoomSheet({ visible, onClose, onAdd }: { visible: boolean; onClose: () => void; onAdd: (name: string, icon: string) => void }) {
  const insets = useSafeAreaInsets();
  const [custom, setCustom] = useState("");

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={apStyles.overlay}>
        <View style={[arStyles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={apStyles.handle} />
          <Text style={apStyles.sheetTitle}>Raum hinzuf\u00FCgen</Text>
          <Text style={[apStyles.sectionLabel, { marginTop: 16, marginBottom: 12 }]}>Vorschl\u00E4ge</Text>
          <View style={arStyles.grid}>
            {ROOM_SUGGESTIONS.map((r) => (
              <Pressable
                key={r.name}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onAdd(r.name, r.icon);
                  onClose();
                }}
                style={({ pressed }) => [arStyles.chip, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Ionicons name={r.icon as any} size={16} color={Colors.raw.amber500} />
                <Text style={arStyles.chipText}>{r.name}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[apStyles.fieldLabel, { marginTop: 16 }]}>Oder eigener Name</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TextInput style={[apStyles.freiInput, { flex: 1 }]} value={custom} onChangeText={setCustom} placeholder="Raumname..." placeholderTextColor={Colors.raw.zinc600} />
            <Pressable
              onPress={() => {
                if (custom.trim()) {
                  onAdd(custom.trim(), "cube");
                  onClose();
                }
              }}
              style={({ pressed }) => [arStyles.addCustomBtn, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Ionicons name="add" size={20} color="#000" />
            </Pressable>
          </View>
          <Pressable onPress={onClose} style={({ pressed }) => [arStyles.cancelBtn, { opacity: pressed ? 0.7 : 1 }]}>
            <Text style={arStyles.cancelText}>Abbrechen</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const arStyles = StyleSheet.create({
  sheet: { backgroundColor: Colors.raw.zinc900, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.raw.zinc800, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  chipText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.white },
  addCustomBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.raw.amber500, alignItems: "center", justifyContent: "center" },
  cancelBtn: { alignSelf: "center", paddingVertical: 16 },
  cancelText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc400 },
});

function SaveSheet({ visible, onClose, onSave }: { visible: boolean; onClose: () => void; onSave: (mode: "draft" | "approval") => void }) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"draft" | "approval">("draft");

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={apStyles.overlay}>
        <View style={[arStyles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={apStyles.handle} />
          <Text style={[apStyles.sheetTitle, { marginBottom: 20 }]}>Speichern</Text>
          <Pressable onPress={() => setMode("draft")} style={[svStyles.option, mode === "draft" && svStyles.optionActive]}>
            <View style={[svStyles.radio, mode === "draft" && svStyles.radioActive]}>
              {mode === "draft" && <View style={svStyles.radioInner} />}
            </View>
            <View>
              <Text style={svStyles.optionTitle}>Als Entwurf speichern</Text>
              <Text style={svStyles.optionDesc}>Angebot wird als Entwurf gespeichert</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => setMode("approval")} style={[svStyles.option, mode === "approval" && svStyles.optionActive]}>
            <View style={[svStyles.radio, mode === "approval" && svStyles.radioActive]}>
              {mode === "approval" && <View style={svStyles.radioInner} />}
            </View>
            <View>
              <Text style={svStyles.optionTitle}>Zur Freigabe einreichen</Text>
              <Text style={svStyles.optionDesc}>Erstellt einen Freigabe-Eintrag f\u00FCr die Gesch\u00E4ftsf\u00FChrung</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => { onSave(mode); onClose(); }} style={({ pressed }) => [apStyles.confirmBtn, { marginTop: 20, opacity: pressed ? 0.85 : 1 }]}>
            <Feather name="save" size={16} color="#000" />
            <Text style={apStyles.confirmBtnText}>Speichern</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const svStyles = StyleSheet.create({
  option: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, backgroundColor: Colors.raw.zinc800, marginBottom: 8 },
  optionActive: { borderWidth: 1, borderColor: Colors.raw.amber500 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.raw.zinc600, alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: Colors.raw.amber500 },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.raw.amber500 },
  optionTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.white, marginBottom: 2 },
  optionDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc400 },
});

export default function OfferEditorScreen() {
  const params = useLocalSearchParams<{ offerId?: string; projectId?: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const isEditing = !!params.offerId;
  const preselectedProject = params.projectId ? PROJECTS.find((p) => p.id === params.projectId) : null;

  const [project, setProject] = useState<Project | null>(
    preselectedProject || (isEditing ? PROJECTS[0] : null)
  );
  const [rooms, setRooms] = useState<Room[]>(
    isEditing
      ? [
          {
            id: "bad", icon: "water", name: "Badezimmer", collapsed: false,
            positions: [
              { id: "p1", nr: "01.01", title: "Wandfliesen verlegen", desc: "Wandfliesen im D\u00FCnnbett verlegen inkl. Grundierung, Kleber und Verfugung.", qty: 12.5, unit: "m\u00B2", basePrice: 54.4, markup: 15, catalogNr: "07.01" },
              { id: "p2", nr: "01.02", title: "Bodenfliesen verlegen", desc: "Bodenfliesen im D\u00FCnnbett verlegen inkl. Grundierung, Kleber und Verfugung.", qty: 6, unit: "m\u00B2", basePrice: 70, markup: 15, catalogNr: "07.02" },
              { id: "p3", nr: "01.03", title: "Sanit\u00E4robjekte montieren", desc: "Waschtisch und WC montieren inkl. Anschl\u00FCsse.", qty: 1, unit: "Pauschal", basePrice: 1740, markup: 0 },
            ],
          },
          {
            id: "kueche", icon: "restaurant", name: "K\u00FCche", collapsed: true,
            positions: [
              { id: "p4", nr: "02.01", title: "K\u00FCchenzeile demontieren", desc: "K\u00FCchenzeile fachgerecht demontieren und entsorgen.", qty: 1, unit: "Pauschal", basePrice: 280, markup: 0 },
              { id: "p5", nr: "02.02", title: "Fliesenspiegel verlegen", desc: "Fliesenspiegel in K\u00FCche verlegen inkl. Zuschnitt.", qty: 4.8, unit: "m\u00B2", basePrice: 62, markup: 15 },
            ],
          },
        ]
      : []
  );

  const [addPosVisible, setAddPosVisible] = useState(false);
  const [addPosRoomId, setAddPosRoomId] = useState<string | null>(null);
  const [editPosition, setEditPosition] = useState<OfferPosition | null>(null);
  const [_editPosRoomId, setEditPosRoomId] = useState<string | null>(null);
  const [addRoomVisible, setAddRoomVisible] = useState(false);
  const [saveVisible, setSaveVisible] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [globalMarkup, setGlobalMarkup] = useState("15");
  const [showKalkulation, setShowKalkulation] = useState(false);

  const betreff = isEditing ? "Renovierung Schwentnerring 13c\nEG Links \u2014 Maler + Bodenbelag" : "";
  const [betreffText, setBetreffText] = useState(betreff);

  useEffect(() => {
    if (!project) return;
    const timer = setInterval(() => {
      setSavedIndicator(true);
      setTimeout(() => setSavedIndicator(false), 2000);
    }, 30000);
    return () => clearInterval(timer);
  }, [project]);

  const totalPositions = useMemo(() => rooms.reduce((s, r) => s + r.positions.length, 0), [rooms]);

  const totalNetto = useMemo(() => {
    return rooms.reduce((s, r) => {
      return s + r.positions.reduce((ps, p) => {
        const ep = p.basePrice * (1 + p.markup / 100);
        return ps + ep * p.qty;
      }, 0);
    }, 0);
  }, [rooms]);

  const estimatedCost = totalNetto * 0.66;
  const margin = totalNetto > 0 ? ((totalNetto - estimatedCost) / totalNetto) * 100 : 0;
  const marginColor = margin >= 25 ? Colors.raw.emerald500 : margin >= 15 ? Colors.raw.amber500 : Colors.raw.rose500;

  const toggleRoom = useCallback((roomId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRooms((prev) => prev.map((r) => r.id === roomId ? { ...r, collapsed: !r.collapsed } : r));
  }, []);

  const addPosition = useCallback((roomId: string, pos: OfferPosition) => {
    setRooms((prev) => prev.map((r) => {
      if (r.id !== roomId) return r;
      return { ...r, positions: [...r.positions, pos], collapsed: false };
    }));
  }, []);

  const updatePosition = useCallback((pos: OfferPosition) => {
    setRooms((prev) => prev.map((r) => ({
      ...r,
      positions: r.positions.map((p) => p.id === pos.id ? pos : p),
    })));
  }, []);

  const deletePosition = useCallback((posId: string) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setRooms((prev) => prev.map((r) => ({
      ...r,
      positions: r.positions.filter((p) => p.id !== posId),
    })));
  }, []);

  const addRoom = useCallback((name: string, icon: string) => {
    const _roomNr = String(rooms.length + 1).padStart(2, "0");
    setRooms((prev) => [...prev, { id: genId(), icon, name, positions: [], collapsed: false }]);
  }, [rooms.length]);

  const handleSave = useCallback((_mode: "draft" | "approval") => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSavedIndicator(true);
    setTimeout(() => {
      setSavedIndicator(false);
      router.back();
    }, 1500);
  }, []);

  if (!project) {
    return <ProjectSelector onSelect={setProject} />;
  }

  const roomForAddPos = rooms.find((r) => r.id === addPosRoomId);
  const roomNrForAdd = roomForAddPos ? String(rooms.indexOf(roomForAddPos) + 1).padStart(2, "0") : "01";
  const nextPosNr = roomForAddPos ? roomForAddPos.positions.length + 1 : 1;

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [s.headerBtn, { opacity: pressed ? 0.7 : 1 }]} testID="back-button">
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={s.headerTitle} numberOfLines={1}>{isEditing ? "Angebot bearbeiten" : "Angebot erstellen"}</Text>
          <Text style={s.headerSub} numberOfLines={1}>{project.code} \u2022 {project.name}</Text>
        </View>
        {savedIndicator && (
          <View style={s.savedBadge}>
            <Ionicons name="checkmark" size={12} color={Colors.raw.emerald500} />
            <Text style={s.savedText}>Gespeichert</Text>
          </View>
        )}
        <Pressable onPress={() => setMenuVisible(true)} style={({ pressed }) => [s.headerBtn, { opacity: pressed ? 0.7 : 1 }]} testID="menu-btn">
          <Ionicons name="ellipsis-vertical" size={20} color={Colors.raw.white} />
        </Pressable>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={[s.scrollContent, { paddingTop: topInset + 70, paddingBottom: bottomInset + 100 }]} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          <Text style={s.cardLabel}>ANGEBOT</Text>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Angebotsnummer</Text>
            <Text style={s.metaValue}>ANG-2026-003-02</Text>
          </View>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Version</Text>
            <Text style={s.metaValue}>v2</Text>
          </View>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Datum</Text>
            <Text style={s.metaValue}>08.02.2026</Text>
          </View>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>G\u00FCltig bis</Text>
            <Text style={s.metaValue}>08.03.2026</Text>
          </View>
          <View style={s.divider} />
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Kunde</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={s.metaValue}>{project.client}</Text>
              <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <Text style={s.changeBtn}>{"\u00C4ndern"}</Text>
              </Pressable>
            </View>
          </View>
          <Text style={s.clientDetail}>{project.address}</Text>
          <View style={s.divider} />
          <Text style={s.metaLabel}>Betreff</Text>
          <TextInput
            style={s.betreffInput}
            value={betreffText}
            onChangeText={setBetreffText}
            multiline
            numberOfLines={2}
            placeholder="Betreff eingeben..."
            placeholderTextColor={Colors.raw.zinc600}
            testID="betreff-input"
          />
        </View>

        <Pressable onPress={() => setShowKalkulation(!showKalkulation)} style={({ pressed }) => [s.card, { marginTop: 12, opacity: pressed ? 0.9 : 1 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={s.cardLabel}>KALKULATION</Text>
            <Ionicons name={showKalkulation ? "chevron-up" : "chevron-down"} size={18} color={Colors.raw.zinc400} />
          </View>
          {showKalkulation && (
            <View style={{ marginTop: 12 }}>
              <View style={s.metaRow}>
                <Text style={s.metaLabel}>Globaler Aufschlag</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <TextInput
                    style={s.smallInput}
                    value={globalMarkup}
                    onChangeText={setGlobalMarkup}
                    keyboardType="decimal-pad"
                  />
                  <Text style={s.metaLabel}>%</Text>
                </View>
              </View>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.raw.zinc500, marginTop: 4 }}>Gilt f\u00FCr alle Katalogpositionen. Kann pro Position \u00FCberschrieben werden.</Text>
            </View>
          )}
        </Pressable>

        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Positionen</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={s.countBadge}>
              <Text style={s.countText}>{totalPositions}</Text>
            </View>
          </View>
        </View>

        {rooms.map((room, ri) => {
          const roomTotal = room.positions.reduce((s, p) => s + p.basePrice * (1 + p.markup / 100) * p.qty, 0);
          const _roomNr = String(ri + 1).padStart(2, "0");

          return (
            <View key={room.id} style={s.roomCard}>
              <Pressable onPress={() => toggleRoom(room.id)} style={({ pressed }) => [s.roomHeader, { opacity: pressed ? 0.85 : 1 }]} testID={`room-${room.id}`}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                  <Ionicons name={room.icon as any} size={18} color={Colors.raw.amber500} />
                  <Text style={s.roomName}>{room.name}</Text>
                </View>
                <Text style={s.roomMeta}>{room.positions.length} Pos. \u2022 {formatEuroShort(roomTotal)}</Text>
                <Ionicons name={room.collapsed ? "chevron-down" : "chevron-up"} size={18} color={Colors.raw.zinc400} style={{ marginLeft: 8 }} />
              </Pressable>

              {!room.collapsed && (
                <View style={s.roomContent}>
                  {room.positions.map((pos) => {
                    const ep = pos.basePrice * (1 + pos.markup / 100);
                    const total = ep * pos.qty;

                    return (
                      <View key={pos.id} style={s.posRow}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
                            <Text style={s.posNr}>{pos.nr}</Text>
                            <Text style={s.posTitle} numberOfLines={1}>{pos.title}</Text>
                          </View>
                          <Text style={s.posDetail}>
                            {pos.unit === "Pauschal" ? "Pauschal" : `${pos.qty.toString().replace(".", ",")} ${pos.unit} \u00D7 ${formatEuro(ep)}/${pos.unit}`}
                          </Text>
                        </View>
                        <Text style={s.posTotal}>{formatEuro(total)}</Text>
                        <View style={s.posActions}>
                          <Pressable
                            onPress={() => {
                              setEditPosition(pos);
                              setEditPosRoomId(room.id);
                            }}
                            style={({ pressed }) => [s.posActionBtn, { opacity: pressed ? 0.6 : 1 }]}
                          >
                            <Feather name="edit-2" size={14} color={Colors.raw.zinc400} />
                          </Pressable>
                          <Pressable
                            onPress={() => deletePosition(pos.id)}
                            style={({ pressed }) => [s.posActionBtn, { opacity: pressed ? 0.6 : 1 }]}
                          >
                            <Ionicons name="trash" size={14} color={Colors.raw.zinc500} />
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                  <Pressable
                    onPress={() => {
                      setAddPosRoomId(room.id);
                      setAddPosVisible(true);
                    }}
                    style={({ pressed }) => [s.addPosBtn, { opacity: pressed ? 0.8 : 1 }]}
                    testID={`add-pos-${room.id}`}
                  >
                    <Ionicons name="add" size={16} color={Colors.raw.amber500} />
                    <Text style={s.addPosBtnText}>Position hinzuf\u00FCgen</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}

        <Pressable
          onPress={() => setAddRoomVisible(true)}
          style={({ pressed }) => [s.addRoomBtn, { opacity: pressed ? 0.85 : 1 }]}
          testID="add-room-btn"
        >
          <Ionicons name="add-circle" size={20} color={Colors.raw.amber500} />
          <Text style={s.addRoomBtnText}>Raum hinzuf\u00FCgen</Text>
        </Pressable>
      </ScrollView>

      <View style={[s.stickyFooter, { paddingBottom: bottomInset + 12 }]}>
        <View style={s.footerTop}>
          <View>
            <Text style={s.footerCount}>{totalPositions} Positionen</Text>
            <Text style={s.footerMat}>Material: ~{formatEuroShort(estimatedCost * 0.45)}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.footerTotal}>{formatEuroShort(totalNetto)} netto</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={[s.footerMargin, { color: marginColor }]}>Marge: {margin.toFixed(0)}%</Text>
              <View style={[s.marginDot, { backgroundColor: marginColor }]} />
            </View>
          </View>
        </View>
        <View style={s.footerBtns}>
          <Pressable style={({ pressed }) => [s.previewBtn, { opacity: pressed ? 0.8 : 1 }]} testID="preview-btn">
            <Ionicons name="document-text" size={16} color={Colors.raw.amber500} />
            <Text style={s.previewBtnText}>Vorschau</Text>
          </Pressable>
          <Pressable onPress={() => setSaveVisible(true)} style={({ pressed }) => [s.saveBtn, { opacity: pressed ? 0.85 : 1 }]} testID="save-btn">
            <Feather name="save" size={16} color="#000" />
            <Text style={s.saveBtnText}>Speichern</Text>
          </Pressable>
        </View>
      </View>

      {menuVisible && (
        <Modal visible={menuVisible} transparent animationType="fade" statusBarTranslucent>
          <Pressable style={s.menuOverlay} onPress={() => setMenuVisible(false)}>
            <View style={[s.menuSheet, { top: topInset + 56, right: 16 }]}>
              {[
                { icon: "document-text", label: "Vorschau" },
                { icon: "download", label: "PDF herunterladen" },
                { icon: "save", label: "Speichern", action: () => setSaveVisible(true) },
              ].map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => {
                    setMenuVisible(false);
                    item.action?.();
                  }}
                  style={({ pressed }) => [s.menuItem, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Ionicons name={item.icon as any} size={18} color={Colors.raw.zinc300} />
                  <Text style={s.menuItemText}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      )}

      <AddPositionSheet
        visible={addPosVisible}
        onClose={() => { setAddPosVisible(false); setAddPosRoomId(null); }}
        onAdd={(pos) => { if (addPosRoomId) addPosition(addPosRoomId, pos); }}
        onAddMultiple={(positions) => { if (addPosRoomId) positions.forEach((pos) => addPosition(addPosRoomId, pos)); }}
        roomNr={roomNrForAdd}
        nextPosNr={nextPosNr}
      />

      <EditPositionSheet
        visible={!!editPosition}
        onClose={() => { setEditPosition(null); setEditPosRoomId(null); }}
        position={editPosition}
        onSave={updatePosition}
        onDelete={deletePosition}
      />

      <AddRoomSheet
        visible={addRoomVisible}
        onClose={() => setAddRoomVisible(false)}
        onAdd={addRoom}
      />

      <SaveSheet
        visible={saveVisible}
        onClose={() => setSaveVisible(false)}
        onSave={handleSave}
      />
    </View>
  );
}

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
    paddingHorizontal: 8,
    paddingBottom: 10,
    backgroundColor: Colors.raw.zinc950 + "F2",
  },
  headerBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.raw.white },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc400 },
  savedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.raw.emerald500 + "18", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  savedText: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.raw.emerald500 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },

  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 18,
  },
  cardLabel: { fontFamily: "Inter_700Bold", fontSize: 11, color: Colors.raw.zinc500, letterSpacing: 1.5, marginBottom: 14 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  metaLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc400 },
  metaValue: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.white },
  divider: { height: 1, backgroundColor: Colors.raw.zinc800, marginVertical: 12 },
  changeBtn: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.amber500 },
  clientDetail: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginBottom: 4 },
  betreffInput: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.white,
    marginTop: 8,
    minHeight: 60,
    textAlignVertical: "top",
  },
  smallInput: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.raw.white,
    width: 50,
    textAlign: "center",
  },

  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 20, color: Colors.raw.white },
  countBadge: { backgroundColor: Colors.raw.amber500 + "18", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  countText: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.amber500 },

  roomCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    marginBottom: 10,
    overflow: "hidden",
  },
  roomHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  roomName: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.white },
  roomMeta: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.zinc400 },
  roomContent: { paddingHorizontal: 16, paddingBottom: 12 },

  posRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
  },
  posNr: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 12, color: Colors.raw.amber500 },
  posTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.white, flex: 1 },
  posDetail: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.raw.zinc500 },
  posTotal: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.white, marginLeft: 10, minWidth: 70, textAlign: "right" },
  posActions: { flexDirection: "row", marginLeft: 8, gap: 4 },
  posActionBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },

  addPosBtn: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.raw.zinc800 },
  addPosBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.amber500 },

  addRoomBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    borderStyle: "dashed",
    paddingVertical: 16,
    marginTop: 4,
  },
  addRoomBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.amber500 },

  stickyFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.raw.zinc900 + "F8",
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  footerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  footerCount: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc300 },
  footerMat: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginTop: 2 },
  footerTotal: { fontFamily: "Inter_800ExtraBold", fontSize: 18, color: Colors.raw.white },
  footerMargin: { fontFamily: "Inter_700Bold", fontSize: 13 },
  marginDot: { width: 8, height: 8, borderRadius: 4 },
  footerBtns: { flexDirection: "row", gap: 10 },
  previewBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: Colors.raw.zinc700, borderRadius: 12, paddingVertical: 12 },
  previewBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.amber500 },
  saveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.raw.amber500, borderRadius: 12, paddingVertical: 12 },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#000" },

  menuOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  menuSheet: {
    position: "absolute",
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 14,
    paddingVertical: 6,
    minWidth: 200,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  menuItemText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.white },
});
