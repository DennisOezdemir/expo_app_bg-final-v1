import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Colors from "@/constants/colors";
import { useTeamMember, useMonteurAufgaben } from "@/hooks/queries/useMonteurAufgaben";
import { useUploadFoto } from "@/hooks/mutations/useUploadFoto";
import type { MonteurAufgabe } from "@/lib/api/monteur";

type FotoType = "Fortschritt" | "Mangel" | "Material";

export default function FotoTabScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 84 : 90;

  const { data: teamMember } = useTeamMember();
  const { data: aufgaben = [] } = useMonteurAufgaben(teamMember?.id);
  const uploadMutation = useUploadFoto();

  const [selectedType, setSelectedType] = useState<FotoType>("Fortschritt");
  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null);

  // Aktuelles Projekt = erstes aktives Projekt des Monteurs
  const today = new Date().toISOString().split("T")[0];
  const currentAufgabe: MonteurAufgabe | undefined = aufgaben.find(
    (a) => a.start_date <= today && a.end_date >= today
  ) ?? aufgaben[0];

  const openCamera = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Berechtigung nötig", "Bitte erlaube den Kamerazugriff in den Einstellungen.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const uri = result.assets[0].uri;
    setLastPhotoUri(uri);

    if (!currentAufgabe) {
      Alert.alert("Kein Projekt", "Dir ist aktuell kein Projekt zugewiesen.");
      return;
    }

    uploadMutation.mutate(
      {
        project_id: currentAufgabe.project_id,
        uri,
        type: selectedType,
      },
      {
        onSuccess: () => {
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Gespeichert", `${selectedType}-Foto wurde hochgeladen.`);
        },
        onError: (err) => {
          Alert.alert("Fehler", `Upload fehlgeschlagen: ${err.message}`);
        },
      }
    );
  };

  const typeOptions: { type: FotoType; icon: string; color: string }[] = [
    { type: "Mangel", icon: "construct", color: Colors.raw.amber500 },
    { type: "Fortschritt", icon: "trending-up", color: Colors.raw.emerald500 },
    { type: "Material", icon: "cube", color: "#3b82f6" },
  ];

  return (
    <View style={s.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingTop: topInset + 20, paddingBottom: bottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>Fotos</Text>

        {/* Projekt-Info */}
        {currentAufgabe && (
          <View style={s.projectBanner}>
            <Ionicons name="location" size={16} color={Colors.raw.amber500} />
            <Text style={s.projectBannerText} numberOfLines={1}>
              {currentAufgabe.object_street} \u2022 {currentAufgabe.trade}
            </Text>
          </View>
        )}

        {/* Kamera-Button */}
        <Pressable
          onPress={openCamera}
          disabled={uploadMutation.isPending}
          style={({ pressed }) => [
            s.cameraBtn,
            { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
          testID="camera-button"
        >
          {uploadMutation.isPending ? (
            <View style={s.cameraIconWrap}>
              <ActivityIndicator size={32} color="#000" />
            </View>
          ) : (
            <View style={s.cameraIconWrap}>
              <Ionicons name="camera" size={32} color="#000" />
            </View>
          )}
          <Text style={s.cameraBtnLabel}>
            {uploadMutation.isPending ? "Wird hochgeladen..." : "Foto aufnehmen"}
          </Text>
          <Text style={s.cameraBtnSub}>
            {currentAufgabe ? `Wird zu ${currentAufgabe.object_street} gespeichert` : "Kein Projekt zugewiesen"}
          </Text>
        </Pressable>

        {/* Foto-Typ Auswahl */}
        <View style={s.quickRow}>
          {typeOptions.map((opt) => (
            <Pressable
              key={opt.type}
              style={({ pressed }) => [
                s.quickBtn,
                selectedType === opt.type && s.quickBtnActive,
                { opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSelectedType(opt.type);
              }}
            >
              <Ionicons name={opt.icon as any} size={22} color={selectedType === opt.type ? opt.color : Colors.raw.zinc500} />
              <Text style={[s.quickLabel, selectedType === opt.type && { color: Colors.raw.white }]}>
                {opt.type}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Letztes Foto Vorschau */}
        {lastPhotoUri && (
          <>
            <Text style={s.sectionTitle}>Letztes Foto</Text>
            <View style={s.previewCard}>
              <Image source={{ uri: lastPhotoUri }} style={s.previewImage} resizeMode="cover" />
              <View style={s.previewInfo}>
                <Text style={s.previewType}>{selectedType}</Text>
                {uploadMutation.isSuccess && (
                  <View style={s.uploadedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.raw.emerald500} />
                    <Text style={s.uploadedText}>Gespeichert</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  scroll: { paddingHorizontal: 20 },
  title: { fontFamily: "Inter_800ExtraBold", fontSize: 30, color: Colors.raw.white, marginBottom: 16 },

  projectBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  projectBannerText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc300, flex: 1 },

  cameraBtn: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 28,
    alignItems: "center",
    marginBottom: 20,
  },
  cameraIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: Colors.raw.amber500,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  cameraBtnLabel: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.raw.white, marginBottom: 4 },
  cameraBtnSub: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.raw.zinc500 },

  quickRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
  quickBtn: {
    flex: 1,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  quickBtnActive: {
    borderColor: Colors.raw.amber500,
    backgroundColor: Colors.raw.amber500 + "10",
  },
  quickLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc500 },

  sectionTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 18, color: Colors.raw.white, marginBottom: 12 },

  previewCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: 240,
  },
  previewInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  previewType: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.white },
  uploadedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  uploadedText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.emerald500 },
});
