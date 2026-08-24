import { Route } from "react-router-dom";
// eslint-disable-next-line no-restricted-imports -- ProtectedRoute is a shared auth guard
import { ProtectedRoute } from "@modules/authentication";
import NeedsDashboard from "../pages/NeedsDashboard";
// eslint-disable-next-line no-restricted-imports -- NeedCategoryPage and SubmitRequest belong to needs module
import { NeedCategoryPage, SubmitRequest } from "@modules/needs";

export const needsRoutes = (
  <>
    <Route path="/needs" element={<NeedsDashboard />} />
    <Route path="/needs/request" element={<ProtectedRoute><SubmitRequest /></ProtectedRoute>} />
    <Route path="/needs/:slug" element={<NeedCategoryPage />} />
  </>
);
