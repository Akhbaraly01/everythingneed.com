import { jsx, jsxs } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, router } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { CheckCircle, Calendar, Clock, MapPin, CreditCard } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function BookingConfirmation() {
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      api.get(`/api/health/tickets/${id}`).then((res) => setAppointment(res.data)).catch(() => {
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);
  if (loading) return /* @__PURE__ */ jsx(AppLayout, { title: "Booking Confirmation", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." }) });
  if (!appointment) return /* @__PURE__ */ jsx(AppLayout, { title: "Booking Confirmation", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-red-500", children: "Appointment not found" }) });
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Booking Confirmed", children: [
    /* @__PURE__ */ jsx(Head, { title: "Booking Confirmed" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-green-50 p-8 text-center shadow dark:bg-green-900/20", children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "mx-auto h-16 w-16 text-green-500" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-4 text-2xl font-bold text-gray-900 dark:text-white", children: "Booking Confirmed!" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-600 dark:text-gray-400", children: "Your appointment has been successfully booked." }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-gray-500", children: [
          "Ticket #",
          appointment.ticket_number
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white mb-4", children: "Appointment Details" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "h-5 w-5 text-gray-400" }),
            /* @__PURE__ */ jsx("span", { className: "text-gray-700 dark:text-gray-300", children: appointment.appointment_date })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Clock, { className: "h-5 w-5 text-gray-400" }),
            /* @__PURE__ */ jsx("span", { className: "text-gray-700 dark:text-gray-300", children: appointment.appointment_time })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "h-5 w-5 text-gray-400" }),
            /* @__PURE__ */ jsx("span", { className: "text-gray-700 dark:text-gray-300", children: appointment.consultation_type || "In-Person" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(CreditCard, { className: "h-5 w-5 text-gray-400" }),
            /* @__PURE__ */ jsxs("span", { className: "text-gray-700 dark:text-gray-300", children: [
              "$",
              appointment.doctor.consultation_fee
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white mb-2", children: "Doctor" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-700 dark:text-gray-300", children: appointment.doctor.full_name }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: appointment.doctor.specialization })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => router.visit("/healthcare/appointments"),
            className: "flex-1 rounded-lg bg-blue-600 px-4 py-3 text-center text-white hover:bg-blue-700",
            children: "View My Appointments"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => router.visit("/healthcare"),
            className: "flex-1 rounded-lg border px-4 py-3 text-center text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700",
            children: "Back to Healthcare"
          }
        )
      ] })
    ] })
  ] });
}
export {
  BookingConfirmation as default
};
