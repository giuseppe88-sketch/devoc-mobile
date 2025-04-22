import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth-store';
import { DeveloperProfile } from '../../types';
import { colors as themeColors, spacing } from '../../theme';
import { useDeveloperProfile } from '../../hooks/useDeveloperProfile';

const colors = themeColors.dark;

function DeveloperProfileScreen({ navigation }: { navigation: any }) {
  const { user } = useAuthStore();

  const { 
    data: profileData, 
    isLoading, 
    error 
  } = useDeveloperProfile(user?.id);

  const handleEditPress = () => {
    navigation.navigate('EditDeveloperProfile', { profileData: profileData ?? null });
  };

  if (isLoading) {
    return (
        <SafeAreaView style={styles.container}>
          <ActivityIndicator size="large" color={colors.primary} style={styles.centered} />
        </SafeAreaView>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Error loading profile: {errorMessage}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Your Profile</Text>
          <TouchableOpacity onPress={handleEditPress} style={styles.editButton}>
            <Ionicons name="create-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {profileData && (
          <>
            <View style={styles.avatarContainer}>
                {profileData?.avatar_url ? (
                  <Image source={{ uri: profileData.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={40} color="#999" />
                  </View>
                )}
             </View>

             <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                   <Text style={styles.label}>Name</Text>
                   <Text style={styles.value}>{profileData?.name || 'N/A'}</Text>
                 </View>
                 <View style={styles.detailItem}>
                   <Text style={styles.label}>Email</Text>
                   <Text style={styles.value}>{user?.email || 'N/A'}</Text>
                 </View>
                 <View style={styles.detailItem}>
                   <Text style={styles.label}>Phone</Text>
                   <Text style={styles.value}>{profileData?.phone_number || 'Not set'}</Text>
                 </View>
                 <View style={styles.detailItem}>
                   <Text style={styles.label}>Bio</Text>
                   <Text style={styles.value}>{profileData?.bio || 'Not set'}</Text>
                 </View>
                 <View style={styles.detailItem}>
                   <Text style={styles.label}>Hourly Rate</Text>
                   <Text style={styles.value}>{profileData?.hourly_rate ? `$${profileData.hourly_rate}/hr` : 'Not set'}</Text>
                 </View>
               <View style={styles.detailItem}>
                 <Text style={styles.label}>Focus Areas</Text>
                 <View style={styles.listContainer}>
                   {profileData?.focus_areas?.length ? (
                     profileData.focus_areas.map((area: string, index: number) => (
                       <View key={index} style={styles.badge}>
                         <Text style={styles.badgeText}>{area}</Text>
                       </View>
                     ))
                   ) : <Text style={styles.value}>Not set</Text>}
                 </View>
               </View>
               <View style={styles.detailItem}>
                 <Text style={styles.label}>Skills</Text>
                 <View style={styles.listContainer}>
                   {profileData?.skills?.length ? (
                     profileData.skills.map((skill: string, index: number) => (
                       <View key={index} style={styles.badge}>
                         <Text style={styles.badgeText}>{skill}</Text>
                       </View>
                     ))
                    ) : <Text style={styles.value}>Not set</Text>}
                 </View>
               </View>
               <View style={styles.detailItem}>
                 <Text style={styles.label}>Portfolio URL</Text>
                 <Text style={styles.value}>{profileData?.portfolio_url || 'Not set'}</Text>
               </View>
               <View style={styles.detailItem}>
                 <Text style={styles.label}>GitHub URL</Text>
                 <Text style={styles.value}>{profileData?.github_url || 'Not set'}</Text>
               </View>
               <View style={styles.detailItem}>
                 <Text style={styles.label}>Location</Text>
                 <Text style={styles.value}>{profileData?.location || 'Not set'}</Text>
               </View>
               <View style={styles.detailItem}>
                 <Text style={styles.label}>Years of Experience</Text>
                 <Text style={styles.value}>{profileData?.years_of_experience || 'Not set'}</Text>
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
  },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  editButton: { padding: spacing.sm },
  avatarContainer: { alignItems: 'center', marginVertical: spacing.lg },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: colors.card,
    justifyContent: 'center', alignItems: 'center',
  },
  detailsContainer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  detailItem: {
    marginBottom: spacing.md, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  label: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.sm },
  value: { fontSize: 16, color: colors.text, lineHeight: 22 },
  listContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  badge: {
    backgroundColor: colors.secondary, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderRadius: 15,
    marginRight: spacing.sm, marginBottom: spacing.sm,
  },
  badgeText: { color: colors.text, fontSize: 12, fontWeight: '500' },
  errorText: { color: colors.error, textAlign: 'center', margin: spacing.md },
});

export default DeveloperProfileScreen;
