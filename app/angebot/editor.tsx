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
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import Colors from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Project {
  id: string;
  code: string;
  name: string;
  address: string;
  client: string;
  anrede: string;    // "Herr" / "Frau" / ""
  nachname: string;  // Nachname des Ansprechpartners
}


interface CatalogPosition {
  id: string;
  nr: string;
  title: string;
  desc: string;
  price: number;
  unit: string;
  trade: string;
}

interface CatalogSource {
  id: string;
  label: string;
  icon: string;
  desc: string;
}

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

type PositionType = "STANDARD" | "ALTERNATIVE" | "EVENTUAL";

const UNIT_OPTIONS = ["m²", "m", "lfm", "Stk", "St", "psch", "kg", "l", "t", "cbm", "Paar", "Set"];

const POSITION_TYPE_OPTIONS: { value: PositionType; label: string; short: string; color: string }[] = [
  { value: "STANDARD", label: "Normal", short: "N", color: Colors.raw.emerald500 },
  { value: "ALTERNATIVE", label: "Alternativ", short: "A", color: Colors.raw.amber500 },
  { value: "EVENTUAL", label: "Eventual", short: "E", color: Colors.raw.zinc500 },
];

interface OfferPosition {
  id: string;
  nr: string;
  title: string;
  desc: string;
  longText: string;
  qty: number;
  unit: string;
  basePrice: number;
  markup: number;
  positionType: PositionType;
  catalogNr?: string;
  catalogPositionId?: string;
}

interface Room {
  id: string;
  icon: string;
  name: string;
  positions: OfferPosition[];
  collapsed: boolean;
}

interface LvParsedPosition {
  position_nr: string;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  trade: string | null;
  catalog_code: string | null;
  matched_catalog_title: string | null;
  confidence: number;
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("projects")
      .select("id, project_number, name, object_street, object_zip, object_city, client_id, clients(company_name, salutation, last_name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProjects(
          (data ?? []).map((p: any) => ({
            id: p.id,
            code: p.project_number ?? "",
            name: p.name ?? "",
            address: [p.object_street, `${p.object_zip ?? ""} ${p.object_city ?? ""}`.trim()].filter(Boolean).join(", "),
            client: p.clients?.company_name ?? "\u2014",
            anrede: p.clients?.salutation ?? "",
            nachname: p.clients?.last_name ?? "",
          }))
        );
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!search) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q)
    );
  }, [search, projects]);

  const handleCreateProject = () => {
    if (!newName.trim()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newProject: Project = {
      id: genId(),
      code: "",
      name: newName.trim(),
      address: newAddress.trim() || "Adresse ausstehend",
      client: newClient.trim() || "Kunde ausstehend",
      anrede: "",
      nachname: "",
    };
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
        <Text style={ps.title}>Projekt wählen</Text>
        <Text style={ps.subtitle}>Wähle ein bestehendes Projekt oder lege ein neues an.</Text>

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
        <Text style={ps.recentLabel}>{loading ? "Projekte laden..." : "Zuletzt verwendet"}</Text>
        {loading && <ActivityIndicator color={Colors.raw.amber500} style={{ marginVertical: 20 }} />}
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
  const [selectedCatalog, setSelectedCatalog] = useState<string>("");
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const [selectedJumbo, setSelectedJumbo] = useState<JumboTemplate | null>(null);

  const freiNr = `${roomNr}.${String(nextPosNr).padStart(2, "0")}`;
  const [freiTitle, setFreiTitle] = useState("");
  const [freiDesc, setFreiDesc] = useState("");
  const [freiUnit, setFreiUnit] = useState("m\u00B2");
  const [freiQty, setFreiQty] = useState("");
  const [freiPrice, setFreiPrice] = useState("");

  // Kataloge aus Supabase
  const [catalogSources, setCatalogSources] = useState<CatalogSource[]>([]);
  useEffect(() => {
    supabase
      .from("catalogs")
      .select("id, code, name")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        const sources = (data ?? []).map((c: any) => ({
          id: c.id,
          label: c.name,
          icon: "layers",
          desc: c.code,
        }));
        setCatalogSources(sources);
        if (data?.[0] && !selectedCatalog) setSelectedCatalog(data[0].id);
      });
  }, []);

  // Katalog-Positionen laden wenn Katalog wechselt
  const [catalogItems, setCatalogItems] = useState<CatalogPosition[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  useEffect(() => {
    if (!selectedCatalog) return;
    setCatalogLoading(true);
    supabase
      .from("catalog_positions_v2")
      .select("id, position_code, title, title_secondary, description, trade, unit, base_price_eur")
      .eq("catalog_id", selectedCatalog)
      .eq("is_active", true)
      .order("position_code")
      .then(({ data }) => {
        setCatalogItems(
          (data ?? []).map((p: any) => ({
            id: p.id,
            nr: p.position_code ?? "",
            title: p.title ?? "",
            desc: p.description ?? p.title_secondary ?? "",
            price: Number(p.base_price_eur) || 0,
            unit: p.unit ?? "Stk",
            trade: p.trade ?? "Sonstiges",
          }))
        );
        setCatalogLoading(false);
      });
  }, [selectedCatalog]);

  // Trade-Filter direkt aus geladenen Katalog-Positionen ableiten
  const tradeFilters = useMemo(() => {
    const trades = [...new Set(catalogItems.map((c) => c.trade))].sort();
    return ["Alle", ...trades];
  }, [catalogItems]);

  const filteredCatalog = useMemo(() => {
    let items = catalogItems;
    if (tradeFilter !== "Alle") {
      items = items.filter((c) => c.trade === tradeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((c) =>
        c.nr.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.desc.toLowerCase().includes(q) ||
        c.trade.toLowerCase().includes(q)
      );
    }
    return items;
  }, [search, tradeFilter, catalogItems]);

  const recentItems = useMemo(() => {
    return catalogItems.slice(0, 8);
  }, [catalogItems]);

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
      longText: addedItem.desc,
      qty: qtyNum,
      unit: addedItem.unit,
      basePrice: priceNum,
      markup: markupNum,
      positionType: "STANDARD",
      catalogNr: addedItem.nr,
      catalogPositionId: addedItem.id,
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
      longText: freiDesc,
      qty: qtyNum,
      unit: freiUnit,
      basePrice: priceNum,
      markup: 0,
      positionType: "STANDARD",
    });
    onClose();
  }, [freiNr, freiTitle, freiDesc, freiUnit, freiQty, freiPrice, roomNr, nextPosNr, onAdd, onClose]);

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
                      <Ionicons name={(catalogSources.find(c => c.id === selectedCatalog)?.icon || "layers") as any} size={16} color={Colors.raw.amber500} />
                      <Text style={apStyles.catalogSelectorText}>{catalogSources.find(c => c.id === selectedCatalog)?.label}</Text>
                      <Ionicons name={showCatalogPicker ? "chevron-up" : "chevron-down"} size={14} color={Colors.raw.zinc500} />
                    </Pressable>
                    {showCatalogPicker && (
                      <View style={apStyles.catalogPickerList}>
                        {catalogSources.map((cs) => (
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
                    <View style={apStyles.tradeFilterRow}>
                      {tradeFilters.map((tf) => {
                        const count = tf === "Alle" ? catalogItems.length : catalogItems.filter((c) => c.trade === tf).length;
                        if (count === 0 && tf !== "Alle") return null;
                        return (
                          <Pressable key={tf} onPress={() => setTradeFilter(tf)} style={[apStyles.filterChip, tradeFilter === tf && apStyles.filterChipActive]}>
                            <Text style={[apStyles.filterChipText, tradeFilter === tf && apStyles.filterChipTextActive]}>{tf}</Text>
                            <Text style={[apStyles.filterChipCount, tradeFilter === tf && apStyles.filterChipCountActive]}>{count}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {catalogLoading && <ActivityIndicator color={Colors.raw.amber500} style={{ marginVertical: 20 }} />}
                    <FlatList
                      data={filteredCatalog}
                      keyExtractor={(item) => item.id}
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
                      <View key={item.id} style={apStyles.catalogItem}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <Text style={apStyles.catalogNr}>{item.nr}</Text>
                            <Text style={apStyles.catalogTitle} numberOfLines={1}>{item.title}</Text>
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Text style={apStyles.catalogPrice}>{formatEuro(item.price)}/{item.unit}</Text>
                            <View style={apStyles.tradeBadge}><Text style={apStyles.tradeText}>{item.trade}</Text></View>
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
                    <Text style={apStyles.fieldLabel}>Pos.Nr (automatisch)</Text>
                    <View style={[apStyles.freiInput, { backgroundColor: Colors.raw.zinc800 + "60" }]}>
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.zinc400 }}>{freiNr}</Text>
                    </View>
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
                          <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc400 }}>Zurück</Text>
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
                              longText: p.desc,
                              qty: p.qty,
                              unit: p.unit,
                              basePrice: p.price,
                              markup: 15,
                              positionType: "STANDARD",
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
                          <Text style={apStyles.confirmBtnText}>Alle {selectedJumbo.positions.length} Positionen übernehmen</Text>
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
  tradeFilterRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingBottom: 12 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.raw.zinc800, height: 36 },
  filterChipActive: { backgroundColor: Colors.raw.amber500 },
  filterChipText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.zinc400 },
  filterChipTextActive: { color: "#000" },
  filterChipCount: { fontFamily: "Inter_700Bold", fontSize: 11, color: Colors.raw.zinc300, backgroundColor: Colors.raw.zinc600, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, overflow: "hidden" as any },
  filterChipCountActive: { color: "#000", backgroundColor: "rgba(0,0,0,0.2)" },
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
  focusField,
}: {
  visible: boolean;
  onClose: () => void;
  position: OfferPosition | null;
  onSave: (pos: OfferPosition) => void;
  onDelete: (id: string) => void;
  focusField?: "title" | "qty" | "unit" | "price" | "longText" | "markup";
}) {
  const insets = useSafeAreaInsets();
  const [titleVal, setTitleVal] = useState("");
  const [qty, setQty] = useState("");
  const [unitVal, setUnitVal] = useState("");
  const [price, setPrice] = useState("");
  const [markupVal, setMarkupVal] = useState("");
  const [desc, setDesc] = useState("");
  const [posType, setPosType] = useState<PositionType>("STANDARD");
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  const titleRef = React.useRef<TextInput>(null);
  const qtyRef = React.useRef<TextInput>(null);
  const unitRef = React.useRef<TextInput>(null);
  const priceRef = React.useRef<TextInput>(null);
  const longTextRef = React.useRef<TextInput>(null);
  const markupRef = React.useRef<TextInput>(null);

  useEffect(() => {
    if (position) {
      setTitleVal(position.title);
      setQty(position.qty > 0 ? position.qty.toString().replace(".", ",") : "");
      setUnitVal(position.unit);
      setPrice(position.basePrice.toFixed(2).replace(".", ","));
      setMarkupVal(position.markup.toString());
      setDesc(position.longText || position.desc);
      setPosType(position.positionType || "STANDARD");
      setShowUnitPicker(false);
    }
  }, [position]);

  useEffect(() => {
    if (visible && focusField) {
      const timer = setTimeout(() => {
        const refMap: Record<string, React.RefObject<TextInput | null>> = {
          title: titleRef, qty: qtyRef, unit: unitRef, price: priceRef, longText: longTextRef, markup: markupRef,
        };
        refMap[focusField]?.current?.focus();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [visible, focusField]);

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
      title: titleVal.trim() || position.title,
      unit: unitVal.trim() || position.unit,
      qty: qtyNum,
      basePrice,
      markup: markupNum,
      positionType: posType,
      desc,
      longText: desc,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={apStyles.overlay}>
          <View style={[apStyles.sheet, { paddingBottom: Math.max(insets.bottom, 20), maxHeight: "85%" }]}>
            <View style={apStyles.handle} />
            <View style={apStyles.sheetHeader}>
              <Text style={apStyles.sheetTitle}>{position.nr} bearbeiten</Text>
              <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
                <Ionicons name="close" size={24} color={Colors.raw.zinc400} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={apStyles.fieldLabel}>Kurztext</Text>
              <TextInput
                ref={titleRef}
                style={apStyles.freiInput}
                value={titleVal}
                onChangeText={setTitleVal}
                placeholder="Positionsbezeichnung"
                placeholderTextColor={Colors.raw.zinc600}
              />
              <Text style={apStyles.fieldLabel}>Langtext</Text>
              <TextInput
                ref={longTextRef}
                style={[apStyles.freiInput, { height: 80, textAlignVertical: "top" }]}
                value={desc}
                onChangeText={setDesc}
                multiline
                placeholder="Beschreibung der Leistung..."
                placeholderTextColor={Colors.raw.zinc600}
              />
              {position.catalogNr && position.catalogPositionId && (
                <Pressable onPress={() => {
                  supabase.from("catalog_positions_v2").select("description, title_secondary").eq("id", position.catalogPositionId!).single().then(({ data }) => {
                    if (data) setDesc(data.description ?? data.title_secondary ?? "");
                  });
                }} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, marginTop: 6, marginBottom: 8 })}>
                  <Text style={epStyles.restoreText}>Originaltext wiederherstellen</Text>
                </Pressable>
              )}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={apStyles.fieldLabel}>Menge</Text>
                  <TextInput
                    ref={qtyRef}
                    style={apStyles.freiInput}
                    value={qty}
                    onChangeText={setQty}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.raw.zinc600}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={apStyles.fieldLabel}>Einheit</Text>
                  <Pressable
                    onPress={() => setShowUnitPicker(!showUnitPicker)}
                    style={[apStyles.freiInput, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
                  >
                    <Text style={{ color: unitVal ? Colors.raw.zinc200 : Colors.raw.zinc600, fontSize: 15 }}>
                      {unitVal || "Auswählen..."}
                    </Text>
                    <Feather name="chevron-down" size={14} color={Colors.raw.zinc500} />
                  </Pressable>
                  {showUnitPicker && (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      {UNIT_OPTIONS.map((u) => (
                        <Pressable
                          key={u}
                          onPress={() => { setUnitVal(u); setShowUnitPicker(false); }}
                          style={({ pressed }) => ({
                            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
                            backgroundColor: unitVal === u ? Colors.raw.amber500 + "30" : Colors.raw.zinc800,
                            borderWidth: 1,
                            borderColor: unitVal === u ? Colors.raw.amber500 : Colors.raw.zinc700,
                            opacity: pressed ? 0.7 : 1,
                          })}
                        >
                          <Text style={{ color: unitVal === u ? Colors.raw.amber500 : Colors.raw.zinc300, fontSize: 13, fontFamily: "Inter_500Medium" }}>{u}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              <Text style={apStyles.fieldLabel}>Positionstyp</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                {POSITION_TYPE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setPosType(opt.value)}
                    style={({ pressed }) => ({
                      flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center",
                      backgroundColor: posType === opt.value ? opt.color + "20" : Colors.raw.zinc800,
                      borderWidth: 1.5,
                      borderColor: posType === opt.value ? opt.color : Colors.raw.zinc700,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{
                      color: posType === opt.value ? opt.color : Colors.raw.zinc400,
                      fontSize: 13, fontFamily: "Inter_600SemiBold",
                    }}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={apStyles.fieldLabel}>Einzelpreis</Text>
                  <View style={apStyles.fieldRow}>
                    <Text style={apStyles.euroPrefix}>{"\u20AC"}</Text>
                    <TextInput
                      ref={priceRef}
                      style={[apStyles.fieldInput, { flex: 1 }]}
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={apStyles.fieldLabel}>Aufschlag</Text>
                  <View style={apStyles.fieldRow}>
                    <TextInput
                      ref={markupRef}
                      style={[apStyles.fieldInput, { width: 60 }]}
                      value={markupVal}
                      onChangeText={setMarkupVal}
                      keyboardType="decimal-pad"
                    />
                    <Text style={apStyles.fieldUnit}>%</Text>
                  </View>
                </View>
              </View>
              {position.catalogNr && (
                <Text style={epStyles.catalogRef}>Katalog-Pos: {position.catalogNr}</Text>
              )}
              <View style={epStyles.summaryBlock}>
                <View style={epStyles.summaryRow}>
                  <Text style={epStyles.summaryLabel}>Endpreis</Text>
                  <Text style={epStyles.summaryValue}>{formatEuro(endPrice)} /{unitVal || position.unit}</Text>
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
          <Text style={apStyles.sheetTitle}>Neuer Titel</Text>
          <Text style={[apStyles.sectionLabel, { marginTop: 16, marginBottom: 12 }]}>Schnellauswahl Räume</Text>
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
          <Text style={[apStyles.sectionLabel, { marginTop: 20, marginBottom: 12 }]}>Schnellauswahl Gewerke</Text>
          <View style={arStyles.grid}>
            {[
              { icon: "water", name: "Sanitärarbeiten" },
              { icon: "color-palette", name: "Malerarbeiten" },
              { icon: "flash", name: "Elektroarbeiten" },
              { icon: "grid", name: "Fliesenarbeiten" },
              { icon: "layers", name: "Trockenbauarbeiten" },
              { icon: "grid", name: "Bodenbelagsarbeiten" },
              { icon: "hammer", name: "Abbrucharbeiten" },
              { icon: "construct", name: "Tischlerarbeiten" },
            ].map((t) => (
              <Pressable
                key={t.name}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onAdd(t.name, t.icon);
                  onClose();
                }}
                style={({ pressed }) => [arStyles.chip, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Ionicons name={t.icon as any} size={16} color={Colors.raw.amber500} />
                <Text style={arStyles.chipText}>{t.name}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[apStyles.fieldLabel, { marginTop: 20 }]}>Eigener Titel</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TextInput style={[apStyles.freiInput, { flex: 1 }]} value={custom} onChangeText={setCustom} placeholder="z.B. Vorarbeiten, Demontage..." placeholderTextColor={Colors.raw.zinc600} />
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
              <Text style={svStyles.optionDesc}>Erstellt einen Freigabe-Eintrag für die Geschäftsführung</Text>
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
  const params = useLocalSearchParams<{ offerId?: string; projectId?: string; forceNew?: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const { user } = useAuth();

  const isEditing = !!params.offerId;

  const [project, setProject] = useState<Project | null>(null);
  const [offerId, setOfferId] = useState<string | null>(params.offerId ?? null);
  const [offerNumber, setOfferNumber] = useState("");
  const [offerVersion, setOfferVersion] = useState(1);
  const [offerLoading, setOfferLoading] = useState(false);
  const [pdfSaving, setPdfSaving] = useState(false);
  const [pdfSaved, setPdfSaved] = useState(false);
  const [pdfError, setPdfError] = useState("");

  // Projekt per projectId URL-Param aus Supabase laden
  useEffect(() => {
    if (params.projectId) {
      supabase
        .from("projects")
        .select("id, project_number, name, object_street, object_zip, object_city, clients(company_name, salutation, last_name)")
        .eq("id", params.projectId)
        .single()
        .then(({ data }) => {
          if (data) {
            const p = data as any;
            setProject({
              id: p.id,
              code: p.project_number ?? "",
              name: p.name ?? "",
              address: [p.object_street, `${p.object_zip ?? ""} ${p.object_city ?? ""}`.trim()].filter(Boolean).join(", "),
              client: p.clients?.company_name ?? "\u2014",
              anrede: p.clients?.salutation ?? "",
              nachname: p.clients?.last_name ?? "",
            });
          }
        });
    }
  }, [params.projectId]);

  // ── Wenn offerId übergeben: Angebot laden und Projekt daraus extrahieren ──
  useEffect(() => {
    if (!params.offerId) return;
    if (project) return; // Bereits geladen

    (async () => {
      try {
        const { data: offer, error: offerError } = await supabase
          .from("offers")
          .select("id, offer_number, version, status, is_lump_sum, lump_sum_amount, hide_position_prices, project_id")
          .eq("id", params.offerId)
          .single();

        if (offerError || !offer) {
          console.error("Fehler beim Laden des Angebots:", offerError);
          return;
        }

        // Angebot-Daten setzen
        setOfferId(offer.id);
        setOfferNumber(offer.offer_number);
        setOfferVersion(offer.version ?? 1);
        setIsLumpSum(offer.is_lump_sum ?? false);
        setLumpSumAmount(offer.lump_sum_amount ? String(offer.lump_sum_amount) : "");
        setHidePositionPrices(offer.hide_position_prices ?? false);

        // Projekt separat laden
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("id, project_number, name, object_street, object_zip, object_city, clients(company_name, salutation, last_name)")
          .eq("id", offer.project_id)
          .single();

        if (projectError || !projectData) {
          console.error("Fehler beim Laden des Projekts:", projectError);
          return;
        }

        setProject({
          id: projectData.id,
          code: projectData.project_number ?? "",
          name: projectData.name ?? "",
          address: [projectData.object_street, `${projectData.object_zip ?? ""} ${projectData.object_city ?? ""}`.trim()].filter(Boolean).join(", "),
          client: (projectData.clients as any)?.company_name ?? "—",
          anrede: (projectData.clients as any)?.salutation ?? "",
          nachname: (projectData.clients as any)?.last_name ?? "",
        });
      } catch (err) {
        console.error("Fehler im offerId useEffect:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.offerId]);

  // ── Auto-Persist: Angebot laden oder erstellen wenn Projekt gewählt ──
  useEffect(() => {
    if (!project?.id) return;
    setOfferLoading(true);

    const loadOrCreateOffer = async () => {
      let oid: string;

      // Wenn offerId bereits gesetzt (via params.offerId), verwende diese
      if (offerId) {
        oid = offerId;
      } else if (params.forceNew === "true") {
        // forceNew: Direkt neues Angebot erstellen, skip Suche nach existierenden
        const { data: newOffer } = await supabase
          .from("offers")
          .insert({ project_id: project.id, version: 1, status: "DRAFT" })
          .select("id, offer_number, version")
          .single();

        if (!newOffer) { setOfferLoading(false); return; }
        oid = newOffer.id;
        setOfferId(newOffer.id);
        setOfferNumber(newOffer.offer_number);
        setOfferVersion(newOffer.version ?? 1);
      } else {
        // 1. Neuestes bearbeitbares Angebot suchen (DRAFT oder SENT)
        const { data: existing } = await supabase
          .from("offers")
          .select("id, offer_number, version, status, is_lump_sum, lump_sum_amount, hide_position_prices")
          .eq("project_id", project.id)
          .in("status", ["DRAFT", "SENT"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing) {
          oid = existing.id;
          setOfferId(existing.id);
          setOfferNumber(existing.offer_number);
          setOfferVersion(existing.version ?? 1);
          setIsLumpSum(existing.is_lump_sum ?? false);
          setLumpSumAmount(existing.lump_sum_amount ? String(existing.lump_sum_amount) : "");
          setHidePositionPrices(existing.hide_position_prices ?? false);
        } else {
          // 2. Neues Angebot erstellen (offer_number wird vom DB-Trigger generiert: A-YYYY-NNN)
          const { data: newOffer } = await supabase
            .from("offers")
            .insert({ project_id: project.id, version: 1, status: "DRAFT" })
            .select("id, offer_number, version")
            .single();

          if (!newOffer) { setOfferLoading(false); return; }
          oid = newOffer.id;
          setOfferId(newOffer.id);
          setOfferNumber(newOffer.offer_number);
          setOfferVersion(newOffer.version ?? 1);
        }
      }

      // 3. Sections + Positionen laden
      const { data: sections } = await supabase
        .from("offer_sections")
        .select("id, section_number, title, trade")
        .eq("offer_id", oid)
        .order("section_number");

      const { data: positions } = await supabase
        .from("offer_positions")
        .select("id, section_id, position_number, title, description, long_text, unit, unit_price, quantity, total_price, catalog_code, catalog_position_v2_id, surcharge_profit_percent, sort_order, position_type")
        .eq("offer_id", oid)
        .is("deleted_at", null)
        .order("sort_order");

      const loadedRooms: Room[] = (sections ?? []).map((sec: any) => {
        const secPositions = (positions ?? [])
          .filter((p: any) => p.section_id === sec.id)
          .map((p: any, idx: number) => ({
            id: p.id,
            nr: `${String(sec.section_number).padStart(2, "0")}.${String(idx + 1).padStart(2, "0")}`,
            title: p.title ?? "",
            desc: p.description ?? "",
            longText: p.long_text ?? p.description ?? "",
            qty: Number(p.quantity) || 0,
            unit: p.unit ?? "Stk",
            basePrice: Number(p.unit_price) || 0,
            markup: Number(p.surcharge_profit_percent) || 0,
            positionType: (p.position_type as PositionType) || "STANDARD",
            catalogNr: p.catalog_code ?? undefined,
            catalogPositionId: p.catalog_position_v2_id ?? undefined,
          }));
        return {
          id: sec.id,
          icon: sec.trade === "Sanitär" ? "water" : sec.trade === "Maler" ? "color-palette" : sec.trade === "Elektro" ? "flash" : sec.trade === "Fliesen" ? "grid" : "cube",
          name: sec.title,
          positions: secPositions,
          collapsed: false,
        };
      });

      setRooms(loadedRooms);
      setOfferLoading(false);
    };

    loadOrCreateOffer();
  }, [project?.id]);

  const [rooms, setRooms] = useState<Room[]>([]);

  const [addPosVisible, setAddPosVisible] = useState(false);
  const [addPosRoomId, setAddPosRoomId] = useState<string | null>(null);
  const [editPosition, setEditPosition] = useState<OfferPosition | null>(null);
  const [editFocus, setEditFocus] = useState<"title" | "qty" | "unit" | "price" | "longText" | "markup" | undefined>(undefined);
  const [_editPosRoomId, setEditPosRoomId] = useState<string | null>(null);
  const [addRoomVisible, setAddRoomVisible] = useState(false);
  const [saveVisible, setSaveVisible] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [globalMarkup, setGlobalMarkup] = useState("15");
  const [showKalkulation, setShowKalkulation] = useState(false);

  const [betreffText, setBetreffText] = useState("");
  const [showTextbausteine, setShowTextbausteine] = useState(false);

  // Pauschale & Preise ausblenden
  const [isLumpSum, setIsLumpSum] = useState(false);
  const [lumpSumAmount, setLumpSumAmount] = useState("");
  const [hidePositionPrices, setHidePositionPrices] = useState(false);

  // LV Import
  const [lvImportVisible, setLvImportVisible] = useState(false);
  const [lvImportLoading, setLvImportLoading] = useState(false);
  const [lvImportResults, setLvImportResults] = useState<LvParsedPosition[] | null>(null);
  const [lvImportSelected, setLvImportSelected] = useState<Set<number>>(new Set());
  const [lvImportError, setLvImportError] = useState("");
  const [lvImportSummary, setLvImportSummary] = useState<{ total: number; matched: number; needs_review: number } | null>(null);

  // PDF Export Modus
  type PdfExportMode = "full" | "lump_sum" | "title_sums" | "total_only";
  const [pdfExportMode, setPdfExportMode] = useState<PdfExportMode>("full");
  const [footerExpanded, setFooterExpanded] = useState(false);

  // Variablen für Textbausteine auflösen
  const resolveVars = useCallback((tpl: string) => {
    const vars: Record<string, string> = {
      "{{Kunde}}": project?.client || "—",
      "{{Adresse}}": project?.address || "—",
      "{{Projekt}}": project?.name || "—",
      "{{Angebotsnr}}": offerNumber || "—",
      "{{Datum}}": new Date().toLocaleDateString("de-DE"),
      "{{Anrede}}": project?.anrede || "",
      "{{Nachname}}": project?.nachname || "",
    };
    let result = tpl;
    for (const [key, val] of Object.entries(vars)) {
      result = result.replaceAll(key, val);
    }
    return result;
  }, [project, offerNumber]);

  // Anrede-Zeile für PDF: "Sehr geehrter Herr Domschikowski," oder Fallback
  const anredeZeile = useMemo(() => {
    if (project?.anrede && project?.nachname) {
      const prefix = project.anrede === "Frau" ? "Sehr geehrte Frau" : "Sehr geehrter Herr";
      return `${prefix} ${project.nachname},`;
    }
    return "Sehr geehrte Damen und Herren,";
  }, [project]);

  const TEXTBAUSTEINE = useMemo(() => [
    {
      label: "Standard-Betreff",
      text: "Angebot für Instandsetzungsarbeiten – {{Adresse}}",
    },
    {
      label: "Sanierung",
      text: "Angebot Sanierung/Modernisierung – {{Adresse}}, {{Kunde}}",
    },
    {
      label: "Maler & Boden",
      text: "Angebot Maler- und Bodenbelagsarbeiten – {{Adresse}}",
    },
    {
      label: "Sanitär",
      text: "Angebot Sanitärarbeiten – {{Adresse}}",
    },
    {
      label: "Komplettsanierung",
      text: "Angebot Komplettsanierung – {{Adresse}}, Auftraggeber: {{Kunde}}",
    },
    {
      label: "Nachtrag",
      text: "Nachtragsangebot zu {{Angebotsnr}} – {{Adresse}}",
    },
  ], []);

  // Saved-Indikator kurz zeigen
  const flashSaved = useCallback(() => {
    setSavedIndicator(true);
    setTimeout(() => setSavedIndicator(false), 1500);
  }, []);

  const totalPositions = useMemo(() => rooms.reduce((s, r) => s + r.positions.length, 0), [rooms]);

  const calculatedNetto = useMemo(() => {
    return rooms.reduce((s, r) => {
      return s + r.positions.reduce((ps, p) => {
        if (p.positionType !== "STANDARD") return ps;
        const ep = p.basePrice * (1 + p.markup / 100);
        return ps + ep * p.qty;
      }, 0);
    }, 0);
  }, [rooms]);

  const totalNetto = isLumpSum && lumpSumAmount ? parseFloat(lumpSumAmount.replace(",", ".")) || 0 : calculatedNetto;

  const estimatedCost = totalNetto * 0.66;
  const margin = totalNetto > 0 ? ((totalNetto - estimatedCost) / totalNetto) * 100 : 0;
  const marginColor = margin >= 25 ? Colors.raw.emerald500 : margin >= 15 ? Colors.raw.amber500 : Colors.raw.rose500;

  const toggleRoom = useCallback((roomId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRooms((prev) => prev.map((r) => r.id === roomId ? { ...r, collapsed: !r.collapsed } : r));
  }, []);

  // ── Auto-Persist: Position hinzufügen (optimistisch) ──
  const addPosition = useCallback((roomId: string, pos: OfferPosition) => {
    // Sofort im UI anzeigen
    setRooms((prev) => prev.map((r) => {
      if (r.id !== roomId) return r;
      return { ...r, positions: [...r.positions, pos], collapsed: false };
    }));

    // Im Hintergrund in DB speichern
    if (!offerId) return;
    const ep = pos.basePrice * (1 + pos.markup / 100);

    (async () => {
      // Nächste freie position_number aus DB holen (UNIQUE constraint: offer_id + position_number)
      const { data: maxPos } = await supabase
        .from("offer_positions")
        .select("position_number")
        .eq("offer_id", offerId)
        .order("position_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      const posNumber = (maxPos?.position_number ?? 0) + 1;

      const { data: inserted, error } = await supabase
        .from("offer_positions")
        .insert({
          offer_id: offerId,
          section_id: roomId,
          position_number: posNumber,
          title: pos.title,
          description: pos.desc,
          long_text: pos.longText || pos.desc,
          unit: pos.unit,
          unit_price: pos.basePrice,
          quantity: pos.qty,
          catalog_code: pos.catalogNr ?? null,
          catalog_position_v2_id: pos.catalogPositionId ?? null,
          surcharge_profit_percent: pos.markup,
          position_type: pos.positionType || "STANDARD",
          sort_order: posNumber,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Position speichern fehlgeschlagen:", error.message, error.details);
      } else if (inserted) {
        // DB-ID in State übernehmen
        setRooms((prev) => prev.map((r) => ({
          ...r,
          positions: r.positions.map((p) => p.id === pos.id ? { ...p, id: inserted.id } : p),
        })));
      }
      flashSaved();
    })();
  }, [offerId, flashSaved]);

  // ── Auto-Persist: Position aktualisieren (optimistisch) ──
  const updatePosition = useCallback((pos: OfferPosition) => {
    setRooms((prev) => prev.map((r) => ({
      ...r,
      positions: r.positions.map((p) => p.id === pos.id ? pos : p),
    })));

    supabase
      .from("offer_positions")
      .update({
        title: pos.title,
        description: pos.desc,
        long_text: pos.longText || pos.desc,
        unit: pos.unit,
        unit_price: pos.basePrice,
        quantity: pos.qty,
        surcharge_profit_percent: pos.markup,
        position_type: pos.positionType || "STANDARD",
        updated_at: new Date().toISOString(),
      })
      .eq("id", pos.id)
      .then(({ error }) => {
        if (error) console.error("Position update fehlgeschlagen:", error.message);
        flashSaved();
      });
  }, [flashSaved]);

  // ── Auto-Persist: Position löschen (optimistisch) ──
  const deletePosition = useCallback((posId: string) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setRooms((prev) => prev.map((r) => ({
      ...r,
      positions: r.positions.filter((p) => p.id !== posId),
    })));

    supabase
      .from("offer_positions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", posId)
      .then(({ error }) => {
        if (error) console.error("Position delete fehlgeschlagen:", error.message);
        flashSaved();
      });
  }, [flashSaved]);

  // ── Auto-Persist: Titel/Section hinzufügen (optimistisch) ──
  const addRoom = useCallback((name: string, icon: string) => {
    const tempId = genId();
    const newRoom: Room = { id: tempId, icon, name, positions: [], collapsed: false };

    // Sofort im UI anzeigen
    setRooms((prev) => {
      const sectionNumber = prev.length + 1;

      // Im Hintergrund in DB speichern
      if (offerId) {
        (async () => {
          const { data: inserted, error } = await supabase
            .from("offer_sections")
            .insert({
              offer_id: offerId,
              section_number: sectionNumber,
              title: name,
              trade: null,
            })
            .select("id")
            .single();

          if (error) {
            console.error("Section speichern fehlgeschlagen:", error.message);
          } else if (inserted) {
            // DB-ID in State übernehmen (wichtig für Position-Zuordnung)
            setRooms((p) => p.map((r) => r.id === tempId ? { ...r, id: inserted.id } : r));
          }
          flashSaved();
        })();
      }

      return [...prev, newRoom];
    });
  }, [offerId, flashSaved]);

  // ── LV Import: Datei auswählen → parse-lv Edge Function → Ergebnisse anzeigen ──
  const handleLvImport = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/xml",
          "text/xml",
          "text/csv",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];

      setLvImportVisible(true);
      setLvImportLoading(true);
      setLvImportError("");
      setLvImportResults(null);
      setLvImportSummary(null);

      // Datei in Supabase Storage hochladen
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const storagePath = `projects/${project?.id ?? "unknown"}/dokumente/lv_import_${Date.now()}.${ext}`;

      let fileBody: ArrayBuffer;
      if (Platform.OS === "web") {
        const resp = await fetch(file.uri);
        fileBody = await resp.arrayBuffer();
      } else {
        const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: "base64" as any });
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        fileBody = bytes.buffer;
      }

      const { error: uploadErr } = await supabase.storage
        .from("project-files")
        .upload(storagePath, fileBody, {
          contentType: file.mimeType ?? "application/octet-stream",
          upsert: true,
        });

      if (uploadErr) {
        setLvImportError("Upload fehlgeschlagen: " + uploadErr.message);
        setLvImportLoading(false);
        return;
      }

      // parse-lv Edge Function aufrufen
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const parseResp = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/parse-lv`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            storage_path: storagePath,
            confidence_threshold: 0.8,
          }),
        }
      );

      const parseResult = await parseResp.json();

      if (!parseResult.success) {
        setLvImportError(parseResult.error ?? "Parsing fehlgeschlagen");
        setLvImportLoading(false);
        return;
      }

      setLvImportResults(parseResult.positions ?? []);
      setLvImportSummary(parseResult.summary ?? null);
      // Alle Positionen initial auswählen
      setLvImportSelected(new Set((parseResult.positions ?? []).map((_: LvParsedPosition, i: number) => i)));
      setLvImportLoading(false);
    } catch (e) {
      setLvImportError("Fehler: " + (e as Error).message);
      setLvImportLoading(false);
    }
  }, [project?.id]);

  // LV Import: Ausgewählte Positionen übernehmen
  const handleLvImportConfirm = useCallback(() => {
    if (!lvImportResults || !offerId) return;

    // Positionen nach Gewerk gruppieren
    const byTrade = new Map<string, LvParsedPosition[]>();
    lvImportResults.forEach((pos, idx) => {
      if (!lvImportSelected.has(idx)) return;
      const trade = pos.trade ?? "Allgemein";
      if (!byTrade.has(trade)) byTrade.set(trade, []);
      byTrade.get(trade)!.push(pos);
    });

    // Pro Gewerk eine Sektion erstellen + Positionen hinzufügen
    byTrade.forEach((positions, trade) => {
      const tradeIcon = trade === "Sanitär" ? "water" : trade === "Maler" ? "color-palette" : trade === "Elektro" ? "flash" : trade === "Fliesen" ? "grid" : trade === "Boden" ? "layers" : "cube";
      const tempRoomId = genId();
      const newRoom: Room = {
        id: tempRoomId,
        icon: tradeIcon,
        name: `${trade} (LV-Import)`,
        positions: positions.map((p, idx) => ({
          id: genId(),
          nr: `${String(idx + 1).padStart(2, "0")}`,
          title: p.title,
          desc: p.description || "",
          longText: p.description || "",
          qty: p.quantity,
          unit: p.unit,
          basePrice: 0,
          markup: 0,
          positionType: "STANDARD" as PositionType,
          catalogNr: p.catalog_code ?? undefined,
        })),
        collapsed: false,
      };

      setRooms((prev) => {
        const sectionNumber = prev.length + 1;
        // DB persist
        (async () => {
          const { data: sec } = await supabase
            .from("offer_sections")
            .insert({ offer_id: offerId, section_number: sectionNumber, title: newRoom.name, trade })
            .select("id")
            .single();

          if (!sec) return;
          setRooms((p) => p.map((r) => r.id === tempRoomId ? { ...r, id: sec.id } : r));

          // Positionen speichern
          for (let i = 0; i < positions.length; i++) {
            const p = positions[i];
            const { data: inserted } = await supabase
              .from("offer_positions")
              .insert({
                offer_id: offerId,
                section_id: sec.id,
                position_number: i + 1,
                title: p.title,
                description: p.description || null,
                long_text: p.description || null,
                unit: p.unit,
                unit_price: 0,
                quantity: p.quantity,
                catalog_code: p.catalog_code ?? null,
                source: "lv_import",
                sort_order: i + 1,
              })
              .select("id")
              .single();

            if (inserted) {
              setRooms((prev2) => prev2.map((r) => ({
                ...r,
                positions: r.positions.map((pos) =>
                  pos.id === newRoom.positions[i]?.id ? { ...pos, id: inserted.id } : pos
                ),
              })));
            }
          }
          flashSaved();
        })();

        return [...prev, newRoom];
      });
    });

    setLvImportVisible(false);
    setLvImportResults(null);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [lvImportResults, lvImportSelected, offerId, flashSaved]);

  // ── Titel verschieben (optimistisch + DB persist) ──
  const moveRoom = useCallback((roomId: string, direction: "up" | "down") => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRooms((prev) => {
      const idx = prev.findIndex((r) => r.id === roomId);
      if (idx < 0) return prev;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next;
    });

    // DB section_numbers nach Reorder aktualisieren
    if (offerId) {
      // UNIQUE constraint auf (offer_id, section_number) erfordert 2-Phasen-Update:
      // Phase 1: alle auf temporäre hohe Nummern, Phase 2: finale Nummern
      setTimeout(async () => {
        const { data: sections } = await supabase
          .from("offer_sections")
          .select("id, section_number")
          .eq("offer_id", offerId)
          .order("section_number");

        if (!sections || sections.length < 2) return;
        const idx = sections.findIndex((s: any) => s.id === roomId);
        if (idx < 0) return;
        const targetIdx = direction === "up" ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= sections.length) return;

        // Neue Reihenfolge berechnen
        const reordered = [...sections];
        [reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]];

        // Phase 1: Temporäre Nummern (1000+)
        for (let i = 0; i < reordered.length; i++) {
          await supabase
            .from("offer_sections")
            .update({ section_number: 1000 + i })
            .eq("id", reordered[i].id);
        }
        // Phase 2: Finale Nummern
        for (let i = 0; i < reordered.length; i++) {
          await supabase
            .from("offer_sections")
            .update({ section_number: i + 1, updated_at: new Date().toISOString() })
            .eq("id", reordered[i].id);
        }
        flashSaved();
      }, 50);
    }
  }, [offerId, flashSaved]);

  const handleSave = useCallback(async (mode: "draft" | "approval") => {
    if (!offerId) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Totals aktualisieren
    const totalNet = rooms.reduce((s, r) =>
      s + r.positions.reduce((ps, p) => p.positionType !== "STANDARD" ? ps : ps + p.basePrice * (1 + p.markup / 100) * p.qty, 0), 0);
    const vatRate = 19;
    const totalVat = totalNet * (vatRate / 100);
    const totalGross = totalNet + totalVat;

    const finalNet = isLumpSum && lumpSumAmount ? parseFloat(lumpSumAmount.replace(",", ".")) || totalNet : totalNet;
    const finalVat = finalNet * (vatRate / 100);
    const finalGross = finalNet + finalVat;

    await supabase
      .from("offers")
      .update({
        total_net: finalNet,
        total_vat: finalVat,
        total_gross: finalGross,
        status: mode === "approval" ? "SENT" : "DRAFT",
        is_lump_sum: isLumpSum,
        lump_sum_amount: isLumpSum && lumpSumAmount ? parseFloat(lumpSumAmount.replace(",", ".")) : null,
        hide_position_prices: hidePositionPrices,
        updated_at: new Date().toISOString(),
      })
      .eq("id", offerId);

    setSavedIndicator(true);
    setTimeout(() => {
      setSavedIndicator(false);
      router.back();
    }, 1500);
  }, [offerId, rooms]);

  // ── Angebot löschen (Soft-Delete) ──
  const handleDeleteOffer = useCallback(() => {
    if (!offerId) return;

    const doDelete = async () => {
      try {
        // Soft-delete: deleted_at setzen
        const { error } = await supabase
          .from("offers")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", offerId);
        if (error) throw error;

        // Auch alle offer_positions soft-deleten
        await supabase
          .from("offer_positions")
          .update({ deleted_at: new Date().toISOString() })
          .eq("offer_id", offerId)
          .is("deleted_at", null);

        // Zurück navigieren
        router.back();
      } catch (err: any) {
        if (Platform.OS === "web") {
          window.alert(err.message || "Angebot konnte nicht gelöscht werden");
        }
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Angebot wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) {
        doDelete();
      }
    } else {
      Alert.alert(
        "Angebot löschen",
        "Angebot wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
        [
          { text: "Abbrechen", style: "cancel" },
          { text: "Löschen", style: "destructive", onPress: doDelete },
        ]
      );
    }
  }, [offerId]);

  // ── Vorschau: HTML generieren und im neuen Tab öffnen ──
  const handlePreview = useCallback(async (mode: "preview" | "save" = "preview") => {
    if (mode === "save") {
      setPdfSaving(true);
      setPdfError("");
    }
    try {
    // Firmendaten laden
    const { data: settings } = await supabase
      .from("company_settings")
      .select("key, value");
    const cfg: Record<string, string> = {};
    (settings ?? []).forEach((s: any) => { cfg[s.key] = s.value ?? ""; });

    const today = new Date().toLocaleDateString("de-DE");
    const validUntil = new Date(Date.now() + 30 * 86400000).toLocaleDateString("de-DE");
    const fmtEuro = (n: number) => n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    // Positionen-HTML generieren (abhängig von pdfExportMode)
    // full:       Pos | Menge | Einheit | Leistung | EP | GP + Titelsummen
    // lump_sum:   Pos | Leistung | GP (kein EP, keine Menge) + Titelsummen
    // title_sums: Pos | Leistung (keine Preise, keine Menge) + Titelsummen
    // total_only: Pos | Menge | Einheit | Leistung (keine Preise, keine Titelsummen) + nur Gesamtsumme
    let posHtml = "";

    const showMenge = pdfExportMode === "full";
    const showEP = pdfExportMode === "full";
    const showGP = pdfExportMode === "full" || pdfExportMode === "lump_sum";
    const showTitelSumme = pdfExportMode !== "total_only";

    // Anzahl sichtbarer Spalten für colspan
    const colCount = 2 + (showMenge ? 2 : 0) + (showEP ? 1 : 0) + (showGP ? 1 : 0);

    rooms.forEach((room, ri) => {
      const rNr = String(ri + 1).padStart(2, "0");
      const roomTotal = room.positions.reduce((s, p) => s + p.basePrice * (1 + p.markup / 100) * p.qty, 0);
      posHtml += `<tr class="section"><td colspan="${colCount}"><strong>${rNr} ${room.name}</strong></td></tr>`;

      room.positions.forEach((pos, pi) => {
        const ep = pos.basePrice * (1 + pos.markup / 100);
        const total = ep * pos.qty;
        posHtml += `<tr>
          <td class="nr">${rNr}.${String(pi + 1).padStart(2, "0")}</td>
          <td class="desc"><strong>${pos.title}</strong><br><span class="sub">${pos.longText || pos.desc}</span></td>
          ${showMenge ? `<td class="r">${pos.qty.toString().replace(".", ",")}</td><td>${pos.unit}</td>` : ""}
          ${showEP ? `<td class="r">${fmtEuro(ep)}</td>` : ""}
          ${showGP ? `<td class="r">${fmtEuro(total)}</td>` : ""}
        </tr>`;
      });

      if (showTitelSumme) {
        const sumColSpan = colCount - 1;
        posHtml += `<tr class="section-sum"><td colspan="${sumColSpan}" class="r"><em>Summe ${room.name}</em></td><td class="r sec-total">${fmtEuro(roomTotal)} \u20AC</td></tr>`;
      }
    });

    const mwstVal = totalNetto * 0.19;
    const bruttoVal = totalNetto + mwstVal;

    const logoUrl = "https://yetwntwayhmzmhhgdkli.supabase.co/storage/v1/object/public/assets/branding/logo.png";

    const html = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><title>Angebot ${offerNumber}</title>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9.5pt; color: #1a1a1a; line-height: 1.5; }

  /* ── Header Bar (schwarzer Balken wie Briefbogen) ── */
  .header-bar {
    background: #1a1a1a;
    padding: 6mm 12mm;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .header-logo { height: 22mm; }
  .header-center {
    text-align: center;
    color: #fff;
    font-size: 8pt;
    line-height: 1.7;
  }
  .header-center .company-name {
    font-size: 12pt;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #fff;
    margin-bottom: 1mm;
  }
  .header-right { text-align: right; }

  /* ── Orangene Linie unter Header ── */
  .accent-line { height: 1.2mm; background: #e8a200; }

  /* ── Content ── */
  .content { padding: 8mm 15mm 5mm 15mm; }

  /* Absenderzeile */
  .sender-line {
    font-size: 7pt;
    color: #888;
    border-bottom: 1px solid #ccc;
    padding-bottom: 1.5mm;
    margin-bottom: 5mm;
  }

  /* Empfänger + Meta nebeneinander */
  .address-meta { display: flex; justify-content: space-between; margin-bottom: 6mm; }
  .recipient { font-size: 10pt; line-height: 1.6; flex: 1; }
  .meta-box { text-align: right; font-size: 8.5pt; line-height: 1.8; }
  .meta-box .label { color: #888; font-size: 7pt; text-transform: uppercase; letter-spacing: 0.3px; }
  .meta-box .val { font-weight: 700; }

  /* Betreff */
  .betreff { font-size: 13pt; font-weight: 800; margin-bottom: 4mm; }
  .intro { font-size: 9pt; color: #444; margin-bottom: 5mm; line-height: 1.7; }

  /* ── Positions-Tabelle ── */
  table.positions { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 4mm; }
  table.positions th {
    background: #1a1a1a;
    color: #e8a200;
    font-weight: 700;
    text-align: left;
    padding: 2.2mm 3mm;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  table.positions th.r { text-align: right; }
  table.positions td { padding: 1.8mm 3mm; border-bottom: 1px solid #eee; vertical-align: top; }
  table.positions tr.section td {
    background: #1a1a1a !important;
    color: #fff;
    font-weight: 700;
    font-size: 10pt;
    padding: 3mm 3mm;
    border-bottom: none;
    letter-spacing: 0.3px;
  }
  table.positions tr.section-sum td { border-bottom: 2px solid #e8a200; padding: 2mm 3mm; font-size: 9pt; }
  table.positions tr.section-sum .sec-total { color: #e8a200; font-weight: 700; }
  table.positions .nr { width: 14mm; font-family: 'Courier New', monospace; font-size: 7.5pt; color: #e8a200; }
  table.positions .desc { width: 50%; }
  table.positions .sub { font-size: 7.5pt; color: #888; }
  table.positions .r { text-align: right; }
  table.positions tr:nth-child(even) td:not(.section) { background: #fafafa; }

  /* ── Summen ── */
  table.totals { width: 50%; margin-left: auto; margin-bottom: 5mm; border-collapse: collapse; }
  table.totals td { padding: 1.5mm 3mm; font-size: 9pt; }
  table.totals .label { color: #666; }
  table.totals .r { text-align: right; }
  table.totals .grand td {
    font-size: 13pt;
    font-weight: 800;
    border-top: 2.5px solid #e8a200;
    padding-top: 2.5mm;
  }
  table.totals .grand .r { color: #1a1a1a; }

  /* ── Summen + Abschluss zusammenhalten ── */
  .closing-block { page-break-inside: avoid; }

  /* ── Abschlusstext ── */
  .closing { font-size: 9pt; color: #444; line-height: 1.7; margin-bottom: 6mm; }

  /* ── Footer Bar (schwarzer Balken wie Briefbogen) ── */
  .footer-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #1a1a1a;
    padding: 4mm 12mm 3mm 12mm;
  }
  .footer-cols {
    display: flex;
    justify-content: space-between;
    color: #ccc;
    font-size: 7pt;
    line-height: 1.6;
  }
  .footer-cols .col { flex: 1; }
  .footer-cols .col.center { text-align: center; }
  .footer-cols .col.right { text-align: right; }
  .footer-cols .col-head { color: #e8a200; font-weight: 700; font-size: 7.5pt; text-transform: uppercase; margin-bottom: 0.5mm; }
  .footer-logo { height: 10mm; margin-right: 3mm; vertical-align: middle; }
  /* ── AGB Styles ── */
  .agb-content { padding: 6mm 15mm 20mm 15mm; font-size: 8pt; line-height: 1.6; color: #333; }
  .agb-title { font-size: 13pt; font-weight: 800; color: #1a1a1a; margin-bottom: 4mm; border-bottom: 2px solid #e8a200; padding-bottom: 2mm; }
  .agb-content h3 { font-size: 9pt; font-weight: 700; color: #1a1a1a; margin-top: 3mm; margin-bottom: 1mm; }
  .agb-content p { margin-bottom: 1.5mm; }
  .agb-stand { margin-top: 5mm; font-style: italic; color: #888; }
  .widerruf-form { background: #fafafa; border: 1px solid #ddd; border-radius: 3px; padding: 5mm; margin-top: 3mm; }
  .form-line { border-bottom: 1px solid #ccc; padding: 3mm 0 1mm 0; margin-bottom: 2mm; font-size: 9pt; }

  .footer-website {
    text-align: center;
    color: #e8a200;
    font-size: 7.5pt;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-top: 2mm;
    border-top: 0.5px solid #333;
    padding-top: 1.5mm;
  }
</style>
</head>
<body>

<!-- ══ HEADER ══ -->
<div class="header-bar">
  <img src="${logoUrl}" class="header-logo" />
  <div class="header-center">
    <div class="company-name">${cfg.company_name || "Deine Baulöwen"}</div>
    ${cfg.address_street || ""}<br>
    ${cfg.address_zip || ""} ${cfg.address_city || ""}<br>
    ${cfg.phone || ""}<br>
    ${cfg.email || ""}
  </div>
  <div class="header-right"></div>
</div>
<div class="accent-line"></div>

<!-- ══ CONTENT ══ -->
<div class="content">

  <!-- Absenderzeile -->
  <div class="sender-line">${cfg.company_name || ""} · ${cfg.address_street || ""} · ${cfg.address_zip || ""} ${cfg.address_city || ""}</div>

  <!-- Empfänger + Meta -->
  <div class="address-meta">
    <div class="recipient">
      <strong>${project?.client || ""}</strong><br>
      ${project?.address || ""}
    </div>
    <div class="meta-box">
      <div class="label">Angebotsnr.</div><div class="val">${offerNumber}</div>
      <div class="label" style="margin-top:1mm;">Datum</div><div class="val">${today}</div>
      <div class="label" style="margin-top:1mm;">Gültig bis</div><div class="val">${validUntil}</div>
    </div>
  </div>

  <!-- Betreff -->
  <div class="betreff">${betreffText || "Angebot"}</div>
  <div class="intro">${anredeZeile}<br>vielen Dank für Ihre Anfrage. Wir erlauben uns, Ihnen folgendes Angebot zu unterbreiten:</div>

  <!-- Positionen -->
  <table class="positions">
    <thead><tr>
      <th>Pos.</th><th>Bezeichnung</th>${showMenge ? `<th class="r">Menge</th><th>Einheit</th>` : ""}${showEP ? `<th class="r">EP</th>` : ""}${showGP ? `<th class="r">GP</th>` : ""}
    </tr></thead>
    <tbody>${posHtml}</tbody>
  </table>

  <!-- Summen + Abschluss (zusammen auf einer Seite) -->
  <div class="closing-block">
  <table class="totals">
    <tr><td class="label">Nettobetrag</td><td class="r">${fmtEuro(totalNetto)} \u20AC</td></tr>
    <tr><td class="label">MwSt. 19%</td><td class="r">${fmtEuro(mwstVal)} \u20AC</td></tr>
    <tr class="grand"><td><strong>Bruttobetrag</strong></td><td class="r"><strong>${fmtEuro(bruttoVal)} \u20AC</strong></td></tr>
  </table>

  <!-- Abschluss -->
  <div class="closing">
    <p>Die aufgeführten Leistungen werden fachgerecht und nach den anerkannten Regeln der Technik ausgeführt.</p>
    <p style="margin-top:2mm;">Dieses Angebot ist gültig bis zum <strong>${validUntil}</strong>.</p>
    <p style="margin-top:2mm;">Wir freuen uns auf Ihren Auftrag und stehen für Rückfragen gerne zur Verfügung.</p>
    <p style="margin-top:6mm;">Mit freundlichen Grüßen</p>
    <p style="margin-top:4mm; font-weight:700;">${cfg.geschaeftsfuehrer || ""}<br><span style="font-weight:400; color:#666;">${cfg.company_name || ""}</span></p>
  </div>
  </div>

</div>

<!-- ══ AGB ══ -->
<div style="page-break-before: always;"></div>
<div class="header-bar">
  <img src="${logoUrl}" class="header-logo" />
  <div class="header-center">
    <div class="company-name">${cfg.company_name || "Deine Baulöwen"}</div>
  </div>
  <div class="header-right"></div>
</div>
<div class="accent-line"></div>
<div class="agb-content">
  <h2 class="agb-title">Allgemeine Geschäftsbedingungen (AGB)</h2>

  <h3>1. Geltungsbereich und Vertragsgrundlagen</h3>
  <p>Diese AGB gelten für alle Verträge, Lieferungen und sonstigen Leistungen der Firma ${cfg.company_name || "Deine Baulöwen"}, ${cfg.address_street || ""}, ${cfg.address_zip || ""} ${cfg.address_city || ""}, gegenüber ihren Kunden. Abweichende oder ergänzende Bedingungen des Auftraggebers werden nicht Vertragsbestandteil, es sei denn, sie werden schriftlich anerkannt.</p>

  <h3>2. Vertragsabschluss und Angebotsbindung</h3>
  <p>Unsere Angebote sind freibleibend und unverbindlich. Ein Vertrag kommt erst durch unsere schriftliche Auftragsbestätigung oder durch Ausführung der beauftragten Leistungen zustande. Angebote behalten für einen Zeitraum von 21 Tagen ab Angebotsdatum Gültigkeit, sofern nicht anders vereinbart.</p>

  <h3>3. Leistungsumfang, Zusatzleistungen und Eigenleistungen</h3>
  <p>3.1 Der Leistungsumfang ergibt sich aus dem Angebot und ggf. einem Leistungsverzeichnis.</p>
  <p>3.2 Zusatzleistungen, Änderungswünsche oder Mehraufwand (z. B. durch unerwartete Gegebenheiten oder behördliche Auflagen) sind gesondert zu vergüten. Eigenleistungen des Auftraggebers erfolgen auf eigene Gefahr. Für daraus resultierende Mängel, Verzögerungen oder Folgekosten wird keine Haftung übernommen.</p>

  <h3>4. Preise und Zahlungsbedingungen</h3>
  <p>4.1 Alle Preise verstehen sich netto zuzüglich gesetzlicher Umsatzsteuer.</p>
  <p>4.2 Zahlungen sind sofort nach Rechnungszugang ohne Abzug fällig. Bei Zahlungsverzug berechnen wir Verzugszinsen gemäß § 288 BGB: Privatkunden: +5 Prozentpunkte, Geschäftskunden: +9 Prozentpunkte über dem Basiszinssatz.</p>
  <p>4.3 Abschlagszahlungen können je nach Baufortschritt vereinbart werden. Die Schlussrechnung erfolgt nach Aufmaß.</p>

  <h3>5. Termine und Ausführung</h3>
  <p>5.1 Die Ausführung erfolgt nach vorheriger Terminabsprache. Termine sind unverbindlich, sofern sie nicht ausdrücklich schriftlich als verbindlich bezeichnet wurden.</p>
  <p>5.2 Verzögerungen aufgrund höherer Gewalt, Materialengpässen oder fehlender Mitwirkung des Auftraggebers führen zu einer angemessenen Fristverlängerung.</p>

  <h3>6. Mitwirkungspflichten des Auftraggebers</h3>
  <p>6.1 Der Auftraggeber stellt Strom, Wasser sowie ausreichend Lager- und Abstellflächen zur Verfügung.</p>
  <p>6.2 Unterlässt der Auftraggeber notwendige Mitwirkungshandlungen, behalten wir uns vor, die Ausführung zu unterbrechen und daraus entstehende Mehrkosten gesondert abzurechnen.</p>

  <h3>7. Gewährleistung und Abnahme</h3>
  <p>7.1 Die Abnahme der Leistung erfolgt spätestens mit Ingebrauchnahme.</p>
  <p>7.2 Die gesetzliche Gewährleistung für Werkleistungen beträgt 5 Jahre. Bei gewerblichen Auftraggebern wird diese auf 4 Jahre begrenzt.</p>
  <p>7.3 Offensichtliche Mängel sind binnen 7 Tagen nach Abnahme anzuzeigen. Spätere Rügen können nicht berücksichtigt werden.</p>

  <h3>8. Besonderheiten bei Natur- und Sondermaterialien</h3>
  <p>8.1 Bei Naturprodukten (z. B. Stein, Holz) stellen Farbabweichungen, Maserungen, Haarrisse oder Unregelmäßigkeiten keinen Mangel dar.</p>
  <p>8.2 Fliesen können chargenbedingt abweichen. Nachlieferungen können Unterschiede in Farbton und Format aufweisen.</p>

  <h3>9. Haftung</h3>
  <p>9.1 Wir haften nur für Schäden, die vorsätzlich oder grob fahrlässig verursacht wurden. Die Haftung ist auf den vertragstypisch vorhersehbaren Schaden begrenzt (maximal 200.000 EUR).</p>
  <p>9.2 Eine Haftung für indirekte Schäden, Folgekosten oder entgangenen Gewinn ist ausgeschlossen.</p>

  <h3>10. Eigentumsvorbehalt</h3>
  <p>Alle gelieferten Materialien bleiben bis zur vollständigen Bezahlung unser Eigentum.</p>

  <h3>11. Digitaler Schriftverkehr und Kommunikation</h3>
  <p>Erklärungen, Hinweise oder Dokumente können per E-Mail erfolgen und gelten mit elektronischem Zugang als wirksam. Das gilt auch für Angebote, Auftragsbestätigungen, Mahnungen oder Mängelanzeigen.</p>

  <h3>12. Nutzungsrechte an Bildern und Referenzobjekten</h3>
  <p>Der Auftraggeber erklärt sich damit einverstanden, dass von uns erstellte Arbeiten zur Dokumentation und Werbung fotografiert und veröffentlicht werden dürfen, sofern keine personenbezogenen Daten erkennbar sind.</p>

  <h3>13. Widerrufsrecht (nur für Verbraucher)</h3>
  <p>Verbraucher haben ein gesetzliches Widerrufsrecht von 14 Tagen. Wird die Ausführung der Leistung vor Ablauf der Frist gewünscht, erlischt das Widerrufsrecht mit vollständiger Leistungserbringung.</p>

  <h3>14. Salvatorische Klausel</h3>
  <p>Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. Die Parteien verpflichten sich, die unwirksame Regelung durch eine wirksame zu ersetzen, die dem wirtschaftlichen Zweck am nächsten kommt.</p>

  <h3>15. Gerichtsstand und Schlussbestimmungen</h3>
  <p>Es gilt deutsches Recht. Gerichtsstand ist – soweit gesetzlich zulässig – der Sitz von ${cfg.company_name || "Deine Baulöwen"}. Für Verbraucher gelten die gesetzlichen Regelungen.</p>

  <p class="agb-stand">Stand: Juli 2025</p>
</div>

<!-- ══ Widerrufsformular ══ -->
<div style="page-break-before: always;"></div>
<div class="header-bar">
  <img src="${logoUrl}" class="header-logo" />
  <div class="header-center">
    <div class="company-name">${cfg.company_name || "Deine Baulöwen"}</div>
  </div>
  <div class="header-right"></div>
</div>
<div class="accent-line"></div>
<div class="agb-content">
  <h2 class="agb-title">Widerrufsbelehrung</h2>

  <h3>Widerrufsrecht</h3>
  <p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.</p>
  <p>Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (<strong>${cfg.company_name || "Deine Baulöwen"}</strong>, ${cfg.address_street || ""}, ${cfg.address_zip || ""} ${cfg.address_city || ""}, Tel: ${cfg.phone || ""}, E-Mail: ${cfg.email || ""}) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.</p>
  <p>Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.</p>

  <h3>Folgen des Widerrufs</h3>
  <p>Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf bei uns eingegangen ist.</p>
  <p>Haben Sie verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen soll, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.</p>

  <h2 class="agb-title" style="margin-top:8mm;">Muster-Widerrufsformular</h2>
  <p><em>(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)</em></p>

  <div class="widerruf-form">
    <p>An: <strong>${cfg.company_name || "Deine Baulöwen"}</strong><br>
    ${cfg.address_street || ""}<br>
    ${cfg.address_zip || ""} ${cfg.address_city || ""}<br>
    E-Mail: ${cfg.email || ""}</p>

    <p style="margin-top:4mm;">Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung:</p>

    <div class="form-line">Bestellt am / erhalten am: ___________________________</div>
    <div class="form-line">Angebotsnr.: ___________________________</div>
    <div class="form-line">Name des/der Verbraucher(s): ___________________________</div>
    <div class="form-line">Anschrift des/der Verbraucher(s): ___________________________</div>
    <div class="form-line" style="margin-top:8mm;">Datum: ________________&nbsp;&nbsp;&nbsp;&nbsp;Unterschrift: ___________________________</div>

    <p style="margin-top:4mm; font-size:7pt; color:#888;">(*) Unzutreffendes streichen.</p>
  </div>
</div>

<!-- ══ FOOTER ══ -->
<div class="footer-bar">
  <div class="footer-cols">
    <div class="col">
      <div class="col-head">${cfg.company_name || ""}</div>
      ${cfg.geschaeftsfuehrer || ""}<br>
      ${cfg.address_street || ""}<br>
      ${cfg.address_zip || ""} ${cfg.address_city || ""}
    </div>
    <div class="col center">
      <div class="col-head">Bank: ${cfg.bank || ""}</div>
      IBAN: ${cfg.iban || ""}<br>
      BIC: ${cfg.bic || ""}
    </div>
    <div class="col right">
      <div class="col-head">Finanzamt: ${cfg.finanzamt || ""}</div>
      USt.ID.: ${cfg.vat_id || ""}<br>
      Steuernummer: ${cfg.tax_id || ""}
    </div>
  </div>
  <div class="footer-website">${cfg.website || ""}</div>
</div>

</body></html>`;

    // PDF via Gotenberg (Server-side) generieren
    try {
      if (Platform.OS !== "web") return;

      const formData = new FormData();
      const htmlBlob = new Blob([html], { type: "text/html" });
      formData.append("files", htmlBlob, "index.html");
      formData.append("marginTop", "0");
      formData.append("marginBottom", "0");
      formData.append("marginLeft", "0");
      formData.append("marginRight", "0");
      formData.append("preferCssPageSize", "true");

      const resp = await fetch("https://gotenberg.srv1045913.hstgr.cloud/forms/chromium/convert/html", {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        setPdfError("Gotenberg: HTTP " + resp.status);
        return;
      }

      const pdfBlob = await resp.blob();
      const fileName = `${offerNumber || "Angebot"}_v${offerVersion}.pdf`;

      if (mode === "save") {
        // PDF als Blob-URL → Download triggern
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Auch in Supabase Storage speichern
        if (offerId) {
          const storagePath = `offers/${offerId}/${fileName}`;
          const arrayBuffer = await pdfBlob.arrayBuffer();
          await supabase.storage.from("project-files").upload(storagePath, arrayBuffer, { contentType: "application/pdf", upsert: true });
          const { data: signedData } = await supabase.storage.from("project-files").createSignedUrl(storagePath, 365 * 24 * 60 * 60);
          await supabase.from("offers").update({ pdf_storage_path: storagePath, pdf_public_url: signedData?.signedUrl || null }).eq("id", offerId);
        }

        setPdfSaved(true);
        setTimeout(() => setPdfSaved(false), 3000);
      } else {
        // Preview: PDF im neuen Tab öffnen
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, "_blank");
      }
    } catch (e: any) {
      console.error("[PDF] Fehler:", e);
      setPdfError(e?.message || "PDF-Generierung fehlgeschlagen");
    } finally {
      if (mode === "save") setPdfSaving(false);
    }
    } catch (outerErr: any) {
      console.error("[PDF] Outer error:", outerErr);
      setPdfError(outerErr?.message || "Fehler");
      setPdfSaving(false);
    }
  }, [rooms, totalNetto, offerNumber, offerVersion, betreffText, project, offerId, anredeZeile, pdfExportMode]);

  if (!project) {
    return <ProjectSelector onSelect={setProject} />;
  }

  if (offerLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.raw.zinc950, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={Colors.raw.amber500} />
        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc400, marginTop: 16 }}>Angebot wird geladen...</Text>
      </View>
    );
  }

  const roomForAddPos = rooms.find((r) => r.id === addPosRoomId);
  const roomNrForAdd = roomForAddPos ? String(rooms.indexOf(roomForAddPos) + 1).padStart(2, "0") : "01";
  const nextPosNr = roomForAddPos ? roomForAddPos.positions.length + 1 : 1;

  const mwst = totalNetto * 0.19;
  const brutto = totalNetto + mwst;

  return (
    <View style={s.container}>
      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: topInset + 12 }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [s.headerBtn, { opacity: pressed ? 0.7 : 1 }]} testID="back-button">
          <Ionicons name="arrow-back" size={22} color={Colors.raw.white} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle} numberOfLines={1}>Angebot</Text>
          <Text style={s.headerSub} numberOfLines={1}>{project.code} — {project.name}</Text>
        </View>
        {savedIndicator && (
          <View style={s.savedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.raw.emerald500} />
            <Text style={s.savedText}>Gespeichert</Text>
          </View>
        )}
        <Pressable onPress={() => setMenuVisible(true)} style={({ pressed }) => [s.headerBtn, { opacity: pressed ? 0.7 : 1 }]} testID="menu-btn">
          <Ionicons name="ellipsis-vertical" size={20} color={Colors.raw.zinc400} />
        </Pressable>
      </View>

      {/* ── Scroll Content ── */}
      <ScrollView style={s.scroll} contentContainerStyle={[s.scrollContent, { paddingTop: topInset + 80, paddingBottom: bottomInset + 280 }]} showsVerticalScrollIndicator={Platform.OS === "web"}>

        {/* ── Meta Card: Angebotsdaten ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="document-text-outline" size={16} color={Colors.raw.amber500} />
            <Text style={s.cardLabel}>Angebotsdaten</Text>
          </View>

          <View style={s.metaGrid}>
            <View style={s.metaGridItem}>
              <Text style={s.metaLabel}>Angebotsnr.</Text>
              <Text style={s.metaValue}>{offerNumber || "—"}</Text>
            </View>
            <View style={s.metaGridItem}>
              <Text style={s.metaLabel}>Erstellt von</Text>
              <Text style={s.metaValue}>{user?.name || "—"}</Text>
            </View>
            <View style={s.metaGridItem}>
              <Text style={s.metaLabel}>Datum</Text>
              <Text style={s.metaValue}>{new Date().toLocaleDateString("de-DE")}</Text>
            </View>
            <View style={s.metaGridItem}>
              <Text style={s.metaLabel}>Gültig bis</Text>
              <Text style={s.metaValue}>{new Date(Date.now() + 30 * 86400000).toLocaleDateString("de-DE")}</Text>
            </View>
          </View>

          <View style={s.divider} />

          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Kunde</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={s.metaValue}>{project?.client || "—"}</Text>
              <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <Text style={s.changeBtn}>Ändern</Text>
              </Pressable>
            </View>
          </View>
          <Text style={s.clientDetail}>{project.address}</Text>

          <View style={s.divider} />

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={s.metaLabel}>Betreff</Text>
            <Pressable
              onPress={() => setShowTextbausteine(!showTextbausteine)}
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 4, opacity: pressed ? 0.7 : 1 })}
            >
              <Ionicons name="documents-outline" size={14} color={Colors.raw.amber500} />
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.amber500 }}>
                Textbausteine
              </Text>
              <Ionicons name={showTextbausteine ? "chevron-up" : "chevron-down"} size={14} color={Colors.raw.amber500} />
            </Pressable>
          </View>

          {showTextbausteine && (
            <View style={s.textbausteineContainer}>
              {TEXTBAUSTEINE.map((tb, i) => {
                const resolved = resolveVars(tb.text);
                return (
                  <Pressable
                    key={i}
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setBetreffText(resolved);
                      setShowTextbausteine(false);
                    }}
                    style={({ pressed }) => [s.textbausteinChip, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Text style={s.textbausteinLabel}>{tb.label}</Text>
                    <Text style={s.textbausteinPreview} numberOfLines={1}>{resolved}</Text>
                  </Pressable>
                );
              })}
              <Text style={s.textbausteinHint}>
                Variablen: {"{{Kunde}}"}, {"{{Nachname}}"}, {"{{Anrede}}"}, {"{{Adresse}}"}, {"{{Projekt}}"}, {"{{Angebotsnr}}"}, {"{{Datum}}"}
              </Text>
            </View>
          )}

          <TextInput
            style={s.betreffInput}
            value={betreffText}
            onChangeText={setBetreffText}
            multiline
            numberOfLines={2}
            placeholder="Betreff eingeben oder Textbaustein wählen..."
            placeholderTextColor={Colors.raw.zinc600}
            testID="betreff-input"
          />
        </View>

        {/* ── Kalkulation Card ── */}
        <Pressable onPress={() => setShowKalkulation(!showKalkulation)} style={({ pressed }) => [s.card, s.cardSpacing, { opacity: pressed ? 0.92 : 1 }]}>
          <View style={s.cardHeader}>
            <Ionicons name="calculator-outline" size={16} color={Colors.raw.amber500} />
            <Text style={s.cardLabel}>Kalkulation</Text>
            <View style={{ flex: 1 }} />
            <Ionicons name={showKalkulation ? "chevron-up" : "chevron-down"} size={18} color={Colors.raw.zinc500} />
          </View>
          {showKalkulation && (
            <View style={s.kalkContent}>
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
              <Text style={s.kalkHint}>Gilt für alle Katalogpositionen. Kann pro Position überschrieben werden.</Text>
            </View>
          )}
        </Pressable>

        {/* ── Positionen Section ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Positionen</Text>
          <View style={s.countBadge}>
            <Text style={s.countText}>{totalPositions}</Text>
          </View>
        </View>

        {rooms.map((room, ri) => {
          const roomTotal = room.positions.reduce((s, p) => s + p.basePrice * (1 + p.markup / 100) * p.qty, 0);
          const roomNrStr = String(ri + 1).padStart(2, "0");

          return (
            <View key={room.id} style={s.roomCard}>
              {/* Room Header */}
              <View style={s.roomHeader}>
                {/* Reorder Buttons */}
                <View style={s.reorderBtns}>
                  <Pressable
                    onPress={() => moveRoom(room.id, "up")}
                    style={({ pressed }) => [s.reorderBtn, ri === 0 && { opacity: 0.25 }, { opacity: pressed && ri > 0 ? 0.5 : ri === 0 ? 0.25 : 1 }]}
                    disabled={ri === 0}
                  >
                    <Ionicons name="chevron-up" size={14} color={Colors.raw.zinc400} />
                  </Pressable>
                  <Pressable
                    onPress={() => moveRoom(room.id, "down")}
                    style={({ pressed }) => [s.reorderBtn, ri === rooms.length - 1 && { opacity: 0.25 }, { opacity: pressed && ri < rooms.length - 1 ? 0.5 : ri === rooms.length - 1 ? 0.25 : 1 }]}
                    disabled={ri === rooms.length - 1}
                  >
                    <Ionicons name="chevron-down" size={14} color={Colors.raw.zinc400} />
                  </Pressable>
                </View>
                <Pressable onPress={() => toggleRoom(room.id)} style={({ pressed }) => [{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", opacity: pressed ? 0.85 : 1 }]} testID={`room-${room.id}`}>
                  <View style={s.roomHeaderLeft}>
                    <View style={s.roomIconWrap}>
                      <Ionicons name={room.icon as any} size={16} color={Colors.raw.amber500} />
                    </View>
                    <Text style={s.roomName}>
                      <Text style={s.roomNr}>{roomNrStr} </Text>
                      {room.name}
                    </Text>
                  </View>
                  <View style={s.roomHeaderRight}>
                    <Text style={s.roomMeta}>{room.positions.length} Pos.</Text>
                    {!hidePositionPrices && <Text style={s.roomTotal}>{formatEuroShort(roomTotal)}</Text>}
                    <Ionicons name={room.collapsed ? "chevron-down" : "chevron-up"} size={16} color={Colors.raw.zinc500} />
                  </View>
                </Pressable>
              </View>

              {/* Position List */}
              {!room.collapsed && (
                <View style={s.roomContent}>
                  {room.positions.map((pos, pi) => {
                    const ep = pos.basePrice * (1 + pos.markup / 100);
                    const total = ep * pos.qty;
                    const dynamicNr = `${roomNrStr}.${String(pi + 1).padStart(2, "0")}`;

                    const posTypeInfo = POSITION_TYPE_OPTIONS.find((o) => o.value === pos.positionType);
                    const isNonStandard = pos.positionType !== "STANDARD";

                    return (
                      <View key={pos.id} style={[s.posRow, pi === 0 && { borderTopWidth: 0 }, isNonStandard && { opacity: 0.7 }]}>
                        <View style={s.posLeftCol}>
                          <Text style={s.posNr}>{dynamicNr}</Text>
                          <Pressable
                            onPress={() => {
                              setEditFocus("qty");
                              setEditPosition(pos);
                              setEditPosRoomId(room.id);
                            }}
                            style={({ pressed }) => [s.qtyBadge, { opacity: pressed ? 0.7 : 1 }]}
                          >
                            <Text style={s.qtyBadgeText}>{pos.qty.toString().replace(".", ",")} {pos.unit}</Text>
                          </Pressable>
                          {isNonStandard && posTypeInfo && (
                            <View style={{ backgroundColor: posTypeInfo.color + "20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 }}>
                              <Text style={{ color: posTypeInfo.color, fontSize: 10, fontFamily: "Inter_600SemiBold" }}>{posTypeInfo.short}</Text>
                            </View>
                          )}
                        </View>
                        <View style={s.posCenter}>
                          <Pressable onPress={() => { setEditFocus("title"); setEditPosition(pos); setEditPosRoomId(room.id); }}>
                            <Text style={s.posTitle} numberOfLines={1}>
                              {isNonStandard && posTypeInfo ? `[${posTypeInfo.label}] ` : ""}{pos.title}
                            </Text>
                          </Pressable>
                          {!!(pos.longText || pos.desc) && (
                            <Pressable onPress={() => { setEditFocus("longText"); setEditPosition(pos); setEditPosRoomId(room.id); }}>
                              <Text style={s.posLongText} numberOfLines={3}>{pos.longText || pos.desc}</Text>
                            </Pressable>
                          )}
                          {!hidePositionPrices && pos.unit !== "Pauschal" && (
                            <Pressable onPress={() => { setEditFocus("price"); setEditPosition(pos); setEditPosRoomId(room.id); }}>
                              <Text style={s.posDetail}>
                                {`${formatEuro(ep)}/${pos.unit}`}
                              </Text>
                            </Pressable>
                          )}
                        </View>
                        {!hidePositionPrices && (
                          <Pressable onPress={() => { setEditFocus("price"); setEditPosition(pos); setEditPosRoomId(room.id); }}>
                            <Text style={s.posTotal}>{formatEuro(total)}</Text>
                          </Pressable>
                        )}
                        <View style={s.posActions}>
                          <Pressable
                            onPress={() => {
                              setEditFocus(undefined);
                              setEditPosition(pos);
                              setEditPosRoomId(room.id);
                            }}
                            style={({ pressed }) => [s.posActionBtn, { opacity: pressed ? 0.6 : 1 }]}
                          >
                            <Feather name="edit-2" size={13} color={Colors.raw.zinc500} />
                          </Pressable>
                          <Pressable
                            onPress={() => deletePosition(pos.id)}
                            style={({ pressed }) => [s.posActionBtn, { opacity: pressed ? 0.6 : 1 }]}
                          >
                            <Ionicons name="trash-outline" size={14} color={Colors.raw.zinc600} />
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}

                  {/* Add Position Button */}
                  <Pressable
                    onPress={() => {
                      setAddPosRoomId(room.id);
                      setAddPosVisible(true);
                    }}
                    style={({ pressed }) => [s.addPosBtn, { opacity: pressed ? 0.8 : 1 }]}
                    testID={`add-pos-${room.id}`}
                  >
                    <View style={s.addPosDash}>
                      <Ionicons name="add" size={15} color={Colors.raw.amber500} />
                      <Text style={s.addPosBtnText}>Position hinzufügen</Text>
                    </View>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}

        {/* Add Room Button */}
        <Pressable
          onPress={() => setAddRoomVisible(true)}
          style={({ pressed }) => [s.addRoomBtn, { opacity: pressed ? 0.85 : 1 }]}
          testID="add-room-btn"
        >
          <Ionicons name="add-circle-outline" size={20} color={Colors.raw.amber500} />
          <Text style={s.addRoomBtnText}>+ Neuer Titel</Text>
        </Pressable>
      </ScrollView>

      {/* ── Footer (collapsible) ── */}
      <View style={[s.stickyFooter, { paddingBottom: bottomInset + 10 }]}>
        {/* Slim bar — always visible */}
        <Pressable
          onPress={() => setFooterExpanded((v) => !v)}
          style={s.footerSlimBar}
        >
          <View style={s.footerSlimLeft}>
            <Text style={s.footerSlimBrutto}>{formatEuroShort(brutto)}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View style={[s.marginDot, { backgroundColor: marginColor }]} />
              <Text style={[s.footerMargin, { color: marginColor }]}>{margin.toFixed(0)}%</Text>
            </View>
          </View>
          <View style={s.footerSlimActions}>
            <Pressable onPress={() => handlePreview("preview")} style={({ pressed }) => [s.footerIconBtn, { opacity: pressed ? 0.7 : 1 }]} testID="preview-btn">
              <Ionicons name="eye-outline" size={20} color={Colors.raw.amber500} />
            </Pressable>
            <Pressable onPress={() => handlePreview("save")} disabled={pdfSaving} style={({ pressed }) => [s.footerIconBtn, pdfSaved && { backgroundColor: Colors.raw.emerald500 }, { opacity: pressed || pdfSaving ? 0.6 : 1 }]} testID="pdf-btn">
              {pdfSaving ? (
                <ActivityIndicator size={16} color={Colors.raw.white} />
              ) : (
                <Ionicons name={pdfSaved ? "checkmark-circle" : "download-outline"} size={20} color={Colors.raw.white} />
              )}
            </Pressable>
            <Pressable onPress={() => setSaveVisible(true)} style={({ pressed }) => [s.footerIconBtn, s.footerSaveIconBtn, { opacity: pressed ? 0.8 : 1 }]} testID="save-btn">
              <Feather name="save" size={18} color="#000" />
            </Pressable>
            <Ionicons
              name={footerExpanded ? "chevron-down" : "chevron-up"}
              size={18}
              color={Colors.raw.zinc500}
              style={{ marginLeft: 4 }}
            />
          </View>
        </Pressable>

        {/* Expanded details */}
        {footerExpanded && (
          <View style={s.footerExpandedArea}>
            <View style={s.footerSummary}>
              <View style={s.footerSummaryRow}>
                <Text style={s.footerLabel}>Netto</Text>
                <Text style={s.footerValue}>{formatEuroShort(totalNetto)}</Text>
              </View>
              <View style={s.footerSummaryRow}>
                <Text style={s.footerLabel}>MwSt. (19%)</Text>
                <Text style={s.footerValue}>{formatEuroShort(mwst)}</Text>
              </View>
              <View style={s.footerDivider} />
              <View style={s.footerSummaryRow}>
                <Text style={s.footerLabelBold}>Brutto</Text>
                <Text style={s.footerTotal}>{formatEuroShort(brutto)}</Text>
              </View>
              <View style={s.footerSummaryRow}>
                <Text style={s.footerLabel}>{totalPositions} Positionen</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={[s.marginDot, { backgroundColor: marginColor }]} />
                  <Text style={[s.footerMargin, { color: marginColor }]}>Marge {margin.toFixed(0)}%</Text>
                </View>
              </View>
            </View>
            {/* PDF Export Optionen */}
            <View style={s.pdfExportRow}>
              <Ionicons name="document-text-outline" size={14} color={Colors.raw.zinc500} />
              <Text style={s.pdfExportLabel}>PDF Export:</Text>
              {([
                { key: "full" as PdfExportMode, label: "Mit Stückliste" },
                { key: "lump_sum" as PdfExportMode, label: "Positionen pauschal" },
                { key: "title_sums" as PdfExportMode, label: "Nur Titelsummen" },
                { key: "total_only" as PdfExportMode, label: "Nur Angebotssumme" },
              ] as const).map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPdfExportMode(opt.key);
                  }}
                  style={({ pressed }) => [
                    s.pdfExportChip,
                    pdfExportMode === opt.key && s.pdfExportChipActive,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Ionicons name="download-outline" size={12} color={pdfExportMode === opt.key ? Colors.raw.white : Colors.raw.zinc400} />
                  <Text style={[s.pdfExportChipText, pdfExportMode === opt.key && s.pdfExportChipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
        {!!pdfError && (
          <Text style={{ color: Colors.raw.rose500, fontSize: 11, fontFamily: "Inter_600SemiBold", textAlign: "center", marginTop: 4 }}>
            Fehler: {pdfError}
          </Text>
        )}
      </View>

      {/* ── Menu Modal ── */}
      {menuVisible && (
        <Modal visible={menuVisible} transparent animationType="fade" statusBarTranslucent>
          <Pressable style={s.menuOverlay} onPress={() => setMenuVisible(false)}>
            <View style={[s.menuSheet, { top: topInset + 56, right: 16 }]}>
              {[
                { icon: "document-text", label: "Vorschau" },
                { icon: "cloud-upload", label: "PDF speichern", action: () => handlePreview("save") },
                { icon: "download", label: "Aus LV importieren", action: () => handleLvImport() },
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

              {/* Trennlinie + Löschen (nur wenn offerId existiert) */}
              {offerId && (
                <>
                  <View style={{ height: 1, backgroundColor: Colors.raw.zinc800, marginVertical: 4 }} />
                  <Pressable
                    onPress={() => {
                      setMenuVisible(false);
                      handleDeleteOffer();
                    }}
                    style={({ pressed }) => [s.menuItem, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Ionicons name="trash" size={18} color={Colors.raw.rose500} />
                    <Text style={[s.menuItemText, { color: Colors.raw.rose500 }]}>Angebot löschen</Text>
                  </Pressable>
                </>
              )}
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
        onClose={() => { setEditPosition(null); setEditPosRoomId(null); setEditFocus(undefined); }}
        position={editPosition}
        onSave={updatePosition}
        onDelete={deletePosition}
        focusField={editFocus}
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

      {/* LV Import Modal */}
      <Modal visible={lvImportVisible} transparent animationType="slide" statusBarTranslucent>
        <View style={lvStyles.overlay}>
          <View style={[lvStyles.sheet, { paddingTop: topInset + 16, paddingBottom: bottomInset + 16 }]}>
            {/* Header */}
            <View style={lvStyles.header}>
              <Text style={lvStyles.headerTitle}>Aus LV importieren</Text>
              <Pressable
                onPress={() => { setLvImportVisible(false); setLvImportResults(null); setLvImportError(""); }}
                style={({ pressed }) => [lvStyles.closeBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name="close" size={22} color={Colors.raw.zinc400} />
              </Pressable>
            </View>

            {/* Loading */}
            {lvImportLoading && (
              <View style={lvStyles.center}>
                <ActivityIndicator size="large" color={Colors.raw.amber500} />
                <Text style={lvStyles.loadingText}>LV wird analysiert...</Text>
                <Text style={lvStyles.loadingSubtext}>Format erkennen, Positionen extrahieren, Katalog matchen</Text>
              </View>
            )}

            {/* Error */}
            {lvImportError ? (
              <View style={lvStyles.center}>
                <Ionicons name="alert-circle" size={48} color={Colors.raw.rose500} />
                <Text style={lvStyles.errorText}>{lvImportError}</Text>
                <Pressable
                  onPress={() => { setLvImportVisible(false); setLvImportError(""); }}
                  style={lvStyles.retryBtn}
                >
                  <Text style={lvStyles.retryBtnText}>Schliessen</Text>
                </Pressable>
              </View>
            ) : null}

            {/* Results */}
            {lvImportResults && !lvImportLoading && (
              <>
                {/* Summary */}
                {lvImportSummary && (
                  <View style={lvStyles.summary}>
                    <View style={lvStyles.summaryItem}>
                      <Text style={lvStyles.summaryNumber}>{lvImportSummary.total}</Text>
                      <Text style={lvStyles.summaryLabel}>Positionen</Text>
                    </View>
                    <View style={lvStyles.summaryItem}>
                      <Text style={[lvStyles.summaryNumber, { color: Colors.raw.emerald500 }]}>{lvImportSummary.matched}</Text>
                      <Text style={lvStyles.summaryLabel}>Zugeordnet</Text>
                    </View>
                    <View style={lvStyles.summaryItem}>
                      <Text style={[lvStyles.summaryNumber, { color: Colors.raw.amber500 }]}>{lvImportSummary.needs_review}</Text>
                      <Text style={lvStyles.summaryLabel}>Prüfen</Text>
                    </View>
                  </View>
                )}

                {/* Position list */}
                <FlatList
                  data={lvImportResults}
                  keyExtractor={(_, i) => String(i)}
                  style={{ flex: 1 }}
                  renderItem={({ item, index }) => {
                    const selected = lvImportSelected.has(index);
                    const confColor = item.confidence >= 0.8 ? Colors.raw.emerald500 : item.confidence >= 0.5 ? Colors.raw.amber500 : Colors.raw.rose500;
                    return (
                      <Pressable
                        onPress={() => {
                          setLvImportSelected((prev) => {
                            const next = new Set(prev);
                            if (next.has(index)) next.delete(index); else next.add(index);
                            return next;
                          });
                        }}
                        style={[lvStyles.posItem, !selected && { opacity: 0.4 }]}
                      >
                        <View style={lvStyles.posCheck}>
                          <Ionicons name={selected ? "checkbox" : "square-outline"} size={22} color={selected ? Colors.raw.amber500 : Colors.raw.zinc600} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={lvStyles.posNr}>{item.position_nr}</Text>
                            {item.trade && <Text style={lvStyles.posTrade}>{item.trade}</Text>}
                            <View style={[lvStyles.confBadge, { backgroundColor: confColor + "20" }]}>
                              <Text style={[lvStyles.confText, { color: confColor }]}>{Math.round(item.confidence * 100)}%</Text>
                            </View>
                          </View>
                          <Text style={lvStyles.posTitle} numberOfLines={2}>{item.title}</Text>
                          <Text style={lvStyles.posQty}>{item.quantity} {item.unit}</Text>
                        </View>
                      </Pressable>
                    );
                  }}
                />

                {/* Confirm */}
                <View style={lvStyles.confirmRow}>
                  <Text style={lvStyles.confirmCount}>{lvImportSelected.size} von {lvImportResults.length} ausgewählt</Text>
                  <Pressable
                    onPress={handleLvImportConfirm}
                    style={({ pressed }) => [lvStyles.confirmBtn, { opacity: pressed ? 0.9 : 1 }]}
                  >
                    <Ionicons name="checkmark-circle" size={20} color={Colors.raw.zinc950} />
                    <Text style={lvStyles.confirmBtnText}>Übernehmen</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const lvStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  sheet: { flex: 1, backgroundColor: Colors.raw.zinc900, marginTop: 40, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.raw.white },
  closeBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.raw.white, marginTop: 8 },
  loadingSubtext: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc400, textAlign: "center" },
  errorText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.rose400, textAlign: "center", marginTop: 8 },
  retryBtn: { backgroundColor: Colors.raw.zinc800, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 12 },
  retryBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.white },
  summary: { flexDirection: "row", backgroundColor: Colors.raw.zinc800, borderRadius: 12, padding: 16, marginBottom: 12, justifyContent: "space-around" },
  summaryItem: { alignItems: "center" },
  summaryNumber: { fontFamily: "Inter_700Bold", fontSize: 24, color: Colors.raw.white },
  summaryLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc400, marginTop: 2 },
  posItem: { flexDirection: "row", alignItems: "flex-start", backgroundColor: Colors.raw.zinc800 + "80", borderRadius: 10, padding: 12, marginBottom: 8, gap: 10 },
  posCheck: { paddingTop: 2 },
  posNr: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.amber500 },
  posTrade: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.raw.zinc400, backgroundColor: Colors.raw.zinc700, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  confBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  confText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  posTitle: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.white, marginTop: 4 },
  posQty: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc400, marginTop: 2 },
  confirmRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.raw.zinc700 },
  confirmCount: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc400 },
  confirmBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.raw.amber500, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  confirmBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.zinc950 },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },

  // ── Header ──
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 12,
    backgroundColor: Colors.raw.zinc950 + "F5",
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800 + "80",
  },
  headerBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17, color: Colors.raw.white },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginTop: 2 },
  savedBadge: {
    position: "absolute",
    right: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.raw.emerald500 + "14",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  savedText: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.raw.emerald500 },

  // ── Scroll ──
  scroll: { flex: 1, ...(Platform.OS === "web" ? { overflow: "auto" as any } : {}) },
  scrollContent: { paddingHorizontal: 16 },

  // ── Card ──
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
  },
  cardSpacing: { marginTop: 16 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  cardLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.raw.zinc300,
    letterSpacing: 0.5,
  },

  // ── Meta Grid (2x2) ──
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
  },
  metaGridItem: {
    width: "50%",
    paddingVertical: 8,
  },

  // ── Meta Rows ──
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  metaLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc500 },
  metaValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.white },
  divider: { height: 1, backgroundColor: Colors.raw.zinc800, marginVertical: 14 },
  changeBtn: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.amber500 },
  clientDetail: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginTop: 2, marginBottom: 2 },
  betreffInput: {
    backgroundColor: Colors.raw.zinc800 + "80",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700 + "60",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.white,
    marginTop: 10,
    minHeight: 60,
    textAlignVertical: "top",
  },
  textbausteineContainer: {
    marginTop: 10,
    gap: 6,
  },
  textbausteinChip: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700 + "60",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textbausteinLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: Colors.raw.amber500,
    marginBottom: 2,
  },
  textbausteinPreview: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc400,
  },
  textbausteinHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.raw.zinc600,
    marginTop: 4,
  },

  // ── Kalkulation ──
  kalkContent: { marginTop: 4 },
  kalkHint: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.raw.zinc600, marginTop: 6, lineHeight: 16 },
  smallInput: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700 + "60",
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.raw.white,
    width: 54,
    textAlign: "center",
  },

  // ── PDF Export Optionen ──
  pdfExportRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  pdfExportLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.raw.zinc500,
    marginRight: 2,
  },
  pdfExportChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
  },
  pdfExportChipActive: {
    backgroundColor: Colors.raw.amber500 + "22",
    borderColor: Colors.raw.amber500,
  },
  pdfExportChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.raw.zinc400,
  },
  pdfExportChipTextActive: {
    color: Colors.raw.amber500,
  },

  // ── Toggle Switch ──
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.raw.zinc700,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleTrackActive: {
    backgroundColor: Colors.raw.amber500,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.raw.zinc400,
  },
  toggleThumbActive: {
    backgroundColor: Colors.raw.white,
    alignSelf: "flex-end",
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sectionTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 20, color: Colors.raw.white },
  countBadge: {
    backgroundColor: Colors.raw.amber500 + "18",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countText: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.amber500 },

  // ── Room Card ──
  roomCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    marginBottom: 16,
    overflow: "hidden",
  },
  roomHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  reorderBtns: { flexDirection: "column", alignItems: "center", justifyContent: "center", marginRight: 6 },
  reorderBtn: { width: 28, height: 20, alignItems: "center", justifyContent: "center" },
  roomHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  roomIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.raw.amber500 + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  roomName: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.raw.white },
  roomNr: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 12, color: Colors.raw.amber500 },
  roomHeaderRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  roomMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500 },
  roomTotal: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.white },
  roomContent: { paddingHorizontal: 18, paddingBottom: 6 },

  // ── Position Row ──
  posRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800 + "80",
  },
  posLeftCol: {
    alignItems: "flex-start",
    gap: 4,
    marginRight: 10,
    minWidth: 48,
  },
  posNr: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 11,
    color: Colors.raw.amber500,
  },
  qtyBadge: {
    backgroundColor: Colors.raw.zinc800,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  qtyBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.raw.zinc300,
  },
  posCenter: { flex: 1, marginRight: 8 },
  posTitle: { fontFamily: "Inter_700Bold", fontSize: 17, color: Colors.raw.white, marginBottom: 4 },
  posLongText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.raw.zinc400, lineHeight: 20, marginBottom: 5 },
  posDetail: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc500, lineHeight: 18 },
  posTotal: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.white, minWidth: 72, textAlign: "right" },
  posActions: { flexDirection: "row", marginLeft: 6, gap: 2 },
  posActionBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 8 },

  // ── Add Position Button ──
  addPosBtn: { paddingVertical: 14, paddingHorizontal: 12 },
  addPosDash: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700 + "80",
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 10,
  },
  addPosBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.amber500 },

  // ── Add Room Button ──
  addRoomBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.raw.zinc700 + "80",
    borderStyle: "dashed",
    paddingVertical: 18,
    marginTop: 4,
  },
  addRoomBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.amber500 },

  // ── Sticky Footer (collapsible) ──
  stickyFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.raw.zinc900 + "FA",
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  footerSlimBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerSlimLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  footerSlimBrutto: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 17,
    color: Colors.raw.white,
  },
  footerSlimActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    alignItems: "center",
    justifyContent: "center",
  },
  footerSaveIconBtn: {
    backgroundColor: Colors.raw.amber500,
    borderColor: Colors.raw.amber500,
  },
  footerExpandedArea: {
    marginTop: 10,
  },
  footerSummary: { marginBottom: 12 },
  footerSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  footerLabel: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc500 },
  footerLabelBold: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.zinc300 },
  footerValue: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc300 },
  footerDivider: { height: 1, backgroundColor: Colors.raw.zinc700 + "60", marginVertical: 6 },
  footerTotal: { fontFamily: "Inter_800ExtraBold", fontSize: 18, color: Colors.raw.white },
  footerMargin: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  marginDot: { width: 7, height: 7, borderRadius: 4 },
  // (old footerBtns/previewBtn/pdfBtn/saveBtn removed — replaced by footerIconBtn)

  // ── Menu Modal ──
  menuOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  menuSheet: {
    position: "absolute",
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 14,
    paddingVertical: 6,
    minWidth: 210,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  menuItemText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.white },
});
