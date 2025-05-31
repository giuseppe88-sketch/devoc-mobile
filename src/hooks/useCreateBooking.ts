// src/hooks/useCreateBooking.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase'; // Assuming your Supabase client is exported from here
import Toast from 'react-native-toast-message';
import { Platform } from 'react-native';

interface BookFirstCallVariables {
  developerId: string;
  slotId: string; // This is the ID from developer_first_call_availability
}

// Define the expected structure of the successful booking data returned by the Edge Function's RPC call
interface BookingConfirmationData {
  booking_id: string;
  booked_start_time: string; // ISO string format from PostgreSQL TIMESTAMP
  booked_end_time: string;   // ISO string format
  booking_status: string;
}

// Define the expected structure of the data returned by supabase.functions.invoke
interface EdgeFunctionResponse {
  success: boolean;
  booking?: BookingConfirmationData; // Present on success
  error?: string; // Present on failure within the function
}

const bookFirstCall = async ({
  developerId,
  slotId,
}: BookFirstCallVariables): Promise<BookingConfirmationData> => {
  const { data, error: functionInvokeError } = await supabase.functions.invoke(
    'create-booking',
    {
      body: { developerId, slotId },
    }
  );

  if (functionInvokeError) {
    console.error('Supabase function invoke error:', functionInvokeError);
    // Attempt to parse a more specific error message if the function returned one
    // Deno functions often return error details in data.error or error.context.details
    const message = functionInvokeError.message || 'Failed to invoke booking function.';
    throw new Error(message);
  }

  const responseData = data as EdgeFunctionResponse;

  if (!responseData.success || responseData.error || !responseData.booking) {
    console.error('Edge function returned an error:', responseData.error);
    throw new Error(responseData.error || 'Booking failed. Please try again.');
  }

  return responseData.booking;
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation<BookingConfirmationData, Error, BookFirstCallVariables>(
    {
      mutationFn: bookFirstCall,
      onSuccess: (data, variables) => {
        Toast.show({
          type: 'success',
          text1: 'Booking Confirmed!',
          text2: `Your call at ${new Date(data.booked_start_time).toLocaleString()} is set.`,
        });

        // Invalidate queries to refetch data
        // 1. Developer's first call availability (they might have other slots, but this one is gone)
        queryClient.invalidateQueries({
          queryKey: ['developerFirstCallAvailability', variables.developerId],
        });
        
        // 2. Potentially a list of the client's own bookings
        queryClient.invalidateQueries({ queryKey: ['clientBookings'] }); // Adjust key as needed

        // 3. If you have a general availability query for the developer that might be affected
        // queryClient.invalidateQueries({ queryKey: ['developerGeneralAvailability', variables.developerId] });
      },
      onError: (error: Error) => {
        Toast.show({
          type: 'error',
          text1: 'Booking Failed',
          // The error message should come from the throw in bookFirstCall
          text2: error.message || 'Could not book the slot. Please try again.', 
        });
      },
    }
  );
};
