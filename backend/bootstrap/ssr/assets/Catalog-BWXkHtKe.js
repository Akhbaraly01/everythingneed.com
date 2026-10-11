import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { BookOpen, Star } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function LearnCatalog() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    api.get("/api/course-categories").then((res) => setCategories((res.data ?? []).map((c) => c.name).filter(Boolean))).catch(() => setCategories([]));
  }, []);
  useEffect(() => {
    const params = new URLSearchParams();
    if (categoryFilter) params.set("category", categoryFilter);
    const qs = params.toString();
    api.get(`/api/courses${qs ? `?${qs}` : ""}`).then((res) => setCourses(res.data ?? [])).catch(() => setCourses([])).finally(() => setLoading(false));
  }, [categoryFilter]);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Course Catalog", children: [
    /* @__PURE__ */ jsx(Head, { title: "Course Catalog" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Course Catalog" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Browse all available courses" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => setCategoryFilter(""), className: `rounded-full px-4 py-1.5 text-sm font-medium ${!categoryFilter ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-700"}`, children: "All" }),
        categories.map((c) => /* @__PURE__ */ jsx("button", { onClick: () => setCategoryFilter(c), className: `rounded-full px-4 py-1.5 text-sm font-medium ${categoryFilter === c ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-700"}`, children: c }, c))
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) }) : courses.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(BookOpen, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No courses found" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: courses.map((c) => /* @__PURE__ */ jsxs(Link, { href: `/learn/${c.id}`, className: "group overflow-hidden rounded-lg bg-white shadow transition hover:shadow-lg dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("div", { className: "h-40 bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center", children: c.image_url ? /* @__PURE__ */ jsx("img", { src: c.image_url, alt: "", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx(BookOpen, { className: "h-12 w-12 text-indigo-400" }) }),
        /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white", children: c.title }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: c.instructor }),
          c.category && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-indigo-600", children: c.category }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-lg font-bold text-gray-900 dark:text-white", children: formatCurrency(c.price) }),
            c.rating && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-xs text-yellow-600", children: [
              /* @__PURE__ */ jsx(Star, { className: "h-3 w-3 fill-yellow-400" }),
              c.rating
            ] })
          ] })
        ] })
      ] }, c.id)) })
    ] })
  ] });
}
export {
  LearnCatalog as default
};
