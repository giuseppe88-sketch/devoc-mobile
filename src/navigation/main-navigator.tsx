import React, { useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../stores/auth-store";
import { supabase } from "../lib/supabase";
import { Alert, View, ActivityIndicator } from "react-native";

// Developer Screens
import DeveloperDashboardScreen from "../screens/developer/dashboard-screen";
import DeveloperProfileScreen from "../screens/developer/profile-screen";
import EditDeveloperProfileScreen from "../screens/developer/edit-profile-screen";
import DeveloperAvailabilityScreen from "../screens/developer/availability-screen";
import AccountScreen from "../screens/account/account-screen"; // Import AccountScreen
import TermsScreen from "../screens/account/terms-screen"; // Import TermsScreen
import DeveloperBookingsScreen from "../screens/developer/developer-bookings-screen";
import DeveloperBookingDetailsScreen from "../screens/developer/developer-booking-details-screen";

// Client Screens
import ClientDashboardScreen from "../screens/client/dashboard-screen";
import BookingDetailsScreen from "../screens/client/booking-details-screen"; // <-- Import BookingDetailsScreen
import ClientBrowseScreen from "../screens/client/browse-screen";
import ClientBookingsScreen from "../screens/client/client-bookings-screen";
import { ClientProfileScreen } from "../screens/client/profile-screen";
import EditClientProfileScreen from "../screens/client/edit-profile-screen";
import { DeveloperDetailScreen } from "../screens/client/developer-detail-screen";
import BookingScreen from "../screens/client/booking-screen"; // <-- Import BookingScreen

import {
  ProfileStackParamList,
  ClientProfileStackParamList,
  BrowseStackParamList, // Import BrowseStackParamList
  AllMainTabsParamList, // Import AllMainTabsParamList
  DeveloperBookingsStackParamList, // Import Developer Bookings Stack Param List
  AccountStackParamList, // Import the new AccountStackParamList
} from "../types"; // Import shared types

// Define ParamList for the new Client Dashboard Stack
export type ClientDashboardStackParamList = {
  ClientDashboardHome: undefined;
  BookingDetails: { bookingId: string }; // BookingDetails remains, ClientBookings moved to a main tab
};
import { colors as themeColors, spacing } from "../theme";

// Use light theme for navigation elements
const colors = themeColors.light;

const Tab = createBottomTabNavigator<AllMainTabsParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>(); // Create Profile Stack
const ClientProfileStack =
  createNativeStackNavigator<ClientProfileStackParamList>(); // Create Client Profile Stack

// BrowseStackParamList is now imported from ../types
const BrowseStack = createNativeStackNavigator<BrowseStackParamList>(); // Create Browse Stack
const DeveloperBookingsStack =
  createNativeStackNavigator<DeveloperBookingsStackParamList>(); // Create Developer Bookings Stack
const ClientDashboardStack =
  createNativeStackNavigator<ClientDashboardStackParamList>(); // Create Client Dashboard Stack
const AccountStack = createNativeStackNavigator<AccountStackParamList>(); // Create Account Stack

// Profile Stack Navigator Component
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text, // Set header text/icon color
        headerTitleStyle: {
          fontWeight: "bold",
        },
        // We might want to hide the back button text for cleaner look
        headerBackTitleVisible: false,
      }}
    >
      <ProfileStack.Screen
        name="DeveloperProfile"
        component={DeveloperProfileScreen}
        options={{
          title: "Profile",
        }}
      />
      <ProfileStack.Screen
        name="EditDeveloperProfile"
        component={EditDeveloperProfileScreen}
        options={{
          headerTitle: () => (
            <Ionicons name="create-outline" size={26} color={colors.text} />
          ),
        }}
      />
      <ProfileStack.Screen
        name="AccountScreen"
        component={AccountScreen}
        options={{
          headerTitle: () => (
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          ),
        }}
      />
    </ProfileStack.Navigator>
  );
}

function ClientProfileStackNavigator() {
  const colors = themeColors.light; // Use light theme for this stack's headers
  return (
    <ClientProfileStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card, // Change to card background color
        },
        headerTintColor: colors.text, // Set header text/icon color
        headerTitleStyle: {
          fontWeight: "bold",
        },
        // We might want to hide the back button text for cleaner look
        headerBackTitleVisible: false,
      }}
    >
      <ClientProfileStack.Screen
        name="ClientProfile"
        component={ClientProfileScreen}
        options={{
          title: "Profile", // Set header title to 'Profile'
        }}
      />
      <ClientProfileStack.Screen
        name="EditClientProfile"
        component={EditClientProfileScreen}
        options={{
          // Replace title text with an icon
          headerTitle: () => (
            <Ionicons name="create-outline" size={26} color={colors.text} />
          ),
        }}
      />
    </ClientProfileStack.Navigator>
  );
}

// Client Dashboard Stack Navigator Component
// Developer Bookings Stack Navigator Component
function DeveloperBookingsStackNavigator() {
  return (
    <DeveloperBookingsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text, // Use existing 'colors' object
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerBackTitleVisible: false,
      }}
    >
      <DeveloperBookingsStack.Screen
        name="DeveloperBookingsList"
        component={DeveloperBookingsScreen}
        options={{ title: "My Bookings" }}
      />
      <DeveloperBookingsStack.Screen
        name="DeveloperBookingDetails"
        component={DeveloperBookingDetailsScreen}
        options={{ title: "Booking Details" }}
      />
    </DeveloperBookingsStack.Navigator>
  );
}

// Client Dashboard Stack Navigator Component
function ClientDashboardStackNavigator() {
  const colors = themeColors.light; // Use light theme for this stack's headers
  // Use the main 'colors' object which is already defined (themeColors.dark)
  return (
    <ClientDashboardStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card, // Use existing 'colors' object
        },
        headerTintColor: colors.text, // Use existing 'colors' object
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerBackTitleVisible: false,
      }}
    >
      <ClientDashboardStack.Screen
        name="ClientDashboardHome"
        component={ClientDashboardScreen}
        options={{ headerShown: false }} // No header for the root dashboard screen in this stack
      />
      {/* ClientBookingsScreen is now a main tab, removed from this stack */}
      <ClientDashboardStack.Screen
        name="BookingDetails"
        component={BookingDetailsScreen}
        options={{ title: "Booking Details", headerShown: true }}
      />
    </ClientDashboardStack.Navigator>
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
          fontWeight: "bold",
        },
        headerBackTitleVisible: false,
      }}
    >
      <BrowseStack.Screen
        name="ClientBrowse"
        component={ClientBrowseScreen}
        options={{ title: "Browse Developers" }} // Set title for the browse screen
      />
      <BrowseStack.Screen
        name="DeveloperDetail"
        component={DeveloperDetailScreen}
        options={({ route }) => ({ title: "Developer Profile" })} // Example: Use params for dynamic title later if needed
      />
      <BrowseStack.Screen
        name="BookingScreen"
        component={BookingScreen}
        options={{ title: "Book First Call" }}
      />
    </BrowseStack.Navigator>
  );
}

// New Account Stack Navigator
function AccountStackNavigator() {
  return (
    <AccountStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerBackTitleVisible: false,
      }}
    >
      <AccountStack.Screen
        name="AccountRoot"
        component={AccountScreen}
        options={{ title: "Account Settings" }}
      />
      <AccountStack.Screen
        name="Terms"
        component={TermsScreen}
        options={{ title: "Terms & Conditions" }}
      />
    </AccountStack.Navigator>
  );
}

function MainNavigator() {
  const { user, signOut, userRole, loadingProfile } = useAuthStore();
  const isDeveloper = userRole === "developer";

  useEffect(() => {
    const validateSession = async () => {
      console.log("MainNavigator mounted, validating session...");
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.log(
          "Session validation failed in MainNavigator. Signing out.",
          error?.message
        );
        // Alert.alert("Session Expired", "Your session is no longer valid. Please log in again.");
        await signOut();
        // No need to explicitly navigate, App.tsx will react to session becoming null
      } else {
        console.log("Session validated successfully in MainNavigator.Account");
      }
    };

    validateSession();
    // Dependency on signOut ensures it's available and stable if wrapped in useCallback in store
    // If signOut causes re-renders, consider using useAuthStore.getState().signOut()
  }, [signOut]);

  // Prevent rendering tabs if user info is missing (during sign out transition)
  if (!user || loadingProfile) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#333333",
        }}
      >
        <ActivityIndicator size={50} color="#0000ff" />
      </View>
    );
  }

  const colors = themeColors.light; // Keep using light for the main tab bar for consistency

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: "bold",
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "alert-circle-outline"; // Default icon

          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Browse") {
            iconName = focused ? "search" : "search-outline";
          } else if (route.name === "ClientBookingsTab") {
            iconName = focused ? "list" : "list-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person-circle" : "person-circle-outline";
          } else if (route.name === "Account") {
            // For Developer
            iconName = focused ? "settings" : "settings-outline";
          } else if (route.name === "Availability") {
            // For Developer
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "DeveloperBookingsTab") {
            // For Developer Bookings
            iconName = focused ? "list-circle" : "list-circle-outline"; // Example icon, choose as needed
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {isDeveloper ? (
        // Developer Tabs
        <>
          <Tab.Screen name="Dashboard" component={DeveloperDashboardScreen} />
          <Tab.Screen
            name="Availability"
            component={DeveloperAvailabilityScreen}
          />
          <Tab.Screen
            name="DeveloperBookingsTab"
            component={DeveloperBookingsStackNavigator}
            options={{
              tabBarLabel: "My Bookings",
              headerShown: false, // Stack navigator handles its own headers
            }}
          />
          {/* <Tab.Screen name="Bookings" component={DeveloperBookingsScreen} /> */}
          <Tab.Screen
            name="Profile"
            component={ProfileStackNavigator}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        // Client Tabs
        <>
          <Tab.Screen
            name="Dashboard" // Key in AllMainTabsParamList
            component={ClientDashboardStackNavigator} // Use the StackNavigator
            options={{
              tabBarLabel: "Home",
              headerShown: false, // Stack navigator handles its own headers
            }}
          />
          <Tab.Screen
            name="ClientBookingsTab" // Key in AllMainTabsParamList
            component={ClientBookingsScreen}
            options={{
              tabBarLabel: "My Bookings",
              headerShown: true,
              title: "My Bookings",
              // Styles below match the Tab.Navigator defaults for consistency
              // The 'colors' variable here correctly refers to themeColors.light from the MainNavigator scope
              headerStyle: { backgroundColor: colors.card },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: "bold" },
            }}
          />
          <Tab.Screen
            name="Browse" // Key in AllMainTabsParamList
            component={BrowseStackNavigator}
            options={{
              tabBarLabel: "Browse",
              headerShown: false, // Stack navigator handles its own headers
            }}
          />
          <Tab.Screen
            name="Profile" // Key in AllMainTabsParamList
            component={ClientProfileStackNavigator}
            options={{
              tabBarLabel: "Profile",
              headerShown: false, // Stack navigator handles its own headers
            }}
          />
        </>
      )}
      {/* Universal Account Tab */}
      <Tab.Screen
        name="Account"
        component={AccountStackNavigator} // Use the new stack navigator
        options={{
          headerShown: false, // Stack navigator handles its own header
        }}
      />
    </Tab.Navigator>
  );
}

export default MainNavigator;
