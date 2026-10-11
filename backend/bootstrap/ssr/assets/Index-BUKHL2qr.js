import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { FolderTree } from "lucide-react";
import { useState, useEffect } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function CategoriesIndex() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/categories/tree").then((res) => setCategories(res.data)).catch(() => api.get("/api/categories").then((r) => setCategories(r.data)).catch(() => setCategories([]))).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Categories", children: [
    /* @__PURE__ */ jsx(Head, { title: "Categories" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Categories" }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : categories.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(FolderTree, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No categories found" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: categories.map((cat) => /* @__PURE__ */ jsxs(
        Link,
        {
          href: `/categories/${cat.id}`,
          className: "rounded-lg bg-white p-6 shadow transition hover:shadow-md dark:bg-gray-800",
          children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-gray-900 hover:text-indigo-600 dark:text-white", children: cat.name }),
            cat.description && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-500 line-clamp-2", children: cat.description }),
            cat.products_count != null && /* @__PURE__ */ jsxs("p", { className: "mt-2 text-xs text-gray-400", children: [
              cat.products_count,
              " products"
            ] }),
            cat.children && cat.children.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-3 flex flex-wrap gap-1", children: cat.children.slice(0, 5).map((child) => /* @__PURE__ */ jsx("span", { className: "rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400", children: child.name }, child.id)) })
          ]
        },
        cat.id
      )) })
    ] })
  ] });
}
export {
  CategoriesIndex as default
};
