import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Package, Eye, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  useEffect(() => {
    const endpoint = statusFilter === "pending" ? "/api/admin/products/pending" : "/api/products?per_page=50";
    api.get(endpoint).then((res) => setProducts(res.data ?? [])).catch(() => setProducts([])).finally(() => setLoading(false));
  }, [statusFilter]);
  const approveProduct = async (id) => {
    try {
      await api.post(`/api/admin/products/${id}/approve`);
      setProducts(products.map((p) => p.id === id ? { ...p, status: "approved", approved_at: (/* @__PURE__ */ new Date()).toISOString() } : p));
    } catch {
    }
  };
  const rejectProduct = async (id) => {
    const reason = prompt("Reason for rejection:");
    if (reason === null) return;
    try {
      await api.post(`/api/admin/products/${id}/reject`, { reason });
      setProducts(products.map((p) => p.id === id ? { ...p, status: "rejected" } : p));
    } catch {
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Manage Products", children: [
    /* @__PURE__ */ jsx(Head, { title: "Manage Products" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Manage Products" }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: ["all", "pending", "approved", "rejected"].map((s) => /* @__PURE__ */ jsx("button", { onClick: () => setStatusFilter(s), className: `rounded-full px-4 py-1.5 text-sm font-medium capitalize ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-700"}`, children: s }, s)) }),
      loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) }) : products.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Package, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No products" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Product" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Vendor" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Price" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Stock" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y dark:divide-gray-700", children: products.map((p) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-3", children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: p.name }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: p.category })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-sm text-gray-500", children: p.vendor_name }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: formatCurrency(p.price) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: p.stock_quantity }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${p.status === "approved" ? "bg-green-100 text-green-800" : p.status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`, children: p.status }) }),
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 flex gap-2", children: [
            /* @__PURE__ */ jsx("a", { href: `/products/${p.id}`, target: "_blank", className: "text-gray-400 hover:text-gray-600", children: /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" }) }),
            p.status === "pending" && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("button", { onClick: () => approveProduct(p.id), className: "text-green-600 hover:text-green-800", children: /* @__PURE__ */ jsx(CheckCircle, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsx("button", { onClick: () => rejectProduct(p.id), className: "text-red-600 hover:text-red-800", children: /* @__PURE__ */ jsx(XCircle, { className: "h-4 w-4" }) })
            ] })
          ] })
        ] }, p.id)) })
      ] }) })
    ] })
  ] });
}
export {
  AdminProducts as default
};
