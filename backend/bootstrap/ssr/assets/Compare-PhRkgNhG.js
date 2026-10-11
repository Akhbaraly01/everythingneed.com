import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { useState, useEffect } from "react";
import { Scale, X, Star } from "lucide-react";
import "clsx";
import "sonner";
function ProductCompare() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = () => {
    api.get("/api/products/comparison").then((res) => setProducts(res.data)).catch(() => setProducts([])).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);
  const remove = async (id) => {
    await api.del(`/api/compare/${id}`).catch(() => {
    });
    load();
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Compare Products", children: [
    /* @__PURE__ */ jsx(Head, { title: "Compare Products" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Scale, { className: "h-6 w-6" }),
        " Compare Products"
      ] }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : products.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Scale, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No products to compare" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400", children: "Add products to comparison from product pages" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b dark:border-gray-700", children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left", children: "Feature" }),
          products.map((p) => /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "truncate max-w-[120px]", children: p.name }),
            /* @__PURE__ */ jsx("button", { onClick: () => remove(p.id), className: "text-red-500 hover:text-red-700", children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) })
          ] }) }, p.id))
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { className: "divide-y dark:divide-gray-700", children: [
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium", children: "Price" }),
            products.map((p) => /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-bold text-green-600", children: formatCurrency(p.price) }, p.id))
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium", children: "Rating" }),
            products.map((p) => /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Star, { className: "h-4 w-4 text-yellow-400" }),
              p.rating || "N/A"
            ] }, p.id))
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium", children: "Category" }),
            products.map((p) => /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: p.category }, p.id))
          ] }),
          /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium", children: "Stock" }),
            products.map((p) => /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: p.stock_quantity > 0 ? `${p.stock_quantity} in stock` : "Out of stock" }, p.id))
          ] })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  ProductCompare as default
};
