import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import OrderHistory from "@/pages/pharmacy/OrderHistory";
import Wallet from "@/pages/account/Wallet";
import {
  AccountPage,
  Dashboard,
  NotificationSettings,
  Certificates,
  Wishlist,
  LearningDashboard,
} from "../index";

export const accountRoutes = (
  <>
    <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
    <Route path="/account/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/account/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
    <Route path="/account/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
    <Route path="/account/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
    <Route path="/account/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
    <Route path="/account/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
    <Route path="/account/learning" element={<ProtectedRoute><LearningDashboard /></ProtectedRoute>} />
  </>
);
