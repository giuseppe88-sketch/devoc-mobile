// @ts-ignore -- Temporarily ignore missing type for React 19 RC hook
import React, { useState, useEffect, useActionState, startTransition } from 'react';
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
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query'; 
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack'; 
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth-store';
import { useDeveloperProfile } from '../../hooks/useDeveloperProfile'; 
import { colors, spacing } from '../../theme'; 
import { saveProfileAction, UserProfileData } from '../../actions/profile-actions';
import type { ActionState } from '../../actions/profile-actions'; 
import type { DeveloperProfile } from '../../types'; 
import type { ProfileStackParamList } from '../../types'; 

// Define the type for the form data passed to the action
type ProfileFormData = Partial<Omit<DeveloperProfile, 'user_id'>>; 

// --- Component --- 

type EditProfileNavigationProp = StackNavigationProp<
  ProfileStackParamList,
  'EditDeveloperProfile'
>;

function EditDeveloperProfileScreen() {
  const navigation = useNavigation<EditProfileNavigationProp>();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient(); // Get query client instance

  // --- Data Fetching using Custom Hook ---
  const { data: profileData, isLoading, error: fetchError } = useDeveloperProfile(user?.id);

  // --- Types ---
  // Interface for the consolidated form state
  interface EditProfileFormState {
    name: string;
    avatarUrl: string | null;
    bio: string;
    skills: string;
    focusAreas: string;
    portfolioUrl: string;
    githubUrl: string;
    hourlyRate: string;
    location: string;
    yearsOfExperience: string;
    phoneNumber: string;
  }

  // State for form fields using a single state object
  const initialFormState: EditProfileFormState = {
    name: '',
    avatarUrl: null,
    bio: '',
    skills: '',
    focusAreas: '',
    portfolioUrl: '',
    githubUrl: '',
    hourlyRate: '',
    location: '',
    yearsOfExperience: '',
    phoneNumber: '',
  };
  const [formState, setFormState] = useState<EditProfileFormState>(initialFormState);

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

  // useActionState hook manages the submission process
  // state: holds the result of the last action { success, message }
  // submitAction: function to call to trigger the action
  // isPending: boolean indicating if the action is currently running
  const [state, submitAction, isPending] = useActionState<ActionState | null, { user_id: string, userData: Partial<UserProfileData>, devData: ProfileFormData }>(saveProfileAction, null);

  // Effect to populate form state when profile data loads or changes
  useEffect(() => {
    if (profileData) {
      // Populate state from the combined profile data fetched by the hook
      setFormState({
        name: profileData.name || '',
        avatarUrl: profileData.avatar_url || null,
        bio: profileData.bio || '',
        skills: profileData.skills?.join(', ') || '',
        focusAreas: profileData.focus_areas?.join(', ') || '',
        portfolioUrl: profileData.portfolio_url || '',
        githubUrl: profileData.github_url || '',
        hourlyRate: profileData.hourly_rate?.toString() || '',
        location: profileData.location || '',
        yearsOfExperience: profileData.years_of_experience?.toString() || '',
        phoneNumber: profileData.phone_number || '',
      });
    }
  }, [profileData]); // Depend on the data from the hook

  // Effect to handle action result (success/failure feedback and navigation)
  useEffect(() => {
    if (state?.message) {
      Alert.alert(state.success ? 'Success' : 'Error', state.message);
      if (state.success) {
        // Invalidate the query cache for the profile on success
        queryClient.invalidateQueries({ queryKey: ['developerProfile', user?.id] });
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
      // avatar_url is handled by ImagePickerComponent directly via its upload function
      // We only update it here if a NEW url was generated/provided NOT via the picker
      // If ImagePicker handles the upload AND update, remove avatar_url here.
      ...(formState.avatarUrl && !formState.avatarUrl.startsWith('data:') ? { avatar_url: formState.avatarUrl } : {}),
    };

    // Developer profile specific data for 'developer_profiles' table/function
    const developerProfileDataToUpsert: ProfileFormData = {
      phone_number: formState.phoneNumber.trim() || undefined,
      skills: formState.skills.split(',').map(s => s.trim()).filter(s => s),
      focus_areas: formState.focusAreas.split(',').map(s => s.trim()).filter(s => s),
      portfolio_url: formState.portfolioUrl.trim() || undefined,
      github_url: formState.githubUrl.trim() || undefined,
      hourly_rate: formState.hourlyRate ? parseFloat(formState.hourlyRate) : undefined,
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
        devData: developerProfileDataToUpsert 
      });
    });
  };

  // Handle image selection/upload
  const handleImagePicked = (newAvatarUrl: string | null) => {
    console.log("New avatar URL set:", newAvatarUrl);
    handleInputChange('avatarUrl', newAvatarUrl); // Update state object
    // NOTE: The ImagePickerComponent likely handles the UPLOAD.
    // Decide if the ImagePicker should ALSO update the 'users' table
    // or if we rely on the main save action. For simplicity here,
    // let's assume the main save action will handle it if avatarUrl changes.
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
        <Text style={styles.errorText}>{(fetchError as Error).message || 'Unknown error'}</Text>
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
        onChangeText={(text) => handleInputChange('name', text)}
        placeholder="Your full name"
        placeholderTextColor={colors.light.placeholder}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Avatar URL</Text>
      <TextInput
        style={styles.input}
        value={formState.avatarUrl ?? ''} // Handle null case
        onChangeText={(text) => handleInputChange('avatarUrl', text || null)} // Set to null if empty
        placeholder="https://example.com/avatar.png"
        keyboardType="url"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={formState.bio}
        onChangeText={(text) => handleInputChange('bio', text)}
        placeholder="Tell us a bit about yourself"
        placeholderTextColor={colors.light.placeholder}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        value={formState.phoneNumber}
        onChangeText={(text) => handleInputChange('phoneNumber', text)}
        placeholder="(Optional) Your phone number"
        placeholderTextColor={colors.light.placeholder}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Skills (comma-separated)</Text>
      <TextInput
        style={styles.input}
        value={formState.skills}
        onChangeText={(text) => handleInputChange('skills', text)}
        placeholder="e.g., React Native, TypeScript, Node.js"
        placeholderTextColor={colors.light.placeholder}
      />

      <Text style={styles.label}>Focus Areas (comma-separated)</Text>
      <TextInput
        style={styles.input}
        value={formState.focusAreas}
        onChangeText={(text) => handleInputChange('focusAreas', text)}
        placeholder="e.g., Mobile Development, UI/UX Design"
        placeholderTextColor={colors.light.placeholder}
      />

      <Text style={styles.label}>Portfolio URL</Text>
      <TextInput
        style={styles.input}
        value={formState.portfolioUrl}
        onChangeText={(text) => handleInputChange('portfolioUrl', text)}
        placeholder="(Optional) Link to your portfolio"
        placeholderTextColor={colors.light.placeholder}
        keyboardType="url"
        autoCapitalize="none"
      />

      <Text style={styles.label}>GitHub URL</Text>
      <TextInput
        style={styles.input}
        value={formState.githubUrl}
        onChangeText={(text) => handleInputChange('githubUrl', text)}
        placeholder="(Optional) Link to your GitHub profile"
        placeholderTextColor={colors.light.placeholder}
        keyboardType="url"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Hourly Rate (USD)</Text>
      <TextInput
        style={styles.input}
        value={formState.hourlyRate}
        onChangeText={(text) => handleInputChange('hourlyRate', text)}
        placeholder="(Optional) e.g., 75"
        placeholderTextColor={colors.light.placeholder}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        value={formState.location}
        onChangeText={(text) => handleInputChange('location', text)}
        placeholder="(Optional) e.g., San Francisco, CA or Remote"
        placeholderTextColor={colors.light.placeholder}
      />

      <Text style={styles.label}>Years of Experience</Text>
      <TextInput
        style={styles.input}
        value={formState.yearsOfExperience}
        onChangeText={(text) => handleInputChange('yearsOfExperience', text)}
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
  contentContainer: {
    padding: spacing.md, // Use theme spacing
  },
  loadingContainer: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.light.background,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 16,
    color: colors.light.textSecondary,
  },
  errorContainer: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.light.background,
  },
  errorText: { 
    color: colors.light.error, 
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600', // Bolder labels
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
    textAlignVertical: 'top', // Align text to top
  },
  buttonContainer: {
    marginTop: spacing.lg, // Add space above button
  },
});

export default EditDeveloperProfileScreen;
