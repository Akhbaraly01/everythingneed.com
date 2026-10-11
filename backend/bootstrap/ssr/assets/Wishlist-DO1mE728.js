import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Heart, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/wishlist").then((res) => setItems(res.data)).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);
  const removeItem = async (id) => {
    try {
      await api.del(`/api/wishlist/${id}`);
      setItems(items.filter((i) => i.id !== id));
    } catch {
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Wishlist", children: [
    /* @__PURE__ */ jsx(Head, { title: "Wishlist" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "My Wishlist" }),
      loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) }) : items.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Heart, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "Your wishlist is empty" }),
        /* @__PURE__ */ jsx(Link, { href: "/products", className: "mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500", children: "Browse Products" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: items.map((item) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs(Link, { href: `/products/${item.product_id}`, children: [
          /* @__PURE__ */ jsx("div", { className: "h-40 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700", children: item.image_url ? /* @__PURE__ */ jsx("img", { src: item.image_url, alt: "", className: "h-full w-full object-cover" }) : null }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 font-semibold text-gray-900 hover:text-indigo-600 dark:text-white", children: item.name })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-lg font-bold text-gray-900 dark:text-white", children: formatCurrency(item.price) }),
          /* @__PURE__ */ jsx("button", { onClick: () => removeItem(item.id), className: "rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
        ] }),
        item.vendor_name && /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500", children: [
          "by ",
          item.vendor_name
        ] })
      ] }, item.id)) })
    ] })
  ] });
}
export {
  WishlistPage as default
};
