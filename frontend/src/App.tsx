import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@modules/authentication";
import { CartProvider } from "@modules/checkout";
import { CurrencyProvider } from "@modules/settings";
import { CompareProvider } from "@modules/engagement";
import { CartDrawerProvider } from "@modules/checkout";
import { CompareDrawer } from "@modules/engagement";
import { GlobalCartDrawer } from "@modules/orders";
import { Layout, ScrollToTop, NotFound } from "@shared/app-shell";
import { EventBusDevBridge } from "@core/dev/EventBusDevBridge";
import { AuthPage } from "@modules/authentication";
import { ProtectedRoute } from "@modules/authentication";
import { homeRoutes } from "@modules/home";
import { needsRoutes } from "@modules/needs";
import { learnRoutes } from "@modules/learn";
import { accountRoutes } from "@modules/users";
import { healthcareRoutes } from "@modules/healthcare";
import { Deals } from "@modules/deals";
import { Transportation } from "@modules/rides";
import { Hotels } from "@modules/hotels";
import { Tasks } from "@modules/deals";
import { Jobs } from "@modules/jobs";
import { Agriculture } from "@modules/deals";
import { Food } from "@modules/food";
import { RealEstate } from "@modules/real-estate";
import { Booking } from "@modules/bookings";
import { TicketList, CreateTicket, TicketDetail } from "@modules/messaging";
import { PharmacyPage } from "@modules/pharmacy";
import { CheckoutPage } from "@modules/pharmacy";
import { OrderConfirmation } from "@modules/pharmacy";
import { EnhancedVendorDashboard, VendorRegistration, VendorAnalytics } from "@modules/vendors";
import { ProductDetail } from "@modules/products";
import { BuildingServices } from "@modules/building-services";
import { ExpertsDirectory, ExpertProfile } from "@modules/experts";

const UserAnalyticsPage = lazy(() => import("@modules/analytics/pages/AnalyticsPage"));
const CategoriesPage = lazy(() => import("@modules/categories/pages/CategoriesPage"));
const DeliveriesPage = lazy(() => import("@modules/deliveries/pages/DeliveriesPage"));
const InventoryPage = lazy(() => import("@modules/inventory/pages/InventoryPage"));
const NotificationsPage = lazy(() => import("@modules/notifications/pages/NotificationsPage"));
const OrdersPage = lazy(() => import("@modules/orders/pages/OrdersPage"));
const PaymentsPage = lazy(() => import("@modules/payments/pages/PaymentsPage"));
const PermissionsPage = lazy(() => import("@modules/permissions/pages/PermissionsPage"));
const ReviewsPage = lazy(() => import("@modules/reviews/pages/ReviewsPage"));
const RolesPage = lazy(() => import("@modules/roles/pages/RolesPage"));
const UserSettingsPage = lazy(() => import("@modules/settings/pages/SettingsPage"));
const StoresPage = lazy(() => import("@modules/stores/pages/StoresPage"));
const SubscriptionsPage = lazy(() => import("@modules/subscriptions/pages/SubscriptionsPage"));
const UserTicketsPage = lazy(() => import("@modules/tickets/pages/TicketsPage"));
const TicketDetailPage = lazy(() => import("@modules/tickets/pages/TicketDetailPage"));
const OrderDetailPage = lazy(() => import("@modules/orders/pages/OrderDetail"));
const PaymentDetailPage = lazy(() => import("@modules/payments/pages/PaymentDetail"));
const PlanDetailPage = lazy(() => import("@modules/subscriptions/pages/PlanDetail"));
const ReviewDetailPage = lazy(() => import("@modules/reviews/pages/ReviewDetail"));
const CategoryDetailPage = lazy(() => import("@modules/categories/pages/CategoryDetail"));
const StoreDetailPage = lazy(() => import("@modules/stores/pages/StoreDetail"));
const StockDetailPage = lazy(() => import("@modules/inventory/pages/StockDetail"));
const DeliveryDetailPage = lazy(() => import("@modules/deliveries/pages/DeliveryDetail"));
const ProfileSettingsPage = lazy(() => import("@modules/settings/pages/ProfileSettings"));
const SecuritySettingsPage = lazy(() => import("@modules/settings/pages/SecuritySettings"));
const NotificationPrefsPage = lazy(() => import("@modules/settings/pages/NotificationPreferences"));
const ProductsPage = lazy(() => import("@modules/products/pages/ProductsPage"));
const HotelSearchPage = lazy(() => import("@modules/hotels/pages/HotelSearchPage"));
const HotelDetailPage = lazy(() => import("@modules/hotels/pages/HotelDetailPage"));
const HotelBookingPage = lazy(() => import("@modules/hotels/pages/HotelBookingPage"));
const ReservationsPage = lazy(() => import("@modules/hotels/pages/ReservationsPage"));
const PropertiesPage = lazy(() => import("@modules/real-estate/pages/PropertiesPage"));
const PropertyDetailPage = lazy(() => import("@modules/real-estate/pages/PropertyDetailPage"));
const CreateListingPage = lazy(() => import("@modules/real-estate/pages/CreateListingPage"));
const JobsPage = lazy(() => import("@modules/jobs/pages/JobsPage"));
const JobDetailPage = lazy(() => import("@modules/jobs/pages/JobDetailPage"));
const ApplyToJobPage = lazy(() => import("@modules/jobs/pages/ApplyToJobPage"));
const MyApplicationsPage = lazy(() => import("@modules/jobs/pages/MyApplicationsPage"));
const RestaurantDetailPage = lazy(() => import("@modules/food/pages/RestaurantDetailPage"));
const FoodCartPage = lazy(() => import("@modules/food/pages/FoodCartPage"));
const FoodOrderTrackingPage = lazy(() => import("@modules/food/pages/FoodOrderTrackingPage"));
const CourseCatalogPage = lazy(() => import("@modules/learn/pages/CourseCatalogPage"));
const MyCoursesPage = lazy(() => import("@modules/learn/pages/MyCoursesPage"));
const LessonPage = lazy(() => import("@modules/learn/pages/LessonPage"));
const QuizPage = lazy(() => import("@modules/learn/pages/QuizPage"));
const DoctorProfilePage = lazy(() => import("@modules/healthcare/pages/DoctorProfilePage"));
const MyAppointmentsPage = lazy(() => import("@modules/healthcare/pages/MyAppointmentsPage"));
const PrescriptionsPage = lazy(() => import("@modules/healthcare/pages/PrescriptionsPage"));
const WishlistPage = lazy(() => import("@modules/engagement/pages/WishlistPage"));
const AddressesPage = lazy(() => import("@modules/users/pages/AddressesPage"));
const MarketplaceCheckoutPage = lazy(() => import("@modules/orders/pages/CheckoutPage"));
const MyRequestsPage = lazy(() => import("@modules/needs/pages/MyRequestsPage"));

const SuperAdminDashboard = lazy(() => import("@modules/admin/pages/SuperAdminDashboard"));
const AdminDashboard = lazy(() => import("@modules/admin/pages/AdminDashboard"));
const CategoryAdminDashboard = lazy(() => import("@modules/admin/pages/CategoryAdminDashboard"));
const UsersManagementPage = lazy(() => import("@modules/admin/pages/UsersManagementPage"));
const VendorsManagementPage = lazy(() => import("@modules/admin/pages/VendorsManagementPage"));
const OrdersManagementPage = lazy(() => import("@modules/admin/pages/OrdersManagementPage"));
const FinanceAdminPage = lazy(() => import("@modules/admin/pages/FinanceAdminPage"));
const AnalyticsPage = lazy(() => import("@modules/admin/pages/AnalyticsPage"));
const ContentManagerPage = lazy(() => import("@modules/admin/pages/ContentManagerPage"));
const SupportStaffPage = lazy(() => import("@modules/admin/pages/SupportStaffPage"));
const HealthcareAdminPage = lazy(() => import("@modules/admin/pages/HealthcareAdminPage"));
const LearningAdminPage = lazy(() => import("@modules/admin/pages/LearningAdminPage"));
const SettingsPage = lazy(() => import("@modules/admin/pages/SettingsPage"));
const AuditLogsPage = lazy(() => import("@modules/admin/pages/AuditLogsPage"));
const RolesPermissionsPage = lazy(() => import("@modules/admin/pages/RolesPermissionsPage"));
const AdminProductsPage = lazy(() => import("@modules/admin/pages/AdminProductsPage"));
const SystemHealthPage = lazy(() => import("@modules/admin/pages/SystemHealthPage"));

function AdminFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
    </div>
  );
}

// Module-scoped role gates (super_admin bypasses all of these)
const ADMIN_CORE = ["administrator", "moderator"] as const;
const ADMIN_FINANCE = ["finance_admin", "administrator"] as const;
const ADMIN_CMS = ["content_manager", "administrator"] as const;
const ADMIN_SUPPORT = ["customer_service", "support_staff", "administrator"] as const;
const ADMIN_HEALTHCARE = ["healthcare_admin", "administrator"] as const;
const ADMIN_LEARNING = ["learning_admin", "administrator"] as const;
const ADMIN_CATEGORY = ["category_admin", "administrator"] as const;
const VENDOR_ONLY = ["vendor_admin"] as const;


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
                  <Route path="/auth" element={<AuthPage />} />
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
                        <Route path="/products" element={<Suspense fallback={<AdminFallback />}><ProductsPage /></Suspense>} />
                        <Route path="/hotels" element={<Suspense fallback={<AdminFallback />}><HotelSearchPage /></Suspense>} />
                        <Route path="/hotels/:id" element={<Suspense fallback={<AdminFallback />}><HotelDetailPage /></Suspense>} />
                        <Route path="/hotels/reservations" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><ReservationsPage /></Suspense></ProtectedRoute>} />
                        <Route path="/properties" element={<Suspense fallback={<AdminFallback />}><PropertiesPage /></Suspense>} />
                        <Route path="/properties/:id" element={<Suspense fallback={<AdminFallback />}><PropertyDetailPage /></Suspense>} />
                        <Route path="/properties/create" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><CreateListingPage /></Suspense></ProtectedRoute>} />
                        <Route path="/jobs" element={<Suspense fallback={<AdminFallback />}><JobsPage /></Suspense>} />
                        <Route path="/jobs/:id" element={<Suspense fallback={<AdminFallback />}><JobDetailPage /></Suspense>} />
                        <Route path="/jobs/:id/apply" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><ApplyToJobPage /></Suspense></ProtectedRoute>} />
                        <Route path="/jobs/applications" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><MyApplicationsPage /></Suspense></ProtectedRoute>} />
                        <Route path="/food" element={<Food />} />
                        <Route path="/food/:id" element={<Suspense fallback={<AdminFallback />}><RestaurantDetailPage /></Suspense>} />
                        <Route path="/food/cart" element={<Suspense fallback={<AdminFallback />}><FoodCartPage /></Suspense>} />
                        <Route path="/food/orders/:id" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><FoodOrderTrackingPage /></Suspense></ProtectedRoute>} />
                        <Route path="/learn/courses" element={<Suspense fallback={<AdminFallback />}><CourseCatalogPage /></Suspense>} />
                        <Route path="/learn/my-courses" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><MyCoursesPage /></Suspense></ProtectedRoute>} />
                        <Route path="/learn/courses/:courseId/lessons/:lessonId" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><LessonPage /></Suspense></ProtectedRoute>} />
                        <Route path="/learn/courses/:courseId/quizzes/:quizId" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><QuizPage /></Suspense></ProtectedRoute>} />
                        <Route path="/healthcare/doctors/:id" element={<Suspense fallback={<AdminFallback />}><DoctorProfilePage /></Suspense>} />
                        <Route path="/healthcare/appointments" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><MyAppointmentsPage /></Suspense></ProtectedRoute>} />
                        <Route path="/healthcare/prescriptions" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><PrescriptionsPage /></Suspense></ProtectedRoute>} />
                        <Route path="/wishlist" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><WishlistPage /></Suspense></ProtectedRoute>} />
                        <Route path="/addresses" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><AddressesPage /></Suspense></ProtectedRoute>} />
                        <Route path="/building-services" element={<BuildingServices />} />
                        <Route path="/pharmacy" element={<PharmacyPage />} />
                        <Route path="/pharmacy/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                        <Route path="/pharmacy/order/:id" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
                        <Route path="/experts" element={<ExpertsDirectory />} />
                        <Route path="/experts/:expertId" element={<ExpertProfile />} />
                        <Route path="/analytics" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><UserAnalyticsPage /></Suspense></ProtectedRoute>} />
                        <Route path="/categories" element={<Suspense fallback={<AdminFallback />}><CategoriesPage /></Suspense>} />
                        <Route path="/deliveries" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><DeliveriesPage /></Suspense></ProtectedRoute>} />
                        <Route path="/inventory" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><InventoryPage /></Suspense></ProtectedRoute>} />
                        <Route path="/notifications" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><NotificationsPage /></Suspense></ProtectedRoute>} />
                        <Route path="/orders" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><OrdersPage /></Suspense></ProtectedRoute>} />
                        <Route path="/checkout" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><MarketplaceCheckoutPage /></Suspense></ProtectedRoute>} />
                        <Route path="/account/requests" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><MyRequestsPage /></Suspense></ProtectedRoute>} />
                        <Route path="/orders/:id" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><OrderDetailPage /></Suspense></ProtectedRoute>} />
                        <Route path="/payments" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><PaymentsPage /></Suspense></ProtectedRoute>} />
                        <Route path="/payments/:id" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><PaymentDetailPage /></Suspense></ProtectedRoute>} />
                        <Route path="/permissions" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><PermissionsPage /></Suspense></ProtectedRoute>} />
                        <Route path="/reviews" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><ReviewsPage /></Suspense></ProtectedRoute>} />
                        <Route path="/reviews/:id" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><ReviewDetailPage /></Suspense></ProtectedRoute>} />
                        <Route path="/roles" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><RolesPage /></Suspense></ProtectedRoute>} />
                        <Route path="/settings" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><UserSettingsPage /></Suspense></ProtectedRoute>} />
                        <Route path="/settings/profile" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><ProfileSettingsPage /></Suspense></ProtectedRoute>} />
                        <Route path="/settings/security" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><SecuritySettingsPage /></Suspense></ProtectedRoute>} />
                        <Route path="/settings/notifications" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><NotificationPrefsPage /></Suspense></ProtectedRoute>} />
                        <Route path="/stores" element={<Suspense fallback={<AdminFallback />}><StoresPage /></Suspense>} />
                        <Route path="/stores/:id" element={<Suspense fallback={<AdminFallback />}><StoreDetailPage /></Suspense>} />
                        <Route path="/subscriptions" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><SubscriptionsPage /></Suspense></ProtectedRoute>} />
                        <Route path="/subscriptions/:id" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><PlanDetailPage /></Suspense></ProtectedRoute>} />
                        <Route path="/tickets" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><UserTicketsPage /></Suspense></ProtectedRoute>} />
                        <Route path="/tickets/:id" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><TicketDetailPage /></Suspense></ProtectedRoute>} />
                        <Route path="/categories/:id" element={<Suspense fallback={<AdminFallback />}><CategoryDetailPage /></Suspense>} />
                        <Route path="/inventory/:id" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><StockDetailPage /></Suspense></ProtectedRoute>} />
                        <Route path="/deliveries/:id" element={<ProtectedRoute><Suspense fallback={<AdminFallback />}><DeliveryDetailPage /></Suspense></ProtectedRoute>} />
                        <Route path="/vendor/dashboard" element={<ProtectedRoute requiredRoles={[...VENDOR_ONLY]}><EnhancedVendorDashboard /></ProtectedRoute>} />
                        <Route path="/vendor/analytics" element={<ProtectedRoute requiredRoles={[...VENDOR_ONLY]}><VendorAnalytics /></ProtectedRoute>} />
                        <Route path="/vendor/register" element={<VendorRegistration />} />
                        <Route path="/admin" element={<ProtectedRoute requiredRoles={["super_admin"]}><Suspense fallback={<AdminFallback />}><SuperAdminDashboard /></Suspense></ProtectedRoute>} />
                        <Route path="/admin/dashboard" element={<ProtectedRoute requiredRoles={[...ADMIN_CORE]}><Suspense fallback={<AdminFallback />}><AdminDashboard /></Suspense></ProtectedRoute>} />
                        <Route path="/admin/category" element={<ProtectedRoute requiredRoles={[...ADMIN_CATEGORY]}><Suspense fallback={<AdminFallback />}><CategoryAdminDashboard /></Suspense></ProtectedRoute>} />
                        <Route path="/admin/users" element={<ProtectedRoute requiredRoles={[...ADMIN_CORE]}><Suspense fallback={<AdminFallback />}><UsersManagementPage /></Suspense></ProtectedRoute>} />
                        <Route path="/admin/vendors" element={<ProtectedRoute requiredRoles={[...ADMIN_CORE]}><Suspense fallback={<AdminFallback />}><VendorsManagementPage /></Suspense></ProtectedRoute>} />
                        <Route path="/admin/orders" element={<ProtectedRoute requiredRoles={[...ADMIN_CORE]}><Suspense fallback={<AdminFallback />}><OrdersManagementPage /></Suspense></ProtectedRoute>} />
                        <Route path="/admin/finance" element={<ProtectedRoute requiredRoles={[...ADMIN_FINANCE]}><Suspense fallback={<AdminFallback />}><FinanceAdminPage /></Suspense></ProtectedRoute>} />
                        <Route path="/admin/analytics" element={<ProtectedRoute requiredRoles={[...ADMIN_CORE]}><Suspense fallback={<AdminFallback />}><AnalyticsPage /></Suspense></ProtectedRoute>} />
                        <Route path="/admin/cms" element={<ProtectedRoute requiredRoles={[...ADMIN_CMS]}><Suspense fallback={<AdminFallback />}><ContentManagerPage /></Suspense></ProtectedRoute>} />
                        <Route path="/admin/support/tickets" element={<ProtectedRoute requiredRoles={[...ADMIN_SUPPORT]}><Suspense fallback={<AdminFallback />}><SupportStaffPage /></Suspense></ProtectedRoute>} />
                        <Route path="/admin/healthcare/doctors" element={<ProtectedRoute requiredRoles={[...ADMIN_HEALTHCARE]}><Suspense fallback={<AdminFallback />}><HealthcareAdminPage /></Suspense></ProtectedRoute>} />
                        <Route path="/admin/learning/courses" element={<ProtectedRoute requiredRoles={[...ADMIN_LEARNING]}><Suspense fallback={<AdminFallback />}><LearningAdminPage /></Suspense></ProtectedRoute>} />
                        <Route path="/admin/settings" element={<ProtectedRoute requiredRoles={["super_admin"]}><Suspense fallback={<AdminFallback />}><SettingsPage /></Suspense></ProtectedRoute>} />
                        <Route path="/admin/audit-logs" element={<ProtectedRoute requiredRoles={["super_admin", "administrator"]}><Suspense fallback={<AdminFallback />}><AuditLogsPage /></Suspense></ProtectedRoute>} />
                        <Route path="/admin/roles" element={<ProtectedRoute requiredRoles={["super_admin", "administrator"]}><Suspense fallback={<AdminFallback />}><RolesPermissionsPage /></Suspense></ProtectedRoute>} />
                        <Route path="/admin/products" element={<ProtectedRoute requiredRoles={[...ADMIN_CORE]}><Suspense fallback={<AdminFallback />}><AdminProductsPage /></Suspense></ProtectedRoute>} />
                        <Route path="/admin/system" element={<ProtectedRoute requiredRoles={["super_admin"]}><Suspense fallback={<AdminFallback />}><SystemHealthPage /></Suspense></ProtectedRoute>} />
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
