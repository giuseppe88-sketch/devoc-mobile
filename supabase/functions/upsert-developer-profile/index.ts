// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'; // Use full JSR specifier
import { createClient } from 'npm:@supabase/supabase-js@2'; // Use full NPM specifier
import { corsHeaders } from '../_shared/cors.ts'; // Use direct relative path

// Define the expected structure for the profile data
interface ProfileData {
  phone_number?: string;
  skills?: string[];
  focus_areas?: string[];
  portfolio_url?: string;
  github_url?: string;
  hourly_rate?: number;
  location?: string;
  years_of_experience?: number;
  portfolio_image_url?: string; // Added portfolio image URL
}


Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Ensure the request method is POST
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Get User ID from Auth Header ---
    // Create a Supabase client with the Auth context of the logged-in user.
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default when deployed.
      Deno.env.get("SUPABASE_URL") ?? "",
      // Supabase API ANON KEY - env var exported by default when deployed.
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      // Create client with Auth context of the user that called the function.
      // This way RLS policies are applied.
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );
    // Now we can get the session or user object
    const { data: { user }, error: userError } = await supabaseClient.auth
      .getUser();

    if (userError || !user) {
      console.error("User auth error:", userError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Parse Request Body ---
    const profileData: Partial<ProfileData> = await req.json();
    // Basic validation (check if required fields are provided)
    if (
      !profileData.phone_number && !profileData.skills &&
      !profileData.focus_areas && !profileData.portfolio_url &&
      !profileData.github_url && !profileData.hourly_rate &&
      !profileData.location && !profileData.years_of_experience
    ) {
      return new Response(JSON.stringify({ error: "Missing required field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Prepare Data for Upsert ---
    // We use the user's ID as the primary key or unique identifier in the profiles table.
    const dataToUpsert = {
      id: user.id, // Link to auth.users table
      updated_at: new Date().toISOString(),
      phone_number: profileData.phone_number ?? null,
      skills: profileData.skills ?? null,
      focus_areas: profileData.focus_areas ?? null,
      portfolio_url: profileData.portfolio_url ?? null,
      github_url: profileData.github_url ?? null,
      hourly_rate: profileData.hourly_rate ?? null,
      location: profileData.location ?? null,
      years_of_experience: profileData.years_of_experience ?? null,
      portfolio_image_url: profileData.portfolio_image_url ?? null, // Added portfolio image URL
    };

    // --- Upsert Profile Data (Replaced with Select then Insert/Update) ---
    let data, dbError;

    try {
      const { data: existingProfile, error: selectError } = await supabaseClient
        .from("developer_profiles")
        .select("id") // Select only the id to check for existence
        .eq("id", user.id)
        .maybeSingle(); // Returns null if not found, doesn't throw error

      if (selectError) {
        console.error("Error during SELECT:", selectError);
        dbError = selectError;
        throw selectError; // Throw to be caught by outer catch block
      }

      if (existingProfile) {
        // --- UPDATE existing profile ---
        const { data: updateData, error: updateError } = await supabaseClient
          .from("developer_profiles")
          .update(dataToUpsert) // dataToUpsert includes id and updated_at
          .eq("id", user.id)
          .select()
          .single();
        data = updateData;
        dbError = updateError;
        if (updateError) console.error("Error during UPDATE:", updateError);
      } else {
        // --- INSERT new profile ---
        const { data: insertData, error: insertError } = await supabaseClient
          .from("developer_profiles")
          .insert(dataToUpsert) // dataToUpsert includes id and updated_at
          .select()
          .single();
        data = insertData;
        dbError = insertError;
        if (insertError) console.error("Error during INSERT:", insertError);
      }
    } catch (error) {
      // Catch errors specifically from select/insert/update if they were thrown
      console.error("Caught error during DB operation:", error);
      // Ensure dbError is set if it wasn't already (e.g., unexpected error)
      let errorMessage = "Unknown DB operation error";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      if (!dbError) dbError = { message: errorMessage, details: error };
    }

    // --- Handle potential errors from Insert/Update ---
    if (dbError) {
      // Use the already logged specific error if available
      console.error("Final Database error check:", dbError);
      return new Response(
        JSON.stringify({ error: "Database error", details: dbError }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // --- Return Success Response ---
    return new Response(JSON.stringify({ profile: data }), {
      status: 200, // 200 OK for upsert, could use 201 if only inserting
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function error:", (err as Error).message);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: (err as Error)?.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

/* To invoke locally:

  1. Make sure you have a `developer_profiles` table created.
  2. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  3. Make an HTTP request (replace ANON_KEY and profile data):

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-developer-profile' \
    --header 'Authorization: Bearer YOUR_USER_JWT_TOKEN' \
    --header 'Content-Type: application/json' \
    --data '{
      "phone_number": "1234567890",
      "skills": ["Analytical Engine", "Mathematics"],
      "focus_areas": ["Early Computing"],
      "hourly_rate": 100
    }'

*/
