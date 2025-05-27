import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/auth-store';
import { supabase } from '../lib/supabase';
import { Alert, View, ActivityIndicator } from 'react-native';

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
import { ClientProfileScreen } from '../screens/client/profile-screen'; 
import EditClientProfileScreen from '../screens/client/edit-profile-screen'; 
import { DeveloperDetailScreen } from '../screens/client/developer-detail-screen'; 

import { 
  ProfileStackParamList, 
  ClientProfileStackParamList, 
  BrowseStackParamList, // Import BrowseStackParamList
  AllMainTabsParamList   // Import AllMainTabsParamList
} from "../types"; // Import shared types
import { colors as themeColors, spacing } from '../theme'; 

// Assuming dark theme for navigation elements
const colors = themeColors.dark;

const Tab = createBottomTabNavigator<AllMainTabsParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>(); // Create Profile Stack
const ClientProfileStack = createNativeStackNavigator<ClientProfileStackParamList>(); // Create Client Profile Stack

// BrowseStackParamList is now imported from ../types
const BrowseStack = createNativeStackNavigator<BrowseStackParamList>(); // Create Browse Stack

// Profile Stack Navigator Component
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator 
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card, // Change to card background color
        },
        headerTintColor: colors.text, // Set header text/icon color
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        // We might want to hide the back button text for cleaner look
        headerBackTitleVisible: false, 
      }}
    >
      <ProfileStack.Screen 
        name="DeveloperProfile" 
        component={DeveloperProfileScreen} 
        options={{ 
          // Replace title text with an icon
          headerTitle: () => <Ionicons name="person-circle-outline" size={28} color={colors.text} />, 
        }} 
      />
      <ProfileStack.Screen 
        name="EditDeveloperProfile" 
        component={EditDeveloperProfileScreen} 
        options={{ 
          // Replace title text with an icon
          headerTitle: () => <Ionicons name="create-outline" size={26} color={colors.text} />, 
        }} 
      />
    </ProfileStack.Navigator>
  );
}

function ClientProfileStackNavigator() {
  return (
    <ClientProfileStack.Navigator 
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card, // Change to card background color
        },
        headerTintColor: colors.text, // Set header text/icon color
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        // We might want to hide the back button text for cleaner look
        headerBackTitleVisible: false, 
      }}
    >
      <ClientProfileStack.Screen 
        name="ClientProfile" 
        component={ClientProfileScreen} 
        options={{ 
          // Replace title text with an icon
          headerTitle: () => <Ionicons name="person-circle-outline" size={28} color={colors.text} />, 
        }} 
      />
      <ClientProfileStack.Screen 
        name="EditClientProfile" 
        component={EditClientProfileScreen} 
        options={{ 
          // Replace title text with an icon
          headerTitle: () => <Ionicons name="create-outline" size={26} color={colors.text} />, 
        }} 
      />
    </ClientProfileStack.Navigator>
  );
}

function BrowseStackNavigator() {
  const colors = themeColors.light; // Use light theme for client stack
  return (
    <BrowseStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background, // Light background
        },
        headerTintColor: colors.text, // Light text color
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitleVisible: false,
      }}
    >
      <BrowseStack.Screen 
        name="ClientBrowse"
        component={ClientBrowseScreen}
        options={{ title: 'Browse Developers' }} // Set title for the browse screen
      />
      <BrowseStack.Screen 
        name="DeveloperDetail"
        component={DeveloperDetailScreen}
        options={({ route }) => ({ title: 'Developer Profile' })} // Example: Use params for dynamic title later if needed
      />
    </BrowseStack.Navigator>
  );
}

function MainNavigator() {
  const { user, signOut, userRole, loadingProfile } = useAuthStore();
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
  if (!user || loadingProfile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#333333' }}>
        <ActivityIndicator size={50} color="#0000ff" />
      </View>
    );
  }

  const colors = themeColors.light; // Keep using light for the main tab bar for consistency
  
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
          // } else if (route.name === 'Bookings') { // Bookings tab is not currently active
          //   iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Browse') {
            iconName = focused ? 'search' : 'search-outline';
          }

          // Restore original size prop
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.accent, // Color for active tab icon/label
        tabBarInactiveTintColor: colors.textSecondary, // Color for inactive tab icon/label
        tabBarStyle: {
          backgroundColor: colors.card, // Tab bar background color
          borderTopColor: colors.border, // Optional: Tab bar border color
          paddingBottom: spacing.xs, // Add some padding at the bottom
          height: 60, // Adjust height if needed
        },
        headerStyle: {
          backgroundColor: colors.card, // Header background color
        },
        headerTintColor: colors.text, // Header text/icon color
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      {isDeveloper ? (
        // Developer Tabs
        <>
          <Tab.Screen name="Dashboard" component={DeveloperDashboardScreen} />
          <Tab.Screen name="Availability" component={DeveloperAvailabilityScreen} />
          {/* <Tab.Screen name="Bookings" component={DeveloperBookingsScreen} /> */}
          <Tab.Screen name="Profile" component={ProfileStackNavigator} options={{ headerShown: false }}/>
        </>
      ) : (
        // Client Tabs
        <>
          <Tab.Screen name="Dashboard" component={ClientDashboardScreen} />
          <Tab.Screen 
            name="Browse" 
            component={BrowseStackNavigator} 
            options={{ headerShown: false }} // Hide Tab Navigator header, Stack header will show
          />
          {/* <Tab.Screen name="Bookings" component={ClientBookingsScreen} /> */}
          <Tab.Screen name="Profile" component={ClientProfileStackNavigator} options={{ headerShown: false }} />
        </>
      )}
    </Tab.Navigator>
  );
}

export default MainNavigator;
