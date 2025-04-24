-- Function to handle new user creation and insert into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Allows function to access auth.users table
SET search_path = public
AS $$
BEGIN
  -- Insert a new row into public.users
  -- Uses the id and email from the newly created auth.users record
  -- Extracts the 'role' from the user metadata passed during signup
  INSERT INTO public.users (id, email, role) -- Target public.users
  VALUES (
    NEW.id,
    NEW.email, -- Get email from the auth.users record
    NEW.raw_user_meta_data->>'role' -- Extracts 'role' field from metadata JSON
  );
  RETURN NEW; -- Returns the original NEW record for the trigger
END;
$$;

-- Trigger to call handle_new_user after a new user is inserted into auth.users
-- Drop trigger first if it exists (optional, for clean re-creation)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Optional: Enable Row Level Security (RLS) on developer_profiles if not already enabled
-- ALTER TABLE public.developer_profiles ENABLE ROW LEVEL SECURITY;
-- You would then need to define policies for SELECT, INSERT, UPDATE, DELETE
-- E.g., allow users to see their own profile:
-- CREATE POLICY "Allow users to view their own profile" ON public.developer_profiles
-- FOR SELECT USING (auth.uid() = id);
-- E.g., allow authenticated users to insert their own profile (handled by trigger now)
-- Note: RLS policies are crucial for security but are outside the scope of just fixing the trigger.
-- Add them based on your application's access requirements.