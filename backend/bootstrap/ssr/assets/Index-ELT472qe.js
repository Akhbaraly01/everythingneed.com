import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { a as formatDateTime } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Plus, Headphones, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};
const statusColors = {
  open: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
  waiting: "bg-yellow-100 text-yellow-800",
  resolved: "bg-gray-100 text-gray-800",
  closed: "bg-gray-200 text-gray-700"
};
function TicketsIndex() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/tickets").then((res) => setTickets(res.data)).catch(() => setTickets([])).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Support Tickets", children: [
    /* @__PURE__ */ jsx(Head, { title: "Support Tickets" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
          tickets.length,
          " ticket",
          tickets.length !== 1 ? "s" : ""
        ] }),
        /* @__PURE__ */ jsxs(
          Link,
          {
            href: "/tickets/create",
            className: "inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
              " New Ticket"
            ]
          }
        )
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) }) : tickets.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Headphones, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No tickets yet" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-500", children: "Need help? Create a support ticket." }),
        /* @__PURE__ */ jsx(Link, { href: "/tickets/create", className: "mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500", children: "Create Ticket" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: tickets.map((ticket) => /* @__PURE__ */ jsxs(
        Link,
        {
          href: `/tickets/${ticket.id}`,
          className: "flex items-center justify-between rounded-lg bg-white p-4 shadow transition hover:shadow-md dark:bg-gray-800",
          children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-mono text-gray-500", children: ticket.ticket_number }),
                /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[ticket.priority] ?? "bg-gray-100 text-gray-800"}`, children: ticket.priority }),
                /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[ticket.status] ?? "bg-gray-100 text-gray-800"}`, children: ticket.status })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 font-medium text-gray-900 dark:text-white", children: ticket.subject }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400", children: formatDateTime(ticket.created_at) })
            ] }),
            /* @__PURE__ */ jsx(ArrowRight, { className: "h-5 w-5 text-gray-400" })
          ]
        },
        ticket.id
      )) })
    ] })
  ] });
}
export {
  TicketsIndex as default
};
