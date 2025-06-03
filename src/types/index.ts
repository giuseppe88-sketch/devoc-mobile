import { Database } from './supabase';
import { NavigatorScreenParams } from '@react-navigation/native';

export interface User {
  id: string;
  email: string;
  user_metadata: {
    name: string;
    role: 'developer' | 'client';
  };
}

export type DeveloperProfile = Database['public']['Tables']['developer_profiles']['Row'];

// Represents the combined profile data fetched by the useDeveloperProfile hook
export interface FetchedDeveloperProfile extends DeveloperProfile {
  name?: string | null;       // Mapped from users.full_name
  avatar_url?: string | null; // From users.avatar_url
  bio?: string | null;        // From users.bio
  user_id: string;          // Explicitly added in the hook
}

export type UserDeveloperProfile = DeveloperProfile & User;

export interface Client {
  id: string;
  userId: string;
  name: string;
  company?: string;
  avatar?: string;
}

export interface Availability {
  id: string;
  developer_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  slot_start_time: string; // Format: "HH:MM" in 24-hour format
  slot_end_time: string; // Format: "HH:MM" in 24-hour format
  availability_type: 'first_call' | 'general_work_block';
  range_start_date?: string | null; // ISO date string, YYYY-MM-DD, for 'general_work_block'
  range_end_date?: string | null;   // ISO date string, YYYY-MM-DD, for 'general_work_block'
  is_active: boolean; // Indicates if the slot is available (true) or booked (false)
  created_at?: string; // Optional: Timestamp of when the slot was created
  updated_at?: string; // Optional: Timestamp of when the slot was last updated
}

export interface TimeSlot {
  id: string;
  date: string; // ISO date string
  startTime: string; // Format: "HH:MM" in 24-hour format
  endTime: string; // Format: "HH:MM" in 24-hour format
  isAvailable: boolean;
}

export interface Booking {
  id: string;
  developerId: string;
  clientId: string;
  date: string; // ISO date string
  startTime: string; // Format: "HH:MM" in 24-hour format
  endTime: string; // Format: "HH:MM" in 24-hour format
  notes?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  calendarEventId?: string; // Google Calendar event ID
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking_request' | 'booking_confirmation' | 'booking_reminder' | 'booking_cancelled';
  read: boolean;
  createdAt: string; // ISO date string
  relatedBookingId?: string;
}

export type EditDeveloperProfileRouteParams = {
  // Using Partial<DeveloperProfile> makes it more aligned with the actual profile
  // Add email separately if it's not part of the DB profile table
  profileData?: Partial<DeveloperProfile> & { email?: string }; 
};

// Define the parameters for each screen in the Profile stack
export type ProfileStackParamList = {
  DeveloperProfile: undefined; // No parameters expected for the main profile view
  EditDeveloperProfile: EditDeveloperProfileRouteParams; // Use the existing type for edit screen params
  AccountScreen: undefined; // Screen for account settings, e.g., logout
};

// --- Add Client Profile Types ---
export type ClientProfile = Database['public']['Tables']['client_profiles']['Row'];

// Parameters for the Edit Client Profile screen
export type EditClientProfileRouteParams = {
  profileData?: Partial<ClientProfile> & { email?: string };
  email?: string; // Include email if it needs to be passed/displayed separately
};

// Define the parameters for each screen in the Client Profile stack
export type ClientProfileStackParamList = {
  ClientProfile: undefined;
  EditClientProfile: EditClientProfileRouteParams;
};
// --- End Client Profile Types ---

// --- Add Fetched Client Profile Type ---
// Represents the combined profile data fetched by the useClientProfile hook
export interface FetchedClientProfile extends ClientProfile {
  email?: string | null; // From users table
  // Add other fields from 'users' table if needed, e.g., name, avatar_url
  // Ensure names don't clash or handle merging appropriately
  user_id: string; // Explicitly add the user id
}
// --- End Fetched Client Profile Type ---

// Define Param List for the Browse Stack (used in Client tabs)
export type BrowseStackParamList = {
  ClientBrowse: undefined; // The list screen doesn't need params
  DeveloperDetail: { developerId: string }; // The detail screen needs the ID
  BookingScreen: { developerId: string; developerName?: string }; // Screen for booking a first call
};

// Navigation param list for the main Tab navigator when user is a Developer
export type DeveloperMainTabParamList = {
  Dashboard: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>; // Navigates to ProfileStackNavigator
  Availability: undefined;
  // Bookings: undefined; // If DeveloperBookingsScreen is added to tabs
};

// Navigation param list for the main Tab navigator when user is a Client
export type ClientMainTabParamList = {
  Dashboard: undefined;
  Browse: NavigatorScreenParams<BrowseStackParamList>; 
  Profile: NavigatorScreenParams<ClientProfileStackParamList>;
  // Bookings: undefined; // If ClientBookingsScreen is added to tabs
};

// Combined ParamList for the main Tab navigator, encompassing all possible tabs
// This allows a single Tab.Navigator to be typed correctly, even if screens are conditional.
export type AllMainTabsParamList = {
  // Common screens or screens that might change target based on role
  Dashboard: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList> | NavigatorScreenParams<ClientProfileStackParamList>;
  Account: undefined; // Universal Account/Settings Tab

  // Developer-specific screens (optional if not present for clients)
  Availability?: undefined; 
  
  // Client-specific screens (optional if not present for developers)
  Browse?: NavigatorScreenParams<BrowseStackParamList>;
  
  // Common optional screens
  // Bookings?: undefined; // Example if bookings were shared or role-specific optional
};
