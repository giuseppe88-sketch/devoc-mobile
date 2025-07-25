import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator, // Ensured import
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/auth-store";
import { colors as themeColors, spacing } from "../../theme";
import {
  useFetchDeveloperBookings,
  BookingWithClient,
} from "@/hooks/useFetchDeveloperBookings"; // Updated import

const colors = themeColors.dark;

const backgroundImage = require("../../../assets/brick-wall-texture.jpg");
const logoWhiteSource = require("../../../assets/logo-devoc_white.png"); // Add white logo import
const blurhash = "|rF?hV%2_N_3t7M{V?xu?uM|RjRj?wRjofof~qofM{of%Mofof?w";

function DeveloperDashboardScreen({ navigation }: { navigation: any }) {
  const { data: bookings = [], isLoading, error } = useFetchDeveloperBookings();

  const { full_name } = useAuthStore();
  const name = full_name || "Developer";

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centeredContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centeredContainer]}>
        <Text style={styles.errorText}>
          Error loading bookings: {error.message}
        </Text>
      </SafeAreaView>
    );
  }

  const cancelledBookings = bookings.filter(
    (b) => b.status === "cancelled"
  ).length;

  const upcomingBookings = bookings
    .filter((b) => b.status === "confirmed" || b.status === "pending")
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )
    .slice(0, 3); // Show upcoming/pending, sorted, limit to 5 for dashboard

  const bookingsTotal = bookings.filter(
    (b) =>
      b.status === "confirmed" ||
      b.status === "pending" ||
      b.status === "cancelled"
  ).length;

  return (
    <View style={styles.container}>
      <Image
        style={styles.backgroundImage}
        source={backgroundImage}
        placeholder={{ blurhash }}
        contentFit="cover"
        transition={300}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={styles.header}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Hello, {name}!</Text>
              <Text style={styles.subGreeting}>Your developer dashboard</Text>
            </View>
            <Image
              source={logoWhiteSource}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{bookingsTotal}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{upcomingBookings.length}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{cancelledBookings}</Text>
              <Text style={styles.statLabel}>Cancelled</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("DeveloperBookingsTab", {
                    screen: "DeveloperBookingsList",
                  })
                }
              >
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking) => (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.bookingCard}
                  onPress={() =>
                    navigation.navigate("DeveloperBookingsTab", {
                      screen: "DeveloperBookingDetails",
                      params: { bookingId: booking.id },
                    })
                  }
                >
                  <View style={styles.bookingHeader}>
                    <Text style={styles.clientName}>
                      {booking.client_profile?.client_name ||
                        booking.client_profile?.user?.full_name ||
                        "Client N/A"}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        booking.status === "confirmed" && styles.confirmedBadge,
                        booking.status === "pending" && styles.pendingBadge,
                        booking.status === "cancelled" && styles.cancelledBadge, // Added style usage
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {booking.status.charAt(0).toUpperCase() +
                          booking.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.bookingInfo}>
                    <View style={styles.bookingDetail}>
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.bookingDetailText}>
                        {new Date(booking.start_time).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.bookingDetail}>
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.bookingDetailText}>
                        {`${new Date(booking.start_time).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit", hour12: false }
                        )} - ${new Date(booking.end_time).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit", hour12: false }
                        )}`}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No upcoming bookings</Text>
              </View>
            )}
          </View>

          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("Availability")}
            >
              <Ionicons name="calendar" size={24} color={colors.text} />
              <Text style={styles.actionButtonText}>Set Availability</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("Profile")}
            >
              <Ionicons name="person" size={24} color={colors.text} />
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  centeredContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md, // Reduced from spacing.lg to spacing.md
    paddingBottom: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
  },
  subGreeting: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  logo: {
    width: 100,
    height: 100,
    marginLeft: spacing.md,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
    width: "30%",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  seeAll: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  bookingCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  statusBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  confirmedBadge: {
    backgroundColor: colors.success,
  },
  pendingBadge: {
    backgroundColor: colors.warning,
  },
  cancelledBadge: {
    backgroundColor: colors.error,
  },
  statusText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "bold",
  },
  bookingInfo: {
    marginTop: spacing.md,
  },
  bookingDetails: {
    marginTop: spacing.sm,
  },
  bookingDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  bookingDetailText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  actionSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    alignItems: "center",
    padding: spacing.sm,
  },
  actionButtonText: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
});

export default DeveloperDashboardScreen;
