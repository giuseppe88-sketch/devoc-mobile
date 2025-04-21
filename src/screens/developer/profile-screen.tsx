import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth-store';
import { DeveloperProfile } from '../../types';
import { colors as themeColors, spacing } from "../../theme";

const colors = themeColors.dark;

interface DisplayProfile {
  email?: string;
  name?: string; 
  avatar_url?: string; 
  bio?: string; 
  phone_number?: string; 
  skills?: string[]; 
  focus_areas?: string[]; 
  portfolio_url?: string; 
  github_url?: string; 
  hourly_rate?: number; 
  location?: string; 
  years_of_experience?: number; 
}

function DeveloperProfileScreen({ navigation }: { navigation: any }) {
  const { user } = useAuthStore();
  const [displayProfile, setDisplayProfile] = useState<DisplayProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setError("User not logged in.");
        setLoading(false); // Stop loading if no user
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // --- Fetch developer-specific details ---
        const { data: devProfileData, error: devProfileError } = await supabase
          .from('developer_profiles')
          .select('phone_number, skills, focus_areas, portfolio_url, github_url, hourly_rate, location, years_of_experience')
          .eq('id', user.id)
          .single();

        // Log error if fetching dev profile fails, but don't necessarily stop
        if (devProfileError && devProfileError.code !== 'PGRST116') {
          console.error('Error fetching developer profile:', devProfileError);
          // Decide if this error is critical or if you can proceed without dev data
          // For now, we'll log and continue
        }

        // --- Fetch general user details from public.users table ---
        const { data: userProfileData, error: userProfileError } = await supabase
          .from('users') // Query the public users table
          .select('full_name, avatar_url, bio') // Select the required fields
          .eq('id', user.id) // Match the user ID
          .single();

        // Log error if fetching user profile fails, but don't necessarily stop
        // PGRST116 means 0 rows returned, which is not necessarily an error if profile is optional
        if (userProfileError && userProfileError.code !== 'PGRST116') {
           console.error('Error fetching user profile:', userProfileError);
           // Decide if this error is critical
           // For now, we'll log and continue
        }

        // --- Combine data ---
        // Ensure userProfileData and devProfileData might be null/undefined from fetches
        const combinedProfile: DisplayProfile = {
          // Core detail from auth user object
          email: user.email,
          // Details from public.users table (handle potential null/undefined)
          name: userProfileData?.full_name,
          avatar_url: userProfileData?.avatar_url,
          bio: userProfileData?.bio,
          // Details from developer_profiles table (handle potential null/undefined)
          phone_number: devProfileData?.phone_number,
          skills: devProfileData?.skills,
          focus_areas: devProfileData?.focus_areas,
          portfolio_url: devProfileData?.portfolio_url,
          github_url: devProfileData?.github_url,
          hourly_rate: devProfileData?.hourly_rate,
          location: devProfileData?.location,
          years_of_experience: devProfileData?.years_of_experience,
        };
        setDisplayProfile(combinedProfile);

      } catch (err: any) { // Catch errors if any were explicitly thrown above
        console.error('Critical error during profile fetching process:', err);
        setError(err.message || 'Failed to fetch complete profile data.');
        // Update fallback - can only use email reliably now
        setDisplayProfile({
           email: user?.email, // Use email from the auth store user (check if user exists)
           // name, avatar_url, bio etc., will default to undefined
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]); // Dependency array includes user

  const handleEditPress = () => {
    navigation.navigate('EditDeveloperProfile', { profileData: displayProfile });
  };

  if (loading) {
    return (
        <SafeAreaView style={styles.container}>
          <ActivityIndicator size="large" color={colors.primary} style={styles.centered} />
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

         {error && <Text style={styles.errorText}>{error}</Text>}

         {displayProfile && (
           <>
             <View style={styles.avatarContainer}>
                {displayProfile.avatar_url ? (
                  <Image source={{ uri: displayProfile.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={40} color="#999" />
                  </View>
                )}
             </View>

             <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                   <Text style={styles.label}>Name</Text>
                   <Text style={styles.value}>{displayProfile.name || 'N/A'}</Text>
                 </View>
                 <View style={styles.detailItem}>
                   <Text style={styles.label}>Email</Text>
                   <Text style={styles.value}>{displayProfile.email || 'N/A'}</Text>
                 </View>
                 <View style={styles.detailItem}>
                   <Text style={styles.label}>Phone</Text>
                   <Text style={styles.value}>{displayProfile.phone_number || 'Not set'}</Text>
                 </View>
                 <View style={styles.detailItem}>
                   <Text style={styles.label}>Bio</Text>
                   <Text style={styles.value}>{displayProfile.bio || 'Not set'}</Text>
                 </View>
                 <View style={styles.detailItem}>
                   <Text style={styles.label}>Hourly Rate</Text>
                   <Text style={styles.value}>{displayProfile.hourly_rate ? `$${displayProfile.hourly_rate}/hr` : 'Not set'}</Text>
                 </View>
               <View style={styles.detailItem}>
                 <Text style={styles.label}>Focus Areas</Text>
                 <View style={styles.listContainer}>
                   {displayProfile.focus_areas?.length ? (
                     displayProfile.focus_areas.map((area: string, index: number) => (
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
                   {displayProfile.skills?.length ? (
                     displayProfile.skills.map((skill: string, index: number) => (
                       <View key={index} style={styles.badge}>
                         <Text style={styles.badgeText}>{skill}</Text>
                       </View>
                     ))
                    ) : <Text style={styles.value}>Not set</Text>}
                 </View>
               </View>
               <View style={styles.detailItem}>
                 <Text style={styles.label}>Portfolio URL</Text>
                 <Text style={styles.value}>{displayProfile.portfolio_url || 'Not set'}</Text>
               </View>
               <View style={styles.detailItem}>
                 <Text style={styles.label}>GitHub URL</Text>
                 <Text style={styles.value}>{displayProfile.github_url || 'Not set'}</Text>
               </View>
               <View style={styles.detailItem}>
                 <Text style={styles.label}>Location</Text>
                 <Text style={styles.value}>{displayProfile.location || 'Not set'}</Text>
               </View>
               <View style={styles.detailItem}>
                 <Text style={styles.label}>Years of Experience</Text>
                 <Text style={styles.value}>{displayProfile.years_of_experience || 'Not set'}</Text>
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
