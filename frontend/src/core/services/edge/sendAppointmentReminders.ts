/**
 * Appointment reminder service.
 * Sends reminder notifications for appointments happening within 24 hours.
 *
 * Laravel mapping: Modules/Healthcare/Jobs/SendAppointmentRemindersJob.php
 */
import { dataClient } from "@core/services";
import { logger } from "@core/logging";

export interface ReminderResult {
  success: boolean;
  scanned: number;
  candidates: number;
  sent: number;
  skipped: number;
}

export async function sendAppointmentReminders(): Promise<ReminderResult> {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const today = now.toISOString().slice(0, 10);
  const tomorrow = in24h.toISOString().slice(0, 10);

  logger.info("[reminders]", `Scanning appointments from ${today} to ${tomorrow}`);

  try {
    // Query health tickets in the next 24 hours
    const tickets = await dataClient
      .from("health_tickets")
      .select("*")
      .where("status", "in", ["pending", "assigned"]);

    const ticketList = Array.isArray(tickets) ? tickets : [];
    let sent = 0;
    let skipped = 0;

    for (const ticket of ticketList) {
      if (!("appointment_date" in ticket) || !ticket.appointment_date) continue;

      const appointmentDate = ticket.appointment_date as string;
      if (appointmentDate < today || appointmentDate > tomorrow) continue;

      // Check if reminder already sent
      const existing = await dataClient
        .from("notifications")
        .select("id")
        .where("type", "=", "healthcare_reminder")
        .where("related_id", "=", ticket.id);

      const existingList = Array.isArray(existing) ? existing : [];
      if (existingList.length > 0) {
        skipped++;
        continue;
      }

      const patientId = ticket.patient_id as string;
      const ticketNumber = ticket.ticket_number as string;
      const appointmentTime = (ticket.appointment_time as string) || "00:00";
      const consultationType = (ticket.consultation_type as string) || "consultation";
      const typeLabel = consultationType === "virtual" ? "Virtual consultation" : "In-person visit";

      await dataClient.from("notifications").insert({
        user_id: patientId,
        title: "Appointment Reminder",
        message: `${typeLabel} on ${appointmentDate} at ${appointmentTime}. Ticket: ${ticketNumber}.`,
        type: "healthcare_reminder",
        related_id: ticket.id,
        is_read: false,
      });

      sent++;
    }

    logger.info("[reminders]", `Done: ${sent} sent, ${skipped} skipped`);

    return {
      success: true,
      scanned: ticketList.length,
      candidates: ticketList.filter((t) => "appointment_date" in t && t.appointment_date).length,
      sent,
      skipped,
    };
  } catch (err) {
    logger.error("[reminders]", err);
    throw err;
  }
}
