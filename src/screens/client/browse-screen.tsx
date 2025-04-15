import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// import { supabase } from '../../lib/supabase';

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
            <Ionicons name="star" size={16} color="#FFD700" />
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Developers</Text>
        <Text style={styles.subtitle}>Browse and book skilled developers</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
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
                styles.filterBadge,
                selectedSkills.includes(item) && styles.filterBadgeSelected,
              ]}
              onPress={() => toggleSkillFilter(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedSkills.includes(item) && styles.filterTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading developers...</Text>
        </View>
      ) : filteredDevelopers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No developers found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDevelopers}
          keyExtractor={(item) => item.id}
          renderItem={renderDeveloperItem}
          contentContainerStyle={styles.developersList}
        />
      )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  filtersList: {
    paddingRight: 20,
  },
  filterBadge: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 8,
  },
  filterBadgeSelected: {
    backgroundColor: '#4A80F0',
  },
  filterText: {
    color: '#666',
    fontWeight: '500',
  },
  filterTextSelected: {
    color: 'white',
  },
  developersList: {
    padding: 20,
    paddingTop: 0,
  },
  developerCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  developerHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A80F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  developerInfo: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  developerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  ratingText: {
    marginLeft: 5,
    fontWeight: '600',
    color: '#666',
  },
  bio: {
    color: '#666',
    marginBottom: 10,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  skillBadge: {
    backgroundColor: '#e6f0ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    color: '#4A80F0',
    fontSize: 12,
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#4A80F0',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
});

export default ClientBrowseScreen;
