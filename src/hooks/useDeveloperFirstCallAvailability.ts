import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase'; // Assuming this is your Supabase client instance
import { useAuthStore } from '../stores/auth-store';
import { Availability } from '../types'; // Assuming this is your Availability type

// Helper function to get the developer_id from developer_profiles based on user_id
async function getDeveloperProfileId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('developer_profiles')
    .select('id') // We still want to select the profile's own ID
    .eq('id', userId) // Reverted: Query by the profile's own ID, which matches the user's auth ID
    .maybeSingle();

  if (error) {
    console.error(`Error fetching developer profile ID for user ${userId} (useDeveloperFirstCallAvailability): ${error.message}`, error);
    return null;
  }
  if (!data) {
    console.warn(`No developer profile found in developer_profiles for user ID: ${userId} (useDeveloperFirstCallAvailability). This may be expected if the profile hasn't been created yet.`);
    return null;
  }
  return data.id;
}

// Fetch function for useQuery
async function fetchFirstCallAvailability(developerId: string): Promise<Availability[]> {
  const { data, error } = await supabase
    .from('availabilities')
    .select('*')
    .eq('developer_id', developerId)
    .eq('availability_type', 'first_call')
    .order('day_of_week', { ascending: true })
    .order('slot_start_time', { ascending: true });

  if (error) {
    console.error('Error fetching first call availability:', error.message);
    throw new Error(`Failed to fetch availability: ${error.message}`);
  }
  return data || [];
}

// Type for the save mutation input (what the screen will pass)
export interface SaveFirstCallAvailabilityParams {
  day_of_week: number;
  timeRanges: Array<{ slot_start_time: string; slot_end_time: string }>;
}

// Internal type for the actual mutation function, including developerId
interface InternalSaveParams extends SaveFirstCallAvailabilityParams {
  developerId: string;
}

// Save function for useMutation
async function saveFirstCallAvailabilityMutationFn({
  developerId,
  day_of_week,
  timeRanges,
}: InternalSaveParams): Promise<void> {
  console.log('[saveFirstCallAvailabilityMutationFn] Attempting to save. Received developerId:', developerId);
  console.log('[saveFirstCallAvailabilityMutationFn] Day of week:', day_of_week);
  console.log('[saveFirstCallAvailabilityMutationFn] Time ranges:', JSON.stringify(timeRanges, null, 2));

  if (!developerId) {
    console.error('[saveFirstCallAvailabilityMutationFn] Critical: developerId is missing. Aborting save operation.');
    throw new Error('Developer ID is missing, cannot save availability. Please ensure you are properly logged in and your profile is set up.');
  }

  // Delete existing slots for the day and type
  const { error: deleteError } = await supabase
    .from('availabilities')
    .delete()
    .eq('developer_id', developerId)
    .eq('day_of_week', day_of_week)
    .eq('availability_type', 'first_call');

  if (deleteError) {
    console.error('Error deleting existing availability:', deleteError.message);
    throw new Error(`Failed to delete existing availability: ${deleteError.message}`);
  }

  // Insert new slots if any are provided
  if (timeRanges.length > 0) {
    const newSlotsToInsert = timeRanges.map(range => ({
      developer_id: developerId,
      day_of_week: day_of_week,
      slot_start_time: range.slot_start_time,
      slot_end_time: range.slot_end_time,
      availability_type: 'first_call' as const, // Ensure literal type
    }));

    const { error: insertError } = await supabase
      .from('availabilities')
      .insert(newSlotsToInsert);

    if (insertError) {
      console.error('Error inserting new availability:', insertError.message);
      throw new Error(`Failed to insert new availability: ${insertError.message}`);
    }
  }
}

export function useDeveloperFirstCallAvailability() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  console.log(`[useDeveloperFirstCallAvailability] Hook execution: user?.id is ${user?.id}`);

  // Query to get developer_id first
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
    staleTime: Infinity, // Developer profile ID rarely changes for a logged-in user
  });

  // Main query for availability, dependent on developerId
  const {
    data: availabilitySlots,
    isLoading: isLoadingAvailability,
    isError: isAvailabilityError,
    error: availabilityErrorObject, // Store the actual error object
    refetch: refetchAvailability,
  } = useQuery<Availability[], Error>({
    queryKey: ['developerFirstCallAvailability', developerId],
    queryFn: () => {
      if (!developerId) return Promise.resolve([]);
      return fetchFirstCallAvailability(developerId);
    },
    enabled: !!developerId, // Only run if developerId is successfully fetched
    initialData: [], // Ensure availabilitySlots is always an array
  });

  // Mutation for saving availability
  const saveAvailabilityMutation = useMutation<
    void,
    Error,
    SaveFirstCallAvailabilityParams // This is what the component calls mutate with
  >({
    mutationFn: async (params) => {
      if (!developerId) {
        throw new Error('Developer ID not available. Cannot save availability.');
      }
      return saveFirstCallAvailabilityMutationFn({ ...params, developerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developerFirstCallAvailability', developerId] });
    },
    onError: (error) => {
      // Error is already logged in the mutationFn, but can add UI feedback here
      console.error('Mutation level error:', error.message);
    },
  });

  return {
    availabilitySlots: availabilitySlots, // No longer need '|| []' due to initialData
    isLoading: isLoadingDeveloperId || isLoadingAvailability,
    isError: isAvailabilityError,
    error: availabilityErrorObject,
    refetchAvailability,
    saveAvailability: saveAvailabilityMutation.mutateAsync,
    // @ts-expect-error TS2339: 'isPending' is the correct property for TanStack Query v5 mutations
    isSaving: saveAvailabilityMutation.isPending,
    developerId, // Expose developerId if screen needs it (e.g., for initial check)
    isLoadingDeveloperId, // Expose loading state for developerId
  };
}
