import { Stack, useRouter } from "expo-router";
import { StyleSheet, Text, View, Pressable } from "react-native";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: "Nicht gefunden" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Seite nicht gefunden</Text>
        <Text style={styles.subtitle}>
          Diese Seite existiert leider nicht.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.buttonText}>Zurück zur Startseite</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => router.replace("/(tabs)/projekte")}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
            Projekte öffnen
          </Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#18181b",
  },
  subtitle: {
    fontSize: 16,
    color: "#71717a",
    marginTop: 8,
    marginBottom: 32,
  },
  button: {
    width: "100%",
    minHeight: 48,
    backgroundColor: "#18181b",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  buttonSecondary: {
    backgroundColor: "#f4f4f5",
  },
  buttonTextSecondary: {
    color: "#18181b",
  },
});
