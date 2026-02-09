import {
  StyleSheet,
  Text,
  View,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { useState, useCallback } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface Position {
  name: string;
  amount: string;
}

interface AngebotData {
  type: "angebot";
  id: string;
  title: string;
  projectCode: string;
  projectAddress: string;
  client: string;
  trade: string;
  status: string;
  submittedAgo: string;
  netto: string;
  brutto: string;
  positionCount: number;
  roomCount: number;
  marginPercent: number;
  marginAmount: string;
  marginStatus: "green" | "yellow" | "red";
  hasComparison: boolean;
  comparisonChanges?: { label: string; amount: string; positive: boolean }[];
  comparisonDiff?: string;
  topPositions: Position[];
  remainingCount: number;
}

interface MaterialData {
  type: "material";
  id: string;
  title: string;
  projectCode: string;
  projectAddress: string;
  client: string;
  trade: string;
  status: string;
  submittedAgo: string;
  supplierName: string;
  customerNumber: string;
  supplierPhone: string;
  positions: { name: string; qty: string; amount: string }[];
  summeNetto: string;
  budgetTotal: string;
  budgetUsed: string;
  thisOrder: string;
  budgetRemaining: string;
  budgetStatus: "green" | "yellow" | "red";
}

interface NachtragData {
  type: "nachtrag";
  id: string;
  title: string;
  projectCode: string;
  projectAddress: string;
  client: string;
  trade: string;
  status: string;
  submittedAgo: string;
  reason: string;
  discoveredAt: string;
  photoCount: number;
  positions: Position[];
  summeNetto: string;
  vobReference: string;
  vobDetail: string;
}

type ApprovalData = AngebotData | MaterialData | NachtragData;

const APPROVALS: Record<string, ApprovalData> = {
  "1": {
    type: "angebot",
    id: "1",
    title: "Angebot freigeben",
    projectCode: "BL-2026-003",
    projectAddress: "Schwentnerring 13c EG Links",
    client: "SAGA GWG",
    trade: "Maler+Boden",
    status: "Wartet auf Freigabe",
    submittedAgo: "vor 2 Stunden",
    netto: "12.400,00",
    brutto: "14.756,00",
    positionCount: 47,
    roomCount: 6,
    marginPercent: 24,
    marginAmount: "2.976",
    marginStatus: "green",
    hasComparison: true,
    comparisonChanges: [
      { label: "Nachtrag Bad", amount: "1.200", positive: true },
      { label: "Position gestrichen", amount: "400", positive: false },
    ],
    comparisonDiff: "+800",
    topPositions: [
      { name: "Badezimmer komplett", amount: "2.840" },
      { name: "Wohnzimmer Boden", amount: "1.960" },
      { name: "Kuche Wand+Boden", amount: "1.800" },
      { name: "Schlafzimmer Maler", amount: "1.400" },
      { name: "Flur", amount: "980" },
    ],
    remainingCount: 42,
  },
  "2": {
    type: "material",
    id: "2",
    title: "Material bestellen",
    projectCode: "BL-2026-007",
    projectAddress: "Industrieweg 8, Basel",
    client: "Gewerbepark Basel AG",
    trade: "Maler+Boden",
    status: "Wartet auf Freigabe",
    submittedAgo: "vor 5 Stunden",
    supplierName: "MEGA eG",
    customerNumber: "48291",
    supplierPhone: "040-123456",
    positions: [
      { name: "Vliesraufaser Erfurt 52", qty: "12x", amount: "226,80" },
      { name: "Vlieskleber 16kg", qty: "12x", amount: "311,40" },
      { name: "Dispersionsfarbe 10L", qty: "4x", amount: "171,60" },
    ],
    summeNetto: "709,80",
    budgetTotal: "4.200",
    budgetUsed: "2.840",
    thisOrder: "710",
    budgetRemaining: "650",
    budgetStatus: "yellow",
  },
  "3": {
    type: "nachtrag",
    id: "3",
    title: "Nachtrag genehmigen",
    projectCode: "BL-2026-001",
    projectAddress: "Seestrasse 42, Zurich",
    client: "Privat Immobilien AG",
    trade: "Maler+Boden",
    status: "Wartet auf Freigabe",
    submittedAgo: "vor 1 Tag",
    reason: "Wasserschaden Decke Badezimmer",
    discoveredAt: "Entdeckt bei Zwischenbegehung am 08.02.",
    photoCount: 3,
    positions: [
      { name: "Trocknung (3 Tage)", amount: "280" },
      { name: "Decke neu spachteln", amount: "140" },
    ],
    summeNetto: "420",
    vobReference: "\u00A72 Abs. 6 VOB/B — Zusatzliche Leistung",
    vobDetail: "Nicht im ursprunglichen LV enthalten",
  },
};

function StatusBadge({ status, color }: { status: string; color: string }) {
  return (
    <View style={[statusStyles.badge, { backgroundColor: color + "18" }]}>
      <View style={[statusStyles.dot, { backgroundColor: color }]} />
      <Text style={[statusStyles.text, { color }]}>{status}</Text>
    </View>
  );
}

const statusStyles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[s.card, style]}>{children}</View>;
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={s.sectionLabel}>{label}</Text>;
}

function MarginIndicator({ percent, status }: { percent: number; status: "green" | "yellow" | "red" }) {
  const color =
    status === "green"
      ? Colors.raw.emerald500
      : status === "yellow"
      ? Colors.raw.amber500
      : Colors.raw.rose500;
  return (
    <View style={[marginStyles.container, { backgroundColor: color + "18" }]}>
      <Text style={[marginStyles.text, { color }]}>{percent}%</Text>
    </View>
  );
}

const marginStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  text: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
});

function BudgetIndicator({ status }: { status: "green" | "yellow" | "red" }) {
  const color =
    status === "green"
      ? Colors.raw.emerald500
      : status === "yellow"
      ? Colors.raw.amber500
      : Colors.raw.rose500;
  return (
    <View style={[budgetStyles.dot, { backgroundColor: color }]} />
  );
}

const budgetStyles = StyleSheet.create({
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

function AngebotContent({ data }: { data: AngebotData }) {
  return (
    <>
      <Card>
        <View style={s.amountRow}>
          <View>
            <Text style={s.amountLabel}>Netto</Text>
            <Text style={s.amountBig}>{"\u20AC"}{data.netto}</Text>
          </View>
          <View style={s.amountDivider} />
          <View>
            <Text style={s.amountLabel}>Brutto</Text>
            <Text style={s.amountMedium}>{"\u20AC"}{data.brutto}</Text>
          </View>
        </View>
        <View style={s.metaRow}>
          <Text style={s.metaText}>{data.positionCount} Positionen</Text>
          <View style={s.metaDot} />
          <Text style={s.metaText}>{data.roomCount} Raume</Text>
        </View>
        <View style={s.marginRow}>
          <Text style={s.marginLabel}>Marge:</Text>
          <MarginIndicator percent={data.marginPercent} status={data.marginStatus} />
          <Text style={s.marginAmount}>({"\u20AC"}{data.marginAmount})</Text>
        </View>
      </Card>

      {data.hasComparison && data.comparisonChanges && (
        <>
          <SectionLabel label="VERGLEICH" />
          <Card>
            <Text style={s.comparisonTitle}>vs. Version 1:</Text>
            {data.comparisonChanges.map((change, i) => (
              <View key={i} style={s.comparisonRow}>
                <Text
                  style={[
                    s.comparisonAmount,
                    { color: change.positive ? Colors.raw.emerald500 : Colors.raw.rose400 },
                  ]}
                >
                  {change.positive ? "+" : "-"} {"\u20AC"}{change.amount}
                </Text>
                <Text style={s.comparisonLabel}>({change.label})</Text>
              </View>
            ))}
            <View style={s.comparisonDivider} />
            <View style={s.comparisonRow}>
              <Text style={s.comparisonDiffAmount}>= {data.comparisonDiff && (data.comparisonDiff.startsWith("+") ? "" : "")}{"\u20AC"}{data.comparisonDiff} Differenz</Text>
            </View>
          </Card>
        </>
      )}

      <SectionLabel label="TOP POSITIONEN" />
      <Card>
        {data.topPositions.map((pos, i) => (
          <View key={i} style={[s.posRow, i < data.topPositions.length - 1 && s.posRowBorder]}>
            <Text style={s.posName} numberOfLines={1}>{pos.name}</Text>
            <Text style={s.posAmount}>{"\u20AC"}{pos.amount}</Text>
          </View>
        ))}
        {data.remainingCount > 0 && (
          <Pressable
            style={({ pressed }) => [s.moreButton, { opacity: pressed ? 0.7 : 1 }]}
            testID="view-all-positions"
          >
            <Text style={s.moreButtonText}>
              ... {data.remainingCount} weitere Positionen
            </Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.raw.amber500} />
          </Pressable>
        )}
      </Card>

      <SectionLabel label="DOKUMENT" />
      <Card>
        <View style={s.pdfPreview}>
          <View style={s.pdfPlaceholder}>
            <Ionicons name="document-text" size={40} color={Colors.raw.zinc600} />
            <Text style={s.pdfTitle}>Angebot_BL-2026-003_v2.pdf</Text>
            <Text style={s.pdfMeta}>12 Seiten</Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [s.pdfFullButton, { opacity: pressed ? 0.7 : 1 }]}
          testID="view-pdf"
        >
          <Ionicons name="expand" size={16} color={Colors.raw.amber500} />
          <Text style={s.pdfFullText}>PDF Vollbild</Text>
        </Pressable>
      </Card>
    </>
  );
}

function MaterialContent({ data }: { data: MaterialData }) {
  return (
    <>
      <SectionLabel label="LIEFERANT" />
      <Card>
        <View style={s.supplierHeader}>
          <View style={s.supplierIcon}>
            <MaterialCommunityIcons name="store" size={22} color={Colors.raw.amber500} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.supplierName}>{data.supplierName}</Text>
            <Text style={s.supplierMeta}>Kd.Nr: {data.customerNumber}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [s.phoneButton, { opacity: pressed ? 0.7 : 1 }]}
            testID="call-supplier"
          >
            <Feather name="phone" size={18} color={Colors.raw.emerald500} />
          </Pressable>
        </View>
      </Card>

      <SectionLabel label="POSITIONEN" />
      <Card>
        {data.positions.map((pos, i) => (
          <View key={i} style={[s.matPosRow, i < data.positions.length - 1 && s.posRowBorder]}>
            <View style={{ flex: 1 }}>
              <Text style={s.matPosQty}>{pos.qty}</Text>
              <Text style={s.matPosName}>{pos.name}</Text>
            </View>
            <Text style={s.matPosAmount}>{"\u20AC"}{pos.amount}</Text>
          </View>
        ))}
        <View style={s.matSumDivider} />
        <View style={s.matSumRow}>
          <Text style={s.matSumLabel}>Summe netto:</Text>
          <Text style={s.matSumAmount}>{"\u20AC"}{data.summeNetto}</Text>
        </View>
      </Card>

      <SectionLabel label="BUDGET CHECK" />
      <Card>
        <View style={s.budgetRow}>
          <Text style={s.budgetLabel}>Material-Budget:</Text>
          <Text style={s.budgetValue}>{"\u20AC"}{data.budgetTotal}</Text>
        </View>
        <View style={s.budgetRow}>
          <Text style={s.budgetLabel}>Bereits bestellt:</Text>
          <Text style={s.budgetValue}>{"\u20AC"}{data.budgetUsed}</Text>
        </View>
        <View style={s.budgetRow}>
          <Text style={s.budgetLabel}>Diese Bestellung:</Text>
          <Text style={[s.budgetValue, { color: Colors.raw.amber500 }]}>{"\u20AC"}{data.thisOrder}</Text>
        </View>
        <View style={s.budgetDivider} />
        <View style={s.budgetRow}>
          <Text style={s.budgetResultLabel}>Rest nach Bestellung:</Text>
          <View style={s.budgetResultRight}>
            <Text style={s.budgetResultValue}>{"\u20AC"}{data.budgetRemaining}</Text>
            <BudgetIndicator status={data.budgetStatus} />
          </View>
        </View>

        <View style={s.budgetBar}>
          <View
            style={[
              s.budgetBarUsed,
              { width: `${(parseFloat(data.budgetUsed.replace(".", "")) / parseFloat(data.budgetTotal.replace(".", ""))) * 100}%` },
            ]}
          />
          <View
            style={[
              s.budgetBarThis,
              {
                width: `${(parseFloat(data.thisOrder.replace(".", "")) / parseFloat(data.budgetTotal.replace(".", ""))) * 100}%`,
              },
            ]}
          />
        </View>
        <View style={s.budgetBarLegend}>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: Colors.raw.zinc500 }]} />
            <Text style={s.legendText}>Bestellt</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: Colors.raw.amber500 }]} />
            <Text style={s.legendText}>Diese Bestellung</Text>
          </View>
        </View>
      </Card>
    </>
  );
}

function NachtragContent({ data }: { data: NachtragData }) {
  return (
    <>
      <SectionLabel label="GRUND" />
      <Card>
        <View style={s.reasonHeader}>
          <Ionicons name="warning" size={20} color={Colors.raw.amber500} />
          <Text style={s.reasonTitle}>{data.reason}</Text>
        </View>
        <Text style={s.reasonDetail}>{data.discoveredAt}</Text>
      </Card>

      <SectionLabel label="FOTOS" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.photosContainer}
        style={s.photosScroll}
      >
        {Array.from({ length: data.photoCount }).map((_, i) => (
          <View key={i} style={s.photoCard}>
            <View style={s.photoPlaceholder}>
              <Ionicons name="image" size={32} color={Colors.raw.zinc600} />
              <Text style={s.photoLabel}>Foto {i + 1}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <SectionLabel label="KALKULATION" />
      <Card>
        {data.positions.map((pos, i) => (
          <View key={i} style={[s.posRow, i < data.positions.length - 1 && s.posRowBorder]}>
            <Text style={s.posName}>{pos.name}</Text>
            <Text style={s.posAmount}>{"\u20AC"}{pos.amount}</Text>
          </View>
        ))}
        <View style={s.matSumDivider} />
        <View style={s.matSumRow}>
          <Text style={s.matSumLabel}>Nachtrag:</Text>
          <Text style={s.matSumAmount}>{"\u20AC"}{data.summeNetto} netto</Text>
        </View>
      </Card>

      <SectionLabel label="VOB REFERENZ" />
      <Card>
        <View style={s.vobRow}>
          <Feather name="book-open" size={16} color={Colors.raw.zinc500} />
          <Text style={s.vobText}>{data.vobReference}</Text>
        </View>
        <Text style={s.vobDetail}>{data.vobDetail}</Text>
      </Card>
    </>
  );
}

function RejectionSheet({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const insets = useSafeAreaInsets();

  const handleSubmit = () => {
    if (reason.trim().length === 0) return;
    onSubmit(reason);
    setReason("");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={rejStyles.overlay}>
        <Pressable style={rejStyles.dismissArea} onPress={onClose} />
        <View style={[rejStyles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={rejStyles.handle} />
          <Text style={rejStyles.title}>Grund fur Ablehnung</Text>
          <TextInput
            style={rejStyles.input}
            placeholder="Begrundung eingeben..."
            placeholderTextColor={Colors.raw.zinc600}
            multiline
            numberOfLines={4}
            value={reason}
            onChangeText={setReason}
            testID="rejection-reason"
          />
          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => [
              rejStyles.submitButton,
              { opacity: reason.trim().length === 0 ? 0.5 : pressed ? 0.8 : 1 },
            ]}
            disabled={reason.trim().length === 0}
            testID="submit-rejection"
          >
            <Ionicons name="close-circle" size={20} color="#fff" />
            <Text style={rejStyles.submitText}>Ablehnung senden</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const rejStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.raw.zinc900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.raw.zinc700,
    alignSelf: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.raw.white,
    marginBottom: 20,
  },
  input: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.white,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.rose500,
    borderRadius: 14,
    paddingVertical: 16,
  },
  submitText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#fff",
  },
});

function ApprovedToast({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(300)}
      style={toastStyles.container}
    >
      <View style={toastStyles.inner}>
        <Ionicons name="checkmark-circle" size={24} color={Colors.raw.emerald500} />
        <Text style={toastStyles.text}>Freigegeben</Text>
      </View>
    </Animated.View>
  );
}

const toastStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    zIndex: 100,
    alignItems: "center",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.raw.zinc800,
    borderWidth: 1,
    borderColor: Colors.raw.emerald500 + "40",
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  text: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.emerald500,
  },
});

export default function FreigabeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [comment, setComment] = useState("");
  const [rejectionVisible, setRejectionVisible] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const approveFlash = useSharedValue(0);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: approveFlash.value,
  }));

  const handleApprove = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    approveFlash.value = withSequence(
      withTiming(0.4, { duration: 150 }),
      withTiming(0, { duration: 400 })
    );
    setShowToast(true);
    setTimeout(() => {
      router.back();
    }, 1200);
  }, [router, approveFlash]);

  const handleReject = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setRejectionVisible(true);
  }, []);

  const handleRejectionSubmit = useCallback(
    (_reason: string) => {
      setRejectionVisible(false);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      setTimeout(() => {
        router.back();
      }, 300);
    },
    [router]
  );

  const data = APPROVALS[id || "1"];
  if (!data) return null;

  const typeTitle =
    data.type === "angebot"
      ? "Angebot freigeben"
      : data.type === "material"
      ? "Material bestellen"
      : "Nachtrag genehmigen";

  const approveLabel =
    data.type === "angebot"
      ? "FREIGEBEN"
      : data.type === "material"
      ? "BESTELLEN"
      : "GENEHMIGEN";

  return (
    <View style={s.container}>
      <Animated.View
        style={[s.flashOverlay, { backgroundColor: Colors.raw.emerald500 }, flashStyle]}
        pointerEvents="none"
      />

      <ApprovedToast visible={showToast} />

      <View style={[s.backRow, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backButton, { opacity: pressed ? 0.7 : 1 }]}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <Text style={s.backLabel}>Freigaben</Text>
      </View>

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[
          s.scrollContent,
          {
            paddingTop: topInset + 64,
            paddingBottom: bottomInset + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.pageTitle}>{typeTitle}</Text>

        <StatusBadge status={data.status} color={Colors.raw.amber500} />
        <Text style={s.submittedAgo}>{data.submittedAgo} eingereicht</Text>

        <Card style={s.projectCard}>
          <Pressable
            style={({ pressed }) => [s.projectCardInner, { opacity: pressed ? 0.7 : 1 }]}
            testID="project-link"
          >
            <View style={s.projectLeft}>
              <Ionicons name="clipboard" size={18} color={Colors.raw.amber500} />
              <View style={{ flex: 1 }}>
                <Text style={s.projectCodeText}>
                  {data.projectCode} {"\u2022"} {data.projectAddress}
                </Text>
                <Text style={s.projectClientText}>
                  {data.client} {"\u2022"} {data.trade}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.raw.zinc600} />
          </Pressable>
        </Card>

        {data.type === "angebot" && <AngebotContent data={data} />}
        {data.type === "material" && <MaterialContent data={data} />}
        {data.type === "nachtrag" && <NachtragContent data={data} />}
      </ScrollView>

      <View style={[s.stickyBottom, { paddingBottom: Math.max(bottomInset, 20) }]}>
        <TextInput
          style={s.commentInput}
          placeholder="Anmerkung (optional)..."
          placeholderTextColor={Colors.raw.zinc600}
          value={comment}
          onChangeText={setComment}
          testID="comment-input"
        />
        <View style={s.actionButtons}>
          <Pressable
            onPress={handleReject}
            style={({ pressed }) => [
              s.rejectButton,
              { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
            testID="detail-reject-button"
          >
            <Ionicons name="close" size={22} color={Colors.raw.rose400} />
            <Text style={s.rejectText}>Nein</Text>
          </Pressable>
          <Pressable
            onPress={handleApprove}
            style={({ pressed }) => [
              s.approveButton,
              { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
            testID="detail-approve-button"
          >
            <Ionicons name="checkmark" size={24} color="#fff" />
            <Text style={s.approveText}>{approveLabel}</Text>
          </Pressable>
        </View>
      </View>

      <RejectionSheet
        visible={rejectionVisible}
        onClose={() => setRejectionVisible(false)}
        onSubmit={handleRejectionSubmit}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 90,
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
    backgroundColor: Colors.raw.zinc950 + "E0",
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.raw.zinc400,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 28,
    color: Colors.raw.white,
    marginBottom: 12,
  },
  submittedAgo: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc500,
    marginTop: 8,
    marginBottom: 24,
  },
  projectCard: {
    marginBottom: 24,
  },
  projectCardInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  projectLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  projectCodeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc300,
    marginBottom: 4,
  },
  projectClientText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: Colors.raw.zinc500,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    marginBottom: 10,
    marginTop: 8,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 24,
    marginBottom: 16,
  },
  amountLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginBottom: 4,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  amountBig: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 32,
    color: Colors.raw.white,
  },
  amountMedium: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.raw.zinc400,
  },
  amountDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.raw.zinc800,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  metaText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc400,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.raw.zinc600,
  },
  marginRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  marginLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc400,
  },
  marginAmount: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc500,
  },
  comparisonTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc400,
    marginBottom: 12,
  },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  comparisonAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  comparisonLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc500,
  },
  comparisonDivider: {
    height: 1,
    backgroundColor: Colors.raw.zinc800,
    marginVertical: 10,
  },
  comparisonDiffAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.white,
  },
  posRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  posRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  posName: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.zinc300,
    flex: 1,
    marginRight: 16,
  },
  posAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.white,
  },
  moreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
    marginTop: 4,
  },
  moreButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.amber500,
  },
  pdfPreview: {
    height: 200,
    borderRadius: 12,
    backgroundColor: Colors.raw.zinc800,
    marginBottom: 14,
    overflow: "hidden",
  },
  pdfPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pdfTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc400,
  },
  pdfMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc600,
  },
  pdfFullButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
  },
  pdfFullText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.amber500,
  },
  supplierHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  supplierIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.raw.amber500 + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  supplierName: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.raw.white,
    marginBottom: 2,
  },
  supplierMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  phoneButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.raw.emerald500 + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  matPosRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  matPosQty: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.raw.amber500,
    marginBottom: 2,
  },
  matPosName: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.zinc300,
  },
  matPosAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.white,
  },
  matSumDivider: {
    height: 1,
    backgroundColor: Colors.raw.zinc700,
    marginVertical: 10,
    marginHorizontal: -4,
  },
  matSumRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  matSumLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.zinc400,
  },
  matSumAmount: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 18,
    color: Colors.raw.white,
  },
  budgetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  budgetLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc400,
  },
  budgetValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc300,
  },
  budgetDivider: {
    height: 1,
    backgroundColor: Colors.raw.zinc700,
    marginVertical: 10,
  },
  budgetResultLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.white,
  },
  budgetResultRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  budgetResultValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.raw.white,
  },
  budgetBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.raw.zinc800,
    flexDirection: "row",
    overflow: "hidden",
    marginTop: 16,
    marginBottom: 10,
  },
  budgetBarUsed: {
    height: 8,
    backgroundColor: Colors.raw.zinc500,
  },
  budgetBarThis: {
    height: 8,
    backgroundColor: Colors.raw.amber500,
  },
  budgetBarLegend: {
    flexDirection: "row",
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
  },
  reasonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  reasonTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.white,
    flex: 1,
  },
  reasonDetail: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc400,
  },
  photosScroll: {
    marginHorizontal: -20,
    marginBottom: 16,
  },
  photosContainer: {
    paddingHorizontal: 20,
    gap: 12,
    flexDirection: "row",
  },
  photoCard: {
    width: 160,
    height: 120,
    borderRadius: 14,
    backgroundColor: Colors.raw.zinc900,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    overflow: "hidden",
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  photoLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.zinc600,
  },
  vobRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  vobText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc300,
    flex: 1,
  },
  vobDetail: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
    marginLeft: 26,
  },
  stickyBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.raw.zinc950 + "F5",
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  commentInput: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.white,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  rejectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minWidth: 100,
  },
  rejectText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.rose400,
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    borderRadius: 14,
    paddingVertical: 16,
    flex: 1,
  },
  approveText: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 17,
    color: "#fff",
    letterSpacing: 0.5,
  },
});
