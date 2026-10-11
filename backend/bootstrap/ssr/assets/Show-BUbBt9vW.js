import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Store, CheckCircle, Star } from "lucide-react";
import "react";
import "./api-Dp2ndEHF.js";
import "clsx";
import "sonner";
function VendorShow({ vendor }) {
  var _a;
  return /* @__PURE__ */ jsxs(AppLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: vendor.store_name }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "rounded-full bg-indigo-100 p-4", children: /* @__PURE__ */ jsx(Store, { className: "h-8 w-8 text-indigo-600" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: vendor.store_name }),
              vendor.is_verified && /* @__PURE__ */ jsx(CheckCircle, { className: "h-5 w-5 text-green-500" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: vendor.category }),
            /* @__PURE__ */ jsx("div", { className: "mt-1 flex items-center gap-3 text-sm text-gray-500", children: vendor.rating != null && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Star, { className: "h-4 w-4 fill-yellow-400 text-yellow-400" }),
              vendor.rating
            ] }) })
          ] })
        ] }),
        vendor.description && /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-600 dark:text-gray-400", children: vendor.description })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: [
          "Products (",
          ((_a = vendor.products) == null ? void 0 : _a.length) ?? 0,
          ")"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3", children: !vendor.products || vendor.products.length === 0 ? /* @__PURE__ */ jsx("p", { className: "col-span-full py-8 text-center text-gray-500", children: "No products yet." }) : vendor.products.filter((p) => p.is_active).map((product) => /* @__PURE__ */ jsxs(
          Link,
          {
            href: `/products/${product.id}`,
            className: "group rounded-lg border border-gray-200 p-4 transition hover:shadow-md dark:border-gray-700",
            children: [
              /* @__PURE__ */ jsx("div", { className: "aspect-square overflow-hidden rounded-lg bg-gray-100", children: product.image_url ? /* @__PURE__ */ jsx("img", { src: product.image_url, alt: product.name, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center text-gray-400", children: "No image" }) }),
              /* @__PURE__ */ jsx("h3", { className: "mt-3 font-medium text-gray-900 group-hover:text-indigo-600 dark:text-white", children: product.name }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-lg font-bold text-gray-900 dark:text-white", children: formatCurrency(product.price) }),
              product.rating != null && /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center gap-1 text-sm text-gray-500", children: [
                /* @__PURE__ */ jsx(Star, { className: "h-3 w-3 fill-yellow-400 text-yellow-400" }),
                product.rating
              ] })
            ]
          },
          product.id
        )) })
      ] })
    ] })
  ] });
}
export {
  VendorShow as default
};
