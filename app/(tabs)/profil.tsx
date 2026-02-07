import { StyleSheet, Text, View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

export default function ProfilScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: topInset + 60 }]}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Profil</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    backgroundColor: Colors.raw.zinc900,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  placeholderText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.raw.zinc500,
  },
});
