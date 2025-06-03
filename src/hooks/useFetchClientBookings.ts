import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';

export interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  developer_id: string;
  client_id: string;
  developer_profile?: {
    id: string;
    user?: {
      full_name?: string;
      avatar_url?: string | null;
    };
  };
}

const fetchClientBookings = async (clientId: string): Promise<Booking[]> => {
  if (!clientId) {
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
      developer_profile:developer_profiles!inner!developer_id(
        id,
        user:users!inner(
          full_name,
          avatar_url
        )
      )
    `)
    .eq('client_id', clientId)
    .order('start_time', { ascending: false });

  if (error) {
    console.error('Error fetching client bookings:', error);
    throw new Error(error.message);
  }

  return data as unknown as Booking[];
};

export const useFetchClientBookings = () => {
  const { user } = useAuthStore();
  const clientId = user?.id;

  // For TanStack Query v5, useQuery accepts a single options object.
  // The queryKey, queryFn, and other options are properties of this object.
  return useQuery<Booking[], Error>({
    queryKey: ['clientBookings', clientId],
    queryFn: () => {
      if (!clientId) return Promise.resolve([]); // Should not happen due to 'enabled' but good for type safety
      return fetchClientBookings(clientId);
    },
    enabled: !!clientId,
    initialData: [], // Ensures data is always an array, see MEMORY c999a2d7
  });
};
