import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { Store, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function StoresIndex() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/vendors").then((res) => setStores(
      (res.data ?? []).map((v) => ({
        id: v.id,
        name: v.store_name,
        description: v.description,
        rating: v.rating,
        products_count: v.products_count,
        vendor_name: v.store_name
      }))
    )).catch(() => setStores([])).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Stores", children: [
    /* @__PURE__ */ jsx(Head, { title: "Stores" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Stores" }),
      loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) }) : stores.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Store, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No stores found" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: stores.map((store) => /* @__PURE__ */ jsxs(
        Link,
        {
          href: `/stores/${store.id}`,
          className: "group overflow-hidden rounded-lg bg-white shadow transition hover:shadow-lg dark:bg-gray-800",
          children: [
            /* @__PURE__ */ jsx("div", { className: "h-40 bg-gray-100 dark:bg-gray-700", children: store.image_url ? /* @__PURE__ */ jsx("img", { src: store.image_url, alt: "", className: "h-full w-full object-cover" }) : null }),
            /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white", children: store.name }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: store.vendor_name }),
              store.city && /* @__PURE__ */ jsxs("p", { className: "mt-1 flex items-center gap-1 text-xs text-gray-400", children: [
                /* @__PURE__ */ jsx(MapPin, { className: "h-3 w-3" }),
                " ",
                store.city
              ] }),
              store.products_count != null && /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500", children: [
                store.products_count,
                " products"
              ] })
            ] })
          ]
        },
        store.id
      )) })
    ] })
  ] });
}
export {
  StoresIndex as default
};
