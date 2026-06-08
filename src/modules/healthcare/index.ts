// Public API for the "healthcare" module.
// Other modules MUST import only from "@modules/healthcare", never reach into
// subfolders. Maps 1:1 to a future Laravel Modules/Healthcare package.

export { default as Healthcare } from "./pages/Healthcare";
export { default as DoctorSelection } from "./pages/DoctorSelection";
export { default as SpecialtyBooking } from "./pages/SpecialtyBooking";
export { default as AppointmentBooking } from "./pages/AppointmentBooking";
export { default as MyHealthTickets } from "./pages/MyHealthTickets";
export { default as LabsBooking } from "./pages/LabsBooking";
export { default as AppointmentCalendar } from "./components/AppointmentCalendar";
export { healthcareRoutes } from "./routes";
