import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { HardHat, Calendar, MapPin, DollarSign } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function BuildingServiceBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/building-services/bookings").then((res) => setBookings(res.data)).catch(() => setBookings([])).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "My Building Service Bookings", children: [
    /* @__PURE__ */ jsx(Head, { title: "My Bookings" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Building Service Bookings" }),
        /* @__PURE__ */ jsx(Link, { href: "/building-services/book", className: "rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700", children: "New Booking" })
      ] }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : bookings.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(HardHat, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No bookings yet" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: bookings.map((b) => /* @__PURE__ */ jsxs(Link, { href: `/building-services/bookings/${b.id}`, className: "block rounded-lg bg-white p-4 shadow hover:ring-2 hover:ring-blue-500 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("p", { className: "font-semibold text-gray-900 dark:text-white capitalize", children: [
              b.worker_type,
              " — ",
              b.service_category
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 line-clamp-1", children: b.description })
          ] }),
          /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-1 text-xs font-medium ${b.status === "completed" ? "bg-green-100 text-green-800" : b.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"}`, children: b.status })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 flex gap-4 text-sm text-gray-500", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "h-3 w-3" }),
            b.scheduled_date
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "h-3 w-3" }),
            b.address
          ] }),
          b.estimated_cost && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(DollarSign, { className: "h-3 w-3" }),
            "$",
            b.estimated_cost
          ] })
        ] })
      ] }, b.id)) })
    ] })
  ] });
}
export {
  BuildingServiceBookings as default
};
