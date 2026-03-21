import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useState, useCallback, useMemo, useEffect } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useInvoiceDetail, useOfferPositions, usePreviousAbschlaege, useTextBlocks } from "@/hooks/queries/useInvoices";
import {
  useUpdateInvoice,
  useUpsertInvoiceItems,
  useDeleteInvoiceItem,
  useDeleteInvoice,
  useDuplicateInvoice,
  useRecalcTotals,
} from "@/hooks/mutations/useInvoiceMutations";
import { SkeletonCard } from "@/components/Skeleton";
import type { InvoiceDetail, InvoiceItem, SalesInvoiceStatus, SalesInvoiceType, TextBlock } from "@/lib/api/invoices";

// ── Helpers ────────────────────────────────────────────────

function formatEuro(amount: number | null | undefined): string {
  const n = Number(amount) || 0;
  return (
    "\u20AC" +
    n
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  );
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "\u2014";
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function daysOverdue(dueDate: string | null): number {
  if (!dueDate) return 0;
  const diff = Date.now() - new Date(dueDate).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: "Entwurf", color: Colors.raw.zinc400, bg: Colors.raw.zinc400 + "18" },
  OPEN: { label: "Offen", color: Colors.raw.amber500, bg: Colors.raw.amber500 + "18" },
  SENT: { label: "Versendet", color: Colors.raw.amber500, bg: Colors.raw.amber500 + "18" },
  APPROVED: { label: "Freigegeben", color: Colors.raw.emerald500, bg: Colors.raw.emerald500 + "18" },
  PAID: { label: "Bezahlt", color: Colors.raw.emerald500, bg: Colors.raw.emerald500 + "18" },
  PAIDOFF: { label: "Bezahlt", color: Colors.raw.emerald500, bg: Colors.raw.emerald500 + "18" },
  OVERDUE: { label: "Überfällig", color: Colors.raw.rose500, bg: Colors.raw.rose500 + "18" },
  CANCELLED: { label: "Storniert", color: Colors.raw.zinc600, bg: Colors.raw.zinc600 + "18" },
  VOIDED: { label: "Ungültig", color: Colors.raw.zinc600, bg: Colors.raw.zinc600 + "18" },
};

const TYPE_LABELS: Record<string, string> = {
  ABSCHLAG: "Abschlagsrechnung",
  TEIL: "Teilrechnung",
  SCHLUSS: "Schlussrechnung",
  GUTSCHRIFT: "Gutschrift",
};

// ── Sub-Components ─────────────────────────────────────────

function StatusBadge({ status, dueDate }: { status: string; dueDate?: string | null }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  const overdue = status === "OVERDUE" || (["OPEN", "SENT"].includes(status) && dueDate && daysOverdue(dueDate) > 0);
  const displayConfig = overdue
    ? { label: `Überfällig \u2014 ${daysOverdue(dueDate!)} Tage`, color: Colors.raw.rose500, bg: Colors.raw.rose500 + "18" }
    : config;

  return (
    <View style={[badgeS.badge, { backgroundColor: displayConfig.bg }]}>
      <View style={[badgeS.dot, { backgroundColor: displayConfig.color }]} />
      <Text style={[badgeS.text, { color: displayConfig.color }]}>{displayConfig.label}</Text>
    </View>
  );
}

const badgeS = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontFamily: "Inter_700Bold", fontSize: 13 },
});

function TypeBadge({ type }: { type: string }) {
  return (
    <View style={typeBadgeS.badge}>
      <Ionicons name="arrow-up-circle-outline" size={14} color={Colors.raw.zinc400} />
      <Text style={typeBadgeS.text}>{TYPE_LABELS[type] || type}</Text>
    </View>
  );
}

const typeBadgeS = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.raw.zinc800, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  text: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.zinc400 },
});

function PositionRow({
  item,
  isEditing,
  onUpdate,
  onDelete,
}: {
  item: InvoiceItem;
  isEditing: boolean;
  onUpdate: (field: string, value: string) => void;
  onDelete: () => void;
}) {
  if (item.is_title) {
    return (
      <View style={posS.titleRow}>
        <Text style={posS.titleText}>{item.description}</Text>
        {isEditing && (
          <Pressable onPress={onDelete} hitSlop={8}>
            <Ionicons name="trash-outline" size={16} color={Colors.raw.rose500} />
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={posS.row}>
      <View style={posS.rowMain}>
        <Text style={posS.posNr}>{item.position_number}</Text>
        {isEditing ? (
          <TextInput
            style={posS.descInput}
            value={item.description}
            onChangeText={(v) => onUpdate("description", v)}
            placeholder="Leistung"
            placeholderTextColor={Colors.raw.zinc600}
          />
        ) : (
          <Text style={posS.desc} numberOfLines={2}>{item.description}</Text>
        )}
      </View>
      <View style={posS.rowNumbers}>
        {isEditing ? (
          <>
            <View style={posS.numField}>
              <TextInput
                style={posS.numInput}
                value={String(item.quantity)}
                onChangeText={(v) => onUpdate("quantity", v)}
                keyboardType="decimal-pad"
              />
              <Text style={posS.numUnit}>{item.unit}</Text>
            </View>
            <Text style={posS.numX}>\u00D7</Text>
            <TextInput
              style={[posS.numInput, { width: 70 }]}
              value={item.unit_price != null ? String(item.unit_price) : ""}
              onChangeText={(v) => onUpdate("unit_price", v)}
              keyboardType="decimal-pad"
              placeholder="EP"
              placeholderTextColor={Colors.raw.zinc600}
            />
          </>
        ) : (
          <>
            <Text style={posS.qty}>{item.quantity} {item.unit}</Text>
            <Text style={posS.unitPrice}>{formatEuro(item.unit_price)}</Text>
          </>
        )}
        <Text style={posS.totalPrice}>{formatEuro(item.total_price)}</Text>
        {isEditing && (
          <Pressable onPress={onDelete} hitSlop={8} style={{ marginLeft: 8 }}>
            <Ionicons name="trash-outline" size={16} color={Colors.raw.rose500} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const posS = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc700,
    marginTop: 8,
  },
  titleText: { fontFamily: "Inter_800ExtraBold", fontSize: 14, color: Colors.raw.amber500 },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.raw.zinc800 },
  rowMain: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  posNr: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.zinc500, width: 28, marginTop: 2 },
  desc: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc300, flex: 1 },
  descInput: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.white, backgroundColor: Colors.raw.zinc800, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  rowNumbers: { flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 36 },
  numField: { flexDirection: "row", alignItems: "center", gap: 4 },
  numInput: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.white, backgroundColor: Colors.raw.zinc800, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, width: 50, textAlign: "right" },
  numUnit: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.raw.zinc500 },
  numX: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc600 },
  qty: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc500 },
  unitPrice: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc400 },
  totalPrice: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.white, marginLeft: "auto" },
});

function TextBlockPicker({
  visible,
  blocks,
  onSelect,
  onClose,
}: {
  visible: boolean;
  blocks: TextBlock[];
  onSelect: (content: string) => void;
  onClose: () => void;
}) {
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={tbpS.overlay}>
        <View style={tbpS.sheet}>
          <View style={tbpS.handle} />
          <Text style={tbpS.title}>Textbaustein wählen</Text>
          <ScrollView style={{ maxHeight: 400 }}>
            {blocks.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => { onSelect(b.content); onClose(); }}
                style={({ pressed }) => [tbpS.item, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Text style={tbpS.itemName}>{b.name}</Text>
                <Text style={tbpS.itemPreview} numberOfLines={2}>{b.content}</Text>
              </Pressable>
            ))}
            {blocks.length === 0 && (
              <Text style={tbpS.empty}>Keine Textbausteine vorhanden</Text>
            )}
          </ScrollView>
          <Pressable onPress={onClose} style={tbpS.closeBtn}>
            <Text style={tbpS.closeBtnText}>Schließen</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const tbpS = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.raw.zinc950, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingTop: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.raw.zinc700, alignSelf: "center", marginBottom: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.raw.white, marginBottom: 16 },
  item: { backgroundColor: Colors.raw.zinc900, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.raw.zinc800 },
  itemName: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.amber500, marginBottom: 4 },
  itemPreview: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc400 },
  empty: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc600, textAlign: "center", paddingVertical: 32 },
  closeBtn: { backgroundColor: Colors.raw.zinc800, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 12 },
  closeBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.raw.zinc300 },
});

function ToastMessage({ text }: { text: string }) {
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(300)} style={toastS.wrap}>
      <Ionicons name="checkmark-circle" size={22} color={Colors.raw.emerald500} />
      <Text style={toastS.text}>{text}</Text>
    </Animated.View>
  );
}

const toastS = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 110,
    left: 20,
    right: 20,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.raw.zinc800,
    borderWidth: 1,
    borderColor: Colors.raw.emerald500 + "40",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  text: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.emerald500, flex: 1 },
});

// ── Main Screen ────────────────────────────────────────────

export default function RechnungDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: invoice, isLoading, error } = useInvoiceDetail(id);
  const { data: textBlocks = [] } = useTextBlocks("ANSCHREIBEN");
  const { data: previousAbschlaege } = usePreviousAbschlaege(
    invoice?.project_id ?? undefined,
    invoice?.id
  );

  const updateMutation = useUpdateInvoice(id ?? "");
  const upsertItemsMutation = useUpsertInvoiceItems(id ?? "");
  const deleteItemMutation = useDeleteInvoiceItem(id ?? "");
  const deleteMutation = useDeleteInvoice();
  const duplicateMutation = useDuplicateInvoice();
  const recalcMutation = useRecalcTotals(id ?? "");

  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [editItems, setEditItems] = useState<InvoiceItem[]>([]);
  const [showTextBlocks, setShowTextBlocks] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const isDraft = invoice?.status === "DRAFT";
  const canEdit = isDraft || invoice?.status === "OPEN";

  // Sync edit state when invoice loads
  useEffect(() => {
    if (invoice) {
      setEditDescription(invoice.description ?? "");
      setEditItems(invoice.items);
    }
  }, [invoice]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSave = useCallback(async () => {
    if (!invoice) return;
    try {
      // Update description
      await updateMutation.mutateAsync({ description: editDescription.trim() || null });

      // Update items
      if (editItems.length > 0) {
        await upsertItemsMutation.mutateAsync(
          editItems.map((item, i) => ({
            id: item.id,
            invoice_id: invoice.id,
            position_number: item.position_number,
            is_title: item.is_title,
            offer_position_id: item.offer_position_id,
            description: item.description,
            quantity: Number(item.quantity) || 0,
            unit: item.unit,
            unit_price: item.is_title ? null : (Number(item.unit_price) || 0),
            total_price: item.is_title ? null : ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)),
            sort_order: i,
          }))
        );
      }

      setIsEditing(false);
      showToast("Gespeichert");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert("Fehler", err.message || "Speichern fehlgeschlagen");
    }
  }, [invoice, editDescription, editItems, updateMutation, upsertItemsMutation, showToast]);

  const handleStatusChange = useCallback(async (newStatus: SalesInvoiceStatus) => {
    try {
      const updates: Record<string, any> = { status: newStatus };
      if (newStatus === "SENT" || newStatus === "OPEN") {
        updates.due_date = new Date(Date.now() + (invoice?.payment_days ?? 14) * 86400000).toISOString().split("T")[0];
      }
      if (newStatus === "PAID" || newStatus === "PAIDOFF") {
        updates.paid_at = new Date().toISOString();
        updates.paid_amount = invoice?.total_gross;
      }
      await updateMutation.mutateAsync(updates);
      showToast(STATUS_CONFIG[newStatus]?.label ?? newStatus);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert("Fehler", err.message);
    }
  }, [invoice, updateMutation, showToast]);

  const handleDelete = useCallback(() => {
    Alert.alert("Rechnung löschen?", "Dieser Entwurf wird unwiderruflich gelöscht.", [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Löschen",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(id!);
            router.back();
          } catch (err: any) {
            Alert.alert("Fehler", err.message);
          }
        },
      },
    ]);
  }, [id, deleteMutation]);

  const handleDuplicate = useCallback(async () => {
    try {
      const result = await duplicateMutation.mutateAsync(id!);
      showToast("Kopie erstellt");
      router.replace(`/rechnung/${result.id}` as any);
    } catch (err: any) {
      Alert.alert("Fehler", err.message);
    }
  }, [id, duplicateMutation, showToast]);

  const handleAddPosition = useCallback(() => {
    const nextNum = editItems.filter((i) => !i.is_title).length + 1;
    setEditItems((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        invoice_id: id!,
        position_number: String(nextNum).padStart(2, "0"),
        is_title: false,
        offer_position_id: null,
        description: "",
        quantity: 1,
        unit: "Stück",
        unit_price: 0,
        total_price: 0,
        sort_order: prev.length,
      },
    ]);
  }, [editItems, id]);

  const handleAddTitle = useCallback(() => {
    setEditItems((prev) => [
      ...prev,
      {
        id: `temp-title-${Date.now()}`,
        invoice_id: id!,
        position_number: "T",
        is_title: true,
        offer_position_id: null,
        description: "Neuer Titel",
        quantity: 0,
        unit: "",
        unit_price: null,
        total_price: null,
        sort_order: prev.length,
      },
    ]);
  }, [id]);

  const handleUpdateItem = useCallback((index: number, field: string, value: string) => {
    setEditItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      if (field === "quantity") {
        item.quantity = parseFloat(value) || 0;
        item.total_price = item.quantity * (Number(item.unit_price) || 0);
      } else if (field === "unit_price") {
        item.unit_price = parseFloat(value) || 0;
        item.total_price = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
      } else if (field === "description") {
        item.description = value;
      }
      updated[index] = item;
      return updated;
    });
  }, []);

  const handleDeleteItem = useCallback(async (index: number) => {
    const item = editItems[index];
    if (item.id && !item.id.startsWith("temp")) {
      try {
        await deleteItemMutation.mutateAsync(item.id);
      } catch (err: any) {
        Alert.alert("Fehler", err.message);
        return;
      }
    }
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  }, [editItems, deleteItemMutation]);

  // ── Computed values ──────────────────────────────────────

  const overdue = useMemo(() => {
    if (!invoice?.due_date) return 0;
    return daysOverdue(invoice.due_date);
  }, [invoice]);

  const netBeforeDeductions = useMemo(() => {
    const items = isEditing ? editItems : (invoice?.items ?? []);
    return items
      .filter((i) => !i.is_title)
      .reduce((s, i) => s + (Number(i.total_price) || 0), 0);
  }, [isEditing, editItems, invoice]);

  const guDeduction = Number(invoice?.gu_deduction_percent) || 0;
  const guDeductionAmount = netBeforeDeductions * (guDeduction / 100);
  const netAfterDeduction = netBeforeDeductions - guDeductionAmount;
  const vatRate = Number(invoice?.vat_rate) || 0;
  const vatAmount = netAfterDeduction * (vatRate / 100);
  const grossTotal = netAfterDeduction + vatAmount;

  // ── Render ───────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={s.container}>
        <View style={[s.header, { paddingTop: topInset + 8 }]}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
          </Pressable>
          <Text style={s.headerLabel}>Rechnung</Text>
        </View>
        <View style={{ paddingTop: topInset + 80, paddingHorizontal: 20, gap: 16 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </View>
    );
  }

  if (error || !invoice) {
    return (
      <View style={s.container}>
        <View style={[s.header, { paddingTop: topInset + 8 }]}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.raw.rose500} />
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.raw.zinc400 }}>
            Rechnung nicht gefunden
          </Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 8 }}>
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.raw.amber500 }}>
              Zurück
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const displayItems = isEditing ? editItems : invoice.items;

  return (
    <View style={s.container}>
      {toast && <ToastMessage text={toast} />}

      {/* Header */}
      <View style={[s.header, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <Text style={s.headerLabel}>Rechnung</Text>
        <View style={s.headerActions}>
          {canEdit && !isEditing && (
            <Pressable
              onPress={() => setIsEditing(true)}
              style={({ pressed }) => [s.headerIconBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Feather name="edit-2" size={18} color={Colors.raw.zinc300} />
            </Pressable>
          )}
          <Pressable
            onPress={() => setShowActions(true)}
            style={({ pressed }) => [s.headerIconBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.raw.zinc300} />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={topInset + 60}
      >
        <ScrollView
          style={s.scrollView}
          contentContainerStyle={[s.scrollContent, { paddingTop: topInset + 64, paddingBottom: bottomInset + 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Invoice Number + Badges */}
          <Text style={s.invoiceNr}>{invoice.invoice_number}</Text>
          <View style={s.badgesRow}>
            <StatusBadge status={invoice.status} dueDate={invoice.due_date} />
            <TypeBadge type={invoice.invoice_type} />
            {invoice.abschlag_number && (
              <View style={[typeBadgeS.badge, { backgroundColor: Colors.raw.amber500 + "15" }]}>
                <Text style={[typeBadgeS.text, { color: Colors.raw.amber500 }]}>
                  #{invoice.abschlag_number}
                </Text>
              </View>
            )}
          </View>

          {/* Client + Project context */}
          {invoice.project && (
            <Pressable
              onPress={() => router.push(`/project/${invoice.project!.id}` as any)}
              style={({ pressed }) => [s.contextRow, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Ionicons name="clipboard" size={16} color={Colors.raw.zinc500} />
              <Text style={s.contextText}>
                {invoice.project.project_number && `${invoice.project.project_number} \u2022 `}
                {invoice.project.name}
                {invoice.project.object_street && ` \u2022 ${invoice.project.object_street}`}
              </Text>
            </Pressable>
          )}

          <View style={s.clientRow}>
            <Ionicons name="business-outline" size={16} color={Colors.raw.zinc500} />
            <Text style={s.clientLabel}>
              {invoice.customer_name || invoice.client?.company_name || "Kein Kunde"}
            </Text>
          </View>

          {/* Summary Card */}
          <View style={s.summenCard}>
            <Text style={s.summenTitle}>Rechnungsbetrag</Text>
            <View style={s.summenAmountRow}>
              <Text style={s.amountNetto}>{formatEuro(isEditing ? netBeforeDeductions : invoice.total_net)}</Text>
              <Text style={s.amountLabel}>netto</Text>
            </View>
            <View style={s.summenAmountRow}>
              <Text style={s.amountBrutto}>{formatEuro(isEditing ? grossTotal : invoice.total_gross)}</Text>
              <Text style={s.amountLabel}>brutto</Text>
            </View>
            <View style={s.summenDivider} />
            <View style={s.summenInfoRow}>
              <Text style={s.summenInfoLabel}>Rechnungsdatum:</Text>
              <Text style={s.summenInfoValue}>{formatDate(invoice.invoice_date)}</Text>
            </View>
            <View style={s.summenInfoRow}>
              <Text style={s.summenInfoLabel}>Fällig:</Text>
              <Text style={s.summenInfoValue}>{formatDate(invoice.due_date)}</Text>
            </View>
            {invoice.service_date_from && (
              <View style={s.summenInfoRow}>
                <Text style={s.summenInfoLabel}>Leistungszeitraum:</Text>
                <Text style={s.summenInfoValue}>
                  {formatDate(invoice.service_date_from)} \u2013 {formatDate(invoice.service_date_to)}
                </Text>
              </View>
            )}
            {invoice.is_reverse_charge && (
              <View style={[s.summenInfoRow, { marginTop: 8 }]}>
                <Text style={[s.summenInfoLabel, { color: Colors.raw.amber500, fontSize: 12 }]}>
                  Reverse Charge \u2014 Steuerschuldnerschaft des Leistungsempfängers
                </Text>
              </View>
            )}
            {overdue > 0 && invoice.status !== "PAID" && invoice.status !== "PAIDOFF" && (
              <View style={s.overdueRow}>
                <Ionicons name="time-outline" size={16} color={Colors.raw.rose500} />
                <Text style={s.overdueText}>{overdue} Tage überfällig</Text>
              </View>
            )}
          </View>

          {/* Beschreibung / Anschreiben */}
          <Text style={s.sectionTitle}>Anschreiben</Text>
          <View style={s.descCard}>
            {isEditing ? (
              <>
                <View style={s.descToolbar}>
                  <Pressable onPress={() => setShowTextBlocks(true)} style={s.descToolBtn}>
                    <Ionicons name="document-text-outline" size={16} color={Colors.raw.zinc400} />
                    <Text style={s.descToolText}>Textbaustein</Text>
                  </Pressable>
                </View>
                <TextInput
                  style={s.descInput}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  placeholder="Anschreiben / Beschreibung..."
                  placeholderTextColor={Colors.raw.zinc600}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </>
            ) : (
              <Text style={s.descText}>
                {invoice.description || "Kein Anschreiben hinterlegt"}
              </Text>
            )}
          </View>

          {/* Positionen */}
          <Text style={s.sectionTitle}>Positionen</Text>
          <View style={s.posCard}>
            {displayItems.length === 0 && (
              <Text style={s.emptyPositions}>Noch keine Positionen</Text>
            )}

            {displayItems.map((item, i) => (
              <PositionRow
                key={item.id}
                item={item}
                isEditing={isEditing}
                onUpdate={(field, value) => handleUpdateItem(i, field, value)}
                onDelete={() => handleDeleteItem(i)}
              />
            ))}

            {isEditing && (
              <View style={s.addRow}>
                <Pressable onPress={handleAddPosition} style={s.addBtn}>
                  <Ionicons name="add" size={16} color={Colors.raw.amber500} />
                  <Text style={s.addBtnText}>Position</Text>
                </Pressable>
                <Pressable onPress={handleAddTitle} style={s.addBtn}>
                  <Ionicons name="add" size={16} color={Colors.raw.zinc400} />
                  <Text style={[s.addBtnText, { color: Colors.raw.zinc400 }]}>Titel</Text>
                </Pressable>
              </View>
            )}

            {/* Totals */}
            <View style={s.totDivider} />
            <View style={s.totRow}>
              <Text style={s.totLabel}>Netto:</Text>
              <Text style={s.totValue}>{formatEuro(isEditing ? netBeforeDeductions : invoice.total_net)}</Text>
            </View>
            {guDeduction > 0 && (
              <View style={s.totRow}>
                <Text style={s.totLabel}>GU-Abzug ({guDeduction}%):</Text>
                <Text style={[s.totValue, { color: Colors.raw.rose500 }]}>-{formatEuro(guDeductionAmount)}</Text>
              </View>
            )}
            <View style={s.totRow}>
              <Text style={s.totLabel}>{invoice.is_reverse_charge ? "MwSt (RC 0%)" : `MwSt ${vatRate}%`}:</Text>
              <Text style={s.totValue}>{formatEuro(isEditing ? vatAmount : invoice.total_vat)}</Text>
            </View>
            <View style={s.totRow}>
              <Text style={s.totTotalLabel}>Brutto:</Text>
              <Text style={s.totTotalValue}>{formatEuro(isEditing ? grossTotal : invoice.total_gross)}</Text>
            </View>
          </View>

          {/* Abschläge (bei Schlussrechnung) */}
          {invoice.invoice_type === "SCHLUSS" && previousAbschlaege && previousAbschlaege.count > 0 && (
            <>
              <Text style={s.sectionTitle}>Abzüge (bereits gestellte Abschläge)</Text>
              <View style={s.abzugCard}>
                {previousAbschlaege.items.map((a, i) => (
                  <View key={i} style={s.abzugRow}>
                    <Text style={s.abzugLabel}>{a.invoice_number}</Text>
                    <Text style={s.abzugAmount}>-{formatEuro(a.total_gross)}</Text>
                  </View>
                ))}
                <View style={s.totDivider} />
                <View style={s.totRow}>
                  <Text style={s.totTotalLabel}>Restbetrag:</Text>
                  <Text style={s.totTotalValue}>
                    {formatEuro(grossTotal - previousAbschlaege.total_billed)}
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Optionen */}
          <Text style={s.sectionTitle}>Details</Text>
          <View style={s.detailCard}>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Zahlungsziel:</Text>
              <Text style={s.detailValue}>{invoice.payment_days} Tage</Text>
            </View>
            {invoice.client_vat_id && (
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>USt-ID Kunde:</Text>
                <Text style={s.detailValue}>{invoice.client_vat_id}</Text>
              </View>
            )}
            {invoice.gu_deduction_percent != null && Number(invoice.gu_deduction_percent) > 0 && (
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Sicherheitseinbehalt:</Text>
                <Text style={s.detailValue}>{invoice.gu_deduction_percent}%</Text>
              </View>
            )}
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Erstellt:</Text>
              <Text style={s.detailValue}>{formatDate(invoice.created_at)}</Text>
            </View>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Geändert:</Text>
              <Text style={s.detailValue}>{formatDate(invoice.updated_at)}</Text>
            </View>
            {invoice.paid_at && (
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Bezahlt am:</Text>
                <Text style={[s.detailValue, { color: Colors.raw.emerald500 }]}>{formatDate(invoice.paid_at)}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Actions */}
      <View style={[s.stickyActions, { paddingBottom: Math.max(bottomInset, 16) }]}>
        {isEditing ? (
          <View style={s.actionsRow}>
            <Pressable
              onPress={() => { setIsEditing(false); setEditItems(invoice.items); setEditDescription(invoice.description ?? ""); }}
              style={({ pressed }) => [s.actionSecondary, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={s.actionSecondaryText}>Abbrechen</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={updateMutation.isPending || upsertItemsMutation.isPending}
              style={({ pressed }) => [s.actionPrimary, { opacity: pressed ? 0.9 : 1 }]}
            >
              <Ionicons name="checkmark" size={18} color="#000" />
              <Text style={s.actionPrimaryText}>
                {updateMutation.isPending ? "Speichert..." : "SPEICHERN"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.actionsRow}>
            {isDraft && (
              <Pressable
                onPress={() => handleStatusChange("OPEN")}
                style={({ pressed }) => [s.actionPrimary, { opacity: pressed ? 0.9 : 1 }]}
              >
                <Feather name="send" size={16} color="#000" />
                <Text style={s.actionPrimaryText}>STELLEN</Text>
              </Pressable>
            )}
            {(invoice.status === "OPEN" || invoice.status === "SENT" || invoice.status === "OVERDUE") && (
              <>
                <Pressable
                  onPress={() => handleStatusChange("PAID")}
                  style={({ pressed }) => [s.actionPrimary, { opacity: pressed ? 0.9 : 1, backgroundColor: Colors.raw.emerald500 }]}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#000" />
                  <Text style={s.actionPrimaryText}>BEZAHLT</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleStatusChange("SENT")}
                  style={({ pressed }) => [s.actionSecondary, { opacity: pressed ? 0.8 : 1 }]}
                >
                  <Feather name="send" size={14} color={Colors.raw.zinc300} />
                  <Text style={s.actionSecondaryText}>Senden</Text>
                </Pressable>
              </>
            )}
            <Pressable
              onPress={() => {/* PDF download placeholder */}}
              style={({ pressed }) => [s.actionSecondary, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Ionicons name="document-text-outline" size={18} color={Colors.raw.zinc300} />
              <Text style={s.actionSecondaryText}>PDF</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Actions Sheet */}
      <Modal visible={showActions} transparent animationType="slide" onRequestClose={() => setShowActions(false)}>
        <Pressable style={actS.overlay} onPress={() => setShowActions(false)}>
          <View style={actS.sheet}>
            <View style={actS.handle} />
            <Pressable onPress={() => { setShowActions(false); handleDuplicate(); }} style={actS.item}>
              <Ionicons name="copy-outline" size={20} color={Colors.raw.zinc300} />
              <Text style={actS.itemText}>Duplizieren</Text>
            </Pressable>
            <Pressable onPress={() => { setShowActions(false); /* PDF */ }} style={actS.item}>
              <Ionicons name="download-outline" size={20} color={Colors.raw.zinc300} />
              <Text style={actS.itemText}>PDF herunterladen</Text>
            </Pressable>
            <Pressable onPress={() => { setShowActions(false); /* Email */ }} style={actS.item}>
              <Ionicons name="mail-outline" size={20} color={Colors.raw.zinc300} />
              <Text style={actS.itemText}>Per E-Mail senden</Text>
            </Pressable>
            {isDraft && (
              <Pressable onPress={() => { setShowActions(false); handleDelete(); }} style={actS.item}>
                <Ionicons name="trash-outline" size={20} color={Colors.raw.rose500} />
                <Text style={[actS.itemText, { color: Colors.raw.rose500 }]}>Löschen</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* TextBlock Picker */}
      <TextBlockPicker
        visible={showTextBlocks}
        blocks={textBlocks}
        onSelect={(content) => setEditDescription((prev) => prev ? `${prev}\n\n${content}` : content)}
        onClose={() => setShowTextBlocks(false)}
      />
    </View>
  );
}

// ── Actions Sheet Styles ───────────────────────────────────

const actS = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.raw.zinc950, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingTop: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.raw.zinc700, alignSelf: "center", marginBottom: 16 },
  item: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.raw.zinc800 },
  itemText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.raw.zinc300 },
});

// ── Main Styles ────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: Colors.raw.zinc950 + "E6",
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerLabel: { fontFamily: "Inter_500Medium", fontSize: 16, color: Colors.raw.zinc400, flex: 1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerIconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  invoiceNr: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 26,
    fontWeight: "800",
    color: Colors.raw.white,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  contextRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  contextText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc400, flex: 1 },
  clientRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 24 },
  clientLabel: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.raw.white },

  // Summary
  summenCard: { backgroundColor: Colors.raw.zinc900, borderRadius: 18, borderWidth: 1, borderColor: Colors.raw.zinc800, padding: 20, marginBottom: 24 },
  summenTitle: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.zinc500, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 12 },
  summenAmountRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 4 },
  amountNetto: { fontFamily: "Inter_800ExtraBold", fontSize: 28, color: Colors.raw.white },
  amountBrutto: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.raw.zinc300 },
  amountLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc500 },
  summenDivider: { height: 1, backgroundColor: Colors.raw.zinc800, marginVertical: 14 },
  summenInfoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  summenInfoLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc500 },
  summenInfoValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc300 },
  overdueRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, backgroundColor: Colors.raw.rose500 + "12", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  overdueText: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.rose500 },

  sectionTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 18, color: Colors.raw.white, marginBottom: 12 },

  // Description / Anschreiben
  descCard: { backgroundColor: Colors.raw.zinc900, borderRadius: 18, borderWidth: 1, borderColor: Colors.raw.zinc800, padding: 18, marginBottom: 24 },
  descToolbar: { flexDirection: "row", gap: 8, marginBottom: 10 },
  descToolBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.raw.zinc800, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  descToolText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.raw.zinc400 },
  descInput: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.raw.white, minHeight: 100, backgroundColor: Colors.raw.zinc800, borderRadius: 10, padding: 12 },
  descText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.raw.zinc300, lineHeight: 22 },

  // Positions Card
  posCard: { backgroundColor: Colors.raw.zinc900, borderRadius: 18, borderWidth: 1, borderColor: Colors.raw.zinc800, padding: 18, marginBottom: 24 },
  emptyPositions: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc600, textAlign: "center", paddingVertical: 24 },
  addRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.raw.zinc800, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  addBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.amber500 },

  // Totals
  totDivider: { height: 1, backgroundColor: Colors.raw.zinc700, marginVertical: 12 },
  totRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  totLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc400 },
  totValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc300 },
  totTotalLabel: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.white },
  totTotalValue: { fontFamily: "Inter_800ExtraBold", fontSize: 17, color: Colors.raw.white },

  // Abzüge
  abzugCard: { backgroundColor: Colors.raw.zinc900, borderRadius: 18, borderWidth: 1, borderColor: Colors.raw.zinc800, padding: 18, marginBottom: 24 },
  abzugRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  abzugLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc300 },
  abzugAmount: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.emerald500 },

  // Details
  detailCard: { backgroundColor: Colors.raw.zinc900, borderRadius: 18, borderWidth: 1, borderColor: Colors.raw.zinc800, padding: 18, marginBottom: 24 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  detailLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc500 },
  detailValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc300 },

  // Sticky Actions
  stickyActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.raw.zinc900,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  actionsRow: { flexDirection: "row", gap: 8 },
  actionSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 12,
    paddingVertical: 14,
    minHeight: 48,
  },
  actionSecondaryText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc300 },
  actionPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 12,
    paddingVertical: 14,
    minHeight: 48,
  },
  actionPrimaryText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#000" },
});
