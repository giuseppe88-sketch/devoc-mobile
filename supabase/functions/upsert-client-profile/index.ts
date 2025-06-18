// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"; // Use full JSR specifier
import { createClient } from "npm:@supabase/supabase-js@2"; // Use full NPM specifier
import { corsHeaders } from "../_shared/cors.ts"; // Use direct relative path

// Define the expected structure for the client profile data
interface ProfileData {
  client_name: string; // Required field
  company_name?: string;
  logo_url?: string;
  website_url?: string;
}

console.log('"upsert-client-profile" function initialized');

// Log crucial environment variables for debugging local setup
console.log(`SUPABASE_URL: ${Deno.env.get("SUPABASE_URL")}`);
console.log(`SUPABASE_ANON_KEY: ${Deno.env.get("SUPABASE_ANON_KEY")}`);
console.log(
  `SUPABASE_SERVICE_ROLE_KEY: ${
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ? "Loaded" : "NOT LOADED"
  }`,
);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request for upsert-client-profile...");
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

    // --- Get User ID from Auth Header --- (Client for Auth)
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    const { data: { user }, error: userError } = await authClient.auth
      .getUser();

    if (userError || !user) {
      console.error("User auth error:", userError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Successfully retrieved user:", user);

    // --- Parse Request Body ---
    const profileData: Partial<ProfileData> = await req.json();
    console.log("Parsed client profile data from body:", profileData);

    // Basic validation (check if required fields are provided)
    if (!profileData.client_name) { // client_name is required
      return new Response(
        JSON.stringify({ error: "Missing required field: client_name" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // --- Prepare Data for Upsert ---
    const dataToUpsert = {
      id: user.id, // Link to auth.users table
      updated_at: new Date().toISOString(),
      client_name: profileData.client_name,
      company_name: profileData.company_name ?? null,
      logo_url: profileData.logo_url ?? null,
      website_url: profileData.website_url ?? null,
      // created_at is handled by default in DB
    };

    // --- Create a new Supabase client for database operations using SERVICE_ROLE_KEY ---
    const adminSupabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      // No global auth header here, this client uses the service role
    );

    // --- Upsert Profile Data (Select then Insert/Update) ---
    let data, dbError;

    try {
      console.log(
        `Attempting to SELECT client profile for user ID: ${user.id}`,
      );
      const { data: existingProfile, error: selectError } =
        await adminSupabaseClient // Use admin client
          .from("client_profiles")
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
        console.log(
          `Client profile found for user ID: ${user.id}. Attempting UPDATE.`,
        );
        const { data: updateData, error: updateError } =
          await adminSupabaseClient // Use admin client
            .from("client_profiles")
            .update(dataToUpsert)
            .eq("id", user.id)
            .select()
            .single();
        data = updateData;
        dbError = updateError;
        if (updateError) console.error("Error during UPDATE:", updateError);
      } else {
        // --- INSERT new profile ---
        console.log(
          `No client profile found for user ID: ${user.id}. Attempting INSERT.`,
        );
        const { data: insertData, error: insertError } =
          await adminSupabaseClient // Use admin client
            .from("client_profiles")
            .insert(dataToUpsert)
            .select()
            .single();
        data = insertData;
        dbError = insertError;
        if (insertError) console.error("Error during INSERT:", insertError);
      }
    } catch (error) {
      // Catch errors specifically from select/insert/update if they were thrown
      console.error("Caught error during DB operation:", error);
      let errorMessage = "Unknown DB operation error";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      if (!dbError) dbError = { message: errorMessage, details: String(error) };
    }

    // --- Handle potential errors from Insert/Update ---
    if (dbError) {
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
      status: 200,
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

  1. Make sure you have a `client_profiles` table created.
  2. Run `supabase start`
  3. Make an HTTP request (replace YOUR_USER_JWT_TOKEN and profile data):

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/upsert-client-profile' \
    --header 'Authorization: Bearer YOUR_USER_JWT_TOKEN' \
    --header 'Content-Type: application/json' \
    --data '{ \
      "client_name": "Example Client", \
      "company_name": "Example Corp", \
      "logo_url": "http://example.com/logo.png", \
      "website_url": "http://example.com" \
    }'
*/
