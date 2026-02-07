import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import Svg, { Circle } from "react-native-svg";
import Colors from "@/constants/colors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const RING_SIZE = 150;
const STROKE_WIDTH = 12;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function MarginRing({ percent, color }: { percent: number; color: string }) {
  const strokeDashoffset = CIRCUMFERENCE * (1 - percent / 100);
  return (
    <View style={ringStyles.container}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={ringStyles.svg}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke={Colors.raw.zinc800}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
        />
      </Svg>
      <View style={ringStyles.center}>
        <Text style={[ringStyles.value, { color }]}>{percent}%</Text>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  container: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  svg: {
    position: "absolute",
  },
  center: {
    alignItems: "center",
  },
  value: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 42,
    lineHeight: 46,
  },
});

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[qaStyles.container, animStyle]}
      onPressIn={() => {
        scale.value = withSpring(0.93, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.();
      }}
    >
      <View style={qaStyles.circle}>{icon}</View>
      <Text style={qaStyles.label}>{label}</Text>
    </AnimatedPressable>
  );
}

const qaStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: 64,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.raw.zinc900,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.raw.zinc400,
    textAlign: "center",
  },
});

function SectionCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[cardStyles.card, style]}>{children}</View>;
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginBottom: 16,
  },
});

function SectionHeader({
  title,
  badge,
  rightIcon,
  onRightPress,
}: {
  title: string;
  badge?: string;
  rightIcon?: string;
  onRightPress?: () => void;
}) {
  return (
    <View style={shStyles.row}>
      <View style={shStyles.left}>
        <Text style={shStyles.title}>{title}</Text>
        {badge && (
          <View style={shStyles.badge}>
            <Text style={shStyles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      {rightIcon && (
        <Pressable
          onPress={onRightPress}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Ionicons name={rightIcon as any} size={22} color={Colors.raw.zinc500} />
        </Pressable>
      )}
    </View>
  );
}

const shStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.raw.white,
  },
  badge: {
    backgroundColor: Colors.raw.rose500,
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },
  badgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#fff",
  },
});

type BegehungStatus = "erledigt" | "geplant" | "offen";

interface Begehung {
  name: string;
  status: BegehungStatus;
  date?: string;
}

const BEGEHUNGEN: Begehung[] = [
  { name: "Erstbegehung", status: "erledigt", date: "03.02.2026" },
  { name: "Zwischenbegehung", status: "geplant", date: "10.02." },
  { name: "Abnahme", status: "offen" },
];

const BEGEHUNG_CONFIG: Record<BegehungStatus, { dot: string; label: string }> = {
  erledigt: { dot: Colors.raw.emerald500, label: "erledigt" },
  geplant: { dot: Colors.raw.amber500, label: "geplant" },
  offen: { dot: Colors.raw.zinc600, label: "nicht geplant" },
};

function BegehungRow({ item }: { item: Begehung }) {
  const cfg = BEGEHUNG_CONFIG[item.status];
  const typeMap: Record<string, string> = {
    Erstbegehung: "erstbegehung",
    Zwischenbegehung: "zwischenbegehung",
    Abnahme: "abnahme",
  };
  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({ pathname: "/begehung/[type]", params: { type: typeMap[item.name] || "zwischenbegehung" } });
  };
  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [bgStyles.row, { opacity: pressed ? 0.8 : 1 }]}
    >
      <View style={bgStyles.left}>
        <View style={[bgStyles.dot, { backgroundColor: cfg.dot }]} />
        <View>
          <Text style={bgStyles.name}>{item.name}</Text>
          <Text style={bgStyles.meta}>
            {item.date ? `${item.date} \u2022 ` : ""}
            {cfg.label}
          </Text>
        </View>
      </View>
      {item.status === "erledigt" && (
        <Ionicons name="checkmark-circle" size={20} color={Colors.raw.emerald500} />
      )}
      {item.status === "geplant" && (
        <View style={bgStyles.startBtn}>
          <Text style={bgStyles.startText}>Starten</Text>
        </View>
      )}
      {item.status === "offen" && (
        <Ionicons name="chevron-forward" size={18} color={Colors.raw.zinc600} />
      )}
    </Pressable>
  );
}

const bgStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.white,
    marginBottom: 2,
  },
  meta: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  startBtn: {
    backgroundColor: Colors.raw.amber500 + "18",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  startText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.amber500,
  },
});

interface GanttBar {
  label: string;
  color: string;
  startPercent: number;
  widthPercent: number;
}

const GANTT_BARS: GanttBar[] = [
  { label: "Maler KW6-7", color: Colors.raw.emerald500, startPercent: 0, widthPercent: 53 },
  { label: "Boden KW7", color: Colors.raw.amber500, startPercent: 27, widthPercent: 26 },
  { label: "Sanit\u00E4r KW8", color: Colors.raw.zinc600, startPercent: 53, widthPercent: 27 },
];

const TODAY_PERCENT = 30;

interface Message {
  sender: string;
  text: string;
  time: string;
  icon: string;
  iconColor: string;
}

const MESSAGES: Message[] = [
  { sender: "Mehmet", text: "Fliesen sind da", time: "14:32", icon: "construct", iconColor: Colors.raw.amber500 },
  { sender: "Ayse", text: "[Foto] Wasserfleck K\u00FCche", time: "11:20", icon: "camera", iconColor: "#3b82f6" },
  { sender: "BG", text: "Material bestellt bei MEGA", time: "09:00", icon: "flash", iconColor: Colors.raw.emerald500 },
];

function AlertCard({ text, onPress }: { text: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        alertStyles.card,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={alertStyles.left}>
        <Ionicons name="warning" size={16} color={Colors.raw.rose500} />
        <Text style={alertStyles.text}>{text}</Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={Colors.raw.rose400} />
    </Pressable>
  );
}

const alertStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  text: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.rose400,
    flex: 1,
  },
});

function AccordionSection({
  title,
  count,
  items,
}: {
  title: string;
  count: number;
  items: { name: string; amount?: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={accStyles.container}>
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          setOpen(!open);
        }}
        style={({ pressed }) => [
          accStyles.header,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <View style={accStyles.headerLeft}>
          <Text style={accStyles.headerTitle}>{title}</Text>
          <View style={accStyles.countBadge}>
            <Text style={accStyles.countText}>{count} Pos.</Text>
          </View>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={Colors.raw.zinc500}
        />
      </Pressable>
      {open && (
        <View style={accStyles.body}>
          {items.map((item, i) => (
            <View
              key={i}
              style={[
                accStyles.item,
                i < items.length - 1 && accStyles.itemBorder,
              ]}
            >
              <View style={accStyles.itemDot} />
              <Text style={accStyles.itemText}>{item.name}</Text>
              {item.amount && (
                <Text style={accStyles.itemAmount}>{item.amount}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const accStyles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.white,
  },
  countBadge: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.zinc500,
  },
  body: {
    paddingBottom: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingLeft: 4,
    gap: 12,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800 + "60",
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.raw.amber500,
  },
  itemText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc300,
    flex: 1,
  },
  itemAmount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
});

function DocumentRow({ name }: { name: string }) {
  return (
    <Pressable
      style={({ pressed }) => [
        docStyles.row,
        { opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Ionicons name="document-text" size={20} color={Colors.raw.amber500} />
      <Text style={docStyles.name}>{name}</Text>
      <Feather name="download" size={16} color={Colors.raw.zinc600} />
    </Pressable>
  );
}

const docStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  name: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc300,
    flex: 1,
  },
});

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const marginPercent = 18;
  const marginColor = marginPercent < 20 ? Colors.raw.rose500 : Colors.raw.emerald500;

  return (
    <View style={styles.container}>
      <View style={[styles.backRow, { paddingTop: topInset + 8 }]}>
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
        <Text style={styles.projectCode}>BL-2026-003</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 64,
            paddingBottom: bottomInset + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Text style={styles.heroAddress}>
            Schwentnerring 13c{"\n"}EG Links
          </Text>
          <Text style={styles.heroClient}>
            SAGA GWG  {"\u2022"}  Maler+Boden
          </Text>
        </View>

        <SectionCard>
          <View style={styles.marginCenter}>
            <MarginRing percent={marginPercent} color={marginColor} />
          </View>
          <View style={styles.marginBreakdown}>
            <View style={styles.marginCol}>
              <Text style={styles.marginLabel}>Angebot</Text>
              <Text style={styles.marginValue}>{"\u20AC"}12.400</Text>
            </View>
            <View style={styles.marginDivider} />
            <View style={styles.marginCol}>
              <Text style={styles.marginLabel}>Kosten</Text>
              <Text style={styles.marginValue}>{"\u20AC"}10.168</Text>
            </View>
            <View style={styles.marginDivider} />
            <View style={styles.marginCol}>
              <Text style={styles.marginLabel}>Ergebnis</Text>
              <Text style={[styles.marginValue, { color: marginColor }]}>
                {"\u20AC"}2.232
              </Text>
            </View>
          </View>
        </SectionCard>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.qaRow}
          style={styles.qaScroll}
        >
          <QuickAction
            icon={<Ionicons name="clipboard" size={24} color={Colors.raw.amber500} />}
            label="Auftrag"
          />
          <QuickAction
            icon={<MaterialCommunityIcons name="package-variant" size={24} color={Colors.raw.amber500} />}
            label="Material"
          />
          <QuickAction
            icon={<Ionicons name="people" size={24} color={Colors.raw.amber500} />}
            label="Team"
          />
          <QuickAction
            icon={<Ionicons name="camera" size={24} color={Colors.raw.amber500} />}
            label="Foto"
            onPress={() => router.push({ pathname: "/foto", params: { projectId: id || "1" } })}
          />
          <QuickAction
            icon={<Ionicons name="chatbubbles" size={24} color={Colors.raw.amber500} />}
            label="Chat"
            onPress={() => router.push({ pathname: "/chat/[id]", params: { id: id || "1" } })}
          />
        </ScrollView>

        <SectionCard>
          <SectionHeader title="Begehungen" rightIcon="add-circle-outline" />
          {BEGEHUNGEN.map((b, i) => (
            <BegehungRow key={i} item={b} />
          ))}
        </SectionCard>

        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.push({ pathname: "/planung/[id]", params: { id: id || "1" } });
          }}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <SectionCard>
            <SectionHeader title="Planung" rightIcon="arrow-forward" />
            <View style={styles.ganttContainer}>
              <View style={styles.ganttTodayLine} />
              {GANTT_BARS.map((bar, i) => (
                <View key={i} style={styles.ganttRow}>
                  <Text style={styles.ganttLabel}>{bar.label}</Text>
                  <View style={styles.ganttTrack}>
                    <View
                      style={[
                        styles.ganttBar,
                        {
                          backgroundColor: bar.color,
                          left: `${bar.startPercent}%`,
                          width: `${bar.widthPercent}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
              <View style={styles.ganttFooter}>
                <Text style={styles.ganttDate}>Start: 03.02.</Text>
                <Text style={styles.ganttMid}>Tag 5 von 15</Text>
                <Text style={styles.ganttDate}>Ende: 21.02.</Text>
              </View>
            </View>
          </SectionCard>
        </Pressable>

        <SectionCard>
          <SectionHeader title="Nachrichten" badge="4" />
          {MESSAGES.map((msg, i) => (
            <View
              key={i}
              style={[
                styles.msgRow,
                i < MESSAGES.length - 1 && styles.msgBorder,
              ]}
            >
              <View style={[styles.msgIcon, { backgroundColor: msg.iconColor + "18" }]}>
                <Ionicons name={msg.icon as any} size={16} color={msg.iconColor} />
              </View>
              <View style={styles.msgBody}>
                <Text style={styles.msgSender}>{msg.sender}</Text>
                <Text style={styles.msgText} numberOfLines={1}>
                  {msg.text}
                </Text>
              </View>
              <Text style={styles.msgTime}>{msg.time}</Text>
            </View>
          ))}
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push({ pathname: "/chat/[id]", params: { id: id || "1" } });
            }}
            style={({ pressed }) => [
              styles.allMessagesBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.allMessagesText}>Alle Nachrichten</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.raw.amber500} />
          </Pressable>
        </SectionCard>

        <SectionCard style={{ backgroundColor: Colors.raw.rose500 + "0D" }}>
          <SectionHeader title="Warnungen" />
          <AlertCard text="Material 'Vliesraufaser' fehlt" />
          <AlertCard text="1 Freigabe offen" />
          <AlertCard text="Keine Zeiterfassung seit 2 Tagen" />
        </SectionCard>

        <SectionCard>
          <SectionHeader title="Positionen" badge="47" />
          <AccordionSection
            title="Badezimmer"
            count={3}
            items={[
              { name: "W\u00E4nde spachteln & streichen", amount: "\u20AC860" },
              { name: "Boden verlegen (Vinyl)", amount: "\u20AC1.240" },
              { name: "Decke streichen", amount: "\u20AC420" },
            ]}
          />
          <AccordionSection
            title="K\u00FCche"
            count={5}
            items={[
              { name: "W\u00E4nde tapezieren (Vlies)", amount: "\u20AC980" },
              { name: "Decke streichen", amount: "\u20AC380" },
              { name: "Boden schleifen", amount: "\u20AC560" },
              { name: "Boden versiegeln", amount: "\u20AC440" },
              { name: "Sockelleisten montieren", amount: "\u20AC220" },
            ]}
          />
          <AccordionSection
            title="Wohnzimmer"
            count={8}
            items={[
              { name: "Altbelag entfernen", amount: "\u20AC340" },
              { name: "Untergrund vorbereiten", amount: "\u20AC280" },
              { name: "W\u00E4nde spachteln Q3", amount: "\u20AC720" },
              { name: "W\u00E4nde streichen 2x", amount: "\u20AC640" },
              { name: "Decke streichen", amount: "\u20AC380" },
              { name: "Boden verlegen (Parkett)", amount: "\u20AC1.860" },
              { name: "Sockelleisten montieren", amount: "\u20AC240" },
              { name: "Endreinigung", amount: "\u20AC180" },
            ]}
          />
        </SectionCard>

        <SectionCard>
          <SectionHeader title="Dokumente" />
          <DocumentRow name="Auftrag.pdf" />
          <DocumentRow name="Angebot v1" />
          <DocumentRow name="Protokoll Erstbegehung 03.02." />
        </SectionCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
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
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  projectCode: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc500,
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  heroSection: {
    marginBottom: 24,
  },
  heroAddress: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 28,
    color: Colors.raw.white,
    lineHeight: 34,
    marginBottom: 8,
  },
  heroClient: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.zinc500,
  },
  marginCenter: {
    alignItems: "center",
  },
  marginBreakdown: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  marginCol: {
    flex: 1,
    alignItems: "center",
  },
  marginLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginBottom: 4,
  },
  marginValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.white,
  },
  marginDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.raw.zinc800,
  },
  qaScroll: {
    marginBottom: 16,
    marginHorizontal: -20,
  },
  qaRow: {
    paddingHorizontal: 20,
    gap: 12,
    flexDirection: "row",
  },
  ganttContainer: {
    position: "relative",
  },
  ganttTodayLine: {
    position: "absolute",
    left: `${TODAY_PERCENT + 30}%`,
    top: 0,
    bottom: 30,
    width: 2,
    backgroundColor: Colors.raw.amber500,
    zIndex: 2,
    borderRadius: 1,
    opacity: 0.7,
  },
  ganttRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  ganttLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.zinc400,
    width: 80,
  },
  ganttTrack: {
    flex: 1,
    height: 20,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 6,
    position: "relative",
    overflow: "hidden",
  },
  ganttBar: {
    position: "absolute",
    top: 0,
    height: 20,
    borderRadius: 6,
  },
  ganttFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  ganttDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc600,
  },
  ganttMid: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.amber500,
  },
  msgRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    gap: 12,
  },
  msgBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  msgIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  msgBody: {
    flex: 1,
  },
  msgSender: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.white,
    marginBottom: 2,
  },
  msgText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc400,
  },
  msgTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc600,
  },
  allMessagesBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
    marginTop: 4,
  },
  allMessagesText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.amber500,
  },
});
