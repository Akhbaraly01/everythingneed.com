/**
 * Service adapters implementing @core/contracts.
 * Each adapter maps 1:1 to a Laravel 13 backend service/action and will
 * delegate to REST endpoints as those come online.
 */
export { aiResearchAssistant } from "./aiResearchAssistant";
export type { AiResearchInput } from "./aiResearchAssistant";
export { confirmBooking } from "./bookingConfirmation";
export type { BookingConfirmationInput, BookingConfirmationResult } from "./bookingConfirmation";
export { sendAppointmentReminders } from "./sendAppointmentReminders";
export type { ReminderResult } from "./sendAppointmentReminders";
