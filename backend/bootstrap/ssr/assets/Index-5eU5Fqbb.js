import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Sprout, Tractor, Users, GraduationCap, Search, ChevronLeft, ChevronRight } from "lucide-react";
import "./api-Dp2ndEHF.js";
import "clsx";
import "sonner";
function AgricultureIndex({ products, filters }) {
  const [q, setQ] = useState(filters.q ?? "");
  const search = (e) => {
    e.preventDefault();
    router.get("/agriculture", q ? { q } : {}, { preserveState: true });
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Agriculture", children: [
    /* @__PURE__ */ jsx(Head, { title: "Agriculture" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-8 rounded-2xl bg-gradient-to-r from-green-700 to-emerald-600 p-8 text-white", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Sprout, { className: "h-9 w-9" }),
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Agriculture Hub" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-xl text-sm text-green-100", children: "Farm inputs, equipment, produce and hands — everything that keeps the fields moving." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-5 flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx(Pill, { icon: /* @__PURE__ */ jsx(Tractor, { className: "h-4 w-4" }), label: "Products & equipment", href: "/agriculture" }),
          /* @__PURE__ */ jsx(Pill, { icon: /* @__PURE__ */ jsx(Users, { className: "h-4 w-4" }), label: "Farm workers", href: "/job-seekers?category=Agriculture" }),
          /* @__PURE__ */ jsx(Pill, { icon: /* @__PURE__ */ jsx(GraduationCap, { className: "h-4 w-4" }), label: "Training tasks", href: "/tasks" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: search, className: "relative mb-6 max-w-md", children: [
        /* @__PURE__ */ jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            value: q,
            onChange: (e) => setQ(e.target.value),
            placeholder: "Search seeds, tools, feed…",
            className: "w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          }
        )
      ] }),
      products.data.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-600", children: [
        /* @__PURE__ */ jsx(Tractor, { className: "mx-auto mb-3 h-10 w-10 text-gray-300" }),
        /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "No agricultural listings match" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Try a different search term." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4", children: products.data.map((p) => {
        var _a;
        return /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("div", { className: "flex h-36 items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/20", children: p.image_url ? /* @__PURE__ */ jsx("img", { src: p.image_url, alt: p.name, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx(Sprout, { className: "h-12 w-12 text-green-500/60" }) }),
          /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
            /* @__PURE__ */ jsx("h3", { className: "line-clamp-1 font-semibold text-gray-900 dark:text-white", children: p.name }),
            /* @__PURE__ */ jsx("p", { className: "mt-0.5 line-clamp-2 h-8 text-xs text-gray-500", children: p.description }),
            /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "font-bold text-green-700", children: formatCurrency(Number(p.price)) }),
              ((_a = p.vendor) == null ? void 0 : _a.store_name) && /* @__PURE__ */ jsx("span", { className: "truncate text-[11px] text-gray-400", children: p.vendor.store_name })
            ] })
          ] })
        ] }, p.id);
      }) }),
      products.last_page > 1 && /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-center justify-center gap-3", children: [
        products.current_page > 1 && /* @__PURE__ */ jsx(Link, { href: `/agriculture?page=${products.current_page - 1}`, preserveState: true, className: "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white", children: /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-600 dark:text-gray-300", children: [
          "Page ",
          products.current_page,
          " of ",
          products.last_page
        ] }),
        products.current_page < products.last_page && /* @__PURE__ */ jsx(Link, { href: `/agriculture?page=${products.current_page + 1}`, preserveState: true, className: "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white", children: /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" }) })
      ] })
    ] })
  ] });
}
function Pill({ icon, label, href }) {
  return /* @__PURE__ */ jsxs(Link, { href, className: "flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/25", children: [
    icon,
    " ",
    label
  ] });
}
export {
  AgricultureIndex as default
};
