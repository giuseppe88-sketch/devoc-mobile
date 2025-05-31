// src/screens/client/developer-detail-screen.tsx
import React, { useLayoutEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Linking,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native"; // Added useNavigation
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // Added for navigation prop type

import { useDeveloperProfile } from "@/hooks/useDeveloperProfile";
import { useDeveloperFirstCallAvailability } from "@/hooks/useDeveloperFirstCallAvailability";
import { useDeveloperGeneralAvailability } from "@/hooks/useDeveloperGeneralAvailability";
import { DeveloperProfile, BrowseStackParamList } from "@/types"; // Added BrowseStackParamList
import { colors as themeColors, spacing } from "@/theme";

const colors = themeColors.light; // Use light theme

// Define the expected route params
type DeveloperDetailRouteParams = {
  DeveloperDetail: {
    developerId: string;
    // developerName is not passed as a param here, but fetched via useDeveloperProfile
  };
};

type DeveloperDetailScreenRouteProp = RouteProp<
  DeveloperDetailRouteParams,
  "DeveloperDetail"
>;

// Define the type for the navigation prop for this screen
type DeveloperDetailScreenNavigationProp = NativeStackNavigationProp<
  BrowseStackParamList,
  'DeveloperDetail'
>;

export function DeveloperDetailScreen() {
  const navigation = useNavigation<DeveloperDetailScreenNavigationProp>();
  const route = useRoute<DeveloperDetailScreenRouteProp>();
  const { developerId } = route.params;

  const {
    data: developer,
    isLoading: isLoadingProfile,
    error: errorProfile,
  } = useDeveloperProfile(developerId);

  useLayoutEffect(() => {
    // Ensure developer data is available before setting options that depend on it
    if (developer) {
      navigation.setOptions({
        headerShown: true, // Ensure the header is visible
        headerTitle: developer.name || 'Developer Details', // Use developer.name
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginLeft: spacing.xsmall, padding: spacing.xxsmall }} // Adjusted spacing keys
          >
            <Ionicons name="arrow-back" size={26} color={colors.primary} />
          </TouchableOpacity>
        ),
        headerBackTitleVisible: false, // Hides the default back button text on iOS
      });
    } else {
      // Fallback for when developer data is not yet loaded
      navigation.setOptions({
        headerShown: true,
        headerTitle: 'Loading Details...',
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginLeft: spacing.xsmall, padding: spacing.xxsmall }}
          >
            <Ionicons name="arrow-back" size={26} color={colors.primary} />
          </TouchableOpacity>
        ),
        headerBackTitleVisible: false,
      });
    }
  }, [navigation, developer, colors, spacing]); // Added dependencies
  const {
    availabilitySlots: firstCallSlots,
    isLoading: isLoadingFirstCall,
    error: errorFirstCall,
  } = useDeveloperFirstCallAvailability({ targetDeveloperId: developerId });
  const {
    availabilitySlots: generalWorkSlotsFromHook,
    isLoading: isLoadingGeneral,
    error: errorGeneral,
  } = useDeveloperGeneralAvailability({ targetDeveloperId: developerId });
  
  const generalWorkSlots = generalWorkSlotsFromHook || [];

  const handleLinkPress = async (url: string | undefined | null) => {
    if (!url) return;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      try {
        await Linking.openURL(url);
      } catch (err) {
        Alert.alert(`Don't know how to open this URL: ${url}`);
      }
    } else {
      Alert.alert(`Don't know how to open this URL: ${url}`);
    }
  };

  const renderDetailItem = (
    label: string,
    value: string | number | null | undefined,
    iconName?: keyof typeof Ionicons.glyphMap
  ) => {
    if (value === null || value === undefined || value === "") {
      return (
        <View style={styles.detailRow}>
          <View style={styles.detailLeftContainer}>
            {iconName && <Ionicons name={iconName} size={20} color={colors.textSecondary} style={styles.detailIcon} />}
            <Text style={styles.detailLabel}>{label}</Text>
          </View>
          <Text style={[styles.detailValue, styles.notSetText]}>Not set</Text>
        </View>
      );
    }
    return (
      <View style={styles.detailRow}>
        <View style={styles.detailLeftContainer}>
          {iconName && <Ionicons name={iconName} size={20} color={colors.textSecondary} style={styles.detailIcon} />}
          <Text style={styles.detailLabel}>{label}</Text>
        </View>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    );
  };

  // Helper Functions for formatting availability data (retained from original)
  const getDayOfWeekName = (dayIndex: number | null | undefined): string => {
    if (dayIndex === null || dayIndex === undefined) return 'N/A';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex] || 'Invalid Day';
  };

  const formatTime = (timeString: string | null | undefined): string => {
    if (!timeString) return 'N/A';
    return timeString.substring(0, 5);
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString + 'T00:00:00'); // Ensure local time parsing
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  const formatDateRange = (startDate: string | null | undefined, endDate: string | null | undefined): string => {
    const formattedStartDate = startDate ? formatDate(startDate) : 'N/A';
    const formattedEndDate = endDate ? formatDate(endDate) : 'N/A';
    if (startDate && endDate) {
      if (startDate === endDate) return formattedStartDate;
      return `${formattedStartDate} to ${formattedEndDate}`;
    }
    if (startDate) return `From ${formattedStartDate}`;
    if (endDate) return `Until ${formattedEndDate}`;
    return 'Date range not specified';
  };


  if (isLoadingProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size={50} color={colors.primary} style={styles.centered} />
      </SafeAreaView>
    );
  }

  if (errorProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            Error loading profile: {errorProfile.message}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!developer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Developer not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Developer Details</Text>
        </View>

        {/* Identity Block */}
        <View style={styles.identitySection}>
          {developer.avatar_url ? (
            <Image source={{ uri: developer.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-circle-outline" size={100} color={colors.textSecondary} />
            </View>
          )}
          <Text style={styles.nameText}>{developer.name || "N/A"}</Text>
          {/* Email is not directly in DeveloperProfile, typically from auth.users. Omit for now. */}
          {/* developer.email && <Text style={styles.emailText}>{developer.email}</Text> */}
          <View style={styles.iconDetailRow}>
            {developer.rating !== null && developer.rating !== undefined && (
              <View style={styles.iconDetailItem}>
                <Ionicons name="star" size={18} color={colors.star} />
                <Text style={styles.iconDetailText}>{developer.rating.toFixed(1)}</Text>
              </View>
            )}
            {developer.github_url && (
              <TouchableOpacity onPress={() => handleLinkPress(developer.github_url)} style={styles.iconDetailItem}>
                <Ionicons name="logo-github" size={18} color={colors.textSecondary} />
                <Text style={styles.iconDetailText}>GitHub</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Combined Focus Areas and Skills Section */}
        {((developer.focus_areas?.length ?? 0) > 0 || (developer.skills?.length ?? 0) > 0) && (
          <View style={styles.skillsFocusRowContainer}>
            {(developer.focus_areas?.length ?? 0) > 0 && (
              <View style={styles.skillsFocusColumn}>
                <Text style={styles.sectionTitleSmall}>Focus Areas</Text>
                <View style={styles.badgeContainer}>
                  {developer.focus_areas?.map((area, index) => (
                    <View key={`focus-${index}`} style={styles.badge}>
                      <Text style={styles.badgeText}>{area}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {(developer.skills?.length ?? 0) > 0 && (
              <View style={styles.skillsFocusColumn}>
                <Text style={styles.sectionTitleSmall}>Skills</Text>
                <View style={styles.badgeContainer}>
                  {developer.skills?.map((skill, index) => (
                    <View key={`skill-${index}`} style={styles.badge}>
                      <Text style={styles.badgeText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Bio */}
        {developer.bio && (
          <View style={styles.sectionContainer}>
            <Text style={styles.bioText}>{developer.bio}</Text>
          </View>
        )}

        {/* Portfolio */}
        {(developer.portfolio_image_url || developer.portfolio_url) && (
            <View style={styles.sectionContainer}>
                {developer.portfolio_image_url ? (
                <TouchableOpacity onPress={() => handleLinkPress(developer.portfolio_url)}>
                    <Image
                    source={{ uri: developer.portfolio_image_url }}
                    style={styles.portfolioImage}
                    />
                </TouchableOpacity>
                ) : developer.portfolio_url ? (
                <TouchableOpacity onPress={() => handleLinkPress(developer.portfolio_url)}>
                    <Text style={styles.linkText}>{developer.portfolio_url}</Text>
                </TouchableOpacity>
                ) : null}
            </View>
        )}

        {/* More Details Section */}
        <View style={styles.sectionContainer}>
          {renderDetailItem("Hourly Rate", developer.hourly_rate !== null && developer.hourly_rate !== undefined ? `$${developer.hourly_rate}/hr` : null, "cash-outline")}
          {renderDetailItem("Phone", developer.phone_number, "call-outline")}
          {renderDetailItem("Location", developer.location, "location-outline")}
          {/* {renderDetailItem("Company", developer.company, "business-outline")}
          {renderDetailItem("Website", developer.website_url, "globe-outline")}
          {renderDetailItem("LinkedIn", developer.linkedin_url, "logo-linkedin")} */}
        </View>

        {/* Booking Button */}
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => {
            if (developer) {
              navigation.navigate('BookingScreen', { 
                developerId: developer.id, 
                developerName: developer.name || undefined 
              });
            }
          }}
        >
          <Text style={styles.bookButtonText}>Book First Call</Text>
        </TouchableOpacity>

        {/* Availability Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitleBig}>Availability</Text>
          {isLoadingFirstCall || isLoadingGeneral ? (
            <ActivityIndicator size="small" color={colors.primary} style={{marginTop: spacing.md}}/>
          ) : (
            <>
              {errorFirstCall && (
                <Text style={styles.errorTextSmall}>Error loading first call availability: {errorFirstCall.message}</Text>
              )}
              {errorGeneral && (
                <Text style={styles.errorTextSmall}>Error loading general availability: {errorGeneral.message}</Text>
              )}

              {!errorFirstCall && firstCallSlots && firstCallSlots.length > 0 && (
                <View style={styles.availabilitySubSection}>
                  <Text style={styles.subSectionTitle}>First Call Slots (Weekly)</Text>
                  {firstCallSlots.map((slot, index) => (
                    <Text key={`first-call-${slot.id || index}`} style={styles.availabilityText}>
                      {getDayOfWeekName(slot.day_of_week)}: {formatTime(slot.slot_start_time)} - {formatTime(slot.slot_end_time)}
                    </Text>
                  ))}
                </View>
              )}
              
              {!errorGeneral && generalWorkSlots && generalWorkSlots.length > 0 && (
                <View style={styles.availabilitySubSection}>
                  <Text style={styles.subSectionTitle}>General Work Blocks</Text>
                  {generalWorkSlots.map((slot, index) => (
                    <Text key={`general-${slot.id || index}`} style={styles.availabilityText}>
                      {formatDateRange(slot.range_start_date, slot.range_end_date)}
                    </Text>
                  ))}
                </View>
              )}

              {(!firstCallSlots || firstCallSlots.length === 0) && 
               (!generalWorkSlots || generalWorkSlots.length === 0) && 
               !errorFirstCall && !errorGeneral && (
                <Text style={styles.availabilityText}>No availability information provided.</Text>
              )}
            </>
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
  bookButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  bookButtonText: {
    color: themeColors.dark.text, // Assuming primary button text is light on dark bg
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContentContainer: {
    paddingBottom: spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    // borderBottomWidth: 1,
    // borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  identitySection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginHorizontal: spacing.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
    backgroundColor: colors.border,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emailText: { // Kept for potential future use, though email not directly on DeveloperProfile
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  iconDetailRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  iconDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  iconDetailText: {
    marginLeft: spacing.xs,
    fontSize: 14,
    color: colors.textSecondary,
  },
  skillsFocusRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    marginHorizontal: spacing.md,
    // borderBottomWidth: 1,
    // borderBottomColor: colors.border,
  },
  skillsFocusColumn: {
    flex: 1,
    alignItems: 'center', // Center items within the column
    paddingHorizontal: spacing.sm, // Add some padding if columns are too close
  },
  sectionTitleSmall: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center', // Center badges if they wrap
    alignItems: 'center',
  },
  badge: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 15,
    margin: spacing.xs,
  },
  badgeText: {
    color: colors.subtle, 
    fontSize: 13,
    fontWeight: '500',
  },
  sectionContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    // borderBottomWidth: 1,
    // borderBottomColor: colors.border,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  portfolioImage: {
    width: '100%',
    height: 200, // Adjust as needed
    borderRadius: spacing.sm,
    marginBottom: spacing.sm,
    resizeMode: 'cover',
  },
  linkText: {
    fontSize: 16,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: spacing.md,
    color: colors.textSecondary,
  },
  detailLabel: {
    fontSize: 16,
    color: colors.text,
  },
  detailValue: {
    fontSize: 16,
    color: colors.textSecondary,
    flexShrink: 1, // Allow text to wrap or shrink if too long
    textAlign: 'right',
  },
  notSetText: {
    fontStyle: 'italic',
    color: colors.text,
  },
  sectionTitleBig: { // For "Availability" title
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  availabilitySubSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingLeft: spacing.sm, // Indent subsections slightly
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  availabilityText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  errorTextSmall: { // For availability errors
    color: colors.error,
    fontSize: 14,
    marginTop: spacing.xs,
  },
});

export default DeveloperDetailScreen;
  

