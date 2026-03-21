import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback, useMemo } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuftragDetail } from "@/hooks/queries/useAuftragDetail";

// ─── Types ───────────────────────────────────────────────────────────
interface Project {
  id: string;
  project_number: string;
  name: string;
  display_name: string | null;
  object_street: string;
  object_zip: string;
  object_city: string;
  status: string;
}

interface OfferRow {
  id: string;
  offer_number: string;
  status: string;
  total_net: number;
}

interface Position {
  id: string;
  position_number: number;
  title: string;
  description: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  trade: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────
function formatEuro(amount: number): string {
  return (
    "\u20AC" +
    amount
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  );
}

const TRADE_ICONS: Record<string, string> = {
  Maler: "color-palette",
  Fliesen: "grid",
  Boden: "layers",
  "Sanitär": "water",
  Elektro: "flash",
  Trockenbau: "cube",
  Sonstiges: "construct",
  "Allg.": "construct",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Entwurf", color: Colors.raw.zinc400 },
  SENT: { label: "Versendet", color: Colors.raw.amber500 },
  ACCEPTED: { label: "Beauftragt", color: Colors.raw.emerald500 },
  REJECTED: { label: "Abgelehnt", color: Colors.raw.rose500 },
};

export default function AuftragScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: auftragData, isLoading: loading } = useAuftragDetail(id);

  const project = auftragData?.project ?? null;
  const offers = auftragData?.offers ?? [];
  const positions = auftragData?.positions ?? {};

  const [activeOfferId, setActiveOfferId] = useState<string | null>(null);
  const [expandedTrades, setExpandedTrades] = useState<Set<string>>(new Set());

  // Auto-select first offer and expand first 2 trades
  const effectiveOfferId = useMemo(() => {
    if (activeOfferId) return activeOfferId;
    if (offers.length > 0) return offers[0].id;
    return null;
  }, [activeOfferId, offers]);

  // Auto-expand first 2 trades on initial load
  useMemo(() => {
    if (expandedTrades.size === 0 && effectiveOfferId && positions[effectiveOfferId]) {
      const firstPositions = positions[effectiveOfferId] || [];
      const trades = [...new Set(firstPositions.map((p) => p.trade))];
      if (trades.length > 0) setExpandedTrades(new Set(trades.slice(0, 2)));
    }
  }, [effectiveOfferId, positions]);

  // ─── Active offer positions & trade summary ────────────────────────
  const activePositions = useMemo(
    () => (effectiveOfferId ? positions[effectiveOfferId] || [] : []),
    [effectiveOfferId, positions]
  );

  const tradeSummary = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    let grandTotal = 0;
    activePositions.forEach((pos) => {
      grandTotal += pos.total_price;
      const existing = map.get(pos.trade);
      if (existing) {
        existing.count++;
        existing.total += pos.total_price;
      } else {
        map.set(pos.trade, { count: 1, total: pos.total_price });
      }
    });
    const trades = Array.from(map.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, data]) => ({ name, ...data }));
    return { trades, grandTotal };
  }, [activePositions]);

  // ─── Positions grouped by trade ────────────────────────────────────
  const positionsByTrade = useMemo(() => {
    const map = new Map<string, Position[]>();
    activePositions.forEach((pos) => {
      const arr = map.get(pos.trade) || [];
      arr.push(pos);
      map.set(pos.trade, arr);
    });
    // Sort trades by total descending
    return Array.from(map.entries()).sort((a, b) => {
      const totalA = a[1].reduce((s, p) => s + p.total_price, 0);
      const totalB = b[1].reduce((s, p) => s + p.total_price, 0);
      return totalB - totalA;
    });
  }, [activePositions]);

  const toggleTrade = useCallback((trade: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedTrades((prev) => {
      const next = new Set(prev);
      if (next.has(trade)) next.delete(trade);
      else next.add(trade);
      return next;
    });
  }, []);

  const switchOffer = useCallback(
    (offerId: string) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setActiveOfferId(offerId);
      // Auto-expand first 2 trades of the selected offer
      const offerPos = positions[offerId] || [];
      const trades = [...new Set(offerPos.map((p) => p.trade))];
      setExpandedTrades(new Set(trades.slice(0, 2)));
    },
    [positions]
  );

  // ─── Address ───────────────────────────────────────────────────────
  const address = project
    ? `${project.object_street}, ${project.object_zip} ${project.object_city}`
    : "";

  // ─── Loading state ─────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[s.container, s.loadingWrap]}>
        <ActivityIndicator size="large" color={Colors.raw.amber500} />
        <Text style={s.loadingText}>Auftrag laden…</Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={[s.container, s.loadingWrap]}>
        <Ionicons name="alert-circle" size={40} color={Colors.raw.rose500} />
        <Text style={s.loadingText}>Projekt nicht gefunden</Text>
        <Pressable onPress={() => router.back()} style={s.errorBackBtn}>
          <Text style={s.errorBackText}>Zurück</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* ─── Header ─────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerCode}>{project.project_number}</Text>
          <Text style={s.headerTitle}>Auftrag</Text>
          <Text style={s.headerAddress}>{address}</Text>
        </View>
      </View>

      {/* ─── Offer Tabs ─────────────────────────────────── */}
      {offers.length > 1 && (
        <View style={s.tabBar}>
          {offers.map((offer) => {
            const isActive = offer.id === effectiveOfferId;
            const st = STATUS_LABELS[offer.status] || STATUS_LABELS.DRAFT;
            return (
              <Pressable
                key={offer.id}
                onPress={() => switchOffer(offer.id)}
                style={[s.tab, isActive && s.tabActive]}
              >
                <Text style={[s.tabNr, isActive && s.tabNrActive]}>
                  {offer.offer_number}
                </Text>
                <View style={s.tabMeta}>
                  <View
                    style={[s.tabDot, { backgroundColor: st.color }]}
                  />
                  <Text style={s.tabStatus}>{st.label}</Text>
                  <Text style={s.tabAmount}>
                    {formatEuro(offer.total_net)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* ─── Content ────────────────────────────────────── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: bottomInset + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Trade summary card */}
        <View style={s.tradeCard}>
          <View style={s.tradeCardHeader}>
            <Text style={s.tradeCardTitle}>Gewerke</Text>
            <Text style={s.tradeCardTotal}>
              {formatEuro(tradeSummary.grandTotal)}
            </Text>
          </View>
          <View style={s.tradeDivider} />
          {tradeSummary.trades.map((trade, idx) => {
            const icon = TRADE_ICONS[trade.name] || "construct";
            const percent =
              tradeSummary.grandTotal > 0
                ? Math.round(
                    (trade.total / tradeSummary.grandTotal) * 100
                  )
                : 0;
            return (
              <View
                key={trade.name}
                style={[
                  s.tradeRow,
                  idx < tradeSummary.trades.length - 1 && s.tradeRowBorder,
                ]}
              >
                <View style={s.tradeIconWrap}>
                  <Ionicons
                    name={icon as any}
                    size={16}
                    color={Colors.raw.amber500}
                  />
                </View>
                <View style={s.tradeInfo}>
                  <Text style={s.tradeName}>{trade.name}</Text>
                  <Text style={s.tradeCount}>{trade.count} Pos.</Text>
                </View>
                <View style={s.tradeBarWrap}>
                  <View style={s.tradeBarBg}>
                    <View
                      style={[s.tradeBarFill, { width: `${percent}%` }]}
                    />
                  </View>
                </View>
                <Text style={s.tradeTotal}>{formatEuro(trade.total)}</Text>
              </View>
            );
          })}
        </View>

        {/* Positions grouped by trade */}
        {positionsByTrade.map(([trade, tradePositions]) => {
          const isExpanded = expandedTrades.has(trade);
          const tradeTotal = tradePositions.reduce(
            (sum, p) => sum + p.total_price,
            0
          );
          const icon = TRADE_ICONS[trade] || "construct";

          return (
            <View key={trade} style={s.roomCard} testID={`trade-${trade}`}>
              <Pressable
                style={s.roomHeader}
                onPress={() => toggleTrade(trade)}
              >
                <View style={s.roomIconWrap}>
                  <Ionicons
                    name={icon as any}
                    size={18}
                    color={Colors.raw.amber500}
                  />
                </View>
                <View style={s.roomInfo}>
                  <Text style={s.roomName}>{trade}</Text>
                  <Text style={s.roomMeta}>
                    {tradePositions.length} Positionen
                  </Text>
                </View>
                <Text style={s.roomTotal}>{formatEuro(tradeTotal)}</Text>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={Colors.raw.zinc500}
                />
              </Pressable>

              {isExpanded && (
                <View style={s.roomBody}>
                  {tradePositions.map((pos) => (
                    <View
                      key={pos.id}
                      style={s.posRow}
                      testID={`pos-${pos.id}`}
                    >
                      <View style={s.posBody}>
                        <View style={s.posTitleRow}>
                          <Text style={s.posNr}>
                            {String(pos.position_number).padStart(2, "0")}
                          </Text>
                          <Text style={s.posTitle} numberOfLines={1}>
                            {pos.title}
                          </Text>
                        </View>
                        {pos.description ? (
                          <Text style={s.posDesc} numberOfLines={2}>
                            {pos.description}
                          </Text>
                        ) : null}
                        <View style={s.posMetaRow}>
                          <Text style={s.posMeta}>
                            {pos.quantity} {pos.unit}
                          </Text>
                          <View style={s.posDot} />
                          <Text style={s.posMeta}>
                            {formatEuro(pos.unit_price)}/{pos.unit}
                          </Text>
                          <View style={s.posDot} />
                          <View style={s.posTradeBadge}>
                            <Text style={s.posTradeText}>{pos.trade}</Text>
                          </View>
                        </View>
                      </View>
                      <Text style={s.posTotal}>
                        {formatEuro(pos.total_price)}
                      </Text>
                    </View>
                  ))}
                  <View style={s.roomSumRow}>
                    <Text style={s.roomSumLabel}>Summe {trade}</Text>
                    <Text style={s.roomSumValue}>
                      {formatEuro(tradeTotal)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* Empty state */}
        {activePositions.length === 0 && (
          <View style={s.emptyWrap}>
            <Ionicons
              name="document-text-outline"
              size={40}
              color={Colors.raw.zinc700}
            />
            <Text style={s.emptyText}>Keine Positionen vorhanden</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc500,
  },
  errorBackBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.raw.zinc800,
  },
  errorBackText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
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
  },
  headerCode: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.zinc500,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
  },
  headerAddress: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginTop: 2,
  },
  // ─── Offer tabs ────────────────────────
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.raw.zinc900,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
  },
  tabActive: {
    borderColor: Colors.raw.amber500,
    backgroundColor: Colors.raw.amber500 + "10",
  },
  tabNr: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc400,
  },
  tabNrActive: {
    color: Colors.raw.amber500,
  },
  tabMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tabStatus: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.raw.zinc500,
  },
  tabAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: Colors.raw.zinc300,
    marginLeft: "auto",
  },
  // ─── Scroll / trade card ───────────────
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tradeCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  tradeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  tradeCardTitle: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 18,
    color: Colors.raw.white,
  },
  tradeCardTotal: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 20,
    color: Colors.raw.emerald500,
  },
  tradeDivider: {
    height: 1,
    backgroundColor: Colors.raw.zinc800,
    marginVertical: 16,
  },
  tradeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  tradeRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800 + "60",
  },
  tradeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.raw.amber500 + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  tradeInfo: {
    width: 70,
  },
  tradeName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.white,
  },
  tradeCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.raw.zinc500,
  },
  tradeBarWrap: {
    flex: 1,
  },
  tradeBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.raw.zinc800,
    overflow: "hidden",
  },
  tradeBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.raw.amber500,
  },
  tradeTotal: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.raw.zinc300,
    minWidth: 75,
    textAlign: "right",
  },
  // ─── Trade sections (like rooms before) ─
  roomCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    marginBottom: 12,
    overflow: "hidden",
  },
  roomHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 10,
  },
  roomIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.raw.amber500 + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.white,
  },
  roomMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginTop: 1,
  },
  roomTotal: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.raw.zinc300,
  },
  roomBody: {
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
  },
  posRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800 + "60",
  },
  posBody: {
    flex: 1,
  },
  posTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
  },
  posNr: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 11,
    color: Colors.raw.amber500,
    minWidth: 22,
  },
  posTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.white,
    flex: 1,
  },
  posDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginBottom: 6,
    lineHeight: 17,
  },
  posMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  posMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.raw.zinc500,
  },
  posDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.raw.zinc700,
  },
  posTradeBadge: {
    backgroundColor: Colors.raw.amber500 + "14",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  posTradeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.raw.amber500,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  posTotal: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.raw.zinc300,
    marginTop: 2,
  },
  roomSumRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.raw.zinc800 + "40",
  },
  roomSumLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc400,
  },
  roomSumValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.raw.white,
  },
  // ─── Empty state ───────────────────────
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc500,
  },
});
