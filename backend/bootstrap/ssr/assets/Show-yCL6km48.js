import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { toast } from "sonner";
import { ArrowLeft, Clock, Plane, Users, Trash2, Plus, ShieldCheck, ArrowRight } from "lucide-react";
import "clsx";
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function FlightShow({ flight }) {
  var _a, _b;
  const [passengers, setPassengers] = useState([{ name: "", passport: "" }]);
  const [travelDate, setTravelDate] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const seatCount = passengers.length;
  const total = useMemo(() => (Number(flight.price) * seatCount).toFixed(2), [flight.price, seatCount]);
  const seatsLeft = flight.seats_available;
  const addPassenger = () => {
    if (seatCount >= 6 || seatCount >= seatsLeft) return;
    setPassengers((p) => [...p, { name: "", passport: "" }]);
  };
  const removePassenger = (idx) => {
    if (seatCount === 1) return;
    setPassengers((p) => p.filter((_, i) => i !== idx));
  };
  const updatePassenger = (idx, patch) => setPassengers((p) => p.map((x, i) => i === idx ? { ...x, ...patch } : x));
  const book = async () => {
    setSubmitting(true);
    try {
      const res = await api.post(`/api/flights/${flight.id}/book`, {
        travel_date: travelDate,
        contact_email: contactEmail || null,
        passengers: passengers.map((p) => ({ name: p.name.trim(), passport: p.passport.trim() || null }))
      });
      toast.success("Flight booked", { description: `Reference ${res.data.reference}` });
      router.visit(`/flights/confirmation/${res.data.booking_id}`);
    } catch (err) {
      toast.error(errorMessage(err, "Booking failed"));
    } finally {
      setSubmitting(false);
    }
  };
  const valid = travelDate && passengers.every((p) => p.name.trim().length > 1) && seatCount <= seatsLeft;
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Flight details", children: [
    /* @__PURE__ */ jsx(Head, { title: `${flight.flight_number} — ${flight.origin_city} to ${flight.destination_city}` }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs(Link, { href: "/flights", className: "mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-sky-600", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back to search"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-4 flex flex-wrap items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: [
              flight.airline,
              " · ",
              flight.flight_number
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500", children: [
              "Operates: ",
              (flight.days_of_week ?? []).map((d) => DAYS[d]).join(", ")
            ] })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: `rounded-full px-3 py-1 text-xs font-medium ${seatsLeft <= 10 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-800"}`, children: [
            seatsLeft,
            " seats left"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-y border-dashed border-gray-200 py-5 dark:border-gray-600", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: (_a = flight.departure_time) == null ? void 0 : _a.slice(0, 5) }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: flight.origin_code }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400", children: flight.origin_city })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center px-4", children: [
            /* @__PURE__ */ jsx(Clock, { className: "mb-1 h-4 w-4 text-gray-400" }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-500", children: [
              Math.floor(flight.duration_minutes / 60),
              "h ",
              flight.duration_minutes % 60,
              "m"
            ] }),
            /* @__PURE__ */ jsx(Plane, { className: "my-1 h-5 w-5 rotate-90 text-sky-500" }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase tracking-wide text-gray-400", children: "Direct" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: (_b = flight.arrival_time) == null ? void 0 : _b.slice(0, 5) }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-600", children: flight.destination_code }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400", children: flight.destination_city })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-baseline justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-500", children: "Fare per passenger" }),
          /* @__PURE__ */ jsx("span", { className: "text-2xl font-bold text-sky-600", children: formatCurrency(Number(flight.price)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-5 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("h2", { className: "flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white", children: [
          /* @__PURE__ */ jsx(Users, { className: "h-5 w-5" }),
          " Passenger information (",
          seatCount,
          ")"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Travel date" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                min: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
                value: travelDate,
                onChange: (e) => setTravelDate(e.target.value),
                className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300", children: [
              "Contact email ",
              /* @__PURE__ */ jsx("span", { className: "font-normal text-gray-400", children: "(optional)" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                value: contactEmail,
                onChange: (e) => setContactEmail(e.target.value),
                placeholder: "Confirmations go to your account email by default",
                className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              }
            )
          ] })
        ] }),
        passengers.map((p, i) => /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-4 sm:grid-cols-[auto_1fr_1fr_auto] dark:bg-gray-700/40", children: [
          /* @__PURE__ */ jsx("span", { className: "flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700", children: i + 1 }),
          /* @__PURE__ */ jsx(
            "input",
            {
              required: true,
              value: p.name,
              onChange: (e) => updatePassenger(i, { name: e.target.value }),
              placeholder: "Full name (as on ID)",
              className: "rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              value: p.passport,
              onChange: (e) => updatePassenger(i, { passport: e.target.value }),
              placeholder: "Passport / ID number (optional)",
              className: "rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            }
          ),
          seatCount > 1 && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => removePassenger(i), className: "text-gray-400 hover:text-red-500", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
        ] }, i)),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: addPassenger,
            disabled: seatCount >= 6 || seatCount >= seatsLeft,
            className: "flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-700 disabled:text-gray-300",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
              " Add another passenger"
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "border-t border-gray-200 pt-4 dark:border-gray-700", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-3 space-y-1.5 text-sm", children: [
            /* @__PURE__ */ jsx(Row, { label: `${formatCurrency(Number(flight.price))} × ${seatCount} passenger${seatCount > 1 ? "s" : ""}`, value: formatCurrency(Number(total)) }),
            /* @__PURE__ */ jsx(Row, { label: "Taxes & fees", value: "Included", muted: true }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900 dark:border-gray-700 dark:text-white", children: [
              /* @__PURE__ */ jsx("span", { children: "Total" }),
              /* @__PURE__ */ jsx("span", { children: formatCurrency(Number(total)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mb-4 flex items-center gap-1.5 text-xs text-gray-500", children: [
            /* @__PURE__ */ jsx(ShieldCheck, { className: "h-4 w-4 text-green-500" }),
            " Free cancellation — seats are released back to inventory."
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(
            "button",
            {
              onClick: book,
              disabled: !valid || submitting,
              className: "flex items-center gap-2 rounded-lg bg-sky-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50",
              children: submitting ? "Processing…" : /* @__PURE__ */ jsxs(Fragment, { children: [
                "Confirm booking ",
                /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
              ] })
            }
          ) })
        ] })
      ] })
    ] })
  ] });
}
function Row({ label, value, muted }) {
  return /* @__PURE__ */ jsxs("div", { className: `flex justify-between ${muted ? "text-gray-400" : "text-gray-600 dark:text-gray-300"}`, children: [
    /* @__PURE__ */ jsx("span", { children: label }),
    /* @__PURE__ */ jsx("span", { children: value })
  ] });
}
export {
  FlightShow as default
};
