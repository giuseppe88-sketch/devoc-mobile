import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Define the structure of the data we want the hook to return
export interface DeveloperProfile {
  id: string;
  name: string; // From users.full_name
  skills: string[] | null;
  avatar_url: string | null; // From users.avatar_url
  // Add new fields corresponding to the query
  phone_number: string | null;
  focus_areas: string[] | null; // Assuming array, adjust if not
  portfolio_url: string | null;
  github_url: string | null;
  hourly_rate: number | null; // Assuming number
  location: string | null;
  years_of_experience: number | null; // Assuming number
  bio: string | null; // From users.bio
  email: string | null; // From users.email
  rating: number | null; // Add rating field
}

// Define the structure of the raw data fetched from Supabase
// Matching the select query with the inner join
interface FetchedDeveloperData {
  id: string;
  skills: string[] | null;
  // Add new fields corresponding to the query
  phone_number: string | null;
  focus_areas: string[] | null; // Assuming array, adjust if not
  portfolio_url: string | null;
  github_url: string | null;
  hourly_rate: number | null; // Assuming number
  location: string | null;
  years_of_experience: number | null; // Assuming number
  rating: number | null; // Add rating field
  users: {
    full_name: string | null;
    avatar_url: string | null;
    // Add fields from users table
    bio: string | null;
    email: string | null;
  } | null; // Inner join ensures this shouldn't be null, but safer to keep
}

const fetchBrowseDevelopers = async (): Promise<DeveloperProfile[]> => {
  const { data, error } = await supabase
    .from("developer_profiles")
    .select<string, FetchedDeveloperData>(`
      id,
      phone_number,
      focus_areas,
      portfolio_url,
      github_url,
      hourly_rate,
      location,
      years_of_experience,
      skills,
      rating,
      users!inner (
        bio,
        email,
        full_name,
        avatar_url
      )
    `);

  if (error) {
    // console.error("Error fetching developers:", error); // Commented out to reduce noise
    throw new Error(`Failed to fetch developers: ${error.message}`);
  }

  if (!data) {
    // console.warn("No developer data returned from Supabase despite no error."); // Commented out to reduce noise
    return [];
  }

  // Update mapping to include all fetched fields
  const transformedData: DeveloperProfile[] = data.map((dev) => {
    // Safely access nested user data
    const userName = dev.users?.full_name ?? "N/A";
    const userAvatar = dev.users?.avatar_url ?? null;
    const userBio = dev.users?.bio ?? null;
    const userEmail = dev.users?.email ?? null;

    return {
      id: dev.id,
      name: userName,
      skills: dev.skills,
      avatar_url: userAvatar,
      phone_number: dev.phone_number,
      focus_areas: dev.focus_areas,
      portfolio_url: dev.portfolio_url,
      github_url: dev.github_url,
      hourly_rate: dev.hourly_rate,
      location: dev.location,
      years_of_experience: dev.years_of_experience,
      bio: userBio,
      email: userEmail,
      rating: dev.rating,
    };
  });

  return transformedData;
}

export function useBrowseDevelopers() {
  return useQuery<DeveloperProfile[], Error>({
    queryKey: ["browseDevelopers"],
    queryFn: fetchBrowseDevelopers,
  });
}
