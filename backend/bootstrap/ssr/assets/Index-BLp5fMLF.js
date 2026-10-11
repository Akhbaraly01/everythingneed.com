import { jsx, jsxs } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { ShoppingCart, TrendingUp, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function AnalyticsIndex() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/analytics/summary").then((res) => setData(res.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);
  if (loading) return /* @__PURE__ */ jsx(AppLayout, { title: "My Analytics", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." }) });
  if (!data) return /* @__PURE__ */ jsx(AppLayout, { title: "My Analytics", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-red-500", children: "Failed to load" }) });
  const cards = [
    { label: "Total Orders", value: data.total_orders, icon: ShoppingCart, color: "text-blue-600" },
    { label: "Total Spent", value: formatCurrency(data.total_spent), icon: TrendingUp, color: "text-green-600" },
    { label: "Wishlist Items", value: data.total_wishlist, icon: Eye, color: "text-red-500" }
  ];
  return /* @__PURE__ */ jsxs(AppLayout, { title: "My Analytics", children: [
    /* @__PURE__ */ jsx(Head, { title: "My Analytics" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "My Analytics" }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-3", children: cards.map((c) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: c.label }),
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: c.value })
      ] }, c.label)) }),
      data.orders_by_month.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white", children: "Orders by Month" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-2", children: data.orders_by_month.map((m) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-600 dark:text-gray-400", children: m.month }),
          /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
            m.count,
            " orders"
          ] }),
          /* @__PURE__ */ jsx("span", { children: formatCurrency(m.total) })
        ] }, m.month)) })
      ] })
    ] })
  ] });
}
export {
  AnalyticsIndex as default
};
