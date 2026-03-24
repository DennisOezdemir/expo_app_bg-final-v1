import { useState, useCallback, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import {
  useStagedPositions,
  useStartBatch,
  useApprovePosition,
  useEditPosition,
  useRejectPosition,
  useCommitAll,
  useApproveAll,
} from "@/hooks/queries/useOfferAssistant";
import type { AssistantPosition, PositionStatus } from "@/lib/api/offer-assistant";

// ── Props ──

interface Props {
  visible: boolean;
  onClose: () => void;
  offerId: string;
}

// ── Status Helper ──

function getPositionStatus(pos: AssistantPosition): PositionStatus {
  if (pos.long_text && !pos.staged_long_text) return "approved";
  if (pos.staged_long_text) return "proposed";
  return "pending";
}

const STATUS_ICON: Record<PositionStatus, { name: string; color: string }> = {
  pending: { name: "ellipse-outline", color: Colors.raw.zinc600 },
  generating: { name: "sync", color: Colors.raw.amber500 },
  proposed: { name: "alert-circle", color: Colors.raw.amber500 },
  approved: { name: "checkmark-circle", color: Colors.raw.emerald500 },
  rejected: { name: "close-circle", color: Colors.raw.rose500 },
};

// ── Main Component ──

export default function OfferAssistantModal({ visible, onClose, offerId }: Props) {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<"list" | "review" | "edit">("list");
  const [selectedPos, setSelectedPos] = useState<AssistantPosition | null>(null);
  const [editText, setEditText] = useState("");
  const [hintText, setHintText] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);

  const { data: positions, isLoading, refetch } = useStagedPositions(offerId);
  const startBatch = useStartBatch(offerId);
  const approvePos = useApprovePosition(offerId);
  const editPos = useEditPosition(offerId);
  const rejectPos = useRejectPosition(offerId);
  const commitAll = useCommitAll(offerId);
  const approveAll = useApproveAll(offerId);

  // Reset on open
  useEffect(() => {
    if (visible) {
      setScreen("list");
      setSelectedPos(null);
      setThreadId(null);
      refetch();
    }
  }, [visible]);

  // Stats
  const stats = {
    total: positions?.length || 0,
    proposed: positions?.filter((p) => p.staged_long_text && !p.long_text).length || 0,
    approved: positions?.filter((p) => p.long_text).length || 0,
    pending: positions?.filter((p) => !p.long_text && !p.staged_long_text).length || 0,
  };

  // ── Handlers ──

  const handleStartBatch = useCallback(async () => {
    try {
      const result = await startBatch.mutateAsync();
      if (result.thread_id) setThreadId(result.thread_id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [startBatch, refetch]);

  const handleApprove = useCallback(async (pos: AssistantPosition) => {
    if (!threadId) return;
    try {
      await approvePos.mutateAsync({ threadId, positionId: pos.id });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScreen("list");
      refetch();
    } catch { }
  }, [threadId, approvePos, refetch]);

  const handleReject = useCallback(async (pos: AssistantPosition) => {
    if (!threadId) return;
    try {
      // Reject + regenerate
      await rejectPos.mutateAsync({ threadId, positionId: pos.id });
      await editPos.mutateAsync({ threadId, positionId: pos.id, message: "Bitte neu generieren" });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      refetch();
    } catch { }
  }, [threadId, rejectPos, editPos, refetch]);

  const handleSaveEdit = useCallback(async () => {
    if (!threadId || !selectedPos) return;
    try {
      if (hintText.trim()) {
        // Regeneration mit Hinweis
        await editPos.mutateAsync({ threadId, positionId: selectedPos.id, message: hintText });
      } else {
        // Manueller Edit
        await editPos.mutateAsync({ threadId, positionId: selectedPos.id, finalText: editText });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScreen("list");
      setHintText("");
      refetch();
    } catch { }
  }, [threadId, selectedPos, editText, hintText, editPos, refetch]);

  const handleCommitAll = useCallback(async () => {
    if (!threadId) return;
    try {
      // First approve all, then commit
      await approveAll.mutateAsync({ threadId });
      await commitAll.mutateAsync({ threadId });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch { }
  }, [threadId, approveAll, commitAll, onClose]);

  // ── Render: Position Row ──

  const renderPositionRow = ({ item }: { item: AssistantPosition }) => {
    const status = getPositionStatus(item);
    const icon = STATUS_ICON[status];
    const displayText = item.staged_long_text || item.long_text;

    return (
      <Pressable
        onPress={() => {
          if (item.staged_long_text) {
            setSelectedPos(item);
            setScreen("review");
          }
        }}
        style={({ pressed }) => [s.posRow, { opacity: pressed ? 0.8 : 1 }]}
      >
        <Ionicons name={icon.name as any} size={22} color={icon.color} />
        <View style={s.posInfo}>
          <Text style={s.posTitle} numberOfLines={1}>{item.position_number}. {item.title}</Text>
          {displayText ? (
            <Text style={s.posPreview} numberOfLines={1}>{displayText}</Text>
          ) : (
            <Text style={s.posPending}>Kein Langtext</Text>
          )}
        </View>
        <Text style={s.posMeta}>{item.quantity} {item.unit}</Text>
      </Pressable>
    );
  };

  // ── Screen: List ──

  const renderList = () => (
    <View style={s.screenContainer}>
      {/* Header */}
      <View style={s.listHeader}>
        <View>
          <Text style={s.listTitle}>KI-Langtexte</Text>
          <Text style={s.listSubtitle}>
            {stats.approved} fertig, {stats.proposed} Vorschlag, {stats.pending} offen
          </Text>
        </View>
        <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <Ionicons name="close" size={28} color={Colors.raw.zinc400} />
        </Pressable>
      </View>

      {/* Progress */}
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${stats.total > 0 ? ((stats.approved + stats.proposed) / stats.total) * 100 : 0}%` }]} />
      </View>

      {/* Generate Button */}
      {stats.pending > 0 && (
        <Pressable
          onPress={handleStartBatch}
          disabled={startBatch.isPending}
          style={({ pressed }) => [s.generateBtn, { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
        >
          {startBatch.isPending ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Ionicons name="sparkles" size={20} color="#000" />
          )}
          <Text style={s.generateBtnText}>
            {startBatch.isPending ? "Wird generiert..." : `${stats.pending} Langtexte generieren`}
          </Text>
        </Pressable>
      )}

      {/* Position List */}
      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.raw.amber500} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={positions}
          renderItem={renderPositionRow}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Commit Button */}
      {stats.proposed > 0 && (
        <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={handleCommitAll}
            disabled={commitAll.isPending}
            style={({ pressed }) => [s.commitBtn, { opacity: pressed ? 0.9 : 1 }]}
          >
            {commitAll.isPending ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Ionicons name="checkmark-done" size={20} color="#000" />
            )}
            <Text style={s.commitBtnText}>
              {commitAll.isPending ? "Speichern..." : "Alle freigeben & speichern"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  // ── Screen: Review ──

  const renderReview = () => {
    if (!selectedPos) return null;
    const text = selectedPos.staged_long_text || "";

    return (
      <ScrollView style={s.screenContainer} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        {/* Back */}
        <Pressable onPress={() => setScreen("list")} style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}>
          <Ionicons name="arrow-back" size={22} color={Colors.raw.zinc400} />
          <Text style={s.backText}>Zurück zur Liste</Text>
        </Pressable>

        {/* Position Info */}
        <Text style={s.reviewPosNr}>Position {selectedPos.position_number}</Text>
        <Text style={s.reviewTitle}>{selectedPos.title}</Text>
        <Text style={s.reviewMeta}>{selectedPos.quantity} {selectedPos.unit} | {selectedPos.section_title}</Text>

        {/* Proposed Text */}
        <View style={s.textCard}>
          <Text style={s.textCardLabel}>Vorgeschlagener Langtext</Text>
          <Text style={s.textCardContent}>{text}</Text>
        </View>

        {/* Existing Text */}
        {selectedPos.long_text && (
          <View style={[s.textCard, { borderColor: Colors.raw.zinc700 }]}>
            <Text style={s.textCardLabel}>Aktueller Langtext</Text>
            <Text style={[s.textCardContent, { color: Colors.raw.zinc500 }]}>{selectedPos.long_text}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={s.reviewActions}>
          <Pressable
            onPress={() => handleApprove(selectedPos)}
            disabled={approvePos.isPending}
            style={({ pressed }) => [s.reviewBtn, s.reviewBtnApprove, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="checkmark" size={20} color="#000" />
            <Text style={s.reviewBtnApproveText}>Übernehmen</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setEditText(text);
              setHintText("");
              setScreen("edit");
            }}
            style={({ pressed }) => [s.reviewBtn, s.reviewBtnEdit, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="create" size={20} color={Colors.raw.amber500} />
            <Text style={s.reviewBtnEditText}>Anpassen</Text>
          </Pressable>

          <Pressable
            onPress={() => handleReject(selectedPos)}
            disabled={rejectPos.isPending}
            style={({ pressed }) => [s.reviewBtn, s.reviewBtnReject, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="refresh" size={20} color={Colors.raw.rose500} />
            <Text style={s.reviewBtnRejectText}>Neu</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  };

  // ── Screen: Edit ──

  const renderEdit = () => {
    if (!selectedPos) return null;

    return (
      <KeyboardAvoidingView
        style={s.screenContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={20}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
          {/* Back */}
          <Pressable onPress={() => setScreen("review")} style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}>
            <Ionicons name="arrow-back" size={22} color={Colors.raw.zinc400} />
            <Text style={s.backText}>Zurück</Text>
          </Pressable>

          <Text style={s.reviewPosNr}>Position {selectedPos.position_number}</Text>
          <Text style={s.reviewTitle}>{selectedPos.title}</Text>

          {/* Text Editor */}
          <Text style={s.editLabel}>Langtext bearbeiten</Text>
          <TextInput
            style={s.editInput}
            value={editText}
            onChangeText={setEditText}
            multiline
            textAlignVertical="top"
            placeholderTextColor={Colors.raw.zinc600}
          />

          {/* Hint */}
          <Text style={s.editLabel}>Hinweis an KI (optional)</Text>
          <TextInput
            style={[s.editInput, { height: 60 }]}
            value={hintText}
            onChangeText={setHintText}
            placeholder='z.B. "kürzer" oder "mehr Details zum Nutzen"'
            placeholderTextColor={Colors.raw.zinc600}
            multiline
          />

          <Pressable
            onPress={handleSaveEdit}
            disabled={editPos.isPending}
            style={({ pressed }) => [s.generateBtn, { marginTop: 20, opacity: pressed ? 0.9 : 1 }]}
          >
            {editPos.isPending ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Ionicons name="checkmark-circle" size={20} color="#000" />
            )}
            <Text style={s.generateBtnText}>
              {hintText.trim() ? "Neu generieren mit Hinweis" : "Speichern & freigeben"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  // ── Main Render ──

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={s.overlay}>
        <View style={[s.sheet, { paddingTop: insets.top + 12 }]}>
          <View style={s.handle} />
          {screen === "list" && renderList()}
          {screen === "review" && renderReview()}
          {screen === "edit" && renderEdit()}
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ──

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.raw.zinc700,
    alignSelf: "center",
    marginBottom: 12,
  },
  screenContainer: { flex: 1, paddingHorizontal: 20 },

  // List
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  listTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 24, color: Colors.raw.white },
  listSubtitle: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc400, marginTop: 4 },
  progressBar: { height: 4, backgroundColor: Colors.raw.zinc800, borderRadius: 2, marginBottom: 16 },
  progressFill: { height: 4, backgroundColor: Colors.raw.amber500, borderRadius: 2 },

  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.raw.amber500,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  generateBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#000" },

  // Position Row
  posRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  posInfo: { flex: 1 },
  posTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.white },
  posPreview: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginTop: 2 },
  posPending: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc600, fontStyle: "italic", marginTop: 2 },
  posMeta: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.raw.zinc500 },

  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: Colors.raw.zinc950 + "F2",
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
  },
  commitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.raw.emerald500,
    paddingVertical: 16,
    borderRadius: 14,
  },
  commitBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#000" },

  // Review
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16, paddingVertical: 4 },
  backText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc400 },
  reviewPosNr: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.amber500, marginBottom: 4 },
  reviewTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.raw.white, marginBottom: 4 },
  reviewMeta: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc500, marginBottom: 20 },

  textCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 18,
    marginBottom: 16,
  },
  textCardLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.zinc500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  textCardContent: { fontFamily: "Inter_400Regular", fontSize: 15, color: Colors.raw.zinc200, lineHeight: 22 },

  reviewActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  reviewBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    minHeight: 52,
  },
  reviewBtnApprove: { backgroundColor: Colors.raw.emerald500 },
  reviewBtnApproveText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#000" },
  reviewBtnEdit: { backgroundColor: Colors.raw.amber500 + "18", borderWidth: 1, borderColor: Colors.raw.amber500 },
  reviewBtnEditText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.amber500 },
  reviewBtnReject: { backgroundColor: Colors.raw.rose500 + "18", borderWidth: 1, borderColor: Colors.raw.rose500 },
  reviewBtnRejectText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.rose500 },

  // Edit
  editLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc400, marginBottom: 8, marginTop: 16 },
  editInput: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.white,
    lineHeight: 22,
    minHeight: 120,
    textAlignVertical: "top",
  },
});
