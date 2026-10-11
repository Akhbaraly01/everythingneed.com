import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { a as formatDateTime } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Calendar, Video, MapPin, User, AlertCircle, Clock, Stethoscope, RotateCw } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import "clsx";
import "sonner";
const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800",
  assigned: "bg-blue-100 text-blue-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  in_consultation: "bg-indigo-100 text-indigo-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};
function MyHealthTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming");
  useEffect(() => {
    api.get("/api/health/tickets").then((res) => setTickets(res.data ?? [])).catch(() => setTickets([])).finally(() => setLoading(false));
  }, []);
  const { upcoming, past, cancelled } = useMemo(() => {
    const now = /* @__PURE__ */ new Date();
    const up = [];
    const pa = [];
    const ca = [];
    for (const t of tickets) {
      if (t.status === "cancelled") {
        ca.push(t);
        continue;
      }
      if (t.status === "completed") {
        pa.push(t);
        continue;
      }
      if (!t.appointment_date) {
        up.push(t);
        continue;
      }
      const start = /* @__PURE__ */ new Date(`${t.appointment_date}T${t.appointment_time || "00:00"}`);
      if (start.getTime() >= now.getTime()) up.push(t);
      else pa.push(t);
    }
    return { upcoming: up, past: pa, cancelled: ca };
  }, [tickets]);
  const visible = filter === "upcoming" ? upcoming : filter === "past" ? past : cancelled;
  return /* @__PURE__ */ jsxs(AppLayout, { title: "My Appointments", children: [
    /* @__PURE__ */ jsx(Head, { title: "My Appointments" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Health Tickets" }),
        /* @__PURE__ */ jsx(
          Link,
          {
            href: "/healthcare/doctors",
            className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500",
            children: "Book Appointment"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: ["upcoming", "past", "cancelled"].map((f) => /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => setFilter(f),
          className: `rounded-lg px-4 py-2 text-sm font-medium capitalize ${filter === f ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"}`,
          children: [
            f,
            " (",
            f === "upcoming" ? upcoming.length : f === "past" ? past.length : cancelled.length,
            ")"
          ]
        },
        f
      )) }),
      loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading your appointments…" }) }) : visible.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Calendar, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsxs("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: [
          "No ",
          filter,
          " appointments"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-500", children: filter === "upcoming" ? "Book your next appointment with a doctor" : "Nothing here yet" }),
        filter === "upcoming" && /* @__PURE__ */ jsx(
          Link,
          {
            href: "/healthcare/doctors",
            className: "mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500",
            children: "Book Now"
          }
        )
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: visible.map((ticket) => /* @__PURE__ */ jsx(
        "div",
        {
          className: "rounded-lg bg-white p-6 shadow transition hover:shadow-md dark:bg-gray-800",
          "data-ticket-status": ticket.status,
          children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-start md:justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "mb-3 flex flex-wrap items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "font-mono text-sm font-bold text-indigo-600", children: ticket.ticket_number || ticket.reference || ticket.id.slice(0, 8) }),
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: `rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[ticket.status] ?? "bg-gray-100 text-gray-700"}`,
                    children: ticket.status.replace(/_/g, " ")
                  }
                ),
                (ticket.consultation_type || ticket.type) && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700", children: [
                  (ticket.consultation_type || ticket.type) === "virtual" ? /* @__PURE__ */ jsx(Video, { className: "h-3 w-3" }) : /* @__PURE__ */ jsx(MapPin, { className: "h-3 w-3" }),
                  (ticket.consultation_type || ticket.type) === "virtual" ? "Virtual" : "Physical"
                ] })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "mb-2 font-medium text-gray-900 dark:text-white", children: ticket.symptoms || ticket.reason || "Consultation" }),
              ticket.description && /* @__PURE__ */ jsx("p", { className: "mb-3 line-clamp-2 text-sm text-gray-500", children: ticket.description }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4 text-sm text-gray-500", children: [
                ticket.doctor ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(User, { className: "h-4 w-4" }),
                  "Dr. ",
                  ticket.doctor.full_name || ticket.doctor.name,
                  ticket.doctor.specialization || ticket.doctor.specialty ? ` (${ticket.doctor.specialization || ticket.doctor.specialty})` : ""
                ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
                  "Awaiting doctor assignment"
                ] }),
                ticket.appointment_date && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(Calendar, { className: "h-4 w-4" }),
                  ticket.appointment_date
                ] }),
                ticket.appointment_time && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(Clock, { className: "h-4 w-4" }),
                  ticket.appointment_time
                ] }),
                ticket.consultation_fee ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(Stethoscope, { className: "h-4 w-4" }),
                  "$",
                  Number(ticket.consultation_fee).toFixed(2)
                ] }) : null
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 flex-col items-end gap-2", children: [
              filter === "upcoming" && ticket.status !== "completed" && /* @__PURE__ */ jsxs(
                Link,
                {
                  href: ticket.doctor && "id" in ticket.doctor ? `/healthcare/doctors/${ticket.doctor.id}` : "/healthcare/doctors",
                  className: "inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300",
                  children: [
                    /* @__PURE__ */ jsx(RotateCw, { className: "h-3.5 w-3.5" }),
                    "Reschedule"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-400", children: [
                "Created ",
                formatDateTime(ticket.created_at)
              ] })
            ] })
          ] })
        },
        ticket.id
      )) })
    ] })
  ] });
}
export {
  MyHealthTickets as default
};
