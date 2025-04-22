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
import { DeveloperProfile } from '../../types';
import { useDeveloperProfile } from '../../hooks/useDeveloperProfile'; 
import { colors, spacing } from '../../theme'; 
// import ImagePickerComponent from '../../components/common/image-picker'; 
// import { colors } from '../../theme/colors'; 
import type { ProfileStackParamList } from '../../types'; 

// Define the expected shape of the action state
interface ActionState {
  success: boolean;
  message?: string;
}

// Define the type for the form data passed to the action
type ProfileFormData = Partial<Omit<DeveloperProfile, 'user_id'>>; 

// --- Server Action --- 
// This function handles the logic for saving the profile.
// It will be wrapped by useActionState.
async function saveProfileAction(
  previousState: ActionState | null, 
  formData: { user_id: string, userData: Partial<UserProfileData>, devData: ProfileFormData } 
): Promise<ActionState> {
  const { user_id, userData, devData } = formData;

  console.log("Action triggered. Updating user data:", userData);
  console.log("Action triggered. Upserting dev data:", devData);

  try {
    // 1. Update public.users table (only if userData has keys)
    if (Object.keys(userData).length > 0) {
      const { error: userUpdateError } = await supabase
        .from('users')
        .update(userData)
        .eq('id', user_id);

      if (userUpdateError) {
        console.error('User update error:', userUpdateError);
        return { success: false, message: `Failed to update user profile: ${userUpdateError.message}` };
      }
      console.log("User data updated successfully.");
    }

    // 2. Invoke the Edge Function to upsert developer_profiles
    const { data: functionData, error: functionError } = await supabase.functions.invoke(
      'upsert-developer-profile', 
      {
        // Pass data structured as the function expects
        body: { ...devData, id: user_id }, 
      }
    );

    if (functionError) {
      console.error('Edge function error:', functionError);
      // Attempt to parse Supabase Edge Function error details if available
      const detailedMessage = functionError.context?.errorMessage || functionError.message;
      return { success: false, message: `Failed to update developer details: ${detailedMessage}` };
    }

    console.log('Edge function success:', functionData);
    return { success: true, message: 'Profile updated successfully!' };

  } catch (err: any) {
    console.error('Unexpected error in saveProfileAction:', err);
    return { success: false, message: err.message || 'An unexpected error occurred during save.' };
  }
}

// Define UserProfileData type based on users table fields being updated
interface UserProfileData {
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  // Add other fields from 'users' table if they are updatable here
}

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

  // State for form fields
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState(''); 
  const [focusAreas, setFocusAreas] = useState(''); 
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [location, setLocation] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // useActionState hook manages the submission process
  // state: holds the result of the last action { success, message }
  // submitAction: function to call to trigger the action
  // isPending: boolean indicating if the action is currently running
  const [state, submitAction, isPending] = useActionState<ActionState | null, { user_id: string, userData: Partial<UserProfileData>, devData: ProfileFormData }>(saveProfileAction, null);

  // Effect to populate form state when profile data loads or changes
  useEffect(() => {
    if (profileData) {
      // Populate state from the combined profile data fetched by the hook
      setName(profileData.name || ''); // Hook maps full_name to name
      setAvatarUrl(profileData.avatar_url || null);
      setBio(profileData.bio || '');
      setSkills(profileData.skills?.join(', ') || '');
      setFocusAreas(profileData.focus_areas?.join(', ') || '');
      setPortfolioUrl(profileData.portfolio_url || '');
      setGithubUrl(profileData.github_url || '');
      setHourlyRate(profileData.hourly_rate?.toString() || '');
      setLocation(profileData.location || '');
      setYearsOfExperience(profileData.years_of_experience?.toString() || '');
      setPhoneNumber(profileData.phone_number || '');
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
      full_name: name.trim(),
      bio: bio.trim(),
      // avatar_url is handled by ImagePickerComponent directly via its upload function
      // We only update it here if a NEW url was generated/provided NOT via the picker
      // If ImagePicker handles the upload AND update, remove avatar_url here.
      ...(avatarUrl && !avatarUrl.startsWith('data:') ? { avatar_url: avatarUrl } : {}), 
    };

    // Developer profile specific data for 'developer_profiles' table/function
    const developerProfileDataToUpsert: ProfileFormData = {
      phone_number: phoneNumber.trim() || undefined, 
      skills: skills.split(',').map(s => s.trim()).filter(s => s), 
      focus_areas: focusAreas.split(',').map(s => s.trim()).filter(s => s),
      portfolio_url: portfolioUrl.trim() || undefined, 
      github_url: githubUrl.trim() || undefined, 
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : undefined, 
      location: location.trim() || undefined, 
      years_of_experience: yearsOfExperience
        ? parseInt(yearsOfExperience, 10)
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
    setAvatarUrl(newAvatarUrl); 
    // NOTE: The ImagePickerComponent likely handles the UPLOAD.
    // Decide if the ImagePicker should ALSO update the 'users' table
    // or if we rely on the main save action. For simplicity here,
    // let's assume the main save action will handle it if avatarUrl changes.
  };

  // --- Render Logic --- 
  if (isLoading) { 
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.light.primary} />
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
        currentAvatarUrl={avatarUrl}
        onUploadComplete={handleAvatarUploadComplete}
        uploadPath={`avatars/${user?.id}`}
      /> */}
      
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Your full name"
        placeholderTextColor={colors.light.placeholder}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={bio}
        onChangeText={setBio}
        placeholder="Tell us a bit about yourself"
        placeholderTextColor={colors.light.placeholder}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder="(Optional) Your phone number"
        placeholderTextColor={colors.light.placeholder}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Skills (comma-separated)</Text>
      <TextInput
        style={styles.input}
        value={skills}
        onChangeText={setSkills}
        placeholder="e.g., React, Node.js, Python"
        placeholderTextColor={colors.light.placeholder}
      />

      <Text style={styles.label}>Focus Areas (comma-separated)</Text>
      <TextInput
        style={styles.input}
        value={focusAreas}
        onChangeText={setFocusAreas}
        placeholder="e.g., Frontend, Backend, DevOps"
        placeholderTextColor={colors.light.placeholder}
      />

      <Text style={styles.label}>Portfolio URL</Text>
      <TextInput
        style={styles.input}
        value={portfolioUrl}
        onChangeText={setPortfolioUrl}
        placeholder="(Optional) https://yourportfolio.com"
        placeholderTextColor={colors.light.placeholder}
        keyboardType="url"
        autoCapitalize="none"
      />

      <Text style={styles.label}>GitHub URL</Text>
      <TextInput
        style={styles.input}
        value={githubUrl}
        onChangeText={setGithubUrl}
        placeholder="(Optional) https://github.com/yourusername"
        placeholderTextColor={colors.light.placeholder}
        keyboardType="url"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Hourly Rate ($)</Text>
      <TextInput
        style={styles.input}
        value={hourlyRate}
        onChangeText={setHourlyRate}
        placeholder="(Optional) e.g., 50"
        placeholderTextColor={colors.light.placeholder}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="(Optional) City, Country"
        placeholderTextColor={colors.light.placeholder}
      />

      <Text style={styles.label}>Years of Experience</Text>
      <TextInput
        style={styles.input}
        value={yearsOfExperience}
        onChangeText={setYearsOfExperience}
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
