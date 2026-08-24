import { Route } from "react-router-dom";
// eslint-disable-next-line no-restricted-imports -- ProtectedRoute is a shared auth guard
import { ProtectedRoute } from "@modules/authentication";
// eslint-disable-next-line no-restricted-imports -- OrderHistory is a shared pharmacy page
import OrderHistory from "@modules/pharmacy/pages/OrderHistory";
// eslint-disable-next-line no-restricted-imports -- Wallet is a shared wallets page
import { Wallet } from "@modules/wallets";
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
