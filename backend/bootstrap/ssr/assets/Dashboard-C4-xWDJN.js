import { jsxs, jsx } from "react/jsx-runtime";
import { Head, Link } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { f as formatCurrency, c as formatDate } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Store, BadgeCheck, Package, ShoppingCart, Wallet, Star, AlertTriangle, ArrowRight } from "lucide-react";
import "react";
import "./api-Dp2ndEHF.js";
import "clsx";
import "sonner";
function VendorDashboard({ vendor, stats, recentOrders }) {
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Vendor portal", children: [
    /* @__PURE__ */ jsx(Head, { title: "Vendor dashboard" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100", children: /* @__PURE__ */ jsx(Store, { className: "h-6 w-6 text-indigo-600" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h1", { className: "flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white", children: [
              vendor.store_name,
              vendor.is_verified && /* @__PURE__ */ jsx(BadgeCheck, { className: "h-5 w-5 text-blue-500" })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm capitalize text-gray-500", children: [
              vendor.category,
              " · rating ",
              Number(vendor.rating ?? 0).toFixed(1),
              " ★"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(Link, { href: "/vendor/products", className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700", children: "Manage products" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4", children: [
        /* @__PURE__ */ jsx(StatCard, { icon: /* @__PURE__ */ jsx(Package, { className: "h-5 w-5" }), label: "Products", value: String(stats.products), sub: `${stats.active_products} active`, tone: "indigo" }),
        /* @__PURE__ */ jsx(StatCard, { icon: /* @__PURE__ */ jsx(ShoppingCart, { className: "h-5 w-5" }), label: "Orders", value: String(stats.orders_total), sub: stats.orders_pending > 0 ? `${stats.orders_pending} awaiting action` : "all handled", tone: "amber" }),
        /* @__PURE__ */ jsx(StatCard, { icon: /* @__PURE__ */ jsx(Wallet, { className: "h-5 w-5" }), label: "Delivered revenue", value: formatCurrency(stats.revenue_delivered), sub: "lifetime", tone: "green" }),
        /* @__PURE__ */ jsx(StatCard, { icon: /* @__PURE__ */ jsx(Star, { className: "h-5 w-5" }), label: "Store rating", value: `${Number(stats.rating ?? 0).toFixed(1)}`, sub: "out of 5", tone: "yellow" })
      ] }),
      stats.orders_pending > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30", children: [
        /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" }),
          " ",
          stats.orders_pending,
          " order",
          stats.orders_pending > 1 ? "s" : "",
          " waiting for your confirmation"
        ] }),
        /* @__PURE__ */ jsx(Link, { href: "/vendor/orders", className: "text-sm font-medium text-amber-900 underline dark:text-amber-100", children: "Review now" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-bold text-gray-900 dark:text-white", children: "Recent orders" }),
          /* @__PURE__ */ jsxs(Link, { href: "/vendor/orders", className: "flex items-center gap-1 text-sm text-indigo-600 hover:underline", children: [
            "View all ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "h-3.5 w-3.5" })
          ] })
        ] }),
        recentOrders.length === 0 ? /* @__PURE__ */ jsx("p", { className: "px-5 py-10 text-center text-sm text-gray-400", children: "No orders yet — publish products to start selling." }) : /* @__PURE__ */ jsx("ul", { className: "divide-y divide-gray-100 dark:divide-gray-700", children: recentOrders.map((o) => {
          var _a;
          return /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between px-5 py-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: o.product_name }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-400", children: [
                o.order_number,
                " · ",
                ((_a = o.customer) == null ? void 0 : _a.name) ?? "Guest",
                " · ",
                formatDate(o.created_at)
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${o.status === "delivered" ? "bg-green-100 text-green-800" : o.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-800"}`, children: o.status }),
              /* @__PURE__ */ jsx("span", { className: "font-semibold text-gray-900 dark:text-white", children: formatCurrency(Number(o.total_price)) })
            ] })
          ] }, o.id);
        }) })
      ] })
    ] })
  ] });
}
function StatCard({ icon, label, value, sub, tone }) {
  const tones = {
    indigo: "bg-indigo-100 text-indigo-600",
    amber: "bg-amber-100 text-amber-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600"
  };
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800", children: [
    /* @__PURE__ */ jsx("div", { className: `mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`, children: icon }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: label }),
    /* @__PURE__ */ jsx("p", { className: "text-xl font-bold text-gray-900 dark:text-white", children: value }),
    sub && /* @__PURE__ */ jsx("p", { className: "text-[11px] text-gray-400", children: sub })
  ] });
}
export {
  VendorDashboard as default
};
