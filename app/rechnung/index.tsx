import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  TextInput,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { useState, useMemo, useCallback } from "react";
import Colors from "@/constants/colors";
import { useInvoices } from "@/hooks/queries/useInvoices";
import { SkeletonCard } from "@/components/Skeleton";
import type { InvoiceListItem, SalesInvoiceStatus, SalesInvoiceType } from "@/lib/api/invoices";

// ── Helpers ────────────────────────────────────────────────

function formatEuro(amount: number): string {
  return (
    "\u20AC" +
    amount
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: "Entwurf", color: Colors.raw.zinc400, bg: Colors.raw.zinc400 + "18" },
  OPEN: { label: "Offen", color: Colors.raw.amber500, bg: Colors.raw.amber500 + "18" },
  SENT: { label: "Versendet", color: Colors.raw.amber500, bg: Colors.raw.amber500 + "18" },
  APPROVED: { label: "Freigegeben", color: Colors.raw.emerald500, bg: Colors.raw.emerald500 + "18" },
  PAID: { label: "Bezahlt", color: Colors.raw.emerald500, bg: Colors.raw.emerald500 + "18" },
  PAIDOFF: { label: "Bezahlt", color: Colors.raw.emerald500, bg: Colors.raw.emerald500 + "18" },
  OVERDUE: { label: "Überfällig", color: Colors.raw.rose500, bg: Colors.raw.rose500 + "18" },
  CANCELLED: { label: "Storniert", color: Colors.raw.zinc600, bg: Colors.raw.zinc600 + "18" },
  VOIDED: { label: "Ungültig", color: Colors.raw.zinc600, bg: Colors.raw.zinc600 + "18" },
};

const TYPE_LABELS: Record<string, string> = {
  ABSCHLAG: "Abschlag",
  TEIL: "Teilrechnung",
  SCHLUSS: "Schlussrechnung",
  GUTSCHRIFT: "Gutschrift",
};

type FilterTab = "alle" | "offen" | "bezahlt" | "entwurf";

// ── Components ─────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <View style={[dotS.badge, { backgroundColor: config.bg }]}>
      <View style={[dotS.dot, { backgroundColor: config.color }]} />
      <Text style={[dotS.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const dotS = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
});

function InvoiceCard({ item }: { item: InvoiceListItem }) {
  const isOverdue = item.status === "OVERDUE";
  const isPaid = item.status === "PAID" || item.status === "PAIDOFF";

  return (
    <Pressable
      onPress={() => router.push(`/rechnung/${item.id}` as any)}
      style={({ pressed }) => [cardS.card, isOverdue && cardS.cardOverdue, { opacity: pressed ? 0.85 : 1 }]}
      testID={`invoice-card-${item.invoice_number}`}
    >
      <View style={cardS.topRow}>
        <Text style={cardS.nr}>{item.invoice_number}</Text>
        <StatusDot status={item.status} />
      </View>

      <View style={cardS.midRow}>
        <Text style={cardS.client} numberOfLines={1}>
          {item.customer_name || "Kein Kunde"}
        </Text>
        {item.abschlag_number && (
          <Text style={cardS.typeBadge}>
            {TYPE_LABELS[item.invoice_type] || item.invoice_type}
            {item.abschlag_number ? ` #${item.abschlag_number}` : ""}
          </Text>
        )}
      </View>

      {(item.project_name || item.project_number) && (
        <View style={cardS.projectRow}>
          <Ionicons name="clipboard-outline" size={13} color={Colors.raw.zinc600} />
          <Text style={cardS.projectText} numberOfLines={1}>
            {item.project_number ? `${item.project_number} \u2022 ` : ""}
            {item.project_name}
          </Text>
        </View>
      )}

      <View style={cardS.bottomRow}>
        <Text style={cardS.date}>{formatDate(item.invoice_date)}</Text>
        <Text style={[cardS.amount, isPaid && cardS.amountPaid]}>
          {formatEuro(Number(item.total_gross))}
        </Text>
      </View>
    </Pressable>
  );
}

const cardS = StyleSheet.create({
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 16,
    marginBottom: 10,
  },
  cardOverdue: { borderColor: Colors.raw.rose500 + "40" },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  nr: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 15, fontWeight: "700", color: Colors.raw.white },
  midRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  client: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc300, flex: 1 },
  typeBadge: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.raw.zinc500, backgroundColor: Colors.raw.zinc800, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  projectRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  projectText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc500, flex: 1 },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  date: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc500 },
  amount: { fontFamily: "Inter_800ExtraBold", fontSize: 18, color: Colors.raw.white },
  amountPaid: { color: Colors.raw.emerald500 },
});

// ── Main ───────────────────────────────────────────────────

export default function RechnungListScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: invoices, isLoading, refetch, isRefetching } = useInvoices();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("alle");

  const filtered = useMemo(() => {
    if (!invoices) return [];
    let list = [...invoices];

    // Tab filter
    if (activeTab === "offen") {
      list = list.filter((i) => ["OPEN", "SENT", "OVERDUE", "APPROVED"].includes(i.status));
    } else if (activeTab === "bezahlt") {
      list = list.filter((i) => ["PAID", "PAIDOFF"].includes(i.status));
    } else if (activeTab === "entwurf") {
      list = list.filter((i) => i.status === "DRAFT");
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.invoice_number.toLowerCase().includes(q) ||
          (i.customer_name ?? "").toLowerCase().includes(q) ||
          (i.project_name ?? "").toLowerCase().includes(q) ||
          (i.description ?? "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [invoices, activeTab, search]);

  const tabs: { key: FilterTab; label: string; count: number }[] = useMemo(() => {
    if (!invoices) return [];
    return [
      { key: "alle", label: "Alle", count: invoices.length },
      { key: "offen", label: "Offen", count: invoices.filter((i) => ["OPEN", "SENT", "OVERDUE", "APPROVED"].includes(i.status)).length },
      { key: "entwurf", label: "Entwürfe", count: invoices.filter((i) => i.status === "DRAFT").length },
      { key: "bezahlt", label: "Bezahlt", count: invoices.filter((i) => ["PAID", "PAIDOFF"].includes(i.status)).length },
    ];
  }, [invoices]);

  const totalOpen = useMemo(() => {
    if (!invoices) return 0;
    return invoices
      .filter((i) => ["OPEN", "SENT", "OVERDUE", "APPROVED"].includes(i.status))
      .reduce((s, i) => s + Number(i.total_gross), 0);
  }, [invoices]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <Text style={s.headerTitle}>Rechnungen</Text>
        <Pressable
          onPress={() => router.push("/rechnung/neu" as any)}
          style={({ pressed }) => [s.addBtn, { opacity: pressed ? 0.8 : 1 }]}
          testID="new-invoice-btn"
        >
          <Ionicons name="add" size={22} color="#000" />
        </Pressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingTop: topInset + 64, paddingBottom: bottomInset + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={Colors.raw.amber500} />
        }
      >
        {/* Summary Card */}
        {!isLoading && invoices && invoices.length > 0 && (
          <Animated.View entering={FadeIn.duration(200)} style={s.summaryCard}>
            <Text style={s.summaryLabel}>Offene Forderungen</Text>
            <Text style={s.summaryAmount}>{formatEuro(totalOpen)}</Text>
            <Text style={s.summaryCount}>
              {invoices.filter((i) => ["OPEN", "SENT", "OVERDUE", "APPROVED"].includes(i.status)).length} offene Rechnungen
            </Text>
          </Animated.View>
        )}

        {/* Search */}
        <View style={s.searchWrap}>
          <Ionicons name="search" size={18} color={Colors.raw.zinc500} />
          <TextInput
            style={s.searchInput}
            placeholder="Rechnung suchen..."
            placeholderTextColor={Colors.raw.zinc600}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={Colors.raw.zinc500} />
            </Pressable>
          )}
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll} contentContainerStyle={s.tabRow}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[s.tab, activeTab === tab.key && s.tabActive]}
            >
              <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
                {tab.label}
              </Text>
              <View style={[s.tabCount, activeTab === tab.key && s.tabCountActive]}>
                <Text style={[s.tabCountText, activeTab === tab.key && s.tabCountTextActive]}>
                  {tab.count}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Loading */}
        {isLoading && (
          <View style={{ gap: 10 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        )}

        {/* Empty State */}
        {!isLoading && filtered.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="document-text-outline" size={48} color={Colors.raw.zinc700} />
            <Text style={s.emptyTitle}>
              {search ? "Keine Treffer" : "Noch keine Rechnungen"}
            </Text>
            <Text style={s.emptySub}>
              {search ? "Versuche einen anderen Suchbegriff" : "Erstelle deine erste Rechnung"}
            </Text>
            {!search && (
              <Pressable
                onPress={() => router.push("/rechnung/neu" as any)}
                style={({ pressed }) => [s.emptyBtn, { opacity: pressed ? 0.9 : 1 }]}
              >
                <Ionicons name="add" size={18} color="#000" />
                <Text style={s.emptyBtnText}>Neue Rechnung</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Invoice List */}
        {!isLoading &&
          filtered.map((inv, i) => (
            <Animated.View key={inv.id} entering={FadeIn.delay(i * 40).duration(200)}>
              <InvoiceCard item={inv} />
            </Animated.View>
          ))}
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────

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
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: Colors.raw.zinc950 + "E6",
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 20, color: Colors.raw.white },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.raw.amber500,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },

  // Summary
  summaryCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  summaryLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.raw.zinc500, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  summaryAmount: { fontFamily: "Inter_800ExtraBold", fontSize: 32, color: Colors.raw.white, marginTop: 4 },
  summaryCount: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc400, marginTop: 4 },

  // Search
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.raw.white },

  // Tabs
  tabScroll: { marginBottom: 16 },
  tabRow: { flexDirection: "row", gap: 8 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.raw.zinc900,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
  },
  tabActive: { backgroundColor: Colors.raw.amber500 + "15", borderColor: Colors.raw.amber500 + "40" },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc400 },
  tabTextActive: { color: Colors.raw.amber500 },
  tabCount: { backgroundColor: Colors.raw.zinc800, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tabCountActive: { backgroundColor: Colors.raw.amber500 + "25" },
  tabCountText: { fontFamily: "Inter_700Bold", fontSize: 11, color: Colors.raw.zinc500 },
  tabCountTextActive: { color: Colors.raw.amber500 },

  // Empty
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.raw.zinc400 },
  emptySub: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc600, textAlign: "center" },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  emptyBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#000" },
});
