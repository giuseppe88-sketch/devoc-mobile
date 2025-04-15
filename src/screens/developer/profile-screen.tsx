import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
// import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth-store';
import { Developer } from '../../types';

function DeveloperProfileScreen() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<Partial<Developer>>({
    name: user?.user_metadata?.name || '',
    bio: '',
    skills: [],
    timezone: 'UTC',
  });
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // fetchProfile();
    }
  }, [user]);

  // const fetchProfile = async () => {
  //   try {
  //     const { data, error } = await supabase
  //       .from('developers')
  //       .select('*')
  //       .eq('userId', user?.id)
  //       .single();

  //     if (error) throw error;

  //     if (data) {
  //       setProfile(data);
  //       if (data.avatar) {
  //         setAvatarUrl(data.avatar);
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error fetching profile:', error);
  //   }
  // };

  // const saveProfile = async () => {
  //   if (!user) return;

  //   setLoading(true);
  //   try {
  //     const { error } = await supabase
  //       .from('developers')
  //       .upsert({
  //         userId: user.id,
  //         name: profile.name,
  //         bio: profile.bio,
  //         skills: profile.skills,
  //         timezone: profile.timezone,
  //         avatar: avatarUrl,
  //         updatedAt: new Date().toISOString(),
  //       });

  //     if (error) throw error;
  //   } catch (error) {
  //     console.error('Error saving profile:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills?.includes(newSkill.trim())) {
      setProfile({
        ...profile,
        skills: [...(profile.skills || []), newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setProfile({
      ...profile,
      skills: profile.skills?.filter(skill => skill !== skillToRemove) || [],
    });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      // Here you would upload the image to Supabase Storage
      // and get back a URL to store in the profile
      setAvatarUrl(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Your Profile</Text>
          <Text style={styles.subtitle}>Showcase your skills and experience</Text>
        </View>

        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={pickImage}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#999" />
              </View>
            )}
            <View style={styles.editIconContainer}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={profile.name}
              onChangeText={(text) => setProfile({ ...profile, name: text })}
              placeholder="Your full name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={profile.bio}
              onChangeText={(text) => setProfile({ ...profile, bio: text })}
              placeholder="Tell clients about yourself, your experience, and expertise"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Skills</Text>
            <View style={styles.skillsInputContainer}>
              <TextInput
                style={styles.skillInput}
                value={newSkill}
                onChangeText={setNewSkill}
                placeholder="Add a skill"
              />
              <TouchableOpacity style={styles.addButton} onPress={addSkill}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.skillsContainer}>
              {profile.skills?.map((skill, index) => (
                <View key={index} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{skill}</Text>
                  <TouchableOpacity onPress={() => removeSkill(skill)}>
                    <Ionicons name="close-circle" size={16} color="#4A80F0" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Timezone</Text>
            <TextInput
              style={styles.input}
              value={profile.timezone}
              onChangeText={(text) => setProfile({ ...profile, timezone: text })}
              placeholder="Your timezone (e.g., UTC, EST, PST)"
            />
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            // onPress={saveProfile}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Profile'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#4A80F0',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  skillsInputContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  skillInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#4A80F0',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f0ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    color: '#4A80F0',
    marginRight: 5,
  },
  saveButton: {
    backgroundColor: '#4A80F0',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DeveloperProfileScreen;
