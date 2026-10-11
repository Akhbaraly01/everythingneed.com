import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { a as formatDateTime } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Shield } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  useEffect(() => {
    const params = actionFilter ? `?action=${encodeURIComponent(actionFilter)}` : "";
    api.get(`/api/admin/audit-logs${params}`).then((res) => setLogs(res.data)).catch(() => setLogs([])).finally(() => setLoading(false));
  }, [actionFilter]);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Audit Logs", children: [
    /* @__PURE__ */ jsx(Head, { title: "Audit Logs" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Audit Logs" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          value: actionFilter,
          onChange: (e) => setActionFilter(e.target.value),
          placeholder: "Filter by action...",
          className: "w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
        }
      ),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : logs.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Shield, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No audit logs" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "User" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Action" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Entity" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "IP" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Time" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y dark:divide-gray-700", children: logs.map((l) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium text-gray-900 dark:text-white", children: l.user_name }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("span", { className: "rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700", children: l.action }) }),
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 text-sm text-gray-500", children: [
            l.entity_type,
            " #",
            l.entity_id
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-gray-400", children: l.ip_address }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-gray-500", children: formatDateTime(l.created_at) })
        ] }, l.id)) })
      ] }) })
    ] })
  ] });
}
export {
  AdminAuditLogs as default
};
