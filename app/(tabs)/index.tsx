import { StyleSheet, Text, View, ScrollView, Platform, Pressable, Image, RefreshControl, ActivityIndicator } from "react-native";
import { useCallback, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TextInput } from "react-native";
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
import { sendChatMessage } from "@/lib/api/chat";
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

// --- BauGenius Chat Widget ---

function ChatWidget() {
  const { role, user } = useRole();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [sending, setSending] = useState(false);

  const handleSend = useCallback(async () => {
    const text = message.trim();
    if (!text || sending) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setMessages((prev) => [...prev, { role: "user", text }]);
    setMessage("");
    setSending(true);

    try {
      const res = await sendChatMessage({
        project_id: "general",
        message: text,
        user_role: role,
        user_name: user.name,
        user_id: user.id ?? "",
      });
      setMessages((prev) => [...prev, { role: "assistant", text: res.message }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "assistant", text: `Fehler: ${err?.message || "Verbindung fehlgeschlagen"}` }]);
    } finally {
      setSending(false);
    }
  }, [message, sending, role, user]);

  return (
    <View style={chatStyles.container}>
      <View style={chatStyles.header}>
        <View style={chatStyles.headerLeft}>
          <View style={chatStyles.avatarWrap}>
            <Ionicons name="sparkles" size={18} color={Colors.raw.amber500} />
          </View>
          <View>
            <Text style={chatStyles.title}>BauGenius</Text>
            <Text style={chatStyles.subtitle}>Frag mich was</Text>
          </View>
        </View>
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/chat/general" as any);
          }}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Ionicons name="expand" size={20} color={Colors.raw.zinc500} />
        </Pressable>
      </View>

      <View style={chatStyles.messagesWrap}>
        {messages.length === 0 ? (
          <View style={chatStyles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={28} color={Colors.raw.zinc700} />
            <Text style={chatStyles.emptyText}>Positionen checken, Nachträge anlegen, Status abfragen...</Text>
          </View>
        ) : (
          messages.slice(-4).map((msg, i) => (
            <View key={i} style={[chatStyles.bubble, msg.role === "user" ? chatStyles.bubbleUser : chatStyles.bubbleAssistant]}>
              {msg.role === "assistant" && <Ionicons name="sparkles" size={12} color={Colors.raw.amber500} style={{ marginRight: 6 }} />}
              <Text style={[chatStyles.bubbleText, msg.role === "user" && chatStyles.bubbleTextUser]}>{msg.text}</Text>
            </View>
          ))
        )}
        {sending && (
          <View style={[chatStyles.bubble, chatStyles.bubbleAssistant]}>
            <ActivityIndicator size="small" color={Colors.raw.amber500} />
            <Text style={[chatStyles.bubbleText, { marginLeft: 8 }]}>Denkt nach...</Text>
          </View>
        )}
      </View>

      <View style={chatStyles.inputRow}>
        <TextInput
          style={chatStyles.input}
          placeholder="Nachricht an BauGenius..."
          placeholderTextColor={Colors.raw.zinc600}
          value={message}
          onChangeText={setMessage}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          editable={!sending}
        />
        <Pressable
          onPress={handleSend}
          disabled={!message.trim() || sending}
          style={({ pressed }) => [chatStyles.sendBtn, (!message.trim() || sending) && { opacity: 0.4 }, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="send" size={18} color={Colors.raw.zinc950} />
        </Pressable>
      </View>
    </View>
  );
}

const chatStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    overflow: "hidden",
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.raw.amber500 + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.white },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500 },
  messagesWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 100,
    maxHeight: 400,
    gap: 8,
  },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 24, gap: 8 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc600, textAlign: "center", lineHeight: 18 },
  bubble: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    maxWidth: "85%",
  },
  bubbleUser: {
    backgroundColor: Colors.raw.amber500 + "20",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: Colors.raw.zinc800,
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc300, flex: 1, lineHeight: 18 },
  bubbleTextUser: { color: Colors.raw.amber400 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.white,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    height: 42,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.raw.amber500,
    alignItems: "center",
    justifyContent: "center",
  },
});

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
            icon={<Ionicons name="clipboard" size={22} color={Colors.raw.amber500} />}
            label="Projekte"
            rightContent={<TileSubtext text={`${activeProjects} aktiv`} color={Colors.raw.zinc400} />}
            onPress={() => router.navigate("/(tabs)/projekte")}
          />
          <Tile
            icon={<Ionicons name="checkmark-circle" size={22} color={Colors.raw.emerald500} />}
            label="Freigaben"
            rightContent={<TileBadge count={String(pendingApprovals)} />}
            onPress={() => router.navigate("/(tabs)/freigaben")}
          />
          <Tile
            icon={<MaterialCommunityIcons name="package-variant" size={22} color={Colors.raw.amber400} />}
            label="Material"
            rightContent={<TileSubtext text={`${criticalProjects} krit.`} color={Colors.raw.zinc400} />}
            onPress={() => router.navigate("/(tabs)/material")}
          />
        </View>
        <View style={styles.tilesRow}>
          <Tile
            icon={<Ionicons name="calendar" size={22} color="#3b82f6" />}
            label="Planung"
            rightContent={<TileSubtext text={`${metrics?.teamCount ?? 0} aktiv`} color={Colors.raw.zinc400} />}
            onPress={() => router.push("/planung")}
          />
          <Tile
            icon={<Ionicons name="document-text" size={22} color={Colors.raw.amber500} />}
            label="Angebote"
            rightContent={<TileSubtext text={`${openOffers} offen`} color={Colors.raw.zinc400} />}
            onPress={() => router.push("/angebote")}
          />
          <Tile
            icon={<Ionicons name="receipt" size={22} color={Colors.raw.emerald500} />}
            label="Rechnungen"
            rightContent={<TileSubtext text={`${metrics?.openInvoices ?? 0} offen`} color={Colors.raw.zinc400} />}
            onPress={() => router.push("/rechnung" as any)}
          />
        </View>
        <View style={styles.tilesRow}>
          <Tile
            icon={<MaterialCommunityIcons name="finance" size={22} color={Colors.raw.emerald500} />}
            label="Finanzen"
            rightContent={<TileCounter value={`${formatCompactCurrency(offerVolume)} \u20AC`} color={Colors.raw.emerald500} />}
            onPress={() => router.push("/finanzen")}
          />
          <View style={{ flex: 1 }} />
          <View style={{ flex: 1 }} />
        </View>
      </View>

      <ChatWidget />
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
            icon={<Ionicons name="clipboard" size={22} color={Colors.raw.amber500} />}
            label="Projekte"
            rightContent={<TileSubtext text={`${activeProjects} aktiv`} color={Colors.raw.zinc400} />}
            onPress={() => router.navigate("/(tabs)/projekte")}
          />
          <Tile
            icon={<MaterialCommunityIcons name="package-variant" size={22} color={Colors.raw.amber400} />}
            label="Material"
            rightContent={<TileSubtext text={`${metrics?.teamCount ?? 0} Team`} color={Colors.raw.zinc400} />}
            onPress={() => router.navigate("/(tabs)/material")}
          />
          <Tile
            icon={<Ionicons name="calendar" size={22} color="#3b82f6" />}
            label="Planung"
            rightContent={<TileSubtext text={`${metrics?.teamCount ?? 0} aktiv`} color={Colors.raw.zinc400} />}
            onPress={() => router.push("/planung")}
          />
        </View>
        <View style={styles.tilesRow}>
          <Tile
            icon={<Ionicons name="walk" size={22} color={Colors.raw.emerald500} />}
            label="Begehungen"
            rightContent={<TileSubtext text={`${openInspections} offen`} color={Colors.raw.zinc400} />}
            onPress={() => router.push("/begehung/abnahme" as any)}
          />
          <Tile
            icon={<Ionicons name="document-text" size={22} color={Colors.raw.amber500} />}
            label="Angebote"
            rightContent={<TileSubtext text={`${openOffers} offen`} color={Colors.raw.zinc400} />}
            onPress={() => router.push("/angebote")}
          />
          <Tile
            icon={<Ionicons name="receipt" size={22} color={Colors.raw.emerald500} />}
            label="Rechnungen"
            rightContent={<TileSubtext text={`${metrics?.openInvoices ?? 0} offen`} color={Colors.raw.zinc400} />}
            onPress={() => router.push("/rechnung" as any)}
          />
        </View>
      </View>

      <ChatWidget />
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

// ── HEUTE-SCREEN (Phase 6) ──────────────────────────────────────
// Ersetzt die rollen-spezifischen Home-Screens.
// Alte GFHome/BauleiterHome/MonteurHome bleiben als toter Code
// bis AgentView steht.

function useTodayProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { supabase } = require("@/lib/supabase");
      const today = new Date().toISOString().split("T")[0];

      // Projekte wo ich heute eingeplant bin
      const { data: phases } = await supabase
        .from("schedule_phases")
        .select("id, name, trade, status, project_id, projects(name, address, project_number, status)")
        .lte("start_date", today)
        .gte("end_date", today)
        .in("status", ["approved", "in_progress"])
        .order("start_date");

      // Fallback: Alle aktiven Projekte wenn keine Phasen
      if (!phases || phases.length === 0) {
        const { data: active } = await supabase
          .from("projects")
          .select("id, name, address, project_number, status")
          .in("status", ["IN_PROGRESS", "ACTIVE", "PLANNING"])
          .order("updated_at", { ascending: false })
          .limit(5);
        setProjects((active || []).map((p: any) => ({ ...p, phase: null })));
      } else {
        // Deduplizieren nach project_id
        const seen = new Set<string>();
        const unique = phases.filter((p: any) => {
          if (seen.has(p.project_id)) return false;
          seen.add(p.project_id);
          return true;
        });
        setProjects(unique.map((p: any) => ({
          id: p.project_id,
          name: p.projects?.name || "—",
          address: p.projects?.address || "",
          project_number: p.projects?.project_number || "",
          status: p.projects?.status || "",
          phase: { name: p.name, trade: p.trade, status: p.status },
        })));
      }
    } catch { }
    setLoading(false);
  }, []);

  return { projects, loading, refetch: load };
}

function HeuteScreen() {
  const { user } = useRole();
  const { data: metrics, refetch: refetchMetrics, isRefetching } = useDashboardMetrics();
  const { projects, loading: projLoading, refetch: refetchProjects } = useTodayProjects();

  // Load on mount
  const [mounted, setMounted] = useState(false);
  if (!mounted) { refetchProjects(); setMounted(true); }

  const today = new Date();
  const dayNames = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  const dateStr = `${dayNames[today.getDay()]}, ${today.getDate()}.${today.getMonth() + 1}.${today.getFullYear()}`;

  return (
    <>
      {/* Begrüßung */}
      <View style={styles.greetingSection}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <Image source={require("@/assets/images/logo.png")} style={{ width: 36, height: 36 }} resizeMode="contain" />
          <Text style={styles.greeting}>Moin {user.name}</Text>
        </View>
        <Text style={styles.subtitle}>{dateStr}</Text>
      </View>

      {/* Heute auf der Baustelle */}
      <Text style={heuteStyles.sectionTitle}>Heute auf der Baustelle</Text>

      {projLoading ? (
        <ActivityIndicator size="small" color={Colors.raw.amber500} style={{ marginVertical: 20 }} />
      ) : projects.length === 0 ? (
        <View style={heuteStyles.emptyCard}>
          <Ionicons name="sunny-outline" size={32} color={Colors.raw.zinc600} />
          <Text style={heuteStyles.emptyText}>Keine Projekte fuer heute eingeplant</Text>
        </View>
      ) : (
        projects.map((project) => (
          <Pressable
            key={project.id}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: "/project/[id]", params: { id: project.id } });
            }}
            style={({ pressed }) => [heuteStyles.projectCard, { opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={heuteStyles.projectCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={heuteStyles.projectName}>{project.name}</Text>
                <Text style={heuteStyles.projectAddress}>{project.address}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.raw.zinc500} />
            </View>
            {project.phase && (
              <View style={heuteStyles.phaseRow}>
                <View style={heuteStyles.phaseDot} />
                <Text style={heuteStyles.phaseText}>{project.phase.trade || project.phase.name}</Text>
                <Text style={heuteStyles.phaseStatus}>
                  {project.phase.status === "in_progress" ? "Laeuft" : "Geplant"}
                </Text>
              </View>
            )}
          </Pressable>
        ))
      )}

      {/* Quick-Links */}
      <Text style={[heuteStyles.sectionTitle, { marginTop: 28 }]}>Schnellzugriff</Text>
      <View style={{ gap: 8 }}>
        <Tile
          icon={<Ionicons name="clipboard" size={22} color={Colors.raw.amber500} />}
          label="Projekte"
          rightContent={<TileSubtext text={`${metrics?.activeProjects ?? 0} aktiv`} color={Colors.raw.zinc400} />}
          onPress={() => router.navigate("/(tabs)/projekte")}
        />
        <Tile
          icon={<Ionicons name="calendar" size={22} color="#3b82f6" />}
          label="Planung"
          rightContent={<View />}
          onPress={() => router.push("/planung")}
        />
      </View>
    </>
  );
}

const heuteStyles = StyleSheet.create({
  sectionTitle: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 20,
    color: Colors.raw.white,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 32,
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc500,
  },
  projectCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 16,
    marginBottom: 10,
  },
  projectCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  projectName: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.white,
  },
  projectAddress: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
    marginTop: 2,
  },
  phaseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.raw.amber500,
  },
  phaseText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc300,
    flex: 1,
  },
  phaseStatus: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.amber500,
  },
});

export default function StartScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 84 : 90;
  const { isImpersonating } = useRole();
  const { data: metrics, refetch: refetchMetrics, isRefetching } = useDashboardMetrics();

  return (
    <View style={styles.container}>
      <TopBar />
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
            onRefresh={refetchMetrics}
            tintColor={Colors.raw.amber500}
            colors={[Colors.raw.amber500]}
          />
        }
      >
        <HeuteScreen />
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
    gap: 8,
    marginBottom: 20,
  },
  tilesRow: {
    flexDirection: "row",
    gap: 8,
  },
  tile: {
    flex: 1,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 12,
    minHeight: 80,
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
    fontSize: 13,
    color: Colors.raw.white,
    marginTop: 4,
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
