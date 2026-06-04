// Public API for the "healthcare" module.
// Other modules MUST import only from "@modules/healthcare", never reach into
// subfolders. This is the seam that lets us physically relocate files later
// (and ultimately migrate to a Laravel Modules/Healthcare package)
// without breaking consumers.

export { default as Healthcare } from "@/pages/Healthcare";
export { default as DoctorSelection } from "@/pages/healthcare/DoctorSelection";
export { default as SpecialtyBooking } from "@/pages/healthcare/SpecialtyBooking";
export { default as AppointmentBooking } from "@/pages/healthcare/AppointmentBooking";
export { default as MyHealthTickets } from "@/pages/healthcare/MyHealthTickets";
export { default as LabsBooking } from "@/pages/healthcare/LabsBooking";
export { default as AppointmentCalendar } from "@/components/healthcare/AppointmentCalendar";
