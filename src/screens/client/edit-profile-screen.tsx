// @ts-ignore -- Temporarily ignore missing type for React 19 RC hook
import React, { useState, useEffect, useActionState, startTransition, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity, // Add TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Add SafeAreaView
import { useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// Removed direct supabase import as action handles it
import { useAuthStore } from '../../stores/auth-store';
import { useClientProfile } from '../../hooks/useClientProfile';
import { colors as themeColors, spacing } from '../../theme'; // Import theme colors and spacing
import { ClientProfileStackParamList, ClientProfile } from '../../types';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase'; // Assuming supabase client is here
import { decode } from 'base64-arraybuffer';
// Import the action and its related types
import {
  saveClientProfileAction,
  ActionState,
  ClientProfileFormData,
} from '../../actions/client-profile-actions';

// --- Theme Colors ---
const colors = themeColors.light; // Use theme colors

// --- Types ---

type EditClientProfileScreenNavigationProp = NativeStackNavigationProp<
  ClientProfileStackParamList,
  'EditClientProfile'
>;

type EditClientProfileScreenRouteProp = RouteProp<
  ClientProfileStackParamList,
  'EditClientProfile'
>;

// Interface for the form state
interface EditClientFormState {
  clientName: string;
  companyName: string;
  logoUrl: string;
  websiteUrl: string;
}

function EditClientProfileScreen() {
  const navigation = useNavigation<EditClientProfileScreenNavigationProp>();
  const route = useRoute<EditClientProfileScreenRouteProp>();
  const session = useAuthStore((state) => state.session);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const { data: profileData, isLoading: isFetching, error: fetchError } = useClientProfile(user?.id);

  // State for form fields
  const initialFormState: EditClientFormState = {
    clientName: '',
    companyName: '',
    logoUrl: '',
    websiteUrl: '',
  };
  const [formState, setFormState] = useState<EditClientFormState>(initialFormState);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // useActionState hook to manage the submission
  const [state, submitAction, isPending] = useActionState<ActionState | null, {
    session: typeof session;
    userId: string;
    clientData: ClientProfileFormData;
  }>(saveClientProfileAction, null);

  // Populate form when profile data loads
  useEffect(() => {
    if (profileData) {
      setFormState({
        clientName: profileData.client_name || '',
        companyName: profileData.company_name || '',
        logoUrl: profileData.logo_url || '',
        websiteUrl: profileData.website_url || '',
      });
    }
  }, [profileData]);

  // Effect to handle action result (feedback and navigation)
  useEffect(() => {
    if (state?.message) {
      Alert.alert(state.success ? 'Success' : 'Error', state.message);
      if (state.success && user?.id) {
        // Invalidate cache and navigate back on success
        queryClient.invalidateQueries({ queryKey: ['clientProfile', user.id] });
        navigation.goBack();
      }
    }
  }, [state, navigation, queryClient, user?.id]);

  // Generic handler for updating form state
  const handleInputChange = <K extends keyof EditClientFormState>(
    field: K,
    value: EditClientFormState[K]
  ) => {
    setFormState((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  const uploadAvatar = async (base64Data: string, fileType: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const arrayBuffer = decode(base64Data);
      const fileExtension = fileType.split('/')[1] || 'jpg'; // e.g., 'jpeg' from 'image/jpeg'
      const fileName = `${user.id}-avatar-${Date.now()}.${fileExtension}`;
      const filePath = `public/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('client-avatars')
        .upload(filePath, arrayBuffer, {
          contentType: fileType || 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('client-avatars')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        handleInputChange('logoUrl', publicUrlData.publicUrl);
        Alert.alert('Success', 'Avatar updated successfully!');
      } else {
        Alert.alert('Error', 'Could not get public URL for the avatar.');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred during upload.';
      Alert.alert('Upload Error', `Failed to upload avatar: ${message}`);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7, // Compress image slightly
      base64: true, // Request base64 data
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedAsset = result.assets[0];
      if (selectedAsset.base64 && selectedAsset.mimeType) {
        uploadAvatar(selectedAsset.base64, selectedAsset.mimeType);
      } else if (selectedAsset.base64) {
        // Fallback if mimeType is somehow not available, default to jpeg
        uploadAvatar(selectedAsset.base64, 'image/jpeg'); 
      } else {
        Alert.alert('Error', 'Could not get image data to upload.');
      }
    }
  };

  // Handle Save Button Press using startTransition and the action
  const handleSave = () => {
    if (!session || !user?.id) {
      Alert.alert('Error', 'Authentication required.');
      return;
    }
    if (!formState.clientName.trim()) {
      Alert.alert('Error', 'Client Name is required.');
      return;
    }

    const clientDataToSave: ClientProfileFormData = {
      client_name: formState.clientName.trim(),
      company_name: formState.companyName.trim() || null,
      logo_url: formState.logoUrl.trim() || null,
      website_url: formState.websiteUrl.trim() || null,
    };

    // Wrap the action call in startTransition
    startTransition(() => {
      submitAction({ session, userId: user.id, clientData: clientDataToSave });
    });
  };

  // --- Render Logic ---
  if (isFetching) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size={50} color={colors.primary} />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error loading profile:</Text>
        <Text style={styles.errorText}>
          {fetchError instanceof Error ? fetchError.message : 'An unknown error occurred'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}> {/* Use SafeAreaView */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.headerTitle}>Edit Profile</Text> {/* Add header title */}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Client Name *</Text>
          <TextInput
            style={styles.input}
            value={formState.clientName}
            onChangeText={(text) => handleInputChange('clientName', text)}
            placeholder="Your full name or organization name"
            placeholderTextColor={colors.placeholder}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Company Name</Text>
          <TextInput
            style={styles.input}
            value={formState.companyName}
            onChangeText={(text) => handleInputChange('companyName', text)}
            placeholder="Optional: Your company name"
            placeholderTextColor={colors.placeholder}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Avatar / Logo</Text>
          {formState.logoUrl ? (
            <Image source={{ uri: formState.logoUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>No Avatar</Text>
            </View>
          )}
          <TouchableOpacity style={styles.changeAvatarButton} onPress={() => handlePickAvatar()} disabled={isUploadingAvatar}>
            <Text style={styles.changeAvatarButtonText}>Change Avatar</Text>
          </TouchableOpacity>
          {isUploadingAvatar && <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.sm }} />}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Website URL</Text>
          <TextInput
            style={styles.input}
            value={formState.websiteUrl}
            onChangeText={(text) => handleInputChange('websiteUrl', text)}
            placeholder="Optional: Your website URL"
            placeholderTextColor={colors.placeholder}
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isPending && styles.saveButtonDisabled]} // Use TouchableOpacity
          onPress={handleSave}
          disabled={isPending}
        >
          {isPending 
            ? <ActivityIndicator size="small" color={'#ffffff'} /> // Use #ffffff directly
            : <Text style={styles.saveButtonText}>Save Changes</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles --- (Moved outside component)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl, // Ensure space at the bottom
  },
  centered: { // Keep centered styles for loading/error states
    flex: 1, // Make centered view take full screen
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.md,
    alignSelf: 'center',
    backgroundColor: colors.subtle,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.subtle,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  avatarPlaceholderText: {
    color: colors.textSecondary,
  },
  changeAvatarButton: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.xs,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  changeAvatarButtonText: {
    color: themeColors.dark.text, // Assuming secondary button text is light
    fontWeight: 'bold',
  },
  input: {
    fontSize: 16,
    paddingVertical: spacing.sm, // Use spacing
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: colors.card,
    color: colors.text,
    borderColor: colors.border,
  },
  text: {
    fontSize: 16,
    color: colors.text,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
    marginTop: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonDisabled: {
    backgroundColor: colors.subtle, // Use subtle color for muted state
  },
  saveButtonText: {
    color: '#ffffff', // Use #ffffff directly
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditClientProfileScreen;
