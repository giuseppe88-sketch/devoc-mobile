// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "resend"; // Resolved by import_map.json (global or function-specific)

// Define the expected structure of the request body
interface BookingDetails {
  clientName: string;
  clientEmail: string;
  developerName: string;
  developerEmail: string;
  bookingDate: string; // e.g., "June 15, 2024"
  bookingTime: string; // e.g., "10:00 AM PST"
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL_ADDRESS = "onboarding@resend.dev"; // For testing

console.log(
  `[send-booking-email] Attempting to read RESEND_API_KEY. Value: ${
    RESEND_API_KEY ? "Exists" : "MISSING or empty"
  }`,
);

serve(async (req: Request) => {
  console.log("[send-booking-email] Function invoked.");
  console.log("[send-booking-email] All Deno Env Vars:", Deno.env.toObject()); // Log all environment variables
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*", // Adjust for production
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (!RESEND_API_KEY) {
    console.error(
      "[send-booking-email] CRITICAL: RESEND_API_KEY is missing or empty.",
    );
    console.error("RESEND_API_KEY is not set in environment variables.");
    return new Response(
      JSON.stringify({ error: "Internal server configuration error." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }

  const resend = new Resend(RESEND_API_KEY);

  try {
    const bookingDetails: BookingDetails = (await req.json()) as BookingDetails;
    console.log(
      "[send-booking-email] Received booking details for processing:",
      JSON.stringify(bookingDetails, null, 2),
    );

    // Validate payload
    if (
      !bookingDetails.clientName ||
      !bookingDetails.clientEmail ||
      !bookingDetails.developerName ||
      !bookingDetails.developerEmail ||
      !bookingDetails.bookingDate ||
      !bookingDetails.bookingTime
    ) {
      return new Response(
        JSON.stringify({ error: "Missing booking details" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // --- Email to Client ---
    const emailToClient = {
      from: `DevConnect <${FROM_EMAIL_ADDRESS}>`,
      to: [bookingDetails.clientEmail],
      subject: `Your Booking Confirmation with ${bookingDetails.developerName}`,
      html: `
        <h1>Booking Confirmed!</h1>
        <p>Hello ${bookingDetails.clientName},</p>
        <p>Your booking for a First Call session is confirmed:</p>
        <ul>
          <li><strong>Developer:</strong> ${bookingDetails.developerName}</li>
          <li><strong>Date:</strong> ${bookingDetails.bookingDate}</li>
          <li><strong>Time:</strong> ${bookingDetails.bookingTime}</li>
          <li><strong>Duration:</strong> Up to 1 hour</li>
        </ul>
        <p>Thank you for booking with us!</p>
        <p>Best regards,</p>
        <p>The DevConnect Team</p>
      `,
    };

    // --- Email to Developer ---
    const emailToDeveloper = {
      from: `DevConnect <${FROM_EMAIL_ADDRESS}>`,
      to: [bookingDetails.developerEmail],
      subject: `New Booking with ${bookingDetails.clientName}`,
      html: `
        <h1>New Booking Received!</h1>
        <p>Hello ${bookingDetails.developerName},</p>
        <p>You have a new First Call session booking:</p>
        <ul>
          <li><strong>Client:</strong> ${bookingDetails.clientName}</li>
          <li><strong>Client Email:</strong> ${bookingDetails.clientEmail}</li>
          <li><strong>Date:</strong> ${bookingDetails.bookingDate}</li>
          <li><strong>Time:</strong> ${bookingDetails.bookingTime}</li>
          <li><strong>Duration:</strong> Up to 1 hour</li>
        </ul>
        <p>Please prepare for the session.</p>
        <p>Best regards,</p>
        <p>The DevConnect Team</p>
      `,
    };

    // Send both emails
    console.log(
      "[send-booking-email] Attempting to send client email to:",
      emailToClient.to,
    );
    const { data: clientEmailData, error: clientEmailError } = await resend
      .emails.send(emailToClient);
    if (clientEmailError) {
      console.error(
        "[send-booking-email] Resend client email error:",
        clientEmailError,
      );
      console.error("[send-booking-email] Failed client email details:", {
        to: emailToClient.to,
        subject: emailToClient.subject,
        error: clientEmailError,
      });
    } else {
      console.log(
        "[send-booking-email] Client confirmation email sent successfully:",
        {
          to: emailToClient.to,
          subject: emailToClient.subject,
          id: clientEmailData?.id,
        },
      );
    }

    console.log(
      "[send-booking-email] Attempting to send developer email to:",
      emailToDeveloper.to,
    );
    const { data: developerEmailData, error: developerEmailError } =
      await resend.emails.send(emailToDeveloper);
    if (developerEmailError) {
      console.error(
        "[send-booking-email] Resend developer email error:",
        developerEmailError,
      );
      console.error("[send-booking-email] Failed developer email details:", {
        to: emailToDeveloper.to,
        subject: emailToDeveloper.subject,
        error: developerEmailError,
      });
      // If both emails failed, return error
      if (clientEmailError && developerEmailError) {
        return new Response(
          JSON.stringify({
            error: "Failed to send emails",
            clientError: clientEmailError,
            developerError: developerEmailError,
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }
    } else {
      console.log(
        "[send-booking-email] Developer notification email sent successfully:",
        {
          to: emailToDeveloper.to,
          subject: emailToDeveloper.subject,
          id: developerEmailData?.id,
        },
      );
    }

    // If at least one email succeeded or no errors at all
    if (
      (clientEmailData || developerEmailData) &&
      !(clientEmailError && developerEmailError)
    ) {
      return new Response(
        JSON.stringify({ message: "Booking emails processed." }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    } else { // Both failed
      return new Response(
        JSON.stringify({ error: "Failed to send all emails." }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    let errorMessage = "An unknown error occurred during email processing.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (
      typeof error === "object" && error !== null && "message" in error &&
      typeof error.message === "string"
    ) {
      errorMessage = error.message; // Handle cases where error is an object with a message property
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:
    curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-booking-email' \
  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-booking-email' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
