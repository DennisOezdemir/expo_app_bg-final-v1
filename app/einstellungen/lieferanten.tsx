import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useSuppliers, useSupplierArticles } from "@/hooks/queries/useSuppliers";
import type { Supplier } from "@/lib/api/suppliers";

export default function LieferantenScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [search, setSearch] = useState("");
  const [showArticles, setShowArticles] = useState(false);

  const { data: suppliers, isLoading } = useSuppliers();
  const { data: articles, isLoading: articlesLoading } = useSupplierArticles(
    showArticles ? selectedSupplier?.id : undefined,
  );

  const filteredSuppliers = (suppliers ?? []).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.supplier_code ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const selectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowArticles(false);
  };

  const formatDays = (days: number | null) =>
    days != null ? `${days} Tage` : "—";

  const formatEuro = (val: number | null) =>
    val != null ? `€${val.toFixed(2).replace(".", ",")}` : "—";

  const formatPercent = (val: number | null) =>
    val != null ? `${val}%` : "—";

  if (selectedSupplier) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: topInset + 12, paddingBottom: bottomInset + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => { setSelectedSupplier(null); setShowArticles(false); }}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.raw.white} />
          </Pressable>

          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>{selectedSupplier.name}</Text>
            {selectedSupplier.is_preferred && (
              <Ionicons name="star" size={24} color={Colors.raw.amber500} />
            )}
          </View>

          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{selectedSupplier.supplier_type}</Text>
          </View>

          <Text style={styles.sectionLabel}>Kontakt</Text>
          <View style={styles.card}>
            <InfoRow label="Telefon" value={selectedSupplier.phone} icon="call-outline" />
            <View style={styles.divider} />
            <InfoRow label="Email" value={selectedSupplier.email} icon="mail-outline" />
            {selectedSupplier.website && (
              <>
                <View style={styles.divider} />
                <InfoRow label="Website" value={selectedSupplier.website} icon="globe-outline" />
              </>
            )}
          </View>

          {(selectedSupplier.street || selectedSupplier.city) && (
            <>
              <Text style={styles.sectionLabel}>Adresse</Text>
              <View style={styles.card}>
                <InfoRow
                  label="Anschrift"
                  value={[
                    selectedSupplier.street,
                    [selectedSupplier.zip_code, selectedSupplier.city].filter(Boolean).join(" "),
                  ]
                    .filter(Boolean)
                    .join(", ")}
                  icon="location-outline"
                />
              </View>
            </>
          )}

          <Text style={styles.sectionLabel}>Konditionen</Text>
          <View style={styles.card}>
            <InfoRow label="Kundennummer" value={selectedSupplier.our_customer_number} />
            <View style={styles.divider} />
            <InfoRow label="Rabatt" value={formatPercent(selectedSupplier.discount_percent)} />
            <View style={styles.divider} />
            <InfoRow label="Zahlungsziel" value={formatDays(selectedSupplier.payment_terms_days)} />
            <View style={styles.divider} />
            <InfoRow label="Mindestbestellwert" value={formatEuro(selectedSupplier.min_order_value)} />
            <View style={styles.divider} />
            <InfoRow label="Lieferzeit" value={formatDays(selectedSupplier.delivery_days)} />
          </View>

          {selectedSupplier.categories && selectedSupplier.categories.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Kategorien</Text>
              <View style={styles.categoriesRow}>
                {selectedSupplier.categories.map((cat) => (
                  <View key={cat} style={styles.categoryChip}>
                    <Text style={styles.categoryChipText}>{cat}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <Pressable
            onPress={() => setShowArticles(!showArticles)}
            style={({ pressed }) => [styles.artikelRow, { opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={styles.artikelLeft}>
              <Ionicons name="cube-outline" size={20} color={Colors.raw.zinc400} />
              <Text style={styles.artikelText}>
                {selectedSupplier.article_count ?? 0} Artikel
              </Text>
            </View>
            <Ionicons
              name={showArticles ? "chevron-up" : "chevron-down"}
              size={20}
              color={Colors.raw.amber500}
            />
          </Pressable>

          {showArticles && (
            <View style={styles.card}>
              {articlesLoading ? (
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                  <ActivityIndicator color={Colors.raw.amber500} />
                </View>
              ) : (articles ?? []).length === 0 ? (
                <Text style={styles.emptyText}>Keine Artikel hinterlegt</Text>
              ) : (
                (articles ?? []).map((art, i) => (
                  <View key={art.id}>
                    <View style={styles.articleRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.articleName}>{art.supplier_article_name}</Text>
                        <Text style={styles.articleMeta}>
                          {[art.supplier_article_number, art.category, art.manufacturer]
                            .filter(Boolean)
                            .join(" • ")}
                        </Text>
                      </View>
                      <Text style={styles.articleUnit}>{art.purchase_unit}</Text>
                    </View>
                    {i < (articles?.length ?? 0) - 1 && <View style={styles.divider} />}
                  </View>
                ))
              )}
            </View>
          )}

          {selectedSupplier.notes && (
            <>
              <Text style={styles.sectionLabel}>Notizen</Text>
              <View style={styles.card}>
                <Text style={styles.notesText}>{selectedSupplier.notes}</Text>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topInset + 12, paddingBottom: bottomInset + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.raw.white} />
        </Pressable>

        <Text style={styles.title}>Lieferanten</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.raw.zinc500} />
          <TextInput
            style={styles.searchInput}
            placeholder="Name oder Code suchen..."
            placeholderTextColor={Colors.raw.zinc500}
            value={search}
            onChangeText={setSearch}
            selectionColor={Colors.raw.amber500}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={Colors.raw.zinc500} />
            </Pressable>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.raw.amber500} />
            <Text style={styles.loadingText}>Lieferanten laden...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.countText}>
              {filteredSuppliers.length} Lieferanten
              {search ? ` (von ${suppliers?.length ?? 0})` : ""}
            </Text>

            {filteredSuppliers.map((supplier) => (
              <Pressable
                key={supplier.id}
                onPress={() => selectSupplier(supplier)}
                style={({ pressed }) => [styles.supplierCard, { opacity: pressed ? 0.85 : 1 }]}
              >
                <View style={styles.supplierTop}>
                  <View style={styles.supplierNameRow}>
                    <Text style={styles.supplierName}>{supplier.name}</Text>
                    {supplier.is_preferred && (
                      <Ionicons name="star" size={16} color={Colors.raw.amber500} />
                    )}
                  </View>
                  <Text style={styles.supplierType}>{supplier.supplier_type}</Text>
                </View>
                <Text style={styles.supplierMeta}>
                  {[
                    supplier.our_customer_number ? `Kd.Nr: ${supplier.our_customer_number}` : null,
                    `${supplier.article_count ?? 0} Artikel`,
                  ]
                    .filter(Boolean)
                    .join("  ·  ")}
                </Text>
                {supplier.phone && (
                  <View style={styles.supplierPhone}>
                    <Ionicons name="call-outline" size={14} color={Colors.raw.zinc500} />
                    <Text style={styles.supplierTel}>{supplier.phone}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: string;
}) {
  return (
    <View style={styles.infoRow}>
      {icon && (
        <Ionicons name={icon as any} size={18} color={Colors.raw.zinc500} style={{ marginRight: 8 }} />
      )}
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  backBtn: {
    marginBottom: 12,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.raw.zinc900,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 30,
    color: Colors.raw.white,
    marginBottom: 20,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.white,
    padding: 0,
  },

  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc500,
  },

  countText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc500,
    marginBottom: 14,
  },

  supplierCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 18,
    marginBottom: 10,
  },
  supplierTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  supplierNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  supplierName: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.white,
  },
  supplierType: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.raw.zinc400,
    backgroundColor: Colors.raw.zinc800,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
  },
  supplierMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc400,
    marginBottom: 6,
  },
  supplierPhone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  supplierTel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },

  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailTitle: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 26,
    color: Colors.raw.white,
    flex: 1,
    marginRight: 12,
  },

  typeBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.raw.amber500 + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  typeBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.amber500,
  },

  sectionLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.raw.zinc400,
    marginBottom: 10,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginBottom: 20,
  },
  divider: { height: 1, backgroundColor: Colors.raw.zinc800 },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc500,
    flex: 1,
  },
  infoValue: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.white,
    textAlign: "right",
    flex: 1,
  },

  categoriesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  categoryChip: {
    backgroundColor: Colors.raw.zinc800,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.zinc300,
  },

  artikelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 20,
  },
  artikelLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  artikelText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc400,
  },

  articleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  articleName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.white,
  },
  articleMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginTop: 2,
  },
  articleUnit: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.zinc400,
    backgroundColor: Colors.raw.zinc800,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
  },

  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
    paddingVertical: 14,
  },

  notesText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc300,
    paddingVertical: 12,
    lineHeight: 20,
  },
});
