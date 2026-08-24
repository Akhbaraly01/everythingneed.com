// Public API for the "healthcare" module.
// Other modules MUST import only from "@modules/healthcare", never reach into
// subfolders. Maps 1:1 to a future Laravel Modules/Healthcare package.
import { tagOwner } from "@core/dev/routeGuard";
import _Healthcare from "./pages/Healthcare";
import _DoctorSelection from "./pages/DoctorSelection";
import _SpecialtyBooking from "./pages/SpecialtyBooking";
import _AppointmentBooking from "./pages/AppointmentBooking";
import _MyHealthTickets from "./pages/MyHealthTickets";
import _LabsBooking from "./pages/LabsBooking";

export const Healthcare = tagOwner("healthcare", _Healthcare);
export const DoctorSelection = tagOwner("healthcare", _DoctorSelection);
export const SpecialtyBooking = tagOwner("healthcare", _SpecialtyBooking);
export const AppointmentBooking = tagOwner("healthcare", _AppointmentBooking);
export const MyHealthTickets = tagOwner("healthcare", _MyHealthTickets);
export const LabsBooking = tagOwner("healthcare", _LabsBooking);
export { default as AppointmentCalendar } from "./components/AppointmentCalendar";
export { default as DoctorProfilePage } from "./pages/DoctorProfilePage";
export { default as MyAppointmentsPage } from "./pages/MyAppointmentsPage";
export { default as PrescriptionsPage } from "./pages/PrescriptionsPage";
export { healthcareRoutes } from "./routes";
