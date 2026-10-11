import { jsx, jsxs } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, router } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { Calendar, ArrowRight } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function DealShow({ deal_id }) {
  var _a;
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const id = deal_id || (typeof window !== "undefined" ? window.location.pathname.split("/").pop() : void 0);
  useEffect(() => {
    if (id) {
      api.get(`/api/deals/${id}`).then((res) => setDeal(res.data)).catch(() => {
      }).finally(() => setLoading(false));
    } else setLoading(false);
  }, [id]);
  if (loading) return /* @__PURE__ */ jsx(AppLayout, { title: "Deal", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." }) });
  if (!deal) return /* @__PURE__ */ jsx(AppLayout, { title: "Deal", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-red-500", children: "Deal not found" }) });
  return /* @__PURE__ */ jsxs(AppLayout, { title: deal.title, children: [
    /* @__PURE__ */ jsx(Head, { title: deal.title }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("span", { className: "inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600", children: [
          "-",
          deal.discount_percent,
          "% OFF"
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "mt-3 text-2xl font-bold text-gray-900 dark:text-white", children: deal.title }),
        /* @__PURE__ */ jsxs("p", { className: "text-gray-500", children: [
          deal.category,
          " • by ",
          (_a = deal.vendor) == null ? void 0 : _a.store_name
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-gray-600 dark:text-gray-400", children: deal.description })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-3xl font-bold text-green-600", children: [
            "$",
            deal.price
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-lg line-through text-gray-400", children: [
            "$",
            deal.original_price
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-sm text-red-500", children: [
            "Save $",
            (deal.original_price - deal.price).toFixed(2)
          ] })
        ] }),
        deal.valid_until && /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500 mt-2 flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "h-4 w-4" }),
          " Valid until ",
          new Date(deal.valid_until).toLocaleDateString()
        ] })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => router.visit(deal.vendor_id ? `/vendors/${deal.vendor_id}` : "/needs/request"), className: "w-full rounded-lg bg-red-600 px-4 py-3 text-white hover:bg-red-700 flex items-center justify-center gap-2", children: [
        deal.vendor_id ? "Visit Vendor Store" : "Request This Deal",
        " ",
        /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
      ] })
    ] })
  ] });
}
export {
  DealShow as default
};
