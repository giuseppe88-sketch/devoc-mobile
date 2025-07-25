import { create } from "zustand";
import { AuthError, Session, User } from "@supabase/supabase-js";
import { signInUser, signOutUser, signUpUser } from "../services/authService";
import { supabase } from '../lib/supabase'; // Corrected import path for supabase client

// Define a type for the profile data we expect from public.users
interface UserProfile {
  id: string;
  role: 'developer' | 'client';
}

interface AuthState {
  session: Session | null;
  user: User | null;
  userRole: 'developer' | 'client' | null; // <-- Add role state
  full_name: string | null; // <-- Add full_name state
  loading: boolean; // Loading for auth actions
  loadingProfile: boolean; // Loading specifically for profile fetching
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    role: "client" | "developer", // Role might be determined by trigger now
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  setSession: (session: Session | null) => void;
  fetchUserProfile: (userId: string) => Promise<void>; // <-- Add fetch action
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  userRole: null, // <-- Initialize role
  full_name: null, // <-- Initialize full_name
  loading: true,
  loadingProfile: false, // <-- Initialize profile loading state

  fetchUserProfile: async (userId) => {
    if (!userId) {
      set({ userRole: null, full_name: null, loadingProfile: false });
      return;
    }
    set({ loadingProfile: true });
    try {
      const { data, error, status } = await supabase
        .from('users') // Query the 'public.users' table
        .select('role, full_name') // Select role and full_name
        .eq('id', userId)
        .single(); // Expect one row or null

      if (error && status !== 406) { // 406 means no rows found, which is handled below
        console.error('Error fetching user profile:', error.message);
        set({ userRole: null, full_name: null, loadingProfile: false });
      } else if (data) {
        set({ userRole: data.role as 'developer' | 'client', full_name: data.full_name || null, loadingProfile: false });
      } else {
         // Handle case where user exists in auth but not in public.users
         console.warn(`No profile found in public.users for user ID: ${userId}. Defaulting role and name.`);
         // Decide on default behavior: null or 'client'? Let's use null for clarity.
         set({ userRole: null, full_name: null, loadingProfile: false });
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      set({ userRole: null, full_name: null, loadingProfile: false });
    }
  },

  setSession: (session) => {
    const currentUserId = get().user?.id; // Get user ID *before* setting the new state
    const newUserId = session?.user?.id;

    // Set core auth state first
    set({ session: session, user: session?.user ?? null, loading: false });

    // Fetch profile only if the user ID has actually changed or was null before
    if (newUserId && newUserId !== currentUserId) {
       // Ensure newUserId is not undefined before calling
       get().fetchUserProfile(newUserId);
    } else if (!newUserId && currentUserId) {
       set({ userRole: null, full_name: null, loadingProfile: false });
    } else if (newUserId && newUserId === currentUserId && (get().userRole === null || get().full_name === null) && !get().loadingProfile) {
        // User ID is the same, but role wasn't loaded (e.g., initial load), try fetching
        // Ensure newUserId is not undefined before calling
        get().fetchUserProfile(newUserId);
    }
  },

  signIn: async (email, password) => {
    set({ loading: true });
    // Sign in happens via service, session update triggers setSession -> fetchUserProfile
    const { error } = await signInUser({ email, password });
    if (error) {
      console.error("Error signing in:", error.message);
      set({ loading: false }); // Stop loading on error
      return { error };
    }
    // Don't set loading: false here; setSession will do it and trigger profile load
    return { error: null };
  },

  // Consider if signUp needs adjustment based on whether a trigger creates the public.users row
  signUp: async (email, password, role) => { // Role passed here might be redundant if using trigger
    set({ loading: true });
    // Pass role to signUpUser to satisfy function signature
    const { error } = await signUpUser({ email, password, role }); 
    if (error) {
      console.error("Error signing up:", error.message);
      set({ loading: false });
      return { error };
    }
    // Don't set loading: false; successful signup should trigger onAuthStateChange -> setSession -> fetchUserProfile
    // If NOT using a trigger, you might need to insert into public.users here.
    return { error: null };
  },

  signOut: async () => {
    set({ loading: true }); // Set loading true before async call
    const { error } = await signOutUser();
    if (error) {
      console.error("Error signing out:", error.message);
      set({ loading: false }); // Stop loading on error
      return { error };
    }
    // setSession(null) will be called by onAuthStateChange, which clears state
    // We can explicitly clear here too for immediate UI update if needed,
    // but setSession handles the role clearing.
    // set({ session: null, user: null, userRole: null, loading: false }); // Explicit clear
    return { error: null };
  },
}));
