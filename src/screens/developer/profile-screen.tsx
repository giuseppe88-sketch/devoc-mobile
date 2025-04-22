import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Alert
} from 'react-native';
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

  const handleLinkPress = async (url: string | undefined | null) => {
    if (!url) return;

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      try {
        await Linking.openURL(url);
      } catch (err) {
        Alert.alert(`Don't know how to open this URL: ${url}`);
      }
    } else {
      Alert.alert(`Don't know how to open this URL: ${url}`);
    }
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
            <Ionicons name="create-outline" size={24} color={colors.secondary} />
          </TouchableOpacity>
        </View>

        {profileData && (
          <>
            <View style={styles.avatarContainer}>
                {profileData?.avatar_url ? (
                  <Image source={{ uri: profileData.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={50} color={colors.textSecondary} />
                  </View>
                )}
             </View>

             <View style={styles.detailsCard}>
                <View style={styles.detailItem}>
                   <Text style={styles.label}>Name</Text>
                   <Text style={styles.value}>{profileData?.name || <Text style={styles.notSetText}>N/A</Text>}</Text>
                 </View>
                 <View style={styles.detailItem}>
                   <Text style={styles.label}>Email</Text>
                   <Text style={styles.value}>{user?.email || <Text style={styles.notSetText}>N/A</Text>}</Text>
                 </View>
                 <View style={styles.detailItem}>
                   <Text style={styles.label}>Phone</Text>
                   <Text style={styles.value}>{profileData?.phone_number || <Text style={styles.notSetText}>Not set</Text>}</Text>
                 </View>
                 <View style={styles.detailItem}>
                   <Text style={styles.label}>Bio</Text>
                   <Text style={styles.value}>{profileData?.bio || <Text style={styles.notSetText}>Not set</Text>}</Text>
                 </View>
                 <View style={styles.detailItem}>
                   <Text style={styles.label}>Hourly Rate</Text>
                   <Text style={styles.value}>{profileData?.hourly_rate ? `$${profileData.hourly_rate}/hr` : <Text style={styles.notSetText}>Not set</Text>}</Text>
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
                   ) : <Text style={styles.notSetText}>Not set</Text>}
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
                    ) : <Text style={styles.notSetText}>Not set</Text>}
                 </View>
               </View>
               <View style={styles.detailItem}>
                 <Text style={styles.label}>Portfolio URL</Text>
                 {profileData?.portfolio_url ? (
                   <TouchableOpacity onPress={() => handleLinkPress(profileData.portfolio_url)}>
                     <Text style={[styles.value, styles.linkText]}>{profileData.portfolio_url}</Text>
                   </TouchableOpacity>
                 ) : (
                   <Text style={styles.notSetText}>Not set</Text>
                 )}
               </View>
               <View style={styles.detailItem}>
                 <Text style={styles.label}>GitHub URL</Text>
                 {profileData?.github_url ? (
                   <TouchableOpacity onPress={() => handleLinkPress(profileData.github_url)}>
                     <Text style={[styles.value, styles.linkText]}>{profileData.github_url}</Text>
                   </TouchableOpacity>
                 ) : (
                   <Text style={styles.notSetText}>Not set</Text>
                 )}
               </View>
               <View style={styles.detailItem}>
                 <Text style={styles.label}>Location</Text>
                 <Text style={styles.value}>{profileData?.location || <Text style={styles.notSetText}>Not set</Text>}</Text>
               </View>
               <View style={styles.detailItem}>
                 <Text style={styles.label}>Years of Experience</Text>
                 <Text style={styles.value}>{profileData?.years_of_experience ? `${profileData.years_of_experience} years` : <Text style={styles.notSetText}>Not set</Text>}</Text>
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
  avatarContainer: { alignItems: 'center', marginVertical: spacing.lg }, 
  avatar: {
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  avatarPlaceholder: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: colors.card,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailsCard: { 
    borderRadius: spacing.md,
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, 
  },
  detailsContainer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }, 
  detailItem: {
    borderWidth: 1,            
    borderColor: colors.border,  
    borderRadius: spacing.sm,  
    padding: spacing.md,       
    marginBottom: spacing.md,  
  },
  label: { 
    fontSize: 14, 
    color: colors.textSecondary, 
    marginBottom: spacing.xs, 
    opacity: 0.8, 
  },
  value: { 
    fontSize: 17, 
    color: colors.text, 
    lineHeight: 24, 
  },
  linkText: { 
    color: colors.primary, 
    textDecorationLine: 'underline',
  },
  notSetText: { 
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  listContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs },
  badge: {
    backgroundColor: colors.subtle, 
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 15,
    marginRight: spacing.sm, 
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.secondary, 
  },
  badgeText: { 
    color: colors.text, 
    fontSize: 13, 
    fontWeight: '500' 
  },
  errorText: { color: colors.error, textAlign: 'center', margin: spacing.md, fontSize: 16 },
});

export default DeveloperProfileScreen;
