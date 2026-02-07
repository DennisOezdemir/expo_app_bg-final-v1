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
import { useState } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface Supplier {
  id: string;
  name: string;
  short: string;
  price: string;
  favorite: boolean;
  useCount: number;
}

const SUPPLIERS: Supplier[] = [
  { id: "1", name: "MEGA Einkaufszentrum", short: "MEGA", price: "\u20AC42,90", favorite: true, useCount: 34 },
  { id: "2", name: "Baustoff Weber AG", short: "Weber", price: "\u20AC44,50", favorite: true, useCount: 28 },
  { id: "3", name: "Farben Schmidt GmbH", short: "Schmidt", price: "\u20AC39,80", favorite: false, useCount: 15 },
  { id: "4", name: "Malerprofi24 Online", short: "MP24", price: "\u20AC41,20", favorite: false, useCount: 12 },
  { id: "5", name: "Brillux Direktvertrieb", short: "Brillux", price: "\u20AC46,10", favorite: false, useCount: 8 },
  { id: "6", name: "Caparol Fachhandel", short: "Caparol", price: "\u20AC48,50", favorite: false, useCount: 5 },
];

export default function AssignMaterialSheet() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const filtered = SUPPLIERS
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.short.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return b.useCount - a.useCount;
    });

  const handleSelect = (supplier: Supplier) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.back();
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Zuordnen</Text>
        <Text style={styles.subtitle}>{name || "Material"}</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.raw.zinc500} />
        <TextInput
          style={styles.searchInput}
          placeholder="Lieferant suchen..."
          placeholderTextColor={Colors.raw.zinc600}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
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
          <Pressable
            onPress={() => handleSelect(item)}
            style={({ pressed }) => [
              styles.supplierRow,
              { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
          >
            <View style={styles.supplierLeft}>
              <View style={styles.supplierNameRow}>
                {item.favorite && (
                  <Ionicons name="star" size={14} color={Colors.raw.amber500} />
                )}
                <Text style={styles.supplierName}>{item.name}</Text>
              </View>
              <Text style={styles.supplierMeta}>
                {item.useCount}x verwendet
              </Text>
            </View>
            <View style={styles.supplierRight}>
              <Text style={styles.supplierPrice}>{item.price}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.raw.zinc600} />
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={36} color={Colors.raw.zinc700} />
            <Text style={styles.emptyText}>Kein Lieferant gefunden</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
    paddingTop: 16,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.raw.white,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc500,
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
    gap: 6,
  },
  supplierRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 16,
  },
  supplierLeft: {
    flex: 1,
    marginRight: 12,
  },
  supplierNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  supplierName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.white,
  },
  supplierMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  supplierRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  supplierPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.amber500,
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
