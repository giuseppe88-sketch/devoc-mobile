import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/auth-store";
import { useBrowseDevelopers, DeveloperProfile } from '@/hooks/useBrowseDevelopers';
import { useFetchClientBookings, type Booking } from '@/hooks/useFetchClientBookings';
import { ActivityIndicator } from "react-native";
import { colors as themeColors, spacing } from "../../theme";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { ClientDashboardStackParamList } from "../../navigation/main-navigator";

const colors = themeColors.light;

function ClientDashboardScreen() {
  const { user } = useAuthStore();
  const navigation =
    useNavigation<
      NavigationProp<ClientDashboardStackParamList, "ClientDashboardHome">
    >();
  const name = user?.user_metadata?.name || "Client";

  const {
    data: allDevelopers,
    isLoading: isLoadingDevelopers,
    error: errorDevelopers,
  } = useBrowseDevelopers();

  const featuredDevelopers = React.useMemo(() => {
    if (!allDevelopers) return [];
    return allDevelopers
      .filter((dev) => dev.rating !== null)
      .sort((a, b) => b.rating! - a.rating!) // Sort by rating descending, non-null asserted due to filter
      .slice(0, 5); // Show top 5 featured developers
  }, [allDevelopers]);

  // Fetch real client bookings
  const { data: allBookings, isLoading: isLoadingBookings, error: errorBookings } = useFetchClientBookings();

  // Filter for upcoming bookings (start_time in the future)
  const upcomingBookings = React.useMemo<Booking[]>(() => {
    if (errorBookings) {
      console.error("Error fetching client bookings from dashboard:", errorBookings);
      return []; // Return empty array on error
    }
    if (!allBookings) return [];
    const now = new Date();
    return allBookings
      .filter((b: Booking) => new Date(b.start_time) > now)
      .sort((a: Booking, b: Booking) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [allBookings, errorBookings]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {name}!</Text>
          <Text style={styles.subGreeting}>Find and book top developers</Text>
        </View>

        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => navigation.getParent<any>()?.navigate("Browse")}
          >
            <Ionicons name="search" size={20} color={colors.placeholder} />
            <Text style={styles.searchText}>Search for developers...</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Developers</Text>
            <TouchableOpacity
              onPress={() => navigation.getParent<any>()?.navigate("Browse")}
            >
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {isLoadingDevelopers ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginVertical: spacing.lg }}
            />
          ) : errorDevelopers ? (
            <Text style={styles.errorText}>
              Error loading developers: {errorDevelopers.message}
            </Text>
          ) : featuredDevelopers.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {featuredDevelopers.map((developer: DeveloperProfile) => (
                <TouchableOpacity
                  key={developer.id}
                  style={styles.developerCard}
                  onPress={() =>
                    navigation
                      .getParent<any>()
                      ?.navigate("Browse", {
                        screen: "DeveloperDetail",
                        params: { developerId: developer.id },
                      })
                  }
                >
                  <Image
                    source={{
                      uri:
                        developer.avatar_url ||
                        "https://via.placeholder.com/100",
                    }} // Use avatar_url and provide a fallback
                    style={styles.developerImage}
                  />
                  <Text style={styles.developerName}>{developer.name}</Text>
                  {developer.skills && developer.skills.length > 0 && (
                    <View style={styles.skillsContainer}>
                      {developer.skills.slice(0, 2).map((skill, index) => (
                        <View key={index} style={styles.skillBadge}>
                          <Text style={styles.skillText}>{skill}</Text>
                        </View>
                      ))}
                      {developer.skills.length > 2 && (
                        <View style={styles.skillBadge}>
                          <Text style={styles.skillText}>
                            +{developer.skills.length - 2}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                  {developer.rating !== null && (
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color={colors.star} />
                      <Text style={styles.ratingText}>
                        {developer.rating.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyStateText}>
              No featured developers available right now.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Bookings</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("ClientBookings")}
            >
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {isLoadingBookings ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
          ) : errorBookings ? (
            <Text style={styles.errorText}>Could not load bookings.</Text>
          ) : upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking: Booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => {
                  navigation.navigate('BookingDetails', { bookingId: booking.id });
                }}
              >
                <View style={styles.bookingHeader}>
                  {booking.developer_profile?.user?.avatar_url ? (
                    <Image source={{ uri: booking.developer_profile.user.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Ionicons name="person-circle-outline" size={32} color={colors.textSecondary} />
                    </View>
                  )}
                  <View style={styles.headerTextContainer}>
                    <Text style={styles.developerNameBooking} numberOfLines={1}>{booking.developer_profile?.user?.full_name || 'Developer'}</Text>
                    <Text style={[styles.status, { color: booking.status === 'confirmed' ? colors.success : colors.warning }]}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <View style={styles.dateTimeContainer}>
                  <View style={styles.bookingDetail}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.bookingDetailText}>{new Date(booking.start_time).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.bookingDetail}>
                    <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.bookingDetailText}>
                      {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No upcoming bookings</Text>
              <TouchableOpacity 
                style={styles.findDevelopersButton}
                onPress={() => navigation.getParent<any>()?.navigate('Browse')}
              >
                <Text style={styles.findDevelopersText}>Find Developers</Text>
              </TouchableOpacity>
            </View>
          )}
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
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.subtle,
    borderRadius: 12,
    padding: spacing.md,
  },
  searchText: {
    marginLeft: spacing.sm,
    color: colors.placeholder,
    fontSize: 16,
  },
  section: {
    paddingVertical: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  seeAll: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  developerCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginRight: spacing.md,
    marginLeft: spacing.lg,
    width: 180,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  developerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  developerName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  skillBadge: {
    backgroundColor: colors.subtle,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    margin: 2,
  },
  skillText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.text,
    fontWeight: "600",
  },
  bookingCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
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
  developerNameBooking: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  avatarPlaceholder: {
    backgroundColor: colors.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.xxsmall,
  },
  dateTimeContainer: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  confirmedBadge: {
    backgroundColor: colors.success + "20",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  confirmedText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "bold",
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
    marginHorizontal: spacing.lg,
  },
  errorText: {
    color: colors.error,
    textAlign: "center",
    marginVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  findDevelopersButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
  },
  findDevelopersText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ClientDashboardScreen;
