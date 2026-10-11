import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as formatDateTime, f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Package, Eye, XCircle } from "lucide-react";
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
function Orders({ orders }) {
  const list = (orders == null ? void 0 : orders.data) ?? [];
  return /* @__PURE__ */ jsxs(AppLayout, { title: "My Orders", children: [
    /* @__PURE__ */ jsx(Head, { title: "Orders" }),
    /* @__PURE__ */ jsx("div", { className: "space-y-6", children: list.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
      /* @__PURE__ */ jsx(Package, { className: "mx-auto h-12 w-12 text-gray-400" }),
      /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No orders yet" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-500", children: "Start shopping to see your orders here." }),
      /* @__PURE__ */ jsx(
        Link,
        {
          href: "/products",
          className: "mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500",
          children: "Browse Products"
        }
      )
    ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: list.map((order) => {
      var _a;
      return /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: [
              "Order #",
              order.order_number
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: formatDateTime(order.created_at) })
          ] }),
          /* @__PURE__ */ jsx("span", { className: `rounded-full px-3 py-1 text-xs font-medium ${statusColors[order.status] ?? "bg-gray-100 text-gray-800"}`, children: order.status })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: [
              ((_a = order.items) == null ? void 0 : _a.length) ?? 0,
              " items"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-gray-900 dark:text-white", children: formatCurrency(order.total_amount) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: `/orders/${order.id}`,
                className: "inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300",
                children: [
                  /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" }),
                  "View"
                ]
              }
            ),
            ["pending", "confirmed"].includes(order.status) && /* @__PURE__ */ jsxs(
              Link,
              {
                href: `/orders/${order.id}/cancel`,
                method: "post",
                className: "inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50",
                children: [
                  /* @__PURE__ */ jsx(XCircle, { className: "h-4 w-4" }),
                  "Cancel"
                ]
              }
            )
          ] })
        ] })
      ] }, order.id);
    }) }) })
  ] });
}
export {
  Orders as default
};
