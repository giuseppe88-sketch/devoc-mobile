ALTER TABLE public.availabilities
  ALTER COLUMN day_of_week DROP NOT NULL,
  ALTER COLUMN slot_start_time DROP NOT NULL,
  ALTER COLUMN slot_end_time DROP NOT NULL;