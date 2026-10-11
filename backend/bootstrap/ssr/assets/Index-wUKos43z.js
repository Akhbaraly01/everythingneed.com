import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { Package } from "lucide-react";
import { useState, useEffect } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function InventoryIndex() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/stock").then((res) => setItems(res.data)).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Inventory", children: [
    /* @__PURE__ */ jsx(Head, { title: "Inventory" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Inventory Management" }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : items.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Package, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No inventory items" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Product" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "SKU" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Quantity" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Reserved" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Available" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Status" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y dark:divide-gray-700", children: items.map((item) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium text-gray-900 dark:text-white", children: item.product_name }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-gray-500 font-mono", children: item.sku }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: item.quantity }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: item.reserved }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-semibold", children: item.available }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${item.available <= 0 ? "bg-red-100 text-red-800" : item.low_stock_threshold && item.available <= item.low_stock_threshold ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`, children: item.available <= 0 ? "Out of Stock" : item.low_stock_threshold && item.available <= item.low_stock_threshold ? "Low Stock" : "In Stock" }) })
        ] }, item.id)) })
      ] }) })
    ] })
  ] });
}
export {
  InventoryIndex as default
};
