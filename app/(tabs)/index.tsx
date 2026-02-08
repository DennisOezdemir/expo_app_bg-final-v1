import { StyleSheet, Text, View, ScrollView, Platform, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { TopBar } from "@/components/TopBar";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TileProps {
  icon: React.ReactNode;
  label: string;
  rightContent: React.ReactNode;
  onPress?: () => void;
}

function Tile({ icon, label, rightContent, onPress }: TileProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.tile, animStyle]}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={onPress}
    >
      <View style={styles.tileTop}>
        <View style={styles.tileIconWrap}>{icon}</View>
        <View>{rightContent}</View>
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
    </AnimatedPressable>
  );
}

function TileCounter({ value, color }: { value: string; color?: string }) {
  return (
    <Text style={[styles.tileCounter, color ? { color } : undefined]}>{value}</Text>
  );
}

function TileBadge({ count }: { count: string }) {
  return (
    <View style={styles.tileBadge}>
      <Text style={styles.tileBadgeText}>{count}</Text>
    </View>
  );
}

function TileSubtext({ text, color }: { text: string; color?: string }) {
  return (
    <Text style={[styles.tileSubtext, color ? { color } : undefined]}>{text}</Text>
  );
}

function ActivityRow({
  dotColor,
  text,
  time,
}: {
  dotColor: string;
  text: string;
  time: string;
}) {
  return (
    <View style={styles.activityRow}>
      <View style={[styles.activityDot, { backgroundColor: dotColor }]} />
      <Text style={styles.activityText} numberOfLines={1}>{text}</Text>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
  );
}

export default function StartScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 84 : 90;

  return (
    <View style={styles.container}>
      <TopBar hasNotification />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 64,
            paddingBottom: bottomInset + 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>Moin Dennis</Text>
          <Text style={styles.subtitle}>3 Dinge brauchen dich</Text>
        </View>

        <Pressable style={({ pressed }) => [styles.alertBanner, { opacity: pressed ? 0.85 : 1 }]}>
          <View style={styles.alertLeft}>
            <Ionicons name="warning" size={18} color={Colors.raw.rose500} />
            <Text style={styles.alertText}>2 Projekte über Budget</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.raw.rose500} />
        </Pressable>

        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            router.push("/foto");
          }}
          style={({ pressed }) => [
            styles.schnellfotoBtn,
            { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <View style={styles.schnellfotoIcon}>
            <Ionicons name="camera" size={22} color="#000" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.schnellfotoLabel}>Schnellfoto</Text>
            <Text style={styles.schnellfotoSub}>Foto aufnehmen & zuordnen</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.raw.zinc500} />
        </Pressable>

        <View style={styles.tilesGrid}>
          <View style={styles.tilesRow}>
            <Tile
              icon={<Ionicons name="clipboard" size={28} color={Colors.raw.amber500} />}
              label="Projekte"
              rightContent={<TileSubtext text="12 aktiv" color={Colors.raw.zinc400} />}
              onPress={() => router.navigate("/(tabs)/projekte")}
            />
            <Tile
              icon={<Ionicons name="checkmark-circle" size={28} color={Colors.raw.emerald500} />}
              label="Freigaben"
              rightContent={<TileBadge count="3" />}
              onPress={() => router.navigate("/(tabs)/freigaben")}
            />
          </View>
          <View style={styles.tilesRow}>
            <Tile
              icon={<MaterialCommunityIcons name="package-variant" size={28} color={Colors.raw.amber400} />}
              label="Material"
              rightContent={<TileSubtext text="5 offen" color={Colors.raw.zinc400} />}
              onPress={() => router.navigate("/(tabs)/material")}
            />
            <Tile
              icon={<Ionicons name="calendar" size={28} color="#3b82f6" />}
              label="Planung"
              rightContent={<TileSubtext text="KW 6" color={Colors.raw.zinc400} />}
              onPress={() => router.push("/planung")}
            />
          </View>
          <View style={styles.tilesRow}>
            <Tile
              icon={<Ionicons name="document-text" size={28} color={Colors.raw.amber500} />}
              label="Angebote"
              rightContent={<TileSubtext text="4 offen" color={Colors.raw.zinc400} />}
              onPress={() => router.push("/angebote")}
            />
            <Tile
              icon={<MaterialCommunityIcons name="finance" size={28} color={Colors.raw.emerald500} />}
              label="Finanzen"
              rightContent={<TileCounter value="24%" color={Colors.raw.emerald500} />}
              onPress={() => router.push("/finanzen")}
            />
          </View>
        </View>

        <View style={styles.activitySection}>
          <Text style={styles.activityTitle}>Letzte Aktivität</Text>
          <View style={styles.activityList}>
            <ActivityRow
              dotColor={Colors.raw.emerald500}
              text="BL-2026-003: Material bestellt"
              time="vor 2h"
            />
            <ActivityRow
              dotColor={Colors.raw.amber500}
              text="BL-2026-007: Angebot erstellt"
              time="vor 5h"
            />
            <ActivityRow
              dotColor={Colors.raw.rose500}
              text="BL-2026-012: Frist überschritten"
              time="vor 8h"
            />
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  greetingSection: {
    marginBottom: 24,
  },
  greeting: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 30,
    color: Colors.raw.white,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.raw.zinc500,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(244, 63, 94, 0.08)",
    borderLeftWidth: 3,
    borderLeftColor: Colors.raw.rose500,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  schnellfotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  schnellfotoIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.raw.amber500,
    alignItems: "center",
    justifyContent: "center",
  },
  schnellfotoLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.white,
    marginBottom: 2,
  },
  schnellfotoSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  alertLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  alertText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.rose400,
  },
  tilesGrid: {
    gap: 12,
    marginBottom: 32,
  },
  tilesRow: {
    flexDirection: "row",
    gap: 12,
  },
  tile: {
    flex: 1,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 18,
    minHeight: 120,
    justifyContent: "space-between",
  },
  tileTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  tileIconWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.white,
    marginTop: 8,
  },
  tileCounter: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 26,
    color: Colors.raw.white,
  },
  tileBadge: {
    backgroundColor: Colors.raw.rose500,
    borderRadius: 12,
    minWidth: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  tileBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#fff",
  },
  tileSubtext: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc500,
    marginTop: 2,
  },
  activitySection: {
    marginBottom: 16,
  },
  activityTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
    marginBottom: 16,
  },
  activityList: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    overflow: "hidden",
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
    gap: 12,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc300,
    flex: 1,
  },
  activityTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc600,
  },
});
