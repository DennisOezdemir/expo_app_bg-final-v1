import {
  StyleSheet,
  Text,
  View,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { TopBar } from "@/components/TopBar";
import { useOffline } from "@/contexts/OfflineContext";
import { OfflineBlockedHint } from "@/components/OfflineBanner";
import { supabase } from "@/lib/supabase";

// --- Types ---

type ApprovalType = "auftrag" | "angebot" | "material" | "nachtrag" | "rechnung";

interface Approval {
  id: string;
  type: ApprovalType;
  title: string;
  projectCode: string;
  projectAddress: string;
  amount: string;
  detail: string;
  createdAgo: string;
  supplier?: string;
  reason?: string;
}

const TYPE_CONFIG: Record<
  ApprovalType,
  { label: string; icon: string; iconSet: "ionicons" | "material" | "feather"; color: string }
> = {
  auftrag: { label: "Auftrag freigeben", icon: "briefcase", iconSet: "ionicons", color: Colors.raw.amber500 },
  angebot: { label: "Angebot freigeben", icon: "document-text", iconSet: "ionicons", color: Colors.raw.amber400 },
  material: { label: "Material bestellen", icon: "package-variant", iconSet: "material", color: Colors.raw.emerald500 },
  nachtrag: { label: "Nachtrag genehmigen", icon: "git-pull-request", iconSet: "feather", color: Colors.raw.amber400 },
  rechnung: { label: "Rechnung freigeben", icon: "receipt", iconSet: "ionicons", color: Colors.raw.zinc400 },
};

const APPROVAL_TYPE_MAP: Record<string, ApprovalType> = {
  PROJECT_START: "auftrag",
  INVOICE: "rechnung",
  MATERIAL_ORDER: "material",
  SUBCONTRACTOR_ORDER: "material",
  INSPECTION_ASSIGN: "angebot",
  SCHEDULE: "angebot",
  COMPLETION: "angebot",
  INSPECTION: "angebot",
};

type FilterKey = "alle" | "auftrag" | "angebot" | "material" | "nachtrag";
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "auftrag", label: "Aufträge" },
  { key: "angebot", label: "Angebote" },
  { key: "material", label: "Material" },
  { key: "nachtrag", label: "Nachträge" },
];

// --- Helpers ---

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `vor ${diffH} Stunde${diffH > 1 ? "n" : ""}`;
  const diffD = Math.floor(diffH / 24);
  return `vor ${diffD} Tag${diffD > 1 ? "en" : ""}`;
}

function mapDbApproval(row: any): Approval {
  const uiType = APPROVAL_TYPE_MAP[row.approval_type] || "angebot";
  const project = row.projects;
  const summary = row.request_summary || "";
  const data = row.request_data || {};

  return {
    id: row.id,
    type: uiType,
    title: TYPE_CONFIG[uiType]?.label || "Freigabe",
    projectCode: project?.project_number || "–",
    projectAddress: [project?.object_street, project?.object_city].filter(Boolean).join(", ") || "–",
    amount: data.amount ? `€${data.amount}` : "",
    detail: summary || data.detail || "",
    createdAgo: formatTimeAgo(row.requested_at),
    supplier: data.supplier,
    reason: row.feedback_reason || data.reason,
  };
}

// --- Components ---

function TypeIcon({ type, size }: { type: ApprovalType; size: number }) {
  const cfg = TYPE_CONFIG[type];
  if (cfg.iconSet === "material") {
    return <MaterialCommunityIcons name={cfg.icon as any} size={size} color={cfg.color} />;
  }
  if (cfg.iconSet === "feather") {
    return <Feather name={cfg.icon as any} size={size} color={cfg.color} />;
  }
  return <Ionicons name={cfg.icon as any} size={size} color={cfg.color} />;
}

function SwipeableCard({
  approval,
  onApprove,
  onReject,
  onViewDetails,
  isTop,
  stackIndex,
  disabled,
}: {
  approval: Approval;
  onApprove: () => void;
  onReject: () => void;
  onViewDetails: () => void;
  isTop: boolean;
  stackIndex: number;
  disabled?: boolean;
}) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const approveFlash = useSharedValue(0);
  const rejectFlash = useSharedValue(0);
  const { width } = useWindowDimensions();
  const SWIPE_THRESHOLD = width * 0.3;
  const cfg = TYPE_CONFIG[approval.type];

  const handleApprove = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    approveFlash.value = withTiming(1, { duration: 150 });
    translateX.value = withTiming(width * 1.2, { duration: 300, easing: Easing.out(Easing.cubic) }, () => {
      runOnJS(onApprove)();
    });
  }, [onApprove, width, approveFlash, translateX]);

  const handleReject = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    rejectFlash.value = withTiming(1, { duration: 150 });
    translateX.value = withTiming(-width * 1.2, { duration: 300, easing: Easing.out(Easing.cubic) }, () => {
      runOnJS(onReject)();
    });
  }, [onReject, width, rejectFlash, translateX]);

  const panGesture = Gesture.Pan()
    .enabled(isTop && !disabled)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      if (e.translationX > 40) {
        approveFlash.value = Math.min(e.translationX / SWIPE_THRESHOLD, 1) * 0.5;
        rejectFlash.value = 0;
      } else if (e.translationX < -40) {
        rejectFlash.value = Math.min(Math.abs(e.translationX) / SWIPE_THRESHOLD, 1) * 0.5;
        approveFlash.value = 0;
      } else {
        approveFlash.value = 0;
        rejectFlash.value = 0;
      }
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        runOnJS(handleApprove)();
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        runOnJS(handleReject)();
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        approveFlash.value = withTiming(0, { duration: 200 });
        rejectFlash.value = withTiming(0, { duration: 200 });
      }
    });

  const cardAnimStyle = useAnimatedStyle(() => {
    const rotation = (translateX.value / width) * 12;
    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${rotation}deg` },
        { scale: 1 - stackIndex * 0.03 },
      ],
      opacity: opacity.value,
      top: stackIndex * 6,
    };
  });

  const approveOverlay = useAnimatedStyle(() => ({
    opacity: approveFlash.value,
  }));

  const rejectOverlay = useAnimatedStyle(() => ({
    opacity: rejectFlash.value,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          cardStyles.wrapper,
          cardAnimStyle,
          { zIndex: 10 - stackIndex },
        ]}
      >
        <View style={cardStyles.card}>
          <Animated.View
            style={[cardStyles.flashOverlay, { backgroundColor: Colors.raw.emerald500 }, approveOverlay]}
          />
          <Animated.View
            style={[cardStyles.flashOverlay, { backgroundColor: Colors.raw.rose500 }, rejectOverlay]}
          />

          <View style={cardStyles.header}>
            <View style={cardStyles.headerLeft}>
              <TypeIcon type={approval.type} size={20} />
              <Text style={cardStyles.headerLabel}>{cfg.label}</Text>
            </View>
            <View style={[cardStyles.typeDot, { backgroundColor: cfg.color }]} />
          </View>

          <View style={cardStyles.projectInfo}>
            <Text style={cardStyles.projectCode}>{approval.projectCode}</Text>
            <Text style={cardStyles.projectAddress}>{approval.projectAddress}</Text>
          </View>

          {approval.amount ? (
            <View style={cardStyles.amountSection}>
              <Ionicons name="cash" size={20} color={Colors.raw.amber500} />
              <Text style={cardStyles.amountText}>{approval.amount} netto</Text>
            </View>
          ) : null}

          {approval.detail ? (
            <Text style={cardStyles.detail}>{approval.detail}</Text>
          ) : null}

          {approval.supplier && (
            <View style={cardStyles.supplierRow}>
              <Feather name="truck" size={14} color={Colors.raw.zinc500} />
              <Text style={cardStyles.supplierText}>{approval.supplier}</Text>
            </View>
          )}

          {approval.reason && (
            <View style={cardStyles.supplierRow}>
              <Ionicons name="information-circle" size={14} color={Colors.raw.zinc500} />
              <Text style={cardStyles.supplierText}>{approval.reason}</Text>
            </View>
          )}

          <Text style={cardStyles.created}>{approval.createdAgo}</Text>

          <Pressable
            onPress={onViewDetails}
            style={({ pressed }) => [
              cardStyles.detailsButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            testID="details-button"
          >
            <Ionicons name="document-text-outline" size={16} color={Colors.raw.amber500} />
            <Text style={cardStyles.detailsButtonText}>Details ansehen</Text>
          </Pressable>

          <View style={cardStyles.actions}>
            <Pressable
              onPress={handleReject}
              disabled={disabled}
              style={({ pressed }) => [
                cardStyles.rejectButton,
                { opacity: disabled ? 0.4 : pressed ? 0.8 : 1, transform: [{ scale: pressed && !disabled ? 0.97 : 1 }] },
              ]}
              testID="reject-button"
            >
              <Ionicons name="close" size={20} color={Colors.raw.rose400} />
              <Text style={cardStyles.rejectText}>Nein</Text>
            </Pressable>
            <Pressable
              onPress={handleApprove}
              disabled={disabled}
              style={({ pressed }) => [
                cardStyles.approveButton,
                { opacity: disabled ? 0.4 : pressed ? 0.9 : 1, transform: [{ scale: pressed && !disabled ? 0.97 : 1 }] },
              ]}
              testID="approve-button"
            >
              <Ionicons name="checkmark" size={22} color="#fff" />
              <Text style={cardStyles.approveText}>FREIGEBEN</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 24,
    overflow: "hidden",
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.white,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  typeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  projectInfo: {
    marginBottom: 20,
  },
  projectCode: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc500,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  projectAddress: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.zinc300,
  },
  amountSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  amountText: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 28,
    color: Colors.raw.white,
  },
  detail: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc400,
    marginBottom: 10,
  },
  supplierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  supplierText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  created: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc600,
    marginTop: 4,
    marginBottom: 20,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  detailsButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.amber500,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  rejectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    minWidth: 90,
  },
  rejectText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.rose400,
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingVertical: 16,
    flex: 1,
  },
  approveText: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 16,
    color: "#fff",
    letterSpacing: 0.5,
  },
});

function EmptyState() {
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.checkCircle}>
        <Ionicons name="checkmark" size={48} color={Colors.raw.emerald500} />
      </View>
      <Text style={emptyStyles.title}>Alles erledigt</Text>
      <Text style={emptyStyles.subtitle}>Keine offenen Freigaben</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 24,
    color: Colors.raw.white,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.raw.zinc500,
  },
});

export default function FreigabenScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const router = useRouter();
  const { isOnline, getCacheAge: _getCacheAge } = useOffline();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("alle");
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);

  const fetchApprovals = useCallback(async () => {
    const { data, error } = await supabase
      .from("approvals")
      .select("*, projects(project_number, name, object_street, object_city, budget_net)")
      .eq("status", "PENDING")
      .order("requested_at", { ascending: false });

    if (error) {
      console.error("Freigaben laden:", error);
      return;
    }

    setApprovals((data || []).map(mapDbApproval));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("approvals_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "approvals" },
        () => {
          fetchApprovals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchApprovals]);

  const filtered = useMemo(() => {
    if (activeFilter === "alle") return approvals;
    return approvals.filter((a) => a.type === activeFilter);
  }, [activeFilter, approvals]);

  const handleApprove = useCallback(async (id: string) => {
    setActionInFlight(id);
    try {
      const { data, error } = await supabase.rpc("fn_approve_intake", { p_approval_id: id });
      if (error) {
        console.error("Approve failed:", error);
        if (Platform.OS === "web") alert("Fehler: " + error.message);
      } else if (data && !data.success) {
        console.error("Approve failed:", data.error);
        if (Platform.OS === "web") alert("Fehler: " + data.error);
      }
    } catch (e) {
      console.error("Approve error:", e);
    } finally {
      // Remove from local state immediately for snappy UX
      setApprovals((prev) => prev.filter((a) => a.id !== id));
      setActionInFlight(null);
    }
  }, []);

  const handleReject = useCallback(async (id: string) => {
    setActionInFlight(id);
    try {
      const { data, error } = await supabase.rpc("fn_reject_intake", { p_approval_id: id });
      if (error) {
        console.error("Reject failed:", error);
        if (Platform.OS === "web") alert("Fehler: " + error.message);
      } else if (data && !data.success) {
        console.error("Reject failed:", data.error);
        if (Platform.OS === "web") alert("Fehler: " + data.error);
      }
    } catch (e) {
      console.error("Reject error:", e);
    } finally {
      setApprovals((prev) => prev.filter((a) => a.id !== id));
      setActionInFlight(null);
    }
  }, []);

  const handleFilter = useCallback((key: FilterKey) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveFilter(key);
  }, []);

  return (
    <View style={styles.container}>
      <TopBar hasNotification />

      <View style={[styles.headerSection, { paddingTop: topInset + 64 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Freigaben</Text>
            <Text style={styles.headerSubtitle}>
              <Text style={{ color: Colors.raw.amber500 }}>{approvals.length} offen</Text>
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
          style={styles.chipsScroll}
        >
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => handleFilter(f.key)}
              style={[
                styles.chip,
                activeFilter === f.key ? styles.chipActive : styles.chipInactive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  activeFilter === f.key ? styles.chipTextActive : styles.chipTextInactive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.cardArea}>
        {!isOnline && (
          <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
            <OfflineBlockedHint message="Freigaben nur online möglich" />
          </View>
        )}
        {loading ? (
          <View style={emptyStyles.container}>
            <ActivityIndicator size="large" color={Colors.raw.amber500} />
          </View>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          filtered
            .slice(0, 3)
            .reverse()
            .map((approval, i, arr) => {
              const stackIndex = arr.length - 1 - i;
              return (
                <SwipeableCard
                  key={approval.id}
                  approval={approval}
                  isTop={stackIndex === 0}
                  stackIndex={stackIndex}
                  disabled={!isOnline || actionInFlight !== null}
                  onApprove={() => handleApprove(approval.id)}
                  onReject={() => handleReject(approval.id)}
                  onViewDetails={() => router.push(`/freigabe/${approval.id}` as any)}
                />
              );
            })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  headerSection: {
    paddingHorizontal: 20,
  },
  headerRow: {
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 30,
    color: Colors.raw.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.raw.zinc500,
  },
  chipsScroll: {
    marginBottom: 24,
    marginHorizontal: -20,
  },
  chipsContainer: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: "row",
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  chipActive: {
    backgroundColor: Colors.raw.amber500,
  },
  chipInactive: {
    backgroundColor: Colors.raw.zinc800,
  },
  chipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  chipTextActive: {
    color: "#000",
  },
  chipTextInactive: {
    color: Colors.raw.zinc400,
  },
  cardArea: {
    flex: 1,
    position: "relative",
  },
});
