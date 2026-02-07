import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useState, useCallback, useMemo } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface CheckItem {
  id: string;
  text: string;
  checked: boolean;
  note?: string;
}

interface Mangel {
  id: string;
  title: string;
  description: string;
  status: "offen" | "arbeit" | "behoben";
  assigned?: string;
}

const CHECKLISTS: Record<string, CheckItem[]> = {
  erstbegehung: [
    { id: "e1", text: "Wohnung begehbar", checked: true },
    { id: "e2", text: "Schl\u00FCssel erhalten", checked: true },
    { id: "e3", text: "Z\u00E4hlerst\u00E4nde notiert", checked: true },
    { id: "e4", text: "Fenster gepr\u00FCft", checked: true },
    { id: "e5", text: "Elektro gepr\u00FCft", checked: false },
    { id: "e6", text: "Sanit\u00E4r gepr\u00FCft", checked: false },
    { id: "e7", text: "B\u00F6den begutachtet", checked: false },
    { id: "e8", text: "W\u00E4nde begutachtet", checked: false },
    { id: "e9", text: "T\u00FCren gepr\u00FCft", checked: false },
    { id: "e10", text: "Aufma\u00DF erstellt", checked: false },
  ],
  zwischenbegehung: [
    { id: "z1", text: "Arbeitsfortschritt gepr\u00FCft", checked: true },
    { id: "z2", text: "Qualit\u00E4t kontrolliert", checked: true },
    { id: "z3", text: "M\u00E4ngel dokumentiert", checked: true },
    { id: "z4", text: "Zeitplan besprochen", checked: true },
    { id: "z5", text: "Material vor Ort gepr\u00FCft", checked: true },
    { id: "z6", text: "Nachtr\u00E4ge identifiziert", checked: true },
    { id: "z7", text: "Fotos erstellt", checked: true },
    { id: "z8", text: "Protokoll angelegt", checked: true },
    { id: "z9", text: "N\u00E4chste Schritte definiert", checked: false },
    { id: "z10", text: "R\u00FCckmeldung Auftraggeber", checked: false },
    { id: "z11", text: "Sicherheit gepr\u00FCft", checked: false },
    { id: "z12", text: "Sauberkeit gepr\u00FCft", checked: false },
  ],
  abnahme: [
    { id: "a1", text: "Alle Positionen fertig", checked: false },
    { id: "a2", text: "M\u00E4ngelliste erstellt", checked: false },
    { id: "a3", text: "Z\u00E4hlerst\u00E4nde \u00DCbergabe", checked: false },
    { id: "a4", text: "Schl\u00FCssel \u00FCbergeben", checked: false },
    { id: "a5", text: "Abnahmeprotokoll unterschrieben", checked: false },
  ],
};

const MAENGEL: Mangel[] = [
  {
    id: "m1",
    title: "Wasserfleck Decke K\u00FCche",
    description: "Maler muss nacharbeiten",
    status: "offen",
    assigned: "Mehmet",
  },
  {
    id: "m2",
    title: "Silikonfuge Bad undicht",
    description: "Sanit\u00E4r pr\u00FCfen lassen",
    status: "arbeit",
    assigned: "Ali",
  },
  {
    id: "m3",
    title: "Kratzer T\u00FCrrahmen Flur",
    description: "Lackierung ausbessern",
    status: "behoben",
  },
];

const MANGEL_STATUS: Record<string, { label: string; color: string }> = {
  offen: { label: "Offen", color: Colors.raw.rose500 },
  arbeit: { label: "In Arbeit", color: Colors.raw.amber500 },
  behoben: { label: "Behoben", color: Colors.raw.emerald500 },
};

const TYPE_LABELS: Record<string, { title: string; status: string; statusColor: string; date: string }> = {
  erstbegehung: {
    title: "Erstbegehung",
    status: "Erledigt",
    statusColor: Colors.raw.emerald500,
    date: "03.02.2026 \u2022 09:00 Uhr",
  },
  zwischenbegehung: {
    title: "Zwischenbegehung",
    status: "In Bearbeitung",
    statusColor: Colors.raw.amber500,
    date: "10.02.2026 \u2022 14:30 Uhr",
  },
  abnahme: {
    title: "Abnahme",
    status: "Nicht geplant",
    statusColor: Colors.raw.zinc600,
    date: "Noch kein Termin",
  },
};

function CheckboxItem({
  item,
  onToggle,
}: {
  item: CheckItem;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(item.note || "");
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleToggle = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    scale.value = withSequence(
      withTiming(1.05, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
    onToggle();
  };

  return (
    <Animated.View style={[checkStyles.container, animStyle]}>
      <Pressable style={checkStyles.row} onPress={handleToggle}>
        <View
          style={[
            checkStyles.checkbox,
            item.checked && checkStyles.checkboxChecked,
          ]}
        >
          {item.checked && (
            <Ionicons name="checkmark" size={16} color="#000" />
          )}
        </View>
        <Text
          style={[
            checkStyles.text,
            item.checked && checkStyles.textChecked,
          ]}
        >
          {item.text}
        </Text>
        <Pressable
          onPress={() => setExpanded(!expanded)}
          hitSlop={8}
        >
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={Colors.raw.zinc600}
          />
        </Pressable>
      </Pressable>
      {expanded && (
        <View style={checkStyles.expandedArea}>
          <TextInput
            style={checkStyles.noteInput}
            placeholder="Notiz hinzuf\u00FCgen..."
            placeholderTextColor={Colors.raw.zinc600}
            value={note}
            onChangeText={setNote}
            multiline
          />
          <Pressable
            style={({ pressed }) => [
              checkStyles.photoBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="camera" size={18} color={Colors.raw.amber500} />
            <Text style={checkStyles.photoBtnText}>Foto</Text>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}

const checkStyles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.raw.zinc600,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.raw.emerald500,
    borderColor: Colors.raw.emerald500,
  },
  text: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.white,
    flex: 1,
  },
  textChecked: {
    color: Colors.raw.zinc500,
    textDecorationLine: "line-through",
  },
  expandedArea: {
    paddingBottom: 14,
    paddingLeft: 40,
    gap: 10,
  },
  noteInput: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 10,
    padding: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.white,
    minHeight: 44,
    textAlignVertical: "top",
  },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  photoBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.amber500,
  },
});

function MangelCard({ mangel }: { mangel: Mangel }) {
  const cfg = MANGEL_STATUS[mangel.status];
  return (
    <View style={mangelStyles.card}>
      <View style={mangelStyles.photoPlaceholder}>
        <Ionicons name="image" size={24} color={Colors.raw.zinc600} />
      </View>
      <View style={mangelStyles.body}>
        <Text style={mangelStyles.title}>{mangel.title}</Text>
        <Text style={mangelStyles.desc}>{mangel.description}</Text>
        <View style={mangelStyles.meta}>
          <View style={[mangelStyles.statusPill, { backgroundColor: cfg.color + "18" }]}>
            <View style={[mangelStyles.statusDot, { backgroundColor: cfg.color }]} />
            <Text style={[mangelStyles.statusLabel, { color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>
          {mangel.assigned ? (
            <Text style={mangelStyles.assigned}>{mangel.assigned}</Text>
          ) : (
            <Text style={mangelStyles.unassigned}>Nicht zugewiesen</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const mangelStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  photoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.raw.zinc800,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.white,
    marginBottom: 3,
  },
  desc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc400,
    marginBottom: 8,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  statusLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  assigned: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc400,
  },
  unassigned: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc600,
    fontStyle: "italic",
  },
});

function SectionCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[sectionStyles.card, style]}>{children}</View>;
}

function SectionHeader({
  title,
  badge,
  rightIcon,
  rightLabel,
  onRightPress,
}: {
  title: string;
  badge?: string;
  rightIcon?: string;
  rightLabel?: string;
  onRightPress?: () => void;
}) {
  return (
    <View style={sectionStyles.headerRow}>
      <View style={sectionStyles.headerLeft}>
        <Text style={sectionStyles.headerTitle}>{title}</Text>
        {badge && (
          <View style={sectionStyles.badge}>
            <Text style={sectionStyles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      {(rightIcon || rightLabel) && (
        <Pressable
          onPress={onRightPress}
          style={({ pressed }) => [
            sectionStyles.rightBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          {rightIcon && (
            <Ionicons name={rightIcon as any} size={18} color={Colors.raw.amber500} />
          )}
          {rightLabel && (
            <Text style={sectionStyles.rightLabel}>{rightLabel}</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.raw.white,
  },
  badge: {
    backgroundColor: Colors.raw.zinc700,
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
    color: Colors.raw.zinc300,
  },
  rightBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  rightLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.amber500,
  },
});

export default function BegehungDetailScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const typeKey = (type || "zwischenbegehung").toLowerCase();
  const meta = TYPE_LABELS[typeKey] || TYPE_LABELS.zwischenbegehung;
  const showMaengel = typeKey !== "erstbegehung";

  const [items, setItems] = useState<CheckItem[]>(
    () => CHECKLISTS[typeKey] || CHECKLISTS.zwischenbegehung
  );
  const [notizen, setNotizen] = useState("");

  const checkedCount = useMemo(() => items.filter((i) => i.checked).length, [items]);
  const totalCount = items.length;
  const allDone = checkedCount === totalCount;
  const progressPercent = Math.round((checkedCount / totalCount) * 100);

  const toggleItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  }, []);

  const photoCount = 6;

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
          <Text style={styles.headerProjectCode} numberOfLines={1}>
            BL-2026-003
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 64,
            paddingBottom: bottomInset + 90,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.titleText}>{meta.title}</Text>
          <Text style={styles.subtitleText}>
            BL-2026-003 {"\u2022"} Schwentnerring 13c
          </Text>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: meta.statusColor + "18" },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: meta.statusColor }]}
              />
              <Text style={[styles.statusLabel, { color: meta.statusColor }]}>
                {meta.status}
              </Text>
            </View>
            <Text style={styles.dateText}>{meta.date}</Text>
          </View>
        </View>

        <SectionCard>
          <View style={styles.progressRow}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: allDone
                      ? Colors.raw.emerald500
                      : Colors.raw.amber500,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>
          <Text style={styles.progressLabel}>
            {checkedCount} von {totalCount} Punkten erledigt
          </Text>
        </SectionCard>

        <SectionCard>
          <SectionHeader title="Checkliste" badge={`${totalCount}`} />
          {items.map((item) => (
            <CheckboxItem
              key={item.id}
              item={item}
              onToggle={() => toggleItem(item.id)}
            />
          ))}
        </SectionCard>

        <SectionCard>
          <SectionHeader
            title="Fotos"
            badge={`${photoCount}`}
            rightIcon="camera"
            rightLabel="Foto"
          />
          <View style={styles.photoGrid}>
            {Array.from({ length: photoCount }).map((_, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  styles.photoTile,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="image" size={22} color={Colors.raw.zinc600} />
                </View>
                <View style={styles.photoBadge}>
                  <Text style={styles.photoBadgeText}>
                    {["K\u00FCche", "Bad", "Flur", "Wohnz.", "Bad", "K\u00FCche"][i]}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.addPhotoBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="camera" size={20} color="#000" />
            <Text style={styles.addPhotoBtnText}>Foto hinzuf\u00FCgen</Text>
          </Pressable>
        </SectionCard>

        {showMaengel && (
          <SectionCard>
            <SectionHeader
              title="M\u00E4ngel"
              badge={`${MAENGEL.length}`}
              rightIcon="add-circle-outline"
              rightLabel="Mangel"
            />
            {MAENGEL.map((m) => (
              <MangelCard key={m.id} mangel={m} />
            ))}
          </SectionCard>
        )}

        <SectionCard>
          <SectionHeader title="Notizen" />
          <TextInput
            style={styles.notizenInput}
            placeholder="Allgemeine Anmerkungen zur Begehung..."
            placeholderTextColor={Colors.raw.zinc600}
            value={notizen}
            onChangeText={setNotizen}
            multiline
            textAlignVertical="top"
          />
        </SectionCard>
      </ScrollView>

      <View
        style={[
          styles.stickyBar,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 8 },
        ]}
      >
        {allDone ? (
          <View style={styles.stickyBarInner}>
            {typeKey === "abnahme" && (
              <Pressable
                style={({ pressed }) => [
                  styles.signatureBtn,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Feather name="edit-3" size={18} color={Colors.raw.amber500} />
                <Text style={styles.signatureBtnText}>Unterschrift</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.completeBtn,
                { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                  );
                }
              }}
            >
              <Ionicons name="checkmark-circle" size={20} color="#000" />
              <Text style={styles.completeBtnText}>
                Begehung abschlie\u00DFen
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.continueBtn,
              { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
          >
            <Text style={styles.continueBtnText}>Begehung fortsetzen</Text>
            <Text style={styles.continueBtnCount}>
              {checkedCount}/{totalCount}
            </Text>
          </Pressable>
        )}
      </View>
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
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerProjectCode: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc500,
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  titleSection: {
    marginBottom: 24,
  },
  titleText: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 28,
    color: Colors.raw.white,
    marginBottom: 6,
  },
  subtitleText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.zinc500,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  dateText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.raw.zinc800,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 10,
    borderRadius: 5,
  },
  progressPercent: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 20,
    color: Colors.raw.white,
    minWidth: 48,
    textAlign: "right",
  },
  progressLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc500,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  photoTile: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  photoBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  photoBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.raw.white,
  },
  addPhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 12,
    paddingVertical: 14,
  },
  addPhotoBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#000",
  },
  notizenInput: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 12,
    padding: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.white,
    minHeight: 100,
  },
  stickyBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.raw.zinc950,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
  },
  stickyBarInner: {
    flexDirection: "row",
    gap: 10,
  },
  signatureBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.raw.amber500,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  signatureBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.raw.amber500,
  },
  completeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.emerald500,
    borderRadius: 14,
    paddingVertical: 16,
  },
  completeBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#000",
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.raw.amber500,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  continueBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#000",
  },
  continueBtnCount: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 15,
    color: "#000",
  },
});
