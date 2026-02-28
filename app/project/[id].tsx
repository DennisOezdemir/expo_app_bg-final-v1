import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useState, useEffect, useCallback } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { supabase } from "@/lib/supabase";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// --- Types ---

interface ProjectData {
  id: string;
  project_number: string;
  name: string;
  display_name: string | null;
  object_street: string;
  object_zip: string;
  object_city: string;
  object_floor: string | null;
  status: string | null;
  budget_net: number | null;
  progress_percent: number | null;
  planned_start: string | null;
  planned_end: string | null;
  client_id: string | null;
}

interface OfferData {
  total_net: number | null;
  status: string | null;
}

interface InspectionData {
  id: string;
  protocol_type: string;
  inspection_date: string;
  status: string | null;
}

interface MessageData {
  id: string;
  message_type: string;
  text: string | null;
  sender_id: string | null;
  created_at: string;
}

// --- Reusable Components ---

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[qaStyles.container, animStyle]}
      onPressIn={() => {
        scale.value = withSpring(0.93, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.();
      }}
    >
      <View style={qaStyles.circle}>{icon}</View>
      <Text style={qaStyles.label}>{label}</Text>
    </AnimatedPressable>
  );
}

const qaStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: 64,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.raw.zinc900,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.raw.zinc400,
    textAlign: "center",
  },
});

function SectionCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[cardStyles.card, style]}>{children}</View>;
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginBottom: 16,
  },
});

function SectionHeader({
  title,
  badge,
  rightIcon,
  onRightPress,
}: {
  title: string;
  badge?: string;
  rightIcon?: string;
  onRightPress?: () => void;
}) {
  return (
    <View style={shStyles.row}>
      <View style={shStyles.left}>
        <Text style={shStyles.title}>{title}</Text>
        {badge && (
          <View style={shStyles.badge}>
            <Text style={shStyles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      {rightIcon && (
        <Pressable
          onPress={onRightPress}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Ionicons name={rightIcon as any} size={22} color={Colors.raw.zinc500} />
        </Pressable>
      )}
    </View>
  );
}

const shStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.raw.white,
  },
  badge: {
    backgroundColor: Colors.raw.rose500,
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },
  badgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#fff",
  },
});

type BegehungStatus = "erledigt" | "geplant" | "offen";

const BEGEHUNG_CONFIG: Record<BegehungStatus, { dot: string; label: string }> = {
  erledigt: { dot: Colors.raw.emerald500, label: "erledigt" },
  geplant: { dot: Colors.raw.amber500, label: "geplant" },
  offen: { dot: Colors.raw.zinc600, label: "nicht geplant" },
};

function mapInspectionStatus(dbStatus: string | null): BegehungStatus {
  if (!dbStatus) return "offen";
  const s = dbStatus.toLowerCase();
  if (s === "completed" || s === "finalized") return "erledigt";
  if (s === "scheduled" || s === "in_progress" || s === "draft") return "geplant";
  return "offen";
}

function mapProtocolType(type: string): string {
  const map: Record<string, string> = {
    initial: "Erstbegehung",
    interim: "Zwischenbegehung",
    final: "Abnahme",
  };
  return map[type.toLowerCase()] || type;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function BegehungRow({ name, status, date }: { name: string; status: BegehungStatus; date: string }) {
  const cfg = BEGEHUNG_CONFIG[status];
  const typeMap: Record<string, string> = {
    Erstbegehung: "erstbegehung",
    Zwischenbegehung: "zwischenbegehung",
    Abnahme: "abnahme",
  };
  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({ pathname: "/begehung/[type]", params: { type: typeMap[name] || "zwischenbegehung" } });
  };
  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [bgStyles.row, { opacity: pressed ? 0.8 : 1 }]}
    >
      <View style={bgStyles.left}>
        <View style={[bgStyles.dot, { backgroundColor: cfg.dot }]} />
        <View>
          <Text style={bgStyles.name}>{name}</Text>
          <Text style={bgStyles.meta}>
            {date ? `${date} \u2022 ` : ""}
            {cfg.label}
          </Text>
        </View>
      </View>
      {status === "erledigt" && (
        <Ionicons name="checkmark-circle" size={20} color={Colors.raw.emerald500} />
      )}
      {status === "geplant" && (
        <View style={bgStyles.startBtn}>
          <Text style={bgStyles.startText}>Starten</Text>
        </View>
      )}
      {status === "offen" && (
        <Ionicons name="chevron-forward" size={18} color={Colors.raw.zinc600} />
      )}
    </Pressable>
  );
}

const bgStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.white,
    marginBottom: 2,
  },
  meta: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  startBtn: {
    backgroundColor: Colors.raw.amber500 + "18",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  startText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.amber500,
  },
});

function DocumentRow({ name }: { name: string }) {
  return (
    <Pressable
      style={({ pressed }) => [
        docStyles.row,
        { opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Ionicons name="document-text" size={20} color={Colors.raw.amber500} />
      <Text style={docStyles.name}>{name}</Text>
      <Feather name="download" size={16} color={Colors.raw.zinc600} />
    </Pressable>
  );
}

const docStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  name: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc300,
    flex: 1,
  },
});

// --- Main Screen ---

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [clientName, setClientName] = useState<string>("—");
  const [offers, setOffers] = useState<OfferData[]>([]);
  const [inspections, setInspections] = useState<InspectionData[]>([]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [totalCosts, setTotalCosts] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const [projectRes, offersRes, inspectionsRes, messagesRes, costsRes] = await Promise.all([
      supabase
        .from("projects")
        .select("id, project_number, name, display_name, object_street, object_zip, object_city, object_floor, status, budget_net, progress_percent, planned_start, planned_end, client_id")
        .eq("id", id)
        .single(),
      supabase
        .from("offers")
        .select("total_net, status")
        .eq("project_id", id),
      supabase
        .from("inspection_protocols")
        .select("id, protocol_type, inspection_date, status")
        .eq("project_id", id)
        .order("inspection_date", { ascending: true }),
      supabase
        .from("project_messages")
        .select("id, message_type, text, sender_id, created_at")
        .eq("project_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("purchase_invoices")
        .select("total_net")
        .eq("project_id", id),
    ]);

    if (projectRes.error) {
      setError(projectRes.error.message);
      setLoading(false);
      return;
    }

    setProject(projectRes.data);
    setOffers(offersRes.data ?? []);
    setInspections(inspectionsRes.data ?? []);
    setMessages(messagesRes.data ?? []);

    const costs = (costsRes.data ?? []).reduce((sum, inv) => sum + (Number(inv.total_net) || 0), 0);
    setTotalCosts(costs);

    // Fetch client name if client_id exists
    if (projectRes.data.client_id) {
      const { data: clientData } = await supabase
        .from("clients")
        .select("company_name")
        .eq("id", projectRes.data.client_id)
        .single();
      if (clientData?.company_name) {
        setClientName(clientData.company_name);
      }
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerState]}>
        <ActivityIndicator size="large" color={Colors.raw.amber500} />
      </View>
    );
  }

  if (error || !project) {
    return (
      <View style={[styles.container, styles.centerState]}>
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.raw.zinc700} />
        <Text style={styles.errorText}>Fehler beim Laden</Text>
        {error && <Text style={styles.errorDetail}>{error}</Text>}
        <Pressable
          onPress={fetchData}
          style={({ pressed }) => [styles.retryButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.retryText}>Erneut versuchen</Text>
        </Pressable>
      </View>
    );
  }

  // Compute financials
  const angebotValue = offers.reduce((sum, o) => sum + (Number(o.total_net) || 0), 0);
  const ergebnisValue = angebotValue - totalCosts;
  const marginPercent = angebotValue > 0 ? Math.round((ergebnisValue / angebotValue) * 100) : 0;
  const marginColor = marginPercent >= 20 ? "#22C55E" : marginPercent >= 10 ? "#F59E0B" : "#EF4444";

  const addressLine = [
    project.object_street,
    project.object_floor,
  ].filter(Boolean).join("\n");

  const unreadMessages = messages.length;

  return (
    <View style={styles.container}>
      <View style={[styles.backRow, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <Text style={styles.projectCode}>{project.project_number}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 64,
            paddingBottom: bottomInset + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Text style={styles.heroAddress}>
            {addressLine || project.display_name || project.name}
          </Text>
          <Text style={styles.heroClient}>
            {clientName}
          </Text>
        </View>

        <SectionCard>
          <View style={styles.marginBreakdown}>
            <View style={styles.marginCol}>
              <Text style={styles.marginLabel}>Angebot</Text>
              <Text style={styles.marginValue}>
                {angebotValue > 0
                  ? `\u20AC${Math.round(angebotValue).toLocaleString("de-DE")}`
                  : "—"}
              </Text>
            </View>
            <View style={styles.marginCol}>
              <Text style={styles.marginLabel}>Marge</Text>
              <Text style={[styles.marginValueLarge, { color: angebotValue > 0 ? marginColor : Colors.raw.zinc500 }]}>
                {angebotValue > 0 ? `${marginPercent}%` : "—"}
              </Text>
            </View>
            <View style={styles.marginCol}>
              <Text style={styles.marginLabel}>Ergebnis</Text>
              <Text style={[styles.marginValue, { color: angebotValue > 0 ? marginColor : Colors.raw.zinc500 }]}>
                {angebotValue > 0
                  ? `\u20AC${Math.round(ergebnisValue).toLocaleString("de-DE")}`
                  : "—"}
              </Text>
            </View>
          </View>
        </SectionCard>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.qaRow}
          style={styles.qaScroll}
        >
          <QuickAction
            icon={<Ionicons name="clipboard" size={24} color={Colors.raw.amber500} />}
            label="Auftrag"
            onPress={() => router.push({ pathname: "/auftrag/[id]", params: { id: id || "1" } })}
          />
          <QuickAction
            icon={<MaterialCommunityIcons name="package-variant" size={24} color={Colors.raw.amber500} />}
            label="Material"
            onPress={() => router.push({ pathname: "/begehung/[type]", params: { type: "erstbegehung", tab: "material" } })}
          />
          <QuickAction
            icon={<Ionicons name="people" size={24} color={Colors.raw.amber500} />}
            label="Team"
            onPress={() => router.push("/project/team" as any)}
          />
          <QuickAction
            icon={<Ionicons name="camera" size={24} color={Colors.raw.amber500} />}
            label="Foto"
            onPress={() => router.push({ pathname: "/foto", params: { projectId: id || "1" } })}
          />
          <QuickAction
            icon={<Ionicons name="chatbubbles" size={24} color={Colors.raw.amber500} />}
            label="Chat"
            onPress={() => router.push({ pathname: "/chat/[id]", params: { id: id || "1" } })}
          />
        </ScrollView>

        {/* Begehungen */}
        <SectionCard>
          <SectionHeader title="Begehungen" rightIcon="add-circle-outline" />
          {inspections.length > 0 ? (
            inspections.map((ins) => (
              <BegehungRow
                key={ins.id}
                name={mapProtocolType(ins.protocol_type)}
                status={mapInspectionStatus(ins.status)}
                date={formatDate(ins.inspection_date)}
              />
            ))
          ) : (
            <Text style={styles.emptySection}>Keine Begehungen vorhanden</Text>
          )}
        </SectionCard>

        {/* Nachrichten */}
        <SectionCard>
          <SectionHeader
            title="Nachrichten"
            badge={unreadMessages > 0 ? String(unreadMessages) : undefined}
          />
          {messages.length > 0 ? (
            messages.map((msg, i) => (
              <View
                key={msg.id}
                style={[
                  styles.msgRow,
                  i < messages.length - 1 && styles.msgBorder,
                ]}
              >
                <View style={[styles.msgIcon, { backgroundColor: Colors.raw.amber500 + "18" }]}>
                  <Ionicons
                    name={msg.message_type === "photo" ? "camera" : "chatbubble"}
                    size={16}
                    color={Colors.raw.amber500}
                  />
                </View>
                <View style={styles.msgBody}>
                  <Text style={styles.msgSender}>{msg.message_type}</Text>
                  <Text style={styles.msgText} numberOfLines={1}>
                    {msg.text || "(Kein Text)"}
                  </Text>
                </View>
                <Text style={styles.msgTime}>{formatTime(msg.created_at)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptySection}>Keine Nachrichten</Text>
          )}
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push({ pathname: "/chat/[id]", params: { id: id || "1" } });
            }}
            style={({ pressed }) => [
              styles.allMessagesBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.allMessagesText}>Alle Nachrichten</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.raw.amber500} />
          </Pressable>
        </SectionCard>

        {/* Dokumente */}
        <SectionCard>
          <SectionHeader title="Dokumente" />
          {offers.length > 0 && <DocumentRow name="Angebot" />}
          {inspections.some((i) => i.status === "completed" || i.status === "finalized") && (
            <DocumentRow name="Protokoll Begehung" />
          )}
          {(offers.length === 0 && inspections.length === 0) && (
            <Text style={styles.emptySection}>Keine Dokumente</Text>
          )}
        </SectionCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  errorText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.raw.zinc600,
  },
  errorDetail: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc600,
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
  backRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  projectCode: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc500,
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  heroSection: {
    marginBottom: 24,
  },
  heroAddress: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 28,
    color: Colors.raw.white,
    lineHeight: 34,
    marginBottom: 8,
  },
  heroClient: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.zinc500,
  },
  marginBreakdown: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  marginCol: {
    flex: 1,
    alignItems: "center",
  },
  marginLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.raw.zinc500,
    marginBottom: 4,
  },
  marginValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.raw.white,
  },
  marginValueLarge: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 20,
  },
  qaScroll: {
    marginBottom: 16,
    marginHorizontal: -20,
  },
  qaRow: {
    paddingHorizontal: 20,
    gap: 12,
    flexDirection: "row",
  },
  emptySection: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc600,
    paddingVertical: 12,
  },
  msgRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    gap: 12,
  },
  msgBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  msgIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  msgBody: {
    flex: 1,
  },
  msgSender: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.white,
    marginBottom: 2,
  },
  msgText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc400,
  },
  msgTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc600,
  },
  allMessagesBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
    marginTop: 4,
  },
  allMessagesText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.amber500,
  },
});
