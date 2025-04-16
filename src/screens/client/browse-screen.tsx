import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors as themeColors } from '../../theme';

// Define Developer type if not already defined elsewhere
interface Developer {
  id: string;
  name: string;
  bio?: string;
  skills?: string[];
  rating?: number;
  avatar?: string;
  timezone?: string;
}

function ClientBrowseScreen({ navigation }: { navigation: any }) {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [filteredDevelopers, setFilteredDevelopers] = useState<Developer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Popular skills for filtering
  const popularSkills = [
    'React Native',
    'TypeScript',
    'Node.js',
    'Flutter',
    'iOS',
    'Android',
    'UI/UX',
    'Firebase',
  ];

  // Mock data for developers
  const mockDevelopers: Developer[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      bio: 'Senior React Native developer with 5+ years of experience building cross-platform mobile apps.',
      skills: ['React Native', 'TypeScript', 'Node.js', 'Redux'],
      rating: 4.9,
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      timezone: 'UTC-5',
    },
    {
      id: '2',
      name: 'Michael Chen',
      bio: 'Full-stack developer specializing in Flutter and Firebase. Love building beautiful, responsive UIs.',
      skills: ['Flutter', 'Firebase', 'UI/UX', 'Dart'],
      rating: 4.8,
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      timezone: 'UTC+8',
    },
    {
      id: '3',
      name: 'Alex Rodriguez',
      bio: 'iOS developer with expertise in Swift and SwiftUI. Former Apple engineer.',
      skills: ['iOS', 'Swift', 'SwiftUI', 'Objective-C'],
      rating: 4.7,
      avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
      timezone: 'UTC-8',
    },
    {
      id: '4',
      name: 'Emily Wong',
      bio: 'Android specialist with a passion for clean architecture and Kotlin.',
      skills: ['Android', 'Kotlin', 'Java', 'Jetpack Compose'],
      rating: 4.6,
      avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
      timezone: 'UTC+1',
    },
    {
      id: '5',
      name: 'David Smith',
      bio: 'Full-stack JavaScript developer. Expert in React Native, React, and Node.js.',
      skills: ['JavaScript', 'React', 'React Native', 'Node.js'],
      rating: 4.5,
      avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
      timezone: 'UTC',
    },
  ];

  useEffect(() => {
    // Load mock data instead of fetching from API
    setDevelopers(mockDevelopers);
    setFilteredDevelopers(mockDevelopers);
    setLoading(false);
  }, []);

  useEffect(() => {
    filterDevelopers();
  }, [searchQuery, selectedSkills, developers]);

  const filterDevelopers = () => {
    let filtered = [...developers];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (dev) =>
          dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dev.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dev.skills?.some((skill) =>
            skill.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Filter by selected skills
    if (selectedSkills.length > 0) {
      filtered = filtered.filter((dev) =>
        selectedSkills.some((skill) => dev.skills?.includes(skill))
      );
    }

    setFilteredDevelopers(filtered);
  };

  const toggleSkillFilter = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const renderDeveloperItem = ({ item }: { item: Developer }) => (
    <TouchableOpacity
      style={styles.developerCard}
      onPress={() => navigation.navigate('DeveloperProfile', { developerId: item.id })}
    >
      <View style={styles.developerHeader}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>
              {item.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.developerInfo}>
          <Text style={styles.developerName}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={themeColors.light.star} />
            <Text style={styles.ratingText}>{item.rating || '4.5'}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.bio} numberOfLines={2}>
        {item.bio || 'No bio provided'}
      </Text>

      <View style={styles.skillsContainer}>
        {item.skills?.slice(0, 3).map((skill, index) => (
          <View key={index} style={styles.skillBadge}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
        {(item.skills?.length || 0) > 3 && (
          <View style={styles.skillBadge}>
            <Text style={styles.skillText}>+{(item.skills?.length || 0) - 3}</Text>
          </View>
        )}
      </View>

      <View style={styles.bookButton}>
        <Text style={styles.bookButtonText}>View Profile</Text>
      </View>
    </TouchableOpacity>
  );

  const colors = themeColors.light;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 20,
    },
    header: {
      paddingTop: 30,
      paddingBottom: 20,
      alignItems: 'center',
    },
    title: {
      fontSize: 30,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 15,
      paddingVertical: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 3,
    },
    searchIcon: {
      marginRight: 12,
      color: colors.placeholder,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    filtersContainer: {
      marginBottom: 20,
    },
    filtersTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    filterButton: {
      paddingVertical: 9,
      paddingHorizontal: 16,
      borderRadius: 20,
      marginRight: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    filterButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      borderWidth: 1.5,
    },
    filterButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    filterButtonTextSelected: {
      color: colors.card,
      fontWeight: '600',
    },
    developerCard: {
      backgroundColor: colors.card,
      borderRadius: 15,
      padding: 18,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.07,
      shadowRadius: 6,
      elevation: 4,
    },
    developerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatar: {
      width: 55,
      height: 55,
      borderRadius: 27.5,
      marginRight: 15,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    avatarPlaceholder: {
      width: 55,
      height: 55,
      borderRadius: 27.5,
      marginRight: 15,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    avatarPlaceholderText: {
      color: colors.textSecondary,
      fontWeight: 'bold',
      fontSize: 18,
    },
    developerInfo: {
      flex: 1,
    },
    developerName: {
      fontSize: 19,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    ratingText: {
      marginLeft: 6,
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    bio: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 15,
      lineHeight: 21,
    },
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 15,
    },
    skillBadge: {
      backgroundColor: colors.secondary,
      borderRadius: 15,
      paddingVertical: 6,
      paddingHorizontal: 12,
      marginRight: 8,
      marginBottom: 8,
    },
    skillText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '500',
    },
    bookButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 3,
    },
    bookButtonText: {
      color: colors.card,
      fontSize: 16,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    errorText: {
      color: colors.accent,
      textAlign: 'center',
      marginTop: 20,
      fontSize: 15,
    },
    emptyListContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 50,
      paddingHorizontal: 30,
    },
    emptyListText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 10,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Developers</Text>
        <Text style={styles.subtitle}>Browse and book skilled developers</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.placeholder} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, skills, or keywords"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Popular Skills</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={popularSkills}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedSkills.includes(item) && styles.filterButtonSelected,
              ]}
              onPress={() => toggleSkillFilter(item)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedSkills.includes(item) && styles.filterButtonTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filtersContainer}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading developers...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDevelopers}
          renderItem={renderDeveloperItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={() => (
            <View style={styles.emptyListContainer}>
              <Ionicons name="sad-outline" size={50} color={colors.textSecondary} />
              <Text style={styles.emptyListText}>No developers found</Text>
              <Text style={styles.emptyListText}>Try adjusting your search or filters.</Text>
            </View>
          )}
          contentContainerStyle={filteredDevelopers.length === 0 ? styles.emptyListContainer : { paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

export default ClientBrowseScreen;
