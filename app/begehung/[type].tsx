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
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useState, useCallback, useMemo } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface CheckItem {
  id: string;
  text: string;
  checked: boolean;
  note?: string;
}

interface Mangel {
  id: string;
  title: string;
  description: string;
  status: "offen" | "arbeit" | "behoben";
  assigned?: string;
}

type PosStatus = "offen" | "arbeit" | "erledigt" | "mangel";

interface AuftragPosition {
  id: string;
  nr: string;
  title: string;
  desc: string;
  qty: number;
  unit: string;
  price: number;
  trade: string;
  status: PosStatus;
  note?: string;
  mangelText?: string;
  isZusatz?: boolean;
}

interface AuftragRoom {
  id: string;
  icon: string;
  name: string;
  positions: AuftragPosition[];
}

interface BaustelleMaterial {
  id: string;
  name: string;
  supplier: string;
  qty: number;
  unit: string;
  status: "offen" | "bestellt" | "geliefert" | "verbraucht";
  deliveryDate?: string;
  note?: string;
  trade: string;
  price: number;
}

const GEWERK_CONFIG: Record<string, { icon: string; iconSet: "ionicons" | "mci" }> = {
  "Sanitär": { icon: "water", iconSet: "ionicons" },
  "Heizung": { icon: "flame", iconSet: "ionicons" },
  "Fliesen": { icon: "apps", iconSet: "ionicons" },
  "Elektro": { icon: "flash", iconSet: "ionicons" },
  "Maler": { icon: "color-palette", iconSet: "ionicons" },
  "Tischler": { icon: "hammer", iconSet: "ionicons" },
  "Boden": { icon: "layers", iconSet: "ionicons" },
  "Allgemein": { icon: "cube", iconSet: "ionicons" },
};

const STATUS_CONFIG: Record<PosStatus, { label: string; color: string; icon: string }> = {
  offen: { label: "Offen", color: Colors.raw.zinc600, icon: "radio-button-off" },
  arbeit: { label: "In Arbeit", color: Colors.raw.amber500, icon: "time" },
  erledigt: { label: "Erledigt", color: Colors.raw.emerald500, icon: "checkmark-circle" },
  mangel: { label: "Mangel", color: Colors.raw.rose500, icon: "alert-circle" },
};

const STATUS_ORDER: PosStatus[] = ["offen", "arbeit", "erledigt", "mangel"];

const MAT_STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  offen: { label: "Offen", color: Colors.raw.zinc600, icon: "help-circle-outline" },
  bestellt: { label: "Bestellt", color: Colors.raw.amber500, icon: "cart" },
  geliefert: { label: "Geliefert", color: Colors.raw.emerald500, icon: "checkmark-circle" },
  verbraucht: { label: "Verbraucht", color: Colors.raw.zinc500, icon: "archive" },
};

const CHECKLISTS: Record<string, CheckItem[]> = {
  erstbegehung: [
    { id: "e1", text: "Wohnung begehbar", checked: true },
    { id: "e2", text: "Schl\u00FCssel erhalten", checked: true },
    { id: "e3", text: "Z\u00E4hlerst\u00E4nde notiert", checked: true },
    { id: "e4", text: "Fenster gepr\u00FCft", checked: true },
    { id: "e5", text: "Elektro gepr\u00FCft", checked: false },
    { id: "e6", text: "Sanit\u00E4r gepr\u00FCft", checked: false },
    { id: "e7", text: "B\u00F6den begutachtet", checked: false },
    { id: "e8", text: "W\u00E4nde begutachtet", checked: false },
    { id: "e9", text: "T\u00FCren gepr\u00FCft", checked: false },
    { id: "e10", text: "Aufma\u00DF erstellt", checked: false },
  ],
  zwischenbegehung: [
    { id: "z1", text: "Arbeitsfortschritt gepr\u00FCft", checked: true },
    { id: "z2", text: "Qualit\u00E4t kontrolliert", checked: true },
    { id: "z3", text: "M\u00E4ngel dokumentiert", checked: true },
    { id: "z4", text: "Zeitplan besprochen", checked: true },
    { id: "z5", text: "Material vor Ort gepr\u00FCft", checked: true },
    { id: "z6", text: "Nachtr\u00E4ge identifiziert", checked: true },
    { id: "z7", text: "Fotos erstellt", checked: true },
    { id: "z8", text: "Protokoll angelegt", checked: true },
    { id: "z9", text: "N\u00E4chste Schritte definiert", checked: false },
    { id: "z10", text: "R\u00FCckmeldung Auftraggeber", checked: false },
    { id: "z11", text: "Sicherheit gepr\u00FCft", checked: false },
    { id: "z12", text: "Sauberkeit gepr\u00FCft", checked: false },
  ],
  abnahme: [
    { id: "a1", text: "Alle Positionen fertig", checked: false },
    { id: "a2", text: "M\u00E4ngelliste erstellt", checked: false },
    { id: "a3", text: "Z\u00E4hlerst\u00E4nde \u00DCbergabe", checked: false },
    { id: "a4", text: "Schl\u00FCssel \u00FCbergeben", checked: false },
    { id: "a5", text: "Abnahmeprotokoll unterschrieben", checked: false },
  ],
};

const MAENGEL: Mangel[] = [
  {
    id: "m1",
    title: "Wasserfleck Decke K\u00FCche",
    description: "Maler muss nacharbeiten",
    status: "offen",
    assigned: "Mehmet",
  },
  {
    id: "m2",
    title: "Silikonfuge Bad undicht",
    description: "Sanit\u00E4r pr\u00FCfen lassen",
    status: "arbeit",
    assigned: "Ali",
  },
  {
    id: "m3",
    title: "Kratzer T\u00FCrrahmen Flur",
    description: "Lackierung ausbessern",
    status: "behoben",
  },
];

const MANGEL_STATUS: Record<string, { label: string; color: string }> = {
  offen: { label: "Offen", color: Colors.raw.rose500 },
  arbeit: { label: "In Arbeit", color: Colors.raw.amber500 },
  behoben: { label: "Behoben", color: Colors.raw.emerald500 },
};

const TYPE_LABELS: Record<string, { title: string; status: string; statusColor: string; date: string }> = {
  erstbegehung: {
    title: "Erstbegehung",
    status: "Erledigt",
    statusColor: Colors.raw.emerald500,
    date: "03.02.2026 \u2022 09:00 Uhr",
  },
  zwischenbegehung: {
    title: "Zwischenbegehung",
    status: "In Bearbeitung",
    statusColor: Colors.raw.amber500,
    date: "10.02.2026 \u2022 14:30 Uhr",
  },
  abnahme: {
    title: "Abnahme",
    status: "Nicht geplant",
    statusColor: Colors.raw.zinc600,
    date: "Noch kein Termin",
  },
};

interface KatalogPosition {
  nr: string;
  text: string;
  gewerk: string;
  preis: number;
}

const KATALOG_POSITIONEN: KatalogPosition[] = [
  { nr: "1.1", text: "Deckenanstrich streichen", gewerk: "Maler", preis: 99.00 },
  { nr: "1.4", text: "Putzsch\u00E4den Decke instand setzen", gewerk: "Maler", preis: 60.16 },
  { nr: "1.5", text: "Rauhfasertapete Decke", gewerk: "Maler", preis: 123.74 },
  { nr: "2.1", text: "Tapeten entfernen und W\u00E4nde gl\u00E4tten", gewerk: "Maler", preis: 185.63 },
  { nr: "2.4", text: "Nikotin Isoliergrund streichen", gewerk: "Maler", preis: 185.63 },
  { nr: "5.4", text: "Estrich spachteln und ausgleichen", gewerk: "Boden", preis: 143.40 },
  { nr: "5.6", text: "PVC Design-Belag verlegen", gewerk: "Boden", preis: 610.85 },
  { nr: "10.2", text: "Fensterbank liefern und montieren", gewerk: "Tischler", preis: 131.44 },
  { nr: "16.1", text: "T\u00FCrblatt lackieren", gewerk: "Tischler", preis: 74.25 },
  { nr: "20.2", text: "Flachheizk\u00F6rper lackieren", gewerk: "Heizung", preis: 61.88 },
  { nr: "29.1", text: "Lichtschalter liefern und montieren", gewerk: "Elektro", preis: 24.16 },
  { nr: "30.2", text: "Doppelsteckdose liefern und montieren", gewerk: "Elektro", preis: 32.21 },
];

const INITIAL_ROOMS: AuftragRoom[] = [
  {
    id: "r1",
    icon: "water",
    name: "Bad",
    positions: [
      { id: "p1", nr: "01", title: "Wandfliesen Bad", desc: "Wandfliesen im D\u00FCnnbett verlegen inkl. Grundierung, Kleber und Verfugung.", qty: 28, unit: "m\u00B2", price: 54.4, trade: "Fliesen", status: "erledigt" },
      { id: "p2", nr: "02", title: "Bodenfliesen Bad", desc: "Bodenfliesen im D\u00FCnnbett verlegen inkl. Grundierung, Kleber und Verfugung.", qty: 6, unit: "m\u00B2", price: 70, trade: "Fliesen", status: "erledigt" },
      { id: "p3", nr: "03", title: "Waschtisch montieren", desc: "Waschtisch inkl. Einhandmischer und Siphon montieren.", qty: 1, unit: "Stk", price: 180, trade: "Sanit\u00E4r", status: "arbeit" },
      { id: "p4", nr: "04", title: "WC montieren", desc: "Wand-WC inkl. Bet\u00E4tigungsplatte und Anschluss montieren.", qty: 1, unit: "Stk", price: 220, trade: "Sanit\u00E4r", status: "offen" },
      { id: "p5", nr: "05", title: "Silikonfugen", desc: "Silikonfugen erneuern, Altsilikon entfernen.", qty: 15, unit: "lfm", price: 8.5, trade: "Fliesen", status: "offen" },
      { id: "p6", nr: "06", title: "Decke streichen", desc: "Deckenfl. mit Dispersionsfarbe streichen.", qty: 6, unit: "m\u00B2", price: 5.2, trade: "Maler", status: "offen" },
    ],
  },
  {
    id: "r2",
    icon: "restaurant",
    name: "K\u00FCche",
    positions: [
      { id: "p7", nr: "01", title: "W\u00E4nde tapezieren (Vlies)", desc: "Malervlies glatt auf vorbereiteten Untergrund tapezieren.", qty: 32, unit: "m\u00B2", price: 9.6, trade: "Maler", status: "erledigt" },
      { id: "p8", nr: "02", title: "W\u00E4nde streichen", desc: "Wandfl\u00E4chen streichen mit Dispersionsfarbe, deckend.", qty: 32, unit: "m\u00B2", price: 4.8, trade: "Maler", status: "erledigt" },
      { id: "p9", nr: "03", title: "Decke streichen", desc: "Deckenfl\u00E4chen mit Dispersionsfarbe streichen.", qty: 12, unit: "m\u00B2", price: 5.2, trade: "Maler", status: "arbeit" },
      { id: "p10", nr: "04", title: "Boden schleifen", desc: "Parkettboden maschinell schleifen.", qty: 12, unit: "m\u00B2", price: 38, trade: "Boden", status: "offen" },
      { id: "p11", nr: "05", title: "Boden versiegeln", desc: "Parkettboden 2x versiegeln mit Parkettlack.", qty: 12, unit: "m\u00B2", price: 38, trade: "Boden", status: "offen" },
    ],
  },
  {
    id: "r3",
    icon: "home",
    name: "Wohnzimmer",
    positions: [
      { id: "p12", nr: "01", title: "Altbelag entfernen", desc: "Vorhandenen Bodenbelag entfernen und entsorgen.", qty: 25, unit: "m\u00B2", price: 6.5, trade: "Boden", status: "erledigt" },
      { id: "p13", nr: "02", title: "Untergrund spachteln", desc: "Untergrund ausgleichen mit Nivelliermasse.", qty: 25, unit: "m\u00B2", price: 8, trade: "Boden", status: "erledigt" },
      { id: "p14", nr: "03", title: "W\u00E4nde spachteln Q3", desc: "Spachtelarbeiten Q3 auf Gipskartonplatten.", qty: 45, unit: "m\u00B2", price: 6.8, trade: "Maler", status: "arbeit" },
      { id: "p15", nr: "04", title: "W\u00E4nde streichen 2x", desc: "Dispersionsfarbe deckend in zwei Anstrichen.", qty: 45, unit: "m\u00B2", price: 4.8, trade: "Maler", status: "offen" },
      { id: "p16", nr: "05", title: "Decke streichen", desc: "Deckenfl\u00E4chen streichen.", qty: 25, unit: "m\u00B2", price: 5.2, trade: "Maler", status: "offen" },
      { id: "p17", nr: "06", title: "Laminat verlegen", desc: "Laminat NK32 schwimmend verlegen inkl. Trittschalld\u00E4mmung.", qty: 25, unit: "m\u00B2", price: 24.5, trade: "Boden", status: "offen" },
      { id: "p18", nr: "07", title: "Sockelleisten montieren", desc: "Sockelleisten aus MDF montieren.", qty: 20, unit: "lfm", price: 12.5, trade: "Boden", status: "offen" },
      { id: "p19", nr: "08", title: "Endreinigung", desc: "Endreinigung nach Abschluss aller Arbeiten.", qty: 1, unit: "Pauschal", price: 180, trade: "Allg.", status: "offen" },
    ],
  },
  {
    id: "r4",
    icon: "bed",
    name: "Schlafzimmer",
    positions: [
      { id: "p20", nr: "01", title: "Raufaser tapezieren", desc: "Raufasertapete auf vorbereiteten Untergrund.", qty: 38, unit: "m\u00B2", price: 8.4, trade: "Maler", status: "offen" },
      { id: "p21", nr: "02", title: "W\u00E4nde streichen", desc: "Dispersionsfarbe deckend.", qty: 38, unit: "m\u00B2", price: 4.8, trade: "Maler", status: "offen" },
      { id: "p22", nr: "03", title: "Decke streichen", desc: "Deckenfl\u00E4chen streichen.", qty: 14, unit: "m\u00B2", price: 5.2, trade: "Maler", status: "offen" },
      { id: "p23", nr: "04", title: "Laminat verlegen", desc: "Laminat NK32 schwimmend verlegen.", qty: 14, unit: "m\u00B2", price: 24.5, trade: "Boden", status: "offen" },
    ],
  },
];

const INITIAL_MATERIALS: BaustelleMaterial[] = [
  { id: "mat1", name: "Erfurt Vlies Rauhfaser 52", supplier: "MEGA", qty: 12, unit: "Rollen", status: "geliefert", deliveryDate: "03.02.", trade: "Maler", price: 156 },
  { id: "mat2", name: "Dispersionsfarbe wei\u00DF 12,5L", supplier: "MEGA", qty: 4, unit: "Eimer", status: "geliefert", deliveryDate: "03.02.", trade: "Maler", price: 220 },
  { id: "mat3", name: "Wandfliesen 30\u00D760 wei\u00DF matt", supplier: "Fliesenmax", qty: 32, unit: "m\u00B2", status: "geliefert", deliveryDate: "04.02.", trade: "Fliesen", price: 768 },
  { id: "mat4", name: "Bodenfliesen 60\u00D760 grau", supplier: "Fliesenmax", qty: 8, unit: "m\u00B2", status: "geliefert", deliveryDate: "04.02.", trade: "Fliesen", price: 264 },
  { id: "mat5", name: "Fliesenkleber Flex S1 25kg", supplier: "Fliesenmax", qty: 6, unit: "Sack", status: "verbraucht", trade: "Fliesen", price: 108 },
  { id: "mat6", name: "Tiefengrund LF 10L", supplier: "MEGA", qty: 2, unit: "Kanister", status: "bestellt", deliveryDate: "10.02.", trade: "Maler", price: 58 },
  { id: "mat7", name: "Laminat Eiche Natur NK32", supplier: "Delmes", qty: 42, unit: "m\u00B2", status: "bestellt", deliveryDate: "12.02.", trade: "Boden", price: 1260 },
  { id: "mat8", name: "Trittschalld\u00E4mmung 2mm", supplier: "Delmes", qty: 42, unit: "m\u00B2", status: "bestellt", deliveryDate: "12.02.", trade: "Boden", price: 126 },
  { id: "mat9", name: "Sockelleisten Eiche 58mm", supplier: "Delmes", qty: 45, unit: "lfm", status: "offen", trade: "Boden", price: 315 },
  { id: "mat10", name: "Silikon Bad transparent", supplier: "MEGA", qty: 3, unit: "Kartuschen", status: "offen", trade: "Sanit\u00E4r", price: 24 },
  { id: "mat11", name: "Parkettlack seidenmatt 5L", supplier: "Brillux", qty: 2, unit: "Gebinde", status: "offen", trade: "Maler", price: 140 },
  { id: "mat12", name: "Spachtelmasse Q3 fein 25kg", supplier: "MEGA", qty: 4, unit: "Sack", status: "offen", trade: "Maler", price: 96 },
];

function formatEuro(amount: number): string {
  return "\u20AC" + amount.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function CheckboxItem({
  item,
  onToggle,
}: {
  item: CheckItem;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(item.note || "");
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleToggle = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    scale.value = withSequence(
      withTiming(1.05, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
    onToggle();
  };

  return (
    <Animated.View style={[checkStyles.container, animStyle]}>
      <Pressable style={checkStyles.row} onPress={handleToggle}>
        <View
          style={[
            checkStyles.checkbox,
            item.checked && checkStyles.checkboxChecked,
          ]}
        >
          {item.checked && (
            <Ionicons name="checkmark" size={16} color="#000" />
          )}
        </View>
        <Text
          style={[
            checkStyles.text,
            item.checked && checkStyles.textChecked,
          ]}
        >
          {item.text}
        </Text>
        <Pressable
          onPress={() => setExpanded(!expanded)}
          hitSlop={8}
        >
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={Colors.raw.zinc600}
          />
        </Pressable>
      </Pressable>
      {expanded && (
        <View style={checkStyles.expandedArea}>
          <TextInput
            style={checkStyles.noteInput}
            placeholder="Notiz hinzuf\u00FCgen..."
            placeholderTextColor={Colors.raw.zinc600}
            value={note}
            onChangeText={setNote}
            multiline
          />
          <Pressable
            style={({ pressed }) => [
              checkStyles.photoBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="camera" size={18} color={Colors.raw.amber500} />
            <Text style={checkStyles.photoBtnText}>Foto</Text>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}

const checkStyles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.raw.zinc600,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.raw.emerald500,
    borderColor: Colors.raw.emerald500,
  },
  text: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.white,
    flex: 1,
  },
  textChecked: {
    color: Colors.raw.zinc500,
    textDecorationLine: "line-through",
  },
  expandedArea: {
    paddingBottom: 14,
    paddingLeft: 40,
    gap: 10,
  },
  noteInput: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 10,
    padding: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.white,
    minHeight: 44,
    textAlignVertical: "top",
  },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  photoBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.amber500,
  },
});

function MangelCard({ mangel }: { mangel: Mangel }) {
  const cfg = MANGEL_STATUS[mangel.status];
  return (
    <View style={mangelStyles.card}>
      <View style={mangelStyles.photoPlaceholder}>
        <Ionicons name="image" size={24} color={Colors.raw.zinc600} />
      </View>
      <View style={mangelStyles.body}>
        <Text style={mangelStyles.title}>{mangel.title}</Text>
        <Text style={mangelStyles.desc}>{mangel.description}</Text>
        <View style={mangelStyles.meta}>
          <View style={[mangelStyles.statusPill, { backgroundColor: cfg.color + "18" }]}>
            <View style={[mangelStyles.statusDot, { backgroundColor: cfg.color }]} />
            <Text style={[mangelStyles.statusLabel, { color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>
          {mangel.assigned ? (
            <Text style={mangelStyles.assigned}>{mangel.assigned}</Text>
          ) : (
            <Text style={mangelStyles.unassigned}>Nicht zugewiesen</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const mangelStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  photoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.raw.zinc800,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.white,
    marginBottom: 3,
  },
  desc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc400,
    marginBottom: 8,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  assigned: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc400,
  },
  unassigned: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc600,
    fontStyle: "italic",
  },
});

function AnimatedPosItem({
  pos,
  onCycleStatus,
  onLongPress,
}: {
  pos: AuftragPosition;
  onCycleStatus: () => void;
  onLongPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const cfg = STATUS_CONFIG[pos.status];
  const total = pos.qty * pos.price;

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    scale.value = withSequence(
      withTiming(0.96, { duration: 80 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
    onCycleStatus();
  };

  return (
    <Animated.View style={[posStyles.container, animStyle]}>
      <Pressable
        style={posStyles.row}
        onPress={handlePress}
        onLongPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          }
          onLongPress();
        }}
        testID={`pos-${pos.id}`}
      >
        <View style={posStyles.statusCol}>
          <Ionicons name={cfg.icon as any} size={24} color={cfg.color} />
        </View>
        <View style={posStyles.body}>
          <View style={posStyles.titleRow}>
            <Text style={posStyles.nr}>{pos.nr}</Text>
            <Text style={posStyles.title} numberOfLines={1}>{pos.title}</Text>
          </View>
          <View style={posStyles.metaRow}>
            <Text style={posStyles.meta}>{pos.qty} {pos.unit}</Text>
            <View style={posStyles.dot} />
            <Text style={posStyles.meta}>{pos.trade}</Text>
            <View style={posStyles.dot} />
            <Text style={posStyles.price}>{formatEuro(total)}</Text>
          </View>
          {pos.mangelText && (
            <View style={posStyles.mangelRow}>
              <Ionicons name="alert-circle" size={12} color={Colors.raw.rose500} />
              <Text style={posStyles.mangelText} numberOfLines={1}>{pos.mangelText}</Text>
            </View>
          )}
          {pos.note && (
            <Text style={posStyles.noteText} numberOfLines={1}>{pos.note}</Text>
          )}
        </View>
        {pos.isZusatz ? (
          <View style={[posStyles.statusBadge, { backgroundColor: Colors.raw.amber500 + "18" }]}>
            <Text style={[posStyles.statusText, { color: Colors.raw.amber500 }]}>ZUSATZ</Text>
          </View>
        ) : (
          <View style={[posStyles.statusBadge, { backgroundColor: cfg.color + "18" }]}>
            <Text style={[posStyles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const posStyles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800 + "80",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 12,
  },
  statusCol: {
    width: 28,
    alignItems: "center",
  },
  body: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  nr: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 11,
    color: Colors.raw.amber500,
    minWidth: 22,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.white,
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  meta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.raw.zinc700,
  },
  price: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.zinc400,
  },
  mangelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  mangelText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.rose400,
    flex: 1,
  },
  noteText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginTop: 3,
    fontStyle: "italic",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

function AuftragMangelSheet({
  visible,
  onClose,
  onSave,
  position,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
  position: AuftragPosition | null;
}) {
  const [text, setText] = useState("");
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={msStyles.overlay}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={[msStyles.sheet, { paddingBottom: bottomInset + 20 }]}>
          <View style={msStyles.handle} />
          <View style={msStyles.header}>
            <Text style={msStyles.title}>Mangel erfassen</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={Colors.raw.zinc500} />
            </Pressable>
          </View>
          {position && (
            <View style={msStyles.posInfo}>
              <Text style={msStyles.posNr}>{position.nr}</Text>
              <Text style={msStyles.posTitle}>{position.title}</Text>
            </View>
          )}
          <Text style={msStyles.label}>Beschreibung des Mangels</Text>
          <TextInput
            style={msStyles.input}
            placeholder="Was ist das Problem?"
            placeholderTextColor={Colors.raw.zinc600}
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
            testID="mangel-input"
          />
          <View style={msStyles.actions}>
            <Pressable
              style={msStyles.photoBtn}
              onPress={() => {}}
            >
              <Ionicons name="camera" size={20} color={Colors.raw.amber500} />
              <Text style={msStyles.photoBtnText}>Foto</Text>
            </Pressable>
            <Pressable
              style={[msStyles.saveBtn, !text.trim() && { opacity: 0.4 }]}
              disabled={!text.trim()}
              onPress={() => {
                onSave(text.trim());
                setText("");
              }}
              testID="mangel-save-btn"
            >
              <Ionicons name="checkmark" size={20} color="#000" />
              <Text style={msStyles.saveBtnText}>Mangel speichern</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const msStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.raw.zinc900, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.raw.zinc600, alignSelf: "center", marginTop: 12, marginBottom: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontFamily: "Inter_800ExtraBold", fontSize: 20, color: Colors.raw.white },
  posInfo: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.raw.zinc800, borderRadius: 10, padding: 12, marginBottom: 16 },
  posNr: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 12, color: Colors.raw.amber500 },
  posTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.white, flex: 1 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc500, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  input: { backgroundColor: Colors.raw.zinc800, borderRadius: 12, padding: 14, fontFamily: "Inter_400Regular", fontSize: 15, color: Colors.raw.white, minHeight: 100, textAlignVertical: "top", marginBottom: 16 },
  actions: { flexDirection: "row", gap: 10 },
  photoBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.raw.zinc800, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: Colors.raw.zinc700 },
  photoBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.amber500 },
  saveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.raw.amber500, borderRadius: 12, paddingVertical: 14 },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#000" },
});

function AddMaterialSheet({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (mat: BaustelleMaterial) => void;
}) {
  const [name, setName] = useState("");
  const [supplier, setSupplier] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("Stk");
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const UNITS = ["Stk", "m\u00B2", "lfm", "Rollen", "Eimer", "Sack", "Kartuschen", "Kanister", "Gebinde", "Paket"];

  const handleSave = () => {
    if (!name.trim()) return;
    onAdd({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      supplier: supplier.trim() || "\u2013",
      qty: parseFloat(qty) || 1,
      unit,
      status: "offen",
      trade: "Allgemein",
      price: 0,
    });
    setName("");
    setSupplier("");
    setQty("");
    setUnit("Stk");
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={amStyles.overlay}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={[amStyles.sheet, { paddingBottom: bottomInset + 20 }]}>
          <View style={amStyles.handle} />
          <View style={amStyles.header}>
            <Text style={amStyles.title}>Material hinzuf\u00FCgen</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={Colors.raw.zinc500} />
            </Pressable>
          </View>

          <Text style={amStyles.label}>Bezeichnung</Text>
          <TextInput
            style={amStyles.input}
            placeholder="z.B. Dispersionsfarbe wei\u00DF"
            placeholderTextColor={Colors.raw.zinc600}
            value={name}
            onChangeText={setName}
            autoFocus
            testID="mat-name-input"
          />

          <Text style={amStyles.label}>Lieferant</Text>
          <TextInput
            style={amStyles.input}
            placeholder="z.B. MEGA"
            placeholderTextColor={Colors.raw.zinc600}
            value={supplier}
            onChangeText={setSupplier}
            testID="mat-supplier-input"
          />

          <View style={amStyles.qtyRow}>
            <View style={{ flex: 1 }}>
              <Text style={amStyles.label}>Menge</Text>
              <TextInput
                style={amStyles.input}
                placeholder="1"
                placeholderTextColor={Colors.raw.zinc600}
                value={qty}
                onChangeText={setQty}
                keyboardType="numeric"
                testID="mat-qty-input"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={amStyles.label}>Einheit</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={amStyles.unitRow}>
                {UNITS.map((u) => (
                  <Pressable
                    key={u}
                    style={[amStyles.unitChip, unit === u && amStyles.unitChipActive]}
                    onPress={() => setUnit(u)}
                  >
                    <Text style={[amStyles.unitChipText, unit === u && amStyles.unitChipTextActive]}>{u}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          <Pressable
            style={[amStyles.saveBtn, !name.trim() && { opacity: 0.4 }]}
            disabled={!name.trim()}
            onPress={handleSave}
            testID="mat-save-btn"
          >
            <Ionicons name="add" size={20} color="#000" />
            <Text style={amStyles.saveBtnText}>Hinzuf\u00FCgen</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const amStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.raw.zinc900, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.raw.zinc600, alignSelf: "center", marginTop: 12, marginBottom: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontFamily: "Inter_800ExtraBold", fontSize: 20, color: Colors.raw.white },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.zinc500, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 },
  input: { backgroundColor: Colors.raw.zinc800, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.raw.white, marginBottom: 14 },
  qtyRow: { flexDirection: "row", gap: 12 },
  unitRow: { gap: 6, paddingBottom: 14 },
  unitChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.raw.zinc800 },
  unitChipActive: { backgroundColor: Colors.raw.amber500 },
  unitChipText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.zinc400 },
  unitChipTextActive: { color: "#000" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.raw.amber500, borderRadius: 14, paddingVertical: 14, marginTop: 6 },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#000" },
});

function SectionCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[sectionStyles.card, style]}>{children}</View>;
}

function SectionHeader({
  title,
  badge,
  rightIcon,
  rightLabel,
  onRightPress,
}: {
  title: string;
  badge?: string;
  rightIcon?: string;
  rightLabel?: string;
  onRightPress?: () => void;
}) {
  return (
    <View style={sectionStyles.headerRow}>
      <View style={sectionStyles.headerLeft}>
        <Text style={sectionStyles.headerTitle}>{title}</Text>
        {badge && (
          <View style={sectionStyles.badge}>
            <Text style={sectionStyles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      {(rightIcon || rightLabel) && (
        <Pressable
          onPress={onRightPress}
          style={({ pressed }) => [
            sectionStyles.rightBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          {rightIcon && (
            <Ionicons name={rightIcon as any} size={18} color={Colors.raw.amber500} />
          )}
          {rightLabel && (
            <Text style={sectionStyles.rightLabel}>{rightLabel}</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.raw.white,
  },
  badge: {
    backgroundColor: Colors.raw.zinc700,
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },
  badgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: Colors.raw.zinc300,
  },
  rightBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  rightLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.amber500,
  },
});

export default function BegehungDetailScreen() {
  const { type, tab } = useLocalSearchParams<{ type: string; tab?: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const typeKey = (type || "zwischenbegehung").toLowerCase();
  const meta = TYPE_LABELS[typeKey] || TYPE_LABELS.zwischenbegehung;
  const showMaengel = typeKey !== "erstbegehung";

  const initialTab = tab === "auftrag" ? "auftrag" : tab === "material" ? "material" : "checkliste";
  const [activeTab, setActiveTab] = useState<"checkliste" | "auftrag" | "material">(initialTab);

  const [items, setItems] = useState<CheckItem[]>(
    () => CHECKLISTS[typeKey] || CHECKLISTS.zwischenbegehung
  );
  const [notizen, setNotizen] = useState("");

  const [rooms, setRooms] = useState<AuftragRoom[]>(INITIAL_ROOMS);
  const [materials, setMaterials] = useState<BaustelleMaterial[]>(INITIAL_MATERIALS);
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set(["r1", "r2"]));
  const [filterStatus, setFilterStatus] = useState<PosStatus | "alle">("alle");
  const [matFilter, setMatFilter] = useState<string>("alle");
  const [mangelSheet, setMangelSheet] = useState<AuftragPosition | null>(null);
  const [addMatVisible, setAddMatVisible] = useState(false);
  const [mangelRoomId, setMangelRoomId] = useState<string | null>(null);
  const [expandedGewerke, setExpandedGewerke] = useState<Set<string>>(new Set());

  const [zusatzOpenRoom, setZusatzOpenRoom] = useState<string | null>(null);
  const [zusatzSearch, setZusatzSearch] = useState("");
  const [zusatzSelected, setZusatzSelected] = useState<KatalogPosition | null>(null);
  const [zusatzNote, setZusatzNote] = useState("");
  const [zusatzPhotoTaken, setZusatzPhotoTaken] = useState(false);

  const checkedCount = useMemo(() => items.filter((i) => i.checked).length, [items]);
  const totalCount = items.length;
  const allDone = checkedCount === totalCount;
  const progressPercent = Math.round((checkedCount / totalCount) * 100);

  const toggleItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  }, []);

  const toggleRoom = useCallback((roomId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });
  }, []);

  const cycleStatus = useCallback((roomId: string, posId: string) => {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          positions: room.positions.map((pos) => {
            if (pos.id !== posId) return pos;
            const currentIdx = STATUS_ORDER.indexOf(pos.status);
            const nextStatus = STATUS_ORDER[(currentIdx + 1) % 3];
            return { ...pos, status: nextStatus, mangelText: undefined };
          }),
        };
      })
    );
  }, []);

  const setMangel = useCallback((roomId: string, posId: string, text: string) => {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          positions: room.positions.map((pos) => {
            if (pos.id !== posId) return pos;
            return { ...pos, status: "mangel" as PosStatus, mangelText: text };
          }),
        };
      })
    );
    setMangelSheet(null);
  }, []);

  const zusatzSearchResults = useMemo(() => {
    if (!zusatzSearch.trim()) return [];
    const q = zusatzSearch.toLowerCase();
    return KATALOG_POSITIONEN.filter((k) => k.text.toLowerCase().includes(q)).slice(0, 5);
  }, [zusatzSearch]);

  const openZusatzForm = useCallback((roomId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setZusatzOpenRoom(roomId);
    setZusatzSearch("");
    setZusatzSelected(null);
    setZusatzNote("");
    setZusatzPhotoTaken(false);
  }, []);

  const closeZusatzForm = useCallback(() => {
    setZusatzOpenRoom(null);
    setZusatzSearch("");
    setZusatzSelected(null);
    setZusatzNote("");
    setZusatzPhotoTaken(false);
  }, []);

  const submitZusatzleistung = useCallback(() => {
    if (!zusatzSelected || !zusatzPhotoTaken || !zusatzOpenRoom) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const roomId = zusatzOpenRoom;
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id !== roomId) return room;
        const nextNr = String(room.positions.length + 1).padStart(2, "0");
        const newPos: AuftragPosition = {
          id: `zusatz_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          nr: nextNr,
          title: zusatzSelected!.text,
          desc: `Zusatzleistung: ${zusatzSelected!.nr} ${zusatzSelected!.text}`,
          qty: 1,
          unit: "Pauschal",
          price: zusatzSelected!.preis,
          trade: zusatzSelected!.gewerk,
          status: "offen",
          note: zusatzNote || undefined,
          isZusatz: true,
        };
        return { ...room, positions: [...room.positions, newPos] };
      })
    );
    closeZusatzForm();
  }, [zusatzSelected, zusatzPhotoTaken, zusatzOpenRoom, zusatzNote, closeZusatzForm]);

  const cycleMaterialStatus = useCallback((matId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const matOrder: BaustelleMaterial["status"][] = ["offen", "bestellt", "geliefert", "verbraucht"];
    setMaterials((prev) =>
      prev.map((m) => {
        if (m.id !== matId) return m;
        const idx = matOrder.indexOf(m.status);
        return { ...m, status: matOrder[(idx + 1) % matOrder.length] };
      })
    );
  }, []);

  const stats = useMemo(() => {
    let total = 0;
    let erledigt = 0;
    let arbeit = 0;
    let mangel = 0;
    let sollSumme = 0;
    let istSumme = 0;

    rooms.forEach((room) => {
      room.positions.forEach((pos) => {
        total++;
        const posTotal = pos.qty * pos.price;
        sollSumme += posTotal;
        if (pos.status === "erledigt") {
          erledigt++;
          istSumme += posTotal;
        }
        if (pos.status === "arbeit") {
          arbeit++;
          istSumme += posTotal * 0.5;
        }
        if (pos.status === "mangel") mangel++;
      });
    });

    return {
      total,
      erledigt,
      arbeit,
      mangel,
      offen: total - erledigt - arbeit - mangel,
      percent: total > 0 ? Math.round((erledigt / total) * 100) : 0,
      sollSumme,
      istSumme,
    };
  }, [rooms]);

  const matStats = useMemo(() => {
    const counts: Record<string, number> = { offen: 0, bestellt: 0, geliefert: 0, verbraucht: 0 };
    materials.forEach((m) => counts[m.status]++);
    return counts;
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    if (matFilter === "alle") return materials;
    return materials.filter((m) => m.status === matFilter);
  }, [materials, matFilter]);

  const gewerkGroups = useMemo(() => {
    const groups: Record<string, BaustelleMaterial[]> = {};
    filteredMaterials.forEach((m) => {
      if (!groups[m.trade]) groups[m.trade] = [];
      groups[m.trade].push(m);
    });
    const order = Object.keys(GEWERK_CONFIG);
    return order
      .filter((g) => groups[g] && groups[g].length > 0)
      .map((g) => ({
        trade: g,
        items: groups[g],
        totalPrice: groups[g].reduce((sum, m) => sum + m.price, 0),
        deliveredPercent: groups[g].length > 0
          ? Math.round((groups[g].filter((m) => m.status === "geliefert" || m.status === "verbraucht").length / groups[g].length) * 100)
          : 0,
      }));
  }, [filteredMaterials]);

  const toggleGewerk = useCallback((trade: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedGewerke((prev) => {
      const next = new Set(prev);
      if (next.has(trade)) next.delete(trade);
      else next.add(trade);
      return next;
    });
  }, []);

  const photoCount = 6;

  const renderChecklisteContent = () => (
    <>
      <SectionCard>
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: allDone
                    ? Colors.raw.emerald500
                    : Colors.raw.amber500,
                },
              ]}
            />
          </View>
          <Text style={styles.progressPercent}>{progressPercent}%</Text>
        </View>
        <Text style={styles.progressLabel}>
          {checkedCount} von {totalCount} Punkten erledigt
        </Text>
      </SectionCard>

      <SectionCard>
        <SectionHeader title="Checkliste" badge={`${totalCount}`} />
        {items.map((item) => (
          <CheckboxItem
            key={item.id}
            item={item}
            onToggle={() => toggleItem(item.id)}
          />
        ))}
      </SectionCard>

      <SectionCard>
        <SectionHeader
          title="Fotos"
          badge={`${photoCount}`}
          rightIcon="camera"
          rightLabel="Foto"
        />
        <View style={styles.photoGrid}>
          {Array.from({ length: photoCount }).map((_, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [
                styles.photoTile,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View style={styles.photoPlaceholder}>
                <Ionicons name="image" size={22} color={Colors.raw.zinc600} />
              </View>
              <View style={styles.photoBadge}>
                <Text style={styles.photoBadgeText}>
                  {["K\u00FCche", "Bad", "Flur", "Wohnz.", "Bad", "K\u00FCche"][i]}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.addPhotoBtn,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="camera" size={20} color="#000" />
          <Text style={styles.addPhotoBtnText}>Foto hinzuf\u00FCgen</Text>
        </Pressable>
      </SectionCard>

      {showMaengel && (
        <SectionCard>
          <SectionHeader
            title="M\u00E4ngel"
            badge={`${MAENGEL.length}`}
            rightIcon="add-circle-outline"
            rightLabel="Mangel"
          />
          {MAENGEL.map((m) => (
            <MangelCard key={m.id} mangel={m} />
          ))}
        </SectionCard>
      )}

      <SectionCard>
        <SectionHeader title="Notizen" />
        <TextInput
          style={styles.notizenInput}
          placeholder="Allgemeine Anmerkungen zur Begehung..."
          placeholderTextColor={Colors.raw.zinc600}
          value={notizen}
          onChangeText={setNotizen}
          multiline
          textAlignVertical="top"
        />
      </SectionCard>
    </>
  );

  const renderAuftragContent = () => (
    <>
      <View style={styles.auftragProgressCard}>
        <View style={styles.auftragProgressHeader}>
          <Text style={styles.auftragProgressPercent}>{stats.percent}%</Text>
          <Text style={styles.auftragProgressLabel}>erledigt</Text>
        </View>
        <View style={styles.auftragProgressBar}>
          <View style={[styles.auftragProgressFill, { width: `${stats.percent}%` }]} />
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: Colors.raw.emerald500 }]} />
            <Text style={styles.statValue}>{stats.erledigt}</Text>
            <Text style={styles.statLabel}>Erledigt</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: Colors.raw.amber500 }]} />
            <Text style={styles.statValue}>{stats.arbeit}</Text>
            <Text style={styles.statLabel}>In Arbeit</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: Colors.raw.zinc600 }]} />
            <Text style={styles.statValue}>{stats.offen}</Text>
            <Text style={styles.statLabel}>Offen</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: Colors.raw.rose500 }]} />
            <Text style={styles.statValue}>{stats.mangel}</Text>
            <Text style={styles.statLabel}>M\u00E4ngel</Text>
          </View>
        </View>
        <View style={styles.sollIstRow}>
          <View style={styles.sollIstCol}>
            <Text style={styles.sollIstLabel}>SOLL</Text>
            <Text style={styles.sollIstValue}>{formatEuro(stats.sollSumme)}</Text>
          </View>
          <View style={styles.sollIstDivider} />
          <View style={styles.sollIstCol}>
            <Text style={styles.sollIstLabel}>IST</Text>
            <Text style={[styles.sollIstValue, { color: Colors.raw.emerald500 }]}>{formatEuro(stats.istSumme)}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {([["alle", "Alle", stats.total]] as const).concat(
          STATUS_ORDER.map((s) => [s, STATUS_CONFIG[s].label, rooms.reduce((a, r) => a + r.positions.filter((p) => p.status === s).length, 0)] as const)
        ).map(([key, label, count]) => (
          <Pressable
            key={key}
            style={[styles.filterChip, filterStatus === key && styles.filterChipActive]}
            onPress={() => setFilterStatus(key as any)}
          >
            <Text style={[styles.filterChipText, filterStatus === key && styles.filterChipTextActive]}>
              {label} ({count})
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {rooms.map((room) => {
        const roomPositions = filterStatus === "alle"
          ? room.positions
          : room.positions.filter((p) => p.status === filterStatus);

        if (roomPositions.length === 0 && filterStatus !== "alle") return null;

        const roomDone = room.positions.filter((p) => p.status === "erledigt").length;
        const roomTotal = room.positions.length;
        const roomPercent = roomTotal > 0 ? Math.round((roomDone / roomTotal) * 100) : 0;
        const isExpanded = expandedRooms.has(room.id);

        return (
          <View key={room.id} style={styles.roomCard} testID={`room-${room.id}`}>
            <Pressable
              style={styles.roomHeader}
              onPress={() => toggleRoom(room.id)}
            >
              <View style={styles.roomIconWrap}>
                <Ionicons name={room.icon as any} size={18} color={Colors.raw.amber500} />
              </View>
              <View style={styles.roomInfo}>
                <Text style={styles.roomName}>{room.name}</Text>
                <Text style={styles.roomMeta}>{roomDone}/{roomTotal} erledigt</Text>
              </View>
              <View style={styles.roomProgressWrap}>
                <View style={styles.roomProgressBar}>
                  <View
                    style={[
                      styles.roomProgressFill,
                      {
                        width: `${roomPercent}%`,
                        backgroundColor: roomPercent === 100 ? Colors.raw.emerald500 : Colors.raw.amber500,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.roomProgressText, roomPercent === 100 && { color: Colors.raw.emerald500 }]}>
                  {roomPercent}%
                </Text>
              </View>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={Colors.raw.zinc500}
              />
            </Pressable>

            {isExpanded && (
              <View style={styles.roomBody}>
                {roomPositions.map((pos) => (
                  <AnimatedPosItem
                    key={pos.id}
                    pos={pos}
                    onCycleStatus={() => cycleStatus(room.id, pos.id)}
                    onLongPress={() => {
                      setMangelRoomId(room.id);
                      setMangelSheet(pos);
                    }}
                  />
                ))}
                {roomPositions.length === 0 && (
                  <Text style={styles.emptyRoom}>Keine Positionen mit diesem Filter</Text>
                )}

                {zusatzOpenRoom === room.id ? (
                  <View style={zlStyles.formWrap} testID={`zusatz-form-${room.id}`}>
                    <View style={zlStyles.formHeader}>
                      <Text style={zlStyles.formTitle}>Zusatzleistung erfassen</Text>
                      <Pressable onPress={closeZusatzForm} hitSlop={8} testID="zusatz-close">
                        <Ionicons name="close" size={20} color={Colors.raw.zinc400} />
                      </Pressable>
                    </View>

                    <View style={zlStyles.searchWrap}>
                      <Ionicons name="search" size={16} color={Colors.raw.zinc500} style={{ marginLeft: 12 }} />
                      <TextInput
                        style={zlStyles.searchInput}
                        placeholder="Katalogposition suchen..."
                        placeholderTextColor={Colors.raw.zinc600}
                        value={zusatzSearch}
                        onChangeText={setZusatzSearch}
                        testID="zusatz-search"
                      />
                    </View>

                    {zusatzSearchResults.length > 0 && (
                      <View style={zlStyles.resultsList}>
                        {zusatzSearchResults.map((item) => (
                          <Pressable
                            key={item.nr}
                            style={[
                              zlStyles.resultRow,
                              zusatzSelected?.nr === item.nr && zlStyles.resultRowSelected,
                            ]}
                            onPress={() => {
                              if (Platform.OS !== "web") {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              }
                              setZusatzSelected(item);
                            }}
                            testID={`katalog-${item.nr}`}
                          >
                            <Text style={zlStyles.resultNr}>{item.nr}</Text>
                            <Text style={zlStyles.resultText} numberOfLines={1}>{item.text}</Text>
                            <Text style={zlStyles.resultGewerk}>{item.gewerk}</Text>
                            <Text style={zlStyles.resultPreis}>{formatEuro(item.preis)}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}

                    {zusatzSelected && (
                      <View style={zlStyles.selectedWrap}>
                        <Text style={zlStyles.selectedLabel}>Ausgew{"\u00E4"}hlt:</Text>
                        <Text style={zlStyles.selectedValue}>{zusatzSelected.nr} {zusatzSelected.text}</Text>
                      </View>
                    )}

                    <Text style={zlStyles.fieldLabel}>Anmerkung (optional):</Text>
                    <TextInput
                      style={zlStyles.noteInput}
                      placeholder="Freitext..."
                      placeholderTextColor={Colors.raw.zinc600}
                      value={zusatzNote}
                      onChangeText={setZusatzNote}
                      multiline
                      testID="zusatz-note"
                    />

                    <Pressable
                      style={zlStyles.photoBtn}
                      onPress={() => {
                        if (Platform.OS !== "web") {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setZusatzPhotoTaken(true);
                      }}
                      testID="zusatz-photo-btn"
                    >
                      <Ionicons name="camera" size={18} color={Colors.raw.amber500} />
                      <Text style={zlStyles.photoBtnText}>Foto aufnehmen</Text>
                    </Pressable>
                    {zusatzPhotoTaken ? (
                      <View style={zlStyles.photoPreview}>
                        <View style={zlStyles.photoPlaceholder}>
                          <Ionicons name="image" size={24} color={Colors.raw.zinc500} />
                          <Text style={zlStyles.photoFilename}>foto_001.jpg</Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={zlStyles.pflichtText}>* Pflichtfeld</Text>
                    )}

                    <Pressable
                      style={[
                        zlStyles.submitBtn,
                        !(zusatzSelected && zusatzPhotoTaken) && zlStyles.submitBtnDisabled,
                      ]}
                      onPress={submitZusatzleistung}
                      disabled={!(zusatzSelected && zusatzPhotoTaken)}
                      testID="zusatz-submit"
                    >
                      <Text style={[
                        zlStyles.submitBtnText,
                        !(zusatzSelected && zusatzPhotoTaken) && zlStyles.submitBtnTextDisabled,
                      ]}>Zusatzleistung hinzuf{"\u00FC"}gen</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={zlStyles.trigger}
                    onPress={() => openZusatzForm(room.id)}
                    testID={`zusatz-trigger-${room.id}`}
                  >
                    <Ionicons name="add" size={18} color={Colors.raw.amber500} />
                    <Text style={zlStyles.triggerText}>Zusatzleistung erfassen</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        );
      })}
    </>
  );

  const renderMaterialContent = () => (
    <>
      <View style={styles.matSummary}>
        {(["offen", "bestellt", "geliefert", "verbraucht"] as const).map((s) => {
          const cfg = MAT_STATUS_CONFIG[s];
          return (
            <Pressable
              key={s}
              style={[styles.matSumCard, matFilter === s && { borderColor: cfg.color }]}
              onPress={() => setMatFilter(matFilter === s ? "alle" : s)}
            >
              <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
              <Text style={[styles.matSumCount, { color: cfg.color }]}>{matStats[s]}</Text>
              <Text style={styles.matSumLabel}>{cfg.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.matHeader}>
        <Text style={styles.matTitle}>Materialliste</Text>
        <Pressable
          style={styles.matAddBtn}
          onPress={() => setAddMatVisible(true)}
          testID="add-material-btn"
        >
          <Ionicons name="add" size={18} color="#000" />
        </Pressable>
      </View>

      {gewerkGroups.map((group) => {
        const gewerkCfg = GEWERK_CONFIG[group.trade] || GEWERK_CONFIG["Allgemein"];
        const isExpanded = expandedGewerke.has(group.trade);

        return (
          <View key={group.trade} style={gwStyles.card} testID={`gewerk-${group.trade}`}>
            <Pressable style={gwStyles.header} onPress={() => toggleGewerk(group.trade)}>
              <View style={gwStyles.iconWrap}>
                <Ionicons name={gewerkCfg.icon as any} size={18} color={Colors.raw.amber500} />
              </View>
              <View style={gwStyles.headerInfo}>
                <View style={gwStyles.headerTop}>
                  <Text style={gwStyles.tradeName}>{group.trade}</Text>
                  <View style={gwStyles.headerRight}>
                    <Text style={gwStyles.articleCount}>{group.items.length} Artikel</Text>
                    <Text style={gwStyles.tradeTotal}>{"\u20AC"}{group.totalPrice.toLocaleString("de-DE")}</Text>
                  </View>
                  <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={Colors.raw.zinc500} />
                </View>
                <View style={gwStyles.progressRow}>
                  <View style={gwStyles.progressBar}>
                    <View style={[gwStyles.progressFill, { width: `${group.deliveredPercent}%`, backgroundColor: group.deliveredPercent === 100 ? Colors.raw.emerald500 : Colors.raw.amber500 }]} />
                  </View>
                  <Text style={[gwStyles.progressText, group.deliveredPercent === 100 && { color: Colors.raw.emerald500 }]}>{group.deliveredPercent}% geliefert</Text>
                </View>
              </View>
            </Pressable>

            {isExpanded && (
              <View style={gwStyles.body}>
                {group.items.map((mat) => {
                  const cfg = MAT_STATUS_CONFIG[mat.status];
                  return (
                    <Pressable
                      key={mat.id}
                      style={styles.matRow}
                      onPress={() => cycleMaterialStatus(mat.id)}
                      testID={`mat-${mat.id}`}
                    >
                      <View style={[styles.matStatusIcon, { backgroundColor: cfg.color + "18" }]}>
                        <Ionicons name={cfg.icon as any} size={16} color={cfg.color} />
                      </View>
                      <View style={styles.matBody}>
                        <Text style={styles.matName} numberOfLines={1}>{mat.name}</Text>
                        <View style={styles.matMetaRow}>
                          <Text style={styles.matMeta}>{mat.qty} {mat.unit}</Text>
                          <View style={styles.matDot} />
                          <Text style={styles.matMeta}>{mat.supplier}</Text>
                          {mat.deliveryDate && (
                            <>
                              <View style={styles.matDot} />
                              <Text style={styles.matMeta}>{mat.deliveryDate}</Text>
                            </>
                          )}
                        </View>
                      </View>
                      <View style={[styles.matBadge, { backgroundColor: cfg.color + "18" }]}>
                        <Text style={[styles.matBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      {gewerkGroups.length === 0 && (
        <Text style={styles.emptyMat}>Kein Material mit diesem Filter</Text>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerBar, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerProjectCode} numberOfLines={1}>
            BL-2026-003
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 64,
            paddingBottom: activeTab === "checkliste" ? bottomInset + 90 : bottomInset + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.titleText}>{meta.title}</Text>
          <Text style={styles.subtitleText}>
            BL-2026-003 {"\u2022"} Schwentnerring 13c
          </Text>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: meta.statusColor + "18" },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: meta.statusColor }]}
              />
              <Text style={[styles.statusLabel, { color: meta.statusColor }]}>
                {meta.status}
              </Text>
            </View>
            <Text style={styles.dateText}>{meta.date}</Text>
          </View>
        </View>

        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tab, activeTab === "checkliste" && styles.tabActive]}
            onPress={() => setActiveTab("checkliste")}
            testID="tab-checkliste"
          >
            <Ionicons name="checkbox" size={15} color={activeTab === "checkliste" ? "#000" : Colors.raw.zinc400} />
            <Text style={[styles.tabText, activeTab === "checkliste" && styles.tabTextActive]}>Checkliste</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === "auftrag" && styles.tabActive]}
            onPress={() => setActiveTab("auftrag")}
            testID="tab-auftrag"
          >
            <Ionicons name="clipboard" size={15} color={activeTab === "auftrag" ? "#000" : Colors.raw.zinc400} />
            <Text style={[styles.tabText, activeTab === "auftrag" && styles.tabTextActive]}>Auftrag</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === "material" && styles.tabActive]}
            onPress={() => setActiveTab("material")}
            testID="tab-material"
          >
            <MaterialCommunityIcons name="package-variant" size={15} color={activeTab === "material" ? "#000" : Colors.raw.zinc400} />
            <Text style={[styles.tabText, activeTab === "material" && styles.tabTextActive]}>Material</Text>
            {matStats.offen > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{matStats.offen}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {activeTab === "checkliste" && renderChecklisteContent()}
        {activeTab === "auftrag" && renderAuftragContent()}
        {activeTab === "material" && renderMaterialContent()}
      </ScrollView>

      {activeTab === "checkliste" && (
        <View
          style={[
            styles.stickyBar,
            { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 8 },
          ]}
        >
          {allDone ? (
            <View style={styles.stickyBarInner}>
              {typeKey === "abnahme" && (
                <Pressable
                  style={({ pressed }) => [
                    styles.signatureBtn,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Feather name="edit-3" size={18} color={Colors.raw.amber500} />
                  <Text style={styles.signatureBtnText}>Unterschrift</Text>
                </Pressable>
              )}
              <Pressable
                style={({ pressed }) => [
                  styles.completeBtn,
                  { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success
                    );
                  }
                }}
              >
                <Ionicons name="checkmark-circle" size={20} color="#000" />
                <Text style={styles.completeBtnText}>
                  Begehung abschlie\u00DFen
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.continueBtn,
                { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
            >
              <Text style={styles.continueBtnText}>Begehung fortsetzen</Text>
              <Text style={styles.continueBtnCount}>
                {checkedCount}/{totalCount}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      <AuftragMangelSheet
        visible={!!mangelSheet}
        onClose={() => setMangelSheet(null)}
        position={mangelSheet}
        onSave={(text) => {
          if (mangelRoomId && mangelSheet) {
            setMangel(mangelRoomId, mangelSheet.id, text);
          }
        }}
      />

      <AddMaterialSheet
        visible={addMatVisible}
        onClose={() => setAddMatVisible(false)}
        onAdd={(mat) => {
          setMaterials((prev) => [mat, ...prev]);
          setAddMatVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  headerBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerProjectCode: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc500,
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  titleSection: {
    marginBottom: 16,
  },
  titleText: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 28,
    color: Colors.raw.white,
    marginBottom: 6,
  },
  subtitleText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.zinc500,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  dateText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  tabBar: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.raw.zinc900,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
  },
  tabActive: {
    backgroundColor: Colors.raw.amber500,
    borderColor: Colors.raw.amber500,
  },
  tabText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.zinc400,
  },
  tabTextActive: {
    color: "#000",
  },
  tabBadge: {
    backgroundColor: Colors.raw.rose500,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    color: "#fff",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.raw.zinc800,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 10,
    borderRadius: 5,
  },
  progressPercent: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 20,
    color: Colors.raw.white,
    minWidth: 48,
    textAlign: "right",
  },
  progressLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc500,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  photoTile: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  photoBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  photoBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.raw.white,
  },
  addPhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 12,
    paddingVertical: 14,
  },
  addPhotoBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#000",
  },
  notizenInput: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 12,
    padding: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.white,
    minHeight: 100,
  },
  stickyBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.raw.zinc950,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
  },
  stickyBarInner: {
    flexDirection: "row",
    gap: 10,
  },
  signatureBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.raw.amber500,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  signatureBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.raw.amber500,
  },
  completeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.emerald500,
    borderRadius: 14,
    paddingVertical: 16,
  },
  completeBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#000",
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.raw.amber500,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  continueBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#000",
  },
  continueBtnCount: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 15,
    color: "#000",
  },
  auftragProgressCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginBottom: 16,
  },
  auftragProgressHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 14,
  },
  auftragProgressPercent: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 36,
    color: Colors.raw.white,
    lineHeight: 40,
  },
  auftragProgressLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.zinc500,
  },
  auftragProgressBar: {
    height: 8,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 4,
    marginBottom: 16,
    overflow: "hidden",
  },
  auftragProgressFill: {
    height: 8,
    backgroundColor: Colors.raw.emerald500,
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.white,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
  },
  sollIstRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
    paddingTop: 14,
  },
  sollIstCol: {
    flex: 1,
    alignItems: "center",
  },
  sollIstLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.raw.zinc500,
    letterSpacing: 1,
    marginBottom: 4,
  },
  sollIstValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.white,
  },
  sollIstDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.raw.zinc700,
  },
  filterScroll: {
    marginBottom: 12,
    marginHorizontal: -20,
  },
  filterRow: {
    paddingHorizontal: 20,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.raw.zinc900,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
  },
  filterChipActive: {
    backgroundColor: Colors.raw.amber500,
    borderColor: Colors.raw.amber500,
  },
  filterChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.zinc400,
  },
  filterChipTextActive: {
    color: "#000",
  },
  roomCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    marginBottom: 12,
    overflow: "hidden",
  },
  roomHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  roomIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.raw.amber500 + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.white,
    marginBottom: 2,
  },
  roomMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  roomProgressWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roomProgressBar: {
    width: 50,
    height: 6,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 3,
    overflow: "hidden",
  },
  roomProgressFill: {
    height: 6,
    borderRadius: 3,
  },
  roomProgressText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.raw.amber500,
    minWidth: 32,
    textAlign: "right",
  },
  roomBody: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
  },
  emptyRoom: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc600,
    textAlign: "center",
    paddingVertical: 20,
  },
  matSummary: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  matSumCard: {
    flex: 1,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  matSumCount: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 20,
  },
  matSumLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.raw.zinc500,
  },
  matHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  matTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.raw.white,
  },
  matAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.raw.amber500,
    alignItems: "center",
    justifyContent: "center",
  },
  matRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800 + "80",
  },
  matStatusIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  matBody: {
    flex: 1,
  },
  matName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.white,
    marginBottom: 3,
  },
  matMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  matMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
  },
  matDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.raw.zinc700,
  },
  matBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyMat: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc600,
    textAlign: "center",
    paddingVertical: 40,
  },
});

const gwStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    marginBottom: 10,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.raw.amber500 + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  tradeName: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.white,
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  articleCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
  },
  tradeTotal: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.raw.white,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 5,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
  },
  progressText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.raw.amber500,
    minWidth: 75,
    textAlign: "right",
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
  },
});

const zlStyles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#333333",
    borderRadius: 12,
  },
  triggerText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.amber500,
  },
  formWrap: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    borderRadius: 12,
    backgroundColor: Colors.raw.zinc900 + "80",
    padding: 14,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  formTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.white,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 10,
    marginBottom: 10,
    overflow: "hidden",
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.white,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  resultsList: {
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800 + "80",
  },
  resultRowSelected: {
    backgroundColor: Colors.raw.amber500 + "18",
  },
  resultNr: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
    color: Colors.raw.zinc400,
    width: 32,
  },
  resultText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.white,
    flex: 1,
  },
  resultGewerk: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.raw.zinc500,
    width: 50,
    textAlign: "right",
  },
  resultPreis: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.white,
    width: 60,
    textAlign: "right",
  },
  selectedWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.raw.amber500 + "12",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  selectedLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.amber500,
  },
  selectedValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.white,
    flex: 1,
  },
  fieldLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc400,
    marginBottom: 6,
  },
  noteInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.white,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 60,
    textAlignVertical: "top",
    marginBottom: 14,
  },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  photoBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.amber500,
  },
  photoPreview: {
    marginBottom: 14,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: Colors.raw.zinc800,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  photoFilename: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.raw.zinc500,
  },
  pflichtText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#EF4444",
    marginBottom: 14,
  },
  submitBtn: {
    backgroundColor: Colors.raw.amber500,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#000",
  },
  submitBtnTextDisabled: {
    color: "#000",
  },
});
