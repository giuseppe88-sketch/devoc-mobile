import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Availability } from '../types';

// Fetch function for useQuery
async function fetchGeneralAvailabilityByProfileId(developerProfileId: string | undefined): Promise<Availability[]> {
  if (!developerProfileId) {
    console.warn('[fetchGeneralAvailabilityByProfileId] developerProfileId is missing, returning empty array.');
    return [];
  }

  const { data, error } = await supabase
    .from('availabilities')
    .select('id, developer_id, availability_type, range_start_date, range_end_date, day_of_week, slot_start_time, slot_end_time, created_at, updated_at')
    .eq('developer_id', developerProfileId)
    .eq('availability_type', 'general_work_block')
    .order('range_start_date', { ascending: true });

  if (error) {
    console.error(`Error fetching general availability for profile ${developerProfileId}:`, error.message);
    throw new Error(`Failed to fetch general availability for profile ${developerProfileId}: ${error.message}`);
  }
  // Ensure date fields are strings, as expected by some parts of the app or for consistency
  return (data || []).map(item => ({
    id: item.id,
    developer_id: item.developer_id,
    availability_type: item.availability_type,
    range_start_date: item.range_start_date ? String(item.range_start_date) : null,
    range_end_date: item.range_end_date ? String(item.range_end_date) : null,
    day_of_week: item.day_of_week,
    slot_start_time: item.slot_start_time,
    slot_end_time: item.slot_end_time,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));
}

export function useFetchDeveloperGeneralAvailability(developerProfileId: string | undefined) {
  const {
    data: availabilitySlots,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Availability[], Error>({
    queryKey: ['developerGeneralAvailability', developerProfileId],
    queryFn: () => fetchGeneralAvailabilityByProfileId(developerProfileId),
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
