import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link, router } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Search, Store, Building2, UtensilsCrossed, Hotel, Briefcase, Package } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
const typeIcons = {
  product: Package,
  job: Briefcase,
  hotel: Hotel,
  restaurant: UtensilsCrossed,
  property: Building2,
  vendor: Store
};
function SearchResults() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const doSearch = (q) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    api.get(`/api/search?q=${encodeURIComponent(q.trim())}`).then((res) => {
      const groups = res.data ?? {};
      const linkFor = (type, id) => {
        const sid = String(id ?? "");
        switch (type) {
          case "product":
            return `/products/${sid}`;
          case "job":
            return `/jobs/${sid}`;
          case "hotel":
            return `/hotels/${sid}`;
          case "restaurant":
            return `/food/${sid}`;
          case "course":
            return `/learn/${sid}`;
          case "service":
            return `/needs?search=${encodeURIComponent(q.trim())}`;
          default:
            return "/search";
        }
      };
      const row = (type, item, title, description, image, price) => ({
        type,
        id: String(item.id ?? ""),
        title: String(title ?? "Untitled"),
        description: description != null ? String(description) : void 0,
        image_url: image != null ? String(image) : void 0,
        price: price != null ? Number(price) : void 0,
        url: linkFor(type, item.id)
      });
      const mapped = [
        ...(groups.products ?? []).map((p) => row("product", p, p.name, p.description, p.image, p.price)),
        ...(groups.jobs ?? []).map((j) => row("job", j, j.title, j.company ?? j.location, void 0, void 0)),
        ...(groups.hotels ?? []).map((h) => row("hotel", h, h.name, [h.city, h.country].filter(Boolean).join(", "), void 0, void 0)),
        ...(groups.restaurants ?? []).map((r) => row("restaurant", r, r.name, r.cuisine_type, r.image, void 0)),
        ...(groups.courses ?? []).map((c) => row("course", c, c.title, c.instructor_name, c.thumbnail, c.price)),
        ...(groups.services ?? []).map((s) => row("service", s, s.name, s.description, void 0, s.budget ?? s.price))
      ];
      setResults(mapped);
    }).catch(() => setResults([])).finally(() => setLoading(false));
  };
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") ?? "";
    setQuery(q);
    if (q) doSearch(q);
  }, []);
  const handleSearch = (e) => {
    e.preventDefault();
    router.get("/search", { q: query }, { preserveState: true });
    doSearch(query);
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Search", children: [
    /* @__PURE__ */ jsx(Head, { title: "Search Results" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSearch, className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: query,
              onChange: (e) => setQuery(e.target.value),
              placeholder: "Search products, hotels, food, jobs...",
              className: "w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
              autoFocus: true
            }
          )
        ] }),
        /* @__PURE__ */ jsx("button", { type: "submit", className: "rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-500", children: "Search" })
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Searching..." }) }) : results.length === 0 && query ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Search, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No results found" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-500", children: "Try different keywords or browse categories." }),
        /* @__PURE__ */ jsx(Link, { href: "/products", className: "mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500", children: "Browse Products" })
      ] }) : results.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
          results.length,
          " result",
          results.length !== 1 ? "s" : ""
        ] }),
        results.map((item) => {
          const Icon = typeIcons[item.type] ?? Package;
          return /* @__PURE__ */ jsxs(
            Link,
            {
              href: item.url,
              className: "flex items-center gap-4 rounded-lg bg-white p-4 shadow transition hover:shadow-md dark:bg-gray-800",
              children: [
                /* @__PURE__ */ jsx("div", { className: "h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100", children: item.image_url ? /* @__PURE__ */ jsx("img", { src: item.image_url, alt: "", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center text-gray-400", children: /* @__PURE__ */ jsx(Icon, { className: "h-6 w-6" }) }) }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsx("span", { className: "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400", children: item.type }) }),
                  /* @__PURE__ */ jsx("p", { className: "mt-1 font-medium text-gray-900 hover:text-indigo-600 dark:text-white", children: item.title }),
                  item.description && /* @__PURE__ */ jsx("p", { className: "mt-0.5 truncate text-sm text-gray-500", children: item.description })
                ] }),
                item.price != null && /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-gray-900 dark:text-white", children: formatCurrency(item.price) })
              ]
            },
            `${item.type}-${item.id}`
          );
        })
      ] }) : null
    ] })
  ] });
}
export {
  SearchResults as default
};
