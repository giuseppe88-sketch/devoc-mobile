import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import {
  useFetchDeveloperBookings,
  BookingWithClient,
} from "@/hooks/useFetchDeveloperBookings"; // Updated import
import { colors as themeColors, spacing } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { AllMainTabsParamList, DeveloperBookingsStackParamList } from "@/types"; // Import DeveloperBookingsStackParamList

const localColors = themeColors.dark; // Or themeColors.dark based on your app's theme for developers

const DeveloperBookingsScreen = () => {
  const [sortOrder, setSortOrder] = React.useState<
    "most-recent" | "less-recent"
  >("most-recent");
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "confirmed" | "cancelled"
  >("all");
  const { data: bookings = [], isLoading, error } = useFetchDeveloperBookings();
  const navigation = useNavigation<NavigationProp<AllMainTabsParamList>>();

  const processedBookings = React.useMemo(() => {
    if (!bookings) return [];

    const filtered =
      statusFilter === "all"
        ? bookings
        : bookings.filter((booking) => booking.status === statusFilter);

    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.start_time).getTime();
      const dateB = new Date(b.start_time).getTime();
      return sortOrder === "most-recent" ? dateB - dateA : dateA - dateB;
    });
  }, [bookings, sortOrder, statusFilter]);

  const renderBookingItem = ({ item }: { item: BookingWithClient }) => (
    // TODO: Update navigation to DeveloperBookingDetails screen once created
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("DeveloperBookingsTab", {
          screen: "DeveloperBookingDetails",
          params: { bookingId: item.id },
        })
      }
    >
      <View style={styles.bookingCard}>
        <View style={styles.cardHeader}>
          {item.client_profile?.user?.avatar_url ? (
            <Image
              source={{ uri: item.client_profile.user.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons
                name="person-circle-outline"
                size={24}
                color={localColors.textSecondary}
              />
            </View>
          )}
          <View style={styles.headerTextContainer}>
            <Text style={styles.clientName}>
              {item.client_profile?.client_name || "Client"}
            </Text>
          </View>
        </View>
        <View style={styles.dateTimeContainer}>
          <View style={styles.detailItem}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={localColors.textSecondary}
            />
            <Text style={styles.detailText}>
              Date: {new Date(item.start_time).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons
              name="time-outline"
              size={16}
              color={localColors.textSecondary}
            />
            <Text style={styles.detailText}>
              Time:{" "}
              {new Date(item.start_time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}{" "}
              -{" "}
              {new Date(item.end_time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </Text>
          </View>
        </View>
        {item.notes && (
          <View style={styles.notesContainer}>
            <Ionicons
              name="document-text-outline"
              size={16}
              color={localColors.textSecondary}
            />
            <Text style={styles.notesText} numberOfLines={2}>
              Notes: {item.notes}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.statusBadge,
            item.status === "confirmed"
              ? styles.confirmedBadge
              : styles.pendingBadge,
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={localColors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>
          Error fetching your bookings: {error.message}
        </Text>
      </View>
    );
  }

  if (
    !isLoading &&
    !error &&
    (!bookings || (Array.isArray(bookings) && bookings.length === 0))
  ) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons
          name="calendar-outline"
          size={64}
          color={localColors.textSecondary}
        />
        <Text style={styles.emptyText}>You have no bookings yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.controlsContainer}>
        <View style={[styles.filterRow, { marginBottom: spacing.sm }]}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              sortOrder === "most-recent" && styles.activeFilter,
            ]}
            onPress={() => setSortOrder("most-recent")}
          >
            <Text
              style={[
                styles.filterText,
                sortOrder === "most-recent" && styles.activeFilterText,
              ]}
            >
              Most Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              sortOrder === "less-recent" && styles.activeFilter,
            ]}
            onPress={() => setSortOrder("less-recent")}
          >
            <Text
              style={[
                styles.filterText,
                sortOrder === "less-recent" && styles.activeFilterText,
              ]}
            >
              Less Recent
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === "all" && styles.activeFilter,
            ]}
            onPress={() => setStatusFilter("all")}
          >
            <Text
              style={[
                styles.filterText,
                statusFilter === "all" && styles.activeFilterText,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === "confirmed" && styles.activeFilter,
            ]}
            onPress={() => setStatusFilter("confirmed")}
          >
            <Text
              style={[
                styles.filterText,
                statusFilter === "confirmed" && styles.activeFilterText,
              ]}
            >
              Confirmed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === "cancelled" && styles.activeFilter,
            ]}
            onPress={() => setStatusFilter("cancelled")}
          >
            <Text
              style={[
                styles.filterText,
                statusFilter === "cancelled" && styles.activeFilterText,
              ]}
            >
              Canceled
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={processedBookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContentContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: localColors.background,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: localColors.background,
    padding: spacing.md,
  },
  controlsContainer: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: localColors.border,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginHorizontal: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: localColors.border,
    backgroundColor: "transparent",
  },
  activeFilter: {
    backgroundColor: localColors.primary,
    borderColor: localColors.primary,
  },
  activeFilterText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  filterText: {
    color: localColors.textSecondary,
    fontWeight: "600",
  },
  listContentContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  bookingCard: {
    backgroundColor: localColors.card,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  avatarPlaceholder: {
    backgroundColor: localColors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
  },
  clientName: {
    // Changed from developerName
    fontSize: 16,
    fontWeight: "bold",
    color: localColors.text,
  },
  dateTimeContainer: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs / 2,
  },
  detailText: {
    fontSize: 14,
    color: localColors.textSecondary,
    marginLeft: spacing.xs,
  },
  notesContainer: {
    flexDirection: "row",
    alignItems: "flex-start", // Align icon with the start of the text lines
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  notesText: {
    fontSize: 14,
    color: localColors.textSecondary,
    marginLeft: spacing.xs,
    flexShrink: 1, // Allow text to shrink and wrap
  },
  statusBadge: {
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: spacing.xs,
  },
  confirmedBadge: {
    backgroundColor: localColors.success,
  },
  pendingBadge: {
    backgroundColor: localColors.warning,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: localColors.text,
    textTransform: "capitalize",
  },
  errorText: {
    fontSize: 16,
    color: localColors.error,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 18,
    color: localColors.textSecondary,
    marginTop: spacing.md,
    textAlign: "center",
  },
});

export default DeveloperBookingsScreen;
