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
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { useState, useCallback, useRef, useEffect } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

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

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeFilter, setActiveFilter] = useState("alle");
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState(MESSAGES);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const filteredMessages = messages.filter((m) => {
    if (activeFilter === "alle") return true;
    if (activeFilter === "chat")
      return m.type === "human" || m.type === "human_photo";
    if (activeFilter === "fotos") return m.type === "human_photo";
    if (activeFilter === "system")
      return m.type === "system" || m.type === "approval";
    if (activeFilter === "protokolle")
      return m.type === "system" || m.type === "alert";
    return true;
  });

  const dateGroups = getDateGroups(filteredMessages);

  const flatData: { type: "separator"; date: string; key: string }[] | { type: "message"; msg: ChatMessage; key: string }[] = [];
  const listData: any[] = [];
  dateGroups.forEach((group) => {
    listData.push({ type: "separator", date: group.date, key: `sep-${group.date}` });
    group.messages.forEach((m) => {
      listData.push({ type: "message", msg: m, key: m.id });
    });
  });

  const handleSend = () => {
    if (!inputText.trim()) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      type: "human",
      sender: "Du",
      time: new Date().toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      text: inputText.trim(),
      date: "heute",
      read: false,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handlePhotoSend = (room: string, tag: string, note: string) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      type: "human_photo",
      sender: "Du",
      time: new Date().toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      text: note || `Foto aus ${room}`,
      date: "heute",
      photoRoom: room,
      photoTag: tag,
      read: false,
    };
    const msgs = [newMsg];

    if (tag === "Mangel") {
      msgs.push({
        id: (Date.now() + 1).toString(),
        type: "system",
        sender: "BAUGENIUS",
        time: new Date().toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        text: `Mangel automatisch erstellt:\n\"${note || "Neuer Mangel"} (${room})\"\nZugewiesen an: Mehmet`,
        date: "heute",
      });
    }

    if (tag === "Nachtrag") {
      msgs.push({
        id: (Date.now() + 1).toString(),
        type: "system",
        sender: "BAUGENIUS",
        time: new Date().toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        text: `Nachtrag-Entwurf erstellt:\n\"${note || "Neuer Nachtrag"} (${room})\"\nWeitere Details in Freigaben`,
        date: "heute",
      });
    }

    setMessages((prev) => [...prev, ...msgs]);
    setPhotoModalVisible(false);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === "separator") {
      return <DateSeparator date={item.date} />;
    }
    const msg = item.msg as ChatMessage;
    switch (msg.type) {
      case "human":
      case "human_photo":
        return <HumanBubble msg={msg} />;
      case "system":
        return <SystemBubble msg={msg} />;
      case "approval":
        return <ApprovalBubble msg={msg} />;
      case "alert":
        return <AlertBubble msg={msg} />;
      default:
        return null;
    }
  };

  const msgCount = filteredMessages.length;

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
          <Text style={styles.headerTitle}>Nachrichten</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            BL-2026-003 {"\u2022"} Schwentnerring
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterScrollContent}
          >
            {FILTERS.map((f) => (
              <Pressable
                key={f.key}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.selectionAsync();
                  }
                  setActiveFilter(f.key);
                }}
                style={[
                  styles.filterChip,
                  activeFilter === f.key && styles.filterChipActive,
                ]}
              >
                {f.icon && (
                  <Ionicons
                    name={f.icon as any}
                    size={14}
                    color={
                      activeFilter === f.key ? "#000" : Colors.raw.zinc400
                    }
                  />
                )}
                <Text
                  style={[
                    styles.filterChipText,
                    activeFilter === f.key && styles.filterChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <FlatList
            ref={flatListRef}
            data={listData}
            renderItem={renderItem}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{
              paddingBottom: 8,
              paddingTop: 8,
            }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }}
          />

          <View
            style={[
              styles.inputBar,
              {
                paddingBottom:
                  Platform.OS === "web" ? 34 : Math.max(insets.bottom, 8),
              },
            ]}
          >
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
                placeholder="Nachricht schreiben..."
                placeholderTextColor={Colors.raw.zinc600}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                testID="message-input"
              />
            </View>
            <Pressable
              onPress={handleSend}
              style={({ pressed }) => [
                styles.sendButton,
                {
                  opacity: inputText.trim() ? (pressed ? 0.8 : 1) : 0.4,
                },
              ]}
              disabled={!inputText.trim()}
              testID="send-btn"
            >
              <Ionicons name="send" size={18} color="#000" />
            </Pressable>
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
    paddingHorizontal: 16,
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
    backgroundColor: Colors.raw.zinc900,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
  },
  filterChipActive: {
    backgroundColor: Colors.raw.amber500,
    borderColor: Colors.raw.amber500,
  },
  filterChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc400,
  },
  filterChipTextActive: {
    color: "#000",
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
});
