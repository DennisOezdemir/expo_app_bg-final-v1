import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface Task {
  id: string;
  label: string;
  room: string;
  done: boolean;
}

const TASKS: Task[] = [
  { id: "1", label: "Wände spachteln", room: "Wohnzimmer", done: false },
  { id: "2", label: "Decke grundieren", room: "Flur", done: false },
  { id: "3", label: "Raufaser kleben", room: "Schlafzimmer", done: false },
  { id: "4", label: "Tiefgrund", room: "Küche", done: true },
];

interface MaterialItem {
  label: string;
  available: boolean;
}

const MATERIALS: MaterialItem[] = [
  { label: "Spachtelmasse", available: true },
  { label: "Tiefgrund", available: true },
  { label: "Vliesraufaser", available: false },
];

export default function MeinJobScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 84 : 90;

  const [tasks, setTasks] = useState(TASKS);

  const toggleTask = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <View style={s.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingTop: topInset + 20, paddingBottom: bottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.dayLabel}>Heute</Text>
        <Text style={s.dayDate}>Montag 10. Feb</Text>

        <View style={s.projectCard}>
          <View style={s.projectTop}>
            <View style={s.locationRow}>
              <Ionicons name="location" size={18} color={Colors.raw.amber500} />
              <Text style={s.locationText}>Schwentnerring 13c EG Links</Text>
            </View>
            <View style={s.projectMeta}>
              <Text style={s.tradeLabel}>Maler</Text>
              <View style={s.dayBadge}>
                <Text style={s.dayBadgeText}>Tag 5</Text>
              </View>
            </View>
          </View>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: "50%" }]} />
          </View>
          <Text style={s.progressLabel}>Tag 5 von 10</Text>
        </View>

        <Text style={s.sectionTitle}>Aufgaben heute</Text>
        <View style={s.card}>
          {tasks.map((task, i) => (
            <Pressable
              key={task.id}
              onPress={() => toggleTask(task.id)}
              style={({ pressed }) => [
                s.taskRow,
                i < tasks.length - 1 && s.taskBorder,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              testID={`task-${task.id}`}
            >
              <View style={[s.checkbox, task.done && s.checkboxDone]}>
                {task.done && <Ionicons name="checkmark" size={16} color="#000" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.taskLabel, task.done && s.taskLabelDone]}>
                  {task.label}
                </Text>
                <Text style={s.taskRoom}>{task.room}</Text>
              </View>
              {task.done && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.raw.emerald500} />
              )}
            </Pressable>
          ))}
        </View>
        <Text style={s.taskProgress}>
          {doneCount} von {tasks.length} erledigt
        </Text>

        <Text style={s.sectionTitle}>Material vor Ort</Text>
        <View style={s.card}>
          {MATERIALS.map((mat, i) => (
            <View
              key={mat.label}
              style={[s.matRow, i < MATERIALS.length - 1 && s.taskBorder]}
            >
              {mat.available ? (
                <Ionicons name="checkmark-circle" size={20} color={Colors.raw.emerald500} />
              ) : (
                <Ionicons name="warning" size={20} color={Colors.raw.amber500} />
              )}
              <Text style={[s.matLabel, !mat.available && { color: Colors.raw.amber500 }]}>
                {mat.label}
              </Text>
              <Text style={[s.matStatus, { color: mat.available ? Colors.raw.emerald500 : Colors.raw.amber500 }]}>
                {mat.available ? "da" : "fehlt!"}
              </Text>
              {!mat.available && (
                <Pressable
                  style={({ pressed }) => [s.meldenBtn, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text style={s.meldenText}>Melden</Text>
                  <Ionicons name="arrow-forward" size={12} color={Colors.raw.amber500} />
                </Pressable>
              )}
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>Zeit heute</Text>
        <View style={s.timeCard}>
          <View style={s.timeTop}>
            <Ionicons name="time-outline" size={22} color={Colors.raw.amber500} />
            <Text style={s.stampTime}>07:15 eingestempelt</Text>
          </View>
          <Text style={s.workedTime}>4:32h gearbeitet</Text>
          <View style={s.timeButtons}>
            <Pressable style={({ pressed }) => [s.pauseBtn, { opacity: pressed ? 0.8 : 1 }]}>
              <Feather name="coffee" size={18} color={Colors.raw.zinc300} />
              <Text style={s.pauseBtnText}>Pause</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [s.endBtn, { opacity: pressed ? 0.9 : 1 }]}>
              <Ionicons name="home" size={18} color="#000" />
              <Text style={s.endBtnText}>Feierabend</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  scroll: { paddingHorizontal: 20 },
  dayLabel: { fontFamily: "Inter_800ExtraBold", fontSize: 30, color: Colors.raw.white, marginBottom: 2 },
  dayDate: { fontFamily: "Inter_500Medium", fontSize: 16, color: Colors.raw.zinc500, marginBottom: 20 },

  projectCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginBottom: 28,
  },
  projectTop: { marginBottom: 16 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  locationText: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.raw.white, flex: 1 },
  projectMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  tradeLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc400 },
  dayBadge: { backgroundColor: Colors.raw.amber500 + "18", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  dayBadgeText: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.amber500 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: Colors.raw.zinc800, marginBottom: 8 },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: Colors.raw.amber500 },
  progressLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc500 },

  sectionTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 18, color: Colors.raw.white, marginBottom: 12 },
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    overflow: "hidden",
    marginBottom: 8,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  taskBorder: { borderBottomWidth: 1, borderBottomColor: Colors.raw.zinc800 },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.raw.zinc600,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: { backgroundColor: Colors.raw.emerald500, borderColor: Colors.raw.emerald500 },
  taskLabel: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.raw.white },
  taskLabelDone: { textDecorationLine: "line-through", color: Colors.raw.zinc500 },
  taskRoom: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc500, marginTop: 2 },
  taskProgress: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc500, marginBottom: 24, marginLeft: 4 },

  matRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  matLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.raw.zinc300, flex: 1 },
  matStatus: { fontFamily: "Inter_700Bold", fontSize: 13 },
  meldenBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: 6 },
  meldenText: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.raw.amber500 },

  timeCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginBottom: 20,
  },
  timeTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  stampTime: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc400 },
  workedTime: { fontFamily: "Inter_800ExtraBold", fontSize: 28, color: Colors.raw.white, marginBottom: 16 },
  timeButtons: { flexDirection: "row", gap: 10 },
  pauseBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 14,
    paddingVertical: 16,
  },
  pauseBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.raw.zinc300 },
  endBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 14,
    paddingVertical: 16,
  },
  endBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#000" },
});
