import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Availability } from '../types';

// Fetch function for useQuery
async function fetchFirstCallAvailabilityByProfileId(developerProfileId: string | undefined): Promise<Availability[]> {
  if (!developerProfileId) {
    // console.warn('[fetchFirstCallAvailabilityByProfileId] developerProfileId is missing, returning empty array.'); // Commented out
    return [];
  }

  const { data, error } = await supabase
    .from('availabilities')
    .select('*')
    .eq('developer_id', developerProfileId)
    .eq('availability_type', 'first_call')
    .order('day_of_week', { ascending: true })
    .order('slot_start_time', { ascending: true });

  if (error) {
    // console.error(`Error fetching first call availability for profile ${developerProfileId}:`, error.message); // Commented out
    throw new Error(`Failed to fetch availability for profile ${developerProfileId}: ${error.message}`);
  }
  return data || [];
}

export function useFetchDeveloperFirstCallAvailability(developerProfileId: string | undefined) {
  const {
    data: availabilitySlots,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Availability[], Error>({
    queryKey: ['developerFirstCallAvailability', developerProfileId],
    queryFn: () => fetchFirstCallAvailabilityByProfileId(developerProfileId),
    enabled: !!developerProfileId, // Only run if developerProfileId is provided
    initialData: [], // Ensure availabilitySlots is always an array
  });

  return {
    availabilitySlots,
    isLoading,
    isError,
    error,
    refetch,
  };
}
