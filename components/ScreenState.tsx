import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { SkeletonCard } from "@/components/Skeleton";

interface ScreenStateProps {
  kind: "loading" | "error" | "empty";
  skeleton?: React.ReactNode;
  title?: string;
  detail?: string;
  retryLabel?: string;
  onRetry?: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export function ScreenState({
  kind,
  skeleton,
  title,
  detail,
  retryLabel = "Erneut versuchen",
  onRetry,
  iconName,
}: ScreenStateProps) {
  if (kind === "loading") {
    return skeleton ? <>{skeleton}</> : <SkeletonCard />;
  }

  return (
    <View style={styles.container}>
      <Ionicons
        name={iconName ?? (kind === "error" ? "cloud-offline-outline" : "folder-open-outline")}
        size={48}
        color={Colors.raw.zinc700}
      />
      <Text style={styles.title}>{title ?? (kind === "error" ? "Fehler beim Laden" : "Keine Einträge gefunden")}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      {kind === "error" && onRetry ? (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [styles.retryButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.retryText}>{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.raw.zinc600,
    textAlign: "center",
  },
  detail: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: Colors.raw.amber500,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#000",
  },
});
