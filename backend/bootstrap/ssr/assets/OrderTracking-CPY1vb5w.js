import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Pill } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function PharmacyOrderTracking() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const path = window.location.pathname;
    const id = path.split("/").pop();
    api.get(`/api/pharmacy/orders/${id}`).then((res) => {
      const o = res.data ?? {};
      const items = Array.isArray(o.items) ? o.items : [];
      setOrder({
        id: String(o.id ?? ""),
        reference: String(o.order_number ?? o.id ?? ""),
        status: String(o.status ?? "pending"),
        total: Number(o.total_amount ?? 0),
        items: items.map((it) => ({
          name: String(it.name ?? "Medicine"),
          quantity: Number(it.quantity ?? 1),
          unit_price: Number(it.unit_price ?? 0)
        })),
        shipping_address: o.delivery_address != null ? String(o.delivery_address) : void 0,
        tracking_number: o.tracking_number != null ? String(o.tracking_number) : void 0,
        created_at: String(o.created_at ?? "")
      });
    }).catch(() => setOrder(null)).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Pharmacy Order" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsx(Link, { href: "/pharmacy", className: "text-sm text-gray-500 hover:text-gray-700", children: "← Back to Pharmacy" }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : !order ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Pill, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "Order not found" })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
            "Order #",
            order.reference
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: formatCurrency(order.total) }),
            /* @__PURE__ */ jsx("span", { className: `rounded-full px-3 py-1 text-xs font-medium capitalize ${order.status === "delivered" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`, children: order.status })
          ] })
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
        order.tracking_number && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Tracking Number" }),
          /* @__PURE__ */ jsx("p", { className: "font-mono font-semibold text-gray-900 dark:text-white", children: order.tracking_number })
        ] }),
        order.shipping_address && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Shipping Address" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-900 dark:text-white", children: order.shipping_address })
        ] })
      ] })
    ] })
  ] });
}
export {
  PharmacyOrderTracking as default
};
