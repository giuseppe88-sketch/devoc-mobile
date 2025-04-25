import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Button,
  ScrollView,
  Image,
  useColorScheme,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "../../stores/auth-store";
import { useClientProfile } from "../../hooks/useClientProfile";
import { ClientProfileStackParamList } from "../../types";
import { colors as themeColors, spacing } from "../../theme";
import { useColors } from "../../theme";

// Define navigation prop type for type safety
type ClientProfileScreenNavigationProp = NativeStackNavigationProp<
  ClientProfileStackParamList,
  "ClientProfile"
>;

function ClientProfileScreen() {
  const navigation = useNavigation<ClientProfileScreenNavigationProp>();
  const userId = useAuthStore((state) => state.user?.id);
  const { data: profile, isLoading, isError, error } = useClientProfile(userId);
  // const colorScheme = useColorScheme() ?? 'light';

  const colors = useColors('light');

  const handleEditProfile = () => {
    // Prepare profile data for navigation, ensuring email is string | undefined
    const profileForNavigation = profile
      ? {
          ...profile,
          email: profile.email ?? undefined, // Convert null or undefined email to undefined
        }
      : undefined;

    // Pass the adjusted profile data.
    // We likely only need profileData now, assuming EditClientProfile reads email from there.
    navigation.navigate("EditClientProfile", {
      profileData: profileForNavigation,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.infoText}>Loading Profile...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>Error loading profile:</Text>
        <Text style={styles.errorText}>
          {error?.message || "Unknown error"}
        </Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.infoText}>No profile found.</Text>
        {/* Optionally add a button to create a profile? */}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.header}>Client Profile</Text>
      {profile?.logo_url && (
      <View style={styles.logoContainer}>
        <Image
          source={{ uri: profile.logo_url }}
          style={styles.logoImage}
          resizeMode="contain" // Optional: Adjust how the image fits
        />
      </View>
      )}
      <View style={styles.infoRow}>
        <Text style={styles.label}>Client Name:</Text>
        <Text style={styles.value}>{profile.client_name || "N/A"}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{profile.email || "N/A"}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Company Name:</Text>
        <Text style={styles.value}>{profile.company_name || "N/A"}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Website:</Text>
        <Text style={styles.value}>{profile.website_url || "N/A"}</Text>
      </View>

      {/* Add more fields as needed, e.g., logo */}

      <View style={styles.buttonContainer}>
        <Button
          title="Edit Profile"
          onPress={handleEditProfile}
          color={colors.primary}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: useColors('light').background,
  },
  container: {
    flex: 1,
    backgroundColor: useColors('light').background,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: useColors('light').text,
  },
  logoContainer: {
    alignItems: 'center', // Center the logo horizontally
    marginBottom: 20, // Add space below the logo
  },
  logoImage: {
    width: 100, // Adjust width as needed
    height: 100, // Adjust height as needed
    borderRadius: 8, // Optional: if you want rounded corners
    backgroundColor: useColors('light').subtle, // Placeholder background
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: useColors('light').border,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: useColors('light').text,
  },
  value: {
    fontSize: 16,
    color: useColors('light').textSecondary || useColors('light').text,
  },
  infoText: {
    fontSize: 16,
    color: useColors('light').text,
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: useColors('light').error,
    textAlign: "center",
    marginBottom: 5,
  },
  buttonContainer: {
    marginTop: 30,
  },
});

export default ClientProfileScreen;
