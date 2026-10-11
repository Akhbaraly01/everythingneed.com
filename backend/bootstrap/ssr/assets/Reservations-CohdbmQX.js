import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { ArrowLeft, CalendarCheck, X } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  checked_in: "bg-green-100 text-green-800",
  checked_out: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800"
};
function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchReservations = () => {
    api.get("/api/hotels/reservations/mine").then((res) => setReservations(res.data)).catch(() => setReservations([])).finally(() => setLoading(false));
  };
  useEffect(() => {
    fetchReservations();
  }, []);
  const cancelReservation = async (id) => {
    if (!confirm("Cancel this reservation?")) return;
    try {
      await api.post(`/api/hotels/reservations/${id}/cancel`);
      fetchReservations();
    } catch {
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "My Reservations", children: [
    /* @__PURE__ */ jsx(Head, { title: "Hotel Reservations" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs(Link, { href: "/hotels", className: "inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Browse Hotels"
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) }) : reservations.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(CalendarCheck, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No reservations" }),
        /* @__PURE__ */ jsx(Link, { href: "/hotels", className: "mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500", children: "Browse Hotels" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: reservations.map((r) => {
        var _a, _b;
        return /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "font-mono text-sm text-gray-500", children: r.reference }),
              /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[r.status] ?? "bg-gray-100 text-gray-800"}`, children: r.status })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 font-semibold text-gray-900 dark:text-white", children: ((_a = r.hotel) == null ? void 0 : _a.name) ?? "Hotel" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
              (_b = r.room) == null ? void 0 : _b.room_type,
              " — ",
              r.guests,
              " guest",
              r.guests !== 1 ? "s" : ""
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center gap-4 text-sm text-gray-500", children: [
              /* @__PURE__ */ jsxs("span", { children: [
                "Check-in: ",
                r.check_in_date
              ] }),
              /* @__PURE__ */ jsxs("span", { children: [
                "Check-out: ",
                r.check_out_date
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-lg font-bold text-gray-900 dark:text-white", children: formatCurrency(r.total_amount) })
          ] }),
          ["pending", "confirmed"].includes(r.status) && /* @__PURE__ */ jsx("button", { onClick: () => cancelReservation(r.id), className: "rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20", children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" }) })
        ] }) }, r.id);
      }) })
    ] })
  ] });
}
export {
  ReservationsPage as default
};
