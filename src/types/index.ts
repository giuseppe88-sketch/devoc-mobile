import { Database } from './supabase';

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
  developerId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // Format: "HH:MM" in 24-hour format
  endTime: string; // Format: "HH:MM" in 24-hour format
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
};
