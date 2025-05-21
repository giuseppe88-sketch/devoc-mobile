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
          <Text style={styles.label}>Logo URL</Text>
          <TextInput
            style={styles.input}
            value={formState.logoUrl}
            onChangeText={(text) => handleInputChange('logoUrl', text)}
            placeholder="Optional: URL to your logo (e.g., https://...)"
            placeholderTextColor={colors.placeholder}
            keyboardType="url"
            autoCapitalize="none"
          />
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
