import { StyleSheet, Text, View, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { TopBar } from "@/components/TopBar";

function StatCard({
  label,
  value,
  icon,
  iconColor,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconColor: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.iconCircle, { backgroundColor: iconColor + "18" }]}>
          {icon}
        </View>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StatusDot({ color }: { color: string }) {
  return <View style={[styles.statusDot, { backgroundColor: color }]} />;
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
            paddingBottom: bottomInset,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>Guten Tag, Bauleiter</Text>
          <Text style={styles.date}>Freitag, 7. Februar 2026</Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label="Aktive Projekte"
            value="12"
            icon={<Ionicons name="construct" size={18} color={Colors.raw.amber500} />}
            iconColor={Colors.raw.amber500}
          />
          <StatCard
            label="Offene Freigaben"
            value="3"
            icon={<Ionicons name="checkmark-circle" size={18} color={Colors.raw.rose500} />}
            iconColor={Colors.raw.rose500}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label="Bestellungen"
            value="8"
            icon={<MaterialCommunityIcons name="package-variant" size={18} color={Colors.raw.emerald500} />}
            iconColor={Colors.raw.emerald500}
          />
          <StatCard
            label="Mitarbeiter"
            value="47"
            icon={<Ionicons name="people" size={18} color={Colors.raw.amber400} />}
            iconColor={Colors.raw.amber400}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Aktuelle Projekte</Text>
        </View>

        <View style={styles.projectCard}>
          <View style={styles.projectTop}>
            <View style={styles.projectInfo}>
              <Text style={styles.projectName}>Wohnanlage Seeblick</Text>
              <Text style={styles.projectAddress}>Seestrasse 42, Zürich</Text>
            </View>
            <StatusDot color={Colors.raw.emerald500} />
          </View>
          <View style={styles.projectProgress}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: "72%" }]} />
            </View>
            <Text style={styles.progressText}>72%</Text>
          </View>
        </View>

        <View style={styles.projectCard}>
          <View style={styles.projectTop}>
            <View style={styles.projectInfo}>
              <Text style={styles.projectName}>Bürogebäude Mitte</Text>
              <Text style={styles.projectAddress}>Hauptstrasse 15, Bern</Text>
            </View>
            <StatusDot color={Colors.raw.amber500} />
          </View>
          <View style={styles.projectProgress}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: "45%", backgroundColor: Colors.raw.amber500 }]} />
            </View>
            <Text style={styles.progressText}>45%</Text>
          </View>
        </View>

        <View style={styles.projectCard}>
          <View style={styles.projectTop}>
            <View style={styles.projectInfo}>
              <Text style={styles.projectName}>Parkhaus Nord</Text>
              <Text style={styles.projectAddress}>Industrieweg 8, Basel</Text>
            </View>
            <StatusDot color={Colors.raw.rose500} />
          </View>
          <View style={styles.projectProgress}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: "18%", backgroundColor: Colors.raw.rose500 }]} />
            </View>
            <Text style={styles.progressText}>18%</Text>
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
    marginBottom: 28,
  },
  greeting: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.raw.white,
    marginBottom: 4,
  },
  date: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.zinc500,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 16,
  },
  statHeader: {
    marginBottom: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 32,
    color: Colors.raw.white,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.raw.white,
  },
  projectCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginBottom: 12,
  },
  projectTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  projectInfo: {
    flex: 1,
    marginRight: 12,
  },
  projectName: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.raw.white,
    marginBottom: 4,
  },
  projectAddress: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc500,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  projectProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.raw.zinc800,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.raw.emerald500,
  },
  progressText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.raw.zinc400,
    minWidth: 36,
    textAlign: "right",
  },
});
