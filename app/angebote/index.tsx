import { StyleSheet, Text, View, Platform, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

export default function AngeboteListScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.7 : 1 }]}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
      </View>
      <View style={[styles.content, { paddingTop: topInset + 60 }]}>
        <Text style={styles.title}>Angebote</Text>
        <View style={styles.placeholder}>
          <Ionicons name="construct" size={32} color={Colors.raw.zinc500} />
          <Text style={styles.placeholderText}>Wird gebaut...</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: Colors.raw.zinc950 + "E6",
  },
  headerBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  title: { fontFamily: "Inter_800ExtraBold", fontSize: 30, color: Colors.raw.white, marginBottom: 32, alignSelf: "flex-start", position: "absolute", top: 0, left: 20 },
  placeholder: { alignItems: "center", gap: 12 },
  placeholderText: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.raw.zinc400 },
});
