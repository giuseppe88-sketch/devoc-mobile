import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth-store';

function ClientDashboardScreen({ navigation }: { navigation: any }) {
  const { user } = useAuthStore();
  const name = user?.user_metadata?.name || 'Client';

  // Mock data for developers
  const featuredDevelopers = [
    {
      id: '1',
      name: 'Sarah Johnson',
      skills: ['React Native', 'TypeScript', 'Node.js'],
      rating: 4.9,
      image: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    {
      id: '2',
      name: 'Michael Chen',
      skills: ['Flutter', 'Firebase', 'UI/UX'],
      rating: 4.8,
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    {
      id: '3',
      name: 'Alex Rodriguez',
      skills: ['iOS', 'Swift', 'SwiftUI'],
      rating: 4.7,
      image: 'https://randomuser.me/api/portraits/men/67.jpg',
    },
  ];

  // Mock data for upcoming bookings
  const upcomingBookings = [
    {
      id: '1',
      developerName: 'Sarah Johnson',
      date: 'April 15, 2025',
      time: '10:00 AM - 11:00 AM',
      status: 'confirmed',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {name}!</Text>
          <Text style={styles.subGreeting}>Find and book top developers</Text>
        </View>

        <View style={styles.searchContainer}>
          <TouchableOpacity 
            style={styles.searchBar}
            onPress={() => navigation.navigate('Browse')}
          >
            <Ionicons name="search" size={20} color="#999" />
            <Text style={styles.searchText}>Search for developers...</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Developers</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Browse')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featuredDevelopers.map((developer) => (
              <TouchableOpacity
                key={developer.id}
                style={styles.developerCard}
                onPress={() => {
                  // Navigate to developer profile
                }}
              >
                <Image
                  source={{ uri: developer.image }}
                  style={styles.developerImage}
                />
                <Text style={styles.developerName}>{developer.name}</Text>
                <View style={styles.skillsContainer}>
                  {developer.skills.slice(0, 2).map((skill, index) => (
                    <View key={index} style={styles.skillBadge}>
                      <Text style={styles.skillText}>{skill}</Text>
                    </View>
                  ))}
                  {developer.skills.length > 2 && (
                    <View style={styles.skillBadge}>
                      <Text style={styles.skillText}>+{developer.skills.length - 2}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingText}>{developer.rating}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Bookings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => {
                  // Navigate to booking details
                }}
              >
                <View style={styles.bookingHeader}>
                  <Text style={styles.developerNameBooking}>{booking.developerName}</Text>
                  <View style={styles.confirmedBadge}>
                    <Text style={styles.confirmedText}>Confirmed</Text>
                  </View>
                </View>
                <View style={styles.bookingDetails}>
                  <View style={styles.bookingDetail}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.bookingDetailText}>{booking.date}</Text>
                  </View>
                  <View style={styles.bookingDetail}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.bookingDetailText}>{booking.time}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No upcoming bookings</Text>
              <TouchableOpacity 
                style={styles.findDevelopersButton}
                onPress={() => navigation.navigate('Browse')}
              >
                <Text style={styles.findDevelopersText}>Find Developers</Text>
              </TouchableOpacity>
            </View>
          )}
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
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subGreeting: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  searchContainer: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 12,
  },
  searchText: {
    marginLeft: 10,
    color: '#999',
    fontSize: 16,
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAll: {
    color: '#4A80F0',
    fontSize: 14,
  },
  developerCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    width: 160,
  },
  developerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
  },
  developerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  skillBadge: {
    backgroundColor: '#e6f0ff',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 5,
    marginBottom: 5,
  },
  skillText: {
    color: '#4A80F0',
    fontSize: 10,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 5,
    fontWeight: '600',
    color: '#666',
  },
  bookingCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  developerNameBooking: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmedBadge: {
    backgroundColor: '#e6f7ee',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  confirmedText: {
    color: '#34c759',
    fontSize: 12,
    fontWeight: '500',
  },
  bookingDetails: {
    marginTop: 5,
  },
  bookingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  bookingDetailText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#999',
    fontSize: 16,
    marginBottom: 15,
  },
  findDevelopersButton: {
    backgroundColor: '#4A80F0',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  findDevelopersText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default ClientDashboardScreen;
