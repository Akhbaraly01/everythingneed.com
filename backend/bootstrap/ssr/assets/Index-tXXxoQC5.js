import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { g as getInitials, f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Search, SlidersHorizontal, Briefcase, BadgeCheck, Star, MapPin, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import "./api-Dp2ndEHF.js";
import "clsx";
import "sonner";
const availabilityStyles = {
  available: "bg-green-100 text-green-800",
  busy: "bg-amber-100 text-amber-800",
  unavailable: "bg-red-100 text-red-700"
};
function JobSeekersIndex({ workers, categories, filters }) {
  const [q, setQ] = useState(filters.q ?? "");
  const [showFilters, setShowFilters] = useState(false);
  const applyFilter = (patch) => {
    const next = new URLSearchParams();
    Object.entries({ ...filters, ...patch }).forEach(([k, v]) => {
      if (v) next.set(k, v);
    });
    router.get("/job-seekers", Object.fromEntries(next), { preserveState: true });
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Job Seekers", children: [
    /* @__PURE__ */ jsx(Head, { title: "Job Seekers" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex flex-wrap items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Find Skilled Workers" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
            workers.total,
            " verified professionals across ",
            categories.length,
            " categories"
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          Link,
          {
            href: "/job-seekers/my-requests",
            className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700",
            children: "My Requests"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-4 flex gap-2", children: [
        /* @__PURE__ */ jsxs(
          "form",
          {
            className: "relative flex-1",
            onSubmit: (e) => {
              e.preventDefault();
              applyFilter({ q });
            },
            children: [
              /* @__PURE__ */ jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  value: q,
                  onChange: (e) => setQ(e.target.value),
                  placeholder: "Search by headline, bio or city…",
                  className: "w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowFilters((v) => !v),
            className: "flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium dark:border-gray-600 dark:bg-gray-800 dark:text-white",
            children: [
              /* @__PURE__ */ jsx(SlidersHorizontal, { className: "h-4 w-4" }),
              " Filters"
            ]
          }
        )
      ] }),
      showFilters && /* @__PURE__ */ jsxs("div", { className: "mb-6 grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-4 dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-xs font-medium text-gray-500", children: "Category" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: filters.category ?? "",
              onChange: (e) => applyFilter({ category: e.target.value || void 0 }),
              className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "All categories" }),
                categories.map((c) => /* @__PURE__ */ jsxs("option", { value: c.category, children: [
                  c.category,
                  " (",
                  c.workers_count,
                  ")"
                ] }, c.category))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-xs font-medium text-gray-500", children: "Availability" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: filters.availability ?? "",
              onChange: (e) => applyFilter({ availability: e.target.value || void 0 }),
              className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Any" }),
                /* @__PURE__ */ jsx("option", { value: "available", children: "Available now" }),
                /* @__PURE__ */ jsx("option", { value: "busy", children: "Busy" }),
                /* @__PURE__ */ jsx("option", { value: "unavailable", children: "Unavailable" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "mb-1 block text-xs font-medium text-gray-500", children: "Sort by" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: filters.sort ?? "rating",
              onChange: (e) => applyFilter({ sort: e.target.value }),
              className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white",
              children: [
                /* @__PURE__ */ jsx("option", { value: "rating", children: "Top rated" }),
                /* @__PURE__ */ jsx("option", { value: "rate_low", children: "Rate (low first)" }),
                /* @__PURE__ */ jsx("option", { value: "rate_high", children: "Rate (high first)" }),
                /* @__PURE__ */ jsx("option", { value: "newest", children: "Newest" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => router.get("/job-seekers", {}, { preserveState: true }),
            className: "self-end rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300",
            children: "Reset all"
          }
        )
      ] }),
      workers.data.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-600", children: [
        /* @__PURE__ */ jsx(Briefcase, { className: "mx-auto mb-3 h-10 w-10 text-gray-300" }),
        /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "No workers match your filters" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Try widening your search or clearing filters." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3", children: workers.data.map((worker) => {
        var _a, _b;
        return /* @__PURE__ */ jsxs(
          Link,
          {
            href: `/job-seekers/${worker.id}`,
            className: "group rounded-xl border border-gray-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-start justify-between", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("span", { className: "flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700", children: getInitials(((_a = worker.user) == null ? void 0 : _a.name) ?? "W") }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900 dark:text-white", children: (_b = worker.user) == null ? void 0 : _b.name }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: worker.category })
                  ] })
                ] }),
                worker.is_verified && /* @__PURE__ */ jsx(BadgeCheck, { className: "h-5 w-5 text-blue-500" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-300", children: worker.headline }),
              /* @__PURE__ */ jsx("div", { className: "mb-3 flex flex-wrap gap-1.5", children: (worker.skills ?? []).slice(0, 3).map((s) => /* @__PURE__ */ jsx("span", { className: "rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300", children: s.name }, s.name)) }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 font-medium text-gray-900 dark:text-white", children: [
                    /* @__PURE__ */ jsx(Star, { className: "h-4 w-4 fill-yellow-400 text-yellow-400" }),
                    " ",
                    Number(worker.rating_avg).toFixed(1),
                    /* @__PURE__ */ jsxs("span", { className: "text-xs font-normal text-gray-400", children: [
                      "(",
                      worker.rating_count,
                      ")"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-gray-500", children: [
                    /* @__PURE__ */ jsx(MapPin, { className: "h-3.5 w-3.5" }),
                    worker.city
                  ] })
                ] }),
                /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${availabilityStyles[worker.availability]}`, children: worker.availability })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-indigo-600", children: worker.hourly_rate ? `${formatCurrency(worker.hourly_rate)}/hr` : "Rate on request" }),
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-xs text-gray-500", children: [
                  /* @__PURE__ */ jsx(Clock, { className: "h-3.5 w-3.5" }),
                  " ",
                  worker.completed_jobs,
                  " jobs done"
                ] })
              ] })
            ]
          },
          worker.id
        );
      }) }),
      workers.last_page > 1 && /* @__PURE__ */ jsxs("div", { className: "mt-8 flex items-center justify-center gap-2", children: [
        Array.from({ length: workers.last_page }, (_, i) => i + 1).map((pageNo) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => applyFilter({}),
            disabled: true,
            className: "hidden"
          },
          pageNo
        )),
        /* @__PURE__ */ jsx(
          Link,
          {
            href: workers.current_page > 1 ? `/job-seekers?page=${workers.current_page - 1}` : "#",
            preserveState: true,
            className: "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white",
            children: /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" })
          }
        ),
        /* @__PURE__ */ jsxs("span", { className: "px-3 text-sm text-gray-600 dark:text-gray-300", children: [
          "Page ",
          workers.current_page,
          " of ",
          workers.last_page
        ] }),
        /* @__PURE__ */ jsx(
          Link,
          {
            href: workers.current_page < workers.last_page ? `/job-seekers?page=${workers.current_page + 1}` : "#",
            preserveState: true,
            className: "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white",
            children: /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" })
          }
        )
      ] })
    ] })
  ] });
}
export {
  JobSeekersIndex as default
};
