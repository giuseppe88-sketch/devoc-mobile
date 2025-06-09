import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';

// Raw data structure from Supabase query
interface RawDeveloperBookingData {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  developer_id: string;
  client_id: string;
  notes?: string | null;
  original_availability_slot_id?: string | null;
  created_at: string;
  updated_at?: string | null;
  client_user_and_profile: {
    full_name?: string;
    avatar_url?: string | null;
    client_profile_data: {
      id: string;      // client_profiles.id
      client_name?: string | null; // client_profiles.client_name
    } | null; // Assuming one client_profile per user via this join
  } | null;
}

// Interface for booking with client profile details
export interface BookingWithClient {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  developer_id: string;
  client_id: string;
  notes?: string | null;
  original_availability_slot_id?: string | null;
  client_profile?: {
    client_name?: string;
    id: string;
    user?: {
      full_name?: string;
      avatar_url?: string | null;
    };
  };
}

const fetchDeveloperBookings = async (developerId: string): Promise<any[]> => { // Return any[] as Supabase type inference might struggle
  if (!developerId) {
    return [];
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      start_time,
      end_time,
      status,
      developer_id,
      client_id,
      notes,
      original_availability_slot_id,
      created_at,
      updated_at,
      client_user_and_profile:users!inner!client_id(
        full_name,
        avatar_url,
        client_profile_data:client_profiles!id(
          id,
          client_name
        )
      )
    `)
    .eq('developer_id', developerId)
    .order('start_time', { ascending: false });

  if (error) {
    console.error('Error fetching developer bookings:', error);
    throw new Error(error.message);
  }

  return data || []; // Return data or an empty array if data is null
};

export const useFetchDeveloperBookings = () => {
  const { user } = useAuthStore(); // Assuming developer user is in useAuthStore
  const developerId = user?.id; // Or however you get the developer's ID

  return useQuery<any[], Error, BookingWithClient[]>({ // Expect any[] from queryFn
    queryKey: ['developerBookings', developerId],
    queryFn: () => fetchDeveloperBookings(developerId!),
    enabled: !!developerId,
    select: (rawBookings) => {
      return rawBookings.map(rawBooking => {
        const profileData = rawBooking.client_user_and_profile?.client_profile_data;
        const userData = rawBooking.client_user_and_profile;

        return {
          ...rawBooking,
          client_profile: userData ? {
            id: profileData?.id || '', // client_profiles.id
            client_name: profileData?.client_name, // client_profiles.client_name
            user: {
              full_name: userData.full_name,
              avatar_url: userData.avatar_url,
            }
          } : undefined,
        } as BookingWithClient;
      });
    }
  });
};
