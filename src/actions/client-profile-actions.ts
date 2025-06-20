import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

// Type for the data expected by the upsert function
export interface ClientProfileFormData {
  client_name: string;
  company_name?: string | null;
  logo_url?: string | null;
  website_url?: string | null;
}

// Type for the state returned by the action
export interface ActionState {
  success: boolean;
  message: string;
}

// Server Action to save/update client profile
export async function saveClientProfileAction(
  previousState: ActionState | null, // Required first arg for useActionState
  formData: {
    session: Session | null; // Pass session for auth
    userId: string;
    clientData: ClientProfileFormData;
  }
): Promise<ActionState | null> {
  const { session, userId, clientData } = formData;

  if (!session?.access_token) {
    console.error('Server Action Error: No session token provided.');
    return { success: false, message: 'Authentication required.' };
  }

  if (!clientData.client_name) {
      console.error('Server Action Error: Client name is required.');
      return { success: false, message: 'Client Name cannot be empty.' };
  }

  try {
    const { data, error: functionError } = await supabase.functions.invoke(
      'upsert-client-profile',
      {
        body: clientData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (functionError) {
        console.error('Edge Function invocation error:', functionError);
        throw functionError; // Rethrow Supabase client error
    }

    // Check for errors returned within the function's response body
    if (data?.error) {
        console.error('Edge Function returned error:', data.details || data.error);
        throw new Error(data.error || 'Failed to save profile via Edge Function.');
    }

    return { success: true, message: 'Profile updated successfully!' };

  } catch (error: any) {
    console.error('Server Action Error during profile save:', error);
    return {
      success: false,
      message: `Failed to update profile: ${error.message || 'Unknown error'}`,
    };
  }
}
