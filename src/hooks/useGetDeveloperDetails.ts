// src/hooks/useGetDeveloperDetails.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Re-use the DeveloperProfile interface (consider moving to a types file later)
export interface DeveloperProfile {
  id: string;
  name: string; 
  skills: string[] | null;
  avatar_url: string | null; 
  phone_number: string | null;
  focus_areas: string[] | null; 
  portfolio_url: string | null;
  github_url: string | null;
  hourly_rate: number | null; 
  location: string | null;
  years_of_experience: number | null; 
  bio: string | null; 
  email: string | null; 
  rating: number | null; 
}

// Re-use FetchedDeveloperData structure
interface FetchedDeveloperData {
  id: string;
  skills: string[] | null;
  phone_number: string | null;
  focus_areas: string[] | null;
  portfolio_url: string | null;
  github_url: string | null;
  hourly_rate: number | null;
  location: string | null;
  years_of_experience: number | null;
  rating: number | null;
  users: {
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    email: string | null;
  } | null;
}

const fetchDeveloperDetails = async (
  developerId: string
): Promise<DeveloperProfile> => {
  const { data, error } = await supabase
    .from("developer_profiles")
    .select<string, FetchedDeveloperData>(`
      id,
      phone_number,
      skills,
      focus_areas,
      portfolio_url,
      github_url,
      hourly_rate,
      location,
      years_of_experience,
      rating,
      users (
        full_name,
        avatar_url,
        bio,
        email
      )
    `)
    .eq("id", developerId)
    .single();

  if (error) {
    console.error("Error fetching developer details:", error);
    throw new Error(error.message || "Failed to fetch developer details");
  }
  if (!data) {
    throw new Error(`Developer with id ${developerId} not found`);
  }

  // Process the single result
  const profile: DeveloperProfile = {
    id: data.id,
    name: data.users?.full_name ?? "Unknown Name",
    skills: data.skills,
    avatar_url: data.users?.avatar_url ?? null,
    phone_number: data.phone_number,
    focus_areas: data.focus_areas,
    portfolio_url: data.portfolio_url,
    github_url: data.github_url,
    hourly_rate: data.hourly_rate,
    location: data.location,
    years_of_experience: data.years_of_experience,
    bio: data.users?.bio ?? null,
    email: data.users?.email ?? null,
    rating: data.rating,
  };

  return profile;
};

// Explicitly type the hook parameters and the useQuery call
export function useGetDeveloperDetails(developerId: string | null | undefined) {
  return useQuery<DeveloperProfile, Error>(
    // Attempting v4 syntax: useQuery(queryKey, queryFn, options)
    ["developerDetails", developerId], // Query Key (1st argument)
    async (): Promise<DeveloperProfile> => { // Query Function (2nd argument)
      if (!developerId) {
        // Should not happen if enabled is working, but belts and suspenders
        return Promise.reject(new Error("Developer ID is required"));
      }
      // Fetch the details using the existing async function
      return await fetchDeveloperDetails(developerId);
    },
    { // Options object (3rd argument)
      enabled: !!developerId, // Only run the query if developerId is truthy
      staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes (v4 name)
    }
  );
}
