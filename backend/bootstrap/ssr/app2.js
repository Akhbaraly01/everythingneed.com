import { jsx, jsxs } from "react/jsx-runtime";
import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import { createContext, useState, useEffect, useContext } from "react";
import { Toaster as Toaster$1 } from "sonner";
async function resolvePageComponent(path, pages) {
  for (const p of Array.isArray(path) ? path : [path]) {
    const page = pages[p];
    if (typeof page === "undefined") {
      continue;
    }
    return typeof page === "function" ? page() : page;
  }
  throw new Error(`Page not found: ${path}`);
}
const ThemeProviderContext = createContext({
  theme: "system",
  setTheme: () => null
});
function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "everythingneed-theme"
}) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(storageKey) || defaultTheme
  );
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
      return;
    }
    root.classList.add(theme);
  }, [theme]);
  const value = {
    theme,
    setTheme: (theme2) => {
      localStorage.setItem(storageKey, theme2);
      setTheme(theme2);
    }
  };
  return /* @__PURE__ */ jsx(ThemeProviderContext.Provider, { value, children });
}
const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === void 0) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
const Toaster = ({ ...props }) => {
  return /* @__PURE__ */ jsx(
    Toaster$1,
    {
      theme: "system",
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
const appName = "EverythingNeed";
createInertiaApp({
  title: (title) => title ? `${title} - ${appName}` : appName,
  resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, /* @__PURE__ */ Object.assign({ "./pages/Dashboard.tsx": () => import("./assets/Dashboard-D-oaGmnM.js"), "./pages/Home/Index.tsx": () => import("./assets/Index-C-8qjuCE.js"), "./pages/Wishlist.tsx": () => import("./assets/Wishlist-DO1mE728.js"), "./pages/account/Addresses.tsx": () => import("./assets/Addresses-RyiKMhvU.js"), "./pages/account/Applications.tsx": () => import("./assets/Applications-B_n4_gp_.js"), "./pages/account/Bookings.tsx": () => import("./assets/Bookings-D0kGxl5Y.js"), "./pages/account/ChangePassword.tsx": () => import("./assets/ChangePassword-C-oFBUHH.js"), "./pages/account/Dashboard.tsx": () => import("./assets/Dashboard-Dwh0pM5D.js"), "./pages/account/HealthcareHistory.tsx": () => import("./assets/HealthcareHistory-SvozBSMQ.js"), "./pages/account/Index.tsx": () => import("./assets/Index-xp4AoZys.js"), "./pages/account/Profile.tsx": () => import("./assets/Profile-zbJC1qA0.js"), "./pages/account/Reviews.tsx": () => import("./assets/Reviews-DofuoUNN.js"), "./pages/admin/AdminSettings.tsx": () => import("./assets/AdminSettings-CYeEidBR.js"), "./pages/admin/Analytics.tsx": () => import("./assets/Analytics-B6L71-kG.js"), "./pages/admin/Approvals.tsx": () => import("./assets/Approvals-BEPPucbo.js"), "./pages/admin/AuditLogs.tsx": () => import("./assets/AuditLogs-B2dCwNme.js"), "./pages/admin/Categories.tsx": () => import("./assets/Categories-C7UozBGz.js"), "./pages/admin/Cms.tsx": () => import("./assets/Cms-CeU1r1z8.js"), "./pages/admin/Dashboard.tsx": () => import("./assets/Dashboard-BT-SuOcQ.js"), "./pages/admin/Departments.tsx": () => import("./assets/Departments-CctoMMdu.js"), "./pages/admin/Finance.tsx": () => import("./assets/Finance-BB1xxBw7.js"), "./pages/admin/Food.tsx": () => import("./assets/Food-BhO-lhLK.js"), "./pages/admin/Healthcare.tsx": () => import("./assets/Healthcare-D3Pakqsp.js"), "./pages/admin/Hotels.tsx": () => import("./assets/Hotels-DsTQSTFy.js"), "./pages/admin/Jobs.tsx": () => import("./assets/Jobs-DlKhXBy4.js"), "./pages/admin/Learning.tsx": () => import("./assets/Learning-BSecuoTU.js"), "./pages/admin/Orders.tsx": () => import("./assets/Orders-DiP6hjbT.js"), "./pages/admin/Payouts.tsx": () => import("./assets/Payouts-Due8Y8v7.js"), "./pages/admin/Products.tsx": () => import("./assets/Products-Cld5WEue.js"), "./pages/admin/Rbac.tsx": () => import("./assets/Rbac-B7ws9pFd.js"), "./pages/admin/Support.tsx": () => import("./assets/Support-C8FWBXhD.js"), "./pages/admin/System.tsx": () => import("./assets/System-BLERIlLR.js"), "./pages/admin/Transport.tsx": () => import("./assets/Transport-D0QCqs7R.js"), "./pages/admin/Users.tsx": () => import("./assets/Users-qjgSLOSW.js"), "./pages/admin/Vendors.tsx": () => import("./assets/Vendors-l_V29Gbh.js"), "./pages/agriculture/Index.tsx": () => import("./assets/Index-5eU5Fqbb.js"), "./pages/agriculture/Products.tsx": () => import("./assets/Products-DwmVG3hm.js"), "./pages/agriculture/Workers.tsx": () => import("./assets/Workers-BgTRm7oM.js"), "./pages/analytics/Index.tsx": () => import("./assets/Index-BLp5fMLF.js"), "./pages/auth/ForgotPassword.tsx": () => import("./assets/ForgotPassword-LSdB9usE.js"), "./pages/auth/Login.tsx": () => import("./assets/Login-BJr7y9Lu.js"), "./pages/auth/Register.tsx": () => import("./assets/Register-CTfrQPgi.js"), "./pages/auth/ResetPassword.tsx": () => import("./assets/ResetPassword-ZlwMTABu.js"), "./pages/auth/VerifyEmail.tsx": () => import("./assets/VerifyEmail-Dsm6L4lE.js"), "./pages/building-services/Booking.tsx": () => import("./assets/Booking-DDzjhTXX.js"), "./pages/building-services/BookingDetails.tsx": () => import("./assets/BookingDetails-DW5vRFUn.js"), "./pages/building-services/Bookings.tsx": () => import("./assets/Bookings-CfJlxrHo.js"), "./pages/building-services/Index.tsx": () => import("./assets/Index-Dd6jDo8N.js"), "./pages/building-services/WorkerProfile.tsx": () => import("./assets/WorkerProfile-DCgkxy3Z.js"), "./pages/cart/Index.tsx": () => import("./assets/Index-crnTVNZ7.js"), "./pages/categories/Index.tsx": () => import("./assets/Index-BUKHL2qr.js"), "./pages/categories/Show.tsx": () => import("./assets/Show-BFxngW92.js"), "./pages/deals/Index.tsx": () => import("./assets/Index-CR8TZWc6.js"), "./pages/deals/Landing.tsx": () => import("./assets/Landing-Dof3R1F6.js"), "./pages/deals/Show.tsx": () => import("./assets/Show-hsR78MC0.js"), "./pages/deliveries/Index.tsx": () => import("./assets/Index-e-KI5RxR.js"), "./pages/errors/404.tsx": () => import("./assets/404-BfGN6CET.js"), "./pages/experts/Index.tsx": () => import("./assets/Index-TP-BjOcW.js"), "./pages/experts/Show.tsx": () => import("./assets/Show-CygMNPFR.js"), "./pages/flights/Confirmation.tsx": () => import("./assets/Confirmation-D4_O8dEg.js"), "./pages/flights/MyBookings.tsx": () => import("./assets/MyBookings-YVxfLCr-.js"), "./pages/flights/Search.tsx": () => import("./assets/Search-CYk-SpFU.js"), "./pages/flights/Show.tsx": () => import("./assets/Show-yCL6km48.js"), "./pages/food/Cart.tsx": () => import("./assets/Cart-C88kp8-p.js"), "./pages/food/Checkout.tsx": () => import("./assets/Checkout-CdaBloT-.js"), "./pages/food/Index.tsx": () => import("./assets/Index-vdvpawUv.js"), "./pages/food/OrderHistory.tsx": () => import("./assets/OrderHistory-Cg1C7REW.js"), "./pages/food/OrderTracking.tsx": () => import("./assets/OrderTracking-vcFgbX48.js"), "./pages/food/Show.tsx": () => import("./assets/Show-ClXlYc4q.js"), "./pages/healthcare/AppointmentShow.tsx": () => import("./assets/AppointmentShow-CkVEwUiJ.js"), "./pages/healthcare/Appointments.tsx": () => import("./assets/Appointments-_6B_v5Y6.js"), "./pages/healthcare/Book.tsx": () => import("./assets/Book-DGvzuWVt.js"), "./pages/healthcare/BookingConfirmation.tsx": () => import("./assets/BookingConfirmation-f6hWzikB.js"), "./pages/healthcare/Content.tsx": () => import("./assets/Content-WgU7LCJg.js"), "./pages/healthcare/DoctorProfile.tsx": () => import("./assets/DoctorProfile-BY9MyHQy.js"), "./pages/healthcare/Doctors.tsx": () => import("./assets/Doctors-FfCjby3u.js"), "./pages/healthcare/Index.tsx": () => import("./assets/Index-DOjY8cvF.js"), "./pages/healthcare/LabBooking.tsx": () => import("./assets/LabBooking-CKOFP0le.js"), "./pages/healthcare/Labs.tsx": () => import("./assets/Labs-Cgx_Ol9w.js"), "./pages/healthcare/MyHealthTickets.tsx": () => import("./assets/MyHealthTickets-DnxrdwiO.js"), "./pages/healthcare/Prescriptions.tsx": () => import("./assets/Prescriptions-BjxTD-JO.js"), "./pages/healthcare/Specialty.tsx": () => import("./assets/Specialty-CBNHaJzM.js"), "./pages/healthcare/VirtualConsultation.tsx": () => import("./assets/VirtualConsultation-ygtZ0tDR.js"), "./pages/hotels/Booking.tsx": () => import("./assets/Booking-DAJvg-_Q.js"), "./pages/hotels/Index.tsx": () => import("./assets/Index-Mon2hu2k.js"), "./pages/hotels/Reservations.tsx": () => import("./assets/Reservations-CohdbmQX.js"), "./pages/hotels/RoomDetails.tsx": () => import("./assets/RoomDetails-iasnf7DA.js"), "./pages/hotels/Show.tsx": () => import("./assets/Show-ClWUQ5LP.js"), "./pages/inventory/Index.tsx": () => import("./assets/Index-wUKos43z.js"), "./pages/job-seekers/CreateRequest.tsx": () => import("./assets/CreateRequest-BtiN-GEE.js"), "./pages/job-seekers/Index.tsx": () => import("./assets/Index-tXXxoQC5.js"), "./pages/job-seekers/MyRequests.tsx": () => import("./assets/MyRequests-EMOGNgoe.js"), "./pages/job-seekers/Show.tsx": () => import("./assets/Show-B_oR821L.js"), "./pages/jobs/Applications.tsx": () => import("./assets/Applications-BI_Y9FwK.js"), "./pages/jobs/Apply.tsx": () => import("./assets/Apply-B2-r-Nqu.js"), "./pages/jobs/Index.tsx": () => import("./assets/Index-D_TlXLox.js"), "./pages/jobs/Show.tsx": () => import("./assets/Show-C5JMpr_c.js"), "./pages/learn/Catalog.tsx": () => import("./assets/Catalog-BWXkHtKe.js"), "./pages/learn/Certificates.tsx": () => import("./assets/Certificates-D6LPUWls.js"), "./pages/learn/Index.tsx": () => import("./assets/Index-BMJYKKRK.js"), "./pages/learn/InstructorProfile.tsx": () => import("./assets/InstructorProfile-DlsvA4DX.js"), "./pages/learn/Lesson.tsx": () => import("./assets/Lesson-DoiD_vp_.js"), "./pages/learn/MyLearning.tsx": () => import("./assets/MyLearning-i9mVYRZ0.js"), "./pages/learn/Quiz.tsx": () => import("./assets/Quiz-Bvk3Bujt.js"), "./pages/learn/QuizResults.tsx": () => import("./assets/QuizResults-CgOQdgjC.js"), "./pages/learn/Show.tsx": () => import("./assets/Show-B7AEXYNq.js"), "./pages/messages/Index.tsx": () => import("./assets/Index-ZWfKtNyV.js"), "./pages/messages/Show.tsx": () => import("./assets/Show-BXmaXBD2.js"), "./pages/needs/Category.tsx": () => import("./assets/Category-8pFLRBWW.js"), "./pages/needs/History.tsx": () => import("./assets/History-BpCb-ExN.js"), "./pages/needs/Index.tsx": () => import("./assets/Index-COFZAorH.js"), "./pages/needs/Request.tsx": () => import("./assets/Request-CCpzuvFJ.js"), "./pages/needs/Show.tsx": () => import("./assets/Show-qXYxB87p.js"), "./pages/notifications/Index.tsx": () => import("./assets/Index-Br1_wvTj.js"), "./pages/orders/Checkout.tsx": () => import("./assets/Checkout-C6lWHp4H.js"), "./pages/orders/Disputes.tsx": () => import("./assets/Disputes-DlkmCY3U.js"), "./pages/orders/Index.tsx": () => import("./assets/Index-CvBeQjSP.js"), "./pages/orders/Returns.tsx": () => import("./assets/Returns-BUe0U3r3.js"), "./pages/orders/Show.tsx": () => import("./assets/Show-DnkflAsx.js"), "./pages/orders/Tracking.tsx": () => import("./assets/Tracking-M6nCuGzK.js"), "./pages/payments/Index.tsx": () => import("./assets/Index-fKgDc9bg.js"), "./pages/permissions/Index.tsx": () => import("./assets/Index-CPbo42YA.js"), "./pages/pharmacy/Cart.tsx": () => import("./assets/Cart-CrfKwOKD.js"), "./pages/pharmacy/Checkout.tsx": () => import("./assets/Checkout-DgkmWdLo.js"), "./pages/pharmacy/Index.tsx": () => import("./assets/Index-9aGvUGO2.js"), "./pages/pharmacy/OrderConfirmation.tsx": () => import("./assets/OrderConfirmation-BsYbtzeH.js"), "./pages/pharmacy/OrderTracking.tsx": () => import("./assets/OrderTracking-CPY1vb5w.js"), "./pages/pharmacy/PrescriptionUpload.tsx": () => import("./assets/PrescriptionUpload-APDcahHr.js"), "./pages/products/Compare.tsx": () => import("./assets/Compare-PhRkgNhG.js"), "./pages/products/Index.tsx": () => import("./assets/Index-BJYW8BkP.js"), "./pages/products/Show.tsx": () => import("./assets/Show-D-6tH2iU.js"), "./pages/properties/Create.tsx": () => import("./assets/Create-C802M3aG.js"), "./pages/properties/Index.tsx": () => import("./assets/Index-Betk6UKJ.js"), "./pages/properties/Inquiry.tsx": () => import("./assets/Inquiry-e4c5ZTMH.js"), "./pages/properties/Show.tsx": () => import("./assets/Show-mg13wr5O.js"), "./pages/requests/Index.tsx": () => import("./assets/Index-DojTnMeo.js"), "./pages/reviews/Create.tsx": () => import("./assets/Create-DGingeWX.js"), "./pages/reviews/Index.tsx": () => import("./assets/Index-vg002g4_.js"), "./pages/search/Results.tsx": () => import("./assets/Results-cgvOvE8C.js"), "./pages/settings/Index.tsx": () => import("./assets/Index-DZqrASIl.js"), "./pages/settings/Notifications.tsx": () => import("./assets/Notifications-MpUEQ1W5.js"), "./pages/settings/Security.tsx": () => import("./assets/Security-ClEilwEm.js"), "./pages/stores/Index.tsx": () => import("./assets/Index-BL0DO42a.js"), "./pages/stores/Show.tsx": () => import("./assets/Show-Devo2c60.js"), "./pages/subscriptions/Index.tsx": () => import("./assets/Index-fANjNOi_.js"), "./pages/tasks/Create.tsx": () => import("./assets/Create-y5gA8WdG.js"), "./pages/tasks/Index.tsx": () => import("./assets/Index-D1X5lToT.js"), "./pages/tasks/MyApplications.tsx": () => import("./assets/MyApplications-UDge75gz.js"), "./pages/tasks/Show.tsx": () => import("./assets/Show-Cf79Jr7L.js"), "./pages/tasks/Submission.tsx": () => import("./assets/Submission-DRwmg_Zz.js"), "./pages/tickets/Create.tsx": () => import("./assets/Create-Bh5_Ofu8.js"), "./pages/tickets/Index.tsx": () => import("./assets/Index-ELT472qe.js"), "./pages/tickets/Show.tsx": () => import("./assets/Show-Jy7OsfVB.js"), "./pages/transportation/CustomRequest.tsx": () => import("./assets/CustomRequest-BBpzxHZ1.js"), "./pages/transportation/Index.tsx": () => import("./assets/Index-S3NxzZwM.js"), "./pages/transportation/RideBooking.tsx": () => import("./assets/RideBooking-BQxShx3j.js"), "./pages/transportation/RideTracking.tsx": () => import("./assets/RideTracking-BmbceOey.js"), "./pages/vendor/Analytics.tsx": () => import("./assets/Analytics-IET2crxS.js"), "./pages/vendor/Dashboard.tsx": () => import("./assets/Dashboard-C4-xWDJN.js"), "./pages/vendor/OrderDetails.tsx": () => import("./assets/OrderDetails-3TPVjsMf.js"), "./pages/vendor/Orders.tsx": () => import("./assets/Orders-DxNv-eV-.js"), "./pages/vendor/Payouts.tsx": () => import("./assets/Payouts-BEPUN8GL.js"), "./pages/vendor/ProductCreate.tsx": () => import("./assets/ProductCreate-CY-Xx-W3.js"), "./pages/vendor/ProductEdit.tsx": () => import("./assets/ProductEdit-D0PzuZrh.js"), "./pages/vendor/Products.tsx": () => import("./assets/Products-uNpAOJxj.js"), "./pages/vendors/Index.tsx": () => import("./assets/Index-BMDhFzNh.js"), "./pages/vendors/Register.tsx": () => import("./assets/Register-rFTsg3v0.js"), "./pages/vendors/Show.tsx": () => import("./assets/Show-BUbBt9vW.js"), "./pages/wallet/Index.tsx": () => import("./assets/Index-B5x4RHmf.js") })),
  setup({ el, App, props }) {
    const root = createRoot(el);
    root.render(
      /* @__PURE__ */ jsxs(ThemeProvider, { defaultTheme: "system", storageKey: "everythingneed-theme", children: [
        /* @__PURE__ */ jsx(App, { ...props }),
        /* @__PURE__ */ jsx(Toaster, {})
      ] })
    );
  },
  progress: {
    color: "#4B5563"
  }
});
export {
  ThemeProvider as T,
  useTheme as u
};
