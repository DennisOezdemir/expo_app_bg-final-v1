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
}

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

const INITIAL_ROOMS: AuftragRoom[] = [
  {
    id: "r1",
    icon: "water",
    name: "Bad",
    positions: [
      { id: "p1", nr: "01", title: "Wandfliesen Bad", desc: "Wandfliesen im Dünnbett verlegen inkl. Grundierung, Kleber und Verfugung.", qty: 28, unit: "m²", price: 54.4, trade: "Fliesen", status: "erledigt" },
      { id: "p2", nr: "02", title: "Bodenfliesen Bad", desc: "Bodenfliesen im Dünnbett verlegen inkl. Grundierung, Kleber und Verfugung.", qty: 6, unit: "m²", price: 70, trade: "Fliesen", status: "erledigt" },
      { id: "p3", nr: "03", title: "Waschtisch montieren", desc: "Waschtisch inkl. Einhandmischer und Siphon montieren.", qty: 1, unit: "Stk", price: 180, trade: "Sanitär", status: "arbeit" },
      { id: "p4", nr: "04", title: "WC montieren", desc: "Wand-WC inkl. Betätigungsplatte und Anschluss montieren.", qty: 1, unit: "Stk", price: 220, trade: "Sanitär", status: "offen" },
      { id: "p5", nr: "05", title: "Silikonfugen", desc: "Silikonfugen erneuern, Altsilikon entfernen.", qty: 15, unit: "lfm", price: 8.5, trade: "Fliesen", status: "offen" },
      { id: "p6", nr: "06", title: "Decke streichen", desc: "Deckenfl. mit Dispersionsfarbe streichen.", qty: 6, unit: "m²", price: 5.2, trade: "Maler", status: "offen" },
    ],
  },
  {
    id: "r2",
    icon: "restaurant",
    name: "Küche",
    positions: [
      { id: "p7", nr: "01", title: "Wände tapezieren (Vlies)", desc: "Malervlies glatt auf vorbereiteten Untergrund tapezieren.", qty: 32, unit: "m²", price: 9.6, trade: "Maler", status: "erledigt" },
      { id: "p8", nr: "02", title: "Wände streichen", desc: "Wandflächen streichen mit Dispersionsfarbe, deckend.", qty: 32, unit: "m²", price: 4.8, trade: "Maler", status: "erledigt" },
      { id: "p9", nr: "03", title: "Decke streichen", desc: "Deckenflächen mit Dispersionsfarbe streichen.", qty: 12, unit: "m²", price: 5.2, trade: "Maler", status: "arbeit" },
      { id: "p10", nr: "04", title: "Boden schleifen", desc: "Parkettboden maschinell schleifen.", qty: 12, unit: "m²", price: 38, trade: "Boden", status: "offen" },
      { id: "p11", nr: "05", title: "Boden versiegeln", desc: "Parkettboden 2x versiegeln mit Parkettlack.", qty: 12, unit: "m²", price: 38, trade: "Boden", status: "offen" },
    ],
  },
  {
    id: "r3",
    icon: "home",
    name: "Wohnzimmer",
    positions: [
      { id: "p12", nr: "01", title: "Altbelag entfernen", desc: "Vorhandenen Bodenbelag entfernen und entsorgen.", qty: 25, unit: "m²", price: 6.5, trade: "Boden", status: "erledigt" },
      { id: "p13", nr: "02", title: "Untergrund spachteln", desc: "Untergrund ausgleichen mit Nivelliermasse.", qty: 25, unit: "m²", price: 8, trade: "Boden", status: "erledigt" },
      { id: "p14", nr: "03", title: "Wände spachteln Q3", desc: "Spachtelarbeiten Q3 auf Gipskartonplatten.", qty: 45, unit: "m²", price: 6.8, trade: "Maler", status: "arbeit" },
      { id: "p15", nr: "04", title: "Wände streichen 2x", desc: "Dispersionsfarbe deckend in zwei Anstrichen.", qty: 45, unit: "m²", price: 4.8, trade: "Maler", status: "offen" },
      { id: "p16", nr: "05", title: "Decke streichen", desc: "Deckenflächen streichen.", qty: 25, unit: "m²", price: 5.2, trade: "Maler", status: "offen" },
      { id: "p17", nr: "06", title: "Laminat verlegen", desc: "Laminat NK32 schwimmend verlegen inkl. Trittschalldämmung.", qty: 25, unit: "m²", price: 24.5, trade: "Boden", status: "offen" },
      { id: "p18", nr: "07", title: "Sockelleisten montieren", desc: "Sockelleisten aus MDF montieren.", qty: 20, unit: "lfm", price: 12.5, trade: "Boden", status: "offen" },
      { id: "p19", nr: "08", title: "Endreinigung", desc: "Endreinigung nach Abschluss aller Arbeiten.", qty: 1, unit: "Pauschal", price: 180, trade: "Allg.", status: "offen" },
    ],
  },
  {
    id: "r4",
    icon: "bed",
    name: "Schlafzimmer",
    positions: [
      { id: "p20", nr: "01", title: "Raufaser tapezieren", desc: "Raufasertapete auf vorbereiteten Untergrund.", qty: 38, unit: "m²", price: 8.4, trade: "Maler", status: "offen" },
      { id: "p21", nr: "02", title: "Wände streichen", desc: "Dispersionsfarbe deckend.", qty: 38, unit: "m²", price: 4.8, trade: "Maler", status: "offen" },
      { id: "p22", nr: "03", title: "Decke streichen", desc: "Deckenflächen streichen.", qty: 14, unit: "m²", price: 5.2, trade: "Maler", status: "offen" },
      { id: "p23", nr: "04", title: "Laminat verlegen", desc: "Laminat NK32 schwimmend verlegen.", qty: 14, unit: "m²", price: 24.5, trade: "Boden", status: "offen" },
    ],
  },
];

const INITIAL_MATERIALS: BaustelleMaterial[] = [
  { id: "m1", name: "Erfurt Vlies Rauhfaser 52", supplier: "MEGA", qty: 12, unit: "Rollen", status: "geliefert", deliveryDate: "03.02." },
  { id: "m2", name: "Dispersionsfarbe weiß 12,5L", supplier: "MEGA", qty: 4, unit: "Eimer", status: "geliefert", deliveryDate: "03.02." },
  { id: "m3", name: "Wandfliesen 30×60 weiß matt", supplier: "Fliesenmax", qty: 32, unit: "m²", status: "geliefert", deliveryDate: "04.02." },
  { id: "m4", name: "Bodenfliesen 60×60 grau", supplier: "Fliesenmax", qty: 8, unit: "m²", status: "geliefert", deliveryDate: "04.02." },
  { id: "m5", name: "Fliesenkleber Flex S1 25kg", supplier: "Fliesenmax", qty: 6, unit: "Sack", status: "verbraucht" },
  { id: "m6", name: "Tiefengrund LF 10L", supplier: "MEGA", qty: 2, unit: "Kanister", status: "bestellt", deliveryDate: "10.02." },
  { id: "m7", name: "Laminat Eiche Natur NK32", supplier: "Delmes", qty: 42, unit: "m²", status: "bestellt", deliveryDate: "12.02." },
  { id: "m8", name: "Trittschalldämmung 2mm", supplier: "Delmes", qty: 42, unit: "m²", status: "bestellt", deliveryDate: "12.02." },
  { id: "m9", name: "Sockelleisten Eiche 58mm", supplier: "Delmes", qty: 45, unit: "lfm", status: "offen" },
  { id: "m10", name: "Silikon Bad transparent", supplier: "MEGA", qty: 3, unit: "Kartuschen", status: "offen" },
  { id: "m11", name: "Parkettlack seidenmatt 5L", supplier: "Brillux", qty: 2, unit: "Gebinde", status: "offen" },
  { id: "m12", name: "Spachtelmasse Q3 fein 25kg", supplier: "MEGA", qty: 4, unit: "Sack", status: "offen" },
];

function formatEuro(amount: number): string {
  return "€" + amount.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

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
        <View style={[posStyles.statusBadge, { backgroundColor: cfg.color + "18" }]}>
          <Text style={[posStyles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
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

function MangelSheet({
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

  const UNITS = ["Stk", "m²", "lfm", "Rollen", "Eimer", "Sack", "Kartuschen", "Kanister", "Gebinde", "Paket"];

  const handleSave = () => {
    if (!name.trim()) return;
    onAdd({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      supplier: supplier.trim() || "–",
      qty: parseFloat(qty) || 1,
      unit,
      status: "offen",
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
            <Text style={amStyles.title}>Material hinzufügen</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={Colors.raw.zinc500} />
            </Pressable>
          </View>

          <Text style={amStyles.label}>Bezeichnung</Text>
          <TextInput
            style={amStyles.input}
            placeholder="z.B. Dispersionsfarbe weiß"
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
            <Text style={amStyles.saveBtnText}>Hinzufügen</Text>
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

export default function AuftragScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [rooms, setRooms] = useState<AuftragRoom[]>(INITIAL_ROOMS);
  const [materials, setMaterials] = useState<BaustelleMaterial[]>(INITIAL_MATERIALS);
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set(["r1", "r2"]));
  const [activeTab, setActiveTab] = useState<"auftrag" | "material">("auftrag");
  const [filterStatus, setFilterStatus] = useState<PosStatus | "alle">("alle");
  const [matFilter, setMatFilter] = useState<string>("alle");
  const [mangelSheet, setMangelSheet] = useState<AuftragPosition | null>(null);
  const [addMatVisible, setAddMatVisible] = useState(false);

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

  const [mangelRoomId, setMangelRoomId] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerCode}>BL-2026-003</Text>
          <Text style={styles.headerTitle}>Schwentnerring</Text>
        </View>
        <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })} hitSlop={12}>
          <Ionicons name="ellipsis-vertical" size={20} color={Colors.raw.zinc500} />
        </Pressable>
      </View>

      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === "auftrag" && styles.tabActive]}
          onPress={() => setActiveTab("auftrag")}
          testID="tab-auftrag"
        >
          <Ionicons name="clipboard" size={16} color={activeTab === "auftrag" ? "#000" : Colors.raw.zinc400} />
          <Text style={[styles.tabText, activeTab === "auftrag" && styles.tabTextActive]}>Auftrag</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "material" && styles.tabActive]}
          onPress={() => setActiveTab("material")}
          testID="tab-material"
        >
          <MaterialCommunityIcons name="package-variant" size={16} color={activeTab === "material" ? "#000" : Colors.raw.zinc400} />
          <Text style={[styles.tabText, activeTab === "material" && styles.tabTextActive]}>Material</Text>
          {matStats.offen > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{matStats.offen}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {activeTab === "auftrag" ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: bottomInset + 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressPercent}>{stats.percent}%</Text>
              <Text style={styles.progressLabel}>erledigt</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${stats.percent}%` }]} />
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
                <Text style={styles.statLabel}>Mängel</Text>
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
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: bottomInset + 40 }}
          showsVerticalScrollIndicator={false}
        >
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

          {filteredMaterials.map((mat) => {
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

          {filteredMaterials.length === 0 && (
            <Text style={styles.emptyMat}>Kein Material mit diesem Filter</Text>
          )}
        </ScrollView>
      )}

      <MangelSheet
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
  },
  headerCode: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.zinc500,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
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
    fontSize: 14,
    color: Colors.raw.zinc400,
  },
  tabTextActive: {
    color: "#000",
  },
  tabBadge: {
    backgroundColor: Colors.raw.rose500,
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#fff",
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  progressCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 14,
  },
  progressPercent: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 36,
    color: Colors.raw.white,
    lineHeight: 40,
  },
  progressLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.zinc500,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 4,
    marginBottom: 16,
    overflow: "hidden",
  },
  progressFill: {
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
    marginTop: 4,
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
