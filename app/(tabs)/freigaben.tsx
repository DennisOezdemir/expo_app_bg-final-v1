import {
  StyleSheet,
  Text,
  View,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
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
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { TopBar } from "@/components/TopBar";
import { ScreenState } from "@/components/ScreenState";
import { useOffline } from "@/contexts/OfflineContext";
import { OfflineBlockedHint } from "@/components/OfflineBanner";
import { useApprovals } from "@/hooks/queries/useApprovals";
import { useApproveApproval, useRejectApproval } from "@/hooks/mutations/useApprovalDecision";
import type { ApprovalRow } from "@/lib/api/approvals";
import { SkeletonBox, SkeletonLine } from "@/components/Skeleton";

// --- Types ---

type ApprovalType = "auftrag" | "angebot" | "material" | "planung" | "nachtrag" | "rechnung" | "begehung";

interface Approval {
  id: string;
  type: ApprovalType;
  dbType: string; // original approval_type from DB
  title: string;
  projectCode: string;
  projectAddress: string;
  projectId: string;
  amount: string;
  detail: string;
  createdAgo: string;
  daysOld: number;
  supplier?: string;
  reason?: string;
  tradesSummary?: { trade: string; count: number; problems: number }[];
  // Begehung-specific
  catalogLabel?: string;
  offerId?: string;
  plannedDate?: string | null;
}

const TYPE_CONFIG: Record<
  ApprovalType,
  { label: string; icon: string; iconSet: "ionicons" | "material" | "feather"; color: string }
> = {
  auftrag: { label: "Auftrag freigeben", icon: "briefcase", iconSet: "ionicons", color: Colors.raw.amber500 },
  angebot: { label: "Angebot freigeben", icon: "document-text", iconSet: "ionicons", color: Colors.raw.amber400 },
  material: { label: "Material bestellen", icon: "package-variant", iconSet: "material", color: Colors.raw.emerald500 },
  planung: { label: "Baustellenplanung", icon: "calendar", iconSet: "ionicons", color: Colors.raw.amber400 },
  nachtrag: { label: "Nachtrag genehmigen", icon: "git-pull-request", iconSet: "feather", color: Colors.raw.amber400 },
  rechnung: { label: "Rechnung freigeben", icon: "receipt", iconSet: "ionicons", color: Colors.raw.zinc400 },
  begehung: { label: "Erstbegehung nötig", icon: "eye", iconSet: "ionicons", color: Colors.raw.amber500 },
};

const APPROVAL_TYPE_MAP: Record<string, ApprovalType> = {
  PROJECT_START: "auftrag",
  INVOICE: "rechnung",
  MATERIAL_ORDER: "material",
  SUBCONTRACTOR_ORDER: "material",
  SCHEDULE: "planung",
  INSPECTION_ASSIGN: "angebot",
  COMPLETION: "angebot",
  INSPECTION: "angebot",
  SITE_INSPECTION: "begehung",
};

type FilterKey = "alle" | "auftrag" | "material" | "planung";
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "auftrag", label: "Aufträge" },
  { key: "material", label: "Material" },
  { key: "planung", label: "Planung" },
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

function mapDbApproval(row: ApprovalRow): Approval {
  const uiType = APPROVAL_TYPE_MAP[row.approval_type] || "angebot";
  const project = Array.isArray(row.projects) ? row.projects[0] : row.projects;
  const summary = row.request_summary || "";
  const data = (row.request_data || {}) as Record<string, any>;
  const supplier = typeof data.supplier === "string" ? data.supplier : undefined;
  const reasonFromData = typeof data.reason === "string" ? data.reason : undefined;
  const detailFromData = typeof data.detail === "string" ? data.detail : "";

  // Material-specific: extract trades summary
  let tradesSummary: { trade: string; count: number; problems: number }[] | undefined;
  if (row.approval_type === "MATERIAL_ORDER" && Array.isArray(data.trades_summary)) {
    tradesSummary = data.trades_summary;
  }

  // Schedule-specific: extract assignment info
  let scheduleDetail = "";
  if (row.approval_type === "SCHEDULE" && data.phases) {
    scheduleDetail = `${data.phases} Phasen, ${data.assigned || 0} Monteure zugewiesen`;
  }

  const daysOld = Math.floor((Date.now() - new Date(row.requested_at).getTime()) / 86400000);

  return {
    id: row.id,
    type: uiType,
    dbType: row.approval_type,
    title: TYPE_CONFIG[uiType]?.label || "Freigabe",
    projectCode: project?.project_number || "–",
    projectAddress: [project?.object_street, project?.object_city].filter(Boolean).join(", ") || project?.name || "–",
    projectId: (Array.isArray(row.projects) ? row.projects[0] : row.projects)?.id || "",
    amount: data.amount ? `€${data.amount}` : "",
    detail: summary || scheduleDetail || detailFromData,
    createdAgo: formatTimeAgo(row.requested_at),
    daysOld,
    supplier,
    reason: row.feedback_reason || reasonFromData,
    tradesSummary,
    catalogLabel: typeof data.catalog_label === "string" ? data.catalog_label : undefined,
    offerId: typeof data.offer_id === "string" ? data.offer_id : undefined,
    plannedDate: typeof data.planned_date === "string" ? data.planned_date : null,
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
  const urgencyColor = approval.daysOld >= 5 ? Colors.raw.rose500 : approval.daysOld >= 3 ? Colors.raw.amber500 : Colors.raw.emerald500;

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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {approval.type === "begehung" && approval.catalogLabel ? (
                <View style={[cardStyles.catalogBadge, approval.catalogLabel === "WABS" ? cardStyles.badgeWABS : cardStyles.badgeAV]}>
                  <Text style={cardStyles.catalogBadgeText}>{approval.catalogLabel}</Text>
                </View>
              ) : null}
              <View style={[cardStyles.typeDot, { backgroundColor: approval.type === "begehung" ? urgencyColor : cfg.color }]} />
            </View>
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

          {approval.tradesSummary && approval.tradesSummary.length > 0 && (
            <View style={cardStyles.tradesContainer}>
              {approval.tradesSummary.map((t) => (
                <View key={t.trade} style={[
                  cardStyles.tradeBadge,
                  t.problems > 0 ? cardStyles.tradeBadgeWarning : cardStyles.tradeBadgeOk,
                ]}>
                  <Text style={cardStyles.tradeBadgeText}>
                    {t.trade}: {t.count}{t.problems > 0 ? ` (${t.problems} ⚠)` : " ✓"}
                  </Text>
                </View>
              ))}
            </View>
          )}

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

          {approval.type === "begehung" ? (
            <View style={cardStyles.plannedRow}>
              <View style={[cardStyles.urgencyDot, { backgroundColor: urgencyColor }]} />
              <Text style={[cardStyles.plannedText, { color: urgencyColor }]}>
                {approval.plannedDate
                  ? `Termin: ${new Date(approval.plannedDate).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}`
                  : approval.daysOld >= 5
                  ? `Überfällig — seit ${approval.daysOld} Tagen`
                  : approval.daysOld >= 3
                  ? `Ausstehend — seit ${approval.daysOld} Tagen`
                  : approval.createdAgo}
              </Text>
            </View>
          ) : (
            <Text style={cardStyles.created}>{approval.createdAgo}</Text>
          )}

          {approval.type !== "begehung" && (
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
          )}

          {approval.type === "begehung" ? (
            <View style={cardStyles.actions}>
              <Pressable
                onPress={onViewDetails}
                disabled={disabled}
                style={({ pressed }) => [
                  cardStyles.rejectButton,
                  { opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
                ]}
                testID="termin-button"
              >
                <Ionicons name="calendar-outline" size={18} color={Colors.raw.amber500} />
                <Text style={[cardStyles.rejectText, { color: Colors.raw.amber500 }]}>Termin</Text>
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
                <Ionicons name="play" size={20} color="#fff" />
                <Text style={cardStyles.approveText}>JETZT STARTEN</Text>
              </Pressable>
            </View>
          ) : (
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
          )}
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
  tradesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  tradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tradeBadgeOk: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  tradeBadgeWarning: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  tradeBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.zinc300,
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
  plannedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    marginBottom: 20,
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  plannedText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  catalogBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeWABS: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
  },
  badgeAV: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
  },
  catalogBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: Colors.raw.zinc200,
    letterSpacing: 0.5,
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

function FreigabenListeSkeleton() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {[...Array(3)].map((_, i) => (
        <View
          key={i}
          style={{
            backgroundColor: Colors.raw.zinc900,
            borderRadius: 16,
            padding: 24,
            flexDirection: "row",
            gap: 16,
            alignItems: "flex-start",
          }}
        >
          <SkeletonBox width={40} height={40} borderRadius={20} />
          <View style={{ flex: 1, gap: 10 }}>
            <SkeletonLine width="70%" />
            <SkeletonLine width="45%" />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function FreigabenScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const router = useRouter();
  const { isOnline, getCacheAge: _getCacheAge } = useOffline();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("alle");
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);
  const { data, isLoading: loading } = useApprovals();
  const approveMutation = useApproveApproval();
  const rejectMutation = useRejectApproval();
  const approvals = useMemo(() => (data ?? []).map(mapDbApproval), [data]);

  const filtered = useMemo(() => {
    if (activeFilter === "alle") return approvals;
    return approvals.filter((a) => a.type === activeFilter);
  }, [activeFilter, approvals]);

  const handleApprove = useCallback(async (id: string) => {
    setActionInFlight(id);
    try {
      await approveMutation.mutateAsync(id);
    } catch (e) {
      console.error("Approve error:", e);
      if (Platform.OS === "web") alert("Fehler: " + (e instanceof Error ? e.message : "Freigabe fehlgeschlagen"));
    } finally {
      setActionInFlight(null);
    }
  }, [approveMutation]);

  const handleReject = useCallback(async (id: string) => {
    setActionInFlight(id);
    try {
      await rejectMutation.mutateAsync(id);
    } catch (e) {
      console.error("Reject error:", e);
      if (Platform.OS === "web") alert("Fehler: " + (e instanceof Error ? e.message : "Ablehnung fehlgeschlagen"));
    } finally {
      setActionInFlight(null);
    }
  }, [rejectMutation]);

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
          <ScreenState kind="loading" skeleton={<FreigabenListeSkeleton />} />
        ) : filtered.length === 0 ? (
          <ScreenState
            kind="empty"
            title="Alles erledigt"
            detail="Keine offenen Freigaben"
            iconName="checkmark-circle"
          />
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
                  onApprove={() => {
                    if (approval.type === "begehung") {
                      const params: any = { type: "erstbegehung", projectId: approval.projectId };
                      if (approval.offerId) params.offerId = approval.offerId;
                      router.push({ pathname: "/begehung/[type]", params });
                    } else {
                      handleApprove(approval.id);
                    }
                  }}
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
