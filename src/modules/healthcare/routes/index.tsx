// Healthcare module route table. Centralized under @core/routes via re-export.
// Maps 1:1 to Laravel Modules/Healthcare/routes/web.php
import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Healthcare,
  DoctorSelection,
  AppointmentBooking,
  MyHealthTickets,
  LabsBooking,
  SpecialtyBooking,
} from "../index";

export const healthcareRoutes = (
  <>
    <Route path="/healthcare" element={<Healthcare />} />
    <Route path="/healthcare/labs" element={<LabsBooking />} />
    <Route path="/healthcare/specialty/:specialty" element={<SpecialtyBooking />} />
    <Route path="/healthcare/book" element={<DoctorSelection />} />
    <Route path="/healthcare/book/:doctorId" element={<ProtectedRoute><AppointmentBooking /></ProtectedRoute>} />
    <Route path="/healthcare/tickets" element={<ProtectedRoute><MyHealthTickets /></ProtectedRoute>} />
  </>
);
