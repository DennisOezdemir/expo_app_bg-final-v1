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
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Colors from "@/constants/colors";
import { useCompanySettings } from "@/hooks/queries/useSuppliers";
import { saveCompanySettings } from "@/lib/api/suppliers";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

type LogoPosition = "links" | "mitte" | "rechts";
type LogoSize = "klein" | "mittel" | "gross";

const DEFAULTS = {
  LOGO_POSITION: "links" as LogoPosition,
  LOGO_SIZE: "mittel" as LogoSize,
  FONT_CHOICE: "Inter",
  ABSENDER_ZEILE: "Deine Baulöwen GmbH • Musterstr. 12 • 20095 Hamburg",
  ZUSATZTEXT_KOPF: "Meisterbetrieb seit 2020",
  FUSSZEILE_1: "Deine Baulöwen GmbH • GF: Dennis",
  FUSSZEILE_2: "Musterstr. 12 • 20095 Hamburg",
  FUSSZEILE_3: "Tel: 040-123456 • info@bauloewen.de",
  FUSSZEILE_4: "Hamburger Sparkasse • IBAN: DE89 3704...",
  FUSSZEILE_5: "HRB 12345 • USt-IdNr: DE123456789",
  COLOR_PRIMARY: "#F59E0B",
  COLOR_TEXT: "#18181B",
  COLOR_ACCENT: "#10B981",
};

export default function BriefpapierScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useCompanySettings();
  const [saving, setSaving] = useState(false);

  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>(DEFAULTS.LOGO_POSITION);
  const [logoSize, setLogoSize] = useState<LogoSize>(DEFAULTS.LOGO_SIZE);
  const [fontChoice, setFontChoice] = useState(DEFAULTS.FONT_CHOICE);
  const [absenderZeile, setAbsenderZeile] = useState(DEFAULTS.ABSENDER_ZEILE);
  const [zusatztextKopf, setZusatztextKopf] = useState(DEFAULTS.ZUSATZTEXT_KOPF);
  const [fusszeilen, setFusszeilen] = useState([
    DEFAULTS.FUSSZEILE_1,
    DEFAULTS.FUSSZEILE_2,
    DEFAULTS.FUSSZEILE_3,
    DEFAULTS.FUSSZEILE_4,
    DEFAULTS.FUSSZEILE_5,
  ]);
  const [colors, setColors] = useState({
    primary: DEFAULTS.COLOR_PRIMARY,
    text: DEFAULTS.COLOR_TEXT,
    accent: DEFAULTS.COLOR_ACCENT,
  });

  // Load from DB when settings arrive
  useEffect(() => {
    if (!settings) return;
    setLogoPosition((settings.LOGO_POSITION as LogoPosition) ?? DEFAULTS.LOGO_POSITION);
    setLogoSize((settings.LOGO_SIZE as LogoSize) ?? DEFAULTS.LOGO_SIZE);
    setFontChoice(settings.FONT_CHOICE ?? DEFAULTS.FONT_CHOICE);
    setAbsenderZeile(settings.ABSENDER_ZEILE ?? DEFAULTS.ABSENDER_ZEILE);
    setZusatztextKopf(settings.ZUSATZTEXT_KOPF ?? DEFAULTS.ZUSATZTEXT_KOPF);
    setFusszeilen([
      settings.FUSSZEILE_1 ?? DEFAULTS.FUSSZEILE_1,
      settings.FUSSZEILE_2 ?? DEFAULTS.FUSSZEILE_2,
      settings.FUSSZEILE_3 ?? DEFAULTS.FUSSZEILE_3,
      settings.FUSSZEILE_4 ?? DEFAULTS.FUSSZEILE_4,
      settings.FUSSZEILE_5 ?? DEFAULTS.FUSSZEILE_5,
    ]);
    setColors({
      primary: settings.COLOR_PRIMARY ?? DEFAULTS.COLOR_PRIMARY,
      text: settings.COLOR_TEXT ?? DEFAULTS.COLOR_TEXT,
      accent: settings.COLOR_ACCENT ?? DEFAULTS.COLOR_ACCENT,
    });
    if (settings.LOGO_URL) {
      setLogoUri(settings.LOGO_URL);
    }
  }, [settings]);

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
      const asset = result.assets[0];
      setLogoUri(asset.uri);

      // Upload to Supabase Storage
      try {
        const ext = asset.uri.split(".").pop() ?? "png";
        const fileName = `company_logo.${ext}`;
        const response = await fetch(asset.uri);
        const blob = await response.blob();

        const { error } = await supabase.storage
          .from("branding")
          .upload(fileName, blob, { upsert: true, contentType: `image/${ext}` });

        if (error) {
          console.warn("Logo upload error:", error.message);
          // Still keep the local URI for preview
        } else {
          const { data: urlData } = supabase.storage
            .from("branding")
            .getPublicUrl(fileName);
          if (urlData?.publicUrl) {
            setLogoUri(urlData.publicUrl);
          }
        }
      } catch (e) {
        console.warn("Logo upload failed:", e);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCompanySettings({
        LOGO_POSITION: logoPosition,
        LOGO_SIZE: logoSize,
        FONT_CHOICE: fontChoice,
        ABSENDER_ZEILE: absenderZeile,
        ZUSATZTEXT_KOPF: zusatztextKopf,
        FUSSZEILE_1: fusszeilen[0],
        FUSSZEILE_2: fusszeilen[1],
        FUSSZEILE_3: fusszeilen[2],
        FUSSZEILE_4: fusszeilen[3],
        FUSSZEILE_5: fusszeilen[4],
        COLOR_PRIMARY: colors.primary,
        COLOR_TEXT: colors.text,
        COLOR_ACCENT: colors.accent,
        ...(logoUri ? { LOGO_URL: logoUri } : {}),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.companySettings() });
      Alert.alert("Gespeichert", "Briefpapier-Einstellungen wurden gespeichert.");
    } catch (e: any) {
      Alert.alert("Fehler", e.message ?? "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  };

  const logoSizeMap: Record<LogoSize, number> = { klein: 40, mittel: 60, gross: 80 };
  const previewLogoHeight = logoSizeMap[logoSize];
  const previewLogoAlign: "flex-start" | "center" | "flex-end" =
    logoPosition === "links" ? "flex-start" : logoPosition === "mitte" ? "center" : "flex-end";

  const positionOptions: { key: LogoPosition; label: string; icon: string }[] = [
    { key: "links", label: "Links", icon: "arrow-back" },
    { key: "mitte", label: "Mitte", icon: "swap-horizontal" },
    { key: "rechts", label: "Rechts", icon: "arrow-forward" },
  ];

  const sizeOptions: { key: LogoSize; label: string }[] = [
    { key: "klein", label: "Klein" },
    { key: "mittel", label: "Mittel" },
    { key: "gross", label: "Groß" },
  ];

  const fontOptions = ["Inter", "Roboto", "Open Sans", "Lato"];

  const colorRows: { key: "primary" | "text" | "accent"; label: string }[] = [
    { key: "primary", label: "Primärfarbe" },
    { key: "text", label: "Textfarbe" },
    { key: "accent", label: "Akzentfarbe" },
  ];

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.raw.amber500} />
        <Text style={styles.loadingText}>Einstellungen laden...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topInset + 64, paddingBottom: bottomInset + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Briefpapier</Text>
        <Text style={styles.subtitle}>
          Wird verwendet für: Angebote, Rechnungen, Mahnungen, Protokolle
        </Text>

        <Text style={styles.sectionLabel}>Logo</Text>
        <View style={styles.card}>
          <View style={styles.dropZone}>
            <View style={styles.dropZoneContent}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logoPreviewImage} resizeMode="contain" />
              ) : (
                <Ionicons name="image-outline" size={48} color={Colors.raw.zinc500} />
              )}
              <Text style={styles.dropZoneCompany}>Deine Baulöwen GmbH</Text>
            </View>
            <View style={styles.dropZoneButtons}>
              <Pressable
                onPress={pickLogo}
                style={({ pressed }) => [styles.uploadBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name="folder-open-outline" size={16} color={Colors.raw.amber500} />
                <Text style={styles.uploadBtnText}>Logo hochladen</Text>
              </Pressable>
              <Pressable
                onPress={() => setLogoUri(null)}
                style={({ pressed }) => [styles.removeBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.raw.zinc500} />
                <Text style={styles.removeBtnText}>Entfernen</Text>
              </Pressable>
            </View>
            <Text style={styles.dropZoneHint}>Max 2MB • PNG, JPG, SVG</Text>
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
                  style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                >
                  <Ionicons name={opt.icon as any} size={16} color={active ? "#000" : Colors.raw.zinc400} />
                  <Text style={[styles.toggleBtnText, active && styles.toggleBtnTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Logo Größe</Text>
          <View style={styles.toggleRow}>
            {sizeOptions.map((opt) => {
              const active = logoSize === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setLogoSize(opt.key)}
                  style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                >
                  <Text style={[styles.toggleBtnText, active && styles.toggleBtnTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Schriftart</Text>
          <View style={styles.toggleRow}>
            {fontOptions.map((f) => {
              const active = fontChoice === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => setFontChoice(f)}
                  style={[styles.chipBtn, active && styles.chipBtnActive]}
                >
                  <Text style={[styles.chipBtnText, active && styles.chipBtnTextActive]}>{f}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionLabel}>Kopfzeile</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Absender-Zeile (klein, über Adresse)</Text>
          <TextInput
            style={styles.input}
            value={absenderZeile}
            onChangeText={setAbsenderZeile}
            placeholderTextColor={Colors.raw.zinc600}
            selectionColor={Colors.raw.amber500}
          />
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Zusatztext Kopf (optional)</Text>
          <TextInput
            style={styles.input}
            value={zusatztextKopf}
            onChangeText={setZusatztextKopf}
            placeholderTextColor={Colors.raw.zinc600}
            selectionColor={Colors.raw.amber500}
          />
        </View>

        <Text style={styles.sectionLabel}>Fußzeile</Text>
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
                <View style={[styles.colorSwatch, { backgroundColor: colors[cr.key] }]} />
                <TextInput
                  style={styles.colorInput}
                  value={colors[cr.key]}
                  onChangeText={(val) => updateColor(cr.key, val)}
                  placeholderTextColor={Colors.raw.zinc600}
                  selectionColor={Colors.raw.amber500}
                />
              </View>
              {i < colorRows.length - 1 && <View style={styles.divider} />}
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
                  style={{ height: previewLogoHeight, width: previewLogoHeight * 2 }}
                  resizeMode="contain"
                />
              ) : (
                <View
                  style={[
                    styles.previewLogoPlaceholder,
                    { height: previewLogoHeight, width: previewLogoHeight * 2 },
                  ]}
                >
                  <Ionicons name="image-outline" size={previewLogoHeight * 0.5} color="#ccc" />
                </View>
              )}
            </View>
            <Text style={[styles.previewCompanyName, { color: colors.primary }]}>
              Deine Baulöwen GmbH
            </Text>
            {zusatztextKopf ? <Text style={styles.previewZusatz}>{zusatztextKopf}</Text> : null}
            <View style={[styles.previewLine, { backgroundColor: colors.primary }]} />
            <Text style={styles.previewAbsender}>{absenderZeile}</Text>
            <View style={{ height: 12 }} />
            <Text style={styles.previewRecipient}>
              SAGA GWG{"\n"}Rechnungsabteilung{"\n"}Beispielstraße 1{"\n"}20095 Hamburg
            </Text>
            <View style={{ height: 16 }} />
            <Text style={[styles.previewDocTitle, { color: colors.primary }]}>
              Angebot ANG-2026-003-01
            </Text>
            <Text style={styles.previewDate}>Datum: 08.02.2026</Text>
            <View style={{ height: 12 }} />
            <Text style={styles.previewBody}>
              Sehr geehrte Damen und Herren,{"\n\n"}anbei erhalten Sie unser Angebot für die
              beauftragten Malerarbeiten im Objekt Beispielstraße 1.
            </Text>
            <View style={[styles.previewLine, { backgroundColor: colors.primary, marginTop: 20 }]} />
            <Text style={styles.previewFooter}>
              {fusszeilen.filter((l) => l.trim()).join(" | ")}
            </Text>
          </View>
        </View>

        <View style={styles.bottomActions}>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [styles.saveButton, { opacity: pressed || saving ? 0.7 : 1 }]}
          >
            {saving ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={styles.saveText}>Speichern</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  loadingContainer: { alignItems: "center", justifyContent: "center" },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.raw.zinc500, marginTop: 12 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  title: { fontFamily: "Inter_800ExtraBold", fontSize: 28, color: Colors.raw.white, marginBottom: 6 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc400, marginBottom: 24 },
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
  divider: { height: 1, backgroundColor: Colors.raw.zinc800 },
  fieldLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc400, marginBottom: 8 },
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
  dropZoneContent: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  dropZoneCompany: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.raw.zinc400 },
  logoPreviewImage: { width: 80, height: 48 },
  dropZoneButtons: { flexDirection: "row", gap: 12, marginBottom: 12 },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.raw.zinc900,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  uploadBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.amber500 },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.raw.zinc900,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  removeBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc500 },
  dropZoneHint: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500 },
  toggleRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.raw.zinc800,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleBtnActive: { backgroundColor: Colors.raw.amber500 },
  toggleBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc400 },
  toggleBtnTextActive: { color: "#000" },
  chipBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.raw.zinc800 },
  chipBtnActive: { backgroundColor: Colors.raw.amber500 },
  chipBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc400 },
  chipBtnTextActive: { color: "#000" },
  colorRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  colorLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc400, flex: 1 },
  colorSwatch: { width: 24, height: 24, borderRadius: 6 },
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
  previewArea: { backgroundColor: "#ffffff", borderRadius: 12, padding: 20, minHeight: 300 },
  previewLogoRow: { flexDirection: "row", marginBottom: 8 },
  previewLogoPlaceholder: { backgroundColor: "#f0f0f0", borderRadius: 6, alignItems: "center", justifyContent: "center" },
  previewCompanyName: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 2 },
  previewZusatz: { fontFamily: "Inter_400Regular", fontSize: 9, color: "#71717a", marginBottom: 6 },
  previewLine: { height: 1, width: "100%", marginVertical: 8 },
  previewAbsender: { fontFamily: "Inter_400Regular", fontSize: 9, color: "#71717a" },
  previewRecipient: { fontFamily: "Inter_400Regular", fontSize: 11, color: "#18181b", lineHeight: 16 },
  previewDocTitle: { fontFamily: "Inter_700Bold", fontSize: 13, marginBottom: 4 },
  previewDate: { fontFamily: "Inter_400Regular", fontSize: 11, color: "#18181b" },
  previewBody: { fontFamily: "Inter_400Regular", fontSize: 10, color: "#18181b", lineHeight: 15 },
  previewFooter: { fontFamily: "Inter_400Regular", fontSize: 8, color: "#a1a1aa", textAlign: "center", marginTop: 10 },
  bottomActions: { marginTop: 8 },
  saveButton: {
    backgroundColor: Colors.raw.amber500,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#000" },
});
