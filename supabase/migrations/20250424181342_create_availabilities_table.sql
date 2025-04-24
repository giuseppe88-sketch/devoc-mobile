-- Create the availabilities table to store developer weekly recurring availability
CREATE TABLE public.availabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES public.developer_profiles(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,       -- e.g., '09:00:00'
  end_time TIME NOT NULL,         -- e.g., '17:00:00'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT check_start_before_end CHECK (start_time < end_time)
);

-- Add comment for clarity
COMMENT ON COLUMN public.availabilities.day_of_week IS 'Day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)';

-- Add index for faster lookups by developer
CREATE INDEX idx_availabilities_developer_id ON public.availabilities(developer_id);