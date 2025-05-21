import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from "../../stores/auth-store";
import { useClientProfile } from "../../hooks/useClientProfile";
import { ClientProfileStackParamList } from "../../types";
import { colors as themeColors, spacing } from "../../theme";
import { Linking, Alert } from 'react-native';

// --- Theme Colors ---
const colors = themeColors.light; // Use light theme colors

// Define navigation prop type for type safety
type ClientProfileScreenNavigationProp = NativeStackNavigationProp<
  ClientProfileStackParamList,
  'ClientProfile'
>;

export function ClientProfileScreen() {
  const navigation = useNavigation<ClientProfileScreenNavigationProp>();
  const userId = useAuthStore((state) => state.user?.id);
  const { data: profile, isLoading, isError, error } = useClientProfile(userId);

  const handleEditProfile = () => {
    // Prepare profile data for navigation, ensuring email is string | undefined
    const profileForNavigation = profile
      ? { ...profile, email: profile.email ?? undefined } // Convert null to undefined
      : { email: undefined }; // Use profile.email if available
    navigation.navigate("EditClientProfile", {
      profileData: profileForNavigation,
    });
  };

  const handleLinkPress = async (url: string | undefined | null) => {
    if (!url) return;

    // Prepend https:// if scheme is missing
    const formattedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

    const supported = await Linking.canOpenURL(formattedUrl);

    if (supported) {
      try {
        await Linking.openURL(formattedUrl);
      } catch (err) {
        Alert.alert(`Don't know how to open this URL: ${formattedUrl}`);
      }
    } else {
      Alert.alert(`Don't know how to open this URL: ${formattedUrl}`);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size={50} color={colors.primary} style={styles.centered} />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            Error loading profile: {error instanceof Error ? error.message : 'Unknown error'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Your Profile</Text>
          <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
            <Ionicons name="create-outline" size={24} color={colors.secondary} />
          </TouchableOpacity>
        </View>

        {profile && (
          <>
            <View style={styles.avatarContainer}>
              {profile.logo_url ? (
                <Image source={{ uri: profile.logo_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={50} color={colors.textSecondary} />
                </View>
              )}
            </View>

            <View style={styles.detailsCard}>
              <View style={styles.detailItem}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{profile.client_name || <Text style={styles.notSetText}>N/A</Text>}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{profile.email || <Text style={styles.notSetText}>N/A</Text>}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.label}>Company Name</Text>
                <Text style={styles.value}>{profile.company_name || <Text style={styles.notSetText}>Not set</Text>}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.label}>Company Website</Text>
                {profile.website_url ? (
                  <TouchableOpacity onPress={() => handleLinkPress(profile.website_url)}>
                    <Text style={[styles.value, styles.linkText]}>{profile.website_url}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.notSetText}>Not set</Text>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  editButton: { padding: spacing.sm },
  avatarContainer: { 
    alignItems: 'center', 
    marginVertical: spacing.lg 
  }, 
  avatar: {
    width: 120, 
    height: 120,
    borderRadius: 60, 
    backgroundColor: colors.subtle,
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.subtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailsCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  detailItem: {
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    color: colors.text,
  },
  linkText: {
    color: colors.primary, 
    textDecorationLine: 'underline',
  },
  notSetText: {
    fontStyle: 'italic',
    color: colors.textSecondary,
    fontSize: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
});
