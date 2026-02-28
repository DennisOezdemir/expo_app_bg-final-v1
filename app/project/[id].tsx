import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  ActivityIndicator,
  Modal,
  Image,
  Dimensions,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useState, useEffect, useCallback, useMemo } from "react";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import Colors from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { mapDbStatus, type ProjectStatus } from "@/lib/status";

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
  offer_number: string;
  total_net: number | null;
  status: string | null;
  pdf_storage_path: string | null;
}

interface InspectionData {
  id: string;
  protocol_type: string;
  status: string | null;
  inspection_date: string;
  finalized_at: string | null;
  created_at: string;
  pdf_storage_path: string | null;
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

const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { color: string; label: string }> = {
  kritisch: { color: Colors.raw.rose500, label: "Kritisch" },
  achtung: { color: Colors.raw.amber500, label: "Achtung" },
  laeuft: { color: Colors.raw.emerald500, label: "Läuft" },
  fertig: { color: Colors.raw.zinc500, label: "Fertig" },
};

const DB_STATUS_LABEL: Record<string, string> = {
  INTAKE: "Eingang",
  DRAFT: "Entwurf",
  ACTIVE: "Aktiv",
  PLANNING: "Planung",
  IN_PROGRESS: "In Arbeit",
  INSPECTION: "Begehung",
  COMPLETION: "Abschluss",
  ON_HOLD: "Pausiert",
  COMPLETED: "Fertig",
  CANCELLED: "Storniert",
  ARCHIVED: "Archiviert",
};

type BegehungStatus = "erledigt" | "geplant" | "offen";

const BEGEHUNG_CONFIG: Record<BegehungStatus, { dot: string; label: string }> = {
  erledigt: { dot: Colors.raw.emerald500, label: "erledigt" },
  geplant: { dot: Colors.raw.amber500, label: "geplant" },
  offen: { dot: Colors.raw.zinc600, label: "nicht geplant" },
};

function mapInspectionStatus(status: string | null, finalizedAt: string | null): BegehungStatus {
  if (finalizedAt) return "erledigt";
  if (status === "completed") return "erledigt";
  if (status === "in_progress") return "geplant";
  return "offen";
}

function mapBegehungType(type: string): string {
  const map: Record<string, string> = {
    erstbegehung: "Erstbegehung",
    zwischenbegehung: "Zwischenbegehung",
    abnahme: "Abnahme",
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

function BegehungRow({ name, status, date, projectId, protocolId }: { name: string; status: BegehungStatus; date: string; projectId: string; protocolId?: string }) {
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
    const params: any = { type: typeMap[name] || "zwischenbegehung", projectId };
    if (protocolId) params.protocolId = protocolId;
    router.push({ pathname: "/begehung/[type]", params });
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

function DocumentRow({
  name,
  subtitle,
  storagePath,
  icon,
}: {
  name: string;
  subtitle?: string;
  storagePath: string | null;
  icon?: string;
}) {
  const hasPdf = !!storagePath;

  const handlePress = async () => {
    if (!storagePath) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const { data } = await supabase.storage
      .from("project-files")
      .createSignedUrl(storagePath, 300);
    if (data?.signedUrl) {
      Linking.openURL(data.signedUrl);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!hasPdf}
      style={({ pressed }) => [
        docStyles.row,
        { opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Ionicons
        name={(icon as any) || "document-text"}
        size={20}
        color={hasPdf ? Colors.raw.amber500 : Colors.raw.zinc700}
      />
      <View style={docStyles.textCol}>
        <Text style={[docStyles.name, !hasPdf && { color: Colors.raw.zinc600 }]}>{name}</Text>
        {subtitle && <Text style={docStyles.subtitle}>{subtitle}</Text>}
      </View>
      {hasPdf ? (
        <Feather name="download" size={16} color={Colors.raw.amber500} />
      ) : (
        <Text style={docStyles.noPdf}>Kein PDF</Text>
      )}
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
  textCol: {
    flex: 1,
  },
  name: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc300,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc600,
    marginTop: 2,
  },
  noPdf: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc700,
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
  const [photoCount, setPhotoCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBegehungPicker, setShowBegehungPicker] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const [projectRes, offersRes, messagesRes, costsRes, inspectionsRes, photosCountRes] = await Promise.all([
      supabase
        .from("projects")
        .select("id, project_number, name, display_name, object_street, object_zip, object_city, object_floor, status, budget_net, progress_percent, planned_start, planned_end, client_id")
        .eq("id", id)
        .single(),
      supabase
        .from("offers")
        .select("offer_number, total_net, status, pdf_storage_path")
        .eq("project_id", id),
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
      supabase
        .from("inspection_protocols")
        .select("id, protocol_type, status, inspection_date, finalized_at, created_at, pdf_storage_path")
        .eq("project_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("inspection_photos")
        .select("id", { count: "exact", head: true })
        .eq("project_id", id),
    ]);

    if (projectRes.error) {
      setError(projectRes.error.message);
      setLoading(false);
      return;
    }

    setProject(projectRes.data);
    setOffers(offersRes.data ?? []);
    setMessages(messagesRes.data ?? []);
    setInspections(inspectionsRes.data ?? []);
    setPhotoCount(photosCountRes.count ?? 0);

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

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

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
          <View style={styles.heroStatusRow}>
            {(() => {
              const mapped = mapDbStatus(project.status);
              const cfg = PROJECT_STATUS_CONFIG[mapped];
              return (
                <View style={[styles.heroStatusPill, { backgroundColor: cfg.color + "18" }]}>
                  <View style={[styles.heroStatusDot, { backgroundColor: cfg.color }]} />
                  <Text style={[styles.heroStatusText, { color: cfg.color }]}>
                    {DB_STATUS_LABEL[project.status ?? ""] ?? cfg.label}
                  </Text>
                </View>
              );
            })()}
          </View>
          <Text style={styles.heroAddress}>
            {addressLine || project.display_name || project.name}
          </Text>
          <Text style={styles.heroClient}>
            {clientName}
          </Text>

          {/* Progress */}
          <View style={styles.progressRow}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${project.progress_percent ?? 0}%`,
                    backgroundColor: PROJECT_STATUS_CONFIG[mapDbStatus(project.status)].color,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.progressText,
                { color: PROJECT_STATUS_CONFIG[mapDbStatus(project.status)].color },
              ]}
            >
              {project.progress_percent ?? 0}%
            </Text>
          </View>

          {/* Zeitplan */}
          {(project.planned_start || project.planned_end) && (
            <View style={styles.zeitplanRow}>
              {project.planned_start && (
                <View style={styles.zeitplanItem}>
                  <Feather name="play-circle" size={14} color={Colors.raw.zinc500} />
                  <Text style={styles.zeitplanLabel}>Start</Text>
                  <Text style={styles.zeitplanDate}>{formatDate(project.planned_start)}</Text>
                </View>
              )}
              {project.planned_end && (
                <View style={styles.zeitplanItem}>
                  <Feather name="flag" size={14} color={Colors.raw.zinc500} />
                  <Text style={styles.zeitplanLabel}>Ende</Text>
                  <Text style={styles.zeitplanDate}>{formatDate(project.planned_end)}</Text>
                </View>
              )}
            </View>
          )}
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
            onPress={() => router.push({ pathname: "/begehung/[type]", params: { type: "erstbegehung", tab: "material", projectId: id || "" } })}
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
          <View style={shStyles.row}>
            <Text style={shStyles.title}>Begehungen</Text>
            <Pressable
              onPress={() => setShowBegehungPicker(true)}
              style={({ pressed }) => [styles.begehungAddBtn, { opacity: pressed ? 0.7 : 1 }]}
              testID="begehung-add-btn"
            >
              <Ionicons name="add" size={18} color={Colors.raw.zinc950} />
            </Pressable>
          </View>
          {inspections.length > 0 ? (
            inspections.map((ins) => (
              <BegehungRow
                key={ins.id}
                name={mapBegehungType(ins.protocol_type)}
                status={mapInspectionStatus(ins.status, ins.finalized_at)}
                date={ins.finalized_at ? formatDate(ins.finalized_at) : formatDate(ins.inspection_date)}
                projectId={id!}
                protocolId={ins.id}
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
          <SectionHeader
            title="Dokumente"
            badge={(() => { const c = offers.length + inspections.filter((i) => i.finalized_at || i.status === "completed").length + (photoCount > 0 ? 1 : 0); return c > 0 ? String(c) : undefined; })()}
          />
          {offers.map((offer) => (
            <DocumentRow
              key={offer.offer_number}
              name={`Angebot ${offer.offer_number}`}
              subtitle={offer.status === "ACCEPTED" ? "Angenommen" : offer.status === "DRAFT" ? "Entwurf" : offer.status ?? undefined}
              storagePath={offer.pdf_storage_path}
              icon="document-text"
            />
          ))}
          {inspections
            .filter((i) => i.finalized_at || i.status === "completed")
            .map((ins) => (
              <DocumentRow
                key={`proto-${ins.id}`}
                name={`Protokoll ${mapBegehungType(ins.protocol_type)}`}
                subtitle={formatDate(ins.finalized_at || ins.inspection_date)}
                storagePath={ins.pdf_storage_path}
                icon="clipboard"
              />
            ))}
          {photoCount > 0 && (
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowPhotoGallery(true);
              }}
              style={({ pressed }) => [docStyles.row, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Ionicons name="images" size={20} color={Colors.raw.amber500} />
              <View style={docStyles.textCol}>
                <Text style={docStyles.name}>Fotos ({photoCount})</Text>
                <Text style={docStyles.subtitle}>Begehungsfotos</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.raw.zinc600} />
            </Pressable>
          )}
          {offers.length === 0 && inspections.length === 0 && photoCount === 0 && (
            <Text style={styles.emptySection}>Keine Dokumente</Text>
          )}
        </SectionCard>
      </ScrollView>

      <Modal
        visible={showBegehungPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBegehungPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowBegehungPicker(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Begehung erstellen</Text>
            <Text style={styles.modalSubtitle}>Art der Begehung w{"\u00E4"}hlen</Text>
            {[
              { key: "erstbegehung", label: "Erstbegehung", icon: "eye", desc: "Erstmalige Begutachtung vor Ort" },
              { key: "zwischenbegehung", label: "Zwischenbegehung", icon: "sync", desc: "Kontrolle w\u00E4hrend der Bauphase" },
              { key: "abnahme", label: "Abnahme", icon: "checkmark-circle", desc: "Finale Abnahme nach Fertigstellung" },
            ].map((item) => (
              <Pressable
                key={item.key}
                style={({ pressed }) => [styles.modalOption, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowBegehungPicker(false);
                  router.push({ pathname: "/begehung/[type]", params: { type: item.key, projectId: id || "" } });
                }}
                testID={`begehung-option-${item.key}`}
              >
                <View style={styles.modalOptionIcon}>
                  <Ionicons name={item.icon as any} size={20} color={Colors.raw.amber500} />
                </View>
                <View style={styles.modalOptionText}>
                  <Text style={styles.modalOptionLabel}>{item.label}</Text>
                  <Text style={styles.modalOptionDesc}>{item.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.raw.zinc600} />
              </Pressable>
            ))}
            <Pressable
              style={({ pressed }) => [styles.modalCancel, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => setShowBegehungPicker(false)}
            >
              <Text style={styles.modalCancelText}>Abbrechen</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {showPhotoGallery && (
        <PhotoGalleryModal
          projectId={id!}
          visible={showPhotoGallery}
          onClose={() => setShowPhotoGallery(false)}
        />
      )}
    </View>
  );
}

// --- Photo Gallery Modal ---

interface InspectionPhoto {
  id: string;
  storage_path: string;
  room_name: string | null;
  position_title: string | null;
  inspection_type: string;
  created_at: string;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const THUMB_SIZE = (SCREEN_WIDTH - 60) / 2;

function PhotoGalleryModal({
  projectId,
  visible,
  onClose,
}: {
  projectId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [fullscreenUri, setFullscreenUri] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("inspection_photos")
        .select("id, storage_path, room_name, position_title, inspection_type, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (cancelled || error) { setLoading(false); return; }
      setPhotos(data || []);

      // Generate signed URLs in batch
      const paths = (data || []).map((p) => p.storage_path);
      if (paths.length > 0) {
        const { data: urlData } = await supabase.storage
          .from("project-files")
          .createSignedUrls(paths, 3600);
        if (!cancelled && urlData) {
          const urlMap: Record<string, string> = {};
          urlData.forEach((u, i) => {
            if (u.signedUrl) urlMap[paths[i]] = u.signedUrl;
          });
          setSignedUrls(urlMap);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [visible, projectId]);

  const groupedPhotos = useMemo(() => {
    const groups: Record<string, InspectionPhoto[]> = {};
    photos.forEach((p) => {
      const key = p.room_name || "Allgemein";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return Object.entries(groups);
  }, [photos]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={pgStyles.container}>
        <View style={[pgStyles.header, { paddingTop: topInset + 8 }]}>
          <Text style={pgStyles.title}>Fotos ({photos.length})</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [pgStyles.closeBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="close" size={24} color={Colors.raw.white} />
          </Pressable>
        </View>

        {loading ? (
          <View style={pgStyles.loadingWrap}>
            <ActivityIndicator size="small" color={Colors.raw.amber500} />
          </View>
        ) : photos.length === 0 ? (
          <View style={pgStyles.loadingWrap}>
            <Ionicons name="images-outline" size={48} color={Colors.raw.zinc700} />
            <Text style={pgStyles.emptyText}>Keine Fotos vorhanden</Text>
          </View>
        ) : (
          <ScrollView style={pgStyles.scroll} contentContainerStyle={pgStyles.scrollContent}>
            {groupedPhotos.map(([roomName, roomPhotos]) => (
              <View key={roomName} style={pgStyles.group}>
                <Text style={pgStyles.groupTitle}>{roomName}</Text>
                <View style={pgStyles.grid}>
                  {roomPhotos.map((photo) => {
                    const uri = signedUrls[photo.storage_path];
                    return (
                      <Pressable
                        key={photo.id}
                        onPress={() => {
                          if (uri) {
                            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setFullscreenUri(uri);
                          }
                        }}
                        style={({ pressed }) => [pgStyles.thumbWrap, { opacity: pressed ? 0.8 : 1 }]}
                      >
                        {uri ? (
                          <Image source={{ uri }} style={pgStyles.thumb} />
                        ) : (
                          <View style={[pgStyles.thumb, pgStyles.thumbPlaceholder]}>
                            <Ionicons name="image-outline" size={24} color={Colors.raw.zinc600} />
                          </View>
                        )}
                        <Text style={pgStyles.thumbLabel} numberOfLines={1}>
                          {photo.position_title || photo.inspection_type}
                        </Text>
                        <Text style={pgStyles.thumbDate}>
                          {new Date(photo.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Fullscreen overlay */}
        {fullscreenUri && (
          <Modal visible transparent animationType="fade" onRequestClose={() => setFullscreenUri(null)}>
            <View style={pgStyles.fullscreenBg}>
              <Pressable style={[pgStyles.fullscreenClose, { top: topInset + 12 }]} onPress={() => setFullscreenUri(null)}>
                <Ionicons name="close-circle" size={36} color={Colors.raw.white} />
              </Pressable>
              <Image source={{ uri: fullscreenUri }} style={pgStyles.fullscreenImg} resizeMode="contain" />
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const pgStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc600,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  group: {
    marginBottom: 24,
  },
  groupTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.zinc300,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  thumbWrap: {
    width: THUMB_SIZE,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    backgroundColor: Colors.raw.zinc800,
  },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  thumbLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.zinc300,
    marginTop: 6,
  },
  thumbDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.raw.zinc600,
    marginTop: 2,
  },
  fullscreenBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenClose: {
    position: "absolute",
    right: 16,
    zIndex: 10,
  },
  fullscreenImg: {
    width: "100%",
    height: "80%",
  },
});

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
  heroStatusRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  heroStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  heroStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroStatusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
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
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.raw.zinc800,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 16,
    minWidth: 42,
    textAlign: "right",
  },
  zeitplanRow: {
    flexDirection: "row",
    gap: 24,
    marginTop: 14,
  },
  zeitplanItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  zeitplanLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  zeitplanDate: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc300,
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
  begehungAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.raw.amber500,
    alignItems: "center" as const,
    justifyContent: "center" as const,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.raw.zinc900,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "web" ? 34 : 40,
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
    gap: 14,
  },
  modalOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.raw.amber500 + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.white,
  },
  modalOptionDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginTop: 2,
  },
  modalCancel: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
  },
  modalCancelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.zinc500,
  },
});
