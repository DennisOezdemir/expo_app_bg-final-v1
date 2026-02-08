import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthRouter() {
  const router = useRouter();
  const { isAuthenticated, splashSeen, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.replace("/(tabs)" as any);
    } else if (!splashSeen) {
      router.replace("/splash" as any);
    } else {
      router.replace("/login" as any);
    }
  }, [isLoading, isAuthenticated, splashSeen]);

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
