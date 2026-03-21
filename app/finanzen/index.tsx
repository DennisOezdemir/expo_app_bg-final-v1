import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useState, useCallback, useMemo } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import {
  useFinanceOverview,
  useProjectControlling,
  useCostsByCategory,
  useOpenPurchaseInvoices,
  useSalesInvoices,
  useOpenChangeOrders,
} from "@/hooks/queries/useFinance";
import type {
  ProjectControllingRow,
  OpenInvoiceRow,
  CostByCategory,
  ChangeOrderRow,
} from "@/lib/api/finance";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

// ─── Helpers ────────────────────────────────────────────────────────────

function formatEuro(amount: number): string {
  if (Math.abs(amount) >= 1000) {
    return (
      (amount < 0 ? "-" : "") +
      "\u20AC" +
      Math.abs(amount)
        .toFixed(0)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    );
  }
  return "\u20AC" + amount.toFixed(2).replace(".", ",");
}

function formatEuroCompact(amount: number): string {
  if (Math.abs(amount) >= 1000) {
    return (amount < 0 ? "-" : "") + "\u20AC" + (Math.abs(amount) / 1000).toFixed(1).replace(".", ",") + "k";
  }
  return formatEuro(amount);
}

function getMarginStatus(percent: number): "green" | "yellow" | "red" {
  if (percent >= 20) return "green";
  if (percent >= 10) return "yellow";
  return "red";
}

function getStatusColor(status: "green" | "yellow" | "red"): string {
  if (status === "green") return Colors.raw.emerald500;
  if (status === "yellow") return Colors.raw.amber500;
  return Colors.raw.rose500;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "–";
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  MATERIAL: Colors.raw.amber500,
  SUBCONTRACTOR: "#8b5cf6",
  LABOR: "#3b82f6",
  SOFTWARE: "#06b6d4",
  OFFICE: Colors.raw.zinc400,
  DISPOSAL: "#f97316",
  VEHICLE_FUEL: "#ef4444",
  VEHICLE_REPAIR: "#ec4899",
  VEHICLE_RENTAL: "#a855f7",
  OTHER: Colors.raw.zinc500,
};

// ─── Hero Cards ─────────────────────────────────────────────────────────

function HeroCard({
  value,
  label,
  sub,
  subColor,
}: {
  value: string;
  label: string;
  sub?: string;
  subColor?: string;
}) {
  return (
    <View style={heroStyles.card}>
      <Text style={heroStyles.value}>{value}</Text>
      <Text style={heroStyles.label}>{label}</Text>
      {sub && (
        <Text style={[heroStyles.sub, subColor ? { color: subColor } : undefined]}>
          {sub}
        </Text>
      )}
    </View>
  );
}

const heroStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 18,
    minHeight: 110,
  },
  value: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 22,
    color: Colors.raw.white,
    marginBottom: 4,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc400,
    marginBottom: 6,
  },
  sub: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.emerald500,
  },
});

// ─── Margin Bar ─────────────────────────────────────────────────────────

function MarginBar({ percent, status }: { percent: number; status: "green" | "yellow" | "red" }) {
  const barColor = getStatusColor(status);
  const filled = Math.min(Math.max(percent, 0) / 50, 1);
  return (
    <View style={marginBarStyles.track}>
      <View style={[marginBarStyles.fill, { width: `${filled * 100}%`, backgroundColor: barColor }]} />
    </View>
  );
}

const marginBarStyles = StyleSheet.create({
  track: { height: 6, borderRadius: 3, backgroundColor: Colors.raw.zinc800, flex: 1 },
  fill: { height: 6, borderRadius: 3 },
});

// ─── Project Row ────────────────────────────────────────────────────────

function ProjectRow({ project }: { project: ProjectControllingRow }) {
  const status = getMarginStatus(project.marginPercent);
  const statusColor = getStatusColor(status);

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/project/[id]", params: { id: project.id } });
      }}
      style={({ pressed }) => [projStyles.row, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={projStyles.rowTop}>
        <View style={projStyles.rowLeft}>
          <View style={[projStyles.dot, { backgroundColor: statusColor }]} />
          <Text style={projStyles.code} numberOfLines={1}>{project.projectNumber}</Text>
          <Text style={projStyles.name} numberOfLines={1}>{project.name}</Text>
        </View>
        <View style={projStyles.rowRight}>
          <Text style={[projStyles.margin, { color: statusColor }]}>
            {project.marginPercent.toFixed(0)}%
          </Text>
        </View>
      </View>

      <View style={projStyles.rowMid}>
        <View style={projStyles.detailCol}>
          <Text style={projStyles.detailLabel}>Auftrag</Text>
          <Text style={projStyles.detailValue}>{formatEuroCompact(project.offerTotal)}</Text>
        </View>
        <View style={projStyles.detailCol}>
          <Text style={projStyles.detailLabel}>Kosten</Text>
          <Text style={projStyles.detailValue}>{formatEuroCompact(project.costTotal)}</Text>
        </View>
        <View style={projStyles.detailCol}>
          <Text style={projStyles.detailLabel}>DB</Text>
          <Text style={[projStyles.detailValue, { color: statusColor }]}>
            {formatEuroCompact(project.margin)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <MarginBar percent={project.marginPercent} status={status} />
        </View>
      </View>

      <View style={projStyles.rowBottom}>
        {project.clientName && (
          <Text style={projStyles.client}>{project.clientName}</Text>
        )}
        <Text style={projStyles.days}>{project.daysRunning} Tage</Text>
        {project.progressPercent > 0 && (
          <Text style={projStyles.progress}>ZB: {project.progressPercent}%</Text>
        )}
      </View>
    </Pressable>
  );
}

const projStyles = StyleSheet.create({
  row: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 16,
    marginBottom: 8,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  code: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.white },
  name: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc300, flex: 1 },
  rowRight: { flexDirection: "row", alignItems: "center" },
  margin: { fontFamily: "Inter_800ExtraBold", fontSize: 18 },
  rowMid: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  detailCol: { alignItems: "center" },
  detailLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.raw.zinc500, marginBottom: 2 },
  detailValue: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.raw.zinc300 },
  rowBottom: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  client: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.raw.zinc500 },
  days: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.raw.zinc600 },
  progress: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.raw.amber500 },
});

// ─── Invoice Row ────────────────────────────────────────────────────────

function InvoiceRow({ invoice, type }: { invoice: OpenInvoiceRow; type: "offen" | "bezahlt" }) {
  const isPaid = invoice.status === "PAID";
  const isOverdue = !isPaid && invoice.daysOverdue > 0;
  const dotColor = isPaid
    ? Colors.raw.emerald500
    : isOverdue
      ? Colors.raw.rose500
      : Colors.raw.amber500;

  const statusLabel = isPaid
    ? "Bezahlt"
    : isOverdue
      ? `${invoice.daysOverdue} Tage überfällig`
      : invoice.dueDate
        ? `Fällig: ${formatDate(invoice.dueDate)}`
        : "Offen";

  return (
    <View style={[invStyles.row, type === "offen" && isOverdue && invStyles.rowOverdue]}>
      <View style={invStyles.left}>
        <View style={invStyles.header}>
          <View style={[invStyles.dot, { backgroundColor: dotColor }]} />
          <Text style={invStyles.supplier} numberOfLines={1}>{invoice.supplierName}</Text>
        </View>
        <Text style={invStyles.ref}>{invoice.invoiceNumber}</Text>
        {invoice.projectName && (
          <Text style={invStyles.project} numberOfLines={1}>{invoice.projectName}</Text>
        )}
        {invoice.expenseCategory && (
          <Text style={invStyles.category}>{invoice.expenseCategory}</Text>
        )}
      </View>
      <View style={invStyles.right}>
        <Text style={invStyles.amount}>{formatEuro(invoice.totalGross)}</Text>
        <Text style={[invStyles.status, { color: dotColor }]}>{statusLabel}</Text>
        {invoice.lexwareVoucherId && (
          <View style={invStyles.lexBadge}>
            <Text style={invStyles.lexText}>Lexware</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const invStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  rowOverdue: {
    backgroundColor: Colors.raw.rose500 + "08",
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  left: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  supplier: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.white, flex: 1 },
  ref: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 11, color: Colors.raw.zinc500, marginLeft: 16, marginBottom: 2 },
  project: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginLeft: 16 },
  category: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.raw.zinc600, marginLeft: 16, marginTop: 2 },
  right: { alignItems: "flex-end", justifyContent: "center" },
  amount: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.white, marginBottom: 2 },
  status: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  lexBadge: {
    backgroundColor: Colors.raw.zinc800,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  lexText: { fontFamily: "Inter_500Medium", fontSize: 10, color: Colors.raw.zinc400 },
});

// ─── Cost Distribution ─────────────────────────────────────────────────

function CostDistribution({ categories }: { categories: CostByCategory[] }) {
  const total = categories.reduce((s, c) => s + c.total, 0);
  if (total === 0) return null;

  return (
    <View style={costStyles.container}>
      {/* Bar chart */}
      <View style={costStyles.barRow}>
        {categories.map((cat) => {
          const pct = (cat.total / total) * 100;
          if (pct < 1) return null;
          return (
            <View
              key={cat.category}
              style={[
                costStyles.barSegment,
                {
                  flex: pct,
                  backgroundColor: CATEGORY_COLORS[cat.category] ?? Colors.raw.zinc500,
                },
              ]}
            />
          );
        })}
      </View>
      {/* Legend */}
      <View style={costStyles.legend}>
        {categories.map((cat) => {
          const pct = total > 0 ? ((cat.total / total) * 100).toFixed(0) : "0";
          return (
            <View key={cat.category} style={costStyles.legendRow}>
              <View style={costStyles.legendLeft}>
                <View
                  style={[
                    costStyles.legendDot,
                    { backgroundColor: CATEGORY_COLORS[cat.category] ?? Colors.raw.zinc500 },
                  ]}
                />
                <Text style={costStyles.legendLabel}>{cat.label}</Text>
              </View>
              <View style={costStyles.legendRight}>
                <Text style={costStyles.legendPct}>{pct}%</Text>
                <Text style={costStyles.legendAmount}>{formatEuro(cat.total)}</Text>
              </View>
            </View>
          );
        })}
      </View>
      <View style={costStyles.totalRow}>
        <Text style={costStyles.totalLabel}>Gesamt</Text>
        <Text style={costStyles.totalValue}>{formatEuro(total)}</Text>
      </View>
    </View>
  );
}

const costStyles = StyleSheet.create({
  container: { gap: 16 },
  barRow: {
    flexDirection: "row",
    height: 14,
    borderRadius: 7,
    overflow: "hidden",
    gap: 2,
  },
  barSegment: { borderRadius: 4 },
  legend: { gap: 10 },
  legendRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  legendLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc300 },
  legendRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  legendPct: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.zinc400, width: 36, textAlign: "right" },
  legendAmount: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.white, width: 80, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
    paddingTop: 12,
  },
  totalLabel: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.zinc400 },
  totalValue: { fontFamily: "Inter_800ExtraBold", fontSize: 16, color: Colors.raw.white },
});

// ─── Liquiditätsampel ───────────────────────────────────────────────────

function LiquidityIndicator({
  receivables,
  payables,
  overdueReceivables,
  overduePayables,
}: {
  receivables: number;
  payables: number;
  overdueReceivables: number;
  overduePayables: number;
}) {
  const balance = receivables - payables;
  const status: "green" | "yellow" | "red" =
    balance > 0 && overduePayables === 0
      ? "green"
      : balance >= 0 || overduePayables < payables * 0.3
        ? "yellow"
        : "red";

  const statusColor = getStatusColor(status);
  const label = status === "green" ? "Gut" : status === "yellow" ? "Achtung" : "Kritisch";

  return (
    <View style={liqStyles.container}>
      <View style={liqStyles.headerRow}>
        <View style={[liqStyles.ampel, { backgroundColor: statusColor }]} />
        <Text style={[liqStyles.label, { color: statusColor }]}>{label}</Text>
      </View>
      <View style={liqStyles.row}>
        <Text style={liqStyles.text}>Forderungen</Text>
        <Text style={[liqStyles.amount, { color: Colors.raw.emerald500 }]}>
          +{formatEuro(receivables)}
        </Text>
      </View>
      <View style={liqStyles.row}>
        <Text style={liqStyles.text}>Verbindlichkeiten</Text>
        <Text style={[liqStyles.amount, { color: Colors.raw.rose500 }]}>
          -{formatEuro(payables)}
        </Text>
      </View>
      {overduePayables > 0 && (
        <View style={liqStyles.row}>
          <Text style={[liqStyles.text, { color: Colors.raw.rose500 }]}>davon überfällig</Text>
          <Text style={[liqStyles.amount, { color: Colors.raw.rose500 }]}>
            {formatEuro(overduePayables)}
          </Text>
        </View>
      )}
      <View style={[liqStyles.row, liqStyles.balanceRow]}>
        <Text style={liqStyles.balanceLabel}>Saldo</Text>
        <Text style={[liqStyles.balanceValue, { color: balance >= 0 ? Colors.raw.emerald500 : Colors.raw.rose500 }]}>
          {balance >= 0 ? "+" : ""}{formatEuro(balance)}
        </Text>
      </View>
    </View>
  );
}

const liqStyles = StyleSheet.create({
  container: { gap: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  ampel: { width: 16, height: 16, borderRadius: 8 },
  label: { fontFamily: "Inter_800ExtraBold", fontSize: 16 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  text: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc400 },
  amount: { fontFamily: "Inter_700Bold", fontSize: 14 },
  balanceRow: { borderTopWidth: 1, borderTopColor: Colors.raw.zinc800, paddingTop: 8, marginTop: 4 },
  balanceLabel: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.zinc300 },
  balanceValue: { fontFamily: "Inter_800ExtraBold", fontSize: 16 },
});

// ─── Change Orders Section ──────────────────────────────────────────────

function ChangeOrderSection({ orders }: { orders: ChangeOrderRow[] }) {
  if (orders.length === 0) {
    return (
      <View style={coStyles.empty}>
        <Ionicons name="checkmark-circle" size={20} color={Colors.raw.emerald500} />
        <Text style={coStyles.emptyText}>Keine offenen Nachträge</Text>
      </View>
    );
  }

  const totalOpen = orders.reduce((s, o) => s + o.amountNet, 0);

  return (
    <View style={coStyles.container}>
      <View style={coStyles.totalRow}>
        <Text style={coStyles.totalLabel}>Offen gesamt</Text>
        <Text style={coStyles.totalValue}>{formatEuro(totalOpen)}</Text>
      </View>
      {orders.map((order) => {
        const isPending = order.status.includes("PENDING");
        const dotColor = isPending ? Colors.raw.amber500 : Colors.raw.emerald500;
        return (
          <View key={order.id} style={coStyles.row}>
            <View style={coStyles.left}>
              <View style={coStyles.header}>
                <View style={[coStyles.dot, { backgroundColor: dotColor }]} />
                <Text style={coStyles.number}>{order.changeOrderNumber}</Text>
              </View>
              <Text style={coStyles.title} numberOfLines={1}>{order.title}</Text>
              {order.projectName && (
                <Text style={coStyles.project}>{order.projectName}</Text>
              )}
            </View>
            <View style={coStyles.right}>
              <Text style={coStyles.amount}>{formatEuro(order.amountNet)}</Text>
              <Text style={[coStyles.status, { color: dotColor }]}>
                {isPending ? "Wartet" : "Genehmigt"}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const coStyles = StyleSheet.create({
  container: { gap: 0 },
  empty: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc400 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  totalLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc400 },
  totalValue: { fontFamily: "Inter_800ExtraBold", fontSize: 16, color: Colors.raw.amber500 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  left: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  number: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.raw.white },
  title: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc400, marginLeft: 16 },
  project: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.raw.zinc500, marginLeft: 16, marginTop: 2 },
  right: { alignItems: "flex-end" },
  amount: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.white },
  status: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
});

// ─── Loading / Error ────────────────────────────────────────────────────

function LoadingCard() {
  return (
    <View style={[s.card, { alignItems: "center", justifyContent: "center", minHeight: 80 }]}>
      <ActivityIndicator color={Colors.raw.amber500} size="small" />
      <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc500, marginTop: 8 }}>
        Laden...
      </Text>
    </View>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <View style={[s.card, { alignItems: "center", justifyContent: "center", minHeight: 80 }]}>
      <Ionicons name="warning" size={20} color={Colors.raw.rose500} />
      <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.rose500, marginTop: 8 }}>
        {message}
      </Text>
    </View>
  );
}

// ─── Tab 1: Controlling ─────────────────────────────────────────────────

function ControllingTab() {
  const overview = useFinanceOverview();
  const controlling = useProjectControlling();
  const costs = useCostsByCategory();
  const changeOrders = useOpenChangeOrders();

  const sortedProjects = useMemo(() => {
    if (!controlling.data) return [];
    return [...controlling.data]
      .filter((p) => p.offerTotal > 0 || p.costTotal > 0)
      .sort((a, b) => a.marginPercent - b.marginPercent);
  }, [controlling.data]);

  const wipTotal = useMemo(() => {
    if (!controlling.data) return 0;
    return controlling.data.reduce((s, p) => s + p.wipValue, 0);
  }, [controlling.data]);

  return (
    <>
      {/* Hero Cards */}
      {overview.isLoading ? (
        <LoadingCard />
      ) : overview.error ? (
        <ErrorCard message="Finanzdaten nicht verfügbar" />
      ) : overview.data ? (
        <>
          <View style={s.heroGrid}>
            <View style={s.heroRow}>
              <HeroCard
                value={formatEuroCompact(overview.data.totalRevenue)}
                label="Aufträge"
                sub={`${sortedProjects.length} aktiv`}
                subColor={Colors.raw.zinc400}
              />
              <HeroCard
                value={formatEuroCompact(overview.data.totalCosts)}
                label="Kosten"
                sub={costs.data ? `${costs.data.length} Kategorien` : undefined}
                subColor={Colors.raw.zinc400}
              />
            </View>
            <View style={s.heroRow}>
              <HeroCard
                value={formatEuroCompact(overview.data.totalResult)}
                label="Ergebnis"
                sub={overview.data.totalResult >= 0 ? "positiv" : "negativ"}
                subColor={overview.data.totalResult >= 0 ? Colors.raw.emerald500 : Colors.raw.rose500}
              />
              <HeroCard
                value={`${overview.data.avgMarginPercent.toFixed(1)}%`}
                label="Ø Marge"
                sub="Ziel: 20%"
                subColor={overview.data.avgMarginPercent >= 20 ? Colors.raw.emerald500 : overview.data.avgMarginPercent >= 10 ? Colors.raw.amber500 : Colors.raw.rose500}
              />
            </View>
          </View>

          {/* Liquiditätsampel */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Liquidität</Text>
          </View>
          <View style={s.card}>
            <LiquidityIndicator
              receivables={overview.data.openReceivables}
              payables={overview.data.openPayables}
              overdueReceivables={overview.data.overdueReceivables}
              overduePayables={overview.data.overduePayables}
            />
          </View>
        </>
      ) : null}

      {/* Halbfertige Arbeiten */}
      {wipTotal > 0 && (
        <>
          <View style={[s.sectionHeader, { marginTop: 24 }]}>
            <Text style={s.sectionTitle}>Halbfertige Arbeiten</Text>
          </View>
          <View style={s.card}>
            <View style={liqStyles.row}>
              <Text style={liqStyles.text}>Angefangener Wert (ZB)</Text>
              <Text style={[liqStyles.balanceValue, { color: Colors.raw.amber500 }]}>
                {formatEuro(wipTotal)}
              </Text>
            </View>
          </View>
        </>
      )}

      {/* Projekte nach Marge */}
      <View style={[s.sectionHeader, { marginTop: 24 }]}>
        <Text style={s.sectionTitle}>Projekte nach Marge</Text>
      </View>
      {controlling.isLoading ? (
        <LoadingCard />
      ) : controlling.error ? (
        <ErrorCard message="Projektdaten nicht verfügbar" />
      ) : sortedProjects.length === 0 ? (
        <View style={s.card}>
          <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc500 }}>
            Noch keine Projekte mit Finanzdaten
          </Text>
        </View>
      ) : (
        sortedProjects.map((p) => <ProjectRow key={p.id} project={p} />)
      )}

      {/* Kostenverteilung */}
      <View style={[s.sectionHeader, { marginTop: 24 }]}>
        <Text style={s.sectionTitle}>Kostenverteilung</Text>
      </View>
      {costs.isLoading ? (
        <LoadingCard />
      ) : costs.error ? (
        <ErrorCard message="Kostendaten nicht verfügbar" />
      ) : costs.data ? (
        <View style={s.card}>
          <CostDistribution categories={costs.data} />
        </View>
      ) : null}

      {/* Offene Nachträge */}
      <View style={[s.sectionHeader, { marginTop: 24 }]}>
        <Text style={s.sectionTitle}>Offene Nachträge</Text>
      </View>
      {changeOrders.isLoading ? (
        <LoadingCard />
      ) : changeOrders.error ? (
        <ErrorCard message="Nachtragsdaten nicht verfügbar" />
      ) : (
        <View style={s.card}>
          <ChangeOrderSection orders={changeOrders.data ?? []} />
        </View>
      )}
    </>
  );
}

// ─── Tab 2: Buchführung ─────────────────────────────────────────────────

function BuchfuehrungTab() {
  const purchaseInvoices = useOpenPurchaseInvoices();
  const salesInvoices = useSalesInvoices();
  const [belegTab, setBelegTab] = useState<"offen" | "bezahlt">("offen");

  const { openInvoices, paidInvoices, overdueInvoices } = useMemo(() => {
    const all = purchaseInvoices.data ?? [];
    return {
      openInvoices: all.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED"),
      paidInvoices: all.filter((i) => i.status === "PAID"),
      overdueInvoices: all.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED" && i.daysOverdue > 0),
    };
  }, [purchaseInvoices.data]);

  const openTotal = openInvoices.reduce((s, i) => s + i.totalGross - i.paidAmount, 0);
  const overdueTotal = overdueInvoices.reduce((s, i) => s + i.totalGross - i.paidAmount, 0);
  const paidTotal = paidInvoices.reduce((s, i) => s + i.totalGross, 0);

  const displayInvoices = belegTab === "offen" ? openInvoices : paidInvoices;

  return (
    <>
      {/* Summary Cards */}
      <View style={s.heroGrid}>
        <View style={s.heroRow}>
          <HeroCard
            value={formatEuroCompact(openTotal)}
            label="Offen"
            sub={`${openInvoices.length} Belege`}
            subColor={Colors.raw.amber500}
          />
          <HeroCard
            value={formatEuroCompact(overdueTotal)}
            label="Überfällig"
            sub={overdueInvoices.length > 0 ? `${overdueInvoices.length} Belege!` : "Keine"}
            subColor={overdueInvoices.length > 0 ? Colors.raw.rose500 : Colors.raw.emerald500}
          />
        </View>
        <View style={s.heroRow}>
          <HeroCard
            value={formatEuroCompact(paidTotal)}
            label="Bezahlt"
            sub={`${paidInvoices.length} Belege`}
            subColor={Colors.raw.emerald500}
          />
          <HeroCard
            value={`${(salesInvoices.data ?? []).length}`}
            label="Ausgangsrechnungen"
            sub={
              (salesInvoices.data ?? []).filter((si) => si.status === "OVERDUE" || (si.daysOverdue > 0 && si.status !== "PAID" && si.status !== "PAIDOFF")).length > 0
                ? "Überfällige vorhanden!"
                : "Alles aktuell"
            }
            subColor={
              (salesInvoices.data ?? []).filter((si) => si.status === "OVERDUE" || (si.daysOverdue > 0 && si.status !== "PAID" && si.status !== "PAIDOFF")).length > 0
                ? Colors.raw.rose500
                : Colors.raw.emerald500
            }
          />
        </View>
      </View>

      {/* Belege Tab */}
      <View style={[s.sectionHeader, { marginTop: 24 }]}>
        <Text style={s.sectionTitle}>Eingangsrechnungen</Text>
      </View>

      {purchaseInvoices.isLoading ? (
        <LoadingCard />
      ) : purchaseInvoices.error ? (
        <ErrorCard message="Belegdaten nicht verfügbar" />
      ) : (
        <View style={s.card}>
          <View style={s.tabRow}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setBelegTab("offen");
              }}
              style={[s.tab, belegTab === "offen" && s.tabActive]}
            >
              <Text style={[s.tabText, belegTab === "offen" && s.tabTextActive]}>
                Offen ({openInvoices.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setBelegTab("bezahlt");
              }}
              style={[s.tab, belegTab === "bezahlt" && s.tabActive]}
            >
              <Text style={[s.tabText, belegTab === "bezahlt" && s.tabTextActive]}>
                Bezahlt ({paidInvoices.length})
              </Text>
            </Pressable>
          </View>

          {displayInvoices.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <Ionicons
                name={belegTab === "offen" ? "checkmark-circle" : "document-outline"}
                size={24}
                color={belegTab === "offen" ? Colors.raw.emerald500 : Colors.raw.zinc600}
              />
              <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc500, marginTop: 8 }}>
                {belegTab === "offen" ? "Keine offenen Belege" : "Noch keine bezahlten Belege"}
              </Text>
            </View>
          ) : (
            displayInvoices.map((inv) => (
              <InvoiceRow key={inv.id} invoice={inv} type={belegTab} />
            ))
          )}
        </View>
      )}

      {/* Ausgangsrechnungen */}
      <View style={[s.sectionHeader, { marginTop: 24 }]}>
        <Text style={s.sectionTitle}>Ausgangsrechnungen</Text>
      </View>
      {salesInvoices.isLoading ? (
        <LoadingCard />
      ) : salesInvoices.error ? (
        <ErrorCard message="Rechnungsdaten nicht verfügbar" />
      ) : (salesInvoices.data ?? []).length === 0 ? (
        <View style={s.card}>
          <View style={{ paddingVertical: 12, alignItems: "center" }}>
            <Ionicons name="document-outline" size={24} color={Colors.raw.zinc600} />
            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc500, marginTop: 8 }}>
              Noch keine Ausgangsrechnungen
            </Text>
          </View>
        </View>
      ) : (
        <View style={s.card}>
          {(salesInvoices.data ?? []).map((si) => {
            const isPaid = si.status === "PAID" || si.status === "PAIDOFF";
            const isOverdue = !isPaid && (si.status === "OVERDUE" || si.daysOverdue > 0);
            const dotColor = isPaid ? Colors.raw.emerald500 : isOverdue ? Colors.raw.rose500 : Colors.raw.amber500;
            return (
              <View key={si.id} style={invStyles.row}>
                <View style={invStyles.left}>
                  <View style={invStyles.header}>
                    <View style={[invStyles.dot, { backgroundColor: dotColor }]} />
                    <Text style={invStyles.supplier} numberOfLines={1}>
                      {si.customerName ?? si.projectName ?? si.invoiceNumber}
                    </Text>
                  </View>
                  <Text style={invStyles.ref}>{si.invoiceNumber}</Text>
                  {si.projectName && <Text style={invStyles.project}>{si.projectName}</Text>}
                </View>
                <View style={invStyles.right}>
                  <Text style={invStyles.amount}>{formatEuro(si.totalGross)}</Text>
                  <Text style={[invStyles.status, { color: dotColor }]}>
                    {isPaid ? "Bezahlt" : isOverdue ? `${si.daysOverdue}T überfällig` : formatDate(si.dueDate)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────

export default function FinanzenScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"controlling" | "buchfuehrung">("controlling");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: queryKeys.finance.all });
    setRefreshing(false);
  }, [queryClient]);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.headerBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={handleRefresh}
          style={({ pressed }) => [s.headerBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="refresh-cw" size={20} color={Colors.raw.white} />
        </Pressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingTop: topInset + 60, paddingBottom: bottomInset + 30 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          Platform.OS !== "web" ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.raw.amber500}
              progressViewOffset={topInset + 60}
            />
          ) : undefined
        }
      >
        <Text style={s.title}>Finanzen</Text>

        {/* Tab Switcher */}
        <View style={s.tabRow}>
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.selectionAsync();
              setActiveTab("controlling");
            }}
            style={[s.mainTab, activeTab === "controlling" && s.mainTabActive]}
          >
            <Ionicons
              name="stats-chart"
              size={16}
              color={activeTab === "controlling" ? "#000" : Colors.raw.zinc400}
            />
            <Text style={[s.mainTabText, activeTab === "controlling" && s.mainTabTextActive]}>
              Projektübersicht
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.selectionAsync();
              setActiveTab("buchfuehrung");
            }}
            style={[s.mainTab, activeTab === "buchfuehrung" && s.mainTabActive]}
          >
            <Ionicons
              name="receipt-outline"
              size={16}
              color={activeTab === "buchfuehrung" ? "#000" : Colors.raw.zinc400}
            />
            <Text style={[s.mainTabText, activeTab === "buchfuehrung" && s.mainTabTextActive]}>
              Buchführung
            </Text>
          </Pressable>
        </View>

        {activeTab === "controlling" ? <ControllingTab /> : <BuchfuehrungTab />}
      </ScrollView>
    </View>
  );
}

// ─── Shared Styles ──────────────────────────────────────────────────────

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
  headerBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  title: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 30,
    color: Colors.raw.white,
    marginBottom: 16,
  },

  // Tab switcher
  tabRow: { flexDirection: "row", gap: 6, marginBottom: 20 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.raw.zinc800,
    alignItems: "center",
  },
  tabActive: { backgroundColor: Colors.raw.amber500 },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.zinc400 },
  tabTextActive: { color: "#000" },

  mainTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.raw.zinc800,
  },
  mainTabActive: { backgroundColor: Colors.raw.amber500 },
  mainTabText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.zinc400 },
  mainTabTextActive: { color: "#000" },

  // Hero
  heroGrid: { gap: 10, marginBottom: 20 },
  heroRow: { flexDirection: "row", gap: 10 },

  // Sections
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 20, color: Colors.raw.white },

  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginBottom: 8,
  },
});
