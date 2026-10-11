import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { Store, Star, CheckCircle } from "lucide-react";
import "react";
import "./api-Dp2ndEHF.js";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function Vendors({ vendors }) {
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Vendors", children: [
    /* @__PURE__ */ jsx(Head, { title: "Vendors" }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3", children: vendors.data.map((vendor) => /* @__PURE__ */ jsxs(Link, { href: `/vendors/${vendor.id}`, className: "block rounded-lg bg-white p-6 shadow hover:shadow-md dark:bg-gray-800", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "rounded-full bg-indigo-100 p-3", children: /* @__PURE__ */ jsx(Store, { className: "h-6 w-6 text-indigo-600" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold text-gray-900 dark:text-white", children: vendor.store_name }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: vendor.category })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400", children: [
        /* @__PURE__ */ jsx(Star, { className: "h-4 w-4 fill-yellow-400 text-yellow-400" }),
        vendor.rating ?? "N/A",
        vendor.is_verified && /* @__PURE__ */ jsx(CheckCircle, { className: "h-4 w-4 text-green-500" })
      ] })
    ] }, vendor.id)) })
  ] });
}
export {
  Vendors as default
};
