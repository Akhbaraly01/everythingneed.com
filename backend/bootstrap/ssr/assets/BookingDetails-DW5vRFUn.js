import { jsx, jsxs } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { HardHat, MapPin, Calendar, DollarSign } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function BuildingServiceBookingDetails({ booking_id }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = booking_id || new URLSearchParams(window.location.search).get("id") || window.location.pathname.split("/").pop();
    if (id) {
      api.get(`/api/building-services/bookings/${id}`).then((res) => setBooking(res.data)).catch(() => {
      }).finally(() => setLoading(false));
    } else setLoading(false);
  }, [booking_id]);
  if (loading) return /* @__PURE__ */ jsx(AppLayout, { title: "Booking Details", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." }) });
  if (!booking) return /* @__PURE__ */ jsx(AppLayout, { title: "Booking Details", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-red-500", children: "Booking not found" }) });
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Booking Details", children: [
    /* @__PURE__ */ jsx(Head, { title: "Booking Details" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsx(HardHat, { className: "h-6 w-6 text-blue-600" }),
          /* @__PURE__ */ jsxs("h1", { className: "text-xl font-bold text-gray-900 dark:text-white capitalize", children: [
            booking.worker_type,
            " — ",
            booking.service_category
          ] })
        ] }),
        /* @__PURE__ */ jsx("span", { className: `rounded-full px-3 py-1 text-xs font-medium ${booking.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`, children: booking.status })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-3", children: [
        /* @__PURE__ */ jsx("p", { className: "text-gray-700 dark:text-gray-300", children: booking.description }),
        /* @__PURE__ */ jsxs("div", { className: "divide-y dark:divide-gray-700", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between py-2", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-gray-500 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4" }),
              " Address"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "font-medium dark:text-white", children: booking.address })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between py-2", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-gray-500 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Calendar, { className: "h-4 w-4" }),
              " Date"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "font-medium dark:text-white", children: [
              booking.scheduled_date,
              " ",
              booking.scheduled_time
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between py-2", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-gray-500 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(DollarSign, { className: "h-4 w-4" }),
              " Budget"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "font-medium dark:text-white", children: [
              "$",
              booking.estimated_cost || "TBD"
            ] })
          ] })
        ] }),
        booking.notes && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 bg-gray-50 p-3 rounded dark:bg-gray-700", children: booking.notes })
      ] })
    ] })
  ] });
}
export {
  BuildingServiceBookingDetails as default
};
