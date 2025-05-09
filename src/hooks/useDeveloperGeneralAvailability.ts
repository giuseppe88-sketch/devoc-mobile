import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth-store';
import { Availability } from '../types';

// Helper function to get the developer_id from developer_profiles based on user_id
async function getDeveloperProfileId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('developer_profiles')
    .select('id')
    .eq('id', userId) // The developer_profiles.id is the user's auth.users.id
    .maybeSingle();

  if (error) {
    console.error(`Error fetching developer profile ID for user ${userId} (useDeveloperGeneralAvailability): ${error.message}`, error);
    return null;
  }
  if (!data) {
    console.warn(`No developer profile found in developer_profiles for user ID: ${userId} (useDeveloperGeneralAvailability). This may be expected if the profile hasn't been created yet.`);
    return null;
  }
  return data.id;
}

// Fetch function for useQuery
async function fetchGeneralAvailability(developerId: string): Promise<Availability[]> {
  const { data, error } = await supabase
    .from('availabilities')
    .select('*')
    .eq('developer_id', developerId)
    .eq('availability_type', 'general_work_block')
    .order('range_start_date', { ascending: true });

  if (error) {
    console.error('Error fetching general availability:', error.message);
    throw new Error(`Failed to fetch general availability: ${error.message}`);
  }
  // Ensure the date fields are strings, or null, as expected by the Availability type
  return (data || []).map(item => ({
    ...item,
    range_start_date: item.range_start_date ? String(item.range_start_date) : null,
    range_end_date: item.range_end_date ? String(item.range_end_date) : null,
  }));
}

// Type for the save mutation input
export interface SaveGeneralAvailabilityParams {
  range_start_date: string; // YYYY-MM-DD
  range_end_date: string;   // YYYY-MM-DD
}

// Internal type for the actual mutation function, including developerId
interface InternalSaveParams extends SaveGeneralAvailabilityParams {
  developerId: string;
}

// Save function for useMutation
async function saveGeneralAvailabilityMutationFn({
  developerId,
  range_start_date,
  range_end_date,
}: InternalSaveParams): Promise<void> {
  if (!developerId) {
    console.error('[saveGeneralAvailabilityMutationFn] Critical: developerId is missing.');
    throw new Error('Developer ID is missing, cannot save general availability.');
  }

  const newGeneralAvailabilitySlot = {
    developer_id: developerId,
    availability_type: 'general_work_block' as const,
    range_start_date,
    range_end_date,
    day_of_week: null, // Not applicable for date ranges
    slot_start_time: null, // Not applicable for date ranges, or could be full day
    slot_end_time: null,   // Not applicable for date ranges, or could be full day
  };

  const { error: insertError } = await supabase
    .from('availabilities')
    .insert([newGeneralAvailabilitySlot]);

  if (insertError) {
    console.error('Error inserting new general availability:', insertError.message);
    throw new Error(`Failed to insert new general availability: ${insertError.message}`);
  }
}

export function useDeveloperGeneralAvailability() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  console.log(`[useDeveloperGeneralAvailability] Hook execution: user?.id is ${user?.id}`);

  const { data: developerId, isLoading: isLoadingDeveloperId } = useQuery({
    queryKey: ['developerProfileId', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }
      const devId = await getDeveloperProfileId(user.id);
      return devId;
    },
    enabled: !!user?.id,
    staleTime: Infinity, // Developer ID is unlikely to change during a session
  });

  const { data: availabilitySlots, isLoading: isLoadingAvailability, refetch } = useQuery<Availability[], Error>({
    queryKey: ['developerGeneralAvailability', developerId],
    queryFn: () => {
      if (!developerId) return Promise.resolve([]);
      return fetchGeneralAvailability(developerId);
    },
    enabled: !!developerId && !isLoadingDeveloperId,
    initialData: [], // Ensure availabilitySlots is always an array
  });
    // @ts-expect-error TS2339: 'isPending' is the correct property for TanStack Query v5 mutations
  const { mutateAsync: saveAvailability, isPending: isSaving } = useMutation<void, Error, SaveGeneralAvailabilityParams>({
    mutationFn: (params: SaveGeneralAvailabilityParams) => {
      if (!developerId) {
        console.error('Attempted to save general availability without developerId.');
        return Promise.reject(new Error('Developer ID not available.'));
      }
      return saveGeneralAvailabilityMutationFn({ ...params, developerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developerGeneralAvailability', developerId] });
      // Potentially show a success toast/message here
    },
    onError: (error) => {
      console.error('Failed to save general availability:', error.message);
      // Potentially show an error toast/message here
    },
  });

  return {
    availabilitySlots: availabilitySlots, // No longer need '|| []' due to initialData
    isLoading: isLoadingDeveloperId || isLoadingAvailability,
    isSaving,
    saveAvailability,
    refetchAvailability: refetch,
    developerId,
    isLoadingDeveloperId,
  };
}
