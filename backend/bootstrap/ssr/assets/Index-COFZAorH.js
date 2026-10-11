import { jsxs, jsx } from "react/jsx-runtime";
import { Head, Link } from "@inertiajs/react";
import { M as MarketplaceLayout } from "./MarketplaceLayout-BjqzrNjx.js";
import { a as api } from "./api-Dp2ndEHF.js";
import { Search, ArrowRight } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import "../app2.js";
import "react-dom/client";
import "sonner";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
const FALLBACK_COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#6366F1", "#EC4899", "#14B8A6"];
function NeedsIndex() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  useEffect(() => {
    api.get("/api/need-categories").then((res) => setCategories(res.data ?? [])).catch(() => setCategories([])).finally(() => setLoading(false));
  }, []);
  const filtered = useMemo(
    () => categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [categories, search]
  );
  return /* @__PURE__ */ jsxs(MarketplaceLayout, { title: "Needs", children: [
    /* @__PURE__ */ jsx(Head, { title: "Needs" }),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-3 py-4 space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-6 text-white", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl md:text-2xl font-bold", children: "All Your Needs, One Place" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-white/80", children: "30 categories to fulfill every requirement" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx(Link, { href: "/needs/request", className: "inline-flex h-9 items-center rounded-md bg-white/20 px-4 text-xs font-medium text-white hover:bg-white/30", children: "Submit a Request" }),
          /* @__PURE__ */ jsx(Link, { href: "/flights", className: "inline-flex h-9 items-center rounded-md bg-white/20 px-4 text-xs font-medium text-white hover:bg-white/30", children: "Book Flight" }),
          /* @__PURE__ */ jsx(Link, { href: "/hotels", className: "inline-flex h-9 items-center rounded-md bg-white/20 px-4 text-xs font-medium text-white hover:bg-white/30", children: "Find Hotels" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            value: search,
            onChange: (e) => setSearch(e.target.value),
            placeholder: "Search categories...",
            className: "h-10 w-full rounded-full bg-muted/50 border border-border pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          }
        )
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-card border border-border p-12 text-center shadow", children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Loading..." }) }) : filtered.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-card border border-border p-12 text-center shadow", children: [
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium", children: "No categories yet" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Try a different search or submit a request." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: filtered.map((cat, i) => /* @__PURE__ */ jsxs(
        Link,
        {
          href: `/needs/${cat.slug}`,
          className: "group rounded-xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: "flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white",
                  style: { background: cat.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length] },
                  children: cat.name[0]
                }
              ),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "font-semibold group-hover:text-primary", children: cat.name }),
                cat.items_count != null && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
                  cat.items_count,
                  " items"
                ] })
              ] })
            ] }),
            cat.description && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground line-clamp-2", children: cat.description }),
            /* @__PURE__ */ jsxs("span", { className: "mt-4 inline-flex items-center gap-1 text-sm text-primary", children: [
              "View ",
              /* @__PURE__ */ jsx(ArrowRight, { className: "h-3 w-3" })
            ] })
          ]
        },
        cat.id
      )) })
    ] })
  ] });
}
export {
  NeedsIndex as default
};
