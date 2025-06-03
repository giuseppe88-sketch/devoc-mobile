// src/hooks/useCreateBooking.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase"; // Assuming your Supabase client is exported from here
import Toast from "react-native-toast-message";
import { useAuthStore } from "@/stores/auth-store"; // Import auth store
import { Platform } from "react-native";

interface BookFirstCallVariables {
  developerId: string;
  slotId: string; // This is the ID from developer_first_call_availability
}

// Define the expected structure of the successful booking data returned by the Edge Function's RPC call
interface BookingConfirmationData {
  booking_id: string;
  booked_start_time: string; // ISO string format from PostgreSQL TIMESTAMP
  booked_end_time: string; // ISO string format
  booking_status: string;
}

// Define the expected structure of the data returned by supabase.functions.invoke
interface EdgeFunctionResponse {
  success: boolean;
  booking?: BookingConfirmationData[]; // RPC returns an array, even for single row
  error?: string; // Present on failure within the function
}

const bookFirstCall = async ({
  developerId,
  slotId,
}: BookFirstCallVariables): Promise<BookingConfirmationData> => {
  const { data, error: functionInvokeError } = await supabase.functions.invoke(
    "create-booking",
    {
      body: { developerId, slotId },
    },
  );

  if (functionInvokeError) {
    console.error(
      "Supabase function invoke error (create-booking):",
      functionInvokeError.message,
    );
    const message = functionInvokeError.message ||
      "Failed to invoke create-booking function.";
    throw new Error(message);
  }

  const responseData = data as EdgeFunctionResponse;

  if (!responseData.success || responseData.error || !responseData.booking) {
    console.error(
      "Edge function (create-booking) returned an error:",
      responseData.error || "Unknown error from create-booking",
    );
    throw new Error(
      responseData.error ||
        "Create-booking function indicated failure. Please try again.",
    );
  }

  // The RPC function returns an array, even if it's a single booking object
  if (Array.isArray(responseData.booking) && responseData.booking.length > 0) {
    return responseData.booking[0];
  } else {
    console.error("Booking data not found or not in expected array format:", responseData.booking);
    throw new Error("Booking confirmation data is missing or invalid.");
  }
};

export const useCreateBooking = () => {
  const { user: authUser } = useAuthStore.getState(); // Get current authenticated user
  const queryClient = useQueryClient();

  return useMutation<BookingConfirmationData, Error, BookFirstCallVariables>(
    {
      mutationFn: bookFirstCall,
      onSuccess: async (data, variables) => { // Make onSuccess async
        Toast.show({
          type: "success",
          text1: "Booking Confirmed!",
          text2: `Your call at ${data.booked_start_time} is set.`,
        });

        // console.log('Raw booked_start_time from create-booking function:', data.start_time); // Commented out to reduce noise

        // Invalidate queries to refetch data
        // 1. Developer's first call availability (they might have other slots, but this one is gone)
        queryClient.invalidateQueries({
          queryKey: ["developerFirstCallAvailability", variables.developerId],
        });

        // 2. Potentially a list of the client's own bookings
        queryClient.invalidateQueries({ queryKey: ["clientBookings"] }); // Adjust key as needed

        // 3. If you have a general availability query for the developer that might be affected
        // queryClient.invalidateQueries({ queryKey: ['developerGeneralAvailability', variables.developerId] });

        // ---- Send Email Notification ----
        if (authUser?.email) {
          try {
            // Fetch client's full name (assuming 'full_name' column in 'users' table)
            // This is a simplified fetch; consider enhancing useAuthStore or using a dedicated profile hook
            const { data: clientProfile, error: clientProfileError } =
              await supabase
                .from("users")
                .select("full_name")
                .eq("id", authUser.id)
                .single();

            // Fetch developer's full name and email
            const { data: developerProfile, error: developerProfileError } =
              await supabase
                .from("users") // Assuming developers are also in the 'users' table
                .select("full_name, email")
                .eq("id", variables.developerId)
                .single();

            if (clientProfileError || developerProfileError) {
              console.error(
                "Error fetching profiles for email:",
                clientProfileError,
                developerProfileError,
              );
              // Optionally show a non-critical toast or log, but don't block booking success
              Toast.show({
                type: "info",
                text1: "Email Info",
                text2: "Could not fetch all details for email notification.",
              });
              // Still proceed with booking success flow even if email details fail
            }

            if (clientProfile && developerProfile?.email) {
              // Format the date and time from the booking data
              // Ensure the timestamp is valid
              let bookingDate: Date;
              try {
                // Handle both ISO string and PostgreSQL timestamp formats
                if (!data.booked_start_time) {
                  console.error("No booked_start_time in booking data:", data);
                  throw new Error("Missing booked_start_time");
                }
                bookingDate = new Date(data.booked_start_time);
                if (isNaN(bookingDate.getTime())) {
                  throw new Error("Invalid date");
                }
              } catch (error) {
                console.error("Error parsing booking date:", error);
                // Fallback to current date/time if invalid
                bookingDate = new Date();
              }

              // Format date: "Monday, June 2, 2025"
              const formattedDate = bookingDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              });

              // Format time: "10:00 AM PDT"
              const formattedTime = bookingDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZoneName: "short",
              });

              const emailPayload = {
                clientName: clientProfile.full_name || "Valued Client",
                clientEmail: authUser.email,
                developerName: developerProfile.full_name || "The Developer",
                developerEmail: developerProfile.email,
                bookingDate: formattedDate,
                bookingTime: formattedTime,
                bookingStartTimeISO: data.booked_start_time, // Pass ISO string directly
                bookingEndTimeISO: data.booked_end_time,     // Pass ISO string directly
              };

              const { error: emailError } = await supabase.functions.invoke(
                "send-booking-email",
                { body: emailPayload },
              );

              if (emailError) {
                console.error(
                  "Error invoking send-booking-email function:",
                  emailError,
                );
                Toast.show({
                  type: "info", // Non-critical error for email sending
                  text1: "Notification Issue",
                  text2: "Could not send booking confirmation email.",
                });
              } else {
                console.log(
                  "Send-booking-email function invoked successfully.",
                );
              }
            } else {
              console.warn(
                "Missing client or developer profile details for email notification.",
              );
            }
          } catch (e) {
            console.error(
              "Unexpected error during email notification process:",
              e,
            );
            Toast.show({
              type: "info",
              text1: "Notification Issue",
              text2:
                "An unexpected error occurred while preparing email notifications.",
            });
          }
        }
        // ---- End Email Notification ----
      },
      onError: (error: Error) => {
        console.error("useCreateBooking mutation onError:", error.message);
        Toast.show({
          type: "error",
          text1: "Booking Failed",
          text2: error.message || "Could not book the slot. Please try again.",
        });
      },
    },
  );
};
