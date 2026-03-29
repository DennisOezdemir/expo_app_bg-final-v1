import { StyleSheet, Text, View, Pressable, Platform, Modal, TextInput, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useRole } from "@/contexts/RoleContext";
import { DebugToggle } from "@/components/DebugConsole";
import { supabase } from "@/lib/supabase";

interface TopBarProps {
  hasNotification?: boolean;
}

function FeedbackModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState<"bug" | "verbesserung" | "sonstiges">("bug");
  const [sending, setSending] = useState(false);
  const { user } = useRole();
  const insets = useSafeAreaInsets();

  const categories: { key: typeof category; label: string; icon: string }[] = [
    { key: "bug", label: "Bug", icon: "bug" },
    { key: "verbesserung", label: "Verbesserung", icon: "bulb" },
    { key: "sonstiges", label: "Sonstiges", icon: "chatbubble" },
  ];

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await supabase.from("user_feedback").insert({
        user_name: user.name,
        user_role: user.role,
        category,
        message: text.trim(),
        status: "open",
      });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setText("");
      onClose();
    } catch (err: any) {
      if (Platform.OS === "web") window.alert("Fehler: " + err.message);
      else Alert.alert("Fehler", err.message);
    }
    setSending(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <Pressable style={fbStyles.overlay} onPress={onClose}>
        <Pressable style={[fbStyles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]} onPress={() => {}}>
          <View style={fbStyles.handle} />
          <Text style={fbStyles.title}>Feedback geben</Text>

          <View style={fbStyles.catRow}>
            {categories.map((c) => (
              <Pressable
                key={c.key}
                onPress={() => setCategory(c.key)}
                style={[fbStyles.catBtn, category === c.key && fbStyles.catBtnActive]}
              >
                <Ionicons name={c.icon as any} size={18} color={category === c.key ? Colors.raw.amber500 : Colors.raw.zinc500} />
                <Text style={[fbStyles.catLabel, category === c.key && { color: Colors.raw.white }]}>{c.label}</Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            style={fbStyles.input}
            placeholder="Was ist passiert? Was soll anders sein?"
            placeholderTextColor={Colors.raw.zinc600}
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
          />

          <Pressable
            onPress={handleSend}
            disabled={sending || !text.trim()}
            style={({ pressed }) => [fbStyles.sendBtn, { opacity: pressed || sending || !text.trim() ? 0.6 : 1 }]}
          >
            <Ionicons name="send" size={18} color="#fff" />
            <Text style={fbStyles.sendText}>{sending ? "Wird gesendet..." : "Absenden"}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const fbStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.raw.zinc900, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.raw.zinc700, alignSelf: "center", marginBottom: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.raw.white, marginBottom: 16 },
  catRow: { gap: 8, marginBottom: 16 },
  catBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.raw.zinc800, borderWidth: 1, borderColor: Colors.raw.zinc700,
  },
  catBtnActive: { borderColor: Colors.raw.amber500, backgroundColor: Colors.raw.amber500 + "14" },
  catLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc500 },
  input: {
    backgroundColor: Colors.raw.zinc800, borderRadius: 14, borderWidth: 1, borderColor: Colors.raw.zinc700,
    padding: 16, fontFamily: "Inter_400Regular", fontSize: 15, color: Colors.raw.white, minHeight: 100, marginBottom: 16,
  },
  sendBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: Colors.raw.amber500, paddingVertical: 16, borderRadius: 14,
  },
  sendText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
});

export function TopBar({ hasNotification = true }: TopBarProps) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const { role } = useRole();
  const showDebug = role === "gf" && __DEV__;
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: topInset + 8 }]}>
      <Text style={styles.logo}>BAUGENIUS</Text>
      <View style={styles.rightRow}>
        {showDebug && <DebugToggle />}
        <Pressable
          style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.7 : 1 }]}
          testID="notification-bell"
        >
          <Ionicons name="notifications-outline" size={24} color={Colors.raw.zinc400} />
          {hasNotification && <View style={styles.notificationDot} />}
        </Pressable>
        <Pressable
          onPress={() => setShowFeedback(true)}
          style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.7 : 1 }]}
          testID="feedback-btn"
        >
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={Colors.raw.amber500} />
        </Pressable>
      </View>
      <FeedbackModal visible={showFeedback} onClose={() => setShowFeedback(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  logo: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 22,
    color: Colors.raw.amber500,
    letterSpacing: -0.5,
  },
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Colors.raw.rose500,
    borderWidth: 2,
    borderColor: Colors.raw.zinc950,
  },
});
