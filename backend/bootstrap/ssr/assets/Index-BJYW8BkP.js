import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link, router } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Search, ShoppingCart, Star } from "lucide-react";
import { useState } from "react";
import "clsx";
import "sonner";
function Products({ products, filters }) {
  const [search, setSearch] = useState((filters == null ? void 0 : filters.search) ?? "");
  const [cartMessage, setCartMessage] = useState(null);
  const handleSearch = (e) => {
    e.preventDefault();
    router.get("/products", { search: search || void 0, category: filters == null ? void 0 : filters.category }, { preserveState: true });
  };
  const handleAddToCart = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.post("/api/cart/items", { product_id: productId, quantity: 1 });
      setCartMessage("Added to cart!");
      setTimeout(() => setCartMessage(null), 2e3);
    } catch {
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Products", children: [
    /* @__PURE__ */ jsx(Head, { title: "Products" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      cartMessage && /* @__PURE__ */ jsx("div", { className: "fixed bottom-4 right-4 z-50 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg", children: cartMessage }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSearch, className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search products...",
                value: search,
                onChange: (e) => setSearch(e.target.value),
                className: "rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("button", { type: "submit", className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500", children: "Search" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: ["All", "Electronics", "Clothing", "Home", "Beauty"].map((cat) => /* @__PURE__ */ jsx(
          Link,
          {
            href: cat === "All" ? "/products" : `/products?category=${cat.toLowerCase()}${search ? `&search=${search}` : ""}`,
            className: `rounded-lg px-4 py-2 text-sm font-medium ${((filters == null ? void 0 : filters.category) ?? "all") === cat.toLowerCase() || cat === "All" && !(filters == null ? void 0 : filters.category) ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"}`,
            children: cat
          },
          cat
        )) })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
        products.meta.total,
        " product",
        products.meta.total !== 1 ? "s" : "",
        " found"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", children: products.data.map((product) => /* @__PURE__ */ jsxs(
        Link,
        {
          href: `/products/${product.id}`,
          className: "group rounded-lg bg-white shadow transition hover:shadow-md dark:bg-gray-800",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "relative aspect-square overflow-hidden rounded-t-lg bg-gray-100", children: [
              product.image_url ? /* @__PURE__ */ jsx(
                "img",
                {
                  src: product.image_url,
                  alt: product.name,
                  className: "h-full w-full object-cover"
                }
              ) : /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center text-gray-400", children: "No image" }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: (e) => handleAddToCart(product.id, e),
                  className: "absolute right-2 top-2 rounded-full bg-white p-2 shadow-md opacity-0 transition group-hover:opacity-100 hover:bg-indigo-50",
                  title: "Add to cart",
                  children: /* @__PURE__ */ jsx(ShoppingCart, { className: "h-4 w-4 text-indigo-600" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-gray-900 hover:text-indigo-600 dark:text-white", children: product.name }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-gray-500", children: product.category }),
              /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Star, { className: "h-3 w-3 fill-yellow-400 text-yellow-400" }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-600", children: product.rating ?? "N/A" }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-400", children: [
                  "(",
                  product.reviews_count ?? 0,
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-3 flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-lg font-bold text-gray-900 dark:text-white", children: formatCurrency(product.price) }),
                product.compare_price && /* @__PURE__ */ jsx("span", { className: "ml-2 text-sm text-gray-400 line-through", children: formatCurrency(product.compare_price) })
              ] }) })
            ] })
          ]
        },
        product.id
      )) }),
      products.meta.last_page > 1 && /* @__PURE__ */ jsx("div", { className: "flex justify-center gap-2", children: Array.from({ length: products.meta.last_page }, (_, i) => i + 1).map((page) => /* @__PURE__ */ jsx(
        Link,
        {
          href: `/products?page=${page}${(filters == null ? void 0 : filters.category) ? `&category=${filters.category}` : ""}${(filters == null ? void 0 : filters.search) ? `&search=${filters.search}` : ""}`,
          className: `rounded-lg px-4 py-2 text-sm font-medium ${page === products.meta.current_page ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"}`,
          children: page
        },
        page
      )) })
    ] })
  ] });
}
export {
  Products as default
};
