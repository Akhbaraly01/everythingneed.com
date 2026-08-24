/**
 * Booking confirmation service.
 * Generates appointment confirmation content and stores notifications.
 *
 * Laravel mapping: Modules/Healthcare/Actions/ConfirmBookingAction.php
 */
import { dataClient } from "@core/services";
import { logger } from "@core/logging";

export interface BookingConfirmationInput {
  ticketNumber: string;
  patientName: string;
  doctorName: string | null;
  appointmentDate: string;
  appointmentTime: string;
  consultationType: string;
  consultationFee: number;
  patientEmail: string;
}

export interface BookingConfirmationResult {
  success: boolean;
  message: string;
  confirmation: BookingConfirmationInput & { status: string; createdAt: string };
}

export async function confirmBooking(input: BookingConfirmationInput): Promise<BookingConfirmationResult> {
  const {
    ticketNumber,
    patientName,
    doctorName,
    appointmentDate,
    appointmentTime,
    consultationType,
    consultationFee,
    patientEmail,
  } = input;

  logger.info("[bookingConfirmation]", `Processing confirmation for ${ticketNumber}`);

  try {
    // Look up patient profile by email
    const profiles = await dataClient
      .from("profiles")
      .select("id")
      .where("email", "=", patientEmail);

    const profile = Array.isArray(profiles) ? profiles[0] : profiles;

    if (profile && typeof profile === "object" && "id" in profile) {
      // Store notification
      await dataClient.from("notifications").insert({
        user_id: (profile as { id: string }).id,
        title: "Appointment Confirmed",
        message: `Your appointment ${ticketNumber} on ${appointmentDate} at ${appointmentTime} with ${doctorName || "auto-assigned doctor"} has been confirmed. Fee: $${consultationFee}.`,
        type: "healthcare",
        related_id: ticketNumber,
        is_read: false,
      });
    }

    const typeLabel = consultationType === "virtual" ? "Virtual (Video Call)" : "Physical (In-Person)";

    logger.info("[bookingConfirmation]", `Confirmation processed: ${ticketNumber}`);

    return {
      success: true,
      message: "Booking confirmation processed and notification sent",
      confirmation: {
        ticketNumber,
        patientName,
        patientEmail,
        doctorName: doctorName || "To be assigned",
        appointmentDate,
        appointmentTime,
        consultationType: typeLabel,
        consultationFee,
        status: "confirmed",
        createdAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    logger.error("[bookingConfirmation]", err);
    throw err;
  }
}
