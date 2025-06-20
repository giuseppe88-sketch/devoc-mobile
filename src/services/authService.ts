import { supabase } from "../lib/supabase";
import type {
  AuthError,
  SignInWithPasswordCredentials,
} from "@supabase/supabase-js";

// Define a type for the signup credentials including the role
interface SignUpCredentials {
  email: string;
  password: string;
  role: "client" | "developer";
}

/**
 * Signs up a new user with email, password, and role.
 */
export const signUpUser = async (
  credentials: SignUpCredentials,
): Promise<{ error: AuthError | null }> => {
  const { email, password, role } = credentials;

  // Define the options object
  const signUpOptions = {
    data: {
      role: role,
    },
    emailRedirectTo: "https://supabase-redirector.vercel.app",
    // emailRedirectTo: 'https://supabase-redirector.vercel.app/' // Ensure trailing slash if needed, though usually not critical
  };
 
  // Attempt to sign up the authentication user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: signUpOptions, // Pass the defined options object
  });

  // If authentication signup failed, return the error
  // The trigger function 'handle_new_user' will now handle creating the user in 'public.users'
  if (authError) {
    console.error("Supabase auth.signUp error:", authError?.message);
    return { error: authError };
  }

  return { error: null };
};

/**
 * Signs in an existing user with email and password.
 */
export const signInUser = async (
  credentials: SignInWithPasswordCredentials,
): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.signInWithPassword(credentials);
  if (error) {
    console.error("Supabase auth.signIn error:", error.message);
  }
  return { error };
};

/**
 * Signs out the current user.
 */
export const signOutUser = async (): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Supabase auth.signOut error:", error.message);
  }
  return { error };
};

// TODO: Add functions for password reset, session handling, etc. if needed
