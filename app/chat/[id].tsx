import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Platform,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useRef, useCallback, useEffect } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useChatHistory, useSendMessage } from "@/hooks/queries/useChat";
import { useRole } from "@/contexts/RoleContext";
import type { ChatMessageRow } from "@/lib/api/chat";
import {
  requestAudioPermission,
  startRecording,
  uploadAudioFile,
  formatDuration,
  type AudioRecording,
} from "@/lib/audio-capture";
import { supabase } from "@/lib/supabase";

type MsgType = "human" | "human_photo" | "system" | "approval" | "alert";

interface ChatMessage {
  id: string;
  type: MsgType;
  sender: string;
  time: string;
  text: string;
  date: string;
  photoRoom?: string;
  photoTag?: string;
  read?: boolean;
}

const FILTERS = [
  { key: "alle", label: "Alle", icon: null },
  { key: "chat", label: "Chat", icon: "chatbubble" },
  { key: "fotos", label: "Fotos", icon: "camera" },
  { key: "system", label: "System", icon: "hardware-chip" },
  { key: "protokolle", label: "Protokolle", icon: "document-text" },
];

const ROOMS = [
  "K\u00FCche",
  "Bad",
  "Wohnzimmer",
  "Schlafzimmer",
  "Flur",
  "Balkon",
  "Keller",
];
const TAGS = ["Mangel", "Nachtrag", "Frage", "Fortschritt"];

const MESSAGES: ChatMessage[] = [
  {
    id: "1",
    type: "alert",
    sender: "WARNUNG",
    time: "08:15",
    text: "Keine Zeiterfassung seit 2 Tagen\nBetroffene: Mehmet, Ali",
    date: "gestern",
  },
  {
    id: "2",
    type: "system",
    sender: "BAUGENIUS",
    time: "09:00",
    text: "Projekt BL-2026-003 angelegt\nSchwentnerring 13c, 80339 M\u00FCnchen",
    date: "gestern",
  },
  {
    id: "3",
    type: "human",
    sender: "Dennis",
    time: "10:45",
    text: "Team, bitte Erstbegehung f\u00FCr morgen 9 Uhr einplanen. Schl\u00FCssel liegen beim Hausmeister.",
    date: "gestern",
    read: true,
  },
  {
    id: "4",
    type: "approval",
    sender: "FREIGABE",
    time: "11:30",
    text: "Dennis hat Angebot freigegeben\n\u20AC12.400 netto \u2022 47 Positionen",
    date: "gestern",
  },
  {
    id: "5",
    type: "system",
    sender: "BAUGENIUS",
    time: "14:00",
    text: "Material bestellt bei MEGA eG\n12x Vliesraufaser, 12x Vlieskleber\nLieferung: voraussichtlich Mi 12.02.",
    date: "gestern",
  },
  {
    id: "6",
    type: "human",
    sender: "Mehmet",
    time: "08:30",
    text: "Bin auf der Baustelle. Fange mit dem Abkleben an.",
    date: "heute",
    read: true,
  },
  {
    id: "7",
    type: "human_photo",
    sender: "Ayse",
    time: "11:20",
    text: "Wasserfleck an der Decke K\u00FCche.\nMuss vor dem Streichen getrocknet werden.",
    date: "heute",
    photoRoom: "K\u00FCche",
    photoTag: "Mangel",
    read: true,
  },
  {
    id: "8",
    type: "system",
    sender: "BAUGENIUS",
    time: "11:21",
    text: "Mangel automatisch erstellt:\n\"Wasserfleck Decke K\u00FCche\"\nZugewiesen an: Mehmet",
    date: "heute",
  },
  {
    id: "9",
    type: "human",
    sender: "Mehmet",
    time: "12:15",
    text: "Pause bis 13:00. Danach K\u00FCche fertig grundieren.",
    date: "heute",
    read: true,
  },
  {
    id: "10",
    type: "human_photo",
    sender: "Mehmet",
    time: "14:32",
    text: "Fliesen sind angekommen, 12 Kartons. Alles okay.",
    date: "heute",
    photoRoom: "Flur",
    photoTag: "Fortschritt",
    read: true,
  },
  {
    id: "11",
    type: "human",
    sender: "Ali",
    time: "15:10",
    text: "Sanit\u00E4r-Material kommt erst Donnerstag. Lieferverzug bei Grohe.",
    date: "heute",
    read: false,
  },
  {
    id: "12",
    type: "alert",
    sender: "WARNUNG",
    time: "16:00",
    text: "Lieferverzug Sanit\u00E4r: Grohe Armaturen\nNeuer Liefertermin: Do 13.02.",
    date: "heute",
  },
];

function getDateGroups(msgs: ChatMessage[]) {
  const groups: { date: string; messages: ChatMessage[] }[] = [];
  let currentDate = "";
  msgs.forEach((m) => {
    if (m.date !== currentDate) {
      currentDate = m.date;
      groups.push({ date: currentDate, messages: [m] });
    } else {
      groups[groups.length - 1].messages.push(m);
    }
  });
  return groups;
}

function DateSeparator({ date }: { date: string }) {
  const label =
    date === "heute"
      ? "Heute"
      : date === "gestern"
      ? "Gestern"
      : date;
  return (
    <View style={sepStyles.container}>
      <View style={sepStyles.line} />
      <Text style={sepStyles.text}>{label}</Text>
      <View style={sepStyles.line} />
    </View>
  );
}

const sepStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.raw.zinc800,
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.zinc500,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});

function HumanBubble({ msg }: { msg: ChatMessage }) {
  return (
    <View style={bubbleStyles.humanContainer}>
      <View style={bubbleStyles.avatarCircle}>
        <MaterialCommunityIcons
          name="hard-hat"
          size={16}
          color={Colors.raw.amber500}
        />
      </View>
      <View style={bubbleStyles.humanBubble}>
        <View style={bubbleStyles.humanHeader}>
          <Text style={bubbleStyles.senderName}>{msg.sender}</Text>
          <View style={bubbleStyles.timeRow}>
            <Text style={bubbleStyles.time}>{msg.time}</Text>
            {msg.read && (
              <Ionicons
                name="checkmark-done"
                size={14}
                color={Colors.raw.amber500}
              />
            )}
          </View>
        </View>
        {msg.type === "human_photo" && (
          <View style={bubbleStyles.photoContainer}>
            <View style={bubbleStyles.photoPlaceholder}>
              <Ionicons name="image" size={32} color={Colors.raw.zinc500} />
            </View>
            {msg.photoRoom && (
              <View style={bubbleStyles.roomBadge}>
                <Text style={bubbleStyles.roomBadgeText}>{msg.photoRoom}</Text>
              </View>
            )}
            {msg.photoTag && (
              <View
                style={[
                  bubbleStyles.tagBadge,
                  {
                    backgroundColor:
                      msg.photoTag === "Mangel"
                        ? Colors.raw.rose500 + "20"
                        : msg.photoTag === "Nachtrag"
                        ? Colors.raw.amber500 + "20"
                        : Colors.raw.emerald500 + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    bubbleStyles.tagBadgeText,
                    {
                      color:
                        msg.photoTag === "Mangel"
                          ? Colors.raw.rose500
                          : msg.photoTag === "Nachtrag"
                          ? Colors.raw.amber500
                          : Colors.raw.emerald500,
                    },
                  ]}
                >
                  {msg.photoTag}
                </Text>
              </View>
            )}
          </View>
        )}
        <Text style={bubbleStyles.msgText}>{msg.text}</Text>
      </View>
    </View>
  );
}

function SystemBubble({ msg }: { msg: ChatMessage }) {
  return (
    <View style={bubbleStyles.systemContainer}>
      <View style={bubbleStyles.systemBubble}>
        <View style={bubbleStyles.systemAccent} />
        <View style={bubbleStyles.systemContent}>
          <View style={bubbleStyles.systemHeader}>
            <View style={bubbleStyles.systemIconCircle}>
              <Ionicons
                name="hardware-chip"
                size={12}
                color={Colors.raw.amber500}
              />
            </View>
            <Text style={bubbleStyles.systemSender}>{msg.sender}</Text>
            <Text style={bubbleStyles.systemTime}>{msg.time}</Text>
          </View>
          <Text style={bubbleStyles.systemText}>{msg.text}</Text>
        </View>
      </View>
    </View>
  );
}

function ApprovalBubble({ msg }: { msg: ChatMessage }) {
  return (
    <View style={bubbleStyles.systemContainer}>
      <View style={bubbleStyles.approvalBubble}>
        <View style={bubbleStyles.approvalAccent} />
        <View style={bubbleStyles.systemContent}>
          <View style={bubbleStyles.systemHeader}>
            <View style={bubbleStyles.approvalIconCircle}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={Colors.raw.emerald500}
              />
            </View>
            <Text style={bubbleStyles.approvalSender}>{msg.sender}</Text>
            <Text style={bubbleStyles.systemTime}>{msg.time}</Text>
          </View>
          <Text style={bubbleStyles.systemText}>{msg.text}</Text>
        </View>
      </View>
    </View>
  );
}

function AlertBubble({ msg }: { msg: ChatMessage }) {
  return (
    <View style={bubbleStyles.systemContainer}>
      <View style={bubbleStyles.alertBubble}>
        <View style={bubbleStyles.alertAccent} />
        <View style={bubbleStyles.systemContent}>
          <View style={bubbleStyles.systemHeader}>
            <View style={bubbleStyles.alertIconCircle}>
              <Ionicons name="warning" size={13} color={Colors.raw.rose500} />
            </View>
            <Text style={bubbleStyles.alertSender}>{msg.sender}</Text>
            <Text style={bubbleStyles.systemTime}>{msg.time}</Text>
          </View>
          <Text style={bubbleStyles.alertText}>{msg.text}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Agent Bubble (Claude responses from DB) ────────────────────────

function AgentBubble({ msg }: { msg: ChatMessageRow }) {
  const time = new Date(msg.created_at).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const toolNames: Record<string, string> = {
    query_positions: "Positionen",
    check_catalog: "Katalog",
    create_change_order: "Nachtrag",
    prepare_email: "Email",
    get_project_status: "Status",
    get_schedule: "Einsatzplan",
  };
  return (
    <View style={bubbleStyles.systemContainer}>
      <View style={bubbleStyles.systemBubble}>
        <View style={bubbleStyles.systemAccent} />
        <View style={bubbleStyles.systemContent}>
          <View style={bubbleStyles.systemHeader}>
            <View style={bubbleStyles.systemIconCircle}>
              <Ionicons name="hardware-chip" size={12} color={Colors.raw.amber500} />
            </View>
            <Text style={bubbleStyles.systemSender}>BAUGENIUS</Text>
            <Text style={bubbleStyles.systemTime}>{time}</Text>
          </View>
          {msg.tool_calls && msg.tool_calls.length > 0 && (
            <View style={agentStyles.toolRow}>
              {msg.tool_calls.map((tc, i) => (
                <View key={i} style={agentStyles.toolBadge}>
                  <Ionicons name="build" size={10} color={Colors.raw.amber500} />
                  <Text style={agentStyles.toolBadgeText}>
                    {toolNames[tc.name] || tc.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <Text style={bubbleStyles.systemText}>{msg.content}</Text>
        </View>
      </View>
    </View>
  );
}

function UserChatBubble({ msg }: { msg: ChatMessageRow }) {
  const time = new Date(msg.created_at).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <View style={agentStyles.userContainer}>
      <View style={agentStyles.userBubble}>
        <Text style={bubbleStyles.msgText}>{msg.content}</Text>
        <Text style={agentStyles.userTime}>{time}</Text>
      </View>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={bubbleStyles.systemContainer}>
      <View style={bubbleStyles.systemBubble}>
        <View style={bubbleStyles.systemAccent} />
        <View style={bubbleStyles.systemContent}>
          <View style={bubbleStyles.systemHeader}>
            <View style={bubbleStyles.systemIconCircle}>
              <Ionicons name="hardware-chip" size={12} color={Colors.raw.amber500} />
            </View>
            <Text style={bubbleStyles.systemSender}>BAUGENIUS</Text>
          </View>
          <View style={agentStyles.typingRow}>
            <ActivityIndicator size="small" color={Colors.raw.amber500} />
            <Text style={agentStyles.typingText}>Denkt nach...</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const agentStyles = StyleSheet.create({
  toolRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  toolBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.raw.amber500 + "15", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  toolBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.raw.amber500 },
  userContainer: {
    flexDirection: "row", justifyContent: "flex-end",
    paddingHorizontal: 16, paddingVertical: 4,
  },
  userBubble: {
    maxWidth: "80%", backgroundColor: Colors.raw.amber500 + "20",
    borderRadius: 18, borderBottomRightRadius: 6, padding: 14,
    borderWidth: 1, borderColor: Colors.raw.amber500 + "30",
  },
  userTime: {
    fontFamily: "Inter_400Regular", fontSize: 11,
    color: Colors.raw.zinc500, marginTop: 6, textAlign: "right",
  },
  typingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  typingText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc500 },
});

const bubbleStyles = StyleSheet.create({
  humanContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
    maxWidth: "88%",
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.raw.amber500 + "14",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  humanBubble: {
    flex: 1,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    padding: 14,
  },
  humanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  senderName: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.raw.amber500,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  time: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.raw.zinc500,
  },
  msgText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.white,
    lineHeight: 22,
  },
  photoContainer: {
    marginBottom: 10,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
  },
  photoPlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: Colors.raw.zinc700,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  roomBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roomBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.raw.white,
  },
  tagBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
  },
  systemContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  systemBubble: {
    flexDirection: "row",
    backgroundColor: Colors.raw.zinc900 + "80",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    overflow: "hidden",
  },
  systemAccent: {
    width: 4,
    backgroundColor: Colors.raw.amber500,
  },
  systemContent: {
    flex: 1,
    padding: 14,
  },
  systemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  systemIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.raw.amber500 + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  systemSender: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: Colors.raw.amber500,
    flex: 1,
  },
  systemTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.raw.zinc600,
  },
  systemText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc300,
    lineHeight: 20,
  },
  approvalBubble: {
    flexDirection: "row",
    backgroundColor: Colors.raw.emerald500 + "0D",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.emerald500 + "25",
    overflow: "hidden",
  },
  approvalAccent: {
    width: 4,
    backgroundColor: Colors.raw.emerald500,
  },
  approvalIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.raw.emerald500 + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  approvalSender: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: Colors.raw.emerald500,
    flex: 1,
  },
  alertBubble: {
    flexDirection: "row",
    backgroundColor: Colors.raw.rose500 + "0D",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.rose500 + "25",
    overflow: "hidden",
  },
  alertAccent: {
    width: 4,
    backgroundColor: Colors.raw.rose500,
  },
  alertIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.raw.rose500 + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  alertSender: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: Colors.raw.rose500,
    flex: 1,
  },
  alertText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.rose400,
    lineHeight: 20,
  },
});

function PhotoTagModal({
  visible,
  onClose,
  onSend,
}: {
  visible: boolean;
  onClose: () => void;
  onSend: (room: string, tag: string, note: string) => void;
}) {
  const [selectedRoom, setSelectedRoom] = useState("K\u00FCche");
  const [selectedTag, setSelectedTag] = useState("Fortschritt");
  const [note, setNote] = useState("");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>Foto verschicken</Text>

          <View style={modalStyles.previewBox}>
            <Ionicons name="camera" size={40} color={Colors.raw.zinc500} />
            <Text style={modalStyles.previewText}>Foto-Vorschau</Text>
          </View>

          <Text style={modalStyles.label}>Raum</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={modalStyles.chipScroll}
            contentContainerStyle={modalStyles.chipScrollContent}
          >
            {ROOMS.map((r) => (
              <Pressable
                key={r}
                onPress={() => setSelectedRoom(r)}
                style={[
                  modalStyles.chip,
                  selectedRoom === r && modalStyles.chipActive,
                ]}
              >
                <Text
                  style={[
                    modalStyles.chipText,
                    selectedRoom === r && modalStyles.chipTextActive,
                  ]}
                >
                  {r}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={modalStyles.label}>Kategorie</Text>
          <View style={modalStyles.tagRow}>
            {TAGS.map((t) => {
              const tagColor =
                t === "Mangel"
                  ? Colors.raw.rose500
                  : t === "Nachtrag"
                  ? Colors.raw.amber500
                  : t === "Frage"
                  ? Colors.raw.zinc400
                  : Colors.raw.emerald500;
              const isActive = selectedTag === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setSelectedTag(t)}
                  style={[
                    modalStyles.tagChip,
                    {
                      backgroundColor: isActive
                        ? tagColor + "20"
                        : Colors.raw.zinc800,
                      borderColor: isActive ? tagColor : Colors.raw.zinc700,
                    },
                  ]}
                >
                  <Text
                    style={[
                      modalStyles.tagChipText,
                      { color: isActive ? tagColor : Colors.raw.zinc400 },
                    ]}
                  >
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={modalStyles.label}>Notiz (optional)</Text>
          <TextInput
            style={modalStyles.noteInput}
            placeholder="Beschreibung hinzuf\u00FCgen..."
            placeholderTextColor={Colors.raw.zinc600}
            value={note}
            onChangeText={setNote}
            multiline
          />

          <View style={modalStyles.actions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                modalStyles.cancelBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={modalStyles.cancelText}>Abbrechen</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                onSend(selectedRoom, selectedTag, note);
                setNote("");
              }}
              style={({ pressed }) => [
                modalStyles.sendBtn,
                { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
            >
              <Ionicons name="send" size={16} color="#000" />
              <Text style={modalStyles.sendText}>Senden</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.raw.zinc900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.raw.zinc700,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.raw.white,
    marginBottom: 20,
  },
  previewBox: {
    height: 140,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  previewText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc500,
    marginTop: 8,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc400,
    marginBottom: 10,
  },
  chipScroll: {
    marginBottom: 18,
  },
  chipScrollContent: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.raw.zinc800,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
  },
  chipActive: {
    backgroundColor: Colors.raw.amber500,
    borderColor: Colors.raw.amber500,
  },
  chipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc400,
  },
  chipTextActive: {
    color: "#000",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },
  tagChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  tagChipText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  noteInput: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 12,
    padding: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.white,
    minHeight: 60,
    marginBottom: 20,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.zinc400,
  },
  sendBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.raw.amber500,
    borderRadius: 14,
    paddingVertical: 14,
  },
  sendText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#000",
  },
});

// ── Date helpers for DB messages ────────────────────────────────────

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Heute";
  if (d.toDateString() === yesterday.toDateString()) return "Gestern";
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function ChatScreen() {
  const { id: projectId, intent } = useLocalSearchParams<{ id: string; intent?: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const INTENT_PROMPTS: Record<string, string> = {
    material: "Ich brauche folgendes Material: ",
    nachtrag: "Ich möchte einen Nachtrag anlegen für: ",
    angebot: "Erstelle ein Angebot für dieses Projekt: ",
  };

  const [inputText, setInputText] = useState(
    intent && INTENT_PROMPTS[intent] ? INTENT_PROMPTS[intent] : ""
  );
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingRef = useRef<AudioRecording | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const flatListRef = useRef<FlatList>(null);
  const { role } = useRole();

  // Puls-Animation beim Aufnehmen
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const handleVoiceStart = useCallback(async () => {
    const granted = await requestAudioPermission();
    if (!granted) return;

    const recording = await startRecording();
    if (!recording) return;

    recordingRef.current = recording;
    setIsRecording(true);
    setRecordingDuration(0);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    durationIntervalRef.current = setInterval(async () => {
      if (recordingRef.current) {
        const status = await recordingRef.current.getStatus();
        setRecordingDuration(status.durationMs);
      }
    }, 500);
  }, []);

  const handleVoiceStop = useCallback(async () => {
    if (!recordingRef.current) return;

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    setIsRecording(false);
    setIsTranscribing(true);

    try {
      const { uri, durationMs } = await recordingRef.current.stop();
      recordingRef.current = null;

      if (!uri || durationMs < 500) {
        // Zu kurz — ignorieren
        setIsTranscribing(false);
        return;
      }

      const upload = await uploadAudioFile(projectId || "general", uri, durationMs);
      if (!upload) {
        setIsTranscribing(false);
        return;
      }

      // Signed URL für die Edge Function holen
      const { data: signedData, error: signError } = await supabase.storage
        .from("project-files")
        .createSignedUrl(upload.storagePath, 120);

      if (signError || !signedData?.signedUrl) {
        setIsTranscribing(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        setIsTranscribing(false);
        return;
      }

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/transcribe-audio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ audio_url: signedData.signedUrl }),
      });

      if (res.ok) {
        const { transcript } = await res.json();
        if (transcript) {
          setInputText(transcript);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      }
    } catch {
      // Stille Fehlerbehandlung — keine Alert-Flut
    } finally {
      setIsTranscribing(false);
    }
  }, [projectId]);

  // Real data from Supabase + Realtime
  const { data: dbMessages = [], isLoading } = useChatHistory(projectId || "");
  const sendMutation = useSendMessage(projectId || "");

  // Group DB messages by date
  const listData: { type: "separator" | "message"; key: string; date?: string; dbMsg?: ChatMessageRow }[] = [];
  let lastDateLabel = "";
  dbMessages.forEach((m) => {
    const dateLabel = formatDateLabel(m.created_at);
    if (dateLabel !== lastDateLabel) {
      lastDateLabel = dateLabel;
      listData.push({ type: "separator", key: `sep-${m.created_at}`, date: dateLabel });
    }
    listData.push({ type: "message", key: m.id, dbMsg: m });
  });

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || sendMutation.isPending) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setInputText("");
    sendMutation.mutate(text);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
  }, [inputText, sendMutation]);

  const handlePhotoSend = useCallback((room: string, tag: string, note: string) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const text = `[Foto: ${room} — ${tag}] ${note || "Ohne Notiz"}`;
    sendMutation.mutate(text);
    setPhotoModalVisible(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
  }, [sendMutation]);

  const renderItem = useCallback(({ item }: { item: (typeof listData)[0] }) => {
    if (item.type === "separator") {
      return <DateSeparator date={item.date!} />;
    }
    const msg = item.dbMsg!;
    if (msg.role === "user") return <UserChatBubble msg={msg} />;
    if (msg.role === "assistant") return <AgentBubble msg={msg} />;
    return null;
  }, []);

  const roleLabel = role === "bauleiter" ? "Bauleiter" : "Monteur";

  // Projektname laden
  const [projectName, setProjectName] = useState("");
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const { supabase } = require("@/lib/supabase");
        const { data } = await supabase
          .from("projects")
          .select("name, display_name")
          .eq("id", projectId)
          .single();
        if (data) setProjectName(data.display_name || data.name || "");
      } catch {}
    })();
  }, [projectId]);
  const msgCount = dbMessages.length;

  return (
    <View style={styles.container}>
      <View style={[styles.headerBar, { paddingTop: topInset + 8 }]}>
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{projectName || "BauGenius Agent"}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {roleLabel}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.msgCountBadge}>
            <Text style={styles.msgCountText}>{msgCount}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={{ flex: 1, paddingTop: topInset + 80 }}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.raw.amber500} />
              <Text style={styles.loadingText}>Lade Chat...</Text>
            </View>
          ) : dbMessages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="hardware-chip" size={36} color={Colors.raw.amber500} />
              </View>
              <Text style={styles.emptyTitle}>BauGenius Assistent</Text>
              <Text style={styles.emptyText}>
                Hallo! Ich bin dein BauGenius Assistent.{"\n"}
                Frag mich was — zum Beispiel: Was steht heute an?
              </Text>
              <View style={styles.suggestionsCol}>
                {["Heutiger Plan", "Material prüfen", "Was ist im Bad beauftragt?", "Nachtrag melden"].map((s) => (
                  <Pressable key={s} onPress={() => { setInputText(s); }}
                    style={({ pressed }) => [styles.suggestionChip, { opacity: pressed ? 0.7 : 1 }]}>
                    <Text style={styles.suggestionText}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={listData}
              renderItem={renderItem}
              keyExtractor={(item) => item.key}
              contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }}
            />
          )}

          {sendMutation.isPending && <TypingIndicator />}

          <View
            style={[
              styles.inputBar,
              {
                paddingBottom:
                  Platform.OS === "web" ? 34 : Math.max(insets.bottom, 8),
              },
            ]}
          >
            {isRecording ? (
              <>
                <Animated.View
                  style={[styles.recordingPulse, { transform: [{ scale: pulseAnim }] }]}
                >
                  <Ionicons name="mic" size={20} color="#fff" />
                </Animated.View>
                <View style={styles.recordingInfo}>
                  <Text style={styles.recordingDot}>●</Text>
                  <Text style={styles.recordingText}> {formatDuration(recordingDuration)}</Text>
                  <Text style={styles.recordingHint}> — Loslassen zum Senden</Text>
                </View>
                <Pressable
                  onPress={handleVoiceStop}
                  style={({ pressed }) => [styles.inputIcon, { opacity: pressed ? 0.7 : 1 }]}
                  testID="voice-stop-btn"
                >
                  <Ionicons name="stop-circle" size={32} color={Colors.raw.amber500} />
                </Pressable>
              </>
            ) : isTranscribing ? (
              <>
                <ActivityIndicator size="small" color={Colors.raw.amber500} style={{ marginRight: 8 }} />
                <View style={styles.inputField}>
                  <Text style={styles.transcribingText}>Sprache wird erkannt...</Text>
                </View>
              </>
            ) : (
              <>
                <Pressable
                  onPress={() => setPhotoModalVisible(true)}
                  style={({ pressed }) => [
                    styles.inputIcon,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                  testID="camera-btn"
                >
                  <Ionicons name="camera" size={22} color={Colors.raw.amber500} />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.inputIcon,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <Ionicons name="attach" size={22} color={Colors.raw.zinc500} />
                </Pressable>
                <View style={styles.inputField}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Frag BauGenius..."
                    placeholderTextColor={Colors.raw.zinc600}
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                    editable={!sendMutation.isPending}
                    testID="message-input"
                  />
                </View>
                {inputText.trim() ? (
                  <Pressable
                    onPress={handleSend}
                    style={({ pressed }) => [
                      styles.sendButton,
                      { opacity: !sendMutation.isPending ? (pressed ? 0.8 : 1) : 0.4 },
                    ]}
                    disabled={sendMutation.isPending}
                    testID="send-btn"
                  >
                    <Ionicons name="send" size={18} color="#000" />
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={handleVoiceStart}
                    style={({ pressed }) => [
                      styles.inputIcon,
                      { opacity: pressed ? 0.6 : 1 },
                    ]}
                    testID="voice-btn"
                  >
                    <Ionicons name="mic" size={22} color={Colors.raw.amber500} />
                  </Pressable>
                )}
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      <PhotoTagModal
        visible={photoModalVisible}
        onClose={() => setPhotoModalVisible(false)}
        onSend={handlePhotoSend}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  headerBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.raw.zinc950,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
  },
  headerSub: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc400,
    marginTop: 1,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  msgCountBadge: {
    backgroundColor: Colors.raw.amber500 + "20",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  msgCountText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.raw.amber500,
  },
  filterScroll: {
    maxHeight: 48,
    marginBottom: 4,
  },
  filterScrollContent: {
    paddingLeft: 16,
    paddingRight: 32,
    gap: 8,
    alignItems: "center",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.raw.zinc800,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
  },
  filterChipActive: {
    backgroundColor: Colors.raw.amber500,
    borderColor: Colors.raw.amber500,
  },
  filterChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc300,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: Colors.raw.zinc950,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
  },
  inputIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  inputField: {
    flex: 1,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 22,
    paddingHorizontal: 16,
    height: 44,
    justifyContent: "center",
  },
  textInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.white,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.raw.amber500,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 12,
  },
  loadingText: {
    fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc500,
  },
  emptyContainer: {
    flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.raw.amber500 + "15",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.raw.white, marginBottom: 8,
  },
  emptyText: {
    fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.raw.zinc400,
    textAlign: "center", lineHeight: 20, marginBottom: 24,
  },
  suggestionsCol: { gap: 8, width: "100%" },
  suggestionChip: {
    backgroundColor: Colors.raw.zinc800, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.raw.zinc700,
  },
  suggestionText: {
    fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc300,
  },
  recordingPulse: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E53E3E",
    alignItems: "center",
    justifyContent: "center",
  },
  recordingInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  recordingDot: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#E53E3E",
  },
  recordingText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.white,
  },
  recordingHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc400,
  },
  transcribingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.zinc400,
  },
});
