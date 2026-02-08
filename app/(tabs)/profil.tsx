import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useRole, type UserRole } from "@/contexts/RoleContext";

interface ToggleSetting {
  key: string;
  icon: string;
  label: string;
  defaultOn: boolean;
}

const NOTIFICATION_SETTINGS: ToggleSetting[] = [
  { key: "push", icon: "notifications", label: "Push-Benachrichtigungen", defaultOn: true },
  { key: "email", icon: "mail", label: "Email-Zusammenfassung t\u00E4glich", defaultOn: false },
  { key: "margin", icon: "warning", label: "Marge unter 20% warnen", defaultOn: true },
  { key: "material", icon: "cube", label: "Material-Erinnerungen", defaultOn: true },
  { key: "payment", icon: "cash", label: "Zahlungseing\u00E4nge melden", defaultOn: true },
];

interface TeamMember {
  name: string;
  role: string;
  icon: string;
}

const TEAM: TeamMember[] = [
  { name: "Mehmet", role: "Maler, aktiv", icon: "hammer" },
  { name: "Ali", role: "Fliesen, aktiv", icon: "hammer" },
  { name: "Ayse", role: "Projektleitung, aktiv", icon: "briefcase" },
];

interface Integration {
  name: string;
  connected: boolean;
  icon: string;
}

const INTEGRATIONS: Integration[] = [
  { name: "Google Drive", connected: true, icon: "folder" },
  { name: "Telegram", connected: true, icon: "send" },
  { name: "Superchat", connected: true, icon: "chatbubbles" },
  { name: "easybill", connected: false, icon: "receipt" },
  { name: "GoCardless", connected: false, icon: "card" },
];

function SettingToggle({ setting, value, onToggle }: { setting: ToggleSetting; value: boolean; onToggle: () => void }) {
  return (
    <View style={toggleStyles.row}>
      <View style={toggleStyles.left}>
        <Ionicons name={setting.icon as any} size={18} color={Colors.raw.zinc400} />
        <Text style={toggleStyles.label}>{setting.label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={() => {
          if (Platform.OS !== "web") Haptics.selectionAsync();
          onToggle();
        }}
        trackColor={{ false: Colors.raw.zinc700, true: Colors.raw.amber500 + "60" }}
        thumbColor={value ? Colors.raw.amber500 : Colors.raw.zinc500}
        ios_backgroundColor={Colors.raw.zinc700}
      />
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 },
  left: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  label: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc300 },
});

function RoleSwitcher() {
  const { role, setRole, actualRole, isImpersonating } = useRole();
  if (actualRole !== "gf") return null;

  const roles: { key: UserRole; icon: string; label: string }[] = [
    { key: "gf", icon: "briefcase", label: "Geschäftsführer" },
    { key: "bauleiter", icon: "clipboard", label: "Bauleiter" },
    { key: "monteur", icon: "construct", label: "Monteur" },
  ];

  return (
    <>
      <Text style={styles.sectionLabel}>Ansicht wechseln</Text>
      <View style={styles.card}>
        <Text style={rsStyles.hint}>Nur zum Testen verschiedener Rollen</Text>
        <View style={rsStyles.row}>
          {roles.map((r) => {
            const isActive = role === r.key;
            return (
              <Pressable
                key={r.key}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setRole(r.key);
                }}
                style={[rsStyles.btn, isActive && rsStyles.btnActive]}
                testID={`role-${r.key}`}
              >
                <Ionicons
                  name={r.icon as any}
                  size={18}
                  color={isActive ? "#000" : Colors.raw.zinc400}
                />
                <Text style={[rsStyles.btnText, isActive && rsStyles.btnTextActive]}>
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}

const rsStyles = StyleSheet.create({
  hint: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc600, paddingVertical: 10 },
  row: { gap: 6, paddingBottom: 10 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.raw.zinc800,
  },
  btnActive: { backgroundColor: Colors.raw.amber500 },
  btnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc400 },
  btnTextActive: { color: "#000", fontFamily: "Inter_700Bold" },
});

export default function ProfilScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const { role, user, sees, isImpersonating } = useRole();

  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    NOTIFICATION_SETTINGS.forEach((s) => { init[s.key] = s.defaultOn; });
    return init;
  });

  const toggleSetting = (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const statsForRole = {
    gf: [
      { value: "47", label: "Projekte", sub: "gesamt" },
      { value: "\u20AC182k", label: "Umsatz", sub: "2026" },
    ],
    bauleiter: [
      { value: "5", label: "Projekte", sub: "aktiv" },
      { value: "12", label: "Begehungen", sub: "gesamt" },
    ],
    monteur: [
      { value: "142h", label: "Stunden", sub: "Feb" },
      { value: "1", label: "Projekt", sub: "aktiv" },
    ],
  };

  const stats = statsForRole[role];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 20 + (isImpersonating ? 36 : 0), paddingBottom: bottomInset + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profil</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={32} color={Colors.raw.amber500} />
          </View>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
          <Text style={styles.profileRole}>{user.roleLabel}</Text>
          <View style={styles.profileDivider} />
          <Text style={styles.companyName}>Deine Baul\u00F6wen GmbH</Text>
          <Text style={styles.companySince}>Seit Januar 2025</Text>
        </View>

        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statSub}>{stat.sub}</Text>
            </View>
          ))}
        </View>

        <RoleSwitcher />

        <Text style={styles.sectionLabel}>Benachrichtigungen</Text>
        <View style={styles.card}>
          {NOTIFICATION_SETTINGS
            .filter((setting) => {
              if (role === "monteur") return setting.key === "push";
              if (role === "bauleiter") return setting.key !== "margin" && setting.key !== "payment";
              return true;
            })
            .map((s, i, arr) => (
            <View key={s.key}>
              <SettingToggle setting={s} value={toggles[s.key]} onToggle={() => toggleSetting(s.key)} />
              {i < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {role !== "monteur" && (
          <>
            <Text style={styles.sectionLabel}>Team</Text>
            <View style={styles.card}>
              {TEAM.map((member, i) => (
                <View key={member.name}>
                  <View style={styles.teamRow}>
                    <View style={styles.teamAvatar}>
                      <Ionicons name={member.icon as any} size={18} color={Colors.raw.amber500} />
                    </View>
                    <View>
                      <Text style={styles.teamName}>{member.name}</Text>
                      <Text style={styles.teamRole}>{member.role}</Text>
                    </View>
                  </View>
                  {i < TEAM.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
              <View style={styles.divider} />
              <Pressable style={({ pressed }) => [styles.addRow, { opacity: pressed ? 0.7 : 1 }]}>
                <Ionicons name="add-circle" size={20} color={Colors.raw.amber500} />
                <Text style={styles.addText}>Mitarbeiter einladen</Text>
              </Pressable>
            </View>
          </>
        )}

        {role === "gf" && (
          <>
        <Text style={styles.sectionLabel}>Einstellungen</Text>
        <View style={styles.card}>
          {([
            { icon: "business", label: "Firma", sub: "Deine Baul\u00F6wen GmbH", route: "/einstellungen/firma" },
            { icon: "people", label: "Team", sub: "4 Mitarbeiter", route: "/einstellungen/team" },
            { icon: "cube", label: "Lieferanten", sub: "21 Lieferanten", route: "/einstellungen/lieferanten" },
            { icon: "list", label: "Katalog", sub: "WABS \u2022 620 Positionen", route: "/einstellungen/katalog" },
            { icon: "document-text", label: "Briefpapier", sub: "Angebote, Rechnungen, Protokolle", route: "/einstellungen/briefpapier" },
            { icon: "cloud-upload", label: "Daten importieren", sub: "CSV, Excel, GAEB, PDF", route: "/einstellungen/import" },
          ] as const).map((item, i, arr) => (
            <View key={item.route}>
              <Pressable
                onPress={() => router.push(item.route as any)}
                style={({ pressed }) => [styles.settingsNavRow, { opacity: pressed ? 0.7 : 1 }]}
                testID={`settings-${item.label.toLowerCase()}`}
              >
                <View style={styles.settingsNavLeft}>
                  <View style={styles.settingsNavIcon}>
                    <Ionicons name={item.icon as any} size={20} color={Colors.raw.amber500} />
                  </View>
                  <View>
                    <Text style={styles.settingsNavLabel}>{item.label}</Text>
                    <Text style={styles.settingsNavSub}>{item.sub}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.raw.zinc600} />
              </Pressable>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Integrationen</Text>
        <View style={styles.card}>
          {INTEGRATIONS.map((integ, i) => (
            <View key={integ.name}>
              <View style={styles.integRow}>
                <View style={styles.integLeft}>
                  <View style={[styles.integDot, { backgroundColor: integ.connected ? Colors.raw.emerald500 : Colors.raw.amber500 }]} />
                  <Ionicons name={integ.icon as any} size={18} color={Colors.raw.zinc400} />
                  <Text style={styles.integName}>{integ.name}</Text>
                </View>
                {integ.connected ? (
                  <Text style={styles.integConnected}>Verbunden</Text>
                ) : (
                  <Pressable style={({ pressed }) => [styles.integConnectBtn, { opacity: pressed ? 0.7 : 1 }]}>
                    <Text style={styles.integConnectText}>Verbinden</Text>
                  </Pressable>
                )}
              </View>
              {i < INTEGRATIONS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
          </>
        )}

        <Text style={styles.sectionLabel}>App</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dunkelmodus</Text>
            <Switch
              value={true}
              disabled
              trackColor={{ false: Colors.raw.zinc700, true: Colors.raw.amber500 + "60" }}
              thumbColor={Colors.raw.amber500}
              ios_backgroundColor={Colors.raw.zinc700}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sprache</Text>
            <Text style={styles.infoValue}>Deutsch</Text>
          </View>
          <View style={styles.divider} />
          <Pressable style={({ pressed }) => [styles.linkRow, { opacity: pressed ? 0.7 : 1 }]}>
            <Text style={styles.linkText}>Feedback geben</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.raw.amber500} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={({ pressed }) => [styles.logoutRow, { opacity: pressed ? 0.7 : 1 }]}>
            <Text style={styles.logoutText}>Abmelden</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  title: { fontFamily: "Inter_800ExtraBold", fontSize: 30, color: Colors.raw.white, marginBottom: 24 },

  profileCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.raw.amber500 + "18",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  profileName: { fontFamily: "Inter_800ExtraBold", fontSize: 24, color: Colors.raw.white, marginBottom: 4 },
  profileEmail: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.raw.zinc400, marginBottom: 4 },
  profileRole: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.amber500, marginBottom: 16 },
  profileDivider: { height: 1, backgroundColor: Colors.raw.zinc800, alignSelf: "stretch", marginBottom: 16 },
  companyName: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.zinc300, marginBottom: 4 },
  companySince: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc500 },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    alignItems: "center",
  },
  statValue: { fontFamily: "Inter_800ExtraBold", fontSize: 28, color: Colors.raw.white, marginBottom: 4 },
  statLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc400 },
  statSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500 },

  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.zinc400,
    marginBottom: 10,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingHorizontal: 18,
    paddingVertical: 4,
    marginBottom: 20,
  },
  divider: { height: 1, backgroundColor: Colors.raw.zinc800 },

  teamRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  teamAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.raw.amber500 + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  teamName: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.white },
  teamRole: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500 },
  addRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14 },
  addText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.amber500 },

  infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 },
  infoLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc500 },
  infoValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc300 },
  linkRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 },
  linkText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.amber500 },
  logoutRow: { paddingVertical: 14, alignItems: "center" },
  logoutText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.rose500 },

  integRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 },
  integLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  integDot: { width: 8, height: 8, borderRadius: 4 },
  integName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc300 },
  integConnected: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.emerald500 },
  integConnectBtn: { backgroundColor: Colors.raw.amber500 + "18", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  integConnectText: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.raw.amber500 },

  settingsNavRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 },
  settingsNavLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  settingsNavIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.raw.amber500 + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsNavLabel: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.white },
  settingsNavSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginTop: 2 },
});
