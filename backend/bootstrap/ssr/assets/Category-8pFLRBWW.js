import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function NeedsCategory({ slug }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState(slug);
  useEffect(() => {
    api.get(`/api/need-items?category=${encodeURIComponent(slug)}`).then((res) => {
      setItems(res.data);
      if (res.category) setCategoryName(res.category);
    }).catch(() => setItems([])).finally(() => setLoading(false));
  }, [slug]);
  return /* @__PURE__ */ jsxs(AppLayout, { title: categoryName, children: [
    /* @__PURE__ */ jsx(Head, { title: categoryName }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs(Link, { href: "/needs", className: "inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " All Categories"
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white capitalize", children: categoryName }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : items.length === 0 ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "No items in this category yet." }) }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: items.map((item) => /* @__PURE__ */ jsxs(
        Link,
        {
          href: `/needs/${slug}/${item.id}`,
          className: "group rounded-lg bg-white p-4 shadow transition hover:shadow-md dark:bg-gray-800",
          children: [
            item.image_url && /* @__PURE__ */ jsx("div", { className: "h-40 rounded-lg bg-gray-100 dark:bg-gray-700", children: /* @__PURE__ */ jsx("img", { src: item.image_url, alt: "", className: "h-full w-full rounded-lg object-cover" }) }),
            /* @__PURE__ */ jsx("h3", { className: "mt-2 font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white", children: item.title }),
            item.description && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500 line-clamp-2", children: item.description }),
            item.price != null && /* @__PURE__ */ jsx("p", { className: "mt-2 font-bold text-gray-900 dark:text-white", children: formatCurrency(item.price) }),
            item.vendor_name && /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-400", children: [
              "by ",
              item.vendor_name
            ] })
          ]
        },
        item.id
      )) })
    ] })
  ] });
}
export {
  NeedsCategory as default
};
