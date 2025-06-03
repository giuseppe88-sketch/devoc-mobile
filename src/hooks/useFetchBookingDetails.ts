import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth-store';

// Re-using the Booking interface, ensure it matches the one used elsewhere
// Or import it if it's defined in a shared types file
export interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  developer_id: string;
  client_id: string;
  // Optional, as per your existing structure
  developer_profile?: {
    id: string;
    user?: {
      full_name?: string;
      avatar_url?: string | null;
    };
  };
  // If you have other relations like 'slots' or 'services', include them if needed
}

const fetchBookingDetails = async (bookingId: string, clientId: string | undefined) => {
  if (!clientId) {
    throw new Error('Client ID is not available. User might not be logged in.');
  }
  if (!bookingId) {
    throw new Error('Booking ID is required.');
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      developer_profile:developer_profiles (
        *,
        user:users (
          full_name,
          avatar_url
        )
      )
    `)
    .eq('id', bookingId)
    .eq('client_id', clientId) // Ensure the booking belongs to the current client
    .single();

  if (error) {
    console.error('Error fetching booking details:', error);
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error('Booking not found.');
  }

  return data as Booking;
};

export const useFetchBookingDetails = (bookingId: string) => {
  const { session } = useAuthStore();
  const clientId = session?.user?.id;

  return useQuery<Booking, Error>({
    queryKey: ['bookingDetails', bookingId, clientId], // Include clientId in queryKey
    queryFn: () => fetchBookingDetails(bookingId, clientId),
    enabled: !!bookingId && !!clientId, // Only run query if bookingId and clientId are available
    // staleTime: 1000 * 60 * 5, // Optional: 5 minutes
    // gcTime: 1000 * 60 * 10, // Optional: 10 minutes
  });
};
