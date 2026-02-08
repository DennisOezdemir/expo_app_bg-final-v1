import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Colors from "@/constants/colors";

type LogoPosition = "links" | "mitte" | "rechts";
type LogoSize = "klein" | "mittel" | "gross";

export default function BriefpapierScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>("links");
  const [logoSize, setLogoSize] = useState<LogoSize>("mittel");
  const [fontChoice, setFontChoice] = useState("Inter");

  const [absenderZeile, setAbsenderZeile] = useState(
    "Deine Baul\u00F6wen GmbH \u2022 Musterstr. 12 \u2022 20095 Hamburg"
  );
  const [zusatztextKopf, setZusatztextKopf] = useState(
    "Meisterbetrieb seit 2020"
  );

  const [fusszeilen, setFusszeilen] = useState([
    "Deine Baul\u00F6wen GmbH \u2022 GF: Dennis",
    "Musterstr. 12 \u2022 20095 Hamburg",
    "Tel: 040-123456 \u2022 info@bauloewen.de",
    "Hamburger Sparkasse \u2022 IBAN: DE89 3704...",
    "HRB 12345 \u2022 USt-IdNr: DE123456789",
  ]);

  const [colors, setColors] = useState({
    primary: "#F59E0B",
    text: "#18181B",
    accent: "#10B981",
  });

  const updateFusszeile = (index: number, value: string) => {
    setFusszeilen((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const updateColor = (key: "primary" | "text" | "accent", value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const logoSizeMap: Record<LogoSize, number> = {
    klein: 40,
    mittel: 60,
    gross: 80,
  };

  const previewLogoHeight = logoSizeMap[logoSize];

  const previewLogoAlign: "flex-start" | "center" | "flex-end" =
    logoPosition === "links"
      ? "flex-start"
      : logoPosition === "mitte"
        ? "center"
        : "flex-end";

  const templates = ["Angebot", "Rechnung", "Mahnung", "Abnahmeprotokoll"];

  const positionOptions: { key: LogoPosition; label: string; icon: string }[] =
    [
      { key: "links", label: "Links", icon: "arrow-back" },
      { key: "mitte", label: "Mitte", icon: "swap-horizontal" },
      { key: "rechts", label: "Rechts", icon: "arrow-forward" },
    ];

  const sizeOptions: { key: LogoSize; label: string }[] = [
    { key: "klein", label: "Klein" },
    { key: "mittel", label: "Mittel" },
    { key: "gross", label: "Gro\u00DF" },
  ];

  const fontOptions = ["Inter", "Roboto", "Open Sans", "Lato"];

  const colorRows: { key: "primary" | "text" | "accent"; label: string }[] = [
    { key: "primary", label: "Prim\u00E4rfarbe" },
    { key: "text", label: "Textfarbe" },
    { key: "accent", label: "Akzentfarbe" },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
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
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 64,
            paddingBottom: bottomInset + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Briefpapier</Text>
        <Text style={styles.subtitle}>
          Wird verwendet f\u00FCr: Angebote, Rechnungen, Mahnungen, Protokolle
        </Text>

        <Text style={styles.sectionLabel}>Logo</Text>
        <View style={styles.card}>
          <View style={styles.dropZone}>
            <View style={styles.dropZoneContent}>
              {logoUri ? (
                <Image
                  source={{ uri: logoUri }}
                  style={styles.logoPreviewImage}
                  resizeMode="contain"
                />
              ) : (
                <Ionicons
                  name="image-outline"
                  size={48}
                  color={Colors.raw.zinc500}
                />
              )}
              <Text style={styles.dropZoneCompany}>
                Deine Baul\u00F6wen GmbH
              </Text>
            </View>
            <View style={styles.dropZoneButtons}>
              <Pressable
                onPress={pickLogo}
                style={({ pressed }) => [
                  styles.uploadBtn,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Ionicons
                  name="folder-open-outline"
                  size={16}
                  color={Colors.raw.amber500}
                />
                <Text style={styles.uploadBtnText}>Logo hochladen</Text>
              </Pressable>
              <Pressable
                onPress={() => setLogoUri(null)}
                style={({ pressed }) => [
                  styles.removeBtn,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={Colors.raw.zinc500}
                />
                <Text style={styles.removeBtnText}>Entfernen</Text>
              </Pressable>
            </View>
            <Text style={styles.dropZoneHint}>
              Max 2MB {"\u2022"} PNG, JPG, SVG
            </Text>
            <Text style={styles.dropZoneHint}>Empfohlen: 400x200px</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Layout</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Logo Position</Text>
          <View style={styles.toggleRow}>
            {positionOptions.map((opt) => {
              const active = logoPosition === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setLogoPosition(opt.key)}
                  style={[
                    styles.toggleBtn,
                    active && styles.toggleBtnActive,
                  ]}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={16}
                    color={active ? "#000" : Colors.raw.zinc400}
                  />
                  <Text
                    style={[
                      styles.toggleBtnText,
                      active && styles.toggleBtnTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
            Logo Gr\u00F6\u00DFe
          </Text>
          <View style={styles.toggleRow}>
            {sizeOptions.map((opt) => {
              const active = logoSize === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setLogoSize(opt.key)}
                  style={[
                    styles.toggleBtn,
                    active && styles.toggleBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      active && styles.toggleBtnTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
            Schriftart
          </Text>
          <View style={styles.toggleRow}>
            {fontOptions.map((f) => {
              const active = fontChoice === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => setFontChoice(f)}
                  style={[
                    styles.chipBtn,
                    active && styles.chipBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipBtnText,
                      active && styles.chipBtnTextActive,
                    ]}
                  >
                    {f}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionLabel}>Kopfzeile</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>
            Absender-Zeile (klein, \u00FCber Adresse)
          </Text>
          <TextInput
            style={styles.input}
            value={absenderZeile}
            onChangeText={setAbsenderZeile}
            placeholderTextColor={Colors.raw.zinc600}
            selectionColor={Colors.raw.amber500}
          />
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
            Zusatztext Kopf (optional)
          </Text>
          <TextInput
            style={styles.input}
            value={zusatztextKopf}
            onChangeText={setZusatztextKopf}
            placeholderTextColor={Colors.raw.zinc600}
            selectionColor={Colors.raw.amber500}
          />
        </View>

        <Text style={styles.sectionLabel}>Fu\u00DFzeile</Text>
        <View style={styles.card}>
          {fusszeilen.map((line, i) => (
            <View key={i}>
              <Text style={styles.fieldLabel}>Zeile {i + 1}</Text>
              <TextInput
                style={styles.input}
                value={line}
                onChangeText={(val) => updateFusszeile(i, val)}
                placeholderTextColor={Colors.raw.zinc600}
                selectionColor={Colors.raw.amber500}
              />
              {i < fusszeilen.length - 1 && <View style={{ height: 10 }} />}
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Farben</Text>
        <View style={styles.card}>
          {colorRows.map((cr, i) => (
            <View key={cr.key}>
              <View style={styles.colorRow}>
                <Text style={styles.colorLabel}>{cr.label}</Text>
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: colors[cr.key] },
                  ]}
                />
                <TextInput
                  style={styles.colorInput}
                  value={colors[cr.key]}
                  onChangeText={(val) => updateColor(cr.key, val)}
                  placeholderTextColor={Colors.raw.zinc600}
                  selectionColor={Colors.raw.amber500}
                />
              </View>
              {i < colorRows.length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Vorschau</Text>
        <View style={styles.card}>
          <View style={styles.previewArea}>
            <View style={[styles.previewLogoRow, { justifyContent: previewLogoAlign }]}>
              {logoUri ? (
                <Image
                  source={{ uri: logoUri }}
                  style={{
                    height: previewLogoHeight,
                    width: previewLogoHeight * 2,
                  }}
                  resizeMode="contain"
                />
              ) : (
                <View
                  style={[
                    styles.previewLogoPlaceholder,
                    {
                      height: previewLogoHeight,
                      width: previewLogoHeight * 2,
                    },
                  ]}
                >
                  <Ionicons
                    name="image-outline"
                    size={previewLogoHeight * 0.5}
                    color="#ccc"
                  />
                </View>
              )}
            </View>
            <Text
              style={[
                styles.previewCompanyName,
                { color: colors.primary },
              ]}
            >
              Deine Baul\u00F6wen GmbH
            </Text>
            {zusatztextKopf ? (
              <Text style={styles.previewZusatz}>{zusatztextKopf}</Text>
            ) : null}
            <View
              style={[
                styles.previewLine,
                { backgroundColor: colors.primary },
              ]}
            />
            <Text style={styles.previewAbsender}>{absenderZeile}</Text>
            <View style={{ height: 12 }} />
            <Text style={styles.previewRecipient}>
              SAGA GWG{"\n"}Rechnungsabteilung{"\n"}Beispielstra\u00DFe 1
              {"\n"}20095 Hamburg
            </Text>
            <View style={{ height: 16 }} />
            <Text
              style={[
                styles.previewDocTitle,
                { color: colors.primary },
              ]}
            >
              Angebot ANG-2026-003-01
            </Text>
            <Text style={styles.previewDate}>Datum: 08.02.2026</Text>
            <View style={{ height: 12 }} />
            <Text style={styles.previewBody}>
              Sehr geehrte Damen und Herren,{"\n\n"}anbei erhalten Sie unser
              Angebot f\u00FCr die beauftragten Malerarbeiten im Objekt
              Beispielstra\u00DFe 1.{"\n\n"}Position 1: Wandfl\u00E4chen
              streichen {"\u2014"} 120 m\u00B2 {"\u00D7"} {"\u20AC"}4,80 ={" "}
              {"\u20AC"}576,00{"\n"}Position 2: Decke streichen {"\u2014"} 45
              m\u00B2 {"\u00D7"} {"\u20AC"}5,20 = {"\u20AC"}234,00{"\n\n"}
              Gesamtsumme netto: {"\u20AC"}810,00{"\n"}MwSt. 19%: {"\u20AC"}
              153,90{"\n"}Gesamtsumme brutto: {"\u20AC"}963,90
            </Text>
            <View
              style={[
                styles.previewLine,
                { backgroundColor: colors.primary, marginTop: 20 },
              ]}
            />
            <Text style={styles.previewFooter}>
              {fusszeilen.filter((l) => l.trim()).join(" | ")}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Dokument-Vorlagen</Text>
        <View style={styles.card}>
          {templates.map((tpl, i) => (
            <View key={tpl}>
              <View style={styles.templateRow}>
                <View style={styles.templateLeft}>
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color={Colors.raw.zinc400}
                  />
                  <Text style={styles.templateName}>{tpl}</Text>
                </View>
                <View style={styles.templateActions}>
                  <Pressable
                    onPress={() =>
                      Alert.alert("Vorschau", `Vorschau f\u00FCr: ${tpl}`)
                    }
                    style={({ pressed }) => [
                      styles.templateBtnSmall,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Text style={styles.templateBtnSmallText}>Vorschau</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      Alert.alert("Bearbeiten", `Bearbeiten: ${tpl}`)
                    }
                    style={({ pressed }) => [
                      styles.templateBtnSmall,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Text style={styles.templateBtnSmallTextAmber}>
                      Bearbeiten
                    </Text>
                  </Pressable>
                </View>
              </View>
              {i < templates.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <View style={styles.bottomActions}>
          <Pressable
            onPress={() =>
              Alert.alert(
                "Test-PDF",
                "Ein Test-PDF wird erzeugt und heruntergeladen."
              )
            }
            style={({ pressed }) => [
              styles.testPdfBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons
              name="document-outline"
              size={18}
              color={Colors.raw.amber500}
            />
            <Text style={styles.testPdfBtnText}>Test-PDF erzeugen</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              Alert.alert(
                "Gespeichert",
                "Briefpapier-Einstellungen wurden erfolgreich gespeichert."
              )
            }
            style={({ pressed }) => [
              styles.saveButton,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.saveText}>Speichern</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 28,
    color: Colors.raw.white,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc400,
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
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
    paddingVertical: 16,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.raw.zinc800,
  },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc400,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.raw.zinc800,
    color: Colors.raw.white,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  dropZone: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.raw.zinc600,
    borderStyle: "dashed",
    padding: 20,
    alignItems: "center",
  },
  dropZoneContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  dropZoneCompany: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.zinc400,
  },
  logoPreviewImage: {
    width: 80,
    height: 48,
  },
  dropZoneButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.raw.zinc900,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  uploadBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.amber500,
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.raw.zinc900,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  removeBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  dropZoneHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.raw.zinc800,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: Colors.raw.amber500,
  },
  toggleBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc400,
  },
  toggleBtnTextActive: {
    color: "#000",
  },
  chipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.raw.zinc800,
  },
  chipBtnActive: {
    backgroundColor: Colors.raw.amber500,
  },
  chipBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc400,
  },
  chipBtnTextActive: {
    color: "#000",
  },
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  colorLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc400,
    flex: 1,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  colorInput: {
    backgroundColor: Colors.raw.zinc800,
    color: Colors.raw.white,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    width: 110,
  },
  previewArea: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    minHeight: 400,
  },
  previewLogoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  previewLogoPlaceholder: {
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  previewCompanyName: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    marginBottom: 2,
  },
  previewZusatz: {
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    color: "#71717a",
    marginBottom: 6,
  },
  previewLine: {
    height: 1,
    width: "100%",
    marginVertical: 8,
  },
  previewAbsender: {
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    color: "#71717a",
  },
  previewRecipient: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#18181b",
    lineHeight: 16,
  },
  previewDocTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    marginBottom: 4,
  },
  previewDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#18181b",
  },
  previewBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: "#18181b",
    lineHeight: 15,
  },
  previewFooter: {
    fontFamily: "Inter_400Regular",
    fontSize: 8,
    color: "#a1a1aa",
    textAlign: "center",
    marginTop: 10,
  },
  templateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  templateLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  templateName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.white,
  },
  templateActions: {
    flexDirection: "row",
    gap: 8,
  },
  templateBtnSmall: {
    backgroundColor: Colors.raw.zinc700,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  templateBtnSmallText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.zinc300,
  },
  templateBtnSmallTextAmber: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.amber500,
  },
  bottomActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  testPdfBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 16,
    paddingVertical: 16,
  },
  testPdfBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.amber500,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#000",
  },
});
