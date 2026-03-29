import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, Text, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useMemo } from "react";
import Colors from "@/constants/colors";
import { useRole } from "@/contexts/RoleContext";
import { DebugConsole } from "@/components/DebugConsole";
import { DebugLogSeeder } from "@/components/DebugLogSeeder";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useRealtimeInvalidation } from "@/hooks/realtime/useRealtimeInvalidation";
import { queryKeys } from "@/lib/query-keys";

function ImpersonationBanner() {
  const { role: _role, user, isImpersonating, resetRole } = useRole();
  if (!isImpersonating) return null;

  return (
    <View style={bannerStyles.container}>
      <View style={bannerStyles.inner}>
        <Ionicons name="eye" size={16} color={Colors.raw.amber500} />
        <Text style={bannerStyles.text}>Ansicht als {user.roleLabel}</Text>
        <Pressable
          onPress={resetRole}
          style={({ pressed }) => [bannerStyles.btn, { opacity: pressed ? 0.7 : 1 }]}
          testID="reset-role"
        >
          <Text style={bannerStyles.btnText}>Zurück</Text>
        </Pressable>
      </View>
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: Colors.raw.amber500 + "14",
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.amber500 + "30",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    paddingTop: Platform.OS === "web" ? 72 : undefined,
  },
  text: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.amber500 },
  btn: {
    backgroundColor: Colors.raw.amber500 + "20",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 4,
  },
  btnText: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.raw.amber500 },
});

function ClassicTabLayout() {
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";

  const projectRealtimeKeys = useMemo(
    () => [queryKeys.projects.all, queryKeys.dashboard.metrics()] as const,
    []
  );

  useRealtimeInvalidation({
    channelName: "rt_projects_tabs",
    table: "projects",
    queryKeys: projectRealtimeKeys,
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.raw.amber500,
        tabBarInactiveTintColor: Colors.raw.zinc500,
        tabBarLabelStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 11,
          marginTop: 2,
        },
        tabBarStyle: {
          position: "absolute" as const,
          backgroundColor: isIOS ? "transparent" : Colors.raw.zinc900,
          borderTopWidth: 1,
          borderTopColor: Colors.raw.zinc800,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: Colors.raw.zinc900 },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Start",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="projekte"
        options={{
          title: "Projekte",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="material" options={{ href: null }} />
      <Tabs.Screen
        name="planung"
        options={{
          title: "Planung",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="foto" options={{ href: null }} />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
      {/* Hidden tabs — bleiben als Routen, nicht in der Tab-Bar */}
      <Tabs.Screen name="freigaben" options={{ href: null }} />
      <Tabs.Screen name="meinjob" options={{ href: null }} />
      <Tabs.Screen name="zeiten" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabLayout() {
  const { role, isImpersonating } = useRole();
  const showDebug = role === "gf" && __DEV__;

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      {isImpersonating && <ImpersonationBanner />}
      <ClassicTabLayout />
      {showDebug && <DebugLogSeeder />}
      {showDebug && <DebugConsole />}
    </View>
  );
}
