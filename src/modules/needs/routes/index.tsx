import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import { NeedCategoryPage, SubmitRequest } from "../index";

export const needsRoutes = (
  <>
    <Route path="/needs/request" element={<ProtectedRoute><SubmitRequest /></ProtectedRoute>} />
    <Route path="/needs/:slug" element={<NeedCategoryPage />} />
  </>
);
