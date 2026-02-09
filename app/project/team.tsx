import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

type PersonStatus = "vor_ort" | "unterwegs" | "nicht_da";

interface TeamEntry {
  name: string;
  gewerk: string;
  zeit: string;
  raum: string;
  aufgabe: string;
  status: PersonStatus;
}

const FULL_TEAM: TeamEntry[] = [
  {
    name: "Mehmet",
    gewerk: "Fliesen",
    zeit: "07:00\u201316:00",
    raum: "Bad",
    aufgabe: "Wandfliesen verlegen",
    status: "vor_ort",
  },
  {
    name: "Kevin",
    gewerk: "Maler",
    zeit: "07:00\u201316:00",
    raum: "Wohnzimmer",
    aufgabe: "Decke tapezieren",
    status: "vor_ort",
  },
  {
    name: "Marcel",
    gewerk: "Bauleiter",
    zeit: "09:00\u201312:00",
    raum: "",
    aufgabe: "Erstbegehung",
    status: "vor_ort",
  },
];

const TWO_TEAM: TeamEntry[] = [
  {
    name: "Mehmet",
    gewerk: "Fliesen",
    zeit: "07:00\u201316:00",
    raum: "Bad",
    aufgabe: "Wandfliesen verlegen",
    status: "vor_ort",
  },
  {
    name: "Kevin",
    gewerk: "Maler",
    zeit: "07:00\u201316:00",
    raum: "Wohnzimmer",
    aufgabe: "Decke tapezieren",
    status: "unterwegs",
  },
];

const ONE_TEAM: TeamEntry[] = [
  {
    name: "Mehmet",
    gewerk: "Fliesen",
    zeit: "07:00\u201316:00",
    raum: "Bad",
    aufgabe: "Wandfliesen verlegen",
    status: "vor_ort",
  },
];

interface DayData {
  short: string;
  date: string;
  count: number | null;
  team: TeamEntry[];
  label: string;
}

const WEEK: DayData[] = [
  { short: "Mo", date: "03.02.", count: 3, team: FULL_TEAM, label: "Montag 03.02." },
  { short: "Di", date: "04.02.", count: 3, team: TWO_TEAM, label: "Dienstag 04.02." },
  { short: "Mi", date: "05.02.", count: 2, team: TWO_TEAM, label: "Mittwoch 05.02." },
  { short: "Do", date: "06.02.", count: 2, team: ONE_TEAM, label: "Donnerstag 06.02." },
  { short: "Fr", date: "07.02.", count: null, team: ONE_TEAM, label: "Freitag 07.02." },
];

const STATUS_COLOR: Record<PersonStatus, string> = {
  vor_ort: "#22C55E",
  unterwegs: "#EAB308",
  nicht_da: "#71717A",
};

const DAY_LABELS: Record<string, string> = {
  Mo: "Montag",
  Di: "Dienstag",
  Mi: "Mittwoch",
  Do: "Donnerstag",
  Fr: "Freitag",
};

export default function TeamScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [selectedDay, setSelectedDay] = useState(0);

  const day = WEEK[selectedDay];
  const isToday = selectedDay === 0;

  return (
    <View style={s.container}>
      <View style={[s.headerBar, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          testID="team-back"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle} numberOfLines={1}>
            Team {"\u00B7"} BL-2026-003
          </Text>
        </View>
        <View style={s.headerSpacer} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[
          s.scrollContent,
          { paddingTop: topInset + 64, paddingBottom: bottomInset + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.weekCard}>
          <Text style={s.weekLabel}>KW 6 {"\u00B7"} 03.02. {"\u2013"} 07.02.2026</Text>
          <View style={s.weekRow}>
            {WEEK.map((d, idx) => {
              const active = idx === selectedDay;
              return (
                <Pressable
                  key={d.short}
                  style={[s.dayCol, active && s.dayColActive]}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedDay(idx);
                  }}
                  testID={`day-${d.short.toLowerCase()}`}
                >
                  <Text style={[s.dayShort, active && s.dayShortActive]}>
                    {d.short}
                  </Text>
                  <View style={s.dayCountWrap}>
                    {d.count !== null ? (
                      <>
                        <Text style={[s.dayCount, active && s.dayCountActive]}>
                          {d.count}
                        </Text>
                        <Ionicons
                          name="person"
                          size={11}
                          color={active ? "#F59E0B" : Colors.raw.zinc500}
                        />
                      </>
                    ) : (
                      <Text style={[s.dayCount, { color: Colors.raw.zinc600 }]}>
                        {"\u2013\u2013"}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={s.dayTitle}>
          {isToday ? "Heute" : DAY_LABELS[day.short]} {"\u00B7"} {day.label.split(" ")[1]}
        </Text>

        {day.team.map((person, idx) => (
          <View key={`${person.name}-${idx}`} style={s.personCard}>
            <View style={s.personRow1}>
              <View
                style={[
                  s.statusDot,
                  { backgroundColor: STATUS_COLOR[person.status] },
                ]}
              />
              <Text style={s.personName}>{person.name}</Text>
              <Text style={s.personGewerk}>{person.gewerk}</Text>
              <Text style={s.personZeit}>{person.zeit}</Text>
            </View>
            <Text style={s.personTask}>
              {person.raum ? `${person.raum} \u00B7 ` : ""}
              {person.aufgabe}
            </Text>
          </View>
        ))}

        {day.team.length === 0 && (
          <View style={s.emptyWrap}>
            <Ionicons name="people-outline" size={32} color={Colors.raw.zinc600} />
            <Text style={s.emptyText}>Keine Mitarbeiter eingeplant</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [s.addBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => {}}
          testID="add-mitarbeiter-btn"
        >
          <Ionicons name="add" size={18} color="#F59E0B" />
          <Text style={s.addBtnText}>Mitarbeiter zuweisen</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
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
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.raw.white,
  },
  headerSpacer: {
    width: 44,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  weekCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  weekLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc400,
    marginBottom: 16,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCol: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  dayColActive: {
    backgroundColor: "rgba(245,158,11,0.12)",
  },
  dayShort: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc500,
    marginBottom: 8,
  },
  dayShortActive: {
    color: "#F59E0B",
  },
  dayCountWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  dayCount: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.white,
  },
  dayCountActive: {
    color: "#F59E0B",
  },
  dayTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.white,
    marginBottom: 14,
  },
  personCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  personRow1: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  personName: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.raw.white,
    flex: 1,
  },
  personGewerk: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
  },
  personZeit: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
  },
  personTask: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginLeft: 16,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc600,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 14,
  },
  addBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#F59E0B",
  },
});
