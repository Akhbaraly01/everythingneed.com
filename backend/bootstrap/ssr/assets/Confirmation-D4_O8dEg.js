import { jsxs, jsx } from "react/jsx-runtime";
import { Head, Link } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { CheckCircle2, Plane, MapPin, CalendarDays, Users, Printer } from "lucide-react";
import "react";
import "./api-Dp2ndEHF.js";
import "clsx";
import "sonner";
function FlightConfirmation({ booking }) {
  var _a, _b, _c, _d, _e, _f;
  const d = booking.details;
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Booking confirmed", children: [
    /* @__PURE__ */ jsx(Head, { title: `Booking ${d.reference}` }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 text-center", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "mx-auto mb-3 h-14 w-14 text-green-500" }),
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Flight Confirmed!" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
          "A confirmation has been sent to ",
          d.contact_email || ((_a = booking.user) == null ? void 0 : _a.email) || "your account email",
          "."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between bg-sky-600 px-6 py-4 text-white", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 font-semibold", children: [
            /* @__PURE__ */ jsx(Plane, { className: "h-5 w-5" }),
            " E-Ticket"
          ] }),
          /* @__PURE__ */ jsx("span", { className: "font-mono text-lg tracking-wider", children: d.reference })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-5 grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-[1fr_auto_1fr]", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-center sm:text-left", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wide text-gray-400", children: "Departure" }),
              /* @__PURE__ */ jsx("p", { className: "text-xl font-bold text-gray-900 dark:text-white", children: d.departure_time ?? "--:--" }),
              /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-1 text-sm text-gray-500", children: [
                /* @__PURE__ */ jsx(MapPin, { className: "h-3.5 w-3.5" }),
                (_c = (_b = d.route) == null ? void 0 : _b.split("→")[0]) == null ? void 0 : _c.trim()
              ] })
            ] }),
            /* @__PURE__ */ jsx(Plane, { className: "hidden h-6 w-6 rotate-90 self-center text-sky-400 sm:block" }),
            /* @__PURE__ */ jsxs("div", { className: "text-center sm:text-right", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wide text-gray-400", children: "Arrival" }),
              /* @__PURE__ */ jsx("p", { className: "text-xl font-bold text-gray-900 dark:text-white", children: d.arrival_time ?? "--:--" }),
              /* @__PURE__ */ jsxs("p", { className: "flex items-center justify-end gap-1 text-sm text-gray-500", children: [
                (_e = (_d = d.route) == null ? void 0 : _d.split("→")[1]) == null ? void 0 : _e.trim(),
                " ",
                /* @__PURE__ */ jsx(MapPin, { className: "h-3.5 w-3.5" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-x-6 gap-y-3 border-t border-dashed border-gray-200 pt-4 text-sm dark:border-gray-600", children: [
            /* @__PURE__ */ jsxs(Info, { label: "Airline / Flight", children: [
              d.airline,
              " · ",
              d.flight_number
            ] }),
            /* @__PURE__ */ jsx(Info, { label: "Travel date", children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(CalendarDays, { className: "h-3.5 w-3.5" }),
              d.travel_date
            ] }) }),
            /* @__PURE__ */ jsx(Info, { label: "Passengers", children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Users, { className: "h-3.5 w-3.5" }),
              d.seat_count
            ] }) }),
            /* @__PURE__ */ jsx(Info, { label: "Total paid", children: formatCurrency(Number(d.total_price)) }),
            /* @__PURE__ */ jsx(Info, { label: "Status", children: /* @__PURE__ */ jsx("span", { className: "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium capitalize text-green-800", children: booking.status }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-5 border-t border-dashed border-gray-200 pt-4 dark:border-gray-600", children: [
            /* @__PURE__ */ jsx("p", { className: "mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400", children: "Passenger manifest" }),
            /* @__PURE__ */ jsx("ol", { className: "space-y-1", children: (_f = d.passengers) == null ? void 0 : _f.map((p, i) => /* @__PURE__ */ jsxs("li", { className: "flex justify-between rounded-md bg-gray-50 px-3 py-2 text-sm dark:bg-gray-700/40", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-gray-800 dark:text-gray-200", children: [
                i + 1,
                ". ",
                p.name
              ] }),
              p.passport && /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-gray-400", children: p.passport })
            ] }, i)) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "border-t border-dashed border-gray-300 bg-gray-50 px-6 py-3 text-center text-xs text-gray-500 dark:border-gray-600 dark:bg-gray-700/30", children: "Present this reference at check-in · Arrive 2 hours before departure" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-3", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => window.print(),
            className: "flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200",
            children: [
              /* @__PURE__ */ jsx(Printer, { className: "h-4 w-4" }),
              " Print ticket"
            ]
          }
        ),
        /* @__PURE__ */ jsx(Link, { href: "/bookings", className: "rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700", children: "View all my bookings" }),
        /* @__PURE__ */ jsx(Link, { href: "/flights", className: "rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400", children: "Book another flight" })
      ] })
    ] })
  ] });
}
function Info({ label, children }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wide text-gray-400", children: label }),
    /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children })
  ] });
}
export {
  FlightConfirmation as default
};
