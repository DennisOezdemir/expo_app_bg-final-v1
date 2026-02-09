import { useEffect } from "react";
import { StyleSheet, Text, View, Platform, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useOffline } from "@/contexts/OfflineContext";

export function OfflineBanner() {
  const { isOnline, showSyncToast, dismissSyncToast } = useOffline();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const bannerY = useSharedValue(-60);
  const toastY = useSharedValue(-60);
  const toastOpacity = useSharedValue(0);

  useEffect(() => {
    bannerY.value = withSpring(isOnline ? -60 : 0, { damping: 15, stiffness: 120 });
  }, [isOnline, bannerY]);

  useEffect(() => {
    if (showSyncToast) {
      toastY.value = withSpring(0, { damping: 15, stiffness: 120 });
      toastOpacity.value = withTiming(1, { duration: 200 });
    } else {
      toastY.value = withTiming(-60, { duration: 200 });
      toastOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [showSyncToast, toastY, toastOpacity]);

  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bannerY.value }],
  }));

  const toastStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: toastY.value }],
    opacity: toastOpacity.value,
  }));

  const toastBg = showSyncToast?.type === "success"
    ? Colors.raw.emerald500 + "20"
    : showSyncToast?.type === "error"
    ? Colors.raw.rose500 + "20"
    : showSyncToast?.type === "conflict"
    ? Colors.raw.amber500 + "20"
    : Colors.raw.amber500 + "15";

  const toastBorder = showSyncToast?.type === "success"
    ? Colors.raw.emerald500 + "40"
    : showSyncToast?.type === "error"
    ? Colors.raw.rose500 + "40"
    : Colors.raw.amber500 + "40";

  const toastColor = showSyncToast?.type === "success"
    ? Colors.raw.emerald400
    : showSyncToast?.type === "error"
    ? Colors.raw.rose400
    : Colors.raw.amber400;

  const toastIcon = showSyncToast?.type === "success"
    ? "checkmark-circle"
    : showSyncToast?.type === "error"
    ? "alert-circle"
    : showSyncToast?.type === "conflict"
    ? "warning"
    : "sync-circle";

  return (
    <>
      <Animated.View
        style={[
          styles.banner,
          bannerStyle,
          { paddingTop: topPad + 4, top: 0 },
        ]}
        pointerEvents={isOnline ? "none" : "auto"}
      >
        <View style={styles.bannerInner}>
          <Ionicons name="cloud-offline-outline" size={16} color={Colors.raw.amber500} />
          <Text style={styles.bannerText}>
            Offline — Änderungen werden gespeichert
          </Text>
        </View>
      </Animated.View>

      {showSyncToast && (
        <Animated.View
          style={[
            styles.toast,
            toastStyle,
            {
              paddingTop: topPad + 4,
              top: 0,
              backgroundColor: toastBg,
              borderBottomColor: toastBorder,
            },
          ]}
        >
          <View style={styles.toastInner}>
            <Ionicons name={toastIcon as any} size={16} color={toastColor} />
            <Text style={[styles.toastText, { color: toastColor }]}>
              {showSyncToast.message}
            </Text>
            {showSyncToast.type === "conflict" && showSyncToast.conflictAction && (
              <Pressable
                onPress={showSyncToast.conflictAction}
                style={({ pressed }) => [styles.toastAction, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.toastActionText}>Laden</Text>
              </Pressable>
            )}
            {(showSyncToast.type === "success" || showSyncToast.type === "error") && (
              <Pressable onPress={dismissSyncToast} hitSlop={12}>
                <Ionicons name="close" size={16} color={toastColor} />
              </Pressable>
            )}
          </View>
        </Animated.View>
      )}
    </>
  );
}

export function OfflineBadge({ cacheAge }: { cacheAge?: string | null }) {
  if (!cacheAge) return null;
  return (
    <View style={styles.badge}>
      <Ionicons name="cloud-offline-outline" size={11} color={Colors.raw.zinc400} />
      <Text style={styles.badgeText}>Stand: {cacheAge}</Text>
    </View>
  );
}

export function OfflineBlockedHint({ message }: { message?: string }) {
  return (
    <View style={styles.blocked}>
      <Ionicons name="warning-outline" size={14} color={Colors.raw.amber500} />
      <Text style={styles.blockedText}>{message || "Nur online möglich"}</Text>
    </View>
  );
}

export function SyncDot() {
  return <View style={styles.syncDot} />;
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: Colors.raw.amber500 + "15",
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.amber500 + "30",
  },
  bannerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    paddingBottom: 10,
  },
  bannerText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.amber500,
  },
  toast: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottomWidth: 1,
  },
  toastInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    paddingBottom: 10,
  },
  toastText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  toastAction: {
    backgroundColor: Colors.raw.amber500 + "20",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 4,
  },
  toastActionText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: Colors.raw.amber500,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.raw.zinc800,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.raw.zinc400,
  },
  blocked: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.raw.amber500 + "10",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.raw.amber500 + "20",
  },
  blockedText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.amber500,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.raw.amber500,
  },
});
