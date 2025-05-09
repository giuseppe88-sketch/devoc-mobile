-- supabase/migrations/20250509160550_add_date_range_to_availabilities.sql

BEGIN;

-- Add new columns for date ranges
ALTER TABLE public.availabilities
  ADD COLUMN range_start_date DATE NULL,
  ADD COLUMN range_end_date DATE NULL;

-- Add a CHECK constraint to ensure data integrity based on availability_type
ALTER TABLE public.availabilities
  ADD CONSTRAINT check_availability_dates_logic
  CHECK (
    (availability_type = 'first_call' AND range_start_date IS NULL AND range_end_date IS NULL) OR
    (availability_type = 'general_work_block' AND range_start_date IS NOT NULL AND range_end_date IS NOT NULL AND range_end_date >= range_start_date)
  );

COMMIT;
