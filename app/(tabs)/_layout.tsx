import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label, Badge } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, Text, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useState } from "react";
import Colors from "@/constants/colors";
import { FAB, AssistantOverlay } from "@/components/BGAssistant";
import { useRole, type UserRole } from "@/contexts/RoleContext";
import { DebugConsole } from "@/components/DebugConsole";
import { DebugLogSeeder } from "@/components/DebugLogSeeder";
import { OfflineBanner } from "@/components/OfflineBanner";

function FreigabenBadge() {
  return (
    <View style={badgeStyles.container}>
      <Text style={badgeStyles.text}>3</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: -4,
    right: -10,
    backgroundColor: Colors.raw.rose500,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  text: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#fff",
    lineHeight: 13,
  },
});

function ImpersonationBanner() {
  const { role, user, isImpersonating, resetRole } = useRole();
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

type TabVisibility = {
  [tab: string]: boolean;
};

function getTabVisibility(role: UserRole): TabVisibility {
  return {
    index: true,
    projekte: role === "gf" || role === "bauleiter",
    freigaben: role === "gf",
    material: role === "gf" || role === "bauleiter",
    meinjob: role === "monteur",
    foto: role === "monteur",
    zeiten: role === "monteur",
    profil: true,
  };
}

function ClassicTabLayout() {
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";
  const { role } = useRole();
  const vis = getTabVisibility(role);

  const tabLabels: Record<UserRole, Record<string, string>> = {
    gf: { index: "Start", projekte: "Projekte", freigaben: "Freigaben", material: "Material", profil: "Profil" },
    bauleiter: { index: "Start", projekte: "Projekte", material: "Material", profil: "Profil" },
    monteur: { index: "Start", meinjob: "Mein Job", foto: "Foto", zeiten: "Zeiten", profil: "Profil" },
  };

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
          title: tabLabels[role]?.projekte || "Projekte",
          href: vis.projekte ? "/(tabs)/projekte" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="freigaben"
        options={{
          title: "Freigaben",
          href: vis.freigaben ? "/(tabs)/freigaben" : null,
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="checkmark-circle" size={size} color={color} />
              <FreigabenBadge />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="material"
        options={{
          title: "Material",
          href: vis.material ? "/(tabs)/material" : null,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="package-variant" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="meinjob"
        options={{
          title: "Mein Job",
          href: vis.meinjob ? "/(tabs)/meinjob" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="foto"
        options={{
          title: "Foto",
          href: vis.foto ? "/(tabs)/foto" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="zeiten"
        options={{
          title: "Zeiten",
          href: vis.zeiten ? "/(tabs)/zeiten" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const [assistantVisible, setAssistantVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const tabBarHeight = isWeb ? 84 : (Platform.OS === "ios" ? 49 + insets.bottom : 56);
  const fabBottom = tabBarHeight + 16;
  const { role, isImpersonating } = useRole();
  const showDebug = role === "gf" && __DEV__;

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      {isImpersonating && <ImpersonationBanner />}
      <ClassicTabLayout />
      <View style={{ position: "absolute", right: 20, bottom: fabBottom, zIndex: 50 }}>
        <FAB onPress={() => setAssistantVisible(true)} />
      </View>
      <AssistantOverlay visible={assistantVisible} onClose={() => setAssistantVisible(false)} />
      {showDebug && <DebugLogSeeder />}
      {showDebug && <DebugConsole />}
    </View>
  );
}
