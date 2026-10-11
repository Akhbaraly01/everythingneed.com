import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function CategoriesShow({ category_id }) {
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get(`/api/categories/${category_id}`).then((catRes) => {
      const cat = catRes.data;
      setCategory(cat);
      return api.get(
        `/api/products?category=${encodeURIComponent((cat == null ? void 0 : cat.name) ?? "")}&per_page=20`
      );
    }).then((prodRes) => setProducts(prodRes.data ?? [])).catch(() => {
    }).finally(() => setLoading(false));
  }, [category_id]);
  return /* @__PURE__ */ jsxs(AppLayout, { title: (category == null ? void 0 : category.name) ?? "Category", children: [
    /* @__PURE__ */ jsx(Head, { title: (category == null ? void 0 : category.name) ?? "Category" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs(Link, { href: "/categories", className: "inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " All Categories"
      ] }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : category && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: category.name }),
          category.description && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: category.description })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: products.map((p) => /* @__PURE__ */ jsxs(Link, { href: `/products/${p.id}`, className: "rounded-lg bg-white p-4 shadow transition hover:shadow-md dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("div", { className: "h-32 rounded-lg bg-gray-100 dark:bg-gray-700", children: p.image_url && /* @__PURE__ */ jsx("img", { src: p.image_url, alt: "", className: "h-full w-full rounded-lg object-cover" }) }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 font-medium text-gray-900 dark:text-white", children: p.name }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-indigo-600", children: formatCurrency(p.price) }),
          p.vendor_name && /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-400", children: [
            "by ",
            p.vendor_name
          ] })
        ] }, p.id)) }),
        products.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "No products in this category yet." })
      ] })
    ] })
  ] });
}
export {
  CategoriesShow as default
};
