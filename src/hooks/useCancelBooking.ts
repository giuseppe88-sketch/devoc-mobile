// src/hooks/useCancelBooking.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase'; // Assuming supabase client is here
import Toast from 'react-native-toast-message';

interface CancelBookingVariables {
  bookingId: string;
  clientId: string; // Added for targeted query invalidation
}

interface CancelBookingResponse {
  success: boolean;
  message?: string;
  error?: string;
}

const cancelBookingFn = async ({ bookingId }: CancelBookingVariables): Promise<CancelBookingResponse> => {
  const { data, error } = await supabase.functions.invoke('cancel-booking', {
    body: { bookingId },
  });

  if (error) {
    console.error('Error invoking cancel-booking function:', error);
    // Ensure we return a structured error that matches CancelBookingResponse
    return { success: false, error: error.message || 'Failed to invoke cancel-booking function.' };
  }

  // The Edge Function itself returns data in the format of CancelBookingResponse
  // So, data should already be { success: boolean, message?: string, error?: string }
  if (data && typeof data.success === 'boolean') {
    return data as CancelBookingResponse;
  }

  // Fallback if data is not in the expected format (should ideally not happen)
  console.warn('Unexpected response format from cancel-booking function:', data);
  return { success: false, error: 'Unexpected response format from server.' };
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation<CancelBookingResponse, Error, CancelBookingVariables, unknown>({
    mutationFn: cancelBookingFn,
    onSuccess: (response, variables) => {
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Booking Cancelled',
          text2: response.message || 'Your booking has been successfully cancelled.',
        });
        // Invalidate queries to refetch data
        // Adjust query keys as per your application's structure
        queryClient.invalidateQueries({ queryKey: ['clientBookings', variables.clientId] }); // For client's list of bookings
        queryClient.invalidateQueries({ queryKey: ['bookingDetails', variables.bookingId] }); // For specific booking details
        // Potentially invalidate availability slots if they are displayed and should reflect the change
        // queryClient.invalidateQueries({ queryKey: ['availabilitySlots', relevantDeveloperId] }); 
      } else {
        // Handle cases where the Edge Function returns success: false
        Toast.show({
          type: 'error',
          text1: 'Cancellation Failed',
          text2: response.error || response.message || 'Could not cancel the booking.',
        });
      }
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Cancellation Error',
        text2: error.message || 'An unexpected error occurred while cancelling the booking.',
      });
    },
  });
};
