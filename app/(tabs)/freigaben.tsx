import {
  StyleSheet,
  Text,
  View,
  Platform,
  Pressable,
  ScrollView,
  Dimensions,
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
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { TopBar } from "@/components/TopBar";

type ApprovalType = "angebot" | "material" | "nachtrag" | "rechnung";

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
  angebot: { label: "Angebot freigeben", icon: "document-text", iconSet: "ionicons", color: Colors.raw.amber500 },
  material: { label: "Material bestellen", icon: "package-variant", iconSet: "material", color: Colors.raw.emerald500 },
  nachtrag: { label: "Nachtrag genehmigen", icon: "git-pull-request", iconSet: "feather", color: Colors.raw.amber400 },
  rechnung: { label: "Rechnung freigeben", icon: "receipt", iconSet: "ionicons", color: Colors.raw.zinc400 },
};

const APPROVALS: Approval[] = [
  {
    id: "1",
    type: "angebot",
    title: "Angebot freigeben",
    projectCode: "BL-2026-003",
    projectAddress: "Schwentnerring 13c EG Links",
    amount: "\u20AC12.400",
    detail: "47 Positionen \u2022 Maler+Boden",
    createdAgo: "vor 2 Stunden",
  },
  {
    id: "2",
    type: "material",
    title: "Material bestellen",
    projectCode: "BL-2026-007",
    projectAddress: "Industrieweg 8, Basel",
    amount: "\u20AC3.890",
    detail: "Vliesraufaser \u2022 12 Rollen",
    supplier: "Baustoff Weber AG",
    createdAgo: "vor 5 Stunden",
  },
  {
    id: "3",
    type: "nachtrag",
    title: "Nachtrag genehmigen",
    projectCode: "BL-2026-001",
    projectAddress: "Seestrasse 42, Zürich",
    amount: "\u20AC1.850",
    detail: "Zusätzliche Malerarbeiten",
    reason: "Schimmelbefall hinter Verkleidung",
    createdAgo: "vor 1 Tag",
  },
  {
    id: "4",
    type: "rechnung",
    title: "Rechnung freigeben",
    projectCode: "BL-2026-012",
    projectAddress: "Gartenweg 3, Luzern",
    amount: "\u20AC6.200",
    detail: "Abschlagsrechnung #3",
    supplier: "Schreinerei Müller",
    createdAgo: "vor 2 Tagen",
  },
];

type FilterKey = "alle" | "angebot" | "material" | "nachtrag";
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "angebot", label: "Angebote" },
  { key: "material", label: "Material" },
  { key: "nachtrag", label: "Nachträge" },
];

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
  isTop,
  stackIndex,
}: {
  approval: Approval;
  onApprove: () => void;
  onReject: () => void;
  isTop: boolean;
  stackIndex: number;
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
  }, [onApprove, width]);

  const handleReject = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    rejectFlash.value = withTiming(1, { duration: 150 });
    translateX.value = withTiming(-width * 1.2, { duration: 300, easing: Easing.out(Easing.cubic) }, () => {
      runOnJS(onReject)();
    });
  }, [onReject, width]);

  const panGesture = Gesture.Pan()
    .enabled(isTop)
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

          <View style={cardStyles.amountSection}>
            <Ionicons name="cash" size={20} color={Colors.raw.amber500} />
            <Text style={cardStyles.amountText}>{approval.amount} netto</Text>
          </View>

          <Text style={cardStyles.detail}>{approval.detail}</Text>

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
            style={({ pressed }) => [
              cardStyles.detailsButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="document-text-outline" size={16} color={Colors.raw.amber500} />
            <Text style={cardStyles.detailsButtonText}>Details ansehen</Text>
          </Pressable>

          <View style={cardStyles.actions}>
            <Pressable
              onPress={handleReject}
              style={({ pressed }) => [
                cardStyles.rejectButton,
                { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
              testID="reject-button"
            >
              <Ionicons name="close" size={20} color={Colors.raw.rose400} />
              <Text style={cardStyles.rejectText}>Nein</Text>
            </Pressable>
            <Pressable
              onPress={handleApprove}
              style={({ pressed }) => [
                cardStyles.approveButton,
                { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
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
  const [activeFilter, setActiveFilter] = useState<FilterKey>("alle");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const allFiltered = useMemo(() => {
    if (activeFilter === "alle") return APPROVALS;
    return APPROVALS.filter((a) => a.type === activeFilter || (activeFilter === "nachtrag" && a.type === "nachtrag"));
  }, [activeFilter]);

  const visible = useMemo(
    () => allFiltered.filter((a) => !dismissed.has(a.id)),
    [allFiltered, dismissed],
  );

  const handleDismiss = useCallback((id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  }, []);

  const handleFilter = useCallback((key: FilterKey) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveFilter(key);
  }, []);

  const openCount = APPROVALS.filter((a) => !dismissed.has(a.id)).length;

  return (
    <View style={styles.container}>
      <TopBar hasNotification />

      <View style={[styles.headerSection, { paddingTop: topInset + 64 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Freigaben</Text>
            <Text style={styles.headerSubtitle}>
              <Text style={{ color: Colors.raw.amber500 }}>{openCount} offen</Text>
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
        {visible.length === 0 ? (
          <EmptyState />
        ) : (
          visible
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
                  onApprove={() => handleDismiss(approval.id)}
                  onReject={() => handleDismiss(approval.id)}
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
