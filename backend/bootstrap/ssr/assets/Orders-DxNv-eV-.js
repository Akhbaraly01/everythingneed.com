import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Link, Head, router } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { c as formatDate, f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ShoppingCart, PackageCheck, Truck } from "lucide-react";
import "clsx";
function Pagination({ currentPage, lastPage, hrefFor }) {
  if (lastPage <= 1) return null;
  return /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-center justify-center gap-3", children: [
    currentPage > 1 ? /* @__PURE__ */ jsx(Link, { href: hrefFor(currentPage - 1), preserveState: true, className: "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:text-white", children: /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" }) }) : /* @__PURE__ */ jsx("span", { className: "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-300 dark:border-gray-700", children: /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" }) }),
    /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-600 dark:text-gray-300", children: [
      "Page ",
      currentPage,
      " of ",
      lastPage
    ] }),
    currentPage < lastPage ? /* @__PURE__ */ jsx(Link, { href: hrefFor(currentPage + 1), preserveState: true, className: "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:text-white", children: /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" }) }) : /* @__PURE__ */ jsx("span", { className: "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-300 dark:border-gray-700", children: /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" }) })
  ] });
}
const statusStyles = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700"
};
function VendorOrders({ orders }) {
  const [busyId, setBusyId] = useState(null);
  const transition = async (order, action, label) => {
    setBusyId(order.id);
    try {
      await api.post(`/api/vendor/orders/${order.id}/${action}`);
      toast.success(label);
      router.reload({ only: ["orders"] });
    } catch (err) {
      toast.error(errorMessage(err, "Action failed"));
    } finally {
      setBusyId(null);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Vendor orders", children: [
    /* @__PURE__ */ jsx(Head, { title: "Incoming orders" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("span", { className: "flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100", children: /* @__PURE__ */ jsx(ShoppingCart, { className: "h-6 w-6 text-blue-600" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Orders" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
            orders.total,
            " orders received"
          ] })
        ] })
      ] }),
      orders.data.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-600", children: [
        /* @__PURE__ */ jsx(ShoppingCart, { className: "mx-auto mb-3 h-10 w-10 text-gray-300" }),
        /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "No orders yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "When customers buy your products they'll appear here." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: orders.data.map((o) => {
        var _a;
        return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("p", { className: "font-medium text-gray-900 dark:text-white", children: [
                o.product_name,
                " × ",
                o.quantity
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "mt-0.5 text-xs text-gray-500", children: [
                o.order_number,
                " · ",
                ((_a = o.customer) == null ? void 0 : _a.name) ?? "Guest",
                " · ",
                formatDate(o.created_at)
              ] }),
              o.shipping_address && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-gray-400", children: [
                "📍 ",
                o.shipping_address
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[o.status]}`, children: o.status }),
              /* @__PURE__ */ jsx("span", { className: "font-bold text-gray-900 dark:text-white", children: formatCurrency(Number(o.total_price)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-700", children: [
            o.status === "pending" && /* @__PURE__ */ jsxs(
              "button",
              {
                disabled: busyId === o.id,
                onClick: () => transition(o, "accept", "Order confirmed"),
                className: "flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700",
                children: [
                  /* @__PURE__ */ jsx(PackageCheck, { className: "h-3.5 w-3.5" }),
                  " Accept order"
                ]
              }
            ),
            o.status === "confirmed" && /* @__PURE__ */ jsxs(
              "button",
              {
                disabled: busyId === o.id,
                onClick: () => transition(o, "ship", "Marked as shipped"),
                className: "flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700",
                children: [
                  /* @__PURE__ */ jsx(Truck, { className: "h-3.5 w-3.5" }),
                  " Mark shipped"
                ]
              }
            ),
            o.status === "shipped" && /* @__PURE__ */ jsxs(
              "button",
              {
                disabled: busyId === o.id,
                onClick: () => transition(o, "deliver", "Marked as delivered"),
                className: "flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700",
                children: [
                  /* @__PURE__ */ jsx(PackageCheck, { className: "h-3.5 w-3.5" }),
                  " Mark delivered"
                ]
              }
            ),
            (o.status === "delivered" || o.status === "cancelled") && /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-400", children: [
              "Nothing to do — order ",
              o.status,
              "."
            ] })
          ] })
        ] }, o.id);
      }) }),
      /* @__PURE__ */ jsx(Pagination, { currentPage: orders.current_page, lastPage: orders.last_page, hrefFor: (p) => `/vendor/orders?page=${p}` })
    ] })
  ] });
}
export {
  VendorOrders as default
};
