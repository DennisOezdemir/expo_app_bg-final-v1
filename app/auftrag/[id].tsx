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
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback, useMemo } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface AuftragPosition {
  id: string;
  nr: string;
  title: string;
  desc: string;
  qty: number;
  unit: string;
  price: number;
  trade: string;
}

interface AuftragRoom {
  id: string;
  icon: string;
  name: string;
  positions: AuftragPosition[];
}

const INITIAL_ROOMS: AuftragRoom[] = [
  {
    id: "r1",
    icon: "water",
    name: "Bad",
    positions: [
      { id: "p1", nr: "01", title: "Wandfliesen Bad", desc: "Wandfliesen im Dünnbett verlegen inkl. Grundierung, Kleber und Verfugung.", qty: 28, unit: "m\u00B2", price: 54.4, trade: "Fliesen" },
      { id: "p2", nr: "02", title: "Bodenfliesen Bad", desc: "Bodenfliesen im Dünnbett verlegen inkl. Grundierung, Kleber und Verfugung.", qty: 6, unit: "m\u00B2", price: 70, trade: "Fliesen" },
      { id: "p3", nr: "03", title: "Waschtisch montieren", desc: "Waschtisch inkl. Einhandmischer und Siphon montieren.", qty: 1, unit: "Stk", price: 180, trade: "Sanit\u00E4r" },
      { id: "p4", nr: "04", title: "WC montieren", desc: "Wand-WC inkl. Bet\u00E4tigungsplatte und Anschluss montieren.", qty: 1, unit: "Stk", price: 220, trade: "Sanit\u00E4r" },
      { id: "p5", nr: "05", title: "Silikonfugen", desc: "Silikonfugen erneuern, Altsilikon entfernen.", qty: 15, unit: "lfm", price: 8.5, trade: "Fliesen" },
      { id: "p6", nr: "06", title: "Decke streichen", desc: "Deckenfl. mit Dispersionsfarbe streichen.", qty: 6, unit: "m\u00B2", price: 5.2, trade: "Maler" },
    ],
  },
  {
    id: "r2",
    icon: "restaurant",
    name: "K\u00FCche",
    positions: [
      { id: "p7", nr: "01", title: "W\u00E4nde tapezieren (Vlies)", desc: "Malervlies glatt auf vorbereiteten Untergrund tapezieren.", qty: 32, unit: "m\u00B2", price: 9.6, trade: "Maler" },
      { id: "p8", nr: "02", title: "W\u00E4nde streichen", desc: "Wandfl\u00E4chen streichen mit Dispersionsfarbe, deckend.", qty: 32, unit: "m\u00B2", price: 4.8, trade: "Maler" },
      { id: "p9", nr: "03", title: "Decke streichen", desc: "Deckenfl\u00E4chen mit Dispersionsfarbe streichen.", qty: 12, unit: "m\u00B2", price: 5.2, trade: "Maler" },
      { id: "p10", nr: "04", title: "Boden schleifen", desc: "Parkettboden maschinell schleifen.", qty: 12, unit: "m\u00B2", price: 38, trade: "Boden" },
      { id: "p11", nr: "05", title: "Boden versiegeln", desc: "Parkettboden 2x versiegeln mit Parkettlack.", qty: 12, unit: "m\u00B2", price: 38, trade: "Boden" },
    ],
  },
  {
    id: "r3",
    icon: "home",
    name: "Wohnzimmer",
    positions: [
      { id: "p12", nr: "01", title: "Altbelag entfernen", desc: "Vorhandenen Bodenbelag entfernen und entsorgen.", qty: 25, unit: "m\u00B2", price: 6.5, trade: "Boden" },
      { id: "p13", nr: "02", title: "Untergrund spachteln", desc: "Untergrund ausgleichen mit Nivelliermasse.", qty: 25, unit: "m\u00B2", price: 8, trade: "Boden" },
      { id: "p14", nr: "03", title: "W\u00E4nde spachteln Q3", desc: "Spachtelarbeiten Q3 auf Gipskartonplatten.", qty: 45, unit: "m\u00B2", price: 6.8, trade: "Maler" },
      { id: "p15", nr: "04", title: "W\u00E4nde streichen 2x", desc: "Dispersionsfarbe deckend in zwei Anstrichen.", qty: 45, unit: "m\u00B2", price: 4.8, trade: "Maler" },
      { id: "p16", nr: "05", title: "Decke streichen", desc: "Deckenfl\u00E4chen streichen.", qty: 25, unit: "m\u00B2", price: 5.2, trade: "Maler" },
      { id: "p17", nr: "06", title: "Laminat verlegen", desc: "Laminat NK32 schwimmend verlegen inkl. Trittschalld\u00E4mmung.", qty: 25, unit: "m\u00B2", price: 24.5, trade: "Boden" },
      { id: "p18", nr: "07", title: "Sockelleisten montieren", desc: "Sockelleisten aus MDF montieren.", qty: 20, unit: "lfm", price: 12.5, trade: "Boden" },
      { id: "p19", nr: "08", title: "Endreinigung", desc: "Endreinigung nach Abschluss aller Arbeiten.", qty: 1, unit: "Pauschal", price: 180, trade: "Allg." },
    ],
  },
  {
    id: "r4",
    icon: "bed",
    name: "Schlafzimmer",
    positions: [
      { id: "p20", nr: "01", title: "Raufaser tapezieren", desc: "Raufasertapete auf vorbereiteten Untergrund.", qty: 38, unit: "m\u00B2", price: 8.4, trade: "Maler" },
      { id: "p21", nr: "02", title: "W\u00E4nde streichen", desc: "Dispersionsfarbe deckend.", qty: 38, unit: "m\u00B2", price: 4.8, trade: "Maler" },
      { id: "p22", nr: "03", title: "Decke streichen", desc: "Deckenfl\u00E4chen streichen.", qty: 14, unit: "m\u00B2", price: 5.2, trade: "Maler" },
      { id: "p23", nr: "04", title: "Laminat verlegen", desc: "Laminat NK32 schwimmend verlegen.", qty: 14, unit: "m\u00B2", price: 24.5, trade: "Boden" },
    ],
  },
];

function formatEuro(amount: number): string {
  return "\u20AC" + amount.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

const TRADE_ICONS: Record<string, string> = {
  "Maler": "color-palette",
  "Fliesen": "grid",
  "Boden": "layers",
  "Sanit\u00E4r": "water",
  "Allg.": "construct",
};

export default function AuftragScreen() {
  const { id: _id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set(["r1", "r2"]));

  const toggleRoom = useCallback((roomId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });
  }, []);

  const tradeSummary = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    let grandTotal = 0;
    INITIAL_ROOMS.forEach((room) => {
      room.positions.forEach((pos) => {
        const posTotal = pos.qty * pos.price;
        grandTotal += posTotal;
        const existing = map.get(pos.trade);
        if (existing) {
          existing.count++;
          existing.total += posTotal;
        } else {
          map.set(pos.trade, { count: 1, total: posTotal });
        }
      });
    });
    const trades = Array.from(map.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, data]) => ({ name, ...data }));
    return { trades, grandTotal };
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
        <View style={s.headerCenter}>
          <Text style={s.headerCode}>BL-2026-023</Text>
          <Text style={s.headerTitle}>Auftrag</Text>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: bottomInset + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.tradeCard}>
          <View style={s.tradeCardHeader}>
            <Text style={s.tradeCardTitle}>Gewerke</Text>
            <Text style={s.tradeCardTotal}>{formatEuro(tradeSummary.grandTotal)}</Text>
          </View>
          <View style={s.tradeDivider} />
          {tradeSummary.trades.map((trade, idx) => {
            const icon = TRADE_ICONS[trade.name] || "construct";
            const percent = tradeSummary.grandTotal > 0
              ? Math.round((trade.total / tradeSummary.grandTotal) * 100)
              : 0;
            return (
              <View
                key={trade.name}
                style={[s.tradeRow, idx < tradeSummary.trades.length - 1 && s.tradeRowBorder]}
              >
                <View style={s.tradeIconWrap}>
                  <Ionicons name={icon as any} size={16} color={Colors.raw.amber500} />
                </View>
                <View style={s.tradeInfo}>
                  <Text style={s.tradeName}>{trade.name}</Text>
                  <Text style={s.tradeCount}>{trade.count} Pos.</Text>
                </View>
                <View style={s.tradeBarWrap}>
                  <View style={s.tradeBarBg}>
                    <View style={[s.tradeBarFill, { width: `${percent}%` }]} />
                  </View>
                </View>
                <Text style={s.tradeTotal}>{formatEuro(trade.total)}</Text>
              </View>
            );
          })}
        </View>

        {INITIAL_ROOMS.map((room) => {
          const isExpanded = expandedRooms.has(room.id);
          const roomTotal = room.positions.reduce((sum, p) => sum + p.qty * p.price, 0);

          return (
            <View key={room.id} style={s.roomCard} testID={`room-${room.id}`}>
              <Pressable
                style={s.roomHeader}
                onPress={() => toggleRoom(room.id)}
              >
                <View style={s.roomIconWrap}>
                  <Ionicons name={room.icon as any} size={18} color={Colors.raw.amber500} />
                </View>
                <View style={s.roomInfo}>
                  <Text style={s.roomName}>{room.name}</Text>
                  <Text style={s.roomMeta}>{room.positions.length} Positionen</Text>
                </View>
                <Text style={s.roomTotal}>{formatEuro(roomTotal)}</Text>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={Colors.raw.zinc500}
                />
              </Pressable>

              {isExpanded && (
                <View style={s.roomBody}>
                  {room.positions.map((pos) => {
                    const total = pos.qty * pos.price;
                    return (
                      <View key={pos.id} style={s.posRow} testID={`pos-${pos.id}`}>
                        <View style={s.posBody}>
                          <View style={s.posTitleRow}>
                            <Text style={s.posNr}>{pos.nr}</Text>
                            <Text style={s.posTitle} numberOfLines={1}>{pos.title}</Text>
                          </View>
                          <Text style={s.posDesc} numberOfLines={2}>{pos.desc}</Text>
                          <View style={s.posMetaRow}>
                            <Text style={s.posMeta}>{pos.qty} {pos.unit}</Text>
                            <View style={s.posDot} />
                            <Text style={s.posMeta}>{formatEuro(pos.price)}/{pos.unit}</Text>
                            <View style={s.posDot} />
                            <View style={s.posTradeBadge}>
                              <Text style={s.posTradeText}>{pos.trade}</Text>
                            </View>
                          </View>
                        </View>
                        <Text style={s.posTotal}>{formatEuro(total)}</Text>
                      </View>
                    );
                  })}
                  <View style={s.roomSumRow}>
                    <Text style={s.roomSumLabel}>Summe {room.name}</Text>
                    <Text style={s.roomSumValue}>{formatEuro(roomTotal)}</Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
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
});
