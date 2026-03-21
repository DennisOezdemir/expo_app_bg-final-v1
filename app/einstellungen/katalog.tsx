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
import { useState, useMemo } from "react";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useCatalogs, useCatalogPositions, useCatalogTrades } from "@/hooks/queries/useCatalogs";
import type { Catalog, CatalogPosition } from "@/lib/api/catalogs";

type ViewType = "catalogs" | "positions" | "detail";

export default function KatalogScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [view, setView] = useState<ViewType>("catalogs");
  const [selectedCatalog, setSelectedCatalog] = useState<Catalog | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<CatalogPosition | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrade, setSelectedTrade] = useState("Alle");

  const { data: catalogs, isLoading: catalogsLoading } = useCatalogs();
  const { data: positions, isLoading: positionsLoading } = useCatalogPositions(
    selectedCatalog?.id,
    searchQuery || undefined,
    selectedTrade !== "Alle" ? selectedTrade : undefined,
  );
  const { data: trades } = useCatalogTrades(selectedCatalog?.id);

  const tradeOptions = useMemo(() => ["Alle", ...(trades ?? [])], [trades]);

  const totalPositions = useMemo(
    () => (catalogs ?? []).reduce((sum, c) => sum + c.position_count, 0),
    [catalogs],
  );

  const openCatalog = (catalog: Catalog) => {
    setSelectedCatalog(catalog);
    setSearchQuery("");
    setSelectedTrade("Alle");
    setView("positions");
  };

  const openPosition = (position: CatalogPosition) => {
    setSelectedPosition(position);
    setView("detail");
  };

  const handleBack = () => {
    if (view === "detail") {
      setSelectedPosition(null);
      setView("positions");
    } else if (view === "positions") {
      setSelectedCatalog(null);
      setView("catalogs");
    } else {
      router.back();
    }
  };

  const formatPrice = (price: number): string =>
    price.toFixed(2).replace(".", ",");

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topInset + 20, paddingBottom: bottomInset + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          testID="katalog-back"
        >
          <Ionicons name="chevron-back" size={22} color={Colors.raw.amber500} />
          <Text style={styles.backText}>
            {view === "catalogs"
              ? "Zurück"
              : view === "positions"
                ? "Kataloge"
                : selectedCatalog?.name || "Positionen"}
          </Text>
        </Pressable>

        {view === "catalogs" && renderCatalogsView()}
        {view === "positions" && renderPositionsView()}
        {view === "detail" && renderDetailView()}
      </ScrollView>
    </View>
  );

  function renderCatalogsView() {
    if (catalogsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.raw.amber500} />
          <Text style={styles.loadingText}>Kataloge laden...</Text>
        </View>
      );
    }

    return (
      <>
        <Text style={styles.title}>Kataloge</Text>
        <Text style={styles.subtitle}>
          {catalogs?.length ?? 0} Kataloge • {totalPositions} Positionen
        </Text>

        <View style={{ marginTop: 20, gap: 10 }}>
          {(catalogs ?? []).map((catalog) => (
            <Pressable
              key={catalog.id}
              onPress={() => openCatalog(catalog)}
              style={({ pressed }) => [styles.catalogCard, { opacity: pressed ? 0.7 : 1 }]}
              testID={`catalog-${catalog.code}`}
            >
              <View style={styles.catalogLeft}>
                <View style={styles.catalogIcon}>
                  <Ionicons name="book-outline" size={22} color={Colors.raw.amber500} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.catalogName} numberOfLines={1}>
                    {catalog.name}
                  </Text>
                  <Text style={styles.catalogMeta}>
                    {catalog.code} • {catalog.position_count} Positionen
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.raw.zinc600} />
            </Pressable>
          ))}
        </View>
      </>
    );
  }

  function renderPositionsView() {
    if (!selectedCatalog) return null;

    return (
      <>
        <Text style={styles.title} numberOfLines={1}>
          {selectedCatalog.name}
        </Text>
        <Text style={styles.subtitle}>
          {selectedCatalog.position_count} Positionen • {selectedCatalog.code}
        </Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.raw.zinc500} />
          <TextInput
            style={styles.searchInput}
            placeholder="Code oder Titel suchen..."
            placeholderTextColor={Colors.raw.zinc500}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={Colors.raw.zinc500} />
            </Pressable>
          )}
        </View>

        {(trades ?? []).length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tradeScroll}
            contentContainerStyle={styles.tradeScrollContent}
          >
            {tradeOptions.map((trade) => (
              <Pressable
                key={trade}
                onPress={() => setSelectedTrade(trade)}
                style={[
                  styles.tradeChip,
                  selectedTrade === trade && styles.tradeChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.tradeChipText,
                    selectedTrade === trade && styles.tradeChipTextActive,
                  ]}
                >
                  {trade}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {positionsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.raw.amber500} />
          </View>
        ) : (positions ?? []).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={40} color={Colors.raw.zinc600} />
            <Text style={styles.emptyText}>Keine Positionen gefunden</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {(positions ?? []).map((position, i) => (
              <View key={position.id}>
                <Pressable
                  onPress={() => openPosition(position)}
                  style={({ pressed }) => [styles.positionRow, { opacity: pressed ? 0.7 : 1 }]}
                  testID={`position-${position.position_code}`}
                >
                  <View style={styles.positionLeft}>
                    <Text style={styles.positionNr}>{position.position_code}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.positionName} numberOfLines={1}>
                        {position.title}
                      </Text>
                      {position.trade && (
                        <Text style={styles.positionTrade}>{position.trade}</Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.positionPrice}>
                    €{formatPrice(position.base_price_eur)}/{position.unit ?? "Stk"}
                  </Text>
                </Pressable>
                {i < (positions?.length ?? 0) - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        )}
      </>
    );
  }

  function renderDetailView() {
    if (!selectedPosition) return null;

    return (
      <>
        <Text style={styles.title}>Position {selectedPosition.position_code}</Text>
        <Text style={styles.detailName}>{selectedPosition.title}</Text>

        {selectedPosition.title_secondary && (
          <>
            <Text style={styles.sectionLabel}>Originaltext</Text>
            <View style={styles.card}>
              <Text style={styles.secondaryText}>{selectedPosition.title_secondary}</Text>
            </View>
          </>
        )}

        {selectedPosition.description && (
          <>
            <Text style={styles.sectionLabel}>Beschreibung</Text>
            <View style={styles.card}>
              <Text style={styles.descriptionText}>{selectedPosition.description}</Text>
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>Details</Text>
        <View style={styles.card}>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Einheit</Text>
            <Text style={styles.formValue}>{selectedPosition.unit ?? "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Grundpreis</Text>
            <Text style={styles.endpreis}>
              €{formatPrice(selectedPosition.base_price_eur)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Gewerk</Text>
            <Text style={styles.formValue}>{selectedPosition.trade ?? "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Kategorie</Text>
            <Text style={styles.formValue}>{selectedPosition.category ?? "—"}</Text>
          </View>
          {selectedPosition.parent_code && (
            <>
              <View style={styles.divider} />
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Oberposition</Text>
                <Text style={styles.formValue}>{selectedPosition.parent_code}</Text>
              </View>
            </>
          )}
        </View>

        <Text style={styles.sectionLabel}>Katalog</Text>
        <View style={styles.card}>
          <View style={styles.formRow}>
            <Ionicons name="book-outline" size={18} color={Colors.raw.zinc400} />
            <Text style={styles.catalogInfoText}>{selectedCatalog?.name ?? "—"}</Text>
          </View>
        </View>
      </>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  backText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.raw.amber500,
  },

  title: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 28,
    color: Colors.raw.white,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc400,
    marginBottom: 4,
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

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc500,
  },

  catalogCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 16,
  },
  catalogLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  catalogIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.raw.amber500 + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  catalogName: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.white,
  },
  catalogMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
    marginTop: 2,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginTop: 16,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.white,
    padding: 0,
  },

  tradeScroll: { marginBottom: 16 },
  tradeScrollContent: { gap: 8 },
  tradeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.raw.zinc800,
  },
  tradeChipActive: { backgroundColor: Colors.raw.amber500 },
  tradeChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc400,
  },
  tradeChipTextActive: { color: "#000" },

  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingHorizontal: 18,
    paddingVertical: 4,
    marginBottom: 20,
  },
  divider: { height: 1, backgroundColor: Colors.raw.zinc800 },

  positionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    gap: 8,
  },
  positionLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  positionNr: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.raw.amber500,
    width: 70,
    marginTop: 2,
  },
  positionName: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.white,
  },
  positionTrade: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginTop: 2,
  },
  positionPrice: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc400,
    flexShrink: 0,
  },

  detailName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.raw.white,
    marginBottom: 20,
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

  secondaryText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc300,
    paddingVertical: 12,
    lineHeight: 20,
  },

  descriptionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc300,
    paddingVertical: 12,
    lineHeight: 20,
  },

  formRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    gap: 12,
  },
  formLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc400,
  },
  formValue: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.white,
  },
  endpreis: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.amber500,
  },

  catalogInfoText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc300,
    marginLeft: 8,
  },
});
