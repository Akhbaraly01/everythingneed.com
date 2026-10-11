import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { ArrowLeft, UtensilsCrossed, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function FoodOrderTracking() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const path = window.location.pathname;
    const id = path.split("/").pop();
    api.get(`/api/food/orders/${id}`).then((res) => setOrder(res.data)).catch(() => setOrder(null)).finally(() => setLoading(false));
  }, []);
  const statusSteps = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"];
  const currentStep = order ? statusSteps.indexOf(order.status) : -1;
  return /* @__PURE__ */ jsxs(AppLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Track Order" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsxs(Link, { href: "/food", className: "inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back to Food"
      ] }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : !order ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(UtensilsCrossed, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "Order not found" })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
            "Order #",
            order.reference
          ] }),
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: order.restaurant_name }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-semibold text-indigo-600", children: formatCurrency(order.total) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white mb-4", children: "Order Status" }),
          /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: statusSteps.map((step, idx) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center flex-1", children: [
            /* @__PURE__ */ jsx("div", { className: `h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${idx <= currentStep ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700"}`, children: idx + 1 }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-[10px] text-center text-gray-500 capitalize", children: step.replace(/_/g, " ") })
          ] }, step)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white mb-3", children: "Items" }),
          order.items.map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm py-1", children: [
            /* @__PURE__ */ jsxs("span", { children: [
              item.quantity,
              "x ",
              item.name
            ] }),
            /* @__PURE__ */ jsx("span", { children: formatCurrency(item.unit_price * item.quantity) })
          ] }, idx))
        ] }),
        order.delivery_address && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800 flex items-center gap-2 text-sm text-gray-600", children: [
          /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4" }),
          " ",
          order.delivery_address
        ] })
      ] })
    ] })
  ] });
}
export {
  FoodOrderTracking as default
};
