CREATE OR REPLACE FUNCTION public.create_booking_and_update_slot(p_client_id uuid, p_developer_id uuid, p_slot_id uuid)
 RETURNS TABLE(booking_id uuid, booked_start_time timestamp with time zone, booked_end_time timestamp with time zone, booking_status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_slot_day_of_week INT;
  v_slot_start_time TIME;
  v_slot_end_time TIME;
  v_calculated_start_timestamp TIMESTAMP WITH TIME ZONE;
  v_calculated_end_timestamp TIMESTAMP WITH TIME ZONE;
  v_current_date DATE := CURRENT_DATE;
  v_days_to_add INT;
  v_target_date DATE;
  v_new_booking_id UUID;
  v_developer_exists BOOLEAN;
BEGIN
  -- Check if developer exists
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = p_developer_id) INTO v_developer_exists;
  IF NOT v_developer_exists THEN
    RAISE EXCEPTION 'developer_not_found';
  END IF;

  -- Get slot details and lock the row for update
  SELECT day_of_week, slot_start_time, slot_end_time
  INTO v_slot_day_of_week, v_slot_start_time, v_slot_end_time
  FROM public.availabilities
  WHERE id = p_slot_id 
    AND developer_id = p_developer_id 
    AND availability_type = 'first_call'
    AND is_active = TRUE
  FOR UPDATE;

  IF NOT FOUND THEN
    IF EXISTS(SELECT 1 FROM public.availabilities 
              WHERE id = p_slot_id 
                AND developer_id = p_developer_id 
                AND availability_type = 'first_call' 
                AND is_active = FALSE) THEN
      RAISE EXCEPTION 'slot_already_booked';
    ELSE
      RAISE EXCEPTION 'slot_not_found'; 
    END IF;
  END IF;

  -- Calculate the next occurrence of the slot's day_of_week
  v_days_to_add := (v_slot_day_of_week - EXTRACT(DOW FROM v_current_date)::INT + 7) % 7;
  
  IF v_days_to_add = 0 AND v_slot_start_time < CURRENT_TIME THEN
    v_days_to_add := 7; -- Move to next week if today's slot time has passed
  END IF;
  
  v_target_date := v_current_date + v_days_to_add;

  -- Interpret the local time in the developer's timezone ('Europe/Rome') and convert to UTC
  v_calculated_start_timestamp := (v_target_date + v_slot_start_time) AT TIME ZONE 'Europe/Rome';
  v_calculated_end_timestamp := (v_target_date + v_slot_end_time) AT TIME ZONE 'Europe/Rome';

  -- Mark the availability slot as inactive
  UPDATE public.availabilities
  SET is_active = FALSE
  WHERE id = p_slot_id;

  -- Create the booking
  INSERT INTO public.bookings (developer_id, client_id, start_time, end_time, status, notes, original_availability_slot_id)
  VALUES (p_developer_id, p_client_id, v_calculated_start_timestamp, v_calculated_end_timestamp, 'confirmed', 'First call booking', p_slot_id)
  RETURNING id INTO v_new_booking_id;
  
  RETURN QUERY 
  SELECT v_new_booking_id, v_calculated_start_timestamp, v_calculated_end_timestamp, 'confirmed'::TEXT;

EXCEPTION
  WHEN OTHERS THEN
    RAISE; 
END;
$function$;
