-- supabase/migrations/YYYYMMDDHHMMSS_update_cancel_booking_function_authorization.sql

-- Drop the old function if it exists, to ensure a clean re-creation
DROP FUNCTION IF EXISTS public.cancel_booking_and_reactivate_slot(UUID, UUID);

-- Recreate the function with updated authorization logic
CREATE OR REPLACE FUNCTION public.cancel_booking_and_reactivate_slot(
  p_booking_id UUID,
  p_requesting_user_id UUID -- Renamed for clarity, can be client or developer
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_client_id UUID;
  v_booking_developer_id UUID; -- Added to store the booking's developer_id
  v_original_slot_id UUID;
  v_booking_status TEXT;
BEGIN
  -- Check if the booking exists and get its current status, client_id, developer_id, and original_availability_slot_id
  SELECT client_id, developer_id, status, original_availability_slot_id
  INTO v_booking_client_id, v_booking_developer_id, v_booking_status, v_original_slot_id
  FROM public.bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'booking_not_found', 'message', 'Booking not found.');
  END IF;

  -- Authorize: Check if the requesting user is either the client or the developer of the booking
  IF (v_booking_client_id IS DISTINCT FROM p_requesting_user_id AND v_booking_developer_id IS DISTINCT FROM p_requesting_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized', 'message', 'You are not authorized to cancel this booking.');
  END IF;

  -- Check if booking is already cancelled or in a non-cancellable state (e.g., completed)
  IF v_booking_status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_cancelled', 'message', 'Booking is already cancelled.');
  END IF;
  
  -- Update booking status to 'cancelled'
  UPDATE public.bookings
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE id = p_booking_id;

  -- Reactivate the original availability slot, if it exists
  IF v_original_slot_id IS NOT NULL THEN
    UPDATE public.availabilities
    SET is_active = TRUE,
        updated_at = NOW()
    WHERE id = v_original_slot_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Booking cancelled successfully.');

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in cancel_booking_and_reactivate_slot: %', SQLERRM;
    RETURN jsonb_build_object('success', false, 'error', 'internal_server_error', 'message', 'An unexpected error occurred: ' || SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.cancel_booking_and_reactivate_slot(UUID, UUID) IS 'Cancels a booking, sets its status to "cancelled", and reactivates the original availability slot. Authorizes if the requesting user is the client OR the developer of the booking.';