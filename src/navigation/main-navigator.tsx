import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/auth-store';

// Developer Screens
import DeveloperDashboardScreen from '../screens/developer/dashboard-screen';
import DeveloperProfileScreen from '../screens/developer/profile-screen';
import DeveloperAvailabilityScreen from '../screens/developer/availability-screen';
// import DeveloperBookingsScreen from '../screens/developer/bookings-screen';

// Client Screens
import ClientDashboardScreen from '../screens/client/dashboard-screen';
import ClientBrowseScreen from '../screens/client/browse-screen';
// import ClientBookingsScreen from '../screens/client/bookings-screen';

const Tab = createBottomTabNavigator();

function MainNavigator() {
  const { user } = useAuthStore();
  const userRole = user?.user_metadata?.role || 'client';
  const isDeveloper = userRole === 'developer';

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
      })}
    >
      {isDeveloper ? (
        // Developer Tabs
        <>
          <Tab.Screen name="Dashboard" component={DeveloperDashboardScreen} />
          <Tab.Screen name="Profile" component={DeveloperProfileScreen} />
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
