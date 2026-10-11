import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { a as formatDateTime } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Headphones } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/admin/support/tickets").then((res) => setTickets(res.data)).catch(() => setTickets([])).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Support Staff", children: [
    /* @__PURE__ */ jsx(Head, { title: "Support Staff" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Support Tickets" }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : tickets.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Headphones, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No tickets" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Reference" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Subject" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "User" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Priority" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Created" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y dark:divide-gray-700", children: tickets.map((t) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-mono text-xs", children: t.reference }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium text-gray-900 dark:text-white", children: t.subject }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-sm text-gray-500", children: t.user_name }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${t.status === "open" ? "bg-green-100 text-green-800" : t.status === "closed" ? "bg-gray-100 text-gray-800" : "bg-blue-100 text-blue-800"}`, children: t.status }) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${t.priority === "urgent" ? "bg-red-100 text-red-800" : t.priority === "high" ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-800"}`, children: t.priority }) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-gray-500", children: formatDateTime(t.created_at) })
        ] }, t.id)) })
      ] }) })
    ] })
  ] });
}
export {
  AdminSupport as default
};
