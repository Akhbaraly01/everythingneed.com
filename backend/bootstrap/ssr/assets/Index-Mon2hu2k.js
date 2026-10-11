import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { MapPin, Star } from "lucide-react";
import "react";
import "./api-Dp2ndEHF.js";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function Hotels({ hotels }) {
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Hotels", children: [
    /* @__PURE__ */ jsx(Head, { title: "Hotels" }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3", children: hotels.data.map((hotel) => {
      var _a, _b;
      return /* @__PURE__ */ jsxs(Link, { href: `/hotels/${hotel.id}`, className: "block rounded-lg bg-white shadow overflow-hidden hover:shadow-md dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("div", { className: "aspect-video bg-gray-100", children: hotel.image_url && /* @__PURE__ */ jsx("img", { src: hotel.image_url, alt: hotel.name, className: "h-full w-full object-cover" }) }),
        /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold text-gray-900 dark:text-white", children: hotel.name }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center gap-1 text-sm text-gray-500", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "h-3 w-3" }),
            hotel.city,
            ", ",
            hotel.country
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 flex items-center gap-1", children: Array.from({ length: hotel.star_rating }).map((_, i) => /* @__PURE__ */ jsx(Star, { className: "h-3 w-3 fill-yellow-400 text-yellow-400" }, i)) }),
          /* @__PURE__ */ jsxs("p", { className: "mt-2 text-lg font-bold text-gray-900 dark:text-white", children: [
            "$",
            ((_b = (_a = hotel.rooms) == null ? void 0 : _a[0]) == null ? void 0 : _b.price_per_night) ?? "N/A",
            "/night"
          ] })
        ] })
      ] }, hotel.id);
    }) })
  ] });
}
export {
  Hotels as default
};
