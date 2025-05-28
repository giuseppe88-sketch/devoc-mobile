import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth-store';
import { DeveloperProfile } from '../../types';
import { colors as themeColors, spacing } from '../../theme';
import { useDeveloperProfile } from '../../hooks/useDeveloperProfile';

const colors = themeColors.dark;

function DeveloperProfileScreen({ navigation }: { navigation: any }) {
  const { user } = useAuthStore();

  const { 
    data: profileData, 
    isLoading, 
    error 
  } = useDeveloperProfile(user?.id);

  const handleEditPress = () => {
    navigation.navigate('EditDeveloperProfile', { profileData: profileData ?? null });
  };

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

  if (isLoading) {
    return (
        <SafeAreaView style={styles.container}>
          <ActivityIndicator size={50} color={colors.primary} style={styles.centered} />
        </SafeAreaView>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Error loading profile: {errorMessage}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderDetailItem = (label: string, value: string | number | null | undefined, iconName?: keyof typeof Ionicons.glyphMap) => {
    if (value === null || value === undefined || value === "") {
      return (
        <View style={styles.detailRow}>
          <View style={styles.detailLeftContainer}>
            {iconName && <Ionicons name={iconName} size={20} style={styles.detailIcon} />}
            <Text style={styles.detailLabel}>{label}</Text>
          </View>
          <Text style={[styles.detailValue, styles.notSetText]}>Not set</Text>
        </View>
      );
    }
    return (
      <View style={styles.detailRow}>
        <View style={styles.detailLeftContainer}>
          {iconName && <Ionicons name={iconName} size={20} style={styles.detailIcon} />}
          <Text style={styles.detailLabel}>{label}</Text>
        </View>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        {/* Header (Title + Edit Button) */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Profile</Text>
          <View style={styles.headerIconsContainer}>
            <TouchableOpacity onPress={handleEditPress} style={styles.headerButton}>
              <Ionicons name="create-outline" size={28} color={colors.secondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('AccountScreen')} style={styles.headerButton}>
              <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {profileData && (
          <>
            {/* Identity Block */}
            <View style={styles.identitySection}>
              {profileData.avatar_url ? (
                <Image source={{ uri: profileData.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person-circle-outline" size={100} color={colors.textSecondary} />
                </View>
              )}
              <Text style={styles.nameText}>{profileData.name || "N/A"}</Text>
              {user?.email && <Text style={styles.emailText}>{user.email}</Text>}
              <View style={styles.iconDetailRow}>
                {profileData.rating !== null && profileData.rating !== undefined && (
                  <View style={styles.iconDetailItem}>
                    <Ionicons name="star" size={18} color={colors.star} />
                    <Text style={styles.iconDetailText}>{profileData.rating.toFixed(1)}</Text>
                  </View>
                )}
                {profileData.github_url && (
                  <TouchableOpacity onPress={() => handleLinkPress(profileData.github_url)} style={styles.iconDetailItem}>
                    <Ionicons name="logo-github" size={18} color={colors.textSecondary} />
                    <Text style={styles.iconDetailText}>GitHub</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Combined Focus Areas and Skills Section */}
            {((profileData.focus_areas?.length ?? 0) > 0 || (profileData.skills?.length ?? 0) > 0) && (
              <View style={styles.skillsFocusRowContainer}>
                {/* Focus Areas Column */}
                {(profileData.focus_areas?.length ?? 0) > 0 && (
                  <View style={styles.skillsFocusColumn}>
                    <Text style={styles.sectionTitleSmall}>Focus Areas</Text>
                    <View style={styles.badgeContainer}>
                      {profileData.focus_areas?.map((area, index) => (
                        <View key={index} style={styles.badge}>
                          <Text style={styles.badgeText}>{area}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Skills Column */}
                {(profileData.skills?.length ?? 0) > 0 && (
                  <View style={styles.skillsFocusColumn}>
                    <Text style={styles.sectionTitleSmall}>Skills</Text>
                    <View style={styles.badgeContainer}>
                      {profileData.skills?.map((skill, index) => (
                        <View key={index} style={styles.badge}>
                          <Text style={styles.badgeText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Bio */}
            {profileData.bio && (
              <View style={styles.sectionContainer}>
                {/* <Text style={styles.sectionTitle}>About Me</Text> */}
                <Text style={styles.bioText}>{profileData.bio}</Text>
              </View>
            )}

            {/* Portfolio */}
            {(profileData.portfolio_image_url || profileData.portfolio_url) && (
                <View style={styles.sectionContainer}>
                    {/* <Text style={styles.sectionTitle}>Portfolio</Text> */}
                    {profileData.portfolio_image_url ? (
                    <TouchableOpacity onPress={() => handleLinkPress(profileData.portfolio_url)}>
                        <Image
                        source={{ uri: profileData.portfolio_image_url }}
                        style={styles.portfolioImage}
                        />
                    </TouchableOpacity>
                    ) : profileData.portfolio_url ? (
                    <TouchableOpacity onPress={() => handleLinkPress(profileData.portfolio_url)}>
                        <Text style={styles.linkText}>{profileData.portfolio_url}</Text>
                    </TouchableOpacity>
                    ) : null}
                </View>
            )}

            {/* More Details Section */}
            <View style={styles.sectionContainer}>
              {/* <Text style={styles.sectionTitle}>More Details</Text> */}
              {renderDetailItem("Hourly Rate", profileData.hourly_rate !== null && profileData.hourly_rate !== undefined ? `$${profileData.hourly_rate}/hr` : null, "cash-outline")}
              {renderDetailItem("Phone", profileData.phone_number, "call-outline")}
              {renderDetailItem("Location", profileData.location, "location-outline")}
              {renderDetailItem("Years of Experience", profileData.years_of_experience ? `${profileData.years_of_experience} years` : null, "time-outline")}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  scrollContentContainer: {
    paddingBottom: spacing.xl, // Corrected: Ensure space at the bottom
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md, // Adjusted padding
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 26, // Slightly smaller title
    fontWeight: 'bold',
    color: colors.text,
  },
  headerIconsContainer: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: spacing.md, // Add some space between icons
  },
  identitySection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.card, // Corrected: A subtle background for placeholder
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emailText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.md, // Increased margin
  },
  iconDetailRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    flexWrap: 'wrap', // Allow wrapping if content is too wide
  },
  iconDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.sm, // Adjusted for potentially more items
    marginBottom: spacing.xs, // For wrapping
  },
  iconDetailText: {
    marginLeft: spacing.xs,
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailTextSmall: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg, // Space between sections
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 15, // More rounded badges
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  badgeText: {
    color: themeColors.dark.text, // Ensure contrast, assuming primary is light
    fontSize: 14,
    fontWeight: '500',
  },
  skillsFocusRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  skillsFocusColumn: {
    flex: 1,
    marginHorizontal: spacing.xs, // Add small margin between columns
  },
  sectionTitleSmall: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24, // Improved readability for bio
    color: colors.textSecondary,
  },
  portfolioImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.card, // Corrected: Placeholder bg
  },
  linkText: {
    fontSize: 16,
    color: colors.accent,
    textDecorationLine: 'underline',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center', // Corrected: Removed extra margin/border
  },
  detailLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: spacing.sm,
    color: colors.textSecondary,
  },
  detailLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'right',
    flexShrink: 1, 
  },
  notSetText: {
    fontStyle: 'italic',
    color: colors.textSecondary, 
  },
  errorText: { 
    color: colors.error, 
    textAlign: 'center', 
    margin: spacing.md, 
    fontSize: 16 
  },
});

export default DeveloperProfileScreen;
