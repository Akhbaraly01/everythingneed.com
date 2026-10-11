import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as formatDateTime, f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { XCircle, CheckCircle, Truck, Package, Clock, ArrowLeft } from "lucide-react";
import "react";
import "./api-Dp2ndEHF.js";
import "clsx";
import "sonner";
const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};
const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle
};
function OrderShow({ order }) {
  var _a, _b, _c;
  const StatusIcon = statusIcons[order.status] ?? Package;
  return /* @__PURE__ */ jsxs(AppLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: `Order #${order.order_number}` }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
      /* @__PURE__ */ jsxs(Link, { href: "/orders", className: "inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        "Back to orders"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: [
            "Order #",
            order.order_number
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-gray-500", children: [
            "Placed on ",
            formatDateTime(order.created_at)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${statusColors[order.status] ?? "bg-gray-100 text-gray-800"}`, children: [
          /* @__PURE__ */ jsx(StatusIcon, { className: "h-4 w-4" }),
          order.status
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Items" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 divide-y dark:divide-gray-700", children: (_a = order.items) == null ? void 0 : _a.map((item) => {
          var _a2, _b2;
          return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 py-4", children: [
            /* @__PURE__ */ jsx("div", { className: "h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100", children: ((_a2 = item.product) == null ? void 0 : _a2.image_url) ? /* @__PURE__ */ jsx("img", { src: item.product.image_url, alt: item.product_name, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center text-gray-400", children: /* @__PURE__ */ jsx(Package, { className: "h-6 w-6" }) }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: item.product_name }),
              ((_b2 = item.variant) == null ? void 0 : _b2.name) && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: item.variant.name }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
                "Qty: ",
                item.quantity
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900 dark:text-white", children: formatCurrency(item.total_price) })
          ] }, item.id);
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Order Summary" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Subtotal" }),
            /* @__PURE__ */ jsx("span", { className: "text-gray-900 dark:text-white", children: formatCurrency(order.subtotal) })
          ] }),
          order.discount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Discount" }),
            /* @__PURE__ */ jsxs("span", { className: "text-green-600", children: [
              "-",
              formatCurrency(order.discount)
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Shipping" }),
            /* @__PURE__ */ jsx("span", { className: "text-gray-900 dark:text-white", children: formatCurrency(order.shipping_fee) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-t border-gray-200 pt-2 text-lg font-bold dark:border-gray-700", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-900 dark:text-white", children: "Total" }),
            /* @__PURE__ */ jsx("span", { className: "text-gray-900 dark:text-white", children: formatCurrency(order.total_amount) })
          ] })
        ] })
      ] }),
      order.shipping_address && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Shipping Address" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-600 dark:text-gray-400", children: order.shipping_address }),
        order.shipping_city && /* @__PURE__ */ jsxs("p", { className: "text-gray-600 dark:text-gray-400", children: [
          order.shipping_city,
          ", ",
          order.shipping_country
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3", children: [
        /* @__PURE__ */ jsx(Link, { href: `/orders/${order.id}/tracking`, className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700", children: "Track Order" }),
        /* @__PURE__ */ jsx(Link, { href: `/orders/returns?order=${order.id}`, className: "rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700", children: "Request Return" }),
        /* @__PURE__ */ jsx(Link, { href: `/orders/disputes?order=${order.id}`, className: "rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700", children: "Open Dispute" }),
        /* @__PURE__ */ jsx(Link, { href: `/reviews/create?type=product&id=${((_c = (_b = order.items) == null ? void 0 : _b[0]) == null ? void 0 : _c.product_id) || ""}`, className: "rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700", children: "Write Review" })
      ] }),
      order.tracking && order.tracking.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Tracking" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-4", children: order.tracking.map((t) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: t.status }),
            t.status_message && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: t.status_message }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400", children: formatDateTime(t.created_at) })
          ] })
        ] }, t.id)) })
      ] })
    ] })
  ] });
}
export {
  OrderShow as default
};
