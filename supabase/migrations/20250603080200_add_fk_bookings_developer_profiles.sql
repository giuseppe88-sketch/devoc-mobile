-- Attempt to drop the constraint if it exists, regardless of its current definition.
-- This handles cases where the constraint exists but points to the wrong table.
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_developer_id_fkey;

-- Add the correct foreign key constraint, ensuring it points to developer_profiles.id
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_developer_id_fkey
FOREIGN KEY (developer_id) REFERENCES public.developer_profiles(id)
ON UPDATE CASCADE
ON DELETE RESTRICT;