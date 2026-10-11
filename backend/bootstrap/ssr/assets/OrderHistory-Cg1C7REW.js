import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { ChefHat, XCircle, CheckCircle, Truck, Clock } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
const STATUS_MAP = {
  pending: { label: "Pending", icon: Clock, color: "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30" },
  confirmed: { label: "Confirmed", icon: CheckCircle, color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30" },
  preparing: { label: "Preparing", icon: ChefHat, color: "text-orange-500 bg-orange-100 dark:bg-orange-900/30" },
  out_for_delivery: { label: "Out for Delivery", icon: Truck, color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "text-green-500 bg-green-100 dark:bg-green-900/30" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-red-500 bg-red-100 dark:bg-red-900/30" }
};
function FoodOrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/food/orders").then((res) => setOrders(res.data)).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Food Orders", children: [
    /* @__PURE__ */ jsx(Head, { title: "Food Orders" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "My Food Orders" }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : orders.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(ChefHat, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No orders yet" }),
        /* @__PURE__ */ jsx(Link, { href: "/food", className: "mt-4 inline-block text-blue-600 hover:underline", children: "Browse Restaurants" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: orders.map((order) => {
        const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
        const Icon = status.icon;
        return /* @__PURE__ */ jsxs(
          Link,
          {
            href: `/food/orders/${order.id}`,
            className: "block rounded-lg bg-white p-4 shadow hover:ring-2 hover:ring-blue-500 dark:bg-gray-800",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900 dark:text-white", children: order.restaurant.name }),
                  /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
                    "#",
                    order.order_number
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${status.color}`, children: [
                  /* @__PURE__ */ jsx(Icon, { className: "h-3 w-3" }),
                  " ",
                  status.label
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center justify-between text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: new Date(order.created_at).toLocaleDateString() }),
                /* @__PURE__ */ jsxs("span", { className: "font-semibold text-gray-900 dark:text-white", children: [
                  "$",
                  order.total_amount
                ] })
              ] })
            ]
          },
          order.id
        );
      }) })
    ] })
  ] });
}
export {
  FoodOrderHistory as default
};
