import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Store, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/admin/vendors").then((res) => setVendors(res.data)).catch(() => setVendors([])).finally(() => setLoading(false));
  }, []);
  const updateStatus = async (vendorId, status) => {
    try {
      if (status === "approved") {
        await api.post(`/api/admin/vendors/${vendorId}/approve`);
      } else if (status === "suspended") {
        await api.post(`/api/admin/vendors/${vendorId}/suspend`);
      } else {
        await api.post(`/api/admin/vendors/${vendorId}/restore`);
      }
      setVendors(vendors.map((v) => v.id === vendorId ? { ...v, status } : v));
    } catch {
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Manage Vendors", children: [
    /* @__PURE__ */ jsx(Head, { title: "Manage Vendors" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Manage Vendors" }),
      loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) }) : vendors.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Store, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No vendors" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Store" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Products" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Orders" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Revenue" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y dark:divide-gray-700", children: vendors.map((v) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-3", children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: v.store_name }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: v.user_email })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${v.status === "approved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`, children: v.status }) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: v.total_products }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: v.total_orders }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: formatCurrency(v.revenue) }),
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 flex gap-2", children: [
            v.status !== "approved" && /* @__PURE__ */ jsx("button", { onClick: () => updateStatus(v.id, "approved"), className: "text-green-600 hover:text-green-800", children: /* @__PURE__ */ jsx(CheckCircle, { className: "h-4 w-4" }) }),
            v.status !== "suspended" && /* @__PURE__ */ jsx("button", { onClick: () => updateStatus(v.id, "suspended"), className: "text-red-600 hover:text-red-800", children: /* @__PURE__ */ jsx(XCircle, { className: "h-4 w-4" }) })
          ] })
        ] }, v.id)) })
      ] }) })
    ] })
  ] });
}
export {
  AdminVendors as default
};
