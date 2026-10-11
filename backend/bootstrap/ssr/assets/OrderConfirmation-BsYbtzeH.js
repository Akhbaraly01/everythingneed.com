import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { a as formatDateTime, f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Package, CheckCircle, Truck, MapPin, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};
function PharmacyOrderConfirmation() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = window.location.pathname.split("/").filter(Boolean).pop();
    api.get(`/api/pharmacy/orders/${id}`).then((res) => {
      const o = res.data ?? {};
      const items = Array.isArray(o.items) ? o.items : [];
      setOrder({
        id: String(o.id ?? ""),
        reference: String(o.order_number ?? o.id ?? ""),
        status: String(o.status ?? "pending"),
        total: Number(o.total_amount ?? 0),
        delivery_address: o.delivery_address != null ? String(o.delivery_address) : o.shipping_address != null ? String(o.shipping_address) : void 0,
        created_at: String(o.created_at ?? ""),
        items: items.map((it) => ({
          name: String(it.name ?? "Medicine"),
          quantity: Number(it.quantity ?? 1),
          unit_price: Number(it.unit_price ?? it.price ?? 0)
        }))
      });
    }).catch(() => setOrder(null)).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Order Confirmation", children: [
    /* @__PURE__ */ jsx(Head, { title: "Order Confirmed" }),
    /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-2xl space-y-6", children: loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading order details…" }) }) : !order ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
      /* @__PURE__ */ jsx(Package, { className: "mx-auto h-12 w-12 text-gray-400" }),
      /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "Order not found" }),
      /* @__PURE__ */ jsx(
        Link,
        {
          href: "/pharmacy",
          className: "mt-4 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500",
          children: "Go to Pharmacy"
        }
      )
    ] }) : /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800", children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100", children: /* @__PURE__ */ jsx(CheckCircle, { className: "h-10 w-10 text-green-600" }) }),
      /* @__PURE__ */ jsx("h1", { className: "mb-2 text-2xl font-bold text-gray-900 dark:text-white", children: "Order Placed Successfully!" }),
      /* @__PURE__ */ jsx("p", { className: "mb-6 text-gray-500", children: "Your order has been received and is being processed." }),
      /* @__PURE__ */ jsxs("div", { className: "mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-900", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Order Number" }),
        /* @__PURE__ */ jsx("p", { className: "text-xl font-bold text-indigo-600", children: order.reference }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-gray-400", children: formatDateTime(order.created_at) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-left", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 font-medium text-gray-900 dark:text-white", children: [
            /* @__PURE__ */ jsx(Package, { className: "h-5 w-5 text-gray-400" }),
            " Status"
          ] }),
          /* @__PURE__ */ jsx(
            "span",
            {
              className: `rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`,
              children: order.status
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 font-medium text-gray-900 dark:text-white", children: [
            /* @__PURE__ */ jsx(Truck, { className: "h-5 w-5 text-gray-400" }),
            " Estimated Delivery"
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-500", children: "2-3 business days" })
        ] }),
        order.delivery_address && /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-gray-200 p-3 dark:border-gray-700", children: [
          /* @__PURE__ */ jsxs("span", { className: "mb-1 flex items-center gap-2 font-medium text-gray-900 dark:text-white", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "h-5 w-5 text-gray-400" }),
            " Delivery Address"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "pl-7 text-sm text-gray-500", children: order.delivery_address })
        ] }),
        order.items.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-gray-200 p-3 dark:border-gray-700", children: [
          /* @__PURE__ */ jsx("p", { className: "mb-2 font-medium text-gray-900 dark:text-white", children: "Items" }),
          order.items.map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm py-1", children: [
            /* @__PURE__ */ jsxs("span", { children: [
              item.quantity,
              "x ",
              item.name
            ] }),
            /* @__PURE__ */ jsx("span", { children: formatCurrency(item.unit_price * item.quantity) })
          ] }, idx))
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700", children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: "Total Amount" }),
          /* @__PURE__ */ jsx("span", { className: "text-xl font-bold text-indigo-600", children: formatCurrency(order.total) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col gap-3 sm:flex-row", children: [
        /* @__PURE__ */ jsxs(
          Link,
          {
            href: "/pharmacy",
            className: "flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300",
            children: [
              /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
              " Continue Shopping"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            href: "/orders",
            className: "flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500",
            children: "View My Orders"
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  PharmacyOrderConfirmation as default
};
