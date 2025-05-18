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
    .select('id, developer_id, availability_type, range_start_date, range_end_date, day_of_week, slot_start_time, slot_end_time, created_at, updated_at')
    .eq('developer_id', developerId)
    .eq('availability_type', 'general_work_block')
    .order('range_start_date', { ascending: true });

  if (error) {
    console.error('Error fetching general availability:', error.message);
    throw new Error(`Failed to fetch general availability: ${error.message}`);
  }
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

// Type for the delete mutation input
export interface DeleteGeneralAvailabilityParams {
  availabilityId: string | number; // Match the type of your 'id' column
}

// Internal type for the actual delete mutation function, including developerId
interface InternalDeleteParams extends DeleteGeneralAvailabilityParams {
  developerId: string;
}

// Delete function for useMutation
async function deleteGeneralAvailabilityMutationFn({
  availabilityId,
  developerId,
}: InternalDeleteParams): Promise<void> {
  if (!developerId) {
    console.error('[deleteGeneralAvailabilityMutationFn] Critical: developerId is missing.');
    throw new Error('Developer ID is missing, cannot delete general availability.');
  }

  console.log(`Attempting to delete availability ID: ${availabilityId} for developer: ${developerId}`);

  const { error: deleteError } = await supabase
    .from('availabilities')
    .delete()
    .match({ id: availabilityId, developer_id: developerId, availability_type: 'general_work_block' }); // Match ID, developer, and type

  if (deleteError) {
    console.error(`Error deleting general availability ID ${availabilityId}:`, deleteError.message);
    throw new Error(`Failed to delete general availability: ${deleteError.message}`);
  }

  console.log(`Successfully deleted availability ID: ${availabilityId}`);
}

// Interface for the hook's props
interface UseDeveloperGeneralAvailabilityProps {
  targetDeveloperId?: string;
}

export function useDeveloperGeneralAvailability({ targetDeveloperId }: UseDeveloperGeneralAvailabilityProps = {}) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  console.log(`[useDeveloperGeneralAvailability] Hook execution: user?.id is ${user?.id}, targetDeveloperId is ${targetDeveloperId}`);

  // Fetch developerId for the logged-in user only if targetDeveloperId is not provided
  const { data: loggedInUserDeveloperId, isLoading: isLoadingDeveloperId } = useQuery({
    queryKey: ['developerProfileId', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('[useDeveloperGeneralAvailability] No user.id, cannot fetch loggedInUserDeveloperId');
        return null;
      }
      const devId = await getDeveloperProfileId(user.id);
      console.log(`[useDeveloperGeneralAvailability] Fetched loggedInUserDeveloperId: ${devId} for user ${user.id}`);
      return devId;
    },
    enabled: !!user?.id && !targetDeveloperId, // Only run if no targetDeveloperId is provided
    staleTime: Infinity,
  });

  // Determine the actual developerId to use for fetching availability
  const developerIdToUse = targetDeveloperId || loggedInUserDeveloperId;

  console.log(`[useDeveloperGeneralAvailability] developerIdToUse for fetching availability: ${developerIdToUse}`);

  const { data: availabilitySlots, isLoading: isLoadingAvailability, refetch, error } = useQuery<Availability[], Error>({
    queryKey: ['developerGeneralAvailability', developerIdToUse], // Use the determined ID in queryKey
    queryFn: () => {
      if (!developerIdToUse) {
        console.log('[useDeveloperGeneralAvailability] No developerIdToUse, resolving with empty array.');
        return Promise.resolve([]);
      }
      console.log(`[useDeveloperGeneralAvailability] Fetching general availability for developerId: ${developerIdToUse}`);
      return fetchGeneralAvailability(developerIdToUse);
    },
    enabled: !!developerIdToUse && (targetDeveloperId ? true : !isLoadingDeveloperId), // Enable if developerIdToUse is present and (targetId exists OR loggedInId is loaded)
    initialData: [],
  });

  console.log(`[useDeveloperGeneralAvailability] Availability query: isLoading=${isLoadingAvailability}, data=${JSON.stringify(availabilitySlots?.length)} slots, error=${error?.message}`);

  // Save Mutation
  const { mutateAsync: saveAvailability, isLoading: isSaving } = useMutation<void, Error, SaveGeneralAvailabilityParams>({
    mutationFn: (params: SaveGeneralAvailabilityParams) => {
      const finalDeveloperId = targetDeveloperId || loggedInUserDeveloperId;
      if (!finalDeveloperId) {
        console.error('Attempted to save general availability without finalDeveloperId.');
        return Promise.reject(new Error('Developer ID not available.'));
      }
      return saveGeneralAvailabilityMutationFn({ ...params, developerId: finalDeveloperId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developerGeneralAvailability', targetDeveloperId || loggedInUserDeveloperId] });
      // Potentially show a success toast/message here
    },
    onError: (error) => {
      console.error('Failed to save general availability:', error.message);
      // Potentially show an error toast/message here
    },
  });

  // Delete Mutation
  const { mutateAsync: deleteAvailability, isLoading: isDeleting } = useMutation<void, Error, DeleteGeneralAvailabilityParams>({
    mutationFn: (params: DeleteGeneralAvailabilityParams) => {
      const finalDeveloperId = targetDeveloperId || loggedInUserDeveloperId;
      if (!finalDeveloperId) {
        console.error('Attempted to delete general availability without finalDeveloperId.');
        return Promise.reject(new Error('Developer ID not available.'));
      }
      return deleteGeneralAvailabilityMutationFn({ ...params, developerId: finalDeveloperId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developerGeneralAvailability', targetDeveloperId || loggedInUserDeveloperId] });
      console.log('Successfully deleted, invalidated query.');
      // Optionally: Reset any local state in the component if needed after delete
    },
    onError: (error) => {
      console.error('Failed to delete general availability:', error.message);
      // Potentially show an error toast/message here
    },
  });

  return {
    availabilitySlots: availabilitySlots, 
    isLoading: targetDeveloperId ? isLoadingAvailability : (isLoadingDeveloperId || isLoadingAvailability),
    isSaving,
    isDeleting,
    saveAvailability,
    deleteAvailability,
    refetch,
    error, // Expose error for consumers to handle
    developerId: developerIdToUse, // Expose the determined developer ID
  };
}
