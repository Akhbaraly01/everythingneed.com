import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { MapPin, Bed, Bath, Maximize } from "lucide-react";
import "react";
import "./api-Dp2ndEHF.js";
import "clsx";
import "sonner";
function Properties({ properties }) {
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Properties", children: [
    /* @__PURE__ */ jsx(Head, { title: "Properties" }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3", children: properties.data.map((p) => {
      var _a;
      return /* @__PURE__ */ jsxs(Link, { href: `/properties/${p.id}`, className: "block rounded-lg bg-white shadow overflow-hidden hover:shadow-md dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("div", { className: "aspect-video bg-gray-100", children: ((_a = p.images) == null ? void 0 : _a[0]) && /* @__PURE__ */ jsx("img", { src: p.images[0], alt: p.title, className: "h-full w-full object-cover" }) }),
        /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-800", children: p.property_type }),
            /* @__PURE__ */ jsx("span", { className: "rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800", children: p.type })
          ] }),
          /* @__PURE__ */ jsx("h3", { className: "mt-2 font-semibold text-gray-900 dark:text-white", children: p.title }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center gap-1 text-sm text-gray-500", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "h-3 w-3" }),
            p.city,
            ", ",
            p.country
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center gap-4 text-sm text-gray-500", children: [
            p.bedrooms && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Bed, { className: "h-3 w-3" }),
              p.bedrooms,
              " bed"
            ] }),
            p.bathrooms && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Bath, { className: "h-3 w-3" }),
              p.bathrooms,
              " bath"
            ] }),
            p.area_sqft && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Maximize, { className: "h-3 w-3" }),
              p.area_sqft,
              " sqft"
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-xl font-bold text-gray-900 dark:text-white", children: formatCurrency(p.price) })
        ] })
      ] }, p.id);
    }) })
  ] });
}
export {
  Properties as default
};
