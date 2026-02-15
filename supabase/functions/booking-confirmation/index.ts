import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketNumber, patientName, doctorName, appointmentDate, appointmentTime, consultationType, consultationFee, patientEmail } = await req.json();

    console.log(`Booking confirmed: ${ticketNumber} for ${patientName} with ${doctorName || 'Auto-assigned'} on ${appointmentDate} at ${appointmentTime}`);

    // Generate email content using Lovable AI
    const aiResponse = await fetch("https://lovable.dev/api/llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "You are a professional healthcare email assistant. Generate a concise, friendly HTML email body for appointment confirmations. Use clean formatting with inline styles. Do NOT include <html>, <head>, or <body> tags - just the inner content. Keep it brief and professional."
          },
          {
            role: "user",
            content: `Generate an appointment confirmation email with these details:
- Patient: ${patientName}
- Doctor: ${doctorName || "To be assigned"}
- Date: ${appointmentDate}
- Time: ${appointmentTime}
- Type: ${consultationType === "virtual" ? "Virtual (Video Call)" : "Physical (In-Person)"}
- Fee: $${consultationFee}
- Ticket Number: ${ticketNumber}

Include a warm greeting, the appointment details in a styled card, and a note about cancellation policy.`
          }
        ]
      })
    });

    let emailHtml = "";
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      emailHtml = aiData.choices?.[0]?.message?.content || "";
    }

    // Fallback email template if AI fails
    if (!emailHtml) {
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Appointment Confirmed ✓</h1>
          </div>
          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0;">
            <p>Dear <strong>${patientName}</strong>,</p>
            <p>Your appointment has been successfully booked.</p>
            <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #e2e8f0;">
              <p style="margin: 4px 0;"><strong>Ticket:</strong> ${ticketNumber}</p>
              <p style="margin: 4px 0;"><strong>Doctor:</strong> ${doctorName || "To be assigned"}</p>
              <p style="margin: 4px 0;"><strong>Date:</strong> ${appointmentDate}</p>
              <p style="margin: 4px 0;"><strong>Time:</strong> ${appointmentTime}</p>
              <p style="margin: 4px 0;"><strong>Type:</strong> ${consultationType === "virtual" ? "Virtual (Video Call)" : "Physical (In-Person)"}</p>
              <p style="margin: 4px 0;"><strong>Fee:</strong> $${consultationFee}</p>
            </div>
            <p style="font-size: 13px; color: #64748b;">You can cancel or reschedule up to 24 hours before your appointment from your health tickets page.</p>
          </div>
          <div style="background: #1e293b; padding: 16px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: #94a3b8; margin: 0; font-size: 12px;">EverythingNeed Healthcare</p>
          </div>
        </div>`;
    }

    // Send email notification via Supabase Auth admin (or log for now)
    // In production, integrate with Resend/SendGrid here
    console.log(`Email content generated for ${patientEmail}`);
    console.log(`Email HTML length: ${emailHtml.length} chars`);

    // Store notification in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Get patient user ID from email
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", patientEmail)
      .single();

    if (profile) {
      await supabaseAdmin.from("notifications").insert({
        user_id: profile.id,
        title: "Appointment Confirmed",
        message: `Your appointment ${ticketNumber} on ${appointmentDate} at ${appointmentTime} with ${doctorName || "auto-assigned doctor"} has been confirmed. Fee: $${consultationFee}.`,
        type: "healthcare",
        related_id: ticketNumber,
      });
    }

    const confirmationData = {
      success: true,
      message: "Booking confirmation processed and notification sent",
      emailGenerated: !!emailHtml,
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
