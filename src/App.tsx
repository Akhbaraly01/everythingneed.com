import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import Deals from "./pages/Deals";
import Learn from "./pages/Learn";
import Healthcare from "./pages/Healthcare";
import Account from "./pages/Account";
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
import NeedCategoryPage from "./pages/needs/NeedCategoryPage";
import PharmacyPage from "./pages/pharmacy/PharmacyPage";
import CheckoutPage from "./pages/pharmacy/CheckoutPage";
import OrderConfirmation from "./pages/pharmacy/OrderConfirmation";
import OrderHistory from "./pages/pharmacy/OrderHistory";
import DoctorSelection from "./pages/healthcare/DoctorSelection";
import AppointmentBooking from "./pages/healthcare/AppointmentBooking";
import MyHealthTickets from "./pages/healthcare/MyHealthTickets";
import LabsBooking from "./pages/healthcare/LabsBooking";
import SpecialtyBooking from "./pages/healthcare/SpecialtyBooking";
import NotificationSettings from "./pages/account/NotificationSettings";
import Dashboard from "./pages/account/Dashboard";
import Certificates from "./pages/account/Certificates";
import Wallet from "./pages/account/Wallet";
import EnhancedVendorDashboard from "./pages/vendor/EnhancedVendorDashboard";
import VendorRegistration from "./pages/vendor/VendorRegistration";
import ProductDetail from "./pages/product/ProductDetail";
import Wishlist from "./pages/account/Wishlist";
import SubmitRequest from "./pages/needs/SubmitRequest";
import BuildingServices from "./pages/BuildingServices";
import CourseDetail from "./pages/learn/CourseDetail";
import LearningDashboard from "./pages/account/LearningDashboard";
import ExpertsDirectory from "./pages/experts/ExpertsDirectory";
import ExpertProfile from "./pages/experts/ExpertProfile";
import VendorAnalytics from "./pages/vendor/VendorAnalytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <ScrollToTop />
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route
                path="/*"
                element={
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/deals" element={<Deals />} />
                      <Route path="/deals/booking" element={<Booking />} />
                      <Route path="/deals/tasks" element={<Tasks />} />
                      <Route path="/deals/transportation" element={<Transportation />} />
                      <Route path="/deals/hotels" element={<Hotels />} />
                      <Route path="/deals/real-estate" element={<RealEstate />} />
                      <Route path="/deals/jobs" element={<Jobs />} />
                      <Route path="/deals/agriculture" element={<Agriculture />} />
                      <Route path="/deals/food" element={<Food />} />
                      <Route path="/needs/request" element={<SubmitRequest />} />
                      <Route path="/needs/:slug" element={<NeedCategoryPage />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/learn" element={<Learn />} />
                      <Route path="/learn/course/:slug" element={<CourseDetail />} />
                      <Route path="/building-services" element={<BuildingServices />} />
                      <Route path="/healthcare" element={<Healthcare />} />
                      <Route path="/healthcare/labs" element={<LabsBooking />} />
                      <Route path="/healthcare/specialty/:specialty" element={<SpecialtyBooking />} />
                      <Route path="/pharmacy" element={<PharmacyPage />} />
                      <Route path="/pharmacy/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                      <Route path="/pharmacy/order/:id" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
                      <Route path="/healthcare/book" element={<DoctorSelection />} />
                      <Route path="/healthcare/book/:doctorId" element={<ProtectedRoute><AppointmentBooking /></ProtectedRoute>} />
                      <Route path="/healthcare/tickets" element={<ProtectedRoute><MyHealthTickets /></ProtectedRoute>} />
                      <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                      <Route path="/account/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                      <Route path="/account/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
                      <Route path="/account/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                      <Route path="/account/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
                      <Route path="/account/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
                      <Route path="/account/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
                      <Route path="/account/learning" element={<ProtectedRoute><LearningDashboard /></ProtectedRoute>} />
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
            </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
