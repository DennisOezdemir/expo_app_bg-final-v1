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

interface Gewerk {
  id: string;
  name: string;
  icon: string;
  positions: number;
}

interface Position {
  nr: string;
  name: string;
  price: string;
  unit: string;
}

interface Material {
  name: string;
  packaging: string;
  rate: string;
}

const GEWERKE: Gewerk[] = [
  { id: "maler", name: "Maler", icon: "color-palette", positions: 184 },
  { id: "sanitaer", name: "Sanit\u00E4r", icon: "build", positions: 92 },
  { id: "boden", name: "Boden", icon: "layers", positions: 95 },
  { id: "elektro", name: "Elektro", icon: "flash", positions: 82 },
  { id: "fliesen", name: "Fliesen", icon: "grid", positions: 88 },
  { id: "tischler", name: "Tischler", icon: "construct", positions: 79 },
];

const SAMPLE_POSITIONS: Position[] = [
  { nr: "01.01", name: "Wandfl\u00E4chen grundieren", price: "3,20", unit: "m\u00B2" },
  { nr: "01.02", name: "Wandfl\u00E4chen streichen", price: "4,80", unit: "m\u00B2" },
  { nr: "01.03", name: "Raufaser tapezieren", price: "8,40", unit: "m\u00B2" },
  { nr: "01.04", name: "Vlies tapezieren", price: "9,60", unit: "m\u00B2" },
  { nr: "01.05", name: "Decke streichen", price: "5,20", unit: "m\u00B2" },
  { nr: "01.06", name: "Lackarbeiten T\u00FCrzargen", price: "28,00", unit: "Stk" },
  { nr: "01.07", name: "Lackarbeiten Fenster", price: "32,00", unit: "Stk" },
  { nr: "01.08", name: "Spachtelarbeiten Q3", price: "6,80", unit: "m\u00B2" },
];

const SAMPLE_MATERIALS: Material[] = [
  { name: "Vliesraufaser", packaging: "Rolle 25m", rate: "1 pro 12,5m\u00B2" },
  { name: "Vlieskleber", packaging: "Eimer 16kg", rate: "1 pro 25m\u00B2" },
];

const DESCRIPTIONS: Record<string, string> = {
  "01.01": "Wandfl\u00E4chen fachgerecht grundieren mit Tiefengrund LF. Untergrund muss trocken, sauber und tragf\u00E4hig sein.",
  "01.02": "Wandfl\u00E4chen streichen mit Dispersionsfarbe, deckend in einem Anstrich. Farbton nach Absprache.",
  "01.03": "Raufasertapete Typ mittel auf vorbereiteten Untergrund tapezieren inkl. Kleister und Zuschnitt.",
  "01.04": "Malervlies glatt auf vorbereiteten Untergrund tapezieren inkl. Spezialkleber.",
  "01.05": "Deckenfl\u00E4chen mit Dispersionsfarbe streichen, deckend. Abkleben und Abdeckarbeiten inklusive.",
  "01.06": "T\u00FCrzargen schleifen, grundieren und zweimal lackieren mit Acryllack seidenmatt.",
  "01.07": "Fensterrahmen innen schleifen, grundieren und zweimal lackieren mit Acryllack seidenmatt.",
  "01.08": "Spachtelarbeiten Qualit\u00E4tsstufe Q3 auf Gipskartonplatten inkl. Fugen und Schraubenk\u00F6pfe.",
};

type ViewType = "gewerke" | "positions" | "detail";

export default function KatalogScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [view, setView] = useState<ViewType>("gewerke");
  const [selectedGewerk, setSelectedGewerk] = useState<Gewerk | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [beschreibung, setBeschreibung] = useState("");
  const [einheit, setEinheit] = useState("");
  const [grundpreis, setGrundpreis] = useState("");
  const [aufschlag, setAufschlag] = useState("15");
  const [materials, setMaterials] = useState<Material[]>([]);

  const openGewerk = (gewerk: Gewerk) => {
    setSelectedGewerk(gewerk);
    setSearchQuery("");
    setView("positions");
  };

  const openPosition = (position: Position) => {
    setSelectedPosition(position);
    setBeschreibung(DESCRIPTIONS[position.nr] || "Standardbeschreibung f\u00FCr diese Position.");
    setEinheit(position.unit);
    setGrundpreis(position.price);
    setAufschlag("15");
    setMaterials(position.nr === "01.03" ? [...SAMPLE_MATERIALS] : []);
    setView("detail");
  };

  const goBackFromPositions = () => {
    setView("gewerke");
    setSelectedGewerk(null);
  };

  const goBackFromDetail = () => {
    setView("positions");
    setSelectedPosition(null);
  };

  const handleSave = () => {
    Alert.alert("Gespeichert", `Position ${selectedPosition?.nr} wurde erfolgreich gespeichert.`);
  };

  const calculateEndpreis = (): string => {
    const price = parseFloat(grundpreis.replace(",", "."));
    const markup = parseFloat(aufschlag.replace(",", "."));
    if (isNaN(price) || isNaN(markup)) return "0,00";
    const result = price * (1 + markup / 100);
    return result.toFixed(2).replace(".", ",");
  };

  const filteredPositions = SAMPLE_POSITIONS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nr.includes(searchQuery)
  );

  const handleBack = () => {
    if (view === "detail") {
      goBackFromDetail();
    } else if (view === "positions") {
      goBackFromPositions();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topInset + 20, paddingBottom: bottomInset + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          testID="katalog-back"
        >
          <Ionicons name="chevron-back" size={22} color={Colors.raw.amber500} />
          <Text style={styles.backText}>
            {view === "gewerke" ? "Zur\u00FCck" : view === "positions" ? "Gewerke" : selectedGewerk?.name || "Positionen"}
          </Text>
        </Pressable>

        {view === "gewerke" && renderGewerkeView()}
        {view === "positions" && renderPositionsView()}
        {view === "detail" && renderDetailView()}
      </ScrollView>
    </View>
  );

  function renderGewerkeView() {
    return (
      <>
        <Text style={styles.title}>WABS Katalog</Text>
        <Text style={styles.subtitle}>620 Positionen \u2022 {GEWERKE.length} Gewerke</Text>

        <Text style={styles.updateText}>Letzte Aktualisierung: 01.02.2026</Text>

        <View style={{ marginTop: 20, gap: 10 }}>
          {GEWERKE.map((gewerk) => (
            <Pressable
              key={gewerk.id}
              onPress={() => openGewerk(gewerk)}
              style={({ pressed }) => [styles.gewerkCard, { opacity: pressed ? 0.7 : 1 }]}
              testID={`gewerk-${gewerk.id}`}
            >
              <View style={styles.gewerkLeft}>
                <View style={styles.gewerkIcon}>
                  <Ionicons name={gewerk.icon as any} size={22} color={Colors.raw.amber500} />
                </View>
                <View>
                  <Text style={styles.gewerkName}>{gewerk.name}</Text>
                  <Text style={styles.gewerkCount}>{gewerk.positions} Positionen</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.raw.zinc600} />
            </Pressable>
          ))}
        </View>

        <View style={styles.actionRow}>
          <Pressable style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}>
            <Ionicons name="search" size={18} color={Colors.raw.amber500} />
            <Text style={styles.actionText}>Position suchen</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}>
            <Ionicons name="download" size={18} color={Colors.raw.amber500} />
            <Text style={styles.actionText}>Katalog importieren</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}>
            <Ionicons name="share" size={18} color={Colors.raw.amber500} />
            <Text style={styles.actionText}>Katalog exportieren</Text>
          </Pressable>
        </View>
      </>
    );
  }

  function renderPositionsView() {
    if (!selectedGewerk) return null;
    return (
      <>
        <Text style={styles.title}>{selectedGewerk.name} \u2022 {selectedGewerk.positions} Positionen</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.raw.zinc500} />
          <TextInput
            style={styles.searchInput}
            placeholder="Position suchen..."
            placeholderTextColor={Colors.raw.zinc500}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={Colors.raw.zinc500} />
            </Pressable>
          )}
        </View>

        <View style={styles.card}>
          {filteredPositions.map((position, i) => (
            <View key={position.nr}>
              <Pressable
                onPress={() => openPosition(position)}
                style={({ pressed }) => [styles.positionRow, { opacity: pressed ? 0.7 : 1 }]}
                testID={`position-${position.nr}`}
              >
                <View style={styles.positionLeft}>
                  <Text style={styles.positionNr}>{position.nr}</Text>
                  <Text style={styles.positionName}>{position.name}</Text>
                </View>
                <Text style={styles.positionPrice}>\u20AC{position.price}/{position.unit}</Text>
              </Pressable>
              {i < filteredPositions.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </>
    );
  }

  function renderDetailView() {
    if (!selectedPosition) return null;
    return (
      <>
        <Text style={styles.title}>Position {selectedPosition.nr}</Text>
        <Text style={styles.detailName}>{selectedPosition.name}</Text>

        <Text style={styles.sectionLabel}>Beschreibung</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          value={beschreibung}
          onChangeText={setBeschreibung}
          textAlignVertical="top"
          placeholderTextColor={Colors.raw.zinc500}
        />

        <Text style={styles.sectionLabel}>Preiskalkulation</Text>
        <View style={styles.card}>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Einheit</Text>
            <TextInput
              style={styles.formInput}
              value={einheit}
              onChangeText={setEinheit}
              placeholderTextColor={Colors.raw.zinc500}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Grundpreis</Text>
            <TextInput
              style={styles.formInput}
              value={grundpreis}
              onChangeText={setGrundpreis}
              keyboardType="decimal-pad"
              placeholderTextColor={Colors.raw.zinc500}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Aufschlag (%)</Text>
            <TextInput
              style={styles.formInput}
              value={aufschlag}
              onChangeText={setAufschlag}
              keyboardType="decimal-pad"
              placeholderTextColor={Colors.raw.zinc500}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Endpreis</Text>
            <Text style={styles.endpreis}>\u20AC{calculateEndpreis()}/{einheit}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Material-Anforderungen</Text>
        <View style={styles.card}>
          {materials.length === 0 && (
            <Text style={styles.emptyText}>Keine Material-Anforderungen hinterlegt.</Text>
          )}
          {materials.map((mat, i) => (
            <View key={mat.name}>
              <View style={styles.materialRow}>
                <View style={styles.materialIcon}>
                  <Ionicons name="cube" size={18} color={Colors.raw.amber500} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.materialName}>{mat.name}</Text>
                  <Text style={styles.materialDetail}>{mat.packaging} \u2022 {mat.rate}</Text>
                </View>
              </View>
              {i < materials.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
          <View style={styles.divider} />
          <Pressable
            style={({ pressed }) => [styles.addRow, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => {
              setMaterials((prev) => [
                ...prev,
                { name: "Neues Material", packaging: "Einheit", rate: "nach Bedarf" },
              ]);
            }}
          >
            <Ionicons name="add-circle" size={20} color={Colors.raw.amber500} />
            <Text style={styles.addText}>Material-Anforderung</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [styles.saveBtn, { opacity: pressed ? 0.9 : 1 }]}
          testID="katalog-save"
        >
          <Text style={styles.saveBtnText}>Speichern</Text>
        </Pressable>
      </>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  backText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.raw.amber500,
  },

  title: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 28,
    color: Colors.raw.white,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc400,
    marginBottom: 4,
  },
  updateText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },

  gewerkCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 16,
  },
  gewerkLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  gewerkIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.raw.amber500 + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  gewerkName: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.white,
  },
  gewerkCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
    marginTop: 2,
  },

  actionRow: {
    marginTop: 24,
    gap: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  actionText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.amber500,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginTop: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.white,
    padding: 0,
  },

  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingHorizontal: 18,
    paddingVertical: 4,
    marginBottom: 20,
  },
  divider: { height: 1, backgroundColor: Colors.raw.zinc800 },

  positionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  positionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  positionNr: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.raw.amber500,
    width: 46,
  },
  positionName: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.white,
    flex: 1,
  },
  positionPrice: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc400,
  },

  detailName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.raw.white,
    marginBottom: 20,
  },

  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.raw.zinc400,
    marginBottom: 10,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  textArea: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 14,
    padding: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.white,
    minHeight: 100,
    marginBottom: 20,
  },

  formRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  formLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc400,
  },
  formInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.white,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
    textAlign: "right",
  },
  endpreis: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.amber500,
  },

  materialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  materialIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.raw.amber500 + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  materialName: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.raw.white,
  },
  materialDetail: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginTop: 2,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
    paddingVertical: 14,
  },

  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
  },
  addText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.amber500,
  },

  saveBtn: {
    backgroundColor: Colors.raw.amber500,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#000",
  },
});
