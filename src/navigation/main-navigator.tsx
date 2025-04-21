import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/auth-store';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';

// Developer Screens
import DeveloperDashboardScreen from '../screens/developer/dashboard-screen';
import DeveloperProfileScreen from '../screens/developer/profile-screen';
import EditDeveloperProfileScreen from '../screens/developer/edit-profile-screen';
import DeveloperAvailabilityScreen from '../screens/developer/availability-screen';
// import DeveloperBookingsScreen from '../screens/developer/bookings-screen';

// Client Screens
import ClientDashboardScreen from '../screens/client/dashboard-screen';
import ClientBrowseScreen from '../screens/client/browse-screen';
// import ClientBookingsScreen from '../screens/client/bookings-screen';

import { ProfileStackParamList } from "../types"; // Import shared types

const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>(); // Create Profile Stack

// Profile Stack Navigator Component
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: true }}>
      <ProfileStack.Screen 
        name="DeveloperProfile" 
        component={DeveloperProfileScreen} 
        options={{ title: 'Profile' }} // Set screen title
      />
      <ProfileStack.Screen 
        name="EditDeveloperProfile" 
        component={EditDeveloperProfileScreen} 
        options={{ title: 'Edit Profile' }} // Set screen title
      />
    </ProfileStack.Navigator>
  );
}

function MainNavigator() {
  const { user, signOut, userRole } = useAuthStore();
  const isDeveloper = userRole === 'developer';

  console.log("Role from store:", userRole, "Is Developer:", isDeveloper)
  console.log("Developer", isDeveloper)
  useEffect(() => {
    const validateSession = async () => {
      console.log('MainNavigator mounted, validating session...');
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        console.log('Session validation failed in MainNavigator. Signing out.', error?.message);
        // Alert.alert("Session Expired", "Your session is no longer valid. Please log in again.");
        await signOut();
        // No need to explicitly navigate, App.tsx will react to session becoming null
      } else {
        console.log('Session validated successfully in MainNavigator.');
      }
    };

    validateSession();
    // Dependency on signOut ensures it's available and stable if wrapped in useCallback in store
    // If signOut causes re-renders, consider using useAuthStore.getState().signOut()
  }, [signOut]);

  // Prevent rendering tabs if user info is missing (during sign out transition)
  if (!user) {
    return null; // Or a loading indicator
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Availability') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Bookings') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Browse') {
            iconName = focused ? 'search' : 'search-outline';
          }

          // Restore original size prop
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
        headerShown: false, // Hide header for main tab screens (Profile stack will show its own)
      })}
    >
      {isDeveloper ? (
        // Developer Tabs
        <>
          <Tab.Screen name="Dashboard" component={DeveloperDashboardScreen} />
          <Tab.Screen name="Profile" component={ProfileStackNavigator} />
          <Tab.Screen name="Availability" component={DeveloperAvailabilityScreen} />
          {/* <Tab.Screen name="Bookings" component={DeveloperBookingsScreen} /> */}
        </>
      ) : (
        // Client Tabs
        <>
          <Tab.Screen name="Dashboard" component={ClientDashboardScreen} />
          <Tab.Screen name="Browse" component={ClientBrowseScreen} />
          {/* <Tab.Screen name="Bookings" component={ClientBookingsScreen} /> */}
        </>
      )}
    </Tab.Navigator>
  );
}

export default MainNavigator;
