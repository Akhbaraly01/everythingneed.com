import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { ticketNumber, patientName, doctorName, appointmentDate, appointmentTime, consultationType, consultationFee, patientEmail } = await req.json();

    // Log the booking confirmation
    console.log(`Booking confirmed: ${ticketNumber} for ${patientName} with ${doctorName || 'Auto-assigned'} on ${appointmentDate} at ${appointmentTime}`);

    const confirmationData = {
      success: true,
      message: "Booking confirmation processed",
      confirmation: {
        ticketNumber,
        patientName,
        doctorName: doctorName || "To be assigned",
        appointmentDate,
        appointmentTime,
        consultationType,
        consultationFee,
        status: "confirmed",
        createdAt: new Date().toISOString(),
      }
    };

    return new Response(JSON.stringify(confirmationData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing booking confirmation:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
