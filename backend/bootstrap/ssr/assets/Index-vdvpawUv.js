import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { MapPin, Star } from "lucide-react";
import "react";
import "./api-Dp2ndEHF.js";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function Restaurants({ restaurants }) {
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Restaurants", children: [
    /* @__PURE__ */ jsx(Head, { title: "Restaurants" }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3", children: restaurants.data.map((r) => /* @__PURE__ */ jsxs(Link, { href: `/restaurants/${r.id}`, className: "block rounded-lg bg-white shadow overflow-hidden hover:shadow-md dark:bg-gray-800", children: [
      /* @__PURE__ */ jsx("div", { className: "aspect-video bg-gray-100", children: r.image_url && /* @__PURE__ */ jsx("img", { src: r.image_url, alt: r.name, className: "h-full w-full object-cover" }) }),
      /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-gray-900 dark:text-white", children: r.name }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-indigo-600", children: r.cuisine_type }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center gap-2 text-sm text-gray-500", children: [
          /* @__PURE__ */ jsx(MapPin, { className: "h-3 w-3" }),
          r.city,
          /* @__PURE__ */ jsx(Star, { className: "h-3 w-3 fill-yellow-400 text-yellow-400" }),
          r.rating ?? "N/A"
        ] })
      ] })
    ] }, r.id)) })
  ] });
}
export {
  Restaurants as default
};
