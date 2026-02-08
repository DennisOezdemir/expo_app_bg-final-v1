import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useOffline, type SyncQueueItem, type SyncItemType } from "@/contexts/OfflineContext";

const TYPE_CONFIG: Record<SyncItemType, { icon: string; iconSet: "ion" | "mci"; color: string }> = {
  photo: { icon: "camera", iconSet: "ion", color: Colors.raw.amber500 },
  timestamp: { icon: "time", iconSet: "ion", color: "#60a5fa" },
  chat: { icon: "chatbubble", iconSet: "ion", color: Colors.raw.emerald500 },
  checklist: { icon: "checkbox", iconSet: "ion", color: Colors.raw.amber500 },
  begehung: { icon: "clipboard-check", iconSet: "mci", color: "#a78bfa" },
};

function formatAge(ms: number): string {
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `00:${String(secs).padStart(2, "0")}`;
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  return `${String(mins).padStart(2, "0")}:${String(remSecs).padStart(2, "0")}`;
}

function SyncItem({ item, now }: { item: SyncQueueItem; now: number }) {
  const cfg = TYPE_CONFIG[item.type];
  const age = formatAge(now - item.createdAt);

  const statusColor = item.status === "syncing"
    ? Colors.raw.amber500
    : item.status === "done"
    ? Colors.raw.emerald500
    : item.status === "failed"
    ? Colors.raw.rose500
    : Colors.raw.zinc400;

  return (
    <View style={styles.item}>
      <View style={[styles.itemDot, { backgroundColor: statusColor }]} />
      <View style={styles.itemIcon}>
        {cfg.iconSet === "ion" ? (
          <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
        ) : (
          <MaterialCommunityIcons name={cfg.icon as any} size={14} color={cfg.color} />
        )}
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemLabel} numberOfLines={1}>{item.label}</Text>
        <Text style={styles.itemDetail} numberOfLines={1}>{item.detail}</Text>
      </View>
      <Text style={styles.itemAge}>{age}</Text>
    </View>
  );
}

export function SyncQueuePanel() {
  const { syncQueue, isSyncing, syncNow, isOnline, syncProgress } = useOffline();
  const now = Date.now();
  const pendingCount = syncQueue.filter(i => i.status === "pending" || i.status === "failed").length;

  if (syncQueue.length === 0 && !isSyncing) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="cloud-upload-outline" size={16} color={Colors.raw.amber500} />
        <Text style={styles.headerTitle}>
          Sync-Queue: {pendingCount} ausstehend
        </Text>
      </View>

      <View style={styles.list}>
        {syncQueue.slice(0, 8).map(item => (
          <SyncItem key={item.id} item={item} now={now} />
        ))}
      </View>

      {syncQueue.length > 8 && (
        <Text style={styles.more}>+{syncQueue.length - 8} weitere</Text>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.syncBtn,
          isSyncing && styles.syncBtnDisabled,
          { opacity: pressed ? 0.7 : 1 },
        ]}
        onPress={syncNow}
        disabled={isSyncing || !isOnline}
      >
        <Ionicons
          name="sync"
          size={14}
          color={isSyncing ? Colors.raw.zinc500 : Colors.raw.amber500}
        />
        <Text style={[styles.syncBtnText, isSyncing && { color: Colors.raw.zinc500 }]}>
          {isSyncing
            ? syncProgress
              ? `Synchronisiere... ${syncProgress.current}/${syncProgress.total}`
              : "Synchronisiere..."
            : "Jetzt synchronisieren"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.raw.zinc800 + "80",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    margin: 8,
    marginTop: 4,
    padding: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  headerTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.amber500,
  },
  list: {
    gap: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemIcon: {
    width: 20,
    alignItems: "center",
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.raw.zinc200,
  },
  itemDetail: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.raw.zinc500,
  },
  itemAge: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.raw.zinc500,
    minWidth: 36,
    textAlign: "right",
  },
  more: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.raw.zinc500,
    textAlign: "center",
    marginTop: 4,
  },
  syncBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.raw.amber500 + "30",
    backgroundColor: Colors.raw.amber500 + "10",
  },
  syncBtnDisabled: {
    borderColor: Colors.raw.zinc700,
    backgroundColor: Colors.raw.zinc800,
  },
  syncBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.raw.amber500,
  },
});
