import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency, a as formatDateTime } from "./PushNotificationPrompt-DvDsnr4H.js";
import { ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  useEffect(() => {
    const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
    api.get(`/api/admin/orders${params}`).then((res) => setOrders(res.data)).catch(() => setOrders([])).finally(() => setLoading(false));
  }, [statusFilter]);
  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/api/admin/orders/${orderId}/status`, { status });
      setOrders(orders.map((o) => o.id === orderId ? { ...o, status } : o));
    } catch {
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Manage Orders", children: [
    /* @__PURE__ */ jsx(Head, { title: "Manage Orders" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Manage Orders" }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: ["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((s) => /* @__PURE__ */ jsx("button", { onClick: () => setStatusFilter(s), className: `rounded-full px-4 py-1.5 text-sm font-medium capitalize ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-700"}`, children: s }, s)) }),
      loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) }) : orders.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(ShoppingCart, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No orders" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Reference" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Customer" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Items" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Total" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Payment" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Date" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y dark:divide-gray-700", children: orders.map((o) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-mono text-xs", children: o.reference }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-sm", children: o.user_name }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-sm", children: o.items_count }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-semibold", children: formatCurrency(o.total) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium capitalize ${o.status === "delivered" ? "bg-green-100 text-green-800" : o.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`, children: o.status }) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("span", { className: `text-xs font-medium ${o.payment_status === "paid" ? "text-green-600" : o.payment_status === "refunded" ? "text-orange-600" : "text-gray-500"}`, children: o.payment_status }) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-gray-500", children: formatDateTime(o.created_at) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxs(
            "select",
            {
              value: o.status,
              onChange: (e) => updateStatus(o.id, e.target.value),
              className: "rounded border px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700",
              children: [
                /* @__PURE__ */ jsx("option", { value: "pending", children: "Pending" }),
                /* @__PURE__ */ jsx("option", { value: "processing", children: "Processing" }),
                /* @__PURE__ */ jsx("option", { value: "shipped", children: "Shipped" }),
                /* @__PURE__ */ jsx("option", { value: "delivered", children: "Delivered" }),
                /* @__PURE__ */ jsx("option", { value: "cancelled", children: "Cancelled" })
              ]
            }
          ) })
        ] }, o.id)) })
      ] }) })
    ] })
  ] });
}
export {
  AdminOrders as default
};
