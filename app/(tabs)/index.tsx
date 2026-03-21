import { StyleSheet, Text, View, ScrollView, Platform, Pressable, Image, RefreshControl, ActivityIndicator } from "react-native";
import { useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { TopBar } from "@/components/TopBar";
import { useRole } from "@/contexts/RoleContext";
import { useOffline } from "@/contexts/OfflineContext";
import { OfflineBadge } from "@/components/OfflineBanner";
import { useDashboardMetrics } from "@/hooks/queries/useDashboardMetrics";
import { useDashboardActions } from "@/hooks/queries/useDashboardActions";
import { useActivities } from "@/hooks/queries/useActivities";
import type { Activity } from "@/lib/api/activities";
import type { DashboardAction, ActionSeverity } from "@/lib/api/dashboard-actions";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TileProps {
  icon: React.ReactNode;
  label: string;
  rightContent: React.ReactNode;
  onPress?: () => void;
  large?: boolean;
}

function Tile({ icon, label, rightContent, onPress, large }: TileProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.tile, animStyle, large && styles.tileLarge]}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={onPress}
    >
      <View style={styles.tileTop}>
        <View style={[styles.tileIconWrap, large && styles.tileIconWrapLarge]}>{icon}</View>
        <View>{rightContent}</View>
      </View>
      <Text style={[styles.tileLabel, large && styles.tileLabelLarge]}>{label}</Text>
    </AnimatedPressable>
  );
}

function TileCounter({ value, color }: { value: string; color?: string }) {
  return (
    <Text style={[styles.tileCounter, color ? { color } : undefined]}>{value}</Text>
  );
}

function TileBadge({ count }: { count: string }) {
  return (
    <View style={styles.tileBadge}>
      <Text style={styles.tileBadgeText}>{count}</Text>
    </View>
  );
}

function TileSubtext({ text, color }: { text: string; color?: string }) {
  return (
    <Text style={[styles.tileSubtext, color ? { color } : undefined]}>{text}</Text>
  );
}

// --- Activity Feed helpers ---

const ACTIVITY_ICON_MAP: Record<string, { name: string; color: string; lib: "ion" | "mci" }> = {
  "Projekt angelegt":                { name: "folder-open",       color: Colors.raw.amber500,   lib: "ion" },
  "AUTO PLAN COMPLETED":             { name: "calendar-check",    color: Colors.raw.emerald500, lib: "mci" },
  "INSPECTION PROTOCOL COMPLETED":   { name: "clipboard-check",   color: Colors.raw.emerald500, lib: "mci" },
  "GODMODE LEARNING COMPLETED":      { name: "school",            color: Colors.raw.amber400,   lib: "mci" },
  "NOTIFICATION SENT":               { name: "send",              color: Colors.raw.blue500,    lib: "ion" },
  "DRIVE TREE CREATED":              { name: "folder-plus",       color: Colors.raw.amber500,   lib: "mci" },
  "DRIVE YEAR READY":                { name: "folder-check",      color: Colors.raw.emerald400, lib: "mci" },
};

const ACTIVITY_TYPE_ICON: Record<string, { name: string; color: string; lib: "ion" | "mci" }> = {
  event:    { name: "flash",           color: Colors.raw.amber500,   lib: "ion" },
  document: { name: "document-text",   color: Colors.raw.emerald500, lib: "ion" },
  material: { name: "cube",            color: Colors.raw.amber400,   lib: "ion" },
};

const DEFAULT_ICON = { name: "ellipse", color: Colors.raw.zinc500, lib: "ion" as const };

function getActivityIcon(activity: Activity) {
  return ACTIVITY_ICON_MAP[activity.title] ?? ACTIVITY_TYPE_ICON[activity.activity_type] ?? DEFAULT_ICON;
}

const TITLE_LABELS: Record<string, string> = {
  "Projekt angelegt":                "Projekt angelegt",
  "AUTO PLAN COMPLETED":             "Autoplanung fertig",
  "INSPECTION PROTOCOL COMPLETED":   "Begehung abgeschlossen",
  "GODMODE LEARNING COMPLETED":      "KI-Lernlauf fertig",
  "NOTIFICATION SENT":               "Benachrichtigung gesendet",
  "DRIVE TREE CREATED":              "Ordner erstellt",
  "DRIVE YEAR READY":                "Jahresordner bereit",
};

function getActivityLabel(activity: Activity): string {
  const label = TITLE_LABELS[activity.title];
  if (label) return label;
  // Fallback: title formatiert
  return activity.title
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `vor ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "gestern";
  if (diffD < 7) return `vor ${diffD} Tagen`;
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

type DateGroup = "Heute" | "Gestern" | "Diese Woche" | "Aelter";

function getDateGroup(dateStr: string): DateGroup {
  const now = new Date();
  const date = new Date(dateStr);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
  const weekStart = new Date(todayStart.getTime() - todayStart.getDay() * 86_400_000);

  if (date >= todayStart) return "Heute";
  if (date >= yesterdayStart) return "Gestern";
  if (date >= weekStart) return "Diese Woche";
  return "Aelter";
}

function groupActivities(activities: Activity[]): { group: DateGroup; items: Activity[] }[] {
  const groups: DateGroup[] = ["Heute", "Gestern", "Diese Woche", "Aelter"];
  const map = new Map<DateGroup, Activity[]>();
  groups.forEach((g) => map.set(g, []));

  for (const a of activities) {
    const g = getDateGroup(a.created_at);
    map.get(g)!.push(a);
  }

  return groups.filter((g) => map.get(g)!.length > 0).map((g) => ({ group: g, items: map.get(g)! }));
}

function ActivityRow({ activity }: { activity: Activity }) {
  const icon = getActivityIcon(activity);
  const label = getActivityLabel(activity);
  const time = formatRelativeTime(activity.created_at);
  const projectRef = activity.project_number ?? "";

  return (
    <Pressable
      style={({ pressed }) => [styles.activityRow, { opacity: pressed ? 0.7 : 1 }]}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.selectionAsync();
        router.push(`/project/${activity.project_id}` as any);
      }}
    >
      <View style={[styles.activityIconWrap, { backgroundColor: icon.color + "18" }]}>
        {icon.lib === "mci" ? (
          <MaterialCommunityIcons name={icon.name as any} size={18} color={icon.color} />
        ) : (
          <Ionicons name={icon.name as any} size={18} color={icon.color} />
        )}
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityText} numberOfLines={1}>
          {label}
        </Text>
        {projectRef ? (
          <Text style={styles.activityProject} numberOfLines={1}>
            {projectRef}
          </Text>
        ) : null}
      </View>
      <Text style={styles.activityTime}>{time}</Text>
    </Pressable>
  );
}

function ActivityFeed() {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useActivities();

  const allActivities = data?.pages.flat() ?? [];
  const grouped = groupActivities(allActivities);

  if (isLoading) {
    return (
      <View style={styles.activitySection}>
        <Text style={styles.activityTitle}>Letzte Aktivitaet</Text>
        <View style={[styles.activityList, { paddingVertical: 24, alignItems: "center" }]}>
          <ActivityIndicator color={Colors.raw.amber500} />
        </View>
      </View>
    );
  }

  if (allActivities.length === 0) {
    return (
      <View style={styles.activitySection}>
        <Text style={styles.activityTitle}>Letzte Aktivitaet</Text>
        <View style={[styles.activityList, { padding: 18 }]}>
          <Text style={styles.activityProject}>Noch keine Aktivitaeten</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.activitySection}>
      <Text style={styles.activityTitle}>Letzte Aktivitaet</Text>
      {grouped.map(({ group, items }) => (
        <View key={group} style={{ marginBottom: 12 }}>
          <Text style={styles.activityGroupLabel}>{group}</Text>
          <View style={styles.activityList}>
            {items.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </View>
        </View>
      ))}
      {hasNextPage && (
        <Pressable
          onPress={() => fetchNextPage()}
          style={({ pressed }) => [styles.loadMoreBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          {isFetchingNextPage ? (
            <ActivityIndicator size="small" color={Colors.raw.amber500} />
          ) : (
            <Text style={styles.loadMoreText}>Mehr laden</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

// --- Was steht an? ---

const ACTION_ICONS: Record<string, { name: string; lib: "ion" | "mci" }> = {
  approval: { name: "checkmark-circle", lib: "ion" },
  overdue_invoice: { name: "receipt", lib: "mci" },
  missing_material: { name: "cube", lib: "ion" },
  no_schedule: { name: "calendar-remove", lib: "mci" },
};

const SEVERITY_COLORS: Record<ActionSeverity, string> = {
  rot: Colors.raw.rose500,
  gelb: Colors.raw.amber500,
};

function ActionCard({ action }: { action: DashboardAction }) {
  const color = SEVERITY_COLORS[action.severity];
  const icon = ACTION_ICONS[action.type] ?? { name: "alert-circle", lib: "ion" as const };

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") Haptics.selectionAsync();
        router.push(action.route as any);
      }}
      style={({ pressed }) => [
        wsaStyles.card,
        { borderLeftColor: color, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={[wsaStyles.cardIcon, { backgroundColor: color + "18" }]}>
        {icon.lib === "mci" ? (
          <MaterialCommunityIcons name={icon.name as any} size={18} color={color} />
        ) : (
          <Ionicons name={icon.name as any} size={18} color={color} />
        )}
      </View>
      <View style={wsaStyles.cardContent}>
        <Text style={wsaStyles.cardTitle} numberOfLines={1}>
          {action.title}
        </Text>
        <Text style={wsaStyles.cardSubtitle} numberOfLines={1}>
          {action.subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.raw.zinc600} />
    </Pressable>
  );
}

function WasStehtAn() {
  const { data, isLoading } = useDashboardActions();

  if (isLoading) {
    return (
      <View style={wsaStyles.section}>
        <Text style={wsaStyles.heading}>Was steht an?</Text>
        <View style={[wsaStyles.allGood, { paddingVertical: 20 }]}>
          <ActivityIndicator color={Colors.raw.amber500} />
        </View>
      </View>
    );
  }

  const actions = data?.actions ?? [];
  const totalCount = data?.totalCount ?? 0;
  const newToday = data?.newToday ?? 0;

  if (actions.length === 0) {
    return (
      <View style={wsaStyles.section}>
        <Text style={wsaStyles.heading}>Was steht an?</Text>
        <View style={wsaStyles.allGood}>
          <Ionicons name="checkmark-circle" size={28} color={Colors.raw.emerald500} />
          <Text style={wsaStyles.allGoodText}>Alles im Griff</Text>
          <Text style={wsaStyles.allGoodSub}>Keine offenen Aktionen</Text>
        </View>
      </View>
    );
  }

  const trendText =
    newToday > 0
      ? `${newToday} neue heute`
      : totalCount > 5
        ? `${totalCount} offen insgesamt`
        : null;

  return (
    <View style={wsaStyles.section}>
      <View style={wsaStyles.headingRow}>
        <Text style={wsaStyles.heading}>Was steht an?</Text>
        {trendText && <Text style={wsaStyles.trend}>{trendText}</Text>}
      </View>
      {actions.map((action) => (
        <ActionCard key={action.id} action={action} />
      ))}
    </View>
  );
}

const wsaStyles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 12,
  },
  heading: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
    marginBottom: 12,
  },
  trend: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.amber500,
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    borderLeftWidth: 3,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
    gap: 12,
    minHeight: 56,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc200,
  },
  cardSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginTop: 2,
  },
  allGood: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    padding: 20,
    alignItems: "center",
    gap: 6,
  },
  allGoodText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.emerald500,
  },
  allGoodSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
});

function formatCompactCurrency(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}K`;
  return amount.toLocaleString("de-DE");
}

function GFHome({ metrics }: { metrics: ReturnType<typeof useDashboardMetrics>["data"] }) {
  const activeProjects = metrics?.activeProjects ?? 0;
  const criticalProjects = metrics?.criticalProjects ?? 0;
  const pendingApprovals = metrics?.pendingApprovals ?? 0;
  const openOffers = metrics?.openOffers ?? 0;
  const offerVolume = metrics?.totalOfferVolume ?? 0;

  return (
    <>
      <WasStehtAn />

      <Pressable style={({ pressed }) => [styles.alertBanner, { opacity: pressed ? 0.85 : 1 }]}>
        <View style={styles.alertLeft}>
          <Ionicons name="warning" size={18} color={Colors.raw.rose500} />
          <Text style={styles.alertText}>{criticalProjects} Projekte kritisch</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.raw.rose500} />
      </Pressable>

      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/foto");
        }}
        style={({ pressed }) => [
          styles.schnellfotoBtn,
          { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        <View style={styles.schnellfotoIcon}>
          <Ionicons name="camera" size={22} color="#000" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.schnellfotoLabel}>Schnellfoto</Text>
          <Text style={styles.schnellfotoSub}>Foto aufnehmen & zuordnen</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.raw.zinc500} />
      </Pressable>

      <View style={styles.tilesGrid}>
        <View style={styles.tilesRow}>
          <Tile
            icon={<Ionicons name="clipboard" size={28} color={Colors.raw.amber500} />}
            label="Projekte"
            rightContent={<TileSubtext text={`${activeProjects} aktiv`} color={Colors.raw.zinc400} />}
            onPress={() => router.navigate("/(tabs)/projekte")}
          />
          <Tile
            icon={<Ionicons name="checkmark-circle" size={28} color={Colors.raw.emerald500} />}
            label="Freigaben"
            rightContent={<TileBadge count={String(pendingApprovals)} />}
            onPress={() => router.navigate("/(tabs)/freigaben")}
          />
        </View>
        <View style={styles.tilesRow}>
          <Tile
            icon={<MaterialCommunityIcons name="package-variant" size={28} color={Colors.raw.amber400} />}
            label="Material"
            rightContent={<TileSubtext text={`${criticalProjects} kritisch`} color={Colors.raw.zinc400} />}
            onPress={() => router.navigate("/(tabs)/material")}
          />
          <Tile
            icon={<Ionicons name="calendar" size={28} color="#3b82f6" />}
            label="Planung"
            rightContent={<TileSubtext text={`${metrics?.teamCount ?? 0} aktiv`} color={Colors.raw.zinc400} />}
            onPress={() => router.push("/planung")}
          />
        </View>
        <View style={styles.tilesRow}>
          <Tile
            icon={<Ionicons name="document-text" size={28} color={Colors.raw.amber500} />}
            label="Angebote"
            rightContent={<TileSubtext text={`${openOffers} offen`} color={Colors.raw.zinc400} />}
            onPress={() => router.push("/angebote")}
          />
          <Tile
            icon={<MaterialCommunityIcons name="finance" size={28} color={Colors.raw.emerald500} />}
            label="Finanzen"
            rightContent={<TileCounter value={`${formatCompactCurrency(offerVolume)} €`} color={Colors.raw.emerald500} />}
            onPress={() => router.push("/finanzen")}
          />
        </View>
      </View>

      <ActivityFeed />
    </>
  );
}

function BauleiterHome({ metrics }: { metrics: ReturnType<typeof useDashboardMetrics>["data"] }) {
  const activeProjects = metrics?.activeProjects ?? 0;
  const openInspections = metrics?.openInspections ?? 0;
  const openOffers = metrics?.openOffers ?? 0;

  return (
    <>
      <WasStehtAn />

      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/foto");
        }}
        style={({ pressed }) => [
          styles.schnellfotoBtn,
          { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        <View style={styles.schnellfotoIcon}>
          <Ionicons name="camera" size={22} color="#000" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.schnellfotoLabel}>Schnellfoto</Text>
          <Text style={styles.schnellfotoSub}>Foto aufnehmen & zuordnen</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.raw.zinc500} />
      </Pressable>

      <View style={styles.tilesGrid}>
        <View style={styles.tilesRow}>
          <Tile
            icon={<Ionicons name="clipboard" size={28} color={Colors.raw.amber500} />}
            label="Projekte"
            rightContent={<TileSubtext text={`${activeProjects} aktiv`} color={Colors.raw.zinc400} />}
            onPress={() => router.navigate("/(tabs)/projekte")}
          />
          <Tile
            icon={<MaterialCommunityIcons name="package-variant" size={28} color={Colors.raw.amber400} />}
            label="Material"
            rightContent={<TileSubtext text={`${metrics?.teamCount ?? 0} im Team`} color={Colors.raw.zinc400} />}
            onPress={() => router.navigate("/(tabs)/material")}
          />
        </View>
        <View style={styles.tilesRow}>
          <Tile
            icon={<Ionicons name="calendar" size={28} color="#3b82f6" />}
            label="Planung"
            rightContent={<TileSubtext text={`${metrics?.teamCount ?? 0} verfügbar`} color={Colors.raw.zinc400} />}
            onPress={() => router.push("/planung")}
          />
          <Tile
            icon={<Ionicons name="walk" size={28} color={Colors.raw.emerald500} />}
            label="Begehungen"
            rightContent={<TileSubtext text={`${openInspections} offen`} color={Colors.raw.zinc400} />}
            onPress={() => router.push("/begehung/abnahme" as any)}
          />
        </View>
        <View style={styles.tilesRow}>
          <Tile
            icon={<Ionicons name="camera" size={28} color={Colors.raw.amber500} />}
            label="Schnellfoto"
            rightContent={<View />}
            onPress={() => router.push("/foto")}
          />
          <Tile
            icon={<Ionicons name="document-text" size={28} color={Colors.raw.amber500} />}
            label="Angebote"
            rightContent={<TileSubtext text={`${openOffers} offen`} color={Colors.raw.zinc400} />}
            onPress={() => router.push("/angebote")}
          />
        </View>
      </View>

      <ActivityFeed />
    </>
  );
}

function MonteurHome() {
  return (
    <>
      <Pressable
        onPress={() => router.navigate("/(tabs)/meinjob")}
        style={({ pressed }) => [styles.projectBanner, { opacity: pressed ? 0.9 : 1 }]}
        testID="mein-projekt"
      >
        <View style={styles.projectBannerTop}>
          <View style={styles.projectBannerLeft}>
            <Ionicons name="location" size={18} color={Colors.raw.amber500} />
            <Text style={styles.projectBannerName}>Schwentnerring 13c</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.raw.zinc500} />
        </View>
        <View style={styles.projectBannerMeta}>
          <Text style={styles.projectBannerTrade}>Maler</Text>
          <View style={styles.projectBannerDayBadge}>
            <Text style={styles.projectBannerDayText}>Tag 5/10</Text>
          </View>
        </View>
        <View style={styles.projectBannerProgress}>
          <View style={[styles.projectBannerFill, { width: "50%" }]} />
        </View>
      </Pressable>

      <View style={styles.tilesGrid}>
        <View style={styles.tilesRow}>
          <Tile
            icon={<Ionicons name="camera" size={32} color={Colors.raw.amber500} />}
            label="Foto"
            rightContent={<View />}
            onPress={() => router.navigate("/(tabs)/foto")}
            large
          />
          <Tile
            icon={<Ionicons name="time" size={32} color={Colors.raw.amber500} />}
            label="Zeiten"
            rightContent={<View />}
            onPress={() => router.navigate("/(tabs)/zeiten")}
            large
          />
        </View>
        <View style={styles.tilesRow}>
          <Tile
            icon={<Ionicons name="chatbubbles" size={32} color="#3b82f6" />}
            label="Chat"
            rightContent={<View />}
            onPress={() => router.push("/chat/team" as any)}
            large
          />
          <Tile
            icon={<Ionicons name="warning" size={32} color={Colors.raw.rose500} />}
            label="Mangel"
            rightContent={<View />}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            large
          />
        </View>
      </View>
    </>
  );
}

export default function StartScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 84 : 90;
  const { role, user, isImpersonating } = useRole();
  const { isOnline, getCacheAge } = useOffline();
  const { data: metrics, refetch: refetchMetrics } = useDashboardMetrics();
  const { refetch: refetchActions } = useDashboardActions();
  const { refetch: refetchActivities, isRefetching } = useActivities();

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchMetrics(), refetchActions(), refetchActivities()]);
  }, [refetchMetrics, refetchActions, refetchActivities]);

  const { data: actionsData } = useDashboardActions();
  const actionCount = actionsData?.totalCount ?? 0;

  const greetings: Record<string, { greeting: string; subtitle: string }> = {
    gf: {
      greeting: `Moin ${user.name}`,
      subtitle: actionCount > 0 ? `${actionCount} Dinge brauchen dich` : "Alles laeuft",
    },
    bauleiter: {
      greeting: `Moin ${user.name}`,
      subtitle: actionCount > 0 ? `${actionCount} offene Aktionen` : "Alles im Griff",
    },
    monteur: { greeting: `Moin ${user.name}`, subtitle: "Dein Tag auf der Baustelle" },
  };

  const { greeting, subtitle } = greetings[role];

  return (
    <View style={styles.container}>
      <TopBar hasNotification />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 64 + (isImpersonating ? 36 : 0),
            paddingBottom: bottomInset + 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={Colors.raw.amber500}
            colors={[Colors.raw.amber500]}
          />
        }
      >
        <View style={styles.greetingSection}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <Image source={require("@/assets/images/logo.png")} style={{ width: 36, height: 36 }} resizeMode="contain" />
            <Text style={styles.greeting}>{greeting}</Text>
            {!isOnline && <OfflineBadge cacheAge={getCacheAge("projekte")} />}
          </View>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {role === "gf" && <GFHome metrics={metrics} />}
        {role === "bauleiter" && <BauleiterHome metrics={metrics} />}
        {role === "monteur" && <MonteurHome />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  greetingSection: {
    marginBottom: 24,
  },
  greeting: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 30,
    color: Colors.raw.white,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.raw.zinc500,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(244, 63, 94, 0.08)",
    borderLeftWidth: 3,
    borderLeftColor: Colors.raw.rose500,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  schnellfotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  schnellfotoIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.raw.amber500,
    alignItems: "center",
    justifyContent: "center",
  },
  schnellfotoLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.white,
    marginBottom: 2,
  },
  schnellfotoSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  alertLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  alertText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.rose400,
  },
  tilesGrid: {
    gap: 12,
    marginBottom: 32,
  },
  tilesRow: {
    flexDirection: "row",
    gap: 12,
  },
  tile: {
    flex: 1,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 18,
    minHeight: 120,
    justifyContent: "space-between",
  },
  tileLarge: {
    minHeight: 130,
    padding: 22,
  },
  tileTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  tileIconWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  tileIconWrapLarge: {
    width: 52,
    height: 52,
  },
  tileLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.white,
    marginTop: 8,
  },
  tileLabelLarge: {
    fontSize: 18,
  },
  tileCounter: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 26,
    color: Colors.raw.white,
  },
  tileBadge: {
    backgroundColor: Colors.raw.rose500,
    borderRadius: 12,
    minWidth: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  tileBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#fff",
  },
  tileSubtext: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc500,
    marginTop: 2,
  },
  activitySection: {
    marginBottom: 16,
  },
  activityTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
    marginBottom: 16,
  },
  activityList: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    overflow: "hidden",
  },
  activityGroupLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
    gap: 12,
    minHeight: 52,
  },
  activityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc300,
  },
  activityProject: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginTop: 2,
  },
  activityTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc600,
  },
  loadMoreBtn: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 8,
  },
  loadMoreText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.amber500,
  },
  projectBanner: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginBottom: 24,
  },
  projectBannerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  projectBannerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  projectBannerName: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.raw.white },
  projectBannerMeta: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  projectBannerTrade: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc400 },
  projectBannerDayBadge: { backgroundColor: Colors.raw.amber500 + "18", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  projectBannerDayText: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.amber500 },
  projectBannerProgress: { height: 8, borderRadius: 4, backgroundColor: Colors.raw.zinc800 },
  projectBannerFill: { height: 8, borderRadius: 4, backgroundColor: Colors.raw.amber500 },
});
