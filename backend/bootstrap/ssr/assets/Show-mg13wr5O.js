import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Building2, MapPin, Bed, Bath, Maximize } from "lucide-react";
import "react";
import "./api-Dp2ndEHF.js";
import "clsx";
import "sonner";
function PropertyShow({ property }) {
  return /* @__PURE__ */ jsxs(AppLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: property.title }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
      /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-6 lg:flex-row", children: [
        /* @__PURE__ */ jsx("div", { className: "aspect-video w-full overflow-hidden rounded-lg bg-gray-100 lg:w-2/3", children: property.images && property.images.length > 0 ? /* @__PURE__ */ jsx("img", { src: property.images[0], alt: property.title, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center text-gray-400", children: /* @__PURE__ */ jsx(Building2, { className: "h-12 w-12" }) }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800", children: property.property_type }),
            /* @__PURE__ */ jsx("span", { className: "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800", children: property.type })
          ] }),
          /* @__PURE__ */ jsx("h1", { className: "mt-3 text-3xl font-bold text-gray-900 dark:text-white", children: property.title }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center gap-2 text-gray-500", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4" }),
            property.address,
            ", ",
            property.city,
            property.state ? `, ${property.state}` : "",
            ", ",
            property.country
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-4 text-3xl font-bold text-gray-900 dark:text-white", children: formatCurrency(property.price) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 grid grid-cols-3 gap-4", children: [
            property.bedrooms != null && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-700", children: [
              /* @__PURE__ */ jsx(Bed, { className: "mx-auto h-5 w-5 text-gray-400" }),
              /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm font-medium text-gray-900 dark:text-white", children: [
                property.bedrooms,
                " Beds"
              ] })
            ] }),
            property.bathrooms != null && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-700", children: [
              /* @__PURE__ */ jsx(Bath, { className: "mx-auto h-5 w-5 text-gray-400" }),
              /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm font-medium text-gray-900 dark:text-white", children: [
                property.bathrooms,
                " Baths"
              ] })
            ] }),
            property.area_sqft != null && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-700", children: [
              /* @__PURE__ */ jsx(Maximize, { className: "mx-auto h-5 w-5 text-gray-400" }),
              /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm font-medium text-gray-900 dark:text-white", children: [
                property.area_sqft,
                " sqft"
              ] })
            ] })
          ] })
        ] })
      ] }) }),
      property.description && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "Description" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 whitespace-pre-wrap text-gray-600 dark:text-gray-400", children: property.description })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "Property Details" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Type" }),
            /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: property.property_type })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Listing" }),
            /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: property.type })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Country" }),
            /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: property.country })
          ] })
        ] })
      ] }),
      property.images && property.images.length > 1 && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "Gallery" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4", children: property.images.slice(1).map((img, i) => /* @__PURE__ */ jsx("div", { className: "aspect-square overflow-hidden rounded-lg bg-gray-100", children: /* @__PURE__ */ jsx("img", { src: img, alt: `${property.title} ${i + 2}`, className: "h-full w-full object-cover" }) }, i)) })
      ] })
    ] })
  ] });
}
export {
  PropertyShow as default
};
