// Healthcare module route table. Centralized under @core/routes via re-export.
// Maps 1:1 to Laravel Modules/Healthcare/routes/web.php.
// NOTE: import page modules directly (not via "../index") to avoid a
// circular dependency — the barrel re-exports this routes file.
import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import { assertOwnedBy, tagOwner } from "@core/dev/routeGuard";
import _Healthcare from "../pages/Healthcare";
import _DoctorSelection from "../pages/DoctorSelection";
import _AppointmentBooking from "../pages/AppointmentBooking";
import _MyHealthTickets from "../pages/MyHealthTickets";
import _LabsBooking from "../pages/LabsBooking";
import _SpecialtyBooking from "../pages/SpecialtyBooking";

const OWNER = "healthcare";
const Healthcare = tagOwner(OWNER, _Healthcare);
const DoctorSelection = tagOwner(OWNER, _DoctorSelection);
const AppointmentBooking = tagOwner(OWNER, _AppointmentBooking);
const MyHealthTickets = tagOwner(OWNER, _MyHealthTickets);
const LabsBooking = tagOwner(OWNER, _LabsBooking);
const SpecialtyBooking = tagOwner(OWNER, _SpecialtyBooking);

export const healthcareRoutes = (
  <>
    <Route path="/healthcare" element={assertOwnedBy(OWNER, Healthcare)} />
    <Route path="/healthcare/labs" element={assertOwnedBy(OWNER, LabsBooking)} />
    <Route path="/healthcare/specialty/:specialty" element={assertOwnedBy(OWNER, SpecialtyBooking)} />
    <Route path="/healthcare/book" element={assertOwnedBy(OWNER, DoctorSelection)} />
    <Route path="/healthcare/book/:doctorId" element={<ProtectedRoute>{assertOwnedBy(OWNER, AppointmentBooking)}</ProtectedRoute>} />
    <Route path="/healthcare/tickets" element={<ProtectedRoute>{assertOwnedBy(OWNER, MyHealthTickets)}</ProtectedRoute>} />
  </>
);

