-- Function to cancel a booking and reactivate the original availability slot
CREATE OR REPLACE FUNCTION public.cancel_booking_and_reactivate_slot(
  p_booking_id UUID,
  p_requesting_client_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Important for allowing controlled updates
AS $$
DECLARE
  v_booking_client_id UUID;
  v_original_slot_id UUID;
  v_booking_status TEXT;
BEGIN
  -- Check if the booking exists and get its current status and client_id
  SELECT client_id, status, original_availability_slot_id
  INTO v_booking_client_id, v_booking_status, v_original_slot_id
  FROM public.bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'booking_not_found', 'message', 'Booking not found.');
  END IF;

  -- Authorize: Check if the requesting client owns the booking
  IF v_booking_client_id IS DISTINCT FROM p_requesting_client_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized', 'message', 'You are not authorized to cancel this booking.');
  END IF;

  -- Check if booking is already cancelled or in a non-cancellable state (e.g., completed)
  IF v_booking_status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_cancelled', 'message', 'Booking is already cancelled.');
  END IF;
  
  -- Add more checks for other non-cancellable statuses if needed, e.g. 'completed'
  -- IF v_booking_status = 'completed' THEN
  --   RETURN jsonb_build_object('success', false, 'error', 'booking_completed', 'message', 'Cannot cancel a completed booking.');
  -- END IF;

  -- Update booking status to 'cancelled'
  UPDATE public.bookings
  SET status = 'cancelled',
      updated_at = NOW() -- Also update the updated_at timestamp
  WHERE id = p_booking_id;

  -- Reactivate the original availability slot, if it exists
  IF v_original_slot_id IS NOT NULL THEN
    UPDATE public.availabilities -- Corrected table name
    SET is_active = TRUE,
        updated_at = NOW() -- Also update the updated_at timestamp
    WHERE id = v_original_slot_id;
    
    -- Optional: Check if the slot update was successful (e.g., if the slot still exists)
    -- IF NOT FOUND THEN
    --   -- Handle case where original slot might have been deleted (though FK should prevent this if not SET NULL)
    -- END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Booking cancelled successfully.');

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error internally if possible, then return a generic error
    RAISE WARNING 'Error in cancel_booking_and_reactivate_slot: %', SQLERRM;
    RETURN jsonb_build_object('success', false, 'error', 'internal_server_error', 'message', 'An unexpected error occurred: ' || SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.cancel_booking_and_reactivate_slot(UUID, UUID) IS 'Cancels a booking, sets its status to "cancelled", and reactivates the original availability slot if one is linked. Requires booking ID and the client ID of the user requesting cancellation for authorization.';
