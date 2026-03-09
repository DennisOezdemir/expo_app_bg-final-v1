import { useEffect, useRef, useCallback } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthRouter() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const hasNavigated = useRef(false);

  const navigate = useCallback(() => {
    if (hasNavigated.current || isLoading) return;
    hasNavigated.current = true;
    try {
      if (isAuthenticated) {
        router.replace("/(tabs)" as any);
      } else {
        router.replace("/login" as any);
      }
    } catch {
      hasNavigated.current = false;
    }
  }, [router, isAuthenticated, isLoading]);

  useEffect(() => {
    if (hasNavigated.current || isLoading) return;
    const timer = setTimeout(navigate, 100);
    return () => clearTimeout(timer);
  }, [navigate, isLoading]);

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
