// Healthcare module route table. Centralized under @core/routes via re-export.
// Maps 1:1 to Laravel Modules/Healthcare/routes/web.php
import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import { assertOwnedBy } from "@core/dev/routeGuard";
import {
  Healthcare,
  DoctorSelection,
  AppointmentBooking,
  MyHealthTickets,
  LabsBooking,
  SpecialtyBooking,
} from "../index";

const OWNER = "healthcare";

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
