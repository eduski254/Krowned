import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { colors, spacing, radius } from "../../constants/theme";

type Booking = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  service: { name: string } | null;
  business: { name: string; city: string | null } | null;
};

export function BookingsScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("bookings")
      .select(
        "id, start_time, end_time, status, service:service_id(name), business:business_id(name, city)"
      )
      .eq("client_id", user.id)
      .order("start_time", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setBookings(data as unknown as Booking[]);
        setLoading(false);
      });
  }, [user]);

  const now = new Date().toISOString();
  const upcoming = bookings.filter(
    (b) => b.start_time >= now && b.status !== "cancelled"
  );
  const past = bookings.filter(
    (b) => b.start_time < now || b.status === "cancelled"
  );
  const displayed = tab === "upcoming" ? upcoming : past;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return colors.success;
      case "pending":
      case "pending_hold":
        return colors.warning;
      case "cancelled":
        return colors.error;
      case "completed":
        return colors.mutedForeground;
      default:
        return colors.mutedForeground;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>My Bookings</Text>

      {/* Tab switcher */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === "upcoming" && styles.tabActive]}
          onPress={() => setTab("upcoming")}
        >
          <Text
            style={[styles.tabText, tab === "upcoming" && styles.tabTextActive]}
          >
            Upcoming ({upcoming.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "past" && styles.tabActive]}
          onPress={() => setTab("past")}
        >
          <Text
            style={[styles.tabText, tab === "past" && styles.tabTextActive]}
          >
            Past ({past.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayed}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.85}>
            <View style={styles.cardHeader}>
              <Text style={styles.serviceName}>
                {(item.service as any)?.name ?? "Service"}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColor(item.status) + "20" },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: statusColor(item.status) },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: statusColor(item.status) },
                  ]}
                >
                  {item.status.replace("_", " ")}
                </Text>
              </View>
            </View>

            <Text style={styles.businessName}>
              {(item.business as any)?.name ?? ""}
            </Text>

            <View style={styles.dateRow}>
              <Feather name="calendar" size={14} color={colors.goldLight} />
              <Text style={styles.dateText}>{formatDate(item.start_time)}</Text>
              <Feather name="clock" size={14} color={colors.goldLight} />
              <Text style={styles.dateText}>
                {formatTime(item.start_time)} – {formatTime(item.end_time)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="calendar" size={40} color={colors.borderDark} />
            <Text style={styles.emptyText}>
              {loading
                ? "Loading..."
                : tab === "upcoming"
                ? "No upcoming bookings"
                : "No past bookings"}
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
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.cream,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.darkBg,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  tabActive: {
    backgroundColor: colors.gold + "20",
    borderColor: colors.gold,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.mutedForeground,
  },
  tabTextActive: {
    color: colors.gold,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: 12,
  },
  card: {
    backgroundColor: colors.darkBg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.cream,
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  businessName: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  dateText: {
    fontSize: 13,
    color: colors.cream,
    marginRight: 8,
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
