import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { colors, spacing, radius } from "../../constants/theme";

type Business = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  logo_url: string | null;
  city: string | null;
  gallery: string[] | null;
};

export function ExploreScreen() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("businesses")
      .select("id, name, slug, description, cover_url, logo_url, city, gallery")
      .eq("is_published", true)
      .eq("verification_status", "verified")
      .order("is_featured", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setBusinesses(data);
        setLoading(false);
      });
  }, []);

  const filtered = query
    ? businesses.filter(
        (b) =>
          b.name.toLowerCase().includes(query.toLowerCase()) ||
          b.city?.toLowerCase().includes(query.toLowerCase())
      )
    : businesses;

  const getImage = (biz: Business) => {
    if (biz.cover_url) return biz.cover_url;
    if (biz.gallery && biz.gallery.length > 0) return biz.gallery[0];
    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Search header */}
      <View style={styles.searchBar}>
        <Feather name="search" size={18} color={colors.goldLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search stylists, services, cities..."
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Results */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const imageUrl = getImage(item);
          return (
            <TouchableOpacity style={styles.card} activeOpacity={0.85}>
              <View style={styles.cardImage}>
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.cardPlaceholder}>
                    <Text style={styles.placeholderText}>
                      {item.name.charAt(0)}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.city && (
                  <View style={styles.locationRow}>
                    <Feather
                      name="map-pin"
                      size={12}
                      color={colors.mutedForeground}
                    />
                    <Text style={styles.cardCity}>{item.city}</Text>
                  </View>
                )}
                {item.description && (
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="search" size={40} color={colors.borderDark} />
            <Text style={styles.emptyText}>
              {loading ? "Loading stylists..." : "No stylists found"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.darkBg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.cream,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: 12,
  },
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.darkBg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    overflow: "hidden",
  },
  cardImage: {
    height: 160,
    backgroundColor: colors.mutedDark,
  },
  cardPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 40,
    fontWeight: "700",
    color: colors.gold,
  },
  cardBody: {
    padding: spacing.md,
  },
  cardName: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.cream,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  cardCity: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 6,
    lineHeight: 18,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 15,
  },
});
