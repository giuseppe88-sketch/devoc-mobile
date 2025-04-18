import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/auth-store";
import { colors as themeColors, spacing } from "../../theme";

const colors = themeColors.dark;

function DeveloperDashboardScreen({ navigation }: { navigation: any }) {
  const { user } = useAuthStore();
  const name = user?.user_metadata?.name || "Developer";

  // Mock data for upcoming bookings
  const upcomingBookings = [
    {
      id: "1",
      clientName: "Tech Solutions Inc.",
      date: "April 15, 2025",
      time: "10:00 AM - 11:00 AM",
      status: "confirmed",
    },
    {
      id: "2",
      clientName: "Web Innovators",
      date: "April 17, 2025",
      time: "2:00 PM - 3:30 PM",
      status: "pending",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {name}!</Text>
          <Text style={styles.subGreeting}>Your developer dashboard</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Profile Views</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Bookings")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => {
                  // Navigate to booking details
                }}
              >
                <View style={styles.bookingHeader}>
                  <Text style={styles.clientName}>{booking.clientName}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      booking.status === "confirmed"
                        ? styles.confirmedBadge
                        : styles.pendingBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        booking.status === "confirmed"
                          ? styles.confirmedText
                          : styles.pendingText,
                      ]}
                    >
                      {booking.status === "confirmed" ? "Confirmed" : "Pending"}
                    </Text>
                  </View>
                </View>
                <View style={styles.bookingDetails}>
                  <View style={styles.bookingDetail}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.bookingDetailText}>{booking.date}</Text>
                  </View>
                  <View style={styles.bookingDetail}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.bookingDetailText}>{booking.time}</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
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
    backgroundColor: colors.success + "20",
  },
  pendingBadge: {
    backgroundColor: colors.warning + "20",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  confirmedText: {
    color: colors.success,
  },
  pendingText: {
    color: colors.warning,
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
