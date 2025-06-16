import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image as RNImage, // Renaming to avoid conflict if Image is used elsewhere
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/auth-store";
import {
  useBrowseDevelopers,
  DeveloperProfile,
} from "@/hooks/useBrowseDevelopers";
import {
  useFetchClientBookings,
  type Booking,
} from "@/hooks/useFetchClientBookings";
import { ActivityIndicator } from "react-native";
import { colors as themeColors, spacing } from "../../theme";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { AllMainTabsParamList } from "../../types"; // Corrected import for AllMainTabsParamList
import { useClientProfile } from "@/hooks/useClientProfile";

const colors = themeColors.light;

const backgroundImageSource = require("../../../assets/white-bricks-wall-texture-min.jpg");
const logoSource = require("../../../assets/logo-devoc.png"); // Add logo import
const blurhash = "|LFgSn_300WB%MM{ofM{?wWB~qWB%MofM{of00WBofof%MofofM{"; // Example blurhash, generate a real one for your image

function ClientDashboardScreen() {
  const { user, full_name: authFullName } = useAuthStore();
  const navigation = useNavigation<NavigationProp<AllMainTabsParamList>>();

  const { data: clientProfile, isLoading: isLoadingClientProfile } =
    useClientProfile(user?.id);

  const getDisplayName = () => {
    if (authFullName) return authFullName;
    if (clientProfile?.client_name) return clientProfile.client_name;
    if (clientProfile?.company_name) return clientProfile.company_name;
    return "Client";
  };

  const name = getDisplayName();

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
  const {
    data: allBookings,
    isLoading: isLoadingBookings,
    error: errorBookings,
  } = useFetchClientBookings();

  // Filter for upcoming bookings (start_time in the future)
  const upcomingBookings = React.useMemo<Booking[]>(() => {
    if (errorBookings) {
      console.error(
        "Error fetching client bookings from dashboard:",
        errorBookings
      );
      return []; // Return empty array on error
    }
    if (!allBookings) return [];
    const now = new Date();
    return allBookings
      .filter((b: Booking) => new Date(b.start_time) > now)
      .sort(
        (a: Booking, b: Booking) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
  }, [allBookings, errorBookings]);

  return (
    <View style={{ flex: 1 }}>
      <Image
        style={styles.backgroundImage}
        source={backgroundImageSource}
        placeholder={{ blurhash }}
        contentFit="cover"
        transition={300}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={styles.header}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Hello, {name}!</Text>
              <Text style={styles.subGreeting}>
                Find and book top developers
              </Text>
            </View>
            <Image
              source={logoSource}
              style={styles.logo}
              contentFit="contain"
            />
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

            {isLoadingDevelopers || isLoadingClientProfile ? (
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
                      navigation.getParent<any>()?.navigate("Browse", {
                        screen: "DeveloperDetail",
                        params: { developerId: developer.id },
                      })
                    }
                  >
                    <RNImage
                      source={{
                        uri:
                          developer.avatar_url ||
                          "https://via.placeholder.com/100",
                      }}
                      style={styles.developerImage}
                    />
                    <Text style={styles.developerName}>{developer.name}</Text>
                    {developer.focus_areas &&
                      developer.focus_areas.length > 0 && (
                        <View style={styles.skillsContainer}>
                          {developer.focus_areas
                            .slice(0, 2)
                            .map((area, index) => (
                              <View key={index} style={styles.skillBadge}>
                                <Text style={styles.skillText}>{area}</Text>
                              </View>
                            ))}
                          {developer.focus_areas.length > 2 && (
                            <View style={styles.skillBadge}>
                              <Text style={styles.skillText}>
                                +{developer.focus_areas.length - 2}
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
                onPress={() => navigation.navigate("ClientBookingsTab")}
              >
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {isLoadingBookings ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginVertical: spacing.md }}
              />
            ) : errorBookings ? (
              <Text style={styles.errorText}>Could not load bookings.</Text>
            ) : upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking: Booking) => (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.bookingCard}
                  onPress={() => {
                    navigation.navigate("Dashboard", {
                      screen: "BookingDetails",
                      params: { bookingId: booking.id },
                    });
                  }}
                >
                  <View style={styles.bookingHeader}>
                    {booking.developer_profile?.user?.avatar_url ? (
                      <RNImage
                        source={{
                          uri: booking.developer_profile.user.avatar_url,
                        }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Ionicons
                          name="person-circle-outline"
                          size={32}
                          color={colors.textSecondary}
                        />
                      </View>
                    )}
                    <View style={styles.headerTextContainer}>
                      <Text
                        style={styles.developerNameBooking}
                        numberOfLines={1}
                      >
                        {booking.developer_profile?.user?.full_name ||
                          "Developer"}
                      </Text>
                      <Text
                        style={[
                          styles.status,
                          {
                            color:
                              booking.status === "confirmed"
                                ? colors.success
                                : colors.warning,
                          },
                        ]}
                      >
                        {booking.status.charAt(0).toUpperCase() +
                          booking.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.dateTimeContainer}>
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
                        {new Date(booking.start_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}{" "}
                        -{" "}
                        {new Date(booking.end_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
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
                  onPress={() =>
                    navigation.getParent<any>()?.navigate("Browse")
                  }
                >
                  <Text style={styles.findDevelopersText}>Find Developers</Text>
                </TouchableOpacity>
              </View>
            )}
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
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 26,
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
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
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
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  status: {
    fontSize: 12,
    fontWeight: "600",
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
