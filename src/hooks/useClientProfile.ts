import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { FetchedClientProfile, ClientProfile } from '../types';

// Fetches combined user and client profile data
async function fetchClientProfile(userId: string): Promise<FetchedClientProfile | null> {
  if (!userId) {
    // console.log('fetchClientProfile called without userId'); // Commented out to reduce noise
    return null;
  }

  // console.log(`Fetching client profile data for user ID: ${userId}`); // Commented out to reduce noise

  try {
    // Fetch user data (e.g., email)
    const { data: userData, error: userError, status: userStatus } = await supabase
      .from('users')
      .select('id, email') // Select specific fields needed from users
      .eq('id', userId)
      .single();

    // Fetch client profile data
    const { data: clientData, error: clientError, status: clientStatus } = await supabase
      .from('client_profiles')
      .select('*') // Select all client-specific fields
      .eq('id', userId)
      .single();

    // Log errors if they are not 'row not found' (406)
    if (userError && userStatus !== 406) {
      // console.error('Error fetching user data for client profile:', userError); // Commented out to reduce noise
    }
    if (clientError && clientStatus !== 406) {
      // console.error('Error fetching client_profiles data:', clientError); // Commented out to reduce noise
    }

    // If neither record exists, return null
    if (!userData && !clientData) {
      // console.log('No user or client_profiles record found for user ID:', userId); // Commented out to reduce noise
      return null;
    }

    // Combine results
    const combinedProfile: FetchedClientProfile = {
      // Start with client-specific data, ensuring base ClientProfile fields are present
      ...(clientData || { id: userId, client_name: '', created_at: new Date().toISOString() }), // Provide defaults if clientData is null
      user_id: userId, // Explicitly set user_id
      email: userData?.email, // Add email from user data
      // Add any other relevant fields from userData here
    };

    // console.log('Combined client profile data fetched:', combinedProfile); // Commented out to reduce noise
    return combinedProfile;

  } catch (error) {
    // console.error('Critical error during combined client profile fetch:', error); // Commented out to reduce noise
    if (error instanceof Error) throw error;
    throw new Error('Failed to fetch client profile data');
  }
}

// Custom hook to use the fetchClientProfile function with React Query
export function useClientProfile(userId: string | undefined) {
  return useQuery<FetchedClientProfile | null, Error>({
    queryKey: ['clientProfile', userId], // Query key: includes hook name and userId
    queryFn: () => fetchClientProfile(userId!), // Query function: calls fetcher, non-null assertion safe due to 'enabled'
    enabled: !!userId, // Only run the query if userId is truthy
    staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Data stays in cache for 10 minutes (renamed from cacheTime)
    retry: 1, // Retry failed requests once
    // You might want to add placeholderData or initialData if needed
  });
}
