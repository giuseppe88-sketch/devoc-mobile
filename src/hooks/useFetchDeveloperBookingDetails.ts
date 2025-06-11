import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';

// Raw data structure from Supabase query for a single booking
interface RawDeveloperBookingDetailsData {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string | null;
  developer_id: string;
  client_id: string;
  original_availability_slot_id?: string | null;
  created_at: string;
  updated_at?: string | null;
  // And any other fields selected by '*'
  [key: string]: any; // Allow for other fields from '*'
  client_user_and_profile: {
    full_name?: string;
    avatar_url?: string | null;
    client_profile_data: {
      id: string;      // client_profiles.id
      client_name?: string | null; // client_profiles.client_name
    } | null; // Assuming one client_profile per user via this join
  } | null;
}

// Interface for detailed booking information, including client details
export interface DeveloperBookingDetails {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string | null;
  developer_id: string;
  client_id: string;
  original_availability_slot_id?: string | null;
  created_at: string;
  updated_at?: string | null;
  client_profile?: {
    client_name?: string;
    id: string; // client_profiles.id
    logo_url?: string | null; // The client's uploaded avatar/logo
    user?: {
      full_name?: string;
      avatar_url?: string | null;
      // Add other user fields if needed, e.g., email, phone
    };
    // Add other client_profile fields if needed
  };
  // You can also include developer_profile if needed, though less common here
}

const fetchDeveloperBookingDetails = async (bookingId: string, developerId: string): Promise<any> => { // Expect any as Supabase type inference might struggle
  if (!bookingId || !developerId) {
    throw new Error('Booking ID and Developer ID are required.');
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      client_user_and_profile:users!inner!client_id(
        full_name,
        avatar_url,
        client_profile_data:client_profiles!id(
          id,
          client_name,
          logo_url
        )
      )
    `)
    .eq('id', bookingId)
    .eq('developer_id', developerId) // Ensure the booking belongs to the current developer
    .single();

  if (error) {
    console.error('Error fetching booking details for developer:', error);
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error('Booking not found or access denied.');
  }

  return data || null; // Return data or null
};

export const useFetchDeveloperBookingDetails = (bookingId: string | undefined) => {
  const { user } = useAuthStore();
  const developerId = user?.id;

  return useQuery<any, Error, DeveloperBookingDetails | null>({ // Expect any from queryFn
    // QueryFn returns RawDeveloperBookingDetailsData | null
    // Hook returns DeveloperBookingDetails | null
    queryKey: ['developerBookingDetails', bookingId, developerId],
    queryFn: () => {
      if (!bookingId || !developerId) {
        // This condition should ideally be handled by `enabled` option or by not calling the hook.
        return Promise.reject(new Error('Booking ID or Developer ID is missing.'));
      }
      return fetchDeveloperBookingDetails(bookingId, developerId);
    },
    select: (rawBooking) => {
      if (!rawBooking) return null;

      console.log('[useFetchDeveloperBookingDetails] Raw booking data from Supabase:', JSON.stringify(rawBooking, null, 2));

      const profileData = rawBooking.client_user_and_profile?.client_profile_data;
      const userData = rawBooking.client_user_and_profile;

      console.log('[useFetchDeveloperBookingDetails] Extracted profileData:', JSON.stringify(profileData, null, 2));
      console.log('[useFetchDeveloperBookingDetails] Extracted userData (for full_name, avatar_url):', JSON.stringify(userData, null, 2));

      const transformedBooking = {
        ...rawBooking,
        client_profile: userData ? {
          id: profileData?.id || '', // client_profiles.id
          client_name: profileData?.client_name, // client_profiles.client_name
          logo_url: profileData?.logo_url, // client_profiles.logo_url
          user: {
            full_name: userData.full_name,
            avatar_url: userData.avatar_url,
          }
        } : undefined,
      } as DeveloperBookingDetails;

      console.log('[useFetchDeveloperBookingDetails] Transformed booking for component:', JSON.stringify(transformedBooking, null, 2));
      return transformedBooking;
    },
    enabled: !!bookingId && !!developerId, // Only run query if bookingId and developerId are available
  });
};
