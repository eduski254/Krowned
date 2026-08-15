import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { colors, spacing, radius } from "../../constants/theme";

const POPULAR_SERVICES = [
  "Knotless Braids",
  "Locs",
  "Silk Press",
  "Sew-In",
  "Retwist",
  "Fade",
  "Cornrows",
  "Box Braids",
];

type FeaturedBusiness = {
  id: string;
  name: string;
  slug: string;
  cover_url: string | null;
  logo_url: string | null;
  city: string | null;
};

export function HomeScreen() {
  const [featured, setFeatured] = useState<FeaturedBusiness[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    supabase
      .from("businesses")
      .select("id, name, slug, cover_url, logo_url, city")
      .eq("is_published", true)
      .eq("verification_status", "verified")
      .eq("is_featured", true)
      .limit(10)
      .then(({ data }) => {
        if (data) setFeatured(data);
      });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("../../../assets/logo-white.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Feather
            name="search"
            size={18}
            color={colors.goldLight}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Knotless braids, retwist, silk press..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Popular services chips */}
        <Text style={styles.sectionLabel}>Popular services</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {POPULAR_SERVICES.map((service) => (
            <TouchableOpacity key={service} style={styles.chip} activeOpacity={0.7}>
              <Text style={styles.chipText}>{service}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured stylists */}
        {featured.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Featured Stylists</Text>
            <FlatList
              data={featured}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.carouselContent}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.card} activeOpacity={0.85}>
                  <View style={styles.cardImage}>
                    {item.cover_url ? (
                      <Image
                        source={{ uri: item.cover_url }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.cardPlaceholder}>
                        <Text style={styles.cardPlaceholderText}>
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
                      <View style={styles.cardLocationRow}>
                        <Feather
                          name="map-pin"
                          size={12}
                          color={colors.mutedForeground}
                        />
                        <Text style={styles.cardCity}>{item.city}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { icon: "search" as const, label: "Find Stylist", desc: "Browse the DMV" },
            { icon: "calendar" as const, label: "My Bookings", desc: "View upcoming" },
            { icon: "heart" as const, label: "Favorites", desc: "Saved stylists" },
            { icon: "star" as const, label: "Reviews", desc: "Your feedback" },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              activeOpacity={0.8}
            >
              <View style={styles.actionIcon}>
                <Feather name={action.icon} size={20} color={colors.gold} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Text style={styles.actionDesc}>{action.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  logo: {
    width: 120,
    height: 32,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.darkBg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.cream,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.mutedForeground,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.lg,
  },
  chipsRow: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.gold + "66",
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    color: colors.cream,
    fontSize: 13,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.cream,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    marginLeft: spacing.lg,
  },
  carouselContent: {
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  card: {
    width: 200,
    borderRadius: radius.lg,
    backgroundColor: colors.darkBg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    overflow: "hidden",
  },
  cardImage: {
    height: 120,
    backgroundColor: colors.mutedDark,
  },
  cardPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardPlaceholderText: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.gold,
  },
  cardBody: {
    padding: 12,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.cream,
  },
  cardLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  cardCity: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  actionCard: {
    width: "47%",
    backgroundColor: colors.darkBg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.gold + "1A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.cream,
  },
  actionDesc: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
});
