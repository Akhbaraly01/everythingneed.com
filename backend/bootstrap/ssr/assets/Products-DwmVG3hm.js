import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { useState, useEffect } from "react";
import { Sprout } from "lucide-react";
import "clsx";
import "sonner";
function AgricultureProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/products", { params: { category: "agriculture" } }).then((res) => setProducts(res.data)).catch(() => setProducts([])).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Agriculture Products", children: [
    /* @__PURE__ */ jsx(Head, { title: "Agriculture Products" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Sprout, { className: "h-6 w-6 text-green-600" }),
        " Agriculture Products"
      ] }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : products.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Sprout, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No agriculture products yet" }),
        /* @__PURE__ */ jsx(Link, { href: "/products", className: "mt-4 inline-block text-blue-600 hover:underline", children: "Browse All Products" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: products.map((p) => /* @__PURE__ */ jsxs(Link, { href: `/products/${p.id}`, className: "rounded-lg bg-white p-4 shadow hover:ring-2 hover:ring-blue-500 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold dark:text-white", children: p.name }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 line-clamp-2", children: p.description }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 font-bold text-green-600", children: formatCurrency(Number(p.price ?? 0)) })
      ] }, p.id)) })
    ] })
  ] });
}
export {
  AgricultureProducts as default
};
