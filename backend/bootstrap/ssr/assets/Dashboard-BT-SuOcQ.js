import { jsx, jsxs } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Users, Package, ShoppingCart, DollarSign, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/admin/stats").then((data) => setStats(data)).catch(() => setStats(null)).finally(() => setLoading(false));
  }, []);
  if (loading) return /* @__PURE__ */ jsx(AppLayout, { title: "Admin Dashboard", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center p-12", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) }) });
  if (!stats) return /* @__PURE__ */ jsx(AppLayout, { title: "Admin Dashboard", children: /* @__PURE__ */ jsx("div", { className: "p-12 text-center text-red-500", children: "Failed to load stats" }) });
  const cards = [
    { label: "Total Users", value: stats.total_users, icon: Users, href: "/admin/users", color: "text-blue-600" },
    { label: "Total Vendors", value: stats.total_vendors, icon: Package, href: "/admin/vendors", color: "text-green-600" },
    { label: "Total Orders", value: stats.total_orders, icon: ShoppingCart, href: "/admin/orders", color: "text-purple-600" },
    { label: "Revenue", value: formatCurrency(stats.total_revenue), icon: DollarSign, href: "/admin/orders", color: "text-yellow-600" },
    { label: "Pending Approvals", value: stats.pending_approvals, icon: AlertTriangle, href: "/admin/approvals", color: "text-orange-600" },
    { label: "Open Tickets", value: stats.open_tickets, icon: AlertTriangle, href: "/tickets", color: "text-red-600" }
  ];
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Admin Dashboard", children: [
    /* @__PURE__ */ jsx(Head, { title: "Admin Dashboard" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Admin Dashboard" }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: cards.map((card) => /* @__PURE__ */ jsx(
        Link,
        {
          href: card.href,
          className: "rounded-lg bg-white p-6 shadow transition hover:shadow-md dark:bg-gray-800",
          children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: card.label }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-2xl font-bold text-gray-900 dark:text-white", children: card.value })
            ] }),
            /* @__PURE__ */ jsx(card.icon, { className: `h-8 w-8 ${card.color}` })
          ] })
        },
        card.label
      )) }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white", children: "Recent Orders" }),
          /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-3", children: stats.recent_orders.map((o) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-600 dark:text-gray-400", children: o.user_name ?? o.id }),
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatCurrency(o.total) }),
            /* @__PURE__ */ jsx("span", { className: "rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700", children: o.status })
          ] }, o.id)) }),
          /* @__PURE__ */ jsx(Link, { href: "/admin/orders", className: "mt-4 block text-center text-sm text-indigo-600 hover:underline", children: "View all orders" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white", children: "Top Vendors" }),
          /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-3", children: stats.top_vendors.map((v) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-600 dark:text-gray-400", children: v.store_name }),
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatCurrency(v.revenue) }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-500", children: [
              v.orders_count,
              " orders"
            ] })
          ] }, v.id)) }),
          /* @__PURE__ */ jsx(Link, { href: "/admin/vendors", className: "mt-4 block text-center text-sm text-indigo-600 hover:underline", children: "View all vendors" })
        ] })
      ] })
    ] })
  ] });
}
export {
  AdminDashboard as default
};
