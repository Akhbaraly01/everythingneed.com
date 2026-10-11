import { jsx, jsxs } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { Clock, Package, DollarSign, User, MapPin } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function VendorOrderDetails({ order_id }) {
  var _a, _b;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const id = order_id || (typeof window !== "undefined" ? window.location.pathname.split("/").pop() : void 0);
  useEffect(() => {
    if (id) {
      api.get(`/api/vendor/orders/${id}`).then((res) => setOrder(res.data)).catch(() => {
      }).finally(() => setLoading(false));
    } else setLoading(false);
  }, [id]);
  const updateStatus = async (status) => {
    if (!id) return;
    setUpdating(true);
    try {
      const res = await api.patch(`/api/vendor/orders/${id}`, { status });
      setOrder(res.data);
    } catch {
    }
    setUpdating(false);
  };
  if (loading) return /* @__PURE__ */ jsx(AppLayout, { title: "Order Details", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." }) });
  if (!order) return /* @__PURE__ */ jsx(AppLayout, { title: "Order Details", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-red-500", children: "Order not found" }) });
  return /* @__PURE__ */ jsxs(AppLayout, { title: `Order ${order.order_number}`, children: [
    /* @__PURE__ */ jsx(Head, { title: `Order ${order.order_number}` }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-xl font-bold text-gray-900 dark:text-white", children: [
            "#",
            order.order_number
          ] }),
          /* @__PURE__ */ jsx("span", { className: `rounded-full px-3 py-1 text-xs font-medium ${order.status === "delivered" ? "bg-green-100 text-green-800" : order.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"}`, children: order.status })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500 flex items-center gap-1 mt-2", children: [
          /* @__PURE__ */ jsx(Clock, { className: "h-3 w-3" }),
          " ",
          new Date(order.created_at).toLocaleString()
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-3", children: [
        /* @__PURE__ */ jsxs("h2", { className: "font-semibold dark:text-white flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Package, { className: "h-4 w-4" }),
          " Product"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "dark:text-gray-300", children: [
          order.product_name,
          " × ",
          order.quantity
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "font-bold dark:text-white flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(DollarSign, { className: "h-4 w-4" }),
          " ",
          order.total_price
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-3", children: [
        /* @__PURE__ */ jsxs("h2", { className: "font-semibold dark:text-white flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(User, { className: "h-4 w-4" }),
          " Customer"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "dark:text-gray-300", children: (_a = order.customer) == null ? void 0 : _a.name }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: (_b = order.customer) == null ? void 0 : _b.email }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm dark:text-gray-300 flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4" }),
          " ",
          order.shipping_address || "No address"
        ] }),
        order.notes && /* @__PURE__ */ jsx("p", { className: "text-sm bg-gray-50 p-3 rounded dark:bg-gray-700 dark:text-gray-300", children: order.notes })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold dark:text-white mb-3", children: "Update Status" }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: ["confirmed", "processing", "shipped", "delivered", "cancelled"].map((s) => /* @__PURE__ */ jsx("button", { disabled: updating || order.status === s, onClick: () => updateStatus(s), className: "rounded-full border px-4 py-1.5 text-sm capitalize hover:bg-blue-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300", children: s }, s)) })
      ] })
    ] })
  ] });
}
export {
  VendorOrderDetails as default
};
