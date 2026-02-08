import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  Modal,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useState, useCallback } from "react";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import Colors from "@/constants/colors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface OrderItem {
  id: string;
  name: string;
  qty: string;
  amount: string;
  amountNum: number;
}

interface SupplierOrder {
  id: string;
  name: string;
  customerNumber: string;
  phone: string;
  email: string;
  items: OrderItem[];
  totalNetto: string;
  totalNum: number;
}

const ORDERS: SupplierOrder[] = [
  {
    id: "s1",
    name: "MEGA eG",
    customerNumber: "48291",
    phone: "040-123456",
    email: "bestellung@mega.de",
    items: [
      { id: "i1", name: "Vliesraufaser Erfurt 52", qty: "12x", amount: "226,80", amountNum: 226.8 },
      { id: "i2", name: "Vlieskleber 16kg", qty: "12x", amount: "311,40", amountNum: 311.4 },
      { id: "i3", name: "Dispersionsfarbe 10L", qty: "4x", amount: "171,60", amountNum: 171.6 },
      { id: "i4", name: "Tiefgrund 5L", qty: "2x", amount: "57,80", amountNum: 57.8 },
    ],
    totalNetto: "767,60",
    totalNum: 767.6,
  },
  {
    id: "s2",
    name: "Suding & Soeken",
    customerNumber: "S-1192",
    phone: "040-789012",
    email: "order@sueding.de",
    items: [
      { id: "i5", name: "Eckventil DN15", qty: "2x", amount: "17,60", amountNum: 17.6 },
      { id: "i6", name: "Siphon Ablauf", qty: "1x", amount: "11,90", amountNum: 11.9 },
      { id: "i7", name: "Flexschlauch 3/8", qty: "4x", amount: "23,60", amountNum: 23.6 },
    ],
    totalNetto: "53,10",
    totalNum: 53.1,
  },
];

const BUDGET_TOTAL = 1360;
const BUDGET_USED = 539.3;
const GESAMT_NETTO = 820.7;
const BUDGET_REST = BUDGET_TOTAL - GESAMT_NETTO;
const BUDGET_PERCENT = Math.round(((GESAMT_NETTO + BUDGET_USED) / BUDGET_TOTAL) * 100);

function ConfirmModal({
  visible,
  supplier,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  supplier: SupplierOrder | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!supplier) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={cmStyles.overlay}>
        <View style={cmStyles.sheet}>
          <View style={cmStyles.iconWrap}>
            <Feather name="send" size={28} color={Colors.raw.amber500} />
          </View>
          <Text style={cmStyles.title}>Bestellung an {supplier.name} senden?</Text>
          <Text style={cmStyles.detail}>
            {supplier.items.length} Artikel {"\u2022"} {"\u20AC"}{supplier.totalNetto} netto
          </Text>
          <View style={cmStyles.actions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [cmStyles.cancelBtn, { opacity: pressed ? 0.8 : 1 }]}
              testID="cancel-send"
            >
              <Text style={cmStyles.cancelText}>Abbrechen</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [cmStyles.confirmBtn, { opacity: pressed ? 0.9 : 1 }]}
              testID="confirm-send"
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={cmStyles.confirmText}>Senden</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const cmStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 28,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.raw.amber500 + "18",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
    textAlign: "center",
    marginBottom: 8,
  },
  detail: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc400,
    marginBottom: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 12,
    paddingVertical: 14,
  },
  cancelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.zinc400,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingVertical: 14,
  },
  confirmText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#fff",
  },
});

function SentToast({ supplierName }: { supplierName: string }) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(300)}
      style={sentStyles.container}
    >
      <Ionicons name="checkmark-circle" size={22} color={Colors.raw.emerald500} />
      <Text style={sentStyles.text}>Bestellung an {supplierName} gesendet</Text>
    </Animated.View>
  );
}

const sentStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 100,
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
  text: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.emerald500,
    flex: 1,
  },
});

function SupplierCard({
  order,
  onSend,
  sent,
}: {
  order: SupplierOrder;
  onSend: () => void;
  sent: boolean;
}) {
  const handleCopy = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {}
  };

  return (
    <View style={scStyles.card}>
      <View style={scStyles.supplierHeader}>
        <View style={scStyles.supplierIcon}>
          <MaterialCommunityIcons name="store" size={22} color={Colors.raw.amber500} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={scStyles.supplierName}>{order.name}</Text>
          <View style={scStyles.kdRow}>
            <Text style={scStyles.kdLabel}>Kd.Nr: {order.customerNumber}</Text>
            <Pressable
              onPress={() => handleCopy(order.customerNumber)}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Ionicons name="copy-outline" size={14} color={Colors.raw.zinc500} />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={scStyles.contactRow}>
        <Pressable style={scStyles.contactItem}>
          <Feather name="phone" size={14} color={Colors.raw.zinc500} />
          <Text style={scStyles.contactText}>{order.phone}</Text>
        </Pressable>
        <Pressable style={scStyles.contactItem}>
          <Feather name="mail" size={14} color={Colors.raw.zinc500} />
          <Text style={scStyles.contactText} numberOfLines={1}>{order.email}</Text>
        </Pressable>
      </View>

      <View style={scStyles.divider} />

      {order.items.map((item, i) => (
        <View key={item.id} style={[scStyles.itemRow, i < order.items.length - 1 && scStyles.itemBorder]}>
          <View style={{ flex: 1 }}>
            <Text style={scStyles.itemQty}>{item.qty}</Text>
            <Text style={scStyles.itemName}>{item.name}</Text>
          </View>
          <Text style={scStyles.itemAmount}>{"\u20AC"}{item.amount}</Text>
        </View>
      ))}

      <View style={scStyles.sumDivider} />
      <View style={scStyles.sumRow}>
        <Text style={scStyles.sumLabel}>Summe netto:</Text>
        <Text style={scStyles.sumAmount}>{"\u20AC"}{order.totalNetto}</Text>
      </View>

      {sent ? (
        <View style={scStyles.sentBadge}>
          <Ionicons name="checkmark-circle" size={18} color={Colors.raw.emerald500} />
          <Text style={scStyles.sentText}>Gesendet</Text>
        </View>
      ) : (
        <Pressable
          onPress={onSend}
          style={({ pressed }) => [
            scStyles.sendButton,
            { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
          testID={`send-order-${order.id}`}
        >
          <Feather name="send" size={16} color="#000" />
          <Text style={scStyles.sendText}>Bestellung senden</Text>
        </Pressable>
      )}
    </View>
  );
}

const scStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginBottom: 16,
  },
  supplierHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 10,
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
    fontSize: 18,
    color: Colors.raw.white,
    marginBottom: 2,
  },
  kdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  kdLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  contactRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 4,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.raw.zinc800,
    marginVertical: 14,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  itemQty: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.raw.amber500,
    marginBottom: 2,
  },
  itemName: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.zinc300,
  },
  itemAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.white,
  },
  sumDivider: {
    height: 1,
    backgroundColor: Colors.raw.zinc700,
    marginVertical: 12,
  },
  sumRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sumLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.zinc400,
  },
  sumAmount: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 18,
    color: Colors.raw.white,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 12,
    paddingVertical: 14,
  },
  sendText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#000",
  },
  sentBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.emerald500 + "18",
    borderRadius: 12,
    paddingVertical: 14,
  },
  sentText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.emerald500,
  },
});

export default function BestellungScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [confirmSupplier, setConfirmSupplier] = useState<SupplierOrder | null>(null);
  const [sentOrders, setSentOrders] = useState<Set<string>>(new Set());
  const [toastSupplier, setToastSupplier] = useState<string | null>(null);

  const handleSend = useCallback((order: SupplierOrder) => {
    setConfirmSupplier(order);
  }, []);

  const handleConfirmSend = useCallback(() => {
    if (!confirmSupplier) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSentOrders((prev) => new Set(prev).add(confirmSupplier.id));
    setToastSupplier(confirmSupplier.name);
    setConfirmSupplier(null);
    setTimeout(() => setToastSupplier(null), 2500);
  }, [confirmSupplier]);

  const budgetColor =
    BUDGET_PERCENT >= 90
      ? Colors.raw.rose500
      : BUDGET_PERCENT >= 75
      ? Colors.raw.amber500
      : Colors.raw.emerald500;

  return (
    <View style={s.container}>
      {toastSupplier && <SentToast supplierName={toastSupplier} />}

      <View style={[s.backRow, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backButton, { opacity: pressed ? 0.7 : 1 }]}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <Text style={s.backLabel}>Material</Text>
      </View>

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[
          s.scrollContent,
          {
            paddingTop: topInset + 64,
            paddingBottom: bottomInset + 170,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.pageTitle}>Bestellung</Text>
        <Text style={s.pageSubtitle}>
          BL-2026-003 {"\u2022"} Schwentnerring
        </Text>

        {ORDERS.map((order) => (
          <SupplierCard
            key={order.id}
            order={order}
            onSend={() => handleSend(order)}
            sent={sentOrders.has(order.id)}
          />
        ))}
      </ScrollView>

      <View style={[s.stickyBottom, { paddingBottom: Math.max(bottomInset, 20) }]}>
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>GESAMT:</Text>
          <Text style={s.totalAmount}>{"\u20AC"}{GESAMT_NETTO.toFixed(2).replace(".", ",")} netto</Text>
        </View>
        <Text style={s.budgetRest}>
          Budget-Rest nach Bestellung: {"\u20AC"}{BUDGET_REST.toFixed(2).replace(".", ",")}
        </Text>
        <View style={s.budgetBarRow}>
          <View style={s.budgetBar}>
            <View style={[s.budgetFill, { width: `${Math.min(BUDGET_PERCENT, 100)}%`, backgroundColor: budgetColor }]} />
          </View>
          <Text style={[s.budgetPercent, { color: budgetColor }]}>{BUDGET_PERCENT}%</Text>
          <View style={[s.budgetDot, { backgroundColor: budgetColor }]} />
        </View>
        <Text style={s.budgetLabel}>Budget</Text>
      </View>

      <ConfirmModal
        visible={!!confirmSupplier}
        supplier={confirmSupplier}
        onClose={() => setConfirmSupplier(null)}
        onConfirm={handleConfirmSend}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
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
    marginBottom: 4,
  },
  pageSubtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.zinc500,
    marginBottom: 24,
  },
  stickyBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.raw.zinc900,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalLabel: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 16,
    color: Colors.raw.white,
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 18,
    color: Colors.raw.white,
  },
  budgetRest: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
    marginBottom: 12,
  },
  budgetBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  budgetBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.raw.zinc800,
    overflow: "hidden",
  },
  budgetFill: {
    height: 8,
    borderRadius: 4,
  },
  budgetPercent: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  budgetDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  budgetLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.zinc600,
    marginBottom: 4,
  },
});
