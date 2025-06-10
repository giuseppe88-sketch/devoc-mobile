// @ts-ignore -- Temporarily ignore missing type for React 19 RC hook
import React, {
  useState,
  useEffect,
  useActionState,
  startTransition,
} from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Image, // Added for displaying portfolio image
  TouchableOpacity, // Added for selectable items
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { supabase } from "@/lib/supabase";
import { decode } from "base64-arraybuffer";
import { useAuthStore } from "../../stores/auth-store";
import { useDeveloperProfile } from "../../hooks/useDeveloperProfile";
import { colors, spacing } from "../../theme";
import {
  saveProfileAction,
  UserProfileData,
} from "../../actions/profile-actions";
import type { ActionState } from "../../actions/profile-actions";
import type { DeveloperProfile } from "../../types";
import type { ProfileStackParamList } from "../../types";
import * as ImagePicker from "expo-image-picker"; // Added for image picking

const FOCUS_AREA_OPTIONS = [
  "E-commerce",
  "Business Website",
  "Mobile App",
  "Landing Page",
  "Portfolio Website",
];

// Define the type for the form data passed to the action
type ProfileFormData = Partial<Omit<DeveloperProfile, "user_id">>;

// --- Component ---

type EditProfileNavigationProp = StackNavigationProp<
  ProfileStackParamList,
  "EditDeveloperProfile"
>;

function EditDeveloperProfileScreen() {
  const navigation = useNavigation<EditProfileNavigationProp>();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient(); // Get query client instance

  // --- Data Fetching using Custom Hook ---
  const {
    data: profileData,
    isLoading,
    error: fetchError,
  } = useDeveloperProfile(user?.id);

  // --- Types ---
  // Interface for the consolidated form state
  interface EditProfileFormState {
    name: string;
    avatarUrl: string | null;
    bio: string;
    skills: string;
    focusAreas: string[];
    portfolioUrl: string;
    portfolioImageUrl: string | null; // Added for portfolio image
    githubUrl: string;
    hourlyRate: string;
    location: string;
    yearsOfExperience: string;
    phoneNumber: string;
  }

  // State for form fields using a single state object
  const initialFormState: EditProfileFormState = {
    name: "",
    avatarUrl: null,
    bio: "",
    skills: "",
    focusAreas: [],
    portfolioUrl: "",
    portfolioImageUrl: null, // Added for portfolio image
    githubUrl: "",
    hourlyRate: "",
    location: "",
    yearsOfExperience: "",
    phoneNumber: "",
  };
  const [formState, setFormState] =
    useState<EditProfileFormState>(initialFormState);

  // Generic handler for updating form state
  const handleInputChange = <K extends keyof EditProfileFormState>(
    field: K,
    value: EditProfileFormState[K]
  ) => {
    setFormState((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  const handleFocusAreaToggle = (area: string) => {
    setFormState((prevState) => {
      const currentFocusAreas = prevState.focusAreas || [];
      const newFocusAreas =
        currentFocusAreas.includes(area)
          ? currentFocusAreas.filter((item) => item !== area)
          : [...currentFocusAreas, area];
      return { ...prevState, focusAreas: newFocusAreas };
    });
  };

  // useActionState hook manages the submission process
  // state: holds the result of the last action { success, message }
  // submitAction: function to call to trigger the action
  // isPending: boolean indicating if the action is currently running
  const [state, submitAction, isPending] = useActionState<
    ActionState | null,
    {
      user_id: string;
      userData: Partial<UserProfileData>;
      devData: ProfileFormData;
    }
  >(saveProfileAction, null);

  // Effect to populate form state when profile data loads or changes
  useEffect(() => {
    if (profileData) {
      // Populate state from the combined profile data fetched by the hook
      setFormState({
        name: profileData.name || "",
        avatarUrl: profileData.avatar_url || null,
        bio: profileData.bio || "",
        skills: profileData.skills?.join(", ") || "",
        focusAreas: profileData.focus_areas || [],
        portfolioUrl: profileData.portfolio_url || "",
        portfolioImageUrl: profileData.portfolio_image_url || null, // Added for portfolio image
        githubUrl: profileData.github_url || "",
        hourlyRate: profileData.hourly_rate?.toString() || "",
        location: profileData.location || "",
        yearsOfExperience: profileData.years_of_experience?.toString() || "",
        phoneNumber: profileData.phone_number || "",
      });
    }
  }, [profileData]); // Depend on the data from the hook

  // Effect to handle action result (success/failure feedback and navigation)
  useEffect(() => {
    if (state?.message) {
      Alert.alert(state.success ? "Success" : "Error", state.message);
      if (state.success) {
        // Invalidate the query cache for the profile on success
        queryClient.invalidateQueries({
          queryKey: ["developerProfile", user?.id],
        });
        navigation.goBack();
      }
    }
  }, [state, navigation, queryClient, user?.id]); // Add dependencies

  const handleSave = () => {
    if (!user) return;

    // --- Prepare Data for Action ---
    // User data from 'users' table
    const userDataToUpdate: Partial<UserProfileData> = {
      full_name: formState.name.trim(),
      bio: formState.bio.trim(),
      avatar_url: formState.avatarUrl || undefined,
    };

    // Developer profile specific data for 'developer_profiles' table/function
    const developerProfileDataToUpsert: ProfileFormData = {
      phone_number: formState.phoneNumber.trim() || undefined,
      skills: formState.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s),
      focus_areas: formState.focusAreas.length > 0 ? formState.focusAreas : undefined,
      portfolio_url: formState.portfolioUrl.trim() || undefined,
      portfolio_image_url: formState.portfolioImageUrl || undefined, // Added for portfolio image
      github_url: formState.githubUrl.trim() || undefined,
      hourly_rate: formState.hourlyRate
        ? parseFloat(formState.hourlyRate)
        : undefined,
      location: formState.location.trim() || undefined,
      years_of_experience: formState.yearsOfExperience
        ? parseInt(formState.yearsOfExperience, 10)
        : undefined,
    };

    // Wrap the action dispatch in startTransition
    startTransition(() => {
      submitAction({
        user_id: user.id,
        userData: userDataToUpdate,
        devData: developerProfileDataToUpsert,
      });
    });
  };

  const handlePickPortfolioImage = async () => {
    if (!user) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    // Request permissions
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You've refused to allow this app to access your photos!"
      );
      return;
    }

    // Launch image picker
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // Correct new format
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7, // Let's try a slightly higher quality, can be adjusted
      base64: true, // Crucial for getting base64 data
    });

    if (pickerResult.canceled) {
      return;
    }

    if (pickerResult.assets && pickerResult.assets.length > 0) {
      const asset = pickerResult.assets[0];
      console.log("Selected portfolio image asset:", {
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
        width: asset.width,
        height: asset.height,
      });

      // Ensure a reasonable extension
      let fileExt = "jpg";
      if (asset.mimeType && asset.mimeType.startsWith("image/")) {
        fileExt = asset.mimeType.split("/")[1];
      }

      const filePath = `public/${user.id}/portfolio/${Date.now()}.${fileExt}`;

      try {
        // For React Native, Supabase recommends using ArrayBuffer from base64 data
        // console.log("Decoding base64 image data..."); // Less verbose now that it's working
        if (!asset.base64) {
          Alert.alert("Error", "Failed to get base64 data for the image.");
          console.error(
            "Asset does not contain base64 data. Picker options: ",
            {
              mediaTypes: ["images"],
              allowsEditing: true,
              aspect: [16, 9],
              quality: 0.7,
              base64: true,
            }
          );
          return;
        }

        const arrayBuffer = decode(asset.base64);

        console.log(
          "Portfolio image ArrayBuffer size:",
          arrayBuffer.byteLength,
          "(Original asset size:",
          asset.fileSize,
          ")"
        );

        // Critical check - if blob is empty, stop here
        if (arrayBuffer.byteLength === 0) {
          console.error("ArrayBuffer is empty! This is the problem.");
          Alert.alert(
            "Error",
            "Image conversion failed - ArrayBuffer is empty"
          );
          return;
        }

        // Upload image to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("portfolio-images")
          .upload(filePath, arrayBuffer, {
            contentType: asset.mimeType || "image/png",
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        console.log("Upload successful:", uploadData);

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("portfolio-images")
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          handleInputChange("portfolioImageUrl", publicUrlData.publicUrl);
          Alert.alert("Success", "Portfolio image updated!");
        } else {
          Alert.alert("Error", "Could not get public URL for the image.");
        }
      } catch (e: any) {
        console.error("Error uploading portfolio image:", e);
        Alert.alert(
          "Upload Error",
          e.message || "Failed to upload portfolio image."
        );
      }
    }
  };

  const handlePickAvatarImage = async () => {
    if (!user) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You've refused to allow this app to access your photos!"
      );
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio for avatars
      quality: 0.7,
      base64: true,
    });

    if (pickerResult.canceled) {
      return;
    }

    if (pickerResult.assets && pickerResult.assets.length > 0) {
      const asset = pickerResult.assets[0];

      let fileExt = "png"; // Default to png
      if (asset.mimeType && asset.mimeType.startsWith("image/")) {
        fileExt = asset.mimeType.split("/")[1];
      }
      
      const filePath = `public/${user.id}/avatar/avatar.${fileExt}`;

      try {
        if (!asset.base64) {
          Alert.alert("Error", "Failed to get base64 data for the image.");
          return;
        }
        const arrayBuffer = decode(asset.base64);

        if (arrayBuffer.byteLength === 0) {
          Alert.alert("Error", "Image conversion failed - ArrayBuffer is empty");
          return;
        }

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars") // Use 'avatars' bucket
          .upload(filePath, arrayBuffer, {
            contentType: asset.mimeType || `image/${fileExt}`,
            upsert: true, // Important to overwrite existing avatar
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          const newAvatarUrl = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;
          handleInputChange("avatarUrl", newAvatarUrl);
          Alert.alert("Success", "Avatar updated!");
        } else {
          Alert.alert("Error", "Could not get public URL for the avatar.");
        }
      } catch (e: any) {
        console.error("Error uploading avatar:", e);
        Alert.alert("Upload Error", e.message || "Failed to upload avatar.");
      }
    }
  };
  // --- Render Logic ---
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size={50} color={colors.light.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Handle fetch error state
  if (fetchError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading profile:</Text>
        <Text style={styles.errorText}>
          {(fetchError as Error).message || "Unknown error"}
        </Text>
        {/* TODO: Add a retry button here? */}
      </View>
    );
  }

  // If not loading and no error, render the form
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* <ImagePickerComponent 
        currentAvatarUrl={formState.avatarUrl}
        onImagePicked={handleImagePicked} 
        userId={user?.id} 
      /> */}

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={formState.name}
        onChangeText={(text) => handleInputChange("name", text)}
        placeholder="Your full name"
        placeholderTextColor={colors.light.placeholder}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Avatar</Text>
      {formState.avatarUrl ? (
        <Image
          source={{ uri: formState.avatarUrl }}
          style={styles.avatarPreview}
        />
      ) : (
        <View style={styles.avatarPreview}>
          <Text style={styles.placeholderText}>No avatar</Text>
        </View>
      )}
      <Button
        title="Change Avatar"
        onPress={handlePickAvatarImage}
        color={colors.light.primary}
      />
      <View style={{ marginBottom: spacing.md }} />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={formState.bio}
        onChangeText={(text) => handleInputChange("bio", text)}
        placeholder="Tell us a bit about yourself"
        placeholderTextColor={colors.light.placeholder}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        value={formState.phoneNumber}
        onChangeText={(text) => handleInputChange("phoneNumber", text)}
        placeholder="(Optional) Your phone number"
        placeholderTextColor={colors.light.placeholder}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Skills (comma-separated)</Text>
      <TextInput
        style={styles.input}
        value={formState.skills}
        onChangeText={(text) => handleInputChange("skills", text)}
        placeholder="e.g., React Native, TypeScript, Node.js"
        placeholderTextColor={colors.light.placeholder}
      />

      <Text style={styles.label}>Focus Areas</Text>
      <View style={styles.focusAreasContainer}>
        {FOCUS_AREA_OPTIONS.map((area) => (
          <TouchableOpacity
            key={area}
            style={[
              styles.focusAreaChip,
              formState.focusAreas?.includes(area) && styles.focusAreaChipSelected,
            ]}
            onPress={() => handleFocusAreaToggle(area)}
          >
            <Text
              style={[
                styles.focusAreaChipText,
                formState.focusAreas?.includes(area) &&
                  styles.focusAreaChipTextSelected,
              ]}
            >
              {area}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Portfolio URL</Text>
      <TextInput
        style={styles.input}
        value={formState.portfolioUrl}
        onChangeText={(text) => handleInputChange("portfolioUrl", text)}
        placeholder="(Optional) Link to your portfolio"
        placeholderTextColor={colors.light.placeholder}
        keyboardType="url"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Portfolio Image</Text>
      {formState.portfolioImageUrl ? (
        <Image
          source={{ uri: formState.portfolioImageUrl }}
          style={styles.portfolioImagePreview}
        />
      ) : (
        <Text style={styles.placeholderText}>No image selected</Text>
      )}
      <Button
        title="Pick Portfolio Image"
        onPress={handlePickPortfolioImage}
        color={colors.light.primary}
      />

      <Text style={styles.label}>GitHub URL</Text>
      <TextInput
        style={styles.input}
        value={formState.githubUrl}
        onChangeText={(text) => handleInputChange("githubUrl", text)}
        placeholder="(Optional) Link to your GitHub profile"
        placeholderTextColor={colors.light.placeholder}
        keyboardType="url"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Hourly Rate (USD)</Text>
      <TextInput
        style={styles.input}
        value={formState.hourlyRate}
        onChangeText={(text) => handleInputChange("hourlyRate", text)}
        placeholder="(Optional) e.g., 75"
        placeholderTextColor={colors.light.placeholder}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        value={formState.location}
        onChangeText={(text) => handleInputChange("location", text)}
        placeholder="(Optional) e.g., San Francisco, CA or Remote"
        placeholderTextColor={colors.light.placeholder}
      />

      <Text style={styles.label}>Years of Experience</Text>
      <TextInput
        style={styles.input}
        value={formState.yearsOfExperience}
        onChangeText={(text) => handleInputChange("yearsOfExperience", text)}
        placeholder="(Optional) e.g., 5"
        placeholderTextColor={colors.light.placeholder}
        keyboardType="numeric"
      />

      <View style={styles.buttonContainer}>
        <Button
          title={isPending ? "Saving..." : "Save Profile"}
          onPress={handleSave}
          disabled={isPending}
          color={colors.light.primary}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  focusAreasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  focusAreaChip: {
    backgroundColor: colors.light.subtle,
    borderRadius: 14, // Slightly smaller border radius
    paddingVertical: spacing.xs, // Reduced padding
    paddingHorizontal: spacing.sm, // Reduced padding
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  focusAreaChipSelected: {
    backgroundColor: colors.light.primary,
    borderColor: colors.light.primary,
  },
  focusAreaChipText: {
    color: colors.light.text,
    fontSize: 12, // Reduced font size
  },
  focusAreaChipTextSelected: {
    color: colors.light.card, // Assuming card is a light color for selected text on primary background
    fontWeight: 'bold',
  },
  contentContainer: {
    padding: spacing.md, // Use theme spacing
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.light.background,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 16,
    color: colors.light.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.light.background,
  },
  errorText: {
    color: colors.light.error,
    textAlign: "center",
    marginBottom: spacing.sm,
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600", // Bolder labels
    marginBottom: spacing.xs,
    color: colors.light.text,
  },
  input: {
    backgroundColor: colors.light.card, // Subtle background for input
    borderWidth: 1,
    borderColor: colors.light.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: spacing.xs,
    fontSize: 16,
    marginBottom: spacing.md,
    color: colors.light.text,
  },
  textArea: {
    minHeight: 100, // Make textarea taller
    textAlignVertical: "top", // Align text to top
  },
  buttonContainer: {
    marginTop: spacing.lg, // Add space above button
    paddingBottom: spacing.lg, // Ensure space for the button at the bottom
  },
  portfolioImagePreview: {
    width: "100%", // Make it responsive within its container
    aspectRatio: 16 / 9, // Maintain aspect ratio
    height: undefined, // Height will be calculated based on width and aspectRatio
    resizeMode: "cover",
    marginBottom: spacing.md,
    borderRadius: spacing.sm,
    backgroundColor: colors.light.subtle, // Placeholder background
  },
  avatarPreview: {
    width: 100,
    height: 100,
    borderRadius: 50, // Circular avatar
    marginBottom: spacing.sm,
    alignSelf: "center",
    backgroundColor: colors.light.subtle, // Placeholder background
    justifyContent: "center", // For placeholder text
    alignItems: "center",     // For placeholder text
  },
  placeholderText: {
    textAlign: "center",
    marginVertical: spacing.md,
    color: colors.light.placeholder,
    fontStyle: "italic",
  },
});

export default EditDeveloperProfileScreen;
