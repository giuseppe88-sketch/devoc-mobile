import { create } from "zustand";
import { AuthError, Session, User } from "@supabase/supabase-js";
import { signInUser, signOutUser, signUpUser } from "../services/authService";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    role: "client" | "developer",
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,

  setSession: (session) =>
    set({ session: session, user: session?.user ?? null }),

  signIn: async (email, password) => {
    set({ loading: true });
    const { error } = await signInUser({ email, password });
    if (error) {
      console.error("Error signing in:", error.message);
      set({ loading: false });
      return { error };
    }

    set({ loading: false });
    return { error: null };
  },

  signUp: async (email, password, role) => {
    set({ loading: true });
    const { error } = await signUpUser({ email, password, role });
    if (error) {
      console.error("Error signing up:", error.message);
      set({ loading: false });
      return { error };
    }
    set({ loading: false });
    return { error: null };
  },

  signOut: async () => {
    set({ loading: true });
    const { error } = await signOutUser();
    if (error) {
      console.error("Error signing out:", error.message);
      set({ loading: false });
      return { error };
    }
    set({ session: null, user: null, loading: false });
    return { error: null };
  },
}));
