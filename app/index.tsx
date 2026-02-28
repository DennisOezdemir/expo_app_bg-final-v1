import { useEffect, useRef, useCallback } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";

export default function AuthRouter() {
  const router = useRouter();
  const hasNavigated = useRef(false);

  const navigate = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    try {
      router.replace("/(tabs)" as any);
    } catch {
      hasNavigated.current = false;
    }
  }, [router]);

  useEffect(() => {
    if (hasNavigated.current) return;
    const timer = setTimeout(navigate, 100);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.raw.amber500} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
    alignItems: "center",
    justifyContent: "center",
  },
});
