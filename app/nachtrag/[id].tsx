import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import Colors from "@/constants/colors";
import { ScreenState } from "@/components/ScreenState";
import { useChangeOrderDetail } from "@/hooks/queries/useChangeOrders";
import {
  useSubmitChangeOrder,
  useApproveChangeOrder,
  useRejectChangeOrder,
} from "@/hooks/mutations/useChangeOrderMutations";
import { supabase } from "@/lib/supabase";
import type { ChangeOrderStatus, ChangeOrderReason } from "@/lib/api/change-orders";

function showAlert(title: string, msg?: string) {
  if (Platform.OS === "web") {
    window.alert(msg ? `${title}: ${msg}` : title);
  } else {
    Alert.alert(title, msg);
  }
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  DRAFT: { color: Colors.raw.zinc500, label: "Entwurf", icon: "create-outline" },
  SUBMITTED: { color: Colors.raw.amber500, label: "Eingereicht", icon: "send-outline" },
  PENDING_APPROVAL: { color: Colors.raw.amber500, label: "In Pr\u00FCfung", icon: "hourglass-outline" },
  PENDING_CUSTOMER: { color: Colors.raw.amber500, label: "Beim Kunden", icon: "people-outline" },
  APPROVED: { color: Colors.raw.emerald500, label: "Genehmigt", icon: "checkmark-circle" },
  APPROVED_BY_CUSTOMER: { color: Colors.raw.emerald500, label: "Freigegeben", icon: "checkmark-done" },
  REJECTED: { color: Colors.raw.rose500, label: "Abgelehnt", icon: "close-circle" },
  REJECTED_BY_CUSTOMER: { color: Colors.raw.rose500, label: "Vom Kunden abgelehnt", icon: "close-circle" },
  INVOICED: { color: Colors.raw.emerald500, label: "Abgerechnet", icon: "receipt-outline" },
  CANCELLED: { color: Colors.raw.zinc600, label: "Storniert", icon: "ban-outline" },
};

const REASON_LABELS: Record<ChangeOrderReason, string> = {
  ADDITIONAL_WORK: "Zusatzarbeit",
  MODIFIED_WORK: "Ge\u00E4nderte Leistung",
  UNFORESEEN: "Unvorhergesehen",
  CLIENT_REQUEST: "Kundenwunsch",
  PLANNING_ERROR: "Planungsfehler",
  OTHER: "Sonstiges",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(value: number): string {
  return `\u20AC${value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function NachtragDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const { data: co, isLoading, error, refetch } = useChangeOrderDetail(id);
  const submitMutation = useSubmitChangeOrder();
  const approveMutation = useApproveChangeOrder();
  const rejectMutation = useRejectChangeOrder();

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  if (isLoading) {
    return <ScreenState type="loading" message="Nachtrag wird geladen..." />;
  }

  if (error || !co) {
    return (
      <ScreenState
        type="error"
        message={error?.message || "Nachtrag nicht gefunden"}
        onRetry={refetch}
      />
    );
  }

  const statusCfg = STATUS_CONFIG[co.status] || STATUS_CONFIG.DRAFT;
  const isDraft = co.status === "DRAFT";
  const canApprove =
    co.status === "SUBMITTED" ||
    co.status === "PENDING_APPROVAL" ||
    co.status === "PENDING_CUSTOMER";
  const isActioned =
    co.status === "APPROVED" ||
    co.status === "APPROVED_BY_CUSTOMER" ||
    co.status === "REJECTED" ||
    co.status === "REJECTED_BY_CUSTOMER" ||
    co.status === "INVOICED";

  const handleSubmit = async () => {
    try {
      await submitMutation.mutateAsync(co.id);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert("Eingereicht", "Der Nachtrag wurde eingereicht.");
      refetch();
    } catch (err: any) {
      showAlert("Fehler", err.message);
    }
  };

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({ id: co.id });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert("Genehmigt", "Der Nachtrag wurde genehmigt.");
      refetch();
    } catch (err: any) {
      showAlert("Fehler", err.message);
    }
  };

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync({ id: co.id, reason: rejectReason.trim() || undefined });
      setShowRejectModal(false);
      setRejectReason("");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showAlert("Abgelehnt", "Der Nachtrag wurde abgelehnt.");
      refetch();
    } catch (err: any) {
      showAlert("Fehler", err.message);
    }
  };

  const openEvidence = async (storagePath: string) => {
    const { data } = await supabase.storage
      .from("project-files")
      .createSignedUrl(storagePath, 300);
    if (data?.signedUrl) Linking.openURL(data.signedUrl);
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {co.changeOrderNumber}
          </Text>
        </View>
        <View
          style={[styles.statusBadge, { backgroundColor: statusCfg.color + "20", borderColor: statusCfg.color }]}
        >
          <Ionicons name={statusCfg.icon as any} size={14} color={statusCfg.color} />
          <Text style={[styles.statusText, { color: statusCfg.color }]}>
            {statusCfg.label}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        {/* Title + Meta */}
        <Text style={styles.title}>{co.title}</Text>
        {co.description && (
          <Text style={styles.description}>{co.description}</Text>
        )}

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Grund</Text>
            <Text style={styles.metaValue}>{REASON_LABELS[co.reason] || co.reason}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Erstellt</Text>
            <Text style={styles.metaValue}>{formatDate(co.createdAt)}</Text>
          </View>
          {co.vobReference && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>VOB</Text>
              <Text style={styles.metaValue}>{co.vobReference}</Text>
            </View>
          )}
          {co.projectName && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Projekt</Text>
              <Text style={styles.metaValue} numberOfLines={1}>{co.projectName}</Text>
            </View>
          )}
        </View>

        {/* Betrag */}
        <View style={styles.amountCard}>
          <View>
            <Text style={styles.amountLabel}>Netto</Text>
            <Text style={styles.amountValue}>{formatCurrency(co.amountNet)}</Text>
          </View>
          <View style={styles.amountDivider} />
          <View>
            <Text style={styles.amountLabel}>Brutto</Text>
            <Text style={styles.amountValue}>{formatCurrency(co.amountGross)}</Text>
          </View>
          <View style={styles.amountDivider} />
          <View>
            <Text style={styles.amountLabel}>MwSt</Text>
            <Text style={styles.amountValue}>{co.vatRate}%</Text>
          </View>
        </View>

        {/* Positionen */}
        <Text style={styles.sectionTitle}>
          Positionen ({co.items.length})
        </Text>
        {co.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemPos}>{item.positionNumber}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemDesc}>{item.description}</Text>
                <Text style={styles.itemMeta}>
                  {item.quantity} {item.unit} \u00D7 {formatCurrency(item.unitPrice)}
                </Text>
              </View>
            </View>
            <Text style={styles.itemTotal}>{formatCurrency(item.totalPrice)}</Text>
          </View>
        ))}

        {/* Beweis-Fotos */}
        {co.evidence.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Beweis-Fotos ({co.evidence.length})
            </Text>
            {co.evidence.map((ev) => (
              <Pressable
                key={ev.id}
                onPress={() => openEvidence(ev.storagePath)}
                style={({ pressed }) => [styles.evidenceRow, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Ionicons name="image" size={20} color={Colors.raw.amber500} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.evidenceName}>{ev.fileName}</Text>
                  {ev.description && (
                    <Text style={styles.evidenceDesc}>{ev.description}</Text>
                  )}
                </View>
                <Ionicons name="open-outline" size={16} color={Colors.raw.zinc500} />
              </Pressable>
            ))}
          </>
        )}

        {/* Rejection Reason */}
        {co.rejectionReason && (
          <View style={styles.rejectionCard}>
            <Ionicons name="close-circle" size={18} color={Colors.raw.rose500} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rejectionLabel}>Ablehnungsgrund</Text>
              <Text style={styles.rejectionText}>{co.rejectionReason}</Text>
            </View>
          </View>
        )}

        {/* Approval Info */}
        {co.approvedAt && (
          <View style={styles.approvalCard}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.raw.emerald500} />
            <View style={{ flex: 1 }}>
              <Text style={styles.approvalLabel}>
                Genehmigt am {formatDate(co.approvedAt)}
                {co.approvedBy ? ` von ${co.approvedBy}` : ""}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      {(isDraft || canApprove) && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          {isDraft && (
            <Pressable
              onPress={handleSubmit}
              disabled={submitMutation.isPending}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.submitBtn,
                { opacity: pressed || submitMutation.isPending ? 0.7 : 1 },
              ]}
            >
              {submitMutation.isPending ? (
                <ActivityIndicator size={18} color={Colors.raw.zinc950} />
              ) : (
                <>
                  <Ionicons name="send" size={18} color={Colors.raw.zinc950} />
                  <Text style={styles.submitBtnText}>Einreichen</Text>
                </>
              )}
            </Pressable>
          )}
          {canApprove && (
            <View style={styles.approveRejectRow}>
              <Pressable
                onPress={() => setShowRejectModal(true)}
                disabled={rejectMutation.isPending}
                style={({ pressed }) => [
                  styles.actionBtn,
                  styles.rejectBtn,
                  { flex: 1, opacity: pressed || rejectMutation.isPending ? 0.7 : 1 },
                ]}
              >
                <Ionicons name="close" size={20} color={Colors.raw.rose500} />
                <Text style={styles.rejectBtnText}>Ablehnen</Text>
              </Pressable>
              <Pressable
                onPress={handleApprove}
                disabled={approveMutation.isPending}
                style={({ pressed }) => [
                  styles.actionBtn,
                  styles.approveBtn,
                  { flex: 1, opacity: pressed || approveMutation.isPending ? 0.7 : 1 },
                ]}
              >
                {approveMutation.isPending ? (
                  <ActivityIndicator size={18} color={Colors.raw.zinc950} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color={Colors.raw.zinc950} />
                    <Text style={styles.approveBtnText}>Genehmigen</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowRejectModal(false)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Nachtrag ablehnen</Text>
            <Text style={styles.modalSubtitle}>
              Begr\u00FCndung (optional)
            </Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 80, textAlignVertical: "top" }]}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Warum wird der Nachtrag abgelehnt?"
              placeholderTextColor={Colors.raw.zinc600}
              multiline
            />
            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <Pressable
                onPress={() => setShowRejectModal(false)}
                style={({ pressed }) => [styles.modalCancelBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.modalCancelText}>Abbrechen</Text>
              </Pressable>
              <Pressable
                onPress={handleReject}
                disabled={rejectMutation.isPending}
                style={({ pressed }) => [
                  styles.modalRejectBtn,
                  { opacity: pressed || rejectMutation.isPending ? 0.7 : 1 },
                ]}
              >
                {rejectMutation.isPending ? (
                  <ActivityIndicator size={16} color="#fff" />
                ) : (
                  <Text style={styles.modalRejectText}>Ablehnen</Text>
                )}
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  content: {
    padding: 16,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.raw.white,
    marginBottom: 8,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.zinc400,
    marginBottom: 16,
    lineHeight: 22,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  metaItem: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 10,
    padding: 12,
    minWidth: 100,
    flex: 1,
  },
  metaLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginBottom: 4,
  },
  metaValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc200,
  },
  amountCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginBottom: 24,
  },
  amountLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginBottom: 4,
    textAlign: "center",
  },
  amountValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.raw.white,
    textAlign: "center",
  },
  amountDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.raw.zinc800,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.raw.white,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },
  itemPos: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.raw.amber500,
    minWidth: 36,
  },
  itemDesc: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc200,
    marginBottom: 2,
  },
  itemMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  itemTotal: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.raw.white,
    marginLeft: 12,
  },
  evidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  evidenceName: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc300,
  },
  evidenceDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc600,
    marginTop: 2,
  },
  rejectionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.raw.rose500 + "15",
    borderRadius: 10,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.raw.rose500 + "40",
  },
  rejectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.rose500,
    marginBottom: 4,
  },
  rejectionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc300,
    lineHeight: 20,
  },
  approvalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.raw.emerald500 + "15",
    borderRadius: 10,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.raw.emerald500 + "40",
  },
  approvalLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.emerald500,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.raw.zinc950,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  approveRejectRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 16,
    minHeight: 52,
  },
  submitBtn: {
    backgroundColor: Colors.raw.amber500,
  },
  submitBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.zinc950,
  },
  approveBtn: {
    backgroundColor: Colors.raw.emerald500,
  },
  approveBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.zinc950,
  },
  rejectBtn: {
    backgroundColor: Colors.raw.rose500 + "18",
    borderWidth: 1.5,
    borderColor: Colors.raw.rose500,
  },
  rejectBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.rose500,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalSheet: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc400,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    padding: 12,
    fontSize: 15,
    color: Colors.raw.white,
    fontFamily: "Inter_400Regular",
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.raw.zinc700,
  },
  modalCancelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.zinc400,
  },
  modalRejectBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.raw.rose500,
  },
  modalRejectText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#fff",
  },
});
