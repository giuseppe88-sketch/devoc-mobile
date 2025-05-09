-- Helper function to update the updated_at column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Start transaction
BEGIN;

-- 1. Rename columns for clarity
ALTER TABLE public.availabilities
  RENAME COLUMN start_time TO slot_start_time;

ALTER TABLE public.availabilities
  RENAME COLUMN end_time TO slot_end_time;

-- 2. Add availability_type column
-- Defaulting to 'first_call' for existing rows.
-- If existing data represents other types, this default will need manual adjustment post-migration.
ALTER TABLE public.availabilities
  ADD COLUMN availability_type TEXT NOT NULL DEFAULT 'first_call';

-- Add a CHECK constraint for allowed availability types
ALTER TABLE public.availabilities
  ADD CONSTRAINT check_availability_type
  CHECK (availability_type IN ('first_call', 'general_work_block'));

-- 3. Add updated_at column (created_at already exists)
ALTER TABLE public.availabilities
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Create the trigger for updated_at
-- Ensure the trigger function public.handle_updated_at() exists or is created in this script
CREATE TRIGGER on_availabilities_updated
  BEFORE UPDATE ON public.availabilities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Add CHECK constraint to ensure slot_end_time is after slot_start_time
ALTER TABLE public.availabilities
  ADD CONSTRAINT check_slot_times
  CHECK (slot_end_time > slot_start_time);

-- 6. Enable Row Level Security on the table
ALTER TABLE public.availabilities ENABLE ROW LEVEL SECURITY;

-- 7. Define RLS Policies

-- Policy: Developers can manage (select, insert, update, delete) their own availability slots.
-- Assumes 'developer_id' in 'availabilities' table stores the auth.uid() of the developer.
CREATE POLICY "Developers can manage their own availability"
  ON public.availabilities
  FOR ALL
  USING (auth.uid() = developer_id)
  WITH CHECK (auth.uid() = developer_id);

-- Policy: Authenticated users (e.g., clients looking to book) can read all availability slots.
CREATE POLICY "Authenticated users can read availabilities"
  ON public.availabilities
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 8. Add comments to columns for better understanding (optional but good practice)
COMMENT ON COLUMN public.availabilities.day_of_week IS 'Day of the week (e.g., 0 for Sunday, 1 for Monday, ..., 6 for Saturday, following ISO 8601 where applicable or a consistent project standard)';
COMMENT ON COLUMN public.availabilities.slot_start_time IS 'Start time of the availability slot (e.g., ''09:00:00'')';
COMMENT ON COLUMN public.availabilities.slot_end_time IS 'End time of the availability slot (e.g., ''09:30:00'')';
COMMENT ON COLUMN public.availabilities.availability_type IS 'Type of availability (e.g., ''first_call'', ''general_work_block'')';
COMMENT ON COLUMN public.availabilities.created_at IS 'Timestamp of when the availability slot was created';
COMMENT ON COLUMN public.availabilities.updated_at IS 'Timestamp of when the availability slot was last updated';

-- Commit transaction
COMMIT;