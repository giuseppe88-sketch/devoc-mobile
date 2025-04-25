// @ts-ignore -- Temporarily ignore missing type for React 19 RC hook
import React, { useState, useEffect, useActionState, startTransition, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// Removed direct supabase import as action handles it
import { useAuthStore } from '../../stores/auth-store';
import { useClientProfile } from '../../hooks/useClientProfile';
import { useColors } from '../../theme';
import { ClientProfileStackParamList, ClientProfile } from '../../types';
// Import the action and its related types
import {
  saveClientProfileAction,
  ActionState,
  ClientProfileFormData,
} from '../../actions/client-profile-actions';

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

// --- Component ---

function EditClientProfileScreen() {
  const navigation = useNavigation<EditClientProfileScreenNavigationProp>();
  const route = useRoute<EditClientProfileScreenRouteProp>();
  const session = useAuthStore((state) => state.session);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const colors = useColors('light'); // Get colors for the current theme

  const { data: profileData, isLoading: isFetching, error: fetchError } = useClientProfile(user?.id);

  // State for form fields
  const initialFormState: EditClientFormState = {
    clientName: '',
    companyName: '',
    logoUrl: '',
    websiteUrl: '',
  };
  const [formState, setFormState] = useState<EditClientFormState>(initialFormState);
  // Removed isSaving state, useActionState handles pending state

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

  // --- Styles defined inside component using colors --- 
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background, // Use color from hook
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.background, // Use color from hook
    },
    contentContainer: {
      padding: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      color: colors.text, // Use color from hook
    },
    input: {
      fontSize: 16,
      padding: 12,
      borderWidth: 1,
      borderRadius: 8,
      marginBottom: 16,
      backgroundColor: colors.card, // Use color from hook
      color: colors.text, // Use color from hook
      borderColor: colors.border, // Use color from hook
    },
    text: {
      fontSize: 16,
      color: colors.text, // Use color from hook
    },
    errorText: {
      fontSize: 16,
      color: colors.error, // Use color from hook
      textAlign: 'center',
      marginBottom: 5,
    },
    loadingText: {
        fontSize: 16,
        color: colors.text,
        marginTop: 10,
    },
    buttonContainer: {
      marginTop: 24,
    },
  }), [colors]); // Recreate styles if colors change

  // --- Render Logic ---
  if (isFetching) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error loading profile:</Text>
        <Text style={styles.errorText}>
          {(fetchError as Error)?.message || 'Unknown error'}
        </Text>
        {/* Add a retry button? */}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Client Name *</Text>
      <TextInput
        style={styles.input}
        value={formState.clientName}
        onChangeText={(text) => handleInputChange('clientName', text)}
        placeholder="Your name or company name"
        placeholderTextColor={colors.placeholder}
        autoCapitalize="words"
        />

      <Text style={styles.label}>Company Name (Optional)</Text>
      <TextInput
        style={styles.input}
        value={formState.companyName}
        onChangeText={(text) => handleInputChange('companyName', text)}
        placeholder="Legal company name (if different)"
        placeholderTextColor={colors.placeholder}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Logo URL (Optional)</Text>
      <TextInput
        style={styles.input}
        value={formState.logoUrl}
        onChangeText={(text) => handleInputChange('logoUrl', text)}
        placeholder="https://example.com/logo.png"
        placeholderTextColor={colors.placeholder}
        keyboardType="url"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Website URL (Optional)</Text>
      <TextInput
        style={styles.input}
        value={formState.websiteUrl}
        onChangeText={(text) => handleInputChange('websiteUrl', text)}
        placeholder="https://your-company.com"
        placeholderTextColor={colors.placeholder}
        keyboardType="url"
        autoCapitalize="none"
      />

      <View style={styles.buttonContainer}>
        {isPending ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Button
            title="Save Profile"
            onPress={handleSave}
            color={colors.primary}
            disabled={isPending} // Use isPending from useActionState
          />
        )}
      </View>
    </ScrollView>
  );
}

// Styles are now defined inside the component using useMemo

export default EditClientProfileScreen;
