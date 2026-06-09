import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { CompareProvider } from "@/contexts/CompareContext";
import { CartDrawerProvider } from "@/contexts/CartDrawerContext";
import CompareDrawer from "@/components/compare/CompareDrawer";
import GlobalCartDrawer from "@/components/GlobalCartDrawer";
import Layout from "./components/Layout";
import { EventBusDevBridge } from "@core/dev/EventBusDevBridge";
import ScrollToTop from "./components/ScrollToTop";
import Deals from "./pages/Deals";
import { homeRoutes } from "@modules/home";
import { needsRoutes } from "@modules/needs";
import { learnRoutes } from "@modules/learn";
import { accountRoutes } from "@modules/users";
import { healthcareRoutes } from "@modules/healthcare";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Transportation from "./pages/deals/Transportation";
import Hotels from "./pages/deals/Hotels";
import Tasks from "./pages/deals/Tasks";
import Jobs from "./pages/deals/Jobs";
import Agriculture from "./pages/deals/Agriculture";
import Food from "./pages/deals/Food";
import RealEstate from "./pages/deals/RealEstate";
import Booking from "./pages/deals/Booking";
import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import CategoryAdminDashboard from "./pages/admin/CategoryAdminDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TicketList from "./pages/support/TicketList";
import CreateTicket from "./pages/support/CreateTicket";
import TicketDetail from "./pages/support/TicketDetail";
import PharmacyPage from "./pages/pharmacy/PharmacyPage";
import CheckoutPage from "./pages/pharmacy/CheckoutPage";
import OrderConfirmation from "./pages/pharmacy/OrderConfirmation";
import EnhancedVendorDashboard from "./pages/vendor/EnhancedVendorDashboard";
import VendorRegistration from "./pages/vendor/VendorRegistration";
import ProductDetail from "./pages/product/ProductDetail";
import BuildingServices from "./pages/BuildingServices";
import ExpertsDirectory from "./pages/experts/ExpertsDirectory";
import ExpertProfile from "./pages/experts/ExpertProfile";
import VendorAnalytics from "./pages/vendor/VendorAnalytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <CurrencyProvider>
              <CompareProvider>
              <CartProvider>
                <CartDrawerProvider>
                <ScrollToTop />
                <EventBusDevBridge />
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route
                  path="/*"
                  element={
                    <Layout>
                      <Routes>
                        {homeRoutes}
                        {needsRoutes}
                        {learnRoutes}
                        {healthcareRoutes}
                        {accountRoutes}
                        <Route path="/deals" element={<Deals />} />
                        <Route path="/deals/booking" element={<Booking />} />
                        <Route path="/deals/tasks" element={<Tasks />} />
                        <Route path="/deals/transportation" element={<Transportation />} />
                        <Route path="/deals/hotels" element={<Hotels />} />
                        <Route path="/deals/real-estate" element={<RealEstate />} />
                        <Route path="/deals/jobs" element={<Jobs />} />
                        <Route path="/deals/agriculture" element={<Agriculture />} />
                        <Route path="/deals/food" element={<Food />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/building-services" element={<BuildingServices />} />
                        <Route path="/pharmacy" element={<PharmacyPage />} />
                        <Route path="/pharmacy/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                        <Route path="/pharmacy/order/:id" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
                        <Route path="/experts" element={<ExpertsDirectory />} />
                        <Route path="/experts/:expertId" element={<ExpertProfile />} />
                        <Route path="/vendor/dashboard" element={<ProtectedRoute><EnhancedVendorDashboard /></ProtectedRoute>} />
                        <Route path="/vendor/analytics" element={<ProtectedRoute><VendorAnalytics /></ProtectedRoute>} />
                        <Route path="/vendor/register" element={<VendorRegistration />} />
                        <Route path="/admin" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
                        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                        <Route path="/admin/category" element={<ProtectedRoute><CategoryAdminDashboard /></ProtectedRoute>} />
                        <Route path="/support/tickets" element={<ProtectedRoute><TicketList /></ProtectedRoute>} />
                        <Route path="/support/tickets/new" element={<ProtectedRoute><CreateTicket /></ProtectedRoute>} />
                        <Route path="/support/tickets/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Layout>
                  }
                />
              </Routes>
              <CompareDrawer />
              <GlobalCartDrawer />
              </CartDrawerProvider>
              </CartProvider>
              </CompareProvider>
            </CurrencyProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
