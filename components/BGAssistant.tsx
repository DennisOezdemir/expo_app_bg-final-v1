import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useState, useRef, useEffect, useCallback } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
  interpolate,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  actions?: { label: string; icon: string }[];
  timestamp: string;
}

const MOCK_CONVERSATIONS: ChatMessage[] = [
  {
    id: "1",
    role: "user",
    text: "Sind Thermostatkopfe tauschen im Schlafzimmer drin?",
    timestamp: "14:32",
  },
  {
    id: "2",
    role: "bot",
    text: 'Nein, im Schlafzimmer ist nur "Heizkorper streichen" (Pos. 04.01).\n\nThermostatkopfe tauschen ist enthalten in:\n\u2022 Bad \u2014 Pos. 03.04 (\u20AC38,40)\n\u2022 Wohnzimmer \u2014 Pos. 05.02 (\u20AC38,40)',
    actions: [
      { label: "Positionen ansehen", icon: "list" },
      { label: "Als Nachtrag anlegen", icon: "add-circle" },
    ],
    timestamp: "14:32",
  },
  {
    id: "3",
    role: "user",
    text: "Was kostet das als Nachtrag?",
    timestamp: "14:33",
  },
  {
    id: "4",
    role: "bot",
    text: "WABS Position 7.1.20, Thermostatventil mit Kopf tauschen: \u20AC38,40 pro Stuck.\n\nSoll ich einen Nachtrag anlegen?",
    actions: [
      { label: "Nachtrag erstellen", icon: "create" },
    ],
    timestamp: "14:33",
  },
];

const QUICK_ACTIONS = [
  "Was fehlt noch?",
  "Marge?",
  "Nachster Schritt?",
  "Zeitplan?",
];

function SoundWaveBar({ index }: { index: number }) {
  const height = useSharedValue(8);

  useEffect(() => {
    height.value = withDelay(
      index * 80,
      withRepeat(
        withSequence(
          withTiming(24 + Math.random() * 16, { duration: 200 + Math.random() * 200, easing: Easing.inOut(Easing.ease) }),
          withTiming(6 + Math.random() * 6, { duration: 200 + Math.random() * 200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    return () => cancelAnimation(height);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[waveStyles.bar, animStyle]} />;
}

const waveStyles = StyleSheet.create({
  bar: {
    width: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.raw.amber500,
  },
});

function TypingIndicator() {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    dot1.value = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0, { duration: 400 })), -1);
    dot2.value = withDelay(150, withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0, { duration: 400 })), -1));
    dot3.value = withDelay(300, withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0, { duration: 400 })), -1));
    return () => {
      cancelAnimation(dot1);
      cancelAnimation(dot2);
      cancelAnimation(dot3);
    };
  }, []);

  const s1 = useAnimatedStyle(() => ({ opacity: interpolate(dot1.value, [0, 1], [0.3, 1]) }));
  const s2 = useAnimatedStyle(() => ({ opacity: interpolate(dot2.value, [0, 1], [0.3, 1]) }));
  const s3 = useAnimatedStyle(() => ({ opacity: interpolate(dot3.value, [0, 1], [0.3, 1]) }));

  return (
    <View style={typingStyles.container}>
      <View style={typingStyles.avatar}>
        <Text style={typingStyles.avatarText}>BG</Text>
      </View>
      <View style={typingStyles.bubble}>
        <Animated.View style={[typingStyles.dot, s1]} />
        <Animated.View style={[typingStyles.dot, s2]} />
        <Animated.View style={[typingStyles.dot, s3]} />
      </View>
    </View>
  );
}

const typingStyles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.raw.amber500 + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: "Inter_800ExtraBold", fontSize: 10, color: Colors.raw.amber500 },
  bubble: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.raw.zinc400 },
});

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <View style={[bubbleStyles.row, isUser && bubbleStyles.rowUser]}>
      {!isUser && (
        <View style={bubbleStyles.avatar}>
          <Text style={bubbleStyles.avatarText}>BG</Text>
        </View>
      )}
      <View style={{ flex: 1, maxWidth: "85%" }}>
        <View style={[bubbleStyles.bubble, isUser ? bubbleStyles.bubbleUser : bubbleStyles.bubbleBot]}>
          {isUser && (
            <Ionicons name="mic" size={14} color={Colors.raw.amber500} style={{ marginBottom: 4 }} />
          )}
          <Text style={[bubbleStyles.text, isUser && bubbleStyles.textUser]}>{message.text}</Text>
        </View>
        {message.actions && message.actions.length > 0 && (
          <View style={bubbleStyles.actionsRow}>
            {message.actions.map((action) => (
              <Pressable
                key={action.label}
                style={({ pressed }) => [bubbleStyles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name={action.icon as any} size={14} color={Colors.raw.amber500} />
                <Text style={bubbleStyles.actionText}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
        <Text style={[bubbleStyles.time, isUser && { textAlign: "right" }]}>{message.timestamp}</Text>
      </View>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  rowUser: { justifyContent: "flex-end" },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.raw.amber500 + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  avatarText: { fontFamily: "Inter_800ExtraBold", fontSize: 10, color: Colors.raw.amber500 },
  bubble: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12 },
  bubbleUser: {
    backgroundColor: Colors.raw.amber500 + "20",
    borderBottomRightRadius: 4,
    alignSelf: "flex-end",
  },
  bubbleBot: {
    backgroundColor: Colors.raw.zinc800,
    borderBottomLeftRadius: 4,
  },
  text: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.raw.zinc200, lineHeight: 22 },
  textUser: { color: Colors.raw.zinc100 },
  actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8, marginLeft: 4 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.raw.amber500 + "14",
    borderWidth: 1,
    borderColor: Colors.raw.amber500 + "30",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.amber500 },
  time: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.raw.zinc600, marginTop: 4, marginLeft: 4 },
});

export function FAB({ onPress }: { onPress: () => void }) {
  const pulse = useSharedValue(1);
  const fabScale = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    return () => cancelAnimation(pulse);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.15], [0.3, 0]),
  }));

  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  return (
    <AnimatedPressable
      style={[fabStyles.container, fabAnimStyle]}
      onPressIn={() => { fabScale.value = withSpring(0.9, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { fabScale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      testID="fab-assistant"
    >
      <Animated.View style={[fabStyles.pulse, pulseStyle]} />
      <View style={fabStyles.inner}>
        <Ionicons name="mic" size={26} color="#000" />
      </View>
    </AnimatedPressable>
  );
}

const fabStyles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 20,
    bottom: 0,
    width: 56,
    height: 56,
    zIndex: 50,
  },
  pulse: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.raw.amber500,
  },
  inner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.raw.amber500,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.raw.amber500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});

export function AssistantOverlay({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CONVERSATIONS);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const micScale = useSharedValue(1);
  const micAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsThinking(true);

    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: "Kosten bisher \u20AC10.168 bei einem Angebot von \u20AC12.400.\nMarge aktuell 18% \u2014 unter deinem Ziel von 20%.\n\nHaupttreiber: Materialkosten \u20AC800 uber Plan.",
        actions: [{ label: "Details ansehen", icon: "bar-chart" }],
        timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsThinking(false);
    }, 1800);
  }, [inputText]);

  const handleMicPress = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsRecording(true);
    micScale.value = withSpring(1.2, { damping: 10 });

    setTimeout(() => {
      setIsRecording(false);
      micScale.value = withSpring(1, { damping: 15 });
      setIsThinking(true);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        const userMsg: ChatMessage = {
          id: Date.now().toString(),
          role: "user",
          text: "Ist das Material fur die Kuche bestellt?",
          timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
        };
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "bot",
          text: "Wandfliesen und Bodenfliesen sind bestellt bei Keramundo, Lieferung Mittwoch.\n\nFliesenkleber und Fugenmasse fehlen noch \u2014 soll ich eine Bestellung bei MEGA vorbereiten?",
          actions: [
            { label: "Bestellung vorbereiten", icon: "cart" },
            { label: "Material ansehen", icon: "cube" },
          ],
          timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, userMsg, botMsg]);
        setIsThinking(false);
      }, 2000);
    }, 2500);
  }, []);

  const handleQuickAction = useCallback((action: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: action,
      timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    const responses: Record<string, string> = {
      "Was fehlt noch?": "Fur Schwentnerring fehlen noch:\n\u2022 Fugenmasse (5kg) \u2014 MEGA eG\n\u2022 Thermostatkopfe x2 \u2014 Heizung Schmidt\n\u2022 Abschlussprofil Alu \u2014 MEGA eG\n\nSoll ich die Bestellung zusammenstellen?",
      "Marge?": "Aktuelle Marge: 18,2%\nZiel: 20%\n\nProblem: Materialkosten \u20AC800 uber Plan.\nLohn liegt im Rahmen. Subunternehmer \u20AC200 unter Plan.",
      "Nachster Schritt?": "Nachste Schritte fur heute:\n1. Fugen im Bad fertigstellen (Ali)\n2. Zweiter Anstrich Wohnzimmer (Mehmet)\n3. Material fur morgen bestellen\n\nAlles im Zeitplan.",
      "Zeitplan?": "KW 6 Ubersicht:\n\u2022 Mo-Di: Bad Fliesen fertig\n\u2022 Mi-Do: Kuche Maler\n\u2022 Fr: Endkontrolle + Aufraumen\n\nVoraussichtliches Ende: Freitag 14.02.",
    };

    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: responses[action] || "Daran arbeite ich gerade. Einen Moment bitte.",
        timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsThinking(false);
    }, 1500);
  }, []);

  useEffect(() => {
    if (visible) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [visible]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isThinking]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={overlayStyles.backdrop}>
        <Pressable style={[overlayStyles.dismissArea, { height: topInset + 40 }]} onPress={onClose} />

        <KeyboardAvoidingView
          style={overlayStyles.sheet}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <View style={overlayStyles.handle} />

          <View style={overlayStyles.header}>
            <View style={overlayStyles.headerLeft}>
              <View style={overlayStyles.headerLogo}>
                <Text style={overlayStyles.headerLogoText}>BG</Text>
              </View>
              <View>
                <Text style={overlayStyles.headerTitle}>BG Assistent</Text>
                <View style={overlayStyles.projectBadge}>
                  <Ionicons name="clipboard" size={12} color={Colors.raw.amber500} />
                  <Text style={overlayStyles.projectBadgeText}>BL-2026-003 Schwentnerring</Text>
                </View>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [overlayStyles.closeBtn, { opacity: pressed ? 0.6 : 1 }]}
              testID="close-assistant"
            >
              <Ionicons name="close" size={22} color={Colors.raw.zinc400} />
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            style={overlayStyles.chatArea}
            contentContainerStyle={overlayStyles.chatContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            {isThinking && <TypingIndicator />}
          </ScrollView>

          {isRecording && (
            <View style={overlayStyles.recordingBar}>
              <View style={overlayStyles.waveContainer}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <SoundWaveBar key={i} index={i} />
                ))}
              </View>
              <Text style={overlayStyles.recordingText}>Aufnahme...</Text>
            </View>
          )}

          <View style={overlayStyles.quickRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={overlayStyles.quickScroll}>
              {QUICK_ACTIONS.map((action) => (
                <Pressable
                  key={action}
                  style={({ pressed }) => [overlayStyles.quickChip, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => handleQuickAction(action)}
                >
                  <Text style={overlayStyles.quickChipText}>{action}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={[overlayStyles.inputBar, { paddingBottom: Math.max(bottomInset, 12) }]}>
            <AnimatedPressable
              style={[overlayStyles.micBtn, micAnimStyle, isRecording && overlayStyles.micBtnRecording]}
              onPress={handleMicPress}
              testID="mic-button"
            >
              <Ionicons name={isRecording ? "radio" : "mic"} size={24} color={isRecording ? "#000" : Colors.raw.amber500} />
            </AnimatedPressable>
            <View style={overlayStyles.textInputWrap}>
              <TextInput
                style={overlayStyles.textInput}
                placeholder="Frage stellen..."
                placeholderTextColor={Colors.raw.zinc600}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                testID="assistant-input"
              />
            </View>
            <Pressable
              style={({ pressed }) => [overlayStyles.sendBtn, { opacity: inputText.trim() ? (pressed ? 0.7 : 1) : 0.3 }]}
              onPress={handleSend}
              disabled={!inputText.trim()}
              testID="send-button"
            >
              <Ionicons name="send" size={20} color={Colors.raw.amber500} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const overlayStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#00000080",
  },
  dismissArea: {
    width: "100%",
  },
  sheet: {
    flex: 1,
    backgroundColor: Colors.raw.zinc900 + "F2",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.raw.zinc600,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.raw.amber500 + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  headerLogoText: { fontFamily: "Inter_800ExtraBold", fontSize: 14, color: Colors.raw.amber500 },
  headerTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 18, color: Colors.raw.white },
  projectBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  projectBadgeText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.raw.amber500 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.raw.zinc800,
    alignItems: "center",
    justifyContent: "center",
  },

  chatArea: { flex: 1 },
  chatContent: { paddingTop: 20, paddingBottom: 8 },

  recordingBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.raw.amber500 + "10",
    borderTopWidth: 1,
    borderTopColor: Colors.raw.amber500 + "20",
  },
  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 28,
  },
  recordingText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.amber500 },

  quickRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
    paddingVertical: 10,
  },
  quickScroll: { paddingHorizontal: 16, gap: 8 },
  quickChip: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
  },
  quickChipText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc300 },

  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.raw.zinc900,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.raw.amber500 + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  micBtnRecording: {
    backgroundColor: Colors.raw.amber500,
  },
  textInputWrap: {
    flex: 1,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 22,
    paddingHorizontal: 16,
    height: 44,
    justifyContent: "center",
  },
  textInput: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.white,
    height: 44,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
