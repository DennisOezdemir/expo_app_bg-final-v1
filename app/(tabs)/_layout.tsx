import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label, Badge } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, Text } from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import React from "react";
import Colors from "@/constants/colors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Start</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="projekte">
        <Icon sf={{ default: "list.clipboard", selected: "list.clipboard.fill" }} />
        <Label>Projekte</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="freigaben">
        <Icon sf={{ default: "checkmark.seal", selected: "checkmark.seal.fill" }} />
        <Label>Freigaben</Label>
        <Badge>3</Badge>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="material">
        <Icon sf={{ default: "shippingbox", selected: "shippingbox.fill" }} />
        <Label>Material</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profil">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

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

function ClassicTabLayout() {
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";

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
      <Tabs.Screen
        name="freigaben"
        options={{
          title: "Freigaben",
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
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="package-variant" size={size} color={color} />
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
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
