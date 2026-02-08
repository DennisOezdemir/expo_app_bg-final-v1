import { useEffect, useRef, useCallback } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useRootNavigationState } from "expo-router";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthRouter() {
  const router = useRouter();
  const { isAuthenticated, splashSeen, isLoading } = useAuth();
  const hasNavigated = useRef(false);
  const navigationState = useRootNavigationState();

  const navigate = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    try {
      if (isAuthenticated) {
        router.replace("/(tabs)" as any);
      } else if (!splashSeen) {
        router.replace("/splash" as any);
      } else {
        router.replace("/login" as any);
      }
    } catch {
      hasNavigated.current = false;
    }
  }, [isAuthenticated, splashSeen, router]);

  useEffect(() => {
    if (isLoading || hasNavigated.current) return;

    const isReady = navigationState?.key;
    if (!isReady) return;

    const timer = setTimeout(navigate, 150);
    return () => clearTimeout(timer);
  }, [isLoading, navigationState?.key, navigate]);

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
