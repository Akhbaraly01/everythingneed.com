import { jsx, jsxs } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { Server, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function AdminSystem() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/admin/stats/system").then((res) => {
      var _a, _b, _c, _d, _e, _f, _g;
      const d = res.data ?? {};
      setHealth({
        php_version: d.php_version ?? "—",
        laravel_version: d.laravel_version ?? "—",
        database_status: ((_a = d.database) == null ? void 0 : _a.status) ?? "unknown",
        database_latency: ((_b = d.database) == null ? void 0 : _b.latency_ms) != null ? `${d.database.latency_ms} ms` : void 0,
        cache_status: ((_c = d.cache) == null ? void 0 : _c.status) ?? "unknown",
        cache_driver: (_d = d.cache) == null ? void 0 : _d.driver,
        queue_status: ((_e = d.queue) == null ? void 0 : _e.status) ?? "unknown",
        queue_pending: (_f = d.queue) == null ? void 0 : _f.pending_jobs,
        storage_used: ((_g = d.storage) == null ? void 0 : _g.used_percent) != null ? `${d.storage.used_percent}%` : "—",
        checked_at: d.checked_at ?? "—"
      });
    }).catch(() => setHealth(null)).finally(() => setLoading(false));
  }, []);
  if (loading) return /* @__PURE__ */ jsx(AppLayout, { title: "System Health", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." }) });
  if (!health) return /* @__PURE__ */ jsx(AppLayout, { title: "System Health", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-red-500", children: "Failed to load" }) });
  const StatusIcon = ({ status }) => status === "ok" || status === "running" ? /* @__PURE__ */ jsx(CheckCircle, { className: "h-5 w-5 text-green-500" }) : status === "error" ? /* @__PURE__ */ jsx(XCircle, { className: "h-5 w-5 text-red-500" }) : /* @__PURE__ */ jsx(Clock, { className: "h-5 w-5 text-yellow-500" });
  const items = [
    { label: "PHP Version", value: health.php_version },
    { label: "Laravel Version", value: health.laravel_version },
    { label: "Database", value: health.database_latency ? `${health.database_status} (${health.database_latency})` : health.database_status, status: true },
    { label: "Cache", value: health.cache_driver ? `${health.cache_status} (${health.cache_driver})` : health.cache_status, status: true },
    { label: "Queue", value: health.queue_pending != null ? `${health.queue_status} (${health.queue_pending} pending)` : health.queue_status, status: true },
    { label: "Storage Used", value: health.storage_used },
    { label: "Checked At", value: health.checked_at }
  ];
  return /* @__PURE__ */ jsxs(AppLayout, { title: "System Health", children: [
    /* @__PURE__ */ jsx(Head, { title: "System Health" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Server, { className: "h-6 w-6" }),
        " System Health"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("div", { className: "divide-y dark:divide-gray-700", children: items.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between py-3", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: item.label }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          item.status && /* @__PURE__ */ jsx(StatusIcon, { status: item.value }),
          /* @__PURE__ */ jsx("span", { className: "font-medium text-gray-900 dark:text-white capitalize", children: item.value })
        ] })
      ] }, item.label)) }) })
    ] })
  ] });
}
export {
  AdminSystem as default
};
