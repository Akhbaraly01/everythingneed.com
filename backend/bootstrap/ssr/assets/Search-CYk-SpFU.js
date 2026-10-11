import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Plane, Search, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import "./api-Dp2ndEHF.js";
import "clsx";
import "sonner";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function FlightsSearch({ flights, filters }) {
  const [origin, setOrigin] = useState(filters.origin ?? "");
  const [destination, setDestination] = useState(filters.destination ?? "");
  const [date, setDate] = useState(filters.date ?? "");
  const [maxPrice, setMaxPrice] = useState(filters.max_price ?? "");
  const submit = (e) => {
    e.preventDefault();
    const params = {};
    if (origin) params.origin = origin;
    if (destination) params.destination = destination;
    if (date) params.date = date;
    if (maxPrice) params.max_price = maxPrice;
    router.get("/flights", params, { preserveState: true });
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Flights", children: [
    /* @__PURE__ */ jsx(Head, { title: "Flight search" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("span", { className: "flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100", children: /* @__PURE__ */ jsx(Plane, { className: "h-6 w-6 text-sky-600" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Book a Flight" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
            flights.total,
            " departures available"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "mb-6 grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-5 dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Input, { label: "From", value: origin, onChange: setOrigin, placeholder: "City or code (ACC)" }),
        /* @__PURE__ */ jsx(Input, { label: "To", value: destination, onChange: setDestination, placeholder: "City or code (LHR)" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-xs font-medium text-gray-500", children: "Departure date" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              value: date,
              min: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
              onChange: (e) => setDate(e.target.value),
              className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(Input, { label: "Max price", value: maxPrice, onChange: setMaxPrice, type: "number", placeholder: "$" }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "submit",
            className: "mt-auto flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-700",
            children: [
              /* @__PURE__ */ jsx(Search, { className: "h-4 w-4" }),
              " Search flights"
            ]
          }
        )
      ] }),
      flights.data.length === 0 ? /* @__PURE__ */ jsx(EmptyState, {}) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: flights.data.map((flight) => {
        var _a, _b;
        return /* @__PURE__ */ jsx(
          Link,
          {
            href: `/flights/${flight.id}`,
            className: "block rounded-xl border border-gray-200 bg-white p-5 transition hover:border-sky-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800",
            children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-gray-900 dark:text-white", children: (_a = flight.departure_time) == null ? void 0 : _a.slice(0, 5) }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-gray-500", children: flight.origin_code })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center px-2", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-[10px] uppercase tracking-wide text-gray-400", children: [
                    Math.floor(flight.duration_minutes / 60),
                    "h ",
                    flight.duration_minutes % 60,
                    "m"
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "my-0.5 flex w-28 items-center gap-1", children: [
                    /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-gray-300" }),
                    /* @__PURE__ */ jsx("span", { className: "h-px flex-1 bg-gradient-to-r from-gray-300 to-sky-400" }),
                    /* @__PURE__ */ jsx(Plane, { className: "h-3.5 w-3.5 rotate-90 text-sky-500" }),
                    /* @__PURE__ */ jsx("span", { className: "h-px flex-1 bg-gradient-to-l from-gray-300 to-sky-400" }),
                    /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-gray-300" })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] text-gray-400", children: "Non-stop" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-gray-900 dark:text-white", children: (_b = flight.arrival_time) == null ? void 0 : _b.slice(0, 5) }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-gray-500", children: flight.destination_code })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-40", children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: flight.airline }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: flight.flight_number }),
                /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-[11px] text-gray-400", children: DAYS.filter((_, i) => (flight.days_of_week ?? []).includes(i)).join(" · ") })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xl font-bold text-sky-600", children: formatCurrency(Number(flight.price)) }),
                /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-gray-400", children: [
                  flight.seats_available,
                  " seats left"
                ] })
              ] })
            ] })
          },
          flight.id
        );
      }) }),
      flights.last_page > 1 && /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-center justify-center gap-3", children: [
        flights.current_page > 1 && /* @__PURE__ */ jsx(Link, { href: `/flights?page=${flights.current_page - 1}`, preserveState: true, className: "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white", children: /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-600 dark:text-gray-300", children: [
          "Page ",
          flights.current_page,
          " of ",
          flights.last_page
        ] }),
        flights.current_page < flights.last_page && /* @__PURE__ */ jsx(Link, { href: `/flights?page=${flights.current_page + 1}`, preserveState: true, className: "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white", children: /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" }) })
      ] })
    ] })
  ] });
}
function Input({ label, value, onChange, placeholder, type = "text" }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("label", { className: "mb-1 block text-xs font-medium text-gray-500", children: label }),
    /* @__PURE__ */ jsx(
      "input",
      {
        type,
        value,
        onChange: (e) => onChange(e.target.value),
        placeholder,
        className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      }
    )
  ] });
}
function EmptyState() {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-600", children: [
    /* @__PURE__ */ jsx(CalendarDays, { className: "mx-auto mb-3 h-10 w-10 text-gray-300" }),
    /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "No flights match your search" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Try different dates or airports — not all routes operate daily." })
  ] });
}
export {
  FlightsSearch as default
};
