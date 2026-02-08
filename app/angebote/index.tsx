import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useState, useMemo, useCallback } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type OfferStatus = "entwurf" | "offen" | "versendet" | "beauftragt" | "abgelehnt";

interface Offer {
  id: string;
  nr: string;
  address: string;
  addressDetail: string;
  client: string;
  trades: string;
  amountNetto: number;
  amountStr: string;
  positionen: number;
  margin: number;
  version: number;
  status: OfferStatus;
  dateLabel: string;
  waitingDays?: number;
}

const STATUS_CONFIG: Record<
  OfferStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  entwurf: {
    label: "Entwurf",
    color: Colors.raw.zinc400,
    bg: Colors.raw.zinc800,
    icon: "create-outline",
  },
  offen: {
    label: "Offen",
    color: Colors.raw.amber500,
    bg: Colors.raw.amber500 + "18",
    icon: "time-outline",
  },
  versendet: {
    label: "Versendet",
    color: "#3b82f6",
    bg: "#3b82f620",
    icon: "paper-plane-outline",
  },
  beauftragt: {
    label: "Beauftragt",
    color: Colors.raw.emerald500,
    bg: Colors.raw.emerald500 + "18",
    icon: "checkmark-circle-outline",
  },
  abgelehnt: {
    label: "Abgelehnt",
    color: Colors.raw.rose500,
    bg: Colors.raw.rose500 + "18",
    icon: "close-circle-outline",
  },
};

const OFFERS: Offer[] = [
  {
    id: "ang-003-02",
    nr: "ANG-2026-003-02",
    address: "Schwentnerring 13c",
    addressDetail: "EG Links",
    client: "SAGA GWG",
    trades: "Maler+Boden",
    amountNetto: 12400,
    amountStr: "12.400",
    positionen: 47,
    margin: 24,
    version: 2,
    status: "entwurf",
    dateLabel: "vor 2h",
  },
  {
    id: "ang-005-01",
    nr: "ANG-2026-005-01",
    address: "Haferweg 42",
    addressDetail: "2.OG Rechts",
    client: "SAGA GWG",
    trades: "Sanitär",
    amountNetto: 8900,
    amountStr: "8.900",
    positionen: 23,
    margin: 31,
    version: 1,
    status: "versendet",
    dateLabel: "vor 3T",
    waitingDays: 3,
  },
  {
    id: "ang-001-01",
    nr: "ANG-2026-001-01",
    address: "Bramfelder Str. 88",
    addressDetail: "",
    client: "Privat",
    trades: "Komplett",
    amountNetto: 14200,
    amountStr: "14.200",
    positionen: 62,
    margin: 28,
    version: 1,
    status: "beauftragt",
    dateLabel: "12.01.",
  },
  {
    id: "ang-007-01",
    nr: "ANG-2026-007-01",
    address: "Billstedt Hauptstr. 14",
    addressDetail: "3.OG",
    client: "GWG Genossenschaft",
    trades: "Maler",
    amountNetto: 6800,
    amountStr: "6.800",
    positionen: 18,
    margin: 19,
    version: 1,
    status: "offen",
    dateLabel: "vor 5T",
  },
  {
    id: "ang-009-01",
    nr: "ANG-2026-009-01",
    address: "Wandsbeker Chaussee 120",
    addressDetail: "1.OG Links",
    client: "Privat",
    trades: "Fliese+Sanitär",
    amountNetto: 9200,
    amountStr: "9.200",
    positionen: 31,
    margin: 26,
    version: 1,
    status: "beauftragt",
    dateLabel: "08.01.",
  },
  {
    id: "ang-011-01",
    nr: "ANG-2026-011-01",
    address: "Eppendorfer Weg 45",
    addressDetail: "EG",
    client: "Privat",
    trades: "Komplett",
    amountNetto: 22400,
    amountStr: "22.400",
    positionen: 85,
    margin: 22,
    version: 1,
    status: "beauftragt",
    dateLabel: "03.01.",
  },
  {
    id: "ang-010-01",
    nr: "ANG-2026-010-01",
    address: "Barmbeker Str. 77",
    addressDetail: "2.OG",
    client: "SAGA GWG",
    trades: "Maler",
    amountNetto: 4200,
    amountStr: "4.200",
    positionen: 12,
    margin: 15,
    version: 1,
    status: "abgelehnt",
    dateLabel: "28.12.",
  },
  {
    id: "ang-012-01",
    nr: "ANG-2026-012-01",
    address: "Alsterdorfer Str. 62",
    addressDetail: "DG",
    client: "Privat",
    trades: "Maler+Boden",
    amountNetto: 7100,
    amountStr: "7.100",
    positionen: 29,
    margin: 32,
    version: 1,
    status: "offen",
    dateLabel: "vor 1T",
  },
  {
    id: "ang-002-03",
    nr: "ANG-2026-002-03",
    address: "Winterhuder Weg 18",
    addressDetail: "1.OG",
    client: "SAGA GWG",
    trades: "Sanitär",
    amountNetto: 5600,
    amountStr: "5.600",
    positionen: 16,
    margin: 27,
    version: 3,
    status: "entwurf",
    dateLabel: "vor 6h",
  },
  {
    id: "ang-004-01",
    nr: "ANG-2026-004-01",
    address: "Bergedorfer Str. 33",
    addressDetail: "",
    client: "GWG Genossenschaft",
    trades: "Komplett",
    amountNetto: 31800,
    amountStr: "31.800",
    positionen: 110,
    margin: 25,
    version: 1,
    status: "beauftragt",
    dateLabel: "22.12.",
  },
  {
    id: "ang-006-02",
    nr: "ANG-2026-006-02",
    address: "Rothenburgsort 5",
    addressDetail: "2.OG",
    client: "Privat",
    trades: "Fliese",
    amountNetto: 3900,
    amountStr: "3.900",
    positionen: 14,
    margin: 21,
    version: 2,
    status: "versendet",
    dateLabel: "vor 8T",
    waitingDays: 8,
  },
  {
    id: "ang-008-01",
    nr: "ANG-2026-008-01",
    address: "Dulsberg Ring 12",
    addressDetail: "EG",
    client: "Privat",
    trades: "Maler",
    amountNetto: 2800,
    amountStr: "2.800",
    positionen: 9,
    margin: 18,
    version: 1,
    status: "beauftragt",
    dateLabel: "15.12.",
  },
];

type FilterType = "alle" | OfferStatus;
type SortType = "neueste" | "summe" | "status";

const FILTER_CHIPS: { key: FilterType; label: string; icon: string }[] = [
  { key: "alle", label: "Alle", icon: "layers-outline" },
  { key: "entwurf", label: "Entwurf", icon: "create-outline" },
  { key: "offen", label: "Offen", icon: "time-outline" },
  { key: "versendet", label: "Versendet", icon: "paper-plane-outline" },
  { key: "beauftragt", label: "Beauftragt", icon: "checkmark-circle-outline" },
  { key: "abgelehnt", label: "Abgelehnt", icon: "close-circle-outline" },
];

const SORT_OPTIONS: { key: SortType; label: string }[] = [
  { key: "neueste", label: "Neueste" },
  { key: "summe", label: "Summe \u2193" },
  { key: "status", label: "Status" },
];

const STATUS_ORDER: Record<OfferStatus, number> = {
  entwurf: 0,
  offen: 1,
  versendet: 2,
  beauftragt: 3,
  abgelehnt: 4,
};

function marginColor(margin: number): string {
  if (margin >= 22) return Colors.raw.emerald500;
  if (margin >= 15) return Colors.raw.amber500;
  return Colors.raw.rose500;
}

function OfferCard({ offer, onPress }: { offer: Offer; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const sc = STATUS_CONFIG[offer.status];
  const mc = marginColor(offer.margin);

  const actions = useMemo(() => {
    switch (offer.status) {
      case "entwurf":
        return [
          { label: "Bearbeiten", icon: "create-outline", primary: false },
          { label: "Zur Freigabe", icon: "arrow-forward", primary: true },
        ];
      case "offen":
      case "versendet":
        return [
          { label: "Nachfassen", icon: "arrow-forward", primary: true },
          { label: "PDF", icon: "document-text-outline", primary: false },
        ];
      case "beauftragt":
        return [
          { label: "PDF", icon: "document-text-outline", primary: false },
          { label: "Projekt", icon: "arrow-forward", primary: true },
        ];
      case "abgelehnt":
        return [
          { label: "Duplizieren", icon: "copy-outline", primary: false },
          { label: "Archivieren", icon: "archive-outline", primary: false },
        ];
      default:
        return [];
    }
  }, [offer.status]);

  return (
    <AnimatedPressable
      style={[cardStyles.card, animStyle]}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPress={onPress}
      testID={`offer-card-${offer.id}`}
    >
      <View style={cardStyles.topRow}>
        <View style={[cardStyles.statusBadge, { backgroundColor: sc.bg }]}>
          <Ionicons name={sc.icon as any} size={13} color={sc.color} />
          <Text style={[cardStyles.statusText, { color: sc.color }]}>{sc.label}</Text>
        </View>
        <Text style={cardStyles.dateText}>{offer.dateLabel}</Text>
      </View>

      <Text style={cardStyles.nrText}>{offer.nr}</Text>

      <Text style={cardStyles.addressText}>
        {offer.address}
        {offer.addressDetail ? ` ${offer.addressDetail}` : ""}
      </Text>

      <Text style={cardStyles.clientText}>
        {offer.client} {"\u2022"} {offer.trades}
      </Text>

      <View style={cardStyles.metricsRow}>
        <View style={cardStyles.amountCol}>
          <Text style={cardStyles.amountLabel}>{"\u20AC"}{offer.amountStr}</Text>
          <Text style={cardStyles.amountSub}>netto</Text>
        </View>
        <Text style={cardStyles.posText}>{offer.positionen} Positionen</Text>
      </View>

      <View style={cardStyles.marginRow}>
        <Text style={cardStyles.marginLabel}>
          Marge: {offer.margin}%
        </Text>
        <View style={[cardStyles.marginDot, { backgroundColor: mc }]} />
        {offer.version > 1 && (
          <Text style={cardStyles.versionText}>Version {offer.version}</Text>
        )}
      </View>

      {offer.waitingDays && offer.waitingDays > 0 && (
        <View style={cardStyles.waitingRow}>
          <Ionicons name="time-outline" size={14} color={Colors.raw.amber500} />
          <Text style={cardStyles.waitingText}>
            Warte auf Rückmeldung seit {offer.waitingDays} Tagen
          </Text>
        </View>
      )}

      <View style={cardStyles.actionsRow}>
        {actions.map((a, i) => (
          <Pressable
            key={i}
            onPress={(e) => {
              e.stopPropagation();
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              if (a.label === "Bearbeiten") {
                router.push({ pathname: "/angebot/editor", params: { offerId: offer.id } });
              }
            }}
            style={({ pressed }) => [
              cardStyles.actionBtn,
              a.primary ? cardStyles.actionPrimary : cardStyles.actionSecondary,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            {!a.primary && (
              <Ionicons
                name={a.icon as any}
                size={15}
                color={a.primary ? "#000" : Colors.raw.zinc300}
              />
            )}
            <Text
              style={
                a.primary ? cardStyles.actionPrimaryText : cardStyles.actionSecondaryText
              }
            >
              {a.label}
            </Text>
            {a.primary && (
              <Ionicons name={a.icon as any} size={15} color="#000" />
            )}
          </Pressable>
        ))}
      </View>
    </AnimatedPressable>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 18,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 0.2,
  },
  dateText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  nrText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  addressText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.raw.white,
    marginBottom: 4,
  },
  clientText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc400,
    marginBottom: 14,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  amountCol: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  amountLabel: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 22,
    color: Colors.raw.white,
  },
  amountSub: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  posText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  marginRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  marginLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc400,
  },
  marginDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  versionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.zinc600,
    marginLeft: "auto",
  },
  waitingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.raw.amber500 + "10",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
    marginTop: 4,
  },
  waitingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.amber400,
    flex: 1,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 11,
  },
  actionPrimary: {
    backgroundColor: Colors.raw.amber500,
  },
  actionSecondary: {
    backgroundColor: Colors.raw.zinc800,
  },
  actionPrimaryText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#000",
  },
  actionSecondaryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc300,
  },
});

export default function AngeboteListScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeFilter, setActiveFilter] = useState<FilterType>("alle");
  const [activeSort, setActiveSort] = useState<SortType>("neueste");

  const filtered = useMemo(() => {
    let result =
      activeFilter === "alle"
        ? [...OFFERS]
        : OFFERS.filter((o) => o.status === activeFilter);

    switch (activeSort) {
      case "summe":
        result.sort((a, b) => b.amountNetto - a.amountNetto);
        break;
      case "status":
        result.sort(
          (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
        );
        break;
      case "neueste":
      default:
        break;
    }
    return result;
  }, [activeFilter, activeSort]);

  const offenCount = OFFERS.filter(
    (o) => o.status === "offen" || o.status === "versendet" || o.status === "entwurf"
  ).length;

  const offenSum = OFFERS.filter(
    (o) => o.status === "offen" || o.status === "versendet"
  ).reduce((s, o) => s + o.amountNetto, 0);

  const beauftragtSum = OFFERS.filter((o) => o.status === "beauftragt").reduce(
    (s, o) => s + o.amountNetto,
    0
  );

  const totalDecided =
    OFFERS.filter((o) => o.status === "beauftragt").length +
    OFFERS.filter((o) => o.status === "abgelehnt").length;
  const beauftragtCount = OFFERS.filter((o) => o.status === "beauftragt").length;
  const quote = totalDecided > 0 ? Math.round((beauftragtCount / totalDecided) * 100) : 0;
  const quoteColor =
    quote >= 60
      ? Colors.raw.emerald500
      : quote >= 40
      ? Colors.raw.amber500
      : Colors.raw.rose500;

  const formatEuro = (n: number) =>
    n.toLocaleString("de-DE").replace(/\./g, ".") || "0";

  const handleCardPress = useCallback((offer: Offer) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/angebot/${offer.id}` as any);
  }, []);

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => router.push("/angebot/editor")}
          style={({ pressed }) => [s.newBtn, { opacity: pressed ? 0.8 : 1 }]}
          testID="new-offer-btn"
        >
          <Ionicons name="add" size={16} color="#000" />
          <Text style={s.newBtnText}>Neues Angebot</Text>
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.listContent,
          { paddingTop: topInset + 64, paddingBottom: bottomInset + 20 },
        ]}
        ListHeaderComponent={
          <>
            <Text style={s.pageTitle}>Angebote</Text>
            <Text style={s.pageSubtitle}>
              {offenCount} offen {"\u2022"} {OFFERS.length} gesamt
            </Text>

            <View style={s.statsBar}>
              <View style={s.statItem}>
                <Text style={s.statLabel}>Offen</Text>
                <Text style={s.statValue}>
                  {"\u20AC"}{formatEuro(offenSum)}
                </Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={s.statLabel}>Beauftragt</Text>
                <Text style={s.statValue}>
                  {"\u20AC"}{formatEuro(beauftragtSum)}
                </Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={s.statLabel}>Quote</Text>
                <View style={s.quoteRow}>
                  <Text style={[s.statValue, { color: quoteColor }]}>
                    {quote}%
                  </Text>
                  <View
                    style={[s.quoteDot, { backgroundColor: quoteColor }]}
                  />
                </View>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.filterRow}
            >
              {FILTER_CHIPS.map((chip) => {
                const isActive = activeFilter === chip.key;
                return (
                  <Pressable
                    key={chip.key}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setActiveFilter(chip.key);
                    }}
                    style={[
                      s.filterChip,
                      isActive ? s.filterChipActive : s.filterChipInactive,
                    ]}
                    testID={`filter-${chip.key}`}
                  >
                    <Ionicons
                      name={chip.icon as any}
                      size={14}
                      color={
                        isActive ? "#000" : Colors.raw.zinc500
                      }
                    />
                    <Text
                      style={[
                        s.filterChipText,
                        isActive
                          ? s.filterChipTextActive
                          : s.filterChipTextInactive,
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={s.sortRow}>
              {SORT_OPTIONS.map((opt) => {
                const isActive = activeSort === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setActiveSort(opt.key);
                    }}
                    style={[
                      s.sortChip,
                      isActive ? s.sortChipActive : s.sortChipInactive,
                    ]}
                    testID={`sort-${opt.key}`}
                  >
                    <Text
                      style={[
                        s.sortChipText,
                        isActive
                          ? s.sortChipTextActive
                          : s.sortChipTextInactive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        }
        renderItem={({ item }) => (
          <OfferCard offer={item} onPress={() => handleCardPress(item)} />
        )}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Ionicons
              name="document-text-outline"
              size={40}
              color={Colors.raw.zinc700}
            />
            <Text style={s.emptyTitle}>Noch keine Angebote</Text>
            <Pressable
              style={({ pressed }) => [
                s.emptyBtn,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Ionicons name="add" size={18} color="#000" />
              <Text style={s.emptyBtnText}>Erstes Angebot erstellen</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
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
    backgroundColor: Colors.raw.zinc950 + "E6",
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 4,
  },
  newBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#000",
  },
  listContent: {
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 28,
    color: Colors.raw.white,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.zinc500,
    marginBottom: 16,
  },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.raw.zinc500,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 15,
    color: Colors.raw.white,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.raw.zinc800,
  },
  quoteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quoteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterRow: {
    gap: 8,
    paddingBottom: 12,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  filterChipActive: {
    backgroundColor: Colors.raw.amber500,
  },
  filterChipInactive: {
    backgroundColor: Colors.raw.zinc900,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
  },
  filterChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  filterChipTextActive: {
    color: "#000",
  },
  filterChipTextInactive: {
    color: Colors.raw.zinc400,
  },
  sortRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  sortChip: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sortChipActive: {
    backgroundColor: Colors.raw.zinc800,
  },
  sortChipInactive: {
    backgroundColor: "transparent",
  },
  sortChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  sortChipTextActive: {
    color: Colors.raw.white,
  },
  sortChipTextInactive: {
    color: Colors.raw.zinc600,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 14,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: Colors.raw.zinc500,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 4,
  },
  emptyBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#000",
  },
});
