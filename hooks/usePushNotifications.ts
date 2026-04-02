import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

// Foreground: Notification anzeigen (Badge + Sound)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Push-Notifications Hook:
 * - Registriert Push-Token bei App-Start
 * - Speichert Token in team_members.push_token (via auth_id)
 * - Handelt Foreground-Notifications
 * - Gibt lastNotification zurück für Navigation
 */
export function usePushNotifications() {
  const { user, isAuthenticated } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [lastNotification, setLastNotification] =
    useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    registerForPushNotifications().then((token) => {
      if (token) {
        setExpoPushToken(token);
        savePushToken(token, user.id);
      }
    });

    // Foreground: Notification empfangen
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setLastNotification(notification);
      });

    // User tippt auf Notification → Navigation-Data verfügbar
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        // data.screen + data.params können für Navigation genutzt werden
        console.log("[Push] Notification tapped:", data);
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated, user?.id]);

  return { expoPushToken, lastNotification };
}

async function registerForPushNotifications(): Promise<string | null> {
  // Web hat keine Push-Notifications via Expo
  if (Platform.OS === "web") return null;

  // Nur auf echten Geräten (nicht Simulator)
  if (!Device.isDevice) {
    console.warn("[Push] Push-Notifications nur auf echten Geräten verfügbar");
    return null;
  }

  // Bestehende Permission prüfen
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Permission anfragen falls noch nicht erteilt
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[Push] Push-Permission nicht erteilt");
    return null;
  }

  // Android: Notification Channel setzen
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "BauGenius",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#10b981",
    });
  }

  // Expo Push Token holen
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  return tokenResponse.data;
}

async function savePushToken(token: string, authUserId: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionToken = sessionData?.session?.access_token;
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

  if (!sessionToken || !supabaseUrl) {
    console.error("[Push] Session oder Supabase URL fehlt");
    return;
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/save-push-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({ token, auth_user_id: authUserId }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    console.error("[Push] Token speichern fehlgeschlagen:", body.error || `HTTP ${response.status}`);
  }
}
