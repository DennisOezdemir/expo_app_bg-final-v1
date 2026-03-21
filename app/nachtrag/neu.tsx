import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Colors from "@/constants/colors";
import { useCreateChangeOrder } from "@/hooks/mutations/useChangeOrderMutations";
import { uploadChangeOrderEvidence } from "@/lib/api/change-orders";
import type { ChangeOrderReason } from "@/lib/api/change-orders";

function showAlert(title: string, msg?: string) {
  if (Platform.OS === "web") {
    window.alert(msg ? `${title}: ${msg}` : title);
  } else {
    Alert.alert(title, msg);
  }
}

interface PositionInput {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
}

const REASON_OPTIONS: { value: ChangeOrderReason; label: string }[] = [
  { value: "ADDITIONAL_WORK", label: "Zusatzarbeit" },
  { value: "MODIFIED_WORK", label: "Ge\u00E4nderte Leistung" },
  { value: "UNFORESEEN", label: "Unvorhergesehen" },
  { value: "CLIENT_REQUEST", label: "Kundenwunsch" },
  { value: "PLANNING_ERROR", label: "Planungsfehler" },
  { value: "OTHER", label: "Sonstiges" },
];

const UNIT_OPTIONS = ["St", "m\u00B2", "m", "psch", "h", "lfm", "Stk"];

export default function NachtragNeuScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const createMutation = useCreateChangeOrder();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState<ChangeOrderReason>("ADDITIONAL_WORK");
  const [vobReference, setVobReference] = useState("");
  const [positions, setPositions] = useState<PositionInput[]>([
    { description: "", quantity: "1", unit: "St", unitPrice: "" },
  ]);
  const [photos, setPhotos] = useState<{ uri: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const addPosition = () => {
    setPositions([
      ...positions,
      { description: "", quantity: "1", unit: "St", unitPrice: "" },
    ]);
  };

  const updatePosition = (
    index: number,
    field: keyof PositionInput,
    value: string
  ) => {
    const updated = [...positions];
    updated[index] = { ...updated[index], [field]: value };
    setPositions(updated);
  };

  const removePosition = (index: number) => {
    if (positions.length <= 1) return;
    setPositions(positions.filter((_, i) => i !== index));
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPhotos([
        ...photos,
        {
          uri: asset.uri,
          name: asset.fileName || `foto_${Date.now()}.jpg`,
        },
      ]);
    }
  };

  const totalNet = positions.reduce((sum, p) => {
    const qty = parseFloat(p.quantity) || 0;
    const price = parseFloat(p.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const handleSave = async () => {
    if (!title.trim()) {
      showAlert("Titel fehlt", "Bitte gib einen Titel f\u00FCr den Nachtrag ein.");
      return;
    }
    const validPositions = positions.filter(
      (p) => p.description.trim() && parseFloat(p.unitPrice) > 0
    );
    if (validPositions.length === 0) {
      showAlert(
        "Positionen fehlen",
        "Mindestens eine Position mit Beschreibung und Preis."
      );
      return;
    }

    setSaving(true);
    try {
      const result = await createMutation.mutateAsync({
        projectId: projectId!,
        title: title.trim(),
        description: description.trim() || undefined,
        reason,
        vobReference: vobReference.trim() || undefined,
        items: validPositions.map((p) => ({
          description: p.description.trim(),
          quantity: parseFloat(p.quantity) || 1,
          unit: p.unit,
          unitPrice: parseFloat(p.unitPrice) || 0,
        })),
      });

      // Upload photos
      for (const photo of photos) {
        try {
          await uploadChangeOrderEvidence(result.id, photo.uri, photo.name);
        } catch {
          // photo upload failure is non-blocking
        }
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace({
        pathname: "/nachtrag/[id]",
        params: { id: result.id },
      });
    } catch (err: any) {
      showAlert("Fehler", err.message || "Nachtrag konnte nicht erstellt werden.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.raw.zinc950 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Nachtrag erstellen</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Titel */}
        <Text style={styles.label}>Titel *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="z.B. Rohrleitungsverlegung Bad"
          placeholderTextColor={Colors.raw.zinc600}
        />

        {/* Beschreibung */}
        <Text style={styles.label}>Beschreibung</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Was muss gemacht werden und warum?"
          placeholderTextColor={Colors.raw.zinc600}
          multiline
          numberOfLines={3}
        />

        {/* Grund */}
        <Text style={styles.label}>Grund</Text>
        <View style={styles.reasonRow}>
          {REASON_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setReason(opt.value)}
              style={[
                styles.reasonChip,
                reason === opt.value && styles.reasonChipActive,
              ]}
            >
              <Text
                style={[
                  styles.reasonChipText,
                  reason === opt.value && styles.reasonChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* VOB-Referenz */}
        <Text style={styles.label}>VOB-Referenz (optional)</Text>
        <TextInput
          style={styles.input}
          value={vobReference}
          onChangeText={setVobReference}
          placeholder="z.B. \u00A7 2 Abs. 6 VOB/B"
          placeholderTextColor={Colors.raw.zinc600}
        />

        {/* Positionen */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Positionen</Text>
          <Pressable onPress={addPosition} style={styles.addBtn}>
            <Ionicons name="add" size={16} color={Colors.raw.zinc950} />
          </Pressable>
        </View>

        {positions.map((pos, idx) => (
          <View key={idx} style={styles.posCard}>
            <View style={styles.posHeader}>
              <Text style={styles.posNum}>Pos. {idx + 1}</Text>
              {positions.length > 1 && (
                <Pressable onPress={() => removePosition(idx)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={Colors.raw.rose500} />
                </Pressable>
              )}
            </View>
            <TextInput
              style={styles.input}
              value={pos.description}
              onChangeText={(v) => updatePosition(idx, "description", v)}
              placeholder="Beschreibung der Position"
              placeholderTextColor={Colors.raw.zinc600}
            />
            <View style={styles.posRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.miniLabel}>Menge</Text>
                <TextInput
                  style={styles.input}
                  value={pos.quantity}
                  onChangeText={(v) => updatePosition(idx, "quantity", v)}
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.raw.zinc600}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.miniLabel}>Einheit</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 8 }}
                >
                  <View style={{ flexDirection: "row", gap: 4, paddingVertical: 4 }}>
                    {UNIT_OPTIONS.map((u) => (
                      <Pressable
                        key={u}
                        onPress={() => updatePosition(idx, "unit", u)}
                        style={[
                          styles.unitChip,
                          pos.unit === u && styles.unitChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.unitChipText,
                            pos.unit === u && styles.unitChipTextActive,
                          ]}
                        >
                          {u}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.miniLabel}>EP netto</Text>
                <TextInput
                  style={styles.input}
                  value={pos.unitPrice}
                  onChangeText={(v) => updatePosition(idx, "unitPrice", v)}
                  keyboardType="decimal-pad"
                  placeholder="\u20AC"
                  placeholderTextColor={Colors.raw.zinc600}
                />
              </View>
            </View>
            {(parseFloat(pos.quantity) || 0) > 0 &&
              (parseFloat(pos.unitPrice) || 0) > 0 && (
                <Text style={styles.posTotal}>
                  = \u20AC
                  {(
                    (parseFloat(pos.quantity) || 0) *
                    (parseFloat(pos.unitPrice) || 0)
                  ).toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              )}
          </View>
        ))}

        {/* Summe */}
        {totalNet > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Summe netto</Text>
            <Text style={styles.totalValue}>
              \u20AC{totalNet.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        )}

        {/* Foto-Beweis */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Foto-Beweis</Text>
          <Pressable onPress={pickPhoto} style={styles.addBtn}>
            <Ionicons name="camera" size={16} color={Colors.raw.zinc950} />
          </Pressable>
        </View>

        {photos.length > 0 ? (
          <View style={styles.photoGrid}>
            {photos.map((p, i) => (
              <View key={i} style={styles.photoThumb}>
                <Ionicons name="image" size={28} color={Colors.raw.amber500} />
                <Text style={styles.photoName} numberOfLines={1}>
                  {p.name}
                </Text>
                <Pressable
                  onPress={() => setPhotos(photos.filter((_, j) => j !== i))}
                  style={styles.photoRemove}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.raw.rose500} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyHint}>
            Fotos dokumentieren den Mehraufwand (optional)
          </Text>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveBtn,
            { opacity: pressed || saving ? 0.7 : 1 },
          ]}
        >
          {saving ? (
            <ActivityIndicator size={20} color={Colors.raw.zinc950} />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={Colors.raw.zinc950} />
              <Text style={styles.saveBtnText}>Nachtrag anlegen</Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
    backgroundColor: Colors.raw.zinc950,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
  },
  content: {
    padding: 16,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc300,
    marginBottom: 6,
    marginTop: 16,
  },
  miniLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 12,
    fontSize: 15,
    color: Colors.raw.white,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  reasonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  reasonChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.raw.zinc700,
    backgroundColor: "transparent",
  },
  reasonChipActive: {
    borderColor: Colors.raw.amber500,
    backgroundColor: Colors.raw.amber500 + "20",
  },
  reasonChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc400,
  },
  reasonChipTextActive: {
    color: Colors.raw.amber500,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.raw.white,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.raw.amber500,
    alignItems: "center",
    justifyContent: "center",
  },
  posCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 14,
    marginBottom: 12,
  },
  posHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  posNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.raw.amber500,
  },
  posRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  posTotal: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.emerald500,
    textAlign: "right",
    marginTop: 4,
  },
  unitChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    minWidth: 36,
    alignItems: "center",
  },
  unitChipActive: {
    borderColor: Colors.raw.amber500,
    backgroundColor: Colors.raw.amber500 + "20",
  },
  unitChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.zinc500,
  },
  unitChipTextActive: {
    color: Colors.raw.amber500,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
  },
  totalLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.zinc300,
  },
  totalValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  photoThumb: {
    width: 90,
    height: 90,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  photoName: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.raw.zinc500,
    marginTop: 4,
  },
  photoRemove: {
    position: "absolute",
    top: -6,
    right: -6,
  },
  emptyHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc600,
    marginBottom: 8,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.raw.zinc950,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 12,
    paddingVertical: 16,
    minHeight: 52,
  },
  saveBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.zinc950,
  },
});
