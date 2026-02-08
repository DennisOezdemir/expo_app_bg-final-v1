import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useState, useCallback, useMemo } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

type InvoiceStatus = "offen" | "ueberfaellig" | "bezahlt";
type InvoiceType = "ausgang" | "eingang";

interface InvoicePosition {
  label: string;
  amount: number;
}

interface Abschlag {
  label: string;
  amount: number;
  paid: boolean;
  paidDate?: string;
}

interface TimelineEvent {
  date: string;
  icon: string;
  iconColor: string;
  label: string;
  isWarning?: boolean;
  isFuture?: boolean;
}

interface InvoiceData {
  id: string;
  nr: string;
  status: InvoiceStatus;
  type: InvoiceType;
  overdueDays?: number;
  projectId: string;
  projectName: string;
  client: string;
  netto: number;
  mwstRate: number;
  mwst: number;
  brutto: number;
  invoiceDate: string;
  dueDate: string;
  positionen: InvoicePosition[];
  abschlaege: Abschlag[];
  timeline: TimelineEvent[];
}

const INVOICES: Record<string, InvoiceData> = {
  "RE-2026-012": {
    id: "RE-2026-012",
    nr: "RE-2026-012",
    status: "ueberfaellig",
    type: "ausgang",
    overdueDays: 21,
    projectId: "BL-2026-003",
    projectName: "Schwentnerring 13c",
    client: "SAGA GWG",
    netto: 4200,
    mwstRate: 19,
    mwst: 798,
    brutto: 4998,
    invoiceDate: "18.01.2026",
    dueDate: "01.02.2026",
    positionen: [
      { label: "Maler Wohnzimmer komplett", amount: 1800 },
      { label: "Maler Schlafzimmer", amount: 1400 },
      { label: "Maler Flur", amount: 520 },
      { label: "Maler Küche", amount: 480 },
    ],
    abschlaege: [
      { label: "Abschlag 1 (50%)", amount: 2100, paid: true, paidDate: "25.01." },
    ],
    timeline: [
      { date: "18.01.", icon: "document-text", iconColor: Colors.raw.zinc400, label: "Rechnung erstellt" },
      { date: "18.01.", icon: "paper-plane", iconColor: "#3b82f6", label: "Per Email versendet" },
      { date: "25.01.", icon: "mail", iconColor: Colors.raw.amber500, label: "Zahlungserinnerung gesendet" },
      { date: "08.02.", icon: "warning", iconColor: Colors.raw.rose500, label: "Heute: 21 Tage überfällig", isWarning: true },
      { date: "???", icon: "cash", iconColor: Colors.raw.zinc600, label: "Zahlung ausstehend", isFuture: true },
    ],
  },
  "RE-2026-008": {
    id: "RE-2026-008",
    nr: "RE-2026-008",
    status: "offen",
    type: "ausgang",
    overdueDays: 8,
    projectId: "BL-2026-005",
    projectName: "Billhorner Deich",
    client: "GWG Genossenschaft",
    netto: 2890,
    mwstRate: 19,
    mwst: 549.1,
    brutto: 3439.1,
    invoiceDate: "25.01.2026",
    dueDate: "08.02.2026",
    positionen: [
      { label: "Sanitärinstallation Bad", amount: 1640 },
      { label: "Anschlüsse Küche", amount: 750 },
      { label: "Kleinmaterial", amount: 500 },
    ],
    abschlaege: [],
    timeline: [
      { date: "25.01.", icon: "document-text", iconColor: Colors.raw.zinc400, label: "Rechnung erstellt" },
      { date: "25.01.", icon: "paper-plane", iconColor: "#3b82f6", label: "Per Email versendet" },
      { date: "???", icon: "cash", iconColor: Colors.raw.zinc600, label: "Zahlung ausstehend", isFuture: true },
    ],
  },
  "RE-2026-014": {
    id: "RE-2026-014",
    nr: "RE-2026-014",
    status: "bezahlt",
    type: "ausgang",
    projectId: "BL-2026-001",
    projectName: "Bramfelder Str. 88",
    client: "Privat (Müller)",
    netto: 1550,
    mwstRate: 19,
    mwst: 294.5,
    brutto: 1844.5,
    invoiceDate: "20.01.2026",
    dueDate: "03.02.2026",
    positionen: [
      { label: "Malerarbeiten Flur", amount: 680 },
      { label: "Malerarbeiten Kinderzimmer", amount: 550 },
      { label: "Spachtelarbeiten", amount: 320 },
    ],
    abschlaege: [],
    timeline: [
      { date: "20.01.", icon: "document-text", iconColor: Colors.raw.zinc400, label: "Rechnung erstellt" },
      { date: "20.01.", icon: "paper-plane", iconColor: "#3b82f6", label: "Per Email versendet" },
      { date: "31.01.", icon: "cash", iconColor: Colors.raw.emerald500, label: "Zahlung eingegangen" },
    ],
  },
  "ER-4521": {
    id: "ER-4521",
    nr: "ER-4521",
    status: "offen",
    type: "eingang",
    projectId: "",
    projectName: "",
    client: "MEGA eG",
    netto: 1840,
    mwstRate: 19,
    mwst: 349.6,
    brutto: 2189.6,
    invoiceDate: "01.02.2026",
    dueDate: "15.02.2026",
    positionen: [
      { label: "Vliesraufaser Erfurt 52 (12x)", amount: 226.8 },
      { label: "Vlieskleber 16kg (12x)", amount: 311.4 },
      { label: "Dispersionsfarbe 10L (4x)", amount: 171.6 },
      { label: "Diverse Kleinteile", amount: 1130.2 },
    ],
    abschlaege: [],
    timeline: [
      { date: "01.02.", icon: "document-text", iconColor: Colors.raw.zinc400, label: "Rechnung eingegangen" },
      { date: "???", icon: "cash", iconColor: Colors.raw.zinc600, label: "Zahlung ausstehend", isFuture: true },
    ],
  },
};

const DEFAULT_INVOICE = INVOICES["RE-2026-012"];

function formatEuroCents(amount: number): string {
  return (
    "\u20AC" +
    amount
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  );
}

function formatEuroWhole(amount: number): string {
  return (
    "\u20AC" +
    amount
      .toFixed(0)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  );
}

function StatusBadge({ status, overdueDays }: { status: InvoiceStatus; overdueDays?: number }) {
  const config = {
    offen: { label: "Offen", color: Colors.raw.amber500, bg: Colors.raw.amber500 + "18" },
    ueberfaellig: {
      label: `Überfällig — ${overdueDays} Tage`,
      color: Colors.raw.rose500,
      bg: Colors.raw.rose500 + "18",
    },
    bezahlt: { label: "Bezahlt", color: Colors.raw.emerald500, bg: Colors.raw.emerald500 + "18" },
  }[status];

  return (
    <View style={[sbStyles.badge, { backgroundColor: config.bg }]}>
      <View style={[sbStyles.dot, { backgroundColor: config.color }]} />
      <Text style={[sbStyles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const sbStyles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontFamily: "Inter_700Bold", fontSize: 13 },
});

function TypeBadge({ type }: { type: InvoiceType }) {
  const label = type === "ausgang" ? "Ausgangsrechnung" : "Eingangsrechnung";
  return (
    <View style={tbStyles.badge}>
      <Ionicons
        name={type === "ausgang" ? "arrow-up-circle-outline" : "arrow-down-circle-outline"}
        size={14}
        color={Colors.raw.zinc400}
      />
      <Text style={tbStyles.text}>{label}</Text>
    </View>
  );
}

const tbStyles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.raw.zinc800, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  text: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.zinc400 },
});

function TimelineRow({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  return (
    <View style={tlStyles.row}>
      <View style={tlStyles.left}>
        <Text style={[tlStyles.date, event.isFuture && tlStyles.dateFuture]}>{event.date}</Text>
      </View>
      <View style={tlStyles.lineCol}>
        <View style={[tlStyles.iconWrap, { backgroundColor: event.iconColor + "20" }]}>
          <Ionicons name={event.icon as any} size={16} color={event.iconColor} />
        </View>
        {!isLast && <View style={tlStyles.line} />}
      </View>
      <View style={tlStyles.labelCol}>
        <Text
          style={[
            tlStyles.label,
            event.isWarning && { color: Colors.raw.rose500 },
            event.isFuture && { color: Colors.raw.zinc600 },
          ]}
        >
          {event.label}
        </Text>
      </View>
    </View>
  );
}

const tlStyles = StyleSheet.create({
  row: { flexDirection: "row", minHeight: 48 },
  left: { width: 50, alignItems: "flex-end", paddingRight: 10, paddingTop: 8 },
  date: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.zinc500 },
  dateFuture: { color: Colors.raw.zinc700 },
  lineCol: { width: 36, alignItems: "center" },
  iconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", zIndex: 2 },
  line: { width: 2, flex: 1, backgroundColor: Colors.raw.zinc800, marginTop: -2 },
  labelCol: { flex: 1, paddingLeft: 10, paddingTop: 8, paddingBottom: 12 },
  label: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc300 },
});

type Mahnstufe = "erinnerung" | "erste" | "zweite" | "letzte";

function MahnungSheet({
  visible,
  invoice,
  onClose,
  onSent,
}: {
  visible: boolean;
  invoice: InvoiceData;
  onClose: () => void;
  onSent: () => void;
}) {
  const overdue = invoice.overdueDays || 0;
  const autoStufe: Mahnstufe =
    overdue > 60 ? "letzte" : overdue > 30 ? "zweite" : overdue > 14 ? "erste" : "erinnerung";

  const [stufe, setStufe] = useState<Mahnstufe>(autoStufe);
  const [gebuehr, setGebuehr] = useState("0,00");
  const [isSent, setIsSent] = useState(false);

  const restbetrag = useMemo(() => {
    const paid = invoice.abschlaege
      .filter((a) => a.paid)
      .reduce((s, a) => s + a.amount, 0);
    return invoice.brutto - paid;
  }, [invoice]);

  const verzugszinsen = useMemo(() => {
    return Math.round(restbetrag * 0.05 * (overdue / 365) * 100) / 100;
  }, [restbetrag, overdue]);

  const gebuehrNum = parseFloat(gebuehr.replace(",", ".")) || 0;
  const neuerBetrag = restbetrag + verzugszinsen + gebuehrNum;

  const stufen: { key: Mahnstufe; label: string; sub: string }[] = [
    { key: "erinnerung", label: "Zahlungserinnerung", sub: "freundlich" },
    { key: "erste", label: "1. Mahnung", sub: "14-30 Tage" },
    { key: "zweite", label: "2. Mahnung (mit Frist)", sub: "> 30 Tage" },
    { key: "letzte", label: "Letzte Mahnung", sub: "Inkasso-Androhung" },
  ];

  const stufeLabels: Record<Mahnstufe, string> = {
    erinnerung: "Zahlungserinnerung",
    erste: "1. Mahnung",
    zweite: "2. Mahnung",
    letzte: "Letzte Mahnung",
  };

  const fristDate = "15.02.2026";

  const handleSend = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsSent(true);
    setTimeout(() => {
      onSent();
    }, 1500);
  }, [onSent]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={msStyles.overlay}>
        <View style={msStyles.sheet}>
          <View style={msStyles.handle} />

          {isSent ? (
            <Animated.View entering={FadeIn.duration(200)} style={msStyles.sentState}>
              <Ionicons name="checkmark-circle" size={56} color={Colors.raw.emerald500} />
              <Text style={msStyles.sentText}>Mahnung versendet</Text>
              <Text style={msStyles.sentSub}>{stufeLabels[stufe]} an {invoice.client}</Text>
            </Animated.View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={msStyles.title}>Mahnung erstellen</Text>
              <Text style={msStyles.subtitle}>{invoice.nr} {"\u2022"} {invoice.client}</Text>

              <Text style={msStyles.sectionLabel}>MAHNSTUFE</Text>
              {stufen.map((s) => {
                const isActive = stufe === s.key;
                const isAuto = autoStufe === s.key;
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => setStufe(s.key)}
                    style={[msStyles.stufeRow, isActive && msStyles.stufeRowActive]}
                    testID={`stufe-${s.key}`}
                  >
                    <View style={[msStyles.radio, isActive && msStyles.radioActive]}>
                      {isActive && <View style={msStyles.radioInner} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[msStyles.stufeLabel, isActive && msStyles.stufeLabelActive]}>
                        {s.label}
                      </Text>
                      <Text style={msStyles.stufeSub}>{s.sub}</Text>
                    </View>
                    {isAuto && (
                      <View style={msStyles.autoBadge}>
                        <Text style={msStyles.autoText}>AUTO</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}

              <Text style={msStyles.sectionLabel}>VORSCHAU</Text>
              <View style={msStyles.previewCard}>
                <Text style={msStyles.previewLine}>An: {invoice.client}</Text>
                <Text style={msStyles.previewLine}>Rechnungsabteilung</Text>
                <Text style={msStyles.previewLineBold}>
                  Betreff: {stufeLabels[stufe]} {invoice.nr}
                </Text>
                <View style={msStyles.previewDivider} />
                <Text style={msStyles.previewBody}>
                  Sehr geehrte Damen und Herren,{"\n\n"}
                  für die Rechnung {invoice.nr} vom {invoice.invoiceDate}{"\n"}
                  über {formatEuroCents(invoice.brutto)} steht die Zahlung noch aus.{"\n\n"}
                  Wir bitten um Überweisung bis zum {fristDate}.{"\n\n"}
                  Mit freundlichen Grüßen,{"\n"}
                  Deine Baulöwen GmbH
                </Text>
              </View>

              <Text style={msStyles.sectionLabel}>KOSTEN</Text>
              <View style={msStyles.feesCard}>
                <View style={msStyles.feeRow}>
                  <Text style={msStyles.feeLabel}>Mahngebühr:</Text>
                  <View style={msStyles.feeInputWrap}>
                    <Text style={msStyles.feeEuro}>{"\u20AC"}</Text>
                    <TextInput
                      style={msStyles.feeInput}
                      value={gebuehr}
                      onChangeText={setGebuehr}
                      keyboardType="decimal-pad"
                      testID="gebuehr-input"
                    />
                  </View>
                </View>
                <View style={msStyles.feeRow}>
                  <Text style={msStyles.feeLabel}>Verzugszinsen:</Text>
                  <Text style={msStyles.feeValue}>
                    {formatEuroCents(verzugszinsen)}
                  </Text>
                </View>
                <Text style={msStyles.feeSub}>(5% über Basiszins)</Text>
                <View style={msStyles.feeDivider} />
                <View style={msStyles.feeRow}>
                  <Text style={msStyles.feeTotalLabel}>Neuer Betrag:</Text>
                  <Text style={msStyles.feeTotalValue}>
                    {formatEuroCents(neuerBetrag)}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={onClose}
                style={({ pressed }) => [msStyles.pdfBtn, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Ionicons name="document-text-outline" size={18} color={Colors.raw.zinc300} />
                <Text style={msStyles.pdfBtnText}>Als PDF speichern</Text>
              </Pressable>

              <Pressable
                onPress={handleSend}
                style={({ pressed }) => [msStyles.sendBtn, { opacity: pressed ? 0.9 : 1 }]}
                testID="send-mahnung"
              >
                <Feather name="send" size={16} color="#000" />
                <Text style={msStyles.sendBtnText}>MAHNUNG SENDEN</Text>
              </Pressable>
            </ScrollView>
          )}

          {!isSent && (
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [msStyles.closeBtn, { opacity: pressed ? 0.7 : 1 }]}
              testID="close-mahnung"
            >
              <Ionicons name="close" size={24} color={Colors.raw.zinc400} />
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const msStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: Colors.raw.zinc950,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    padding: 24,
    paddingTop: 12,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.raw.zinc700, alignSelf: "center", marginBottom: 16 },
  closeBtn: { position: "absolute", top: 16, right: 20, width: 40, height: 40, alignItems: "center", justifyContent: "center", zIndex: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.raw.white, marginBottom: 4 },
  subtitle: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc500, marginBottom: 20 },
  sectionLabel: { fontFamily: "Inter_700Bold", fontSize: 11, color: Colors.raw.zinc500, letterSpacing: 1, marginBottom: 10, marginTop: 20 },
  stufeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 14,
    marginBottom: 6,
  },
  stufeRowActive: { borderColor: Colors.raw.amber500 + "60", backgroundColor: Colors.raw.amber500 + "08" },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.raw.zinc600, alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: Colors.raw.amber500 },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.raw.amber500 },
  stufeLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc300 },
  stufeLabelActive: { color: Colors.raw.white },
  stufeSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc600 },
  autoBadge: { backgroundColor: Colors.raw.amber500 + "20", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  autoText: { fontFamily: "Inter_700Bold", fontSize: 10, color: Colors.raw.amber500, letterSpacing: 0.5 },
  previewCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 18,
  },
  previewLine: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc400, marginBottom: 2 },
  previewLineBold: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.zinc300, marginBottom: 4 },
  previewDivider: { height: 1, backgroundColor: Colors.raw.zinc800, marginVertical: 12 },
  previewBody: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc300, lineHeight: 20 },
  feesCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 18,
  },
  feeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  feeLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc400 },
  feeInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 100,
  },
  feeEuro: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc500 },
  feeInput: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.white, minWidth: 60, textAlign: "right" },
  feeValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc300 },
  feeSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.raw.zinc600, textAlign: "right", marginBottom: 8 },
  feeDivider: { height: 1, backgroundColor: Colors.raw.zinc700, marginVertical: 10 },
  feeTotalLabel: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.white },
  feeTotalValue: { fontFamily: "Inter_800ExtraBold", fontSize: 17, color: Colors.raw.white },
  pdfBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
    marginBottom: 10,
  },
  pdfBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.raw.zinc300 },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 12,
    paddingVertical: 14,
  },
  sendBtnText: { fontFamily: "Inter_800ExtraBold", fontSize: 15, color: "#000", letterSpacing: 0.5 },
  sentState: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 16 },
  sentText: { fontFamily: "Inter_800ExtraBold", fontSize: 22, color: Colors.raw.emerald500 },
  sentSub: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc400 },
});

function ToastMessage({ text }: { text: string }) {
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(300)} style={toastS.container}>
      <Ionicons name="checkmark-circle" size={22} color={Colors.raw.emerald500} />
      <Text style={toastS.text}>{text}</Text>
    </Animated.View>
  );
}

const toastS = StyleSheet.create({
  container: {
    position: "absolute",
    top: 110,
    left: 20,
    right: 20,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.raw.zinc800,
    borderWidth: 1,
    borderColor: Colors.raw.emerald500 + "40",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  text: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.emerald500, flex: 1 },
});

export default function RechnungDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const invoice = INVOICES[id || ""] || DEFAULT_INVOICE;

  const [showMahnung, setShowMahnung] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [mahnungSent, setMahnungSent] = useState(false);

  const restbetrag = useMemo(() => {
    const paid = invoice.abschlaege
      .filter((a) => a.paid)
      .reduce((s, a) => s + a.amount, 0);
    return invoice.brutto - paid;
  }, [invoice]);

  const handleMahnungSent = useCallback(() => {
    setShowMahnung(false);
    setMahnungSent(true);
    setToast("Mahnung versendet");
    setTimeout(() => setToast(null), 3000);
  }, []);

  const statusDotColor =
    invoice.status === "ueberfaellig"
      ? Colors.raw.rose500
      : invoice.status === "bezahlt"
      ? Colors.raw.emerald500
      : Colors.raw.amber500;

  return (
    <View style={s.container}>
      {toast && <ToastMessage text={toast} />}

      <View style={[s.header, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <Text style={s.headerLabel}>Finanzen</Text>
      </View>

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[s.scrollContent, { paddingTop: topInset + 64, paddingBottom: bottomInset + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.invoiceNr}>{invoice.nr}</Text>

        <View style={s.badgesRow}>
          <StatusBadge status={invoice.status} overdueDays={invoice.overdueDays} />
          <TypeBadge type={invoice.type} />
        </View>

        {invoice.projectId ? (
          <Pressable
            onPress={() => router.push(`/project/${invoice.projectId}` as any)}
            style={({ pressed }) => [s.contextRow, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name="clipboard" size={16} color={Colors.raw.zinc500} />
            <Text style={s.contextText}>
              {invoice.projectId} {"\u2022"} {invoice.projectName}
            </Text>
          </Pressable>
        ) : null}

        <View style={s.clientRow}>
          <Text style={s.clientLabel}>{invoice.client}</Text>
          <Text style={s.clientSub}>
            {invoice.type === "ausgang" ? "Kunde" : "Lieferant"}
          </Text>
        </View>

        <View style={s.summenCard}>
          <Text style={s.summenTitle}>Rechnungsbetrag</Text>
          <View style={s.summenAmountRow}>
            <Text style={s.amountNetto}>{formatEuroCents(invoice.netto)}</Text>
            <Text style={s.amountLabel}>netto</Text>
          </View>
          <View style={s.summenAmountRow}>
            <Text style={s.amountBrutto}>{formatEuroCents(invoice.brutto)}</Text>
            <Text style={s.amountLabel}>brutto</Text>
          </View>
          <View style={s.summenDivider} />
          <View style={s.summenInfoRow}>
            <Text style={s.summenInfoLabel}>Rechnungsdatum:</Text>
            <Text style={s.summenInfoValue}>{invoice.invoiceDate}</Text>
          </View>
          <View style={s.summenInfoRow}>
            <Text style={s.summenInfoLabel}>Fällig:</Text>
            <Text style={s.summenInfoValue}>{invoice.dueDate}</Text>
          </View>
          {invoice.status === "ueberfaellig" && invoice.overdueDays && (
            <View style={s.overdueRow}>
              <Ionicons name="time-outline" size={16} color={Colors.raw.rose500} />
              <Text style={s.overdueText}>
                {invoice.overdueDays} Tage überfällig
              </Text>
              <View style={[s.overdueDot, { backgroundColor: Colors.raw.rose500 }]} />
            </View>
          )}
        </View>

        <Text style={s.sectionTitle}>Zahlungsverlauf</Text>
        <View style={s.timelineCard}>
          {invoice.timeline.map((event, i) => (
            <TimelineRow
              key={i}
              event={event}
              isLast={i === invoice.timeline.length - 1}
            />
          ))}
          {mahnungSent && (
            <TimelineRow
              event={{
                date: "08.02.",
                icon: "mail",
                iconColor: Colors.raw.amber500,
                label: "Mahnung versendet",
              }}
              isLast={true}
            />
          )}
        </View>

        <Text style={s.sectionTitle}>Positionen</Text>
        <View style={s.posCard}>
          {invoice.positionen.map((pos, i) => (
            <View key={i} style={[s.posRow, i < invoice.positionen.length - 1 && s.posRowBorder]}>
              <Text style={s.posLabel} numberOfLines={1}>{pos.label}</Text>
              <Text style={s.posAmount}>{formatEuroCents(pos.amount)}</Text>
            </View>
          ))}
          <View style={s.posDivider} />
          <View style={s.posSumRow}>
            <Text style={s.posSumLabel}>Netto:</Text>
            <Text style={s.posSumValue}>{formatEuroCents(invoice.netto)}</Text>
          </View>
          <View style={s.posSumRow}>
            <Text style={s.posSumLabel}>MwSt {invoice.mwstRate}%:</Text>
            <Text style={s.posSumValue}>{formatEuroCents(invoice.mwst)}</Text>
          </View>
          <View style={s.posSumRow}>
            <Text style={s.posTotalLabel}>Brutto:</Text>
            <Text style={s.posTotalValue}>{formatEuroCents(invoice.brutto)}</Text>
          </View>
        </View>

        {invoice.abschlaege.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Abschläge</Text>
            <View style={s.abschlagCard}>
              {invoice.abschlaege.map((a, i) => (
                <View key={i} style={s.abschlagRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.abschlagLabel}>{a.label}</Text>
                    {a.paid && a.paidDate && (
                      <View style={s.abschlagPaidRow}>
                        <Ionicons name="checkmark-circle" size={14} color={Colors.raw.emerald500} />
                        <Text style={s.abschlagPaidText}>bezahlt {a.paidDate}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.abschlagAmount}>-{formatEuroCents(a.amount)}</Text>
                </View>
              ))}
              <View style={s.posDivider} />
              <View style={s.posSumRow}>
                <Text style={s.posTotalLabel}>Restbetrag:</Text>
                <Text style={s.posTotalValue}>{formatEuroCents(restbetrag)}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={[s.stickyActions, { paddingBottom: Math.max(bottomInset, 16) }]}>
        {invoice.type === "ausgang" ? (
          <View style={s.actionsRow}>
            <Pressable style={({ pressed }) => [s.actionSecondary, { opacity: pressed ? 0.8 : 1 }]}>
              <Ionicons name="document-text-outline" size={18} color={Colors.raw.zinc300} />
              <Text style={s.actionSecondaryText}>PDF</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [s.actionSecondary, { opacity: pressed ? 0.8 : 1 }]}>
              <Feather name="send" size={16} color={Colors.raw.zinc300} />
              <Text style={s.actionSecondaryText}>Erneut senden</Text>
            </Pressable>
            {invoice.status !== "bezahlt" && (
              <Pressable
                onPress={() => setShowMahnung(true)}
                style={({ pressed }) => [s.actionPrimary, { opacity: pressed ? 0.9 : 1 }]}
                testID="mahnen-button"
              >
                <Ionicons name="warning" size={16} color="#000" />
                <Text style={s.actionPrimaryText}>Mahnen</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={s.actionsRow}>
            <Pressable style={({ pressed }) => [s.actionSecondary, { opacity: pressed ? 0.8 : 1 }]}>
              <Ionicons name="document-text-outline" size={18} color={Colors.raw.zinc300} />
              <Text style={s.actionSecondaryText}>PDF</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [s.actionPrimary, { opacity: pressed ? 0.9 : 1 }]}>
              <Ionicons name="checkmark-circle" size={16} color="#000" />
              <Text style={s.actionPrimaryText}>Als bezahlt</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [s.actionSecondary, { opacity: pressed ? 0.8 : 1 }]}>
              <Ionicons name="clipboard-outline" size={16} color={Colors.raw.zinc300} />
              <Text style={s.actionSecondaryText}>Projekt</Text>
            </Pressable>
          </View>
        )}
      </View>

      <MahnungSheet
        visible={showMahnung}
        invoice={invoice}
        onClose={() => setShowMahnung(false)}
        onSent={handleMahnungSent}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: Colors.raw.zinc950 + "E6",
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerLabel: { fontFamily: "Inter_500Medium", fontSize: 16, color: Colors.raw.zinc400 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  invoiceNr: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 26,
    fontWeight: "800",
    color: Colors.raw.white,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  contextRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  contextText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc400 },
  clientRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 24 },
  clientLabel: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.raw.white },
  clientSub: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc500 },
  summenCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginBottom: 24,
  },
  summenTitle: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.zinc500, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 12 },
  summenAmountRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 4 },
  amountNetto: { fontFamily: "Inter_800ExtraBold", fontSize: 28, color: Colors.raw.white },
  amountBrutto: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.raw.zinc300 },
  amountLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc500 },
  summenDivider: { height: 1, backgroundColor: Colors.raw.zinc800, marginVertical: 14 },
  summenInfoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  summenInfoLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc500 },
  summenInfoValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc300 },
  overdueRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, backgroundColor: Colors.raw.rose500 + "12", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  overdueText: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.rose500 },
  overdueDot: { width: 8, height: 8, borderRadius: 4, marginLeft: "auto" },
  sectionTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 18, color: Colors.raw.white, marginBottom: 12 },
  timelineCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 16,
    marginBottom: 24,
  },
  posCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 18,
    marginBottom: 24,
  },
  posRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  posRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.raw.zinc800 },
  posLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc300, flex: 1, marginRight: 12 },
  posAmount: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.white },
  posDivider: { height: 1, backgroundColor: Colors.raw.zinc700, marginVertical: 10 },
  posSumRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  posSumLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc400 },
  posSumValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc300 },
  posTotalLabel: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.white },
  posTotalValue: { fontFamily: "Inter_800ExtraBold", fontSize: 16, color: Colors.raw.white },
  abschlagCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 18,
    marginBottom: 24,
  },
  abschlagRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  abschlagLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc300 },
  abschlagAmount: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.emerald500 },
  abschlagPaidRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  abschlagPaidText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.raw.emerald500 },
  stickyActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.raw.zinc900,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  actionsRow: { flexDirection: "row", gap: 8 },
  actionSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 12,
    paddingVertical: 13,
  },
  actionSecondaryText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc300 },
  actionPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 12,
    paddingVertical: 13,
  },
  actionPrimaryText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#000" },
});
