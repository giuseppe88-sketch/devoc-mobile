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
    .single();

  if (error) {
    console.error('Error fetching developer profile ID:', error.message);
    // Optionally, rethrow or handle more gracefully depending on requirements
    // For now, returning null allows the dependent query to disable if ID isn't found
    return null;
  }
  return data?.id || null;
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
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Query to get developer_id first
  const { data: developerId, isLoading: isLoadingDeveloperId } = useQuery({
    queryKey: ['developerProfileId', user?.id],
    queryFn: () => {
      if (!user?.id) return Promise.resolve(null);
      return getDeveloperProfileId(user.id);
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
    availabilitySlots: availabilitySlots || [], // Ensure it's always an array
    isLoading: isLoadingDeveloperId || isLoadingAvailability,
    isError: isAvailabilityError,
    error: availabilityErrorObject,
    refetchAvailability,
    saveAvailability: saveAvailabilityMutation.mutateAsync,
    // @ts-expect-error TS2339: 'isPending' is the correct property for TanStack Query v5 mutations
    isSaving: saveAvailabilityMutation.isPending,
    developerId, // Expose developerId if screen needs it (e.g., for initial check)
  };
}
