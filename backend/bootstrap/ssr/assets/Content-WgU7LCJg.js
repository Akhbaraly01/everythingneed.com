import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { BookOpen, FileText, Play, ArrowLeft } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
const LABELS = {
  videos: { title: "Health Videos", icon: Play, empty: "No health videos published yet." },
  documents: { title: "Health Documents", icon: FileText, empty: "No health documents published yet." },
  guides: { title: "Prevention Guides", icon: BookOpen, empty: "No prevention guides published yet." }
};
const API_PATH = {
  videos: "/api/healthcare/videos",
  documents: "/api/healthcare/documents",
  guides: "/api/healthcare/prevention-guides"
};
function HealthContentPage({ kind }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const meta = LABELS[kind];
  useEffect(() => {
    let cancelled = false;
    api.get(API_PATH[kind]).then((res) => {
      if (!cancelled) setItems(Array.isArray(res == null ? void 0 : res.data) ? res.data : []);
    }).catch(() => {
      if (!cancelled) setItems([]);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [kind]);
  return /* @__PURE__ */ jsxs(AppLayout, { title: meta.title, children: [
    /* @__PURE__ */ jsx(Head, { title: meta.title }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl space-y-6 px-4 py-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(meta.icon, { className: "h-5 w-5 text-primary" }),
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-gray-900 dark:text-white", children: meta.title })
        ] }),
        /* @__PURE__ */ jsxs(Link, { href: "/healthcare", className: "inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground", children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
          " Healthcare"
        ] })
      ] }),
      loading ? /* @__PURE__ */ jsx("p", { className: "py-12 text-center text-sm text-muted-foreground", children: "Loading..." }) : items.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-dashed p-12 text-center", children: [
        /* @__PURE__ */ jsx(meta.icon, { className: "mx-auto h-10 w-10 text-muted-foreground" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: meta.empty }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Content appears when admins publish materials." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: items.map((item) => /* @__PURE__ */ jsxs("article", { className: "rounded-lg border border-border bg-card p-4 shadow-sm", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white line-clamp-2", children: item.title }),
        item.summary || item.description ? /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground line-clamp-3", children: item.summary || item.description }) : null,
        item.specialty ? /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-primary", children: item.specialty }) : null,
        item.url ? /* @__PURE__ */ jsx(
          "a",
          {
            href: item.url,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "mt-3 inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground",
            children: "Open"
          }
        ) : null
      ] }, item.id)) })
    ] })
  ] });
}
export {
  HealthContentPage as default
};
