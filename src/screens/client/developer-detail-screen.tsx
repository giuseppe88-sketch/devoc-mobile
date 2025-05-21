// src/screens/client/developer-detail-screen.tsx
import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Linking,
  TouchableOpacity,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons"; 

import { useDeveloperProfile } from "@/hooks/useDeveloperProfile"; 
import { useDeveloperFirstCallAvailability } from '@/hooks/useDeveloperFirstCallAvailability';
import { useDeveloperGeneralAvailability } from '@/hooks/useDeveloperGeneralAvailability';
import { Availability, DeveloperProfile } from '@/types'; 
import { colors as themeColors, spacing } from "@/theme"; 

// Use the selected theme (e.g., light based on navigator)
const localColors = themeColors.light; 

// Define the expected route params
type DeveloperDetailRouteParams = {
  DeveloperDetail: {
    developerId: string;
  };
};

type DeveloperDetailScreenRouteProp = RouteProp<
  DeveloperDetailRouteParams,
  "DeveloperDetail"
>;

export function DeveloperDetailScreen() {
  const route = useRoute<DeveloperDetailScreenRouteProp>();
  const { developerId } = route.params;

  // Fetch developer profile
  const { data: developer, isLoading: isLoadingProfile, error: errorProfile } = useDeveloperProfile(developerId);
  // Fetch first call availability
  const { availabilitySlots: firstCallSlots, isLoading: isLoadingFirstCall, error: errorFirstCall } = useDeveloperFirstCallAvailability({ targetDeveloperId: developerId });
  // Fetch general work availability
  const { availabilitySlots: generalWorkSlotsFromHook, isLoading: isLoadingGeneral, error: errorGeneral } = useDeveloperGeneralAvailability({ targetDeveloperId: developerId });
  const generalWorkSlots = generalWorkSlotsFromHook || []; // Defensively ensure it's an array

  // Combined loading state for initial screen readiness
  const isScreenLoading = isLoadingProfile; 

  if (isScreenLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size={50} color={localColors.primary} />
      </View>
    );
  }

  if (errorProfile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error loading profile: {errorProfile.message}</Text>
      </View>
    );
  }

  if (!developer) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Developer not found.</Text>
      </View>
    );
  }

  // Helper Functions for formatting availability data
  const getDayOfWeekName = (dayIndex: number | null | undefined): string => {
    if (dayIndex === null || dayIndex === undefined) return 'N/A';
    // Supabase stores day_of_week as 0 (Sunday) to 6 (Saturday)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex] || 'Invalid Day';
  };

  const formatTime = (timeString: string | null | undefined): string => {
    if (!timeString) return 'N/A';
    // Assuming time is in "HH:MM:SS" format, just take HH:MM
    return timeString.substring(0, 5);
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      // Attempt to create a date object and format. Handles 'YYYY-MM-DD'
      // Appending T00:00:00 to ensure it's parsed as local time not UTC
      const date = new Date(dateString + 'T00:00:00');
      if (isNaN(date.getTime())) return dateString; // Return original if parsing fails
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return dateString; // Fallback to original string if any error
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Start temporary comment for debugging */}
      {developer.avatar_url ? (
        <Image source={{ uri: developer.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Ionicons name="person-circle-outline" size={80} color={localColors.placeholder} />
        </View>
      )}
      <Text style={styles.name}>{developer.name}</Text>
      {/* TODO: Add headline field to DeveloperProfile in the hook if needed and uncomment */}
      {/* {developer.headline && <Text style={styles.headline}>{developer.headline}</Text>} */}

      {/* {developer.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{developer.bio}</Text>
        </View>
      )} */}

      {developer.skills && developer.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.badgesContainer}>
            {developer.skills.map((skill: string, index: number) => (
              <View key={index} style={styles.badge}>
                <Text style={styles.badgeText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {(developer.portfolio_url || developer.github_url) && (
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>Links</Text>
           {developer.portfolio_url && (
              <TouchableOpacity onPress={() => Linking.openURL(developer.portfolio_url!)}>
                <Text style={[styles.link, { color: localColors.primary }]}>Portfolio</Text>
              </TouchableOpacity>
            )}
            {developer.github_url && (
              <TouchableOpacity onPress={() => Linking.openURL(developer.github_url!)}>
                <Text style={[styles.link, { color: localColors.primary }]}>GitHub</Text>
              </TouchableOpacity>
            )}
         </View>
      )}
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Availability</Text>
        {isLoadingFirstCall || isLoadingGeneral ? (
          <ActivityIndicator size="small" color={localColors.primary} />
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
                <Text style={styles.subSectionTitle}>First Call Slots (Weekly):</Text>
                {firstCallSlots.map((slot, index) => (
                  <Text key={`first-call-${slot.id || index}`} style={styles.availabilityText}>
                    {getDayOfWeekName(slot.day_of_week)}: {formatTime(slot.slot_start_time)} - {formatTime(slot.slot_end_time)}
                  </Text>
                ))}
              </View>
            )}
            {!errorGeneral && generalWorkSlots && generalWorkSlots.length > 0 && (
              <View style={styles.availabilitySubSection}>
                <Text style={styles.subSectionTitle}>General Work Blocks:</Text>
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
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: localColors.background, 
  },
  container: {
    flex: 1,
    backgroundColor: localColors.background, 
  },
  contentContainer: {
    paddingBottom: spacing.lg, 
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginTop: spacing.lg, 
    marginBottom: spacing.md, 
    backgroundColor: localColors.border, 
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: spacing.sm, 
    color: localColors.text, 
  },
  headline: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: spacing.md, 
    color: localColors.textSecondary, 
  },
  section: {
    marginTop: spacing.md, 
    paddingHorizontal: spacing.md, 
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: spacing.sm, 
    color: localColors.text, 
  },
   bio: {
    fontSize: 16,
    lineHeight: 24,
    color: localColors.textSecondary, 
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.sm, 
  },
  badge: {
    backgroundColor: localColors.primary, 
    paddingHorizontal: spacing.sm, 
    paddingVertical: spacing.xs, 
    borderRadius: spacing.xs, 
    marginRight: spacing.sm, 
    marginBottom: spacing.sm, 
    overflow: 'hidden', 
    textAlign: 'center',
  },
  badgeText: {
    color: localColors.primary, 
    fontSize: 14,
  },
  link: {
    fontSize: 16,
    marginBottom: spacing.sm, 
    textDecorationLine: "underline",
  },
  availabilitySubSection: {
    marginBottom: spacing.md, 
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm, 
    color: localColors.text, 
  },
  availabilityText: {
    fontSize: 15,
    color: localColors.textSecondary, 
    marginBottom: spacing.xs, 
  },
  errorText: {
    color: localColors.error, 
    textAlign: "center",
    marginHorizontal: spacing.md, 
  },
  errorTextSmall: {
    color: localColors.error,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
});

export default DeveloperDetailScreen;
