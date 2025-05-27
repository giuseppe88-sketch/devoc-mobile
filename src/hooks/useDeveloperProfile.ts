import { QueryFunctionContext, useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { DeveloperProfile, FetchedDeveloperProfile } from "../types";

// Keep the query key type for clarity
type DeveloperProfileQueryKey = ["developerProfile", string | undefined];

// Updated function to fetch from both tables and combine
async function fetchDeveloperProfile(
  { queryKey }: QueryFunctionContext<DeveloperProfileQueryKey>,
): Promise<FetchedDeveloperProfile | null> {
  const [, userId] = queryKey;
  if (!userId) return null;

  console.log(`Fetching combined profile for user ID: ${userId}`);

  try {
    // Fetch from developer_profiles
    const { data: devData, error: devError, status: devStatus } = await supabase
      .from("developer_profiles")
      .select("*")
      .eq("id", userId) // User corrected this to 'id'
      .single();

    if (devError && devStatus !== 406) { // 406 = row not found, maybe ok
      console.error("Error fetching developer profile data:", devError);
      // Decide how to handle partial failure - maybe return partial data or throw
      // For now, we log and continue, user profile might still exist
    }

    // Fetch from users table (assuming common fields like name, avatar_url, bio are here)
    const { data: userData, error: userError, status: userStatus } =
      await supabase
        .from("users") // Assuming public.users table
        .select("full_name, avatar_url, bio") // Adjust fields as needed
        .eq("id", userId)
        .single();

    if (userError && userStatus !== 406) { // 406 = row not found
      console.error("Error fetching user profile data:", userError);
      // Decide handling - log and continue for now
    }

    // Combine results - ensure DeveloperProfile type includes all fields
    const combinedProfile: FetchedDeveloperProfile = {
      user_id: userId, // Use the id we queried with
      name: userData?.full_name, // Map full_name to name
      avatar_url: userData?.avatar_url,
      bio: userData?.bio,
      ...(devData || {}), // Spread developer-specific data, potentially overwriting if name conflicts
    };

    // If both fetches returned null (status 406), combinedProfile will just have user_id
    // Check if we actually got any data beyond the user_id
    if (!userData && !devData) {
      console.log("No profile data found for user ID:", userId);
      return null; // Return null if neither profile exists
    }

    console.log("Combined profile data fetched:", combinedProfile);
    return combinedProfile;
  } catch (error) {
    console.error("Critical error during combined profile fetch:", error);
    // Re-throw or handle as appropriate for useQuery
    if (error instanceof Error) throw error;
    throw new Error("Failed to fetch profile data");
  }
}

export function useDeveloperProfile(userId: string | undefined) {
  // Use v4 syntax: queryKey is first argument, options object is second (optional)
  // No need for explicit generic types here if TS can infer them correctly now
  const queryKey: DeveloperProfileQueryKey = ["developerProfile", userId];
  return useQuery({
    queryKey: queryKey,
    queryFn: fetchDeveloperProfile,
    // Options object for v4
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000, // Testing if v5 option 'gcTime' is expected
  });
}
