// src/hooks/useDeleteBooking.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";

// Define the type for the mutation variables
interface DeleteBookingVariables {
  bookingId: string;
  clientId: string; // For targeted query invalidation
}

// The async function that performs the deletion
const deleteBooking = async ({ bookingId }: DeleteBookingVariables) => {
  const { error } = await supabase.from("bookings").delete().eq(
    "id",
    bookingId,
  );

  if (error) {
    console.error("Error deleting booking:", error.message);
    throw new Error(
      error.message || "An unknown error occurred while deleting the booking.",
    );
  }

  return null;
};

// The custom hook
export function useDeleteBooking() {
  const queryClient = useQueryClient();
  const navigation = useNavigation();

  return useMutation<null, Error, DeleteBookingVariables, unknown>({
    mutationFn: deleteBooking,
    onSuccess: (data, variables) => {
      Toast.show({
        type: "success",
        text1: "Booking Deleted",
        text2: "The booking has been successfully deleted.",
      });

      // Invalidate queries to update the UI
      // We only need to invalidate the list, not the details of the deleted booking.
      queryClient.invalidateQueries({
        queryKey: ["clientBookings", variables.clientId],
      });

      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Deletion Failed",
        text2: error.message ||
          "Could not delete the booking. Please check permissions.",
      });
    },
  });
}
