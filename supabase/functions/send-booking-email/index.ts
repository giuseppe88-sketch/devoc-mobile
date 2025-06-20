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
  bookingStartTimeISO?: string; // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
  bookingEndTimeISO?: string;   // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
}

// Helper function to format ISO date string for Google Calendar URL (YYYYMMDDTHHmmssZ)
function formatGoogleCalendarDate(isoDateString?: string): string {
  if (!isoDateString) return "";
  try {
    const date = new Date(isoDateString);
    // Ensure the date is valid
    if (isNaN(date.getTime())) {
        console.warn(`[send-booking-email] Invalid date string for formatting: ${isoDateString}`);
        return "";
    }
    return date.toISOString().replace(/-|:|\.\d{3}/g, "");
  } catch (e) {
    console.error(`[send-booking-email] Error formatting date string ${isoDateString}:`, e);
    return "";
  }
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL_ADDRESS = "onboarding@resend.dev"; // For testing


serve(async (req: Request) => {
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

    // Format the date and time to be unambiguous (UTC)
    let displayDateTime = `
      <li><strong>Date:</strong> ${bookingDetails.bookingDate}</li>
      <li><strong>Time:</strong> ${bookingDetails.bookingTime}</li>
    `;

    if (bookingDetails.bookingStartTimeISO) {
      try {
        const date = new Date(bookingDetails.bookingStartTimeISO);
        const options: Intl.DateTimeFormatOptions = {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Rome',
          timeZoneName: 'short',
          hour12: true,
        };
        const formattedDateTime = new Intl.DateTimeFormat('en-US', options).format(date);
        displayDateTime = `<li><strong>Time:</strong> ${formattedDateTime}</li>`;
      } catch (e) {
        console.error(`[send-booking-email] Error formatting ISO date: ${e}`);
        // Fallback to original strings if formatting fails
      }
    }

    // Format dates for Google Calendar if ISO times are provided
    const googleCalendarStartTime = formatGoogleCalendarDate(bookingDetails.bookingStartTimeISO);
    const googleCalendarEndTime = formatGoogleCalendarDate(bookingDetails.bookingEndTimeISO);

    let googleCalendarLink = "";
    if (googleCalendarStartTime && googleCalendarEndTime && bookingDetails.clientName && bookingDetails.developerName) {
      const eventText = `First Call: ${bookingDetails.clientName} with ${bookingDetails.developerName}`;
      const eventDetails = `Booking for a first call session.\nClient: ${bookingDetails.clientName}\nDeveloper: ${bookingDetails.developerName}`;
      googleCalendarLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventText)}&dates=${googleCalendarStartTime}/${googleCalendarEndTime}&details=${encodeURIComponent(eventDetails)}`;
    }

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
          ${displayDateTime}
          <li><strong>Duration:</strong> Up to 1 hour</li>
        </ul>
        ${googleCalendarLink ? `<p><a href="${googleCalendarLink}" target="_blank">Add to Google Calendar</a></p>` : ''}
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
          ${displayDateTime}
          <li><strong>Duration:</strong> Up to 1 hour</li>
        </ul>
        ${googleCalendarLink ? `<p><a href="${googleCalendarLink}" target="_blank">Add to Google Calendar</a></p>` : ''}
        <p>Please prepare for the session.</p>
        <p>Best regards,</p>
        <p>The DevConnect Team</p>
      `,
    };

    // Send both emails
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
    } 
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
