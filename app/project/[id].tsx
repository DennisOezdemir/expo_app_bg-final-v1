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

const RING_SIZE = 140;
const STROKE_WIDTH = 10;
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
        <Text style={ringStyles.label}>Marge</Text>
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
  },
  svg: {
    position: "absolute",
  },
  center: {
    alignItems: "center",
  },
  value: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 36,
    lineHeight: 40,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginTop: 2,
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
    flex: 1,
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
    fontSize: 12,
    color: Colors.raw.zinc400,
  },
});

function AlertCard({
  text,
  onPress,
}: {
  text: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        alertStyles.card,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={alertStyles.left}>
        <Ionicons name="warning" size={18} color={Colors.raw.rose500} />
        <Text style={alertStyles.text}>{text}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.raw.rose400} />
    </Pressable>
  );
}

const alertStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(244, 63, 94, 0.08)",
    borderLeftWidth: 3,
    borderLeftColor: Colors.raw.rose500,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  text: {
    fontFamily: "Inter_600SemiBold",
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
  items: string[];
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
            <Text style={accStyles.countText}>{count}</Text>
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
              <Text style={accStyles.itemText}>{item}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const accStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    marginBottom: 10,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.raw.white,
  },
  countBadge: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: Colors.raw.zinc400,
  },
  body: {
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 18,
    gap: 12,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.raw.amber500,
  },
  itemText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc300,
  },
});

function DocumentRow({
  name,
  onPress,
}: {
  name: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
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
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
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
        <View style={styles.backHeaderRight}>
          <Text style={styles.projectCode}>BL-2026-003</Text>
          <View style={[styles.statusPill, { backgroundColor: Colors.raw.amber500 + "18" }]}>
            <View style={[styles.statusDot, { backgroundColor: Colors.raw.amber500 }]} />
            <Text style={[styles.statusText, { color: Colors.raw.amber500 }]}>Achtung</Text>
          </View>
        </View>
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
          <Text style={styles.heroAddress}>Schwentnerring 13c{"\n"}EG Links</Text>
          <Text style={styles.heroClient}>SAGA GWG  {"\u2022"}  Maler+Boden</Text>
        </View>

        <View style={styles.marginCard}>
          <MarginRing percent={marginPercent} color={marginColor} />
          <View style={styles.marginBreakdown}>
            <View style={styles.marginRow}>
              <Text style={styles.marginLabel}>Angebot</Text>
              <Text style={styles.marginValue}>{"\u20AC"}12.400</Text>
            </View>
            <View style={styles.marginDivider} />
            <View style={styles.marginRow}>
              <Text style={styles.marginLabel}>Kosten</Text>
              <Text style={styles.marginValue}>{"\u20AC"}10.168</Text>
            </View>
            <View style={styles.marginDivider} />
            <View style={styles.marginRow}>
              <Text style={styles.marginLabel}>Ergebnis</Text>
              <Text style={[styles.marginValue, { color: marginColor }]}>{"\u20AC"}2.232</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.quickActions}>
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
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zeitplan</Text>
          <View style={styles.timelineCard}>
            <View style={styles.timelineHeader}>
              <Text style={styles.timelineDay}>Tag 8 von 10</Text>
              <View style={styles.overduePill}>
                <Ionicons name="time" size={14} color={Colors.raw.rose400} />
                <Text style={styles.overdueText}>2 Tage über Plan</Text>
              </View>
            </View>
            <View style={styles.timelineBarBg}>
              <View style={[styles.timelineBarFill, { width: "80%" }]} />
              <View style={[styles.timelineBarOverdue, { width: "20%", left: "80%" }]} />
            </View>
            <View style={styles.timelineDates}>
              <Text style={styles.timelineDate}>Start: 28. Jan 2026</Text>
              <Text style={styles.timelineDate}>Ende: 06. Feb 2026</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warnungen</Text>
          <AlertCard text="Material 'Vliesraufaser' fehlt" />
          <AlertCard text="1 Freigabe offen" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Positionen</Text>
          <AccordionSection
            title="Badezimmer"
            count={3}
            items={[
              "Wände spachteln & streichen",
              "Boden verlegen (Vinyl)",
              "Decke streichen",
            ]}
          />
          <AccordionSection
            title="Küche"
            count={5}
            items={[
              "Wände tapezieren (Vlies)",
              "Decke streichen",
              "Boden schleifen",
              "Boden versiegeln",
              "Sockelleisten montieren",
            ]}
          />
          <AccordionSection
            title="Wohnzimmer"
            count={8}
            items={[
              "Altbelag entfernen",
              "Untergrund vorbereiten",
              "Wände spachteln Q3",
              "Wände streichen 2x",
              "Decke streichen",
              "Boden verlegen (Parkett)",
              "Sockelleisten montieren",
              "Endreinigung",
            ]}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dokumente</Text>
          <DocumentRow name="Auftrag.pdf" />
          <DocumentRow name="Angebot v1.pdf" />
          <DocumentRow name="Aufmass_EG.pdf" />
        </View>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  backHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  projectCode: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc500,
    letterSpacing: 0.3,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  heroSection: {
    marginBottom: 32,
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
  marginCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 24,
    alignItems: "center",
    marginBottom: 32,
  },
  marginBreakdown: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    width: "100%",
  },
  marginRow: {
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: "row",
    gap: 8,
  },
  timelineCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  timelineDay: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
  },
  overduePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(244, 63, 94, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  overdueText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.rose400,
  },
  timelineBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.raw.zinc800,
    marginBottom: 12,
    overflow: "hidden",
    position: "relative",
  },
  timelineBarFill: {
    position: "absolute",
    top: 0,
    left: 0,
    height: 8,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 4,
  },
  timelineBarOverdue: {
    position: "absolute",
    top: 0,
    height: 8,
    backgroundColor: Colors.raw.rose500,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  timelineDates: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timelineDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc600,
  },
});
