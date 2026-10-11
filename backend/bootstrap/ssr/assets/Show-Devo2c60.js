import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { ArrowLeft, Store, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function StoreShow({ store: initialStore, products: initialProducts }) {
  const [store, setStore] = useState(initialStore ?? null);
  const [products, setProducts] = useState(initialProducts ?? []);
  const [loading, setLoading] = useState(!initialStore);
  useEffect(() => {
    if (initialStore) return;
    const id = window.location.pathname.split("/").pop() ?? "";
    Promise.all([
      api.get(`/api/vendors/${id}`).catch(() => ({ data: null })),
      api.get(`/api/products?vendor_id=${id}&per_page=24`).catch(() => ({ data: [] }))
    ]).then(([s, p]) => {
      if (s.data) {
        setStore({
          ...s.data,
          name: s.data.store_name ?? s.data.name
        });
      }
      setProducts(p.data ?? []);
    }).catch(() => {
    }).finally(() => setLoading(false));
  }, [initialStore]);
  if (loading) {
    return /* @__PURE__ */ jsxs(AppLayout, { children: [
      /* @__PURE__ */ jsx(Head, { title: "Store" }),
      /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." })
    ] });
  }
  if (!store) {
    return /* @__PURE__ */ jsxs(AppLayout, { children: [
      /* @__PURE__ */ jsx(Head, { title: "Store not found" }),
      /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Store not found." })
    ] });
  }
  return /* @__PURE__ */ jsxs(AppLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: store.name }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs(Link, { href: "/stores", className: "inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " All Stores"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          store.image_url ? /* @__PURE__ */ jsx("img", { src: store.image_url, alt: "", className: "h-20 w-20 rounded-lg object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100", children: /* @__PURE__ */ jsx(Store, { className: "h-10 w-10 text-gray-400" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: store.name }),
            store.vendor_name && /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
              "by ",
              store.vendor_name
            ] }),
            store.city && /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-1 text-xs text-gray-400", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "h-3 w-3" }),
              " ",
              store.city
            ] })
          ] })
        ] }),
        store.description && /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm text-gray-600 dark:text-gray-400", children: store.description })
      ] }),
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Products" }),
      products.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "No products yet." }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: products.map((p) => /* @__PURE__ */ jsxs(Link, { href: `/products/${p.id}`, className: "rounded-lg bg-white p-4 shadow transition hover:shadow-md dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("div", { className: "h-32 rounded-lg bg-gray-100 dark:bg-gray-700", children: p.image_url && /* @__PURE__ */ jsx("img", { src: p.image_url, alt: "", className: "h-full w-full rounded-lg object-cover" }) }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 font-medium text-gray-900 dark:text-white", children: p.name }),
        /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-indigo-600", children: formatCurrency(p.price) })
      ] }, p.id)) })
    ] })
  ] });
}
export {
  StoreShow as default
};
