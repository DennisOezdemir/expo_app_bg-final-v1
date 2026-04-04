import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { usePositionMaterials, useSaveMaterials } from "@/hooks/queries/usePositionMaterials";
import { searchProducts } from "@/lib/api/product-search";
import { deleteMaterialRequirement } from "@/lib/api/position-materials";
import type { MaterialRequirement, SaveMaterialInput } from "@/lib/api/position-materials";
import type { Product } from "@/lib/api/materials";

interface Props {
  catalogPositionV2Id: string;
  catalogPositionNr: string;
  trade: string;
  visible: boolean;
  onClose: () => void;
}

type EditorMode = "list" | "search" | "freitext";

interface LocalMaterial {
  id?: string;
  material_type: string;
  default_quantity: number;
  quantity_unit: string;
  quantity_mode: string;
  default_product_id: string | null;
  is_optional: boolean;
  notes?: string;
  trade?: string;
  category?: string;
  // Display
  product_name: string | null;
  last_price_net_eur: number | null;
  supplier_name: string | null;
}

function toLocal(req: MaterialRequirement): LocalMaterial {
  return {
    id: req.id,
    material_type: req.material_type,
    default_quantity: req.default_quantity,
    quantity_unit: req.quantity_unit,
    quantity_mode: req.quantity_mode,
    default_product_id: req.default_product_id,
    is_optional: req.is_optional,
    notes: req.notes ?? undefined,
    trade: req.trade ?? undefined,
    category: req.category ?? undefined,
    product_name: req.product_name,
    last_price_net_eur: req.last_price_net_eur,
    supplier_name: req.supplier_name,
  };
}

export default function MaterialRequirementsEditor({
  catalogPositionV2Id,
  catalogPositionNr,
  trade,
  visible,
  onClose,
}: Props) {
  const { data: existing = [], isLoading } = usePositionMaterials(
    visible ? catalogPositionV2Id : undefined,
  );
  const saveMutation = useSaveMaterials();

  const [materials, setMaterials] = useState<LocalMaterial[]>([]);
  const [dirty, setDirty] = useState(false);
  const [mode, setMode] = useState<EditorMode>("list");
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [freitextName, setFreitextName] = useState("");
  const [freitextQty, setFreitextQty] = useState("1");
  const [freitextUnit, setFreitextUnit] = useState("Stk");

  // Sync from server when data arrives
  useEffect(() => {
    if (visible && existing.length >= 0 && !dirty) {
      setMaterials(existing.map(toLocal));
    }
  }, [existing, visible, dirty]);

  // Reset on open
  useEffect(() => {
    if (visible) {
      setMode("list");
      setDirty(false);
      setSearchText("");
      setSearchResults([]);
      setFreitextName("");
      setFreitextQty("1");
      setFreitextUnit("Stk");
    }
  }, [visible]);

  // Debounced product search
  useEffect(() => {
    if (mode !== "search") return;
    const timer = setTimeout(() => {
      setSearchLoading(true);
      searchProducts(searchText || undefined, searchText ? undefined : trade)
        .then((prods) => {
          setSearchResults(prods);
          setSearchLoading(false);
        })
        .catch(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText, mode, trade]);

  const handleRemoveMaterial = useCallback(
    (index: number) => {
      const item = materials[index];
      Alert.alert("Material entfernen", `"${item.product_name || item.material_type}" wirklich entfernen?`, [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Entfernen",
          style: "destructive",
          onPress: async () => {
            // If it has a server ID, delete immediately
            if (item.id) {
              try {
                await deleteMaterialRequirement(item.id);
              } catch {
                // ignore, will sync on save
              }
            }
            setMaterials((prev) => prev.filter((_, i) => i !== index));
            setDirty(true);
          },
        },
      ]);
    },
    [materials],
  );

  const handleSelectProduct = useCallback(
    (product: Product) => {
      const newMat: LocalMaterial = {
        material_type: product.name,
        default_quantity: 1,
        quantity_unit: product.unit || "Stk",
        quantity_mode: "per_unit",
        default_product_id: product.id,
        is_optional: false,
        trade: trade,
        product_name: product.name,
        last_price_net_eur: product.priceNum,
        supplier_name: product.supplier,
      };
      setMaterials((prev) => [...prev, newMat]);
      setDirty(true);
      setMode("list");
      setSearchText("");
    },
    [trade],
  );

  const handleAddFreitext = useCallback(() => {
    if (!freitextName.trim()) return;
    const newMat: LocalMaterial = {
      material_type: freitextName.trim(),
      default_quantity: Number(freitextQty) || 1,
      quantity_unit: freitextUnit || "Stk",
      quantity_mode: "per_unit",
      default_product_id: null,
      is_optional: false,
      trade: trade,
      product_name: null,
      last_price_net_eur: null,
      supplier_name: null,
    };
    setMaterials((prev) => [...prev, newMat]);
    setDirty(true);
    setMode("list");
    setFreitextName("");
    setFreitextQty("1");
    setFreitextUnit("Stk");
  }, [freitextName, freitextQty, freitextUnit, trade]);

  const handleUpdateQuantity = useCallback((index: number, newQty: string) => {
    const num = Number(newQty);
    if (isNaN(num) || num < 0) return;
    setMaterials((prev) =>
      prev.map((m, i) => (i === index ? { ...m, default_quantity: num } : m)),
    );
    setDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    const toSave: SaveMaterialInput[] = materials.map((m) => ({
      id: m.id,
      material_type: m.material_type,
      default_quantity: m.default_quantity,
      quantity_unit: m.quantity_unit,
      quantity_mode: m.quantity_mode,
      default_product_id: m.default_product_id,
      is_optional: m.is_optional,
      notes: m.notes,
      trade: m.trade,
      category: m.category,
    }));
    try {
      await saveMutation.mutateAsync({
        catalogPositionV2Id,
        materials: toSave,
      });
      setDirty(false);
      onClose();
    } catch (err: any) {
      Alert.alert("Fehler beim Speichern", err.message || "Bitte erneut versuchen.");
    }
  }, [materials, catalogPositionV2Id, saveMutation, onClose]);

  const handleClose = useCallback(() => {
    if (dirty) {
      Alert.alert("Nicht gespeichert", "Änderungen verwerfen?", [
        { text: "Abbrechen", style: "cancel" },
        { text: "Verwerfen", style: "destructive", onPress: () => { setDirty(false); onClose(); } },
      ]);
    } else {
      onClose();
    }
  }, [dirty, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={es.overlay}>
          <Pressable style={{ flex: 1 }} onPress={handleClose} />
          <View style={es.sheet}>
            <View style={es.handle} />

            {/* Header */}
            <View style={es.header}>
              <View style={{ flex: 1 }}>
                <Text style={es.headerTitle}>Materialien</Text>
                <Text style={es.headerSub}>Position {catalogPositionNr}</Text>
              </View>
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [es.closeBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name="close" size={22} color={Colors.raw.zinc400} />
              </Pressable>
            </View>

            {isLoading ? (
              <View style={es.centered}>
                <ActivityIndicator size="large" color={Colors.raw.amber500} />
              </View>
            ) : mode === "list" ? (
              /* ─── LIST MODE ─── */
              <ScrollView
                style={{ maxHeight: 450 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {materials.length === 0 ? (
                  <View style={es.emptyState}>
                    <Ionicons name="cube-outline" size={36} color={Colors.raw.zinc700} />
                    <Text style={es.emptyText}>Noch kein Material zugeordnet</Text>
                  </View>
                ) : (
                  materials.map((mat, idx) => (
                    <View key={mat.id ?? `new-${idx}`} style={es.matRow}>
                      <View style={es.matInfo}>
                        <Text style={es.matName} numberOfLines={1}>
                          {mat.product_name || mat.material_type}
                        </Text>
                        <View style={es.matMeta}>
                          {mat.supplier_name ? (
                            <Text style={es.matSupplier}>{mat.supplier_name}</Text>
                          ) : null}
                          {mat.last_price_net_eur != null ? (
                            <Text style={es.matPrice}>
                              {"\u20AC"}
                              {mat.last_price_net_eur.toFixed(2).replace(".", ",")}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      <View style={es.matQtyWrap}>
                        <TextInput
                          style={es.matQtyInput}
                          value={String(mat.default_quantity)}
                          onChangeText={(t) => handleUpdateQuantity(idx, t)}
                          keyboardType="numeric"
                          selectTextOnFocus
                        />
                        <Text style={es.matUnit}>{mat.quantity_unit}</Text>
                      </View>
                      <Pressable
                        onPress={() => handleRemoveMaterial(idx)}
                        style={({ pressed }) => [es.deleteBtn, { opacity: pressed ? 0.7 : 1 }]}
                        hitSlop={8}
                      >
                        <Ionicons name="trash-outline" size={18} color={Colors.raw.rose500} />
                      </Pressable>
                    </View>
                  ))
                )}

                {/* Add-Buttons */}
                <View style={es.addRow}>
                  <Pressable
                    onPress={() => setMode("search")}
                    style={({ pressed }) => [es.addBtn, { opacity: pressed ? 0.85 : 1 }]}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={Colors.raw.amber500} />
                    <Text style={es.addBtnText}>Material hinzuf{"\u00FC"}gen</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setMode("freitext")}
                    style={({ pressed }) => [es.addBtnSecondary, { opacity: pressed ? 0.85 : 1 }]}
                  >
                    <Ionicons name="create-outline" size={18} color={Colors.raw.zinc400} />
                    <Text style={es.addBtnSecondaryText}>Freitext</Text>
                  </Pressable>
                </View>

                <View style={{ height: 16 }} />
              </ScrollView>
            ) : mode === "search" ? (
              /* ─── SEARCH MODE ─── */
              <>
                <View style={es.searchRow}>
                  <Ionicons name="search" size={18} color={Colors.raw.zinc500} />
                  <TextInput
                    style={es.searchInput}
                    placeholder="Material suchen..."
                    placeholderTextColor={Colors.raw.zinc600}
                    value={searchText}
                    onChangeText={setSearchText}
                    autoCapitalize="none"
                    autoFocus
                  />
                  {searchText.length > 0 && (
                    <Pressable onPress={() => setSearchText("")}>
                      <Ionicons name="close-circle" size={18} color={Colors.raw.zinc500} />
                    </Pressable>
                  )}
                </View>

                {!searchText && (
                  <Text style={es.tradeHint}>Vorschl{"\u00E4"}ge f{"\u00FC"}r {trade}</Text>
                )}

                <ScrollView
                  style={{ maxHeight: 350 }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {searchLoading ? (
                    <View style={es.centered}>
                      <ActivityIndicator size="large" color={Colors.raw.amber500} />
                    </View>
                  ) : searchResults.length === 0 ? (
                    <View style={es.emptyState}>
                      <Ionicons name="search-outline" size={32} color={Colors.raw.zinc700} />
                      <Text style={es.emptyText}>Keine Produkte gefunden</Text>
                    </View>
                  ) : (
                    searchResults.map((product) => (
                      <Pressable
                        key={product.id}
                        onPress={() => handleSelectProduct(product)}
                        style={({ pressed }) => [es.productRow, { opacity: pressed ? 0.85 : 1 }]}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            {product.favorite && (
                              <Ionicons name="star" size={14} color={Colors.raw.amber500} />
                            )}
                            <Text style={es.productName} numberOfLines={1}>
                              {product.name}
                            </Text>
                          </View>
                          <Text style={es.productMeta}>
                            {product.supplier} {"\u00B7"} {product.useCount}x verwendet
                          </Text>
                        </View>
                        <Text style={es.productPrice}>
                          {"\u20AC"}
                          {product.price}
                        </Text>
                      </Pressable>
                    ))
                  )}
                  <View style={{ height: 16 }} />
                </ScrollView>

                <View style={es.bottomBar}>
                  <Pressable
                    onPress={() => setMode("list")}
                    style={({ pressed }) => [es.backBtn, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Ionicons name="arrow-back" size={18} color={Colors.raw.zinc400} />
                    <Text style={es.backBtnText}>Zur{"\u00FC"}ck</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              /* ─── FREITEXT MODE ─── */
              <>
                <View style={es.freitextForm}>
                  <Text style={es.freitextLabel}>Materialbezeichnung</Text>
                  <TextInput
                    style={es.freitextInput}
                    placeholder="z.B. Rigips-Platte 12,5mm"
                    placeholderTextColor={Colors.raw.zinc600}
                    value={freitextName}
                    onChangeText={setFreitextName}
                    autoFocus
                  />

                  <View style={es.freitextRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={es.freitextLabel}>Menge</Text>
                      <TextInput
                        style={es.freitextInput}
                        value={freitextQty}
                        onChangeText={setFreitextQty}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={es.freitextLabel}>Einheit</Text>
                      <TextInput
                        style={es.freitextInput}
                        value={freitextUnit}
                        onChangeText={setFreitextUnit}
                        placeholder="Stk"
                        placeholderTextColor={Colors.raw.zinc600}
                      />
                    </View>
                  </View>

                  <Pressable
                    onPress={handleAddFreitext}
                    disabled={!freitextName.trim()}
                    style={({ pressed }) => [
                      es.freitextSubmit,
                      !freitextName.trim() && { backgroundColor: Colors.raw.zinc700 },
                      { opacity: pressed && freitextName.trim() ? 0.85 : 1 },
                    ]}
                  >
                    <Ionicons name="add" size={18} color={freitextName.trim() ? Colors.raw.zinc950 : Colors.raw.zinc500} />
                    <Text
                      style={[
                        es.freitextSubmitText,
                        !freitextName.trim() && { color: Colors.raw.zinc500 },
                      ]}
                    >
                      Hinzuf{"\u00FC"}gen
                    </Text>
                  </Pressable>
                </View>

                <View style={es.bottomBar}>
                  <Pressable
                    onPress={() => setMode("list")}
                    style={({ pressed }) => [es.backBtn, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Ionicons name="arrow-back" size={18} color={Colors.raw.zinc400} />
                    <Text style={es.backBtnText}>Zur{"\u00FC"}ck</Text>
                  </Pressable>
                </View>
              </>
            )}

            {/* Save button (only in list mode when dirty) */}
            {mode === "list" && (
              <View style={es.saveBar}>
                <Pressable
                  onPress={handleSave}
                  disabled={!dirty || saveMutation.isPending}
                  style={({ pressed }) => [
                    es.saveBtn,
                    !dirty && { backgroundColor: Colors.raw.zinc700 },
                    { opacity: pressed && dirty ? 0.85 : 1 },
                  ]}
                >
                  {saveMutation.isPending ? (
                    <ActivityIndicator size="small" color={Colors.raw.zinc950} />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={dirty ? Colors.raw.zinc950 : Colors.raw.zinc500}
                      />
                      <Text style={[es.saveBtnText, !dirty && { color: Colors.raw.zinc500 }]}>
                        Speichern ({materials.length} Material{materials.length !== 1 ? "ien" : ""})
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const es = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: Colors.raw.zinc900,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "85%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.raw.zinc700,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.raw.white },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.raw.zinc500, marginTop: 2 },
  closeBtn: { padding: 8 },
  centered: { alignItems: "center", paddingVertical: 32 },
  emptyState: { alignItems: "center", paddingVertical: 28, gap: 8 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc600 },

  // Material row
  matRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
    gap: 10,
  },
  matInfo: { flex: 1 },
  matName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.white },
  matMeta: { flexDirection: "row", gap: 8, marginTop: 2 },
  matSupplier: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500 },
  matPrice: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.raw.amber500 },
  matQtyWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  matQtyInput: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.white,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 48,
    textAlign: "center",
  },
  matUnit: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500 },
  deleteBtn: { padding: 6 },

  // Add buttons
  addRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.raw.amber500 + "18",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.raw.amber500 + "40",
    flex: 1,
    justifyContent: "center",
  },
  addBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.amber500 },
  addBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  addBtnSecondaryText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc400 },

  // Search
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.white,
    padding: 0,
  },
  tradeHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
    gap: 10,
  },
  productName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.white },
  productMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc500, marginTop: 2 },
  productPrice: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.amber500 },

  // Freitext
  freitextForm: { paddingHorizontal: 20, paddingTop: 16 },
  freitextLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginBottom: 6,
    marginTop: 12,
  },
  freitextInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.white,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  freitextRow: { flexDirection: "row", gap: 12 },
  freitextSubmit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 20,
  },
  freitextSubmitText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.zinc950 },

  // Bottom bar
  bottomBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 },
  backBtnText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc400 },

  // Save
  saveBar: { paddingHorizontal: 20, paddingTop: 12 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 12,
    paddingVertical: 14,
  },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.raw.zinc950 },
});
