import { jsx, jsxs } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { Users, ShoppingCart, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/admin/analytics/overview").then((data2) => setData(data2)).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);
  if (loading) return /* @__PURE__ */ jsx(AppLayout, { title: "Admin Analytics", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." }) });
  if (!data) return /* @__PURE__ */ jsx(AppLayout, { title: "Admin Analytics", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-red-500", children: "Failed to load" }) });
  const cards = [
    { label: "Total Users", value: data.total_users, sub: `${data.new_users_today} today`, icon: Users, color: "text-blue-600" },
    { label: "Total Orders", value: data.total_orders, sub: `${data.orders_today} today`, icon: ShoppingCart, color: "text-green-600" },
    { label: "Total Revenue", value: `$${data.total_revenue.toFixed(2)}`, sub: `$${data.revenue_today.toFixed(2)} today`, icon: DollarSign, color: "text-yellow-600" }
  ];
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Admin Analytics", children: [
    /* @__PURE__ */ jsx(Head, { title: "Admin Analytics" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Platform Analytics" }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-3", children: cards.map((c) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: c.label }),
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: c.value }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400", children: c.sub })
      ] }, c.label)) }),
      data.user_growth.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white", children: "User Growth" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-2", children: data.user_growth.map((m) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-600 dark:text-gray-400", children: m.month }),
          /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
            m.count,
            " users"
          ] })
        ] }, m.month)) })
      ] }),
      data.revenue_by_category.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white", children: "Revenue by Category" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-2", children: data.revenue_by_category.map((c) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-600 dark:text-gray-400 capitalize", children: c.category }),
          /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
            "$",
            c.revenue.toFixed(2)
          ] })
        ] }, c.category)) })
      ] })
    ] })
  ] });
}
export {
  AdminAnalytics as default
};
