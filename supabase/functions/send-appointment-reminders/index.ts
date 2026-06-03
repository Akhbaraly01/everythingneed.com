import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Sends reminder notifications for appointments happening within the next
 * 24 hours. Designed to be invoked on a cron schedule (e.g., hourly).
 *
 * Idempotency: skips tickets that already have a notification with
 * type='healthcare_reminder' and related_id=ticket_number.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const today = now.toISOString().slice(0, 10);
    const tomorrow = in24h.toISOString().slice(0, 10);

    const { data: tickets, error } = await supabase
      .from("health_tickets")
      .select(
        "id, ticket_number, patient_id, doctor_id, appointment_date, appointment_time, consultation_type, status, doctors(full_name)"
      )
      .in("status", ["pending", "assigned"])
      .gte("appointment_date", today)
      .lte("appointment_date", tomorrow);

    if (error) throw error;

    const candidates = (tickets || []).filter((t: any) => {
      if (!t.appointment_date) return false;
      const dt = new Date(
        `${t.appointment_date}T${t.appointment_time || "00:00"}:00Z`,
      );
      const diff = dt.getTime() - now.getTime();
      return diff > 0 && diff <= 24 * 60 * 60 * 1000;
    });

    let sent = 0;
    let skipped = 0;

    for (const t of candidates) {
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", t.patient_id)
        .eq("type", "healthcare_reminder")
        .eq("related_id", t.id)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const doctorName =
        (t as any).doctors?.full_name || "your assigned doctor";
      const typeLabel =
        t.consultation_type === "virtual" ? "Virtual consultation" : "In-person visit";

      const { error: insErr } = await supabase.from("notifications").insert({
        user_id: t.patient_id,
        title: "Appointment Reminder",
        message: `${typeLabel} with Dr. ${doctorName} on ${t.appointment_date} at ${t.appointment_time}. Ticket: ${t.ticket_number}.`,
        type: "healthcare_reminder",
        related_id: t.id,
      });

      if (!insErr) sent++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        scanned: tickets?.length || 0,
        candidates: candidates.length,
        sent,
        skipped,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Reminder error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
