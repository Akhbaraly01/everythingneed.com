import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { User, MapPin, Star } from "lucide-react";
import { useState, useEffect } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function ExpertsIndex() {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/experts").then((res) => setExperts(res.data)).catch(() => setExperts([])).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Find Experts", children: [
    /* @__PURE__ */ jsx(Head, { title: "Find Experts" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Find Experts" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Connect with professionals and consultants" }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : experts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(User, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No experts found" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: experts.map((e) => /* @__PURE__ */ jsxs(
        Link,
        {
          href: `/experts/${e.id}`,
          className: "group rounded-lg bg-white p-6 shadow transition hover:shadow-lg dark:bg-gray-800",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100", children: e.image_url ? /* @__PURE__ */ jsx("img", { src: e.image_url, alt: "", className: "h-full w-full rounded-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center text-gray-400", children: /* @__PURE__ */ jsx(User, { className: "h-8 w-8" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white", children: e.name }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-indigo-600", children: e.specialty })
              ] })
            ] }),
            e.bio && /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-gray-500 line-clamp-2", children: e.bio }),
            /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center justify-between text-sm", children: [
              e.city && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-gray-400", children: [
                /* @__PURE__ */ jsx(MapPin, { className: "h-3 w-3" }),
                " ",
                e.city
              ] }),
              e.hourly_rate != null && /* @__PURE__ */ jsxs("span", { className: "font-semibold text-gray-900 dark:text-white", children: [
                "$",
                e.hourly_rate,
                "/hr"
              ] })
            ] }),
            e.rating && /* @__PURE__ */ jsxs("p", { className: "mt-1 flex items-center gap-1 text-xs text-yellow-600", children: [
              /* @__PURE__ */ jsx(Star, { className: "h-3 w-3 fill-yellow-400" }),
              " ",
              e.rating
            ] })
          ]
        },
        e.id
      )) })
    ] })
  ] });
}
export {
  ExpertsIndex as default
};
