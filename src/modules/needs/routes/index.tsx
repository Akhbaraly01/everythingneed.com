import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import NeedsDashboard from "../pages/NeedsDashboard";
import NeedCategoryPage from "@/pages/needs/NeedCategoryPage";
import SubmitRequest from "@/pages/needs/SubmitRequest";

export const needsRoutes = (
  <>
    <Route path="/needs" element={<NeedsDashboard />} />
    <Route path="/needs/request" element={<ProtectedRoute><SubmitRequest /></ProtectedRoute>} />
    <Route path="/needs/:slug" element={<NeedCategoryPage />} />
  </>
);
