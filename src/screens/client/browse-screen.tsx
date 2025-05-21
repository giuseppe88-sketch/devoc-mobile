import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
  TouchableOpacity, // Import TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors as themeColors, spacing } from "@/theme";
import { useBrowseDevelopers, DeveloperProfile } from "@/hooks/useBrowseDevelopers";
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // Import stack navigation type
import { BrowseStackParamList } from '@/navigation/main-navigator'; // Import param list type

type Developer = DeveloperProfile;
const colors = themeColors.light; // Revert back to light theme for client screen

// Define the type for the navigation prop within this screen's context
type BrowseScreenNavigationProp = NativeStackNavigationProp<
  BrowseStackParamList, // Use the correct stack param list
  'ClientBrowse' // The name of this screen in the stack
>;

export function ClientBrowseScreen() { // Removed { navigation } prop
  const { data: developers, isLoading, error } = useBrowseDevelopers();
  const navigation = useNavigation<BrowseScreenNavigationProp>(); // Get navigation object

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]);

  const popularFocusAreas = [
    "Frontend",
    "Backend",
    "UI/UX Design",
    "Cross-Platform",
    "Native iOS",
    "Native Android",
    "Performance",
    "Testing",
  ];

  // Filter developers based on search query and selected focus areas
  const filteredDevelopers = useMemo(() => {
    // Use default empty array to prevent iterator error on undefined
    return (developers ?? []).filter((developer) => {
      const nameMatch = developer.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const skillsMatch = developer.skills?.some((skill) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const focusAreasMatch = developer.focus_areas?.some((area) =>
        area.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (searchQuery) {
        return nameMatch || skillsMatch || focusAreasMatch;
      }

      return true;
    }).filter((developer) => {
      if (selectedFocusAreas.length > 0) {
        return selectedFocusAreas.some((area) =>
          developer.focus_areas?.includes(area)
        );
      }

      return true;
    });
  }, [developers, searchQuery, selectedFocusAreas]);

  const allFocusAreas = useMemo(() => {
    const areas = new Set<string>();
    // Use default empty array here too
    (developers ?? []).forEach((dev) => {
      dev.focus_areas?.forEach((area) => areas.add(area));
    });
    return Array.from(areas).sort();
  }, [developers]);

  const allSkills = useMemo(() => {
    const skills = new Set<string>();
    // Use default empty array
    (developers ?? []).forEach(dev => {
      dev.skills?.forEach(skill => skills.add(skill));
    });
    return Array.from(skills).sort();
  }, [developers]);

  const toggleFocusAreaFilter = (area: string) => {
    if (selectedFocusAreas.includes(area)) {
      setSelectedFocusAreas(selectedFocusAreas.filter((a) => a !== area));
    } else {
      setSelectedFocusAreas([...selectedFocusAreas, area]);
    }
  };

  const renderDeveloperItem = ({ item }: { item: Developer }) => {
    if (!item) return null;

    // Function to handle navigation
    const handlePress = () => {
      navigation.navigate('DeveloperDetail', { developerId: item.id });
    };

    return (
      <TouchableOpacity onPress={handlePress} style={styles.developerCard}>
        <View style={styles.developerHeader}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {item.name.substring(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.developerInfo}>
            <View style={styles.nameRatingContainer}>
              <Text style={styles.developerName}>{item.name}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color={colors.primary} />
                <Text style={styles.ratingText}>{4}</Text>
              </View>
            </View>
            {item.location && (
              <Text style={styles.developerDetailText}> {item.location}</Text>
            )}
            {item.years_of_experience !== null && (
              <Text style={styles.developerDetailText}>
                {item.years_of_experience}{" "}
                {item.years_of_experience === 1 ? "year" : "years"} experience
              </Text>
            )}
          </View>
        </View>

        {/* Show Focus Areas using the skill badge style */}
        {item.focus_areas && item.focus_areas.length > 0 && (
          <View style={styles.skillsContainer}>
            <View style={styles.badgesContainer}>
              {/* Add explicit type for area */}
              {item.focus_areas.slice(0, 3).map((area: string, index: number) => (
                <View key={index} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{area}</Text>
                </View>
              ))}
              {item.focus_areas.length > 3 && (
                <View style={styles.skillBadgeMore}>
                  <Text style={styles.skillTextMore}>
                    +{item.focus_areas.length - 3}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size={50} color={colors.primary} />
        <Text style={styles.loadingText}>Loading Developers...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={60}
            color={colors.error}
          />
          <Text style={styles.errorText}>Could not load developers.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Developers</Text>
        <Text style={styles.subtitle}>
          Browse and connect with talented mobile developers
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={colors.placeholder}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, skill, or keyword..."
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Filter by Focus Areas</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={allFocusAreas}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.skillButton,
                selectedFocusAreas.includes(item) && styles.skillButtonSelected,
              ]}
              onPress={() => toggleFocusAreaFilter(item)}
            >
              <Text
                style={[
                  styles.skillButtonText,
                  selectedFocusAreas.includes(item) &&
                    styles.skillButtonTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.skillsScrollView}
        />
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={filteredDevelopers}
          renderItem={renderDeveloperItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyListContainer}>
              <Text style={styles.emptyListText}>
                No developers found matching your criteria.
              </Text>
            </View>
          )}
          contentContainerStyle={styles.listContentContainer}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  developerCard: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  developerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: spacing.md,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.subtle,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  avatarPlaceholderText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "bold",
  },
  developerInfo: {
    flex: 1,
  },
  nameRatingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  developerName: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.subtle,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    marginLeft: spacing.xs,
    fontSize: 13,
    fontWeight: "bold",
    color: colors.primary,
  },
  developerDetailText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  skillsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  focusAreasTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillBadge: {
    backgroundColor: colors.subtle,
    borderRadius: 6,
    paddingHorizontal: spacing.xsmall,
    paddingVertical: spacing.xxsmall,
    marginRight: spacing.xsmall,
    marginBottom: spacing.xsmall,
  },
  skillText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  skillBadgeMore: {
    backgroundColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: spacing.xsmall,
    paddingVertical: spacing.xxsmall,
    marginRight: spacing.xsmall,
    marginBottom: spacing.xsmall,
  },
  skillTextMore: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: 18,
    fontWeight: "600",
    color: colors.error,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.subtle,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    height: 58,
  },
  searchIcon: {
    marginHorizontal: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: spacing.sm,
    marginLeft: spacing.sm,
  },
  filterContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  skillsScrollView: {
    marginHorizontal: -spacing.xs,
  },
  skillButton: {
    backgroundColor: colors.subtle,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  skillButtonSelected: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.xs,
  },
  skillButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  skillButtonTextSelected: {
    color: colors.card,
    fontSize: 14,
    fontWeight: "600",
  },
  listContainer: {
    flex: 1,
  },
  listContentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyListText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
});

export default ClientBrowseScreen;
