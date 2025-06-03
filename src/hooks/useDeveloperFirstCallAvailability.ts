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
    // console.error(`Error fetching developer profile ID for user ${userId} (useDeveloperFirstCallAvailability): ${error.message}`, error); // Commented out to reduce noise
    return null;
  }
  if (!data) {
    // console.warn(`No developer profile found in developer_profiles for user ID: ${userId} (useDeveloperFirstCallAvailability). This may be expected if the profile hasn't been created yet.`); // Commented out to reduce noise
    return null;
  }
  return data.id;
}

// Interface for the hook's props
interface UseDeveloperFirstCallAvailabilityProps {
  targetDeveloperId?: string;
}

// Fetch function for useQuery
async function fetchFirstCallAvailability(developerId: string): Promise<Availability[]> {
  // console.log(`[fetchFirstCallAvailability] Fetching for developerId: ${developerId}`); // Commented out to reduce noise
  const { data, error } = await supabase
    .from('availabilities')
    .select('*')
    .eq('developer_id', developerId)
    .eq('availability_type', 'first_call')
    .order('day_of_week', { ascending: true })
    .order('slot_start_time', { ascending: true });

  if (error) {
    // console.error('Error fetching first call availability:', error.message); // Commented out to reduce noise
    throw new Error(`Failed to fetch availability: ${error.message}`);
  }
  return (data || []).map(item => ({
    id: item.id,
    developer_id: item.developer_id,
    availability_type: item.availability_type,
    range_start_date: item.range_start_date ? String(item.range_start_date) : null, // Ensure string or null
    range_end_date: item.range_end_date ? String(item.range_end_date) : null,     // Ensure string or null
    day_of_week: item.day_of_week,
    slot_start_time: item.slot_start_time,
    slot_end_time: item.slot_end_time,
    is_active: item.is_active, // Added to fulfill the Availability type
  }));
}

// Type for the save mutation input (what the screen will pass)
export interface SaveFirstCallAvailabilityParams {
  day_of_week: number;
  timeRanges: Array<{ slot_start_time: string; slot_end_time: string }>;
}

// Internal type for the actual mutation function, including developerId
interface InternalSaveParams {
  slots: SaveFirstCallAvailabilityParams[];
  developerId: string;
}

// Save function for useMutation
async function saveFirstCallAvailabilityMutationFn({
  slots, // Corrected: expects an array of slots
  developerId,
}: InternalSaveParams): Promise<Availability[]> { // Adjusted return type for consistency with useMutation generic
  // console.log('[saveFirstCallAvailabilityMutationFn] Attempting to save. Received developerId:', developerId); // Commented out to reduce noise
  // console.log('[saveFirstCallAvailabilityMutationFn] Slots:', JSON.stringify(slots, null, 2)); // Commented out to reduce noise

  if (!developerId) {
    // console.error('[saveFirstCallAvailabilityMutationFn] Critical: developerId is missing. Aborting save operation.'); // Commented out to reduce noise
    throw new Error('Developer ID is missing, cannot save availability. Please ensure you are properly logged in and your profile is set up.');
  }

  // 1. Determine the days of the week being updated from the input slots.
  const daysToUpdate = [...new Set(slots.map(slot => slot.day_of_week))];

  // 2. Delete existing 'first_call' availabilities for this developer *only for the days being updated*.
  if (daysToUpdate.length > 0) {
    // console.log(`[saveFirstCallAvailabilityMutationFn] Deleting existing 'first_call' availabilities for developer ${developerId} on days: ${daysToUpdate.join(', ')}`); // Commented out to reduce noise
    const { error: deleteError } = await supabase
      .from('availabilities')
      .delete()
      .eq('developer_id', developerId)
      .eq('availability_type', 'first_call')
      .in('day_of_week', daysToUpdate);

    if (deleteError) {
      // console.error(`[saveFirstCallAvailabilityMutationFn] Error deleting existing availabilities for days ${daysToUpdate.join(', ')}: ${deleteError.message}`); // Commented out to reduce noise
      throw new Error(`Failed to clear existing availabilities for specified days: ${deleteError.message}`);
    }
    // console.log(`[saveFirstCallAvailabilityMutationFn] Successfully deleted existing 'first_call' availabilities for developer ${developerId} on days: ${daysToUpdate.join(', ')}`); // Commented out to reduce noise
  } else {
    // console.log('[saveFirstCallAvailabilityMutationFn] No specific days found in input slots to delete. This might mean the input `slots` array was empty. No deletion performed based on day_of_week.'); // Commented out to reduce noise
    // If slots is empty, it means the intention is to clear the specified days.
    // If daysToUpdate is empty because slots was empty, then it implies clearing for the days represented by the empty slots array.
    // The current logic will then proceed to insert nothing, which is correct if the slots for given days are cleared by the user.
  }


  // 2. If no new slots are provided, we're done.
  if (!slots || slots.length === 0) {
    // console.log('[saveFirstCallAvailabilityMutationFn] No new slots provided. Operation complete after deletion.'); // Commented out to reduce noise
    return []; // Return empty array as no new slots were inserted
  }

  // 3. Prepare new availability records for insertion
  const newAvailabilityRecords: Omit<Availability, 'id' | 'created_at' | 'updated_at'>[] = [];
  slots.forEach(slot => {
    slot.timeRanges.forEach(range => {
      newAvailabilityRecords.push({
        developer_id: developerId,
        availability_type: 'first_call' as const,
        day_of_week: slot.day_of_week,
        slot_start_time: range.slot_start_time,
        slot_end_time: range.slot_end_time,
        range_start_date: null, // Not applicable for 'first_call'
        range_end_date: null,   // Not applicable for 'first_call'
        is_active: true, // New slots are active by default
      });
    });
  });

  // 4. Bulk insert the new availability records if any
  if (newAvailabilityRecords.length === 0) {
    // console.log('[saveFirstCallAvailabilityMutationFn] No valid new time ranges to insert.'); // Commented out to reduce noise
    return [];
  }

  const { data: insertedData, error: insertError } = await supabase
    .from('availabilities')
    .insert(newAvailabilityRecords)
    .select(); // Select the inserted rows to return them

  if (insertError) {
    // console.error('[saveFirstCallAvailabilityMutationFn] Error inserting new availabilities:', insertError.message); // Commented out to reduce noise
    throw new Error(`Failed to insert new availabilities: ${insertError.message}`);
  }

  // console.log('[saveFirstCallAvailabilityMutationFn] Successfully saved new availabilities. Inserted data:', JSON.stringify(insertedData, null, 2)); // Commented out to reduce noise
  return (insertedData as Availability[]) || []; // Ensure correct typing for return
}

export function useDeveloperFirstCallAvailability({ targetDeveloperId }: UseDeveloperFirstCallAvailabilityProps = {}) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  // console.log(`[useDeveloperFirstCallAvailability] Hook execution: user?.id is ${user?.id}, targetDeveloperId is ${targetDeveloperId}`); // Commented out to reduce noise

  const { data: loggedInUserDeveloperId, isLoading: isLoadingDeveloperId } = useQuery({
    queryKey: ['developerProfileIdForFirstCall', user?.id], // Unique queryKey part
    queryFn: async () => {
      if (!user?.id) {
        // console.log('[useDeveloperFirstCallAvailability] No user.id, cannot fetch loggedInUserDeveloperId'); // Commented out to reduce noise
        return null;
      }
      const devId = await getDeveloperProfileId(user.id);
      // console.log(`[useDeveloperFirstCallAvailability] Fetched loggedInUserDeveloperId: ${devId} for user ${user.id}`); // Commented out to reduce noise
      return devId;
    },
    enabled: !!user?.id && !targetDeveloperId, // Only run if no targetDeveloperId is provided
    staleTime: Infinity,
  });

  const developerIdToUse = targetDeveloperId || loggedInUserDeveloperId;

  // console.log(`[useDeveloperFirstCallAvailability] developerIdToUse for fetching availability: ${developerIdToUse}`); // Commented out to reduce noise

  const { data: availabilitySlots, isLoading: isLoadingAvailability, refetch, error } = useQuery<Availability[], Error>({
    queryKey: ['developerFirstCallAvailability', developerIdToUse],
    queryFn: () => {
      if (!developerIdToUse) {
        // console.log('[useDeveloperFirstCallAvailability] No developerIdToUse, resolving with empty array.'); // Commented out to reduce noise
        return Promise.resolve([]);
      }
      // console.log(`[useDeveloperFirstCallAvailability] Fetching first call availability for developerId: ${developerIdToUse}`); // Commented out to reduce noise
      return fetchFirstCallAvailability(developerIdToUse);
    },
    enabled: !!developerIdToUse && (targetDeveloperId ? true : !isLoadingDeveloperId),
    initialData: [],
  });

  // console.log(`[useDeveloperFirstCallAvailability] Availability query: isLoading=${isLoadingAvailability}, data=${JSON.stringify(availabilitySlots?.length)} slots, error=${error?.message}`); // Commented out to reduce noise

  const { mutateAsync: saveAvailability, isPending: isSaving } = useMutation<Availability[], Error, SaveFirstCallAvailabilityParams[], { previousAvailability: Availability[] | undefined }>({
    mutationFn: (newSlots: SaveFirstCallAvailabilityParams[]) => {
      const finalDeveloperId = targetDeveloperId || loggedInUserDeveloperId;
      if (!finalDeveloperId) {
        // console.error('Attempted to save first call availability without finalDeveloperId.'); // Commented out to reduce noise
        return Promise.reject(new Error('Developer ID not available.'));
      }
      return saveFirstCallAvailabilityMutationFn({ slots: newSlots, developerId: finalDeveloperId });
    },
    onMutate: async (newSlots: SaveFirstCallAvailabilityParams[]) => {
      await queryClient.cancelQueries({ queryKey: ['developerFirstCallAvailability', targetDeveloperId || loggedInUserDeveloperId] });
      const previousAvailability = queryClient.getQueryData<Availability[]>(['developerFirstCallAvailability', targetDeveloperId || loggedInUserDeveloperId]);
      return { previousAvailability };
    },
    onError: (err: Error, newSlots: SaveFirstCallAvailabilityParams[], context?: { previousAvailability: Availability[] | undefined }) => {
      console.error('Failed to save first call availability:', err.message);
      if (context?.previousAvailability) {
        queryClient.setQueryData(['developerFirstCallAvailability', targetDeveloperId || loggedInUserDeveloperId], context.previousAvailability);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['developerFirstCallAvailability', targetDeveloperId || loggedInUserDeveloperId] });
    },
  });

  return {
    availabilitySlots,
    isLoading: targetDeveloperId ? isLoadingAvailability : (isLoadingDeveloperId || isLoadingAvailability),
    isSaving,
    saveAvailability,
    refetch,
    error,
    developerId: developerIdToUse, // Expose the determined developer ID
  };
}
