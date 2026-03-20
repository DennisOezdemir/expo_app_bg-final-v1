import { ReactNode } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useRole, type UserRole, type ScreenName } from "@/contexts/RoleContext";

interface RoleGuardProps {
  /** Screen name to check against SCREEN_ACCESS map */
  screen?: ScreenName;
  /** Or check against specific allowed roles */
  allowedRoles?: UserRole[];
  children: ReactNode;
  /** Optional custom fallback — defaults to "Kein Zugriff" screen */
  fallback?: ReactNode;
}

function AccessDenied() {
  const { user } = useRole();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed" size={48} color={Colors.raw.zinc600} />
        </View>
        <Text style={styles.title}>Kein Zugriff</Text>
        <Text style={styles.detail}>
          Diese Seite ist für deine Rolle ({user.roleLabel}) nicht verfügbar.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Ionicons name="arrow-back" size={18} color="#000" />
          <Text style={styles.backBtnText}>Zurück</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function RoleGuard({ screen, allowedRoles, children, fallback }: RoleGuardProps) {
  const { role, canViewScreen } = useRole();

  let hasAccess = false;

  if (screen) {
    hasAccess = canViewScreen(screen);
  } else if (allowedRoles) {
    hasAccess = allowedRoles.includes(role);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : <AccessDenied />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 40,
    alignItems: "center",
    maxWidth: 340,
    width: "100%",
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.raw.zinc800,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 22,
    color: Colors.raw.white,
    marginBottom: 8,
  },
  detail: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.zinc500,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.raw.amber500,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  backBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#000",
  },
});
