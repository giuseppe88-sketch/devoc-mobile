-- Drop the old foreign key constraint that links developer_profiles.id to auth.users.id
ALTER TABLE public.developer_profiles
DROP CONSTRAINT "developer_profiles_id_fkey"; 

-- Add the new foreign key constraint linking developer_profiles.id to public.users.id
-- Note: Using the same name for simplicity, but ensures it now points to public.users
ALTER TABLE public.developer_profiles
ADD CONSTRAINT "developer_profiles_id_fkey" 
FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE; -- Added ON DELETE CASCADE to match original constraint behavior