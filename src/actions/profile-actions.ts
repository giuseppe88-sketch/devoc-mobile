import { supabase } from '../lib/supabase';
import type { DeveloperProfile } from '../types';

// --- Types --- 
// Define the expected shape of the action state
export interface ActionState {
  success: boolean;
  message?: string;
}

// Define UserProfileData type based on users table fields being updated
export interface UserProfileData {
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  // Add other fields from 'users' table if they are updatable here
}

// Define the type for the form data passed to the action
export type ProfileFormData = Partial<Omit<DeveloperProfile, 'user_id'>>;

// --- Server Action --- 
// This function handles the logic for saving the profile.
export async function saveProfileAction(
  previousState: ActionState | null, 
  formData: { user_id: string, userData: Partial<UserProfileData>, devData: ProfileFormData } 
): Promise<ActionState> {
  const { user_id, userData, devData } = formData;

  console.log("Action triggered. Updating user data:", userData);
  console.log("Action triggered. Upserting dev data:", devData);

  try {
    // 1. Update public.users table (only if userData has keys)
    if (Object.keys(userData).length > 0) {
      const { error: userUpdateError } = await supabase
        .from('users')
        .update(userData)
        .eq('id', user_id);

      if (userUpdateError) {
        console.error('User update error:', userUpdateError);
        return { success: false, message: `Failed to update user profile: ${userUpdateError.message}` };
      }
    }

    // 2. Upsert into developer_profiles using the Edge Function
    const { data: functionData, error: functionError } = await supabase.functions.invoke(
      'upsert-developer-profile', 
      {
        // Pass data structured as the function expects
        body: { ...devData, id: user_id }, 
      }
    );

    if (functionError) {
      console.error('Edge function error:', functionError);
      // Attempt to parse Supabase Edge Function error details if available
      const detailedMessage = (functionError as any).context?.errorMessage || functionError.message;
      return { success: false, message: `Failed to update developer details: ${detailedMessage}` };
    }

    console.log('Edge function success:', functionData);
    return { success: true, message: 'Profile updated successfully!' };

  } catch (err: any) {
    console.error('Unexpected error in saveProfileAction:', err);
    return { success: false, message: err.message || 'An unexpected error occurred during save.' };
  }
}
