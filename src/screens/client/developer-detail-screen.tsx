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
import { Ionicons } from "@expo/vector-icons"; // Assuming you use Expo icons

import { useGetDeveloperDetails, DeveloperProfile } from "@/hooks/useGetDeveloperDetails"; // Import type too
import { colors as themeColors, spacing } from "@/theme"; // Adjust path as needed

// Use the selected theme (e.g., light based on navigator)
const colors = themeColors.light;

// Define the expected route params
// This needs to align with how you set up the navigation stack
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

  const { data: developer, isLoading, error } = useGetDeveloperDetails(developerId) as {
    data: DeveloperProfile | undefined;
    isLoading: boolean;
    error: Error | null;
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }

  if (!developer) {
    return (
      <View style={styles.centered}>
        <Text>Developer not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {developer.avatar_url ? (
        <Image source={{ uri: developer.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Ionicons name="person-circle-outline" size={80} color={colors.placeholder} />
        </View>
      )}
      <Text style={styles.name}>{developer.name}</Text>
      {/* TODO: Add headline field to DeveloperProfile in the hook if needed and uncomment */} 
      {/* {developer.headline && <Text style={styles.headline}>{developer.headline}</Text>} */} 

      {developer.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{developer.bio}</Text>
        </View>
      )}

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
              <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL(developer.portfolio_url!)}>
                <Ionicons name="globe-outline" size={20} color={colors.primary} style={styles.linkIcon} />
                <Text style={styles.linkText}>Portfolio</Text>
              </TouchableOpacity>
            )}
            {developer.github_url && (
              <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL(developer.github_url!)}>
                <Ionicons name="logo-github" size={20} color={colors.primary} style={styles.linkIcon} />
                <Text style={styles.linkText}>GitHub</Text>
              </TouchableOpacity>
            )}
         </View>
      )}
      
      <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <Text>Availability check feature coming soon!</Text>
       </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    alignItems: 'center', // Center content horizontally
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.subtle,
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  headline: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  section: {
    width: '100%', // Take full width
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
   bio: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.xs,
  },
  badge: {
    backgroundColor: colors.subtle,
    borderRadius: 12,
    paddingVertical: spacing.xxsmall,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  badgeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
  },
  linkButton: { // Style for the link container
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  linkIcon: { // Style for the link icon
    marginRight: spacing.md,
  },
  linkText: { // Style for the link text
    fontSize: 16,
    color: colors.primary, // Use primary color for link text
    fontWeight: '500',
  },
});
