import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { RoleProvider } from "@/contexts/RoleContext";
import { DebugLogProvider } from "@/contexts/DebugLogContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";

SplashScreen.preventAutoHideAsync();

// Registriert Push-Token sobald Auth bereit ist (muss innerhalb AuthProvider leben)
function PushNotificationRegistrar({ children }: { children: React.ReactNode }) {
  usePushNotifications();
  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, headerBackTitle: "Zurück" }}>
      <Stack.Screen name="index" options={{ headerShown: false, animation: "none" }} />
      <Stack.Screen name="splash" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen name="login" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen name="project/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="auftrag/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="begehung/[type]" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="planung/index" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="planung/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="foto/index" options={{ headerShown: false, animation: "slide_from_bottom" }} />
      <Stack.Screen name="angebot/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="angebot/editor" options={{ headerShown: false, animation: "slide_from_bottom" }} />
      <Stack.Screen name="angebote/index" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="finanzen/index" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="rechnung/index" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="rechnung/neu" options={{ headerShown: false, animation: "slide_from_bottom" }} />
      <Stack.Screen name="rechnung/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="freigabe/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="bestellung/index" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="einstellungen/firma" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="einstellungen/kunden" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="einstellungen/lieferanten" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="einstellungen/katalog" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="einstellungen/team" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="einstellungen/briefpapier" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="einstellungen/import" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen
        name="assign-material"
        options={{
          presentation: "formSheet",
          sheetAllowedDetents: [0.65, 1],
          sheetGrabberVisible: true,
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
    ...Feather.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PushNotificationRegistrar>
            <OfflineProvider>
              <RoleProvider>
                <DebugLogProvider>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <KeyboardProvider>
                      <StatusBar style="light" />
                      <RootLayoutNav />
                    </KeyboardProvider>
                  </GestureHandlerRootView>
                </DebugLogProvider>
              </RoleProvider>
            </OfflineProvider>
          </PushNotificationRegistrar>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
