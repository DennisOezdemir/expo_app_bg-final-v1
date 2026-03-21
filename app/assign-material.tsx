import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  FlatList,
  Platform,
  ActivityIndicator,
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
import { useProducts, useSuppliers, useMaterialInfo } from "@/hooks/queries/useMaterial";
import { useAssignProduct, useCreateAndAssignProduct } from "@/hooks/mutations/useMaterialMutations";
import type { Product, MaterialInfo } from "@/lib/api/materials";

/* ─── ProductCard ────────────────────────────── */

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
          {product.supplier} • Art. {product.articleNr}
        </Text>
        <Text style={pStyles.usage}>
          {product.isNew ? "Neu" : `${product.useCount}x verwendet`}
        </Text>
      </View>
      <View style={pStyles.right}>
        <Text style={pStyles.price}>€{product.price}</Text>
        <View style={pStyles.selectBtn}>
          <Text style={pStyles.selectText}>WÄHLEN</Text>
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
  left: { flex: 1, marginRight: 14 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.raw.white, flex: 1 },
  meta: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc500, marginBottom: 2 },
  usage: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.raw.zinc600 },
  right: { alignItems: "flex-end", gap: 8 },
  price: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.raw.white },
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

/* ─── NewProductForm ─────────────────────────── */

function NewProductForm({
  onSave,
  suppliers,
}: {
  onSave: (p: { name: string; supplier: string; supplierId?: string; articleNr: string; price: number; unit: string }) => void;
  suppliers: { id: string; name: string }[];
}) {
  const [name, setName] = useState("");
  const [supplierIdx, setSupplierIdx] = useState(0);
  const [articleNr, setArticleNr] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("Stk");
  const [showSupplierPicker, setShowSupplierPicker] = useState(false);

  const UNITS = ["Stk", "Rolle", "Eimer", "Kartusche", "Kanister", "Paket", "m²", "L", "kg"];
  const canSave = name.trim().length > 0 && price.trim().length > 0;
  const selectedSupplier = suppliers[supplierIdx] || { id: undefined, name: "Kein Lieferant" };

  const handleSave = () => {
    if (!canSave) return;
    const priceNum = parseFloat(price.replace(",", ".")) || 0;
    onSave({
      name: name.trim(),
      supplier: selectedSupplier.name,
      supplierId: selectedSupplier.id,
      articleNr: articleNr.trim() || "-",
      price: priceNum,
      unit,
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
        <Text style={nfStyles.dropdownText}>{selectedSupplier.name}</Text>
        <Ionicons
          name={showSupplierPicker ? "chevron-up" : "chevron-down"}
          size={16}
          color={Colors.raw.zinc500}
        />
      </Pressable>
      {showSupplierPicker && (
        <View style={nfStyles.pickerOptions}>
          {suppliers.map((s, idx) => (
            <Pressable
              key={s.id}
              onPress={() => {
                setSupplierIdx(idx);
                setShowSupplierPicker(false);
              }}
              style={[
                nfStyles.pickerOption,
                supplierIdx === idx && nfStyles.pickerOptionActive,
              ]}
            >
              <Text
                style={[
                  nfStyles.pickerOptionText,
                  supplierIdx === idx && nfStyles.pickerOptionTextActive,
                ]}
              >
                {s.name}
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
          <Text style={nfStyles.label}>Preis (€) *</Text>
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
        {UNITS.slice(0, 5).map((u) => (
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
  title: { fontFamily: "Inter_700Bold", fontSize: 17, color: Colors.raw.white, marginBottom: 18 },
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
  dropdownText: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.raw.white },
  pickerOptions: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    marginTop: 4,
    overflow: "hidden",
    maxHeight: 200,
  },
  pickerOption: { paddingHorizontal: 14, paddingVertical: 10 },
  pickerOptionActive: { backgroundColor: Colors.raw.amber500 + "18" },
  pickerOptionText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc400 },
  pickerOptionTextActive: { color: Colors.raw.amber500 },
  row: { flexDirection: "row", gap: 12 },
  unitRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  unitChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  unitChipActive: { backgroundColor: Colors.raw.amber500 },
  unitChipInactive: { backgroundColor: Colors.raw.zinc800 },
  unitChipText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  unitChipTextActive: { color: "#000" },
  unitChipTextInactive: { color: Colors.raw.zinc400 },
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
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
});

/* ─── SuccessToast ───────────────────────────── */

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
  text: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.raw.emerald500, flex: 1 },
});

/* ─── Main Screen ────────────────────────────── */

export default function AssignMaterialSheet() {
  const { name, materialId, trade } = useLocalSearchParams<{
    name: string;
    materialId?: string;
    trade?: string;
  }>();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const flashValue = useSharedValue(0);

  // React Query hooks
  const { data: products = [], isLoading: loading } = useProducts(name, trade);
  const { data: suppliers = [] } = useSuppliers();
  const { data: materialInfo } = useMaterialInfo(materialId);
  const assignMutation = useAssignProduct();
  const createMutation = useCreateAndAssignProduct();

  const saving = assignMutation.isPending || createMutation.isPending;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.supplier.toLowerCase().includes(q) ||
        p.articleNr.toLowerCase().includes(q)
    );
  }, [search, products]);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashValue.value,
  }));

  // Assign product to material
  const assignProduct = async (productId: string, _productName: string) => {
    if (!materialId) {
      // No material ID → just show success and go back
      return true;
    }

    try {
      const product = products.find((p) => p.id === productId);
      await assignMutation.mutateAsync({
        materialId,
        productId,
        currentUseCount: product?.useCount ?? 0,
      });
      return true;
    } catch {
      return false;
    }
  };

  const handleSelect = useCallback(
    async (product: Product) => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const success = await assignProduct(product.id, product.name);
      if (success) {
        setSelectedProduct(product);
        flashValue.value = withSequence(
          withTiming(0.35, { duration: 150 }),
          withTiming(0, { duration: 400 })
        );
        setTimeout(() => {
          router.back();
        }, 1000);
      }
    },
    [flashValue, materialId]
  );

  const handleNewProductSave = useCallback(
    async (p: { name: string; supplier: string; supplierId?: string; articleNr: string; price: number; unit: string }) => {
      try {
        const result = await createMutation.mutateAsync({
          name: p.name,
          supplierId: p.supplierId,
          articleNr: p.articleNr !== "-" ? p.articleNr : "-",
          price: p.price,
          unit: p.unit,
          materialType: name || undefined,
          trade: trade || undefined,
          materialId: materialId || undefined,
        });

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        setSelectedProduct({
          id: result.id,
          name: p.name,
          supplier: p.supplier,
          articleNr: p.articleNr,
          price: p.price.toFixed(2).replace(".", ","),
          priceNum: p.price,
          unit: p.unit,
          favorite: false,
          useCount: 1,
          isNew: true,
        });

        flashValue.value = withSequence(
          withTiming(0.35, { duration: 150 }),
          withTiming(0, { duration: 400 })
        );
        setTimeout(() => {
          router.back();
        }, 1000);
      } catch {
        // mutation error handled by React Query
      }
    },
    [createMutation, materialId, name, trade, flashValue]
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
          {materialInfo ? (
            <>
              <Text style={styles.subtitle}>
                Bedarf: {materialInfo.quantity.toFixed(1)} {materialInfo.unit}
              </Text>
              <Text style={styles.subtitle}>
                Gewerk: {materialInfo.trade} • {materialInfo.positionCount} Positionen
              </Text>
            </>
          ) : (
            <Text style={styles.subtitle}>Produkt auswählen</Text>
          )}
        </View>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.7 : 1 }]}
          testID="close-assign"
        >
          <Ionicons name="close" size={24} color={Colors.raw.zinc400} />
        </Pressable>
      </View>

      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="small" color={Colors.raw.amber500} />
          <Text style={styles.savingText}>Wird gespeichert...</Text>
        </View>
      )}

      {selectedProduct ? (
        <View style={styles.successArea}>
          <SuccessToast productName={selectedProduct.name} />
        </View>
      ) : loading ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator size="large" color={Colors.raw.amber500} />
          <Text style={styles.loadingText}>Produkte werden geladen...</Text>
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
                <NewProductForm onSave={handleNewProductSave} suppliers={suppliers} />
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
                  <Text style={styles.emptyText}>
                    {search ? "Kein Produkt gefunden" : "Keine passenden Produkte vorhanden"}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Neues Produkt anlegen oder Suche anpassen
                  </Text>
                </View>
              ) : null
            }
          />
        </>
      )}
    </View>
  );
}

/* ─── Styles ─────────────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950, paddingTop: 8 },
  flashOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 90 },
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
  title: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.raw.white, marginBottom: 6 },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc400,
    marginBottom: 2,
  },
  closeBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: 8 },
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
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
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
  newProductText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.amber500 },
  successArea: { flex: 1, justifyContent: "center" },
  loadingArea: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.raw.zinc500 },
  empty: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.raw.zinc600 },
  emptySubtext: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc700,
    textAlign: "center",
  },
  savingOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    backgroundColor: Colors.raw.zinc900,
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  savingText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc400 },
});
