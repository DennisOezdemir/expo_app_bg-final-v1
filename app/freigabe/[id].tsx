import {
  StyleSheet,
  Text,
  View,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { useState, useCallback, useEffect } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { supabase } from "@/lib/supabase";

// --- Types ---

type ApprovalUiType = "auftrag" | "angebot" | "material" | "nachtrag" | "rechnung";

const APPROVAL_TYPE_MAP: Record<string, ApprovalUiType> = {
  PROJECT_START: "auftrag",
  INVOICE: "rechnung",
  MATERIAL_ORDER: "material",
  SUBCONTRACTOR_ORDER: "material",
  INSPECTION_ASSIGN: "angebot",
  SCHEDULE: "angebot",
  COMPLETION: "angebot",
  INSPECTION: "angebot",
};

interface ApprovalDetail {
  id: string;
  uiType: ApprovalUiType;
  dbType: string;
  projectId: string;
  projectCode: string;
  projectAddress: string;
  clientName: string;
  status: string;
  submittedAgo: string;
  summary: string;
  requestData: any;
  // Project fields for auftrag editing
  projectName: string;
  plannedStart: string | null;
  plannedEnd: string | null;
  budgetNet: number | null;
  source: string | null;
}

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

// --- Components ---

function StatusBadge({ status, color }: { status: string; color: string }) {
  return (
    <View style={[statusStyles.badge, { backgroundColor: color + "18" }]}>
      <View style={[statusStyles.dot, { backgroundColor: color }]} />
      <Text style={[statusStyles.text, { color }]}>{status}</Text>
    </View>
  );
}

const statusStyles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[s.card, style]}>{children}</View>;
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={s.sectionLabel}>{label}</Text>;
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <View style={s.infoRow}>
      {icon && <Ionicons name={icon as any} size={16} color={Colors.raw.zinc500} />}
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

function AuftragContent({ data }: { data: ApprovalDetail }) {
  const rd = data.requestData || {};
  return (
    <>
      <SectionLabel label="PROJEKT-DATEN" />
      <Card>
        <InfoRow label="Projekt" value={data.projectName || data.projectCode} icon="clipboard" />
        <InfoRow label="Adresse" value={data.projectAddress} icon="location" />
        <InfoRow label="Auftraggeber" value={data.clientName || "–"} icon="business" />
        {data.budgetNet != null && (
          <InfoRow label="Budget netto" value={`€${data.budgetNet.toLocaleString("de-DE")}`} icon="cash" />
        )}
        {data.plannedStart && (
          <InfoRow label="Geplanter Start" value={new Date(data.plannedStart).toLocaleDateString("de-DE")} icon="calendar" />
        )}
        {data.plannedEnd && (
          <InfoRow label="Geplantes Ende" value={new Date(data.plannedEnd).toLocaleDateString("de-DE")} icon="calendar-outline" />
        )}
        {data.source && (
          <InfoRow label="Quelle" value={data.source} icon="mail" />
        )}
      </Card>

      {rd.trades && rd.trades.length > 0 && (
        <>
          <SectionLabel label="GEWERKE" />
          <Card>
            {rd.trades.map((t: string, i: number) => (
              <View key={i} style={s.tradeChip}>
                <MaterialCommunityIcons name="hammer-wrench" size={14} color={Colors.raw.amber500} />
                <Text style={s.tradeText}>{t}</Text>
              </View>
            ))}
          </Card>
        </>
      )}

      {data.summary ? (
        <>
          <SectionLabel label="ZUSAMMENFASSUNG" />
          <Card>
            <Text style={s.summaryText}>{data.summary}</Text>
          </Card>
        </>
      ) : null}
    </>
  );
}

function GenericContent({ data }: { data: ApprovalDetail }) {
  const rd = data.requestData || {};
  return (
    <>
      {data.summary ? (
        <>
          <SectionLabel label="DETAILS" />
          <Card>
            <Text style={s.summaryText}>{data.summary}</Text>
          </Card>
        </>
      ) : null}

      {rd.amount && (
        <>
          <SectionLabel label="BETRAG" />
          <Card>
            <View style={s.amountRow}>
              <Ionicons name="cash" size={20} color={Colors.raw.amber500} />
              <Text style={s.amountBig}>€{rd.amount}</Text>
            </View>
          </Card>
        </>
      )}

      {rd.positions && rd.positions.length > 0 && (
        <>
          <SectionLabel label="POSITIONEN" />
          <Card>
            {rd.positions.map((pos: any, i: number) => (
              <View key={i} style={[s.posRow, i < rd.positions.length - 1 && s.posRowBorder]}>
                <Text style={s.posName} numberOfLines={1}>{pos.name}</Text>
                {pos.amount && <Text style={s.posAmount}>€{pos.amount}</Text>}
              </View>
            ))}
          </Card>
        </>
      )}
    </>
  );
}

function RejectionSheet({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const insets = useSafeAreaInsets();

  const handleSubmit = () => {
    if (reason.trim().length === 0) return;
    onSubmit(reason);
    setReason("");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={rejStyles.overlay}>
        <Pressable style={rejStyles.dismissArea} onPress={onClose} />
        <View style={[rejStyles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={rejStyles.handle} />
          <Text style={rejStyles.title}>Grund für Ablehnung</Text>
          <TextInput
            style={rejStyles.input}
            placeholder="Begründung eingeben..."
            placeholderTextColor={Colors.raw.zinc600}
            multiline
            numberOfLines={4}
            value={reason}
            onChangeText={setReason}
            testID="rejection-reason"
          />
          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => [
              rejStyles.submitButton,
              { opacity: reason.trim().length === 0 ? 0.5 : pressed ? 0.8 : 1 },
            ]}
            disabled={reason.trim().length === 0}
            testID="submit-rejection"
          >
            <Ionicons name="close-circle" size={20} color="#fff" />
            <Text style={rejStyles.submitText}>Ablehnung senden</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const rejStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.raw.zinc900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.raw.zinc700,
    alignSelf: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.raw.white,
    marginBottom: 20,
  },
  input: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.white,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.rose500,
    borderRadius: 14,
    paddingVertical: 16,
  },
  submitText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#fff",
  },
});

function ApprovedToast({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(300)}
      style={toastStyles.container}
    >
      <View style={toastStyles.inner}>
        <Ionicons name="checkmark-circle" size={24} color={Colors.raw.emerald500} />
        <Text style={toastStyles.text}>Freigegeben</Text>
      </View>
    </Animated.View>
  );
}

const toastStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    zIndex: 100,
    alignItems: "center",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.raw.zinc800,
    borderWidth: 1,
    borderColor: Colors.raw.emerald500 + "40",
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  text: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.emerald500,
  },
});

export default function FreigabeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [data, setData] = useState<ApprovalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [rejectionVisible, setRejectionVisible] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [acting, setActing] = useState(false);

  const approveFlash = useSharedValue(0);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: approveFlash.value,
  }));

  // Fetch approval data
  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      const { data: row, error } = await supabase
        .from("approvals")
        .select("*, projects(id, project_number, name, display_name, object_street, object_city, object_zip, budget_net, planned_start, planned_end, source, client_id, clients(company_name, first_name, last_name))")
        .eq("id", id)
        .single();

      if (error || !row) {
        console.error("Approval detail laden:", error);
        setLoading(false);
        return;
      }

      const project = row.projects as any;
      const client = project?.clients;
      const clientName = client?.company_name || [client?.first_name, client?.last_name].filter(Boolean).join(" ") || "";

      setData({
        id: row.id,
        uiType: APPROVAL_TYPE_MAP[row.approval_type] || "angebot",
        dbType: row.approval_type,
        projectId: row.project_id,
        projectCode: project?.project_number || "–",
        projectAddress: [project?.object_street, project?.object_city].filter(Boolean).join(", ") || "–",
        clientName,
        status: "Wartet auf Freigabe",
        submittedAgo: formatTimeAgo(row.requested_at),
        summary: row.request_summary || "",
        requestData: row.request_data || {},
        projectName: project?.display_name || project?.name || "",
        plannedStart: project?.planned_start,
        plannedEnd: project?.planned_end,
        budgetNet: project?.budget_net,
        source: project?.source,
      });
      setLoading(false);
    };

    fetchDetail();
  }, [id]);

  const handleApprove = useCallback(async () => {
    if (!data || acting) return;
    setActing(true);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    approveFlash.value = withSequence(
      withTiming(0.4, { duration: 150 }),
      withTiming(0, { duration: 400 })
    );

    try {
      const { data: result, error } = await supabase.rpc("fn_approve_intake", { p_approval_id: data.id });
      if (error) {
        console.error("Approve failed:", error);
        if (Platform.OS === "web") alert("Fehler: " + error.message);
        setActing(false);
        return;
      }
      if (result && !result.success) {
        console.error("Approve failed:", result.error);
        if (Platform.OS === "web") alert("Fehler: " + result.error);
        setActing(false);
        return;
      }

      setShowToast(true);
      setTimeout(() => {
        router.back();
      }, 1200);
    } catch (e) {
      console.error("Approve error:", e);
      setActing(false);
    }
  }, [data, acting, router, approveFlash]);

  const handleReject = useCallback(() => {
    if (acting) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setRejectionVisible(true);
  }, [acting]);

  const handleRejectionSubmit = useCallback(
    async (reason: string) => {
      if (!data || acting) return;
      setActing(true);
      setRejectionVisible(false);

      try {
        const { data: result, error } = await supabase.rpc("fn_reject_intake", {
          p_approval_id: data.id,
          p_reason: reason,
        });
        if (error) {
          console.error("Reject failed:", error);
          if (Platform.OS === "web") alert("Fehler: " + error.message);
          setActing(false);
          return;
        }
        if (result && !result.success) {
          console.error("Reject failed:", result.error);
          if (Platform.OS === "web") alert("Fehler: " + result.error);
          setActing(false);
          return;
        }

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        setTimeout(() => {
          router.back();
        }, 300);
      } catch (e) {
        console.error("Reject error:", e);
        setActing(false);
      }
    },
    [data, acting, router]
  );

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.raw.amber500} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="alert-circle" size={48} color={Colors.raw.zinc600} />
        <Text style={{ color: Colors.raw.zinc400, marginTop: 12, fontFamily: "Inter_500Medium", fontSize: 16 }}>
          Freigabe nicht gefunden
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: Colors.raw.amber500, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>Zurück</Text>
        </Pressable>
      </View>
    );
  }

  const typeTitle =
    data.uiType === "auftrag"
      ? "Auftrag freigeben"
      : data.uiType === "material"
      ? "Material bestellen"
      : data.uiType === "nachtrag"
      ? "Nachtrag genehmigen"
      : data.uiType === "rechnung"
      ? "Rechnung freigeben"
      : "Angebot freigeben";

  const approveLabel =
    data.uiType === "auftrag"
      ? "FREIGEBEN"
      : data.uiType === "material"
      ? "BESTELLEN"
      : data.uiType === "nachtrag"
      ? "GENEHMIGEN"
      : "FREIGEBEN";

  return (
    <View style={s.container}>
      <Animated.View
        style={[s.flashOverlay, { backgroundColor: Colors.raw.emerald500 }, flashStyle]}
        pointerEvents="none"
      />

      <ApprovedToast visible={showToast} />

      <View style={[s.backRow, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backButton, { opacity: pressed ? 0.7 : 1 }]}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <Text style={s.backLabel}>Freigaben</Text>
      </View>

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[
          s.scrollContent,
          {
            paddingTop: topInset + 64,
            paddingBottom: bottomInset + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.pageTitle}>{typeTitle}</Text>

        <StatusBadge status={data.status} color={Colors.raw.amber500} />
        <Text style={s.submittedAgo}>{data.submittedAgo} eingereicht</Text>

        <Card style={s.projectCard}>
          <Pressable
            style={({ pressed }) => [s.projectCardInner, { opacity: pressed ? 0.7 : 1 }]}
            testID="project-link"
          >
            <View style={s.projectLeft}>
              <Ionicons name="clipboard" size={18} color={Colors.raw.amber500} />
              <View style={{ flex: 1 }}>
                <Text style={s.projectCodeText}>
                  {data.projectCode} {"\u2022"} {data.projectAddress}
                </Text>
                <Text style={s.projectClientText}>
                  {data.clientName || "–"}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.raw.zinc600} />
          </Pressable>
        </Card>

        {data.uiType === "auftrag" ? (
          <AuftragContent data={data} />
        ) : (
          <GenericContent data={data} />
        )}
      </ScrollView>

      <View style={[s.stickyBottom, { paddingBottom: Math.max(bottomInset, 20) }]}>
        <TextInput
          style={s.commentInput}
          placeholder="Anmerkung (optional)..."
          placeholderTextColor={Colors.raw.zinc600}
          value={comment}
          onChangeText={setComment}
          testID="comment-input"
        />
        <View style={s.actionButtons}>
          <Pressable
            onPress={handleReject}
            disabled={acting}
            style={({ pressed }) => [
              s.rejectButton,
              { opacity: acting ? 0.4 : pressed ? 0.8 : 1, transform: [{ scale: pressed && !acting ? 0.97 : 1 }] },
            ]}
            testID="detail-reject-button"
          >
            <Ionicons name="close" size={22} color={Colors.raw.rose400} />
            <Text style={s.rejectText}>Nein</Text>
          </Pressable>
          <Pressable
            onPress={handleApprove}
            disabled={acting}
            style={({ pressed }) => [
              s.approveButton,
              { opacity: acting ? 0.4 : pressed ? 0.9 : 1, transform: [{ scale: pressed && !acting ? 0.97 : 1 }] },
            ]}
            testID="detail-approve-button"
          >
            {acting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={24} color="#fff" />
                <Text style={s.approveText}>{approveLabel}</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      <RejectionSheet
        visible={rejectionVisible}
        onClose={() => setRejectionVisible(false)}
        onSubmit={handleRejectionSubmit}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 90,
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
    backgroundColor: Colors.raw.zinc950 + "E0",
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.raw.zinc400,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 28,
    color: Colors.raw.white,
    marginBottom: 12,
  },
  submittedAgo: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc500,
    marginTop: 8,
    marginBottom: 24,
  },
  projectCard: {
    marginBottom: 24,
  },
  projectCardInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  projectLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  projectCodeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc300,
    marginBottom: 4,
  },
  projectClientText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: Colors.raw.zinc500,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    marginBottom: 10,
    marginTop: 8,
  },
  // Info rows for auftrag
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  infoLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc400,
    minWidth: 100,
  },
  infoValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc200,
    flex: 1,
    textAlign: "right",
  },
  tradeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.raw.amber500 + "18",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  tradeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.amber500,
  },
  summaryText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.zinc300,
    lineHeight: 22,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  amountBig: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 32,
    color: Colors.raw.white,
  },
  posRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  posRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  posName: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.zinc300,
    flex: 1,
    marginRight: 16,
  },
  posAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.white,
  },
  stickyBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.raw.zinc950 + "F5",
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  commentInput: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.white,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  rejectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minWidth: 100,
  },
  rejectText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.rose400,
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    borderRadius: 14,
    paddingVertical: 16,
    flex: 1,
  },
  approveText: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 17,
    color: "#fff",
    letterSpacing: 0.5,
  },
});
