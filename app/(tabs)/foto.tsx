import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface PhotoEntry {
  id: string;
  time: string;
  room: string;
  type: string;
  project: string;
}

const RECENT_PHOTOS: PhotoEntry[] = [
  { id: "1", time: "Heute 09:14", room: "Wohnzimmer", type: "Fortschritt", project: "Schwentnerring" },
  { id: "2", time: "Heute 08:30", room: "Küche", type: "Material", project: "Schwentnerring" },
  { id: "3", time: "Gestern 15:40", room: "Flur", type: "Mangel", project: "Schwentnerring" },
  { id: "4", time: "Gestern 11:20", room: "Bad", type: "Vorher", project: "Schwentnerring" },
];

export default function FotoTabScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 84 : 90;

  return (
    <View style={s.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingTop: topInset + 20, paddingBottom: bottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>Fotos</Text>

        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push("/foto");
          }}
          style={({ pressed }) => [s.cameraBtn, { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          testID="camera-button"
        >
          <View style={s.cameraIconWrap}>
            <Ionicons name="camera" size={32} color="#000" />
          </View>
          <Text style={s.cameraBtnLabel}>Foto aufnehmen</Text>
          <Text style={s.cameraBtnSub}>Wird automatisch zugeordnet</Text>
        </Pressable>

        <View style={s.quickRow}>
          <Pressable
            style={({ pressed }) => [s.quickBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <Ionicons name="construct" size={22} color={Colors.raw.amber500} />
            <Text style={s.quickLabel}>Mangel</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.quickBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <Ionicons name="trending-up" size={22} color={Colors.raw.emerald500} />
            <Text style={s.quickLabel}>Fortschritt</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.quickBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <MaterialCommunityIcon name="package-variant" size={22} color="#3b82f6" />
            <Text style={s.quickLabel}>Material</Text>
          </Pressable>
        </View>

        <Text style={s.sectionTitle}>Letzte Fotos</Text>
        <View style={s.photoList}>
          {RECENT_PHOTOS.map((photo, i) => (
            <View key={photo.id} style={[s.photoRow, i < RECENT_PHOTOS.length - 1 && s.photoBorder]}>
              <View style={s.photoThumb}>
                <Ionicons name="image" size={24} color={Colors.raw.zinc600} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.photoRoom}>{photo.room}</Text>
                <Text style={s.photoMeta}>{photo.type} {"\u2022"} {photo.time}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.raw.zinc600} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function MaterialCommunityIcon({ name, size, color }: { name: string; size: number; color: string }) {
  return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  scroll: { paddingHorizontal: 20 },
  title: { fontFamily: "Inter_800ExtraBold", fontSize: 30, color: Colors.raw.white, marginBottom: 24 },

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
  quickLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc300 },

  sectionTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 18, color: Colors.raw.white, marginBottom: 12 },
  photoList: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    overflow: "hidden",
  },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  photoBorder: { borderBottomWidth: 1, borderBottomColor: Colors.raw.zinc800 },
  photoThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.raw.zinc800,
    alignItems: "center",
    justifyContent: "center",
  },
  photoRoom: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.white },
  photoMeta: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc500, marginTop: 2 },
});
