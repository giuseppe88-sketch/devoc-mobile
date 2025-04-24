-- Add a rating column to developer_profiles
ALTER TABLE public.developer_profiles
ADD COLUMN rating NUMERIC DEFAULT 0;

-- Add a constraint to ensure rating is non-negative
ALTER TABLE public.developer_profiles
ADD CONSTRAINT rating_non_negative CHECK (rating >= 0);

-- Add an index for faster querying/sorting by rating
CREATE INDEX idx_developer_profiles_rating ON public.developer_profiles(rating);