import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/auth-store";
import { colors as themeColors, spacing } from "../../theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList, EditDeveloperProfileRouteParams } from "../../types";

const colors = themeColors.dark; // Assuming dark theme

type Props = NativeStackScreenProps<
  ProfileStackParamList,
  "EditDeveloperProfile"
>;

function EditDeveloperProfileScreen({ route, navigation }: Props) {
  const { user } = useAuthStore();
  const initialProfileData = route.params?.profileData || {};

  // State for each editable field
  const [name, setName] = useState(initialProfileData.name || "");
  const [avatarUrl, setAvatarUrl] = useState(
    initialProfileData.avatar_url || ""
  ); // For now, just URL string
  const [bio, setBio] = useState(initialProfileData.bio || "");
  const [phoneNumber, setPhoneNumber] = useState(
    initialProfileData.phone_number || ""
  );
  const [skills, setSkills] = useState(
    (initialProfileData.skills || []).join(", ")
  ); // Join array for TextInput
  const [focusAreas, setFocusAreas] = useState(
    (initialProfileData.focus_areas || []).join(", ")
  ); // Join array for TextInput
  const [portfolioUrl, setPortfolioUrl] = useState(
    initialProfileData.portfolio_url || ""
  );
  const [githubUrl, setGithubUrl] = useState(
    initialProfileData.github_url || ""
  );
  const [hourlyRate, setHourlyRate] = useState(
    initialProfileData.hourly_rate?.toString() || ""
  );
  const [location, setLocation] = useState(initialProfileData.location || "");
  const [yearsOfExperience, setYearsOfExperience] = useState(
    initialProfileData.years_of_experience?.toString() || ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handler for saving changes
  const handleSave = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to save changes.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Prepare data for update/upsert
      const userDataToUpdate = {
        full_name: name,
        avatar_url: avatarUrl, // Assuming URL for now
        bio: bio,
      };

      const developerProfileDataToUpsert = {
        id: user.id, // Crucial: Ensure the ID matches the user's ID for upsert
        phone_number: phoneNumber,
        skills: skills
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s), // Convert back to array
        focus_areas: focusAreas
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s), // Convert back to array
        portfolio_url: portfolioUrl,
        github_url: githubUrl,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null, // Convert to number or null
        location: location,
        years_of_experience: yearsOfExperience
          ? parseInt(yearsOfExperience, 10)
          : null, // Convert to integer or null
      };

      // --- Perform Supabase Operations ---

      // 1. Update public.users table
      const { error: userUpdateError } = await supabase
        .from("users")
        .update(userDataToUpdate)
        .eq("id", user.id);

      if (userUpdateError) {
        throw new Error(
          `Failed to update user profile: ${userUpdateError.message}`
        );
      }

      // 2. Upsert developer_profiles table
      const { error: devProfileUpsertError } = await supabase
        .from("developer_profiles")
        .upsert(developerProfileDataToUpsert, { onConflict: "id" }); // Specify conflict column

      if (devProfileUpsertError) {
        throw new Error(
          `Failed to update developer details: ${devProfileUpsertError.message}`
        );
      }

      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack(); // Navigate back after successful save
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setError(err.message || "Failed to save profile.");
      Alert.alert("Error", err.message || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Edit Profile</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Form Fields */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
            placeholderTextColor={colors.placeholder}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Avatar URL</Text>
          <TextInput
            style={styles.input}
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            placeholder="URL to your profile picture"
            placeholderTextColor={colors.placeholder}
            keyboardType="url"
          />
          {/* // TODO: Implement image upload functionality if needed */}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={styles.input}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself"
            multiline
            placeholderTextColor={colors.placeholder}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Your phone number"
            placeholderTextColor={colors.placeholder}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Skills (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={skills}
            onChangeText={setSkills}
            placeholder="e.g., React, Node.js, Python"
            placeholderTextColor={colors.placeholder}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Focus Areas (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={focusAreas}
            onChangeText={setFocusAreas}
            placeholder="e.g., Frontend, Backend, DevOps"
            placeholderTextColor={colors.placeholder}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Portfolio URL</Text>
          <TextInput
            style={styles.input}
            value={portfolioUrl}
            onChangeText={setPortfolioUrl}
            placeholder="Link to your portfolio"
            placeholderTextColor={colors.placeholder}
            keyboardType="url"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>GitHub URL</Text>
          <TextInput
            style={styles.input}
            value={githubUrl}
            onChangeText={setGithubUrl}
            placeholder="Link to your GitHub profile"
            placeholderTextColor={colors.placeholder}
            keyboardType="url"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hourly Rate ($)</Text>
          <TextInput
            style={styles.input}
            value={hourlyRate}
            onChangeText={setHourlyRate}
            placeholder="e.g., 75"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g., Berlin, Germany"
            placeholderTextColor={colors.placeholder}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Years of Experience</Text>
          <TextInput
            style={styles.input}
            value={yearsOfExperience}
            onChangeText={setYearsOfExperience}
            placeholder="e.g., 5"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    padding: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background, // Use background color for input
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: spacing.sm,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  saveButtonText: {
    color: "#FFFFFF", // Use white text for contrast on primary background
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    color: colors.error, // Ensure you have error color in your theme
    textAlign: "center",
    marginBottom: spacing.md,
    fontSize: 14,
  },
});

export default EditDeveloperProfileScreen;
