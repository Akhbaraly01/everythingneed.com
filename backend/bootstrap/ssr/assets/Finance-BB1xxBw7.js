import { jsx, jsxs } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency, a as formatDateTime } from "./PushNotificationPrompt-DvDsnr4H.js";
import { useState, useEffect } from "react";
import "lucide-react";
import "clsx";
import "sonner";
function AdminFinance() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([
      api.get("/api/admin/finance/summary"),
      api.get("/api/admin/finance/transactions")
    ]).then(([summary, tx]) => {
      var _a, _b, _c, _d;
      const txRows = (tx.data ?? []).slice(0, 5).map((t) => ({
        id: String(t.id),
        type: String(t.type ?? "payment"),
        description: t.description ?? `${t.type ?? "Payment"} payment`,
        amount: Number(t.amount ?? 0),
        created_at: t.created_at
      }));
      setStats({
        total_revenue: Number(((_a = summary.data) == null ? void 0 : _a.total_revenue) ?? 0),
        total_payouts: Number(((_b = summary.data) == null ? void 0 : _b.total_commissions) ?? 0),
        pending_payouts: Number(((_c = summary.data) == null ? void 0 : _c.pending_payouts) ?? 0),
        revenue_by_month: (((_d = summary.data) == null ? void 0 : _d.revenue_by_month) ?? []).map((m) => ({
          month: m.month,
          revenue: Number(m.revenue ?? 0),
          orders: Number(m.orders ?? 0)
        })),
        recent_transactions: txRows
      });
    }).catch(() => setStats(null)).finally(() => setLoading(false));
  }, []);
  if (loading) return /* @__PURE__ */ jsx(AppLayout, { title: "Finance", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." }) });
  if (!stats) return /* @__PURE__ */ jsx(AppLayout, { title: "Finance", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-red-500", children: "Failed to load" }) });
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Finance", children: [
    /* @__PURE__ */ jsx(Head, { title: "Admin Finance" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Finance Overview" }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Total Revenue" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: formatCurrency(stats.total_revenue) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Total Payouts" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: formatCurrency(stats.total_payouts) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Pending Payouts" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-orange-600", children: formatCurrency(stats.pending_payouts) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Net Revenue" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-green-600", children: formatCurrency(stats.total_revenue - stats.total_payouts) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white", children: "Monthly Revenue" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-2", children: stats.revenue_by_month.map((m) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-600 dark:text-gray-400", children: m.month }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatCurrency(m.revenue) }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-500", children: [
            m.orders,
            " orders"
          ] })
        ] }, m.month)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white", children: "Recent Transactions" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-2", children: stats.recent_transactions.map((t) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-gray-900 dark:text-white", children: t.description }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: formatDateTime(t.created_at) })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: `font-semibold ${t.type === "credit" ? "text-green-600" : "text-red-600"}`, children: [
            t.type === "credit" ? "+" : "-",
            formatCurrency(t.amount)
          ] })
        ] }, t.id)) })
      ] })
    ] })
  ] });
}
export {
  AdminFinance as default
};
