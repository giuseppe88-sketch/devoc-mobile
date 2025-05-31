-- Add is_active column to public.availabilities table

ALTER TABLE public.availabilities
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.availabilities.is_active IS 'Whether the availability slot is currently active and bookable (TRUE) or has been booked/disabled (FALSE)';
