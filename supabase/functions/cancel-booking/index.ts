// supabase/functions/cancel-booking/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

interface CancelBookingRequest {
  bookingId: string;
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
      console.error('User not authenticated for cancellation:', userError);
      return new Response(JSON.stringify({ success: false, error: 'User not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const requestingClientId = user.id;

    const { bookingId }: CancelBookingRequest = await req.json();

    if (!bookingId) {
      return new Response(JSON.stringify({ success: false, error: 'Missing bookingId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Call the RPC function to cancel the booking and reactivate the slot
    const { data: rpcResponse, error: rpcError } = await supabaseClient.rpc('cancel_booking_and_reactivate_slot', {
      p_booking_id: bookingId,
      p_requesting_client_id: requestingClientId,
    });

    if (rpcError) {
      console.error('Error calling cancel_booking_and_reactivate_slot RPC:', rpcError);
      // The RPC function itself returns a JSONB with success/error, so we might not hit this often
      // unless there's a fundamental issue calling the RPC.
      return new Response(JSON.stringify({ success: false, error: `RPC Error: ${rpcError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500, 
      });
    }

    // The rpcResponse from cancel_booking_and_reactivate_slot is already a JSONB object
    // like { success: true, message: "..." } or { success: false, error: "...", message: "..." }
    // We determine the status code based on its success field.
    const statusCode = rpcResponse.success ? 200 : 400; // Or map specific errors to other codes e.g. 401, 404

    return new Response(JSON.stringify(rpcResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });

  } catch (error) {
    console.error('Unexpected error in cancel-booking function:', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
