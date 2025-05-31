// supabase/functions/create-booking/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface BookingRequest {
  developerId: string;
  slotId: string; // This is the ID from developer_first_call_availability
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get the currently authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const clientId = user.id;

    const { developerId, slotId }: BookingRequest = await req.json();

    if (!developerId || !slotId) {
      return new Response(JSON.stringify({ error: 'Missing developerId or slotId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Perform the booking logic as a transaction via RPC
    const { data: bookingResult, error: transactionError } = await supabaseClient.rpc('create_booking_and_update_slot', {
      p_client_id: clientId,
      p_developer_id: developerId,
      p_slot_id: slotId,
    });

    if (transactionError) {
      console.error('Error in booking transaction:', transactionError);
      let statusCode = 500;
      let errorMessage = transactionError.message;
      
      if (transactionError.message.includes('slot_not_found')) {
        statusCode = 404;
        errorMessage = 'Availability slot not found or not active.';
      } else if (transactionError.message.includes('slot_already_booked')) {
        statusCode = 409;
        errorMessage = 'This slot has already been booked.';
      } else if (transactionError.message.includes('developer_not_found')) {
        statusCode = 404;
        errorMessage = 'Developer not found.';
      }
      
      return new Response(JSON.stringify({ error: `Failed to create booking: ${errorMessage}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      });
    }

    return new Response(JSON.stringify({ success: true, booking: bookingResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});