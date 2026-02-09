import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  FlatList,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useState, useMemo, useCallback } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface Product {
  id: string;
  name: string;
  supplier: string;
  articleNr: string;
  price: string;
  priceNum: number;
  unit: string;
  favorite: boolean;
  useCount: number;
  isNew?: boolean;
}

const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Erfurt Vlies Rauhfaser 52",
    supplier: "MEGA",
    articleNr: "4523100",
    price: "18,90",
    priceNum: 18.9,
    unit: "Rolle",
    favorite: true,
    useCount: 3,
  },
  {
    id: "p2",
    name: "Marburg Patent Vlies",
    supplier: "Delmes",
    articleNr: "9871",
    price: "22,50",
    priceNum: 22.5,
    unit: "Rolle",
    favorite: false,
    useCount: 1,
  },
  {
    id: "p3",
    name: "Brillux Vliesfaser 120",
    supplier: "Brillux Direkt",
    articleNr: "VF120",
    price: "24,80",
    priceNum: 24.8,
    unit: "Rolle",
    favorite: false,
    useCount: 0,
    isNew: true,
  },
  {
    id: "p4",
    name: "Erfurt EcoVlies 73",
    supplier: "MEGA",
    articleNr: "4523200",
    price: "21,40",
    priceNum: 21.4,
    unit: "Rolle",
    favorite: false,
    useCount: 2,
  },
  {
    id: "p5",
    name: "Rasch Vlies Premium",
    supplier: "Farben Schmidt",
    articleNr: "RP-440",
    price: "26,90",
    priceNum: 26.9,
    unit: "Rolle",
    favorite: false,
    useCount: 0,
    isNew: true,
  },
];

const SUPPLIERS_LIST = ["MEGA", "Delmes", "Brillux Direkt", "Farben Schmidt", "Weber", "Caparol"];
const UNITS = ["Rolle", "Eimer", "Kartusche", "Kanister", "Paket", "Stuck"];

function ProductCard({
  product,
  onSelect,
}: {
  product: Product;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        pStyles.card,
        { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
      testID={`product-${product.id}`}
    >
      <View style={pStyles.left}>
        <View style={pStyles.nameRow}>
          {product.favorite && (
            <Ionicons name="star" size={14} color={Colors.raw.amber500} />
          )}
          <Text style={pStyles.name} numberOfLines={1}>
            {product.name}
          </Text>
        </View>
        <Text style={pStyles.meta}>
          {product.supplier} {"\u2022"} Art. {product.articleNr}
        </Text>
        <Text style={pStyles.usage}>
          {product.isNew ? "Neu" : `${product.useCount}x verwendet`}
        </Text>
      </View>
      <View style={pStyles.right}>
        <Text style={pStyles.price}>{"\u20AC"}{product.price}</Text>
        <View style={pStyles.selectBtn}>
          <Text style={pStyles.selectText}>WAHLEN</Text>
        </View>
      </View>
    </Pressable>
  );
}

const pStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 16,
    marginBottom: 8,
  },
  left: {
    flex: 1,
    marginRight: 14,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.white,
    flex: 1,
  },
  meta: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
    marginBottom: 2,
  },
  usage: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.zinc600,
  },
  right: {
    alignItems: "flex-end",
    gap: 8,
  },
  price: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.white,
  },
  selectBtn: {
    backgroundColor: Colors.raw.amber500 + "20",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: Colors.raw.amber500,
    letterSpacing: 0.5,
  },
});

function NewProductForm({ onSave }: { onSave: (p: Product) => void }) {
  const [name, setName] = useState("");
  const [supplier, setSupplier] = useState(SUPPLIERS_LIST[0]);
  const [articleNr, setArticleNr] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState(UNITS[0]);
  const [showSupplierPicker, setShowSupplierPicker] = useState(false);

  const canSave = name.trim().length > 0 && price.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const priceNum = parseFloat(price.replace(",", ".")) || 0;
    onSave({
      id: "new-" + Date.now(),
      name: name.trim(),
      supplier,
      articleNr: articleNr.trim() || "-",
      price: priceNum.toFixed(2).replace(".", ","),
      priceNum,
      unit,
      favorite: false,
      useCount: 0,
      isNew: true,
    });
  };

  return (
    <Animated.View entering={FadeIn.duration(200)} style={nfStyles.container}>
      <Text style={nfStyles.title}>Neues Produkt anlegen</Text>

      <Text style={nfStyles.label}>Name *</Text>
      <TextInput
        style={nfStyles.input}
        placeholder="Produktname..."
        placeholderTextColor={Colors.raw.zinc600}
        value={name}
        onChangeText={setName}
        testID="new-product-name"
      />

      <Text style={nfStyles.label}>Lieferant</Text>
      <Pressable
        onPress={() => setShowSupplierPicker(!showSupplierPicker)}
        style={nfStyles.dropdown}
      >
        <Text style={nfStyles.dropdownText}>{supplier}</Text>
        <Ionicons
          name={showSupplierPicker ? "chevron-up" : "chevron-down"}
          size={16}
          color={Colors.raw.zinc500}
        />
      </Pressable>
      {showSupplierPicker && (
        <View style={nfStyles.pickerOptions}>
          {SUPPLIERS_LIST.map((s) => (
            <Pressable
              key={s}
              onPress={() => {
                setSupplier(s);
                setShowSupplierPicker(false);
              }}
              style={[
                nfStyles.pickerOption,
                supplier === s && nfStyles.pickerOptionActive,
              ]}
            >
              <Text
                style={[
                  nfStyles.pickerOptionText,
                  supplier === s && nfStyles.pickerOptionTextActive,
                ]}
              >
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={nfStyles.row}>
        <View style={{ flex: 1 }}>
          <Text style={nfStyles.label}>Artikelnr.</Text>
          <TextInput
            style={nfStyles.input}
            placeholder="Optional"
            placeholderTextColor={Colors.raw.zinc600}
            value={articleNr}
            onChangeText={setArticleNr}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={nfStyles.label}>Preis ({"\u20AC"}) *</Text>
          <TextInput
            style={nfStyles.input}
            placeholder="0,00"
            placeholderTextColor={Colors.raw.zinc600}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            testID="new-product-price"
          />
        </View>
      </View>

      <Text style={nfStyles.label}>Einheit</Text>
      <View style={nfStyles.unitRow}>
        {UNITS.slice(0, 4).map((u) => (
          <Pressable
            key={u}
            onPress={() => setUnit(u)}
            style={[
              nfStyles.unitChip,
              unit === u ? nfStyles.unitChipActive : nfStyles.unitChipInactive,
            ]}
          >
            <Text
              style={[
                nfStyles.unitChipText,
                unit === u ? nfStyles.unitChipTextActive : nfStyles.unitChipTextInactive,
              ]}
            >
              {u}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={handleSave}
        style={({ pressed }) => [
          nfStyles.saveBtn,
          { opacity: canSave ? (pressed ? 0.8 : 1) : 0.4 },
        ]}
        disabled={!canSave}
        testID="save-new-product"
      >
        <Ionicons name="checkmark" size={20} color="#fff" />
        <Text style={nfStyles.saveBtnText}>Speichern & zuordnen</Text>
      </Pressable>
    </Animated.View>
  );
}

const nfStyles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    marginBottom: 16,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.raw.white,
    marginBottom: 18,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.zinc500,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.white,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.white,
  },
  pickerOptions: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    marginTop: 4,
    overflow: "hidden",
  },
  pickerOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pickerOptionActive: {
    backgroundColor: Colors.raw.amber500 + "18",
  },
  pickerOptionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc400,
  },
  pickerOptionTextActive: {
    color: Colors.raw.amber500,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  unitRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  unitChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unitChipActive: {
    backgroundColor: Colors.raw.amber500,
  },
  unitChipInactive: {
    backgroundColor: Colors.raw.zinc800,
  },
  unitChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  unitChipTextActive: {
    color: "#000",
  },
  unitChipTextInactive: {
    color: Colors.raw.zinc400,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 18,
  },
  saveBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#fff",
  },
});

function SuccessToast({ productName }: { productName: string }) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(300)}
      style={toastStyles.container}
    >
      <Ionicons name="checkmark-circle" size={24} color={Colors.raw.emerald500} />
      <Text style={toastStyles.text} numberOfLines={1}>
        {productName} zugeordnet
      </Text>
    </Animated.View>
  );
}

const toastStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.raw.zinc800,
    borderWidth: 1,
    borderColor: Colors.raw.emerald500 + "40",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  text: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.emerald500,
    flex: 1,
  },
});

export default function AssignMaterialSheet() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const flashValue = useSharedValue(0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.supplier.toLowerCase().includes(q) ||
        p.articleNr.toLowerCase().includes(q)
    ).sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return b.useCount - a.useCount;
    });
  }, [search]);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashValue.value,
  }));

  const handleSelect = useCallback(
    (product: Product) => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setSelectedProduct(product);
      flashValue.value = withSequence(
        withTiming(0.35, { duration: 150 }),
        withTiming(0, { duration: 400 })
      );
      setTimeout(() => {
        router.back();
      }, 1000);
    },
    [flashValue]
  );

  const handleNewProductSave = useCallback(
    (product: Product) => {
      handleSelect(product);
    },
    [handleSelect]
  );

  const materialLabel = name || "Material";

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <Animated.View
        style={[styles.flashOverlay, { backgroundColor: Colors.raw.emerald500 }, flashStyle]}
        pointerEvents="none"
      />

      <View style={styles.handle} />

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{materialLabel} zuordnen</Text>
          <Text style={styles.subtitle}>Bedarf: 12 Rollen (25m)</Text>
          <Text style={styles.subtitle}>
            Fur: 8 Positionen (Wohnzimmer, Flur, Schlafzimmer)
          </Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.7 : 1 }]}
          testID="close-assign"
        >
          <Ionicons name="close" size={24} color={Colors.raw.zinc400} />
        </Pressable>
      </View>

      {selectedProduct ? (
        <View style={styles.successArea}>
          <SuccessToast productName={selectedProduct.name} />
        </View>
      ) : (
        <>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={Colors.raw.zinc500} />
            <TextInput
              style={styles.searchInput}
              placeholder="Produkt suchen..."
              placeholderTextColor={Colors.raw.zinc600}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              testID="product-search"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color={Colors.raw.zinc500} />
              </Pressable>
            )}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            scrollEnabled={filtered.length > 0}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <ProductCard product={item} onSelect={() => handleSelect(item)} />
            )}
            ListHeaderComponent={
              showNewForm ? (
                <NewProductForm onSave={handleNewProductSave} />
              ) : null
            }
            ListFooterComponent={
              !showNewForm ? (
                <Pressable
                  onPress={() => setShowNewForm(true)}
                  style={({ pressed }) => [
                    styles.newProductBtn,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  testID="new-product-button"
                >
                  <Ionicons name="add-circle" size={20} color={Colors.raw.amber500} />
                  <Text style={styles.newProductText}>Neues Produkt anlegen</Text>
                </Pressable>
              ) : null
            }
            ListEmptyComponent={
              !showNewForm ? (
                <View style={styles.empty}>
                  <Ionicons name="search-outline" size={36} color={Colors.raw.zinc700} />
                  <Text style={styles.emptyText}>Kein Produkt gefunden</Text>
                </View>
              ) : null
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
    paddingTop: 8,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 90,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.raw.zinc700,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.raw.white,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc400,
    marginBottom: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginBottom: 16,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.white,
    height: 48,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  newProductBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
  },
  newProductText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.amber500,
  },
  successArea: {
    flex: 1,
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.zinc600,
  },
});
