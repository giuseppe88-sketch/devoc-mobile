-- Add original_availability_slot_id to bookings table
ALTER TABLE public.bookings
ADD COLUMN original_availability_slot_id UUID;

-- Add foreign key constraint to availability table
-- This assumes your availability table is named 'availability' and has an 'id' column.
-- It's set to ON DELETE SET NULL so if an availability slot is somehow deleted,
-- the booking record doesn't break, but loses the link.
-- ON UPDATE CASCADE ensures if the availability ID changes, the booking record reflects it.
ALTER TABLE public.bookings
ADD CONSTRAINT fk_original_availability_slot
FOREIGN KEY (original_availability_slot_id)
REFERENCES public.availabilities(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

COMMENT ON COLUMN public.bookings.original_availability_slot_id IS 'Stores the ID of the original availability slot that was booked. Used to reactivate the slot upon cancellation.';
