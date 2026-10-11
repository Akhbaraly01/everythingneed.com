import { jsx, jsxs } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { CheckCircle, Clock } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];
function OrderTracking({ order_id }) {
  const [tracking, setTracking] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const id = order_id || (typeof window !== "undefined" ? window.location.pathname.split("/")[2] : void 0);
  useEffect(() => {
    if (id) {
      api.get(`/api/orders/${id}/tracking`).then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        setHistory(rows);
        setTracking(rows.length ? rows[rows.length - 1] : null);
      }).catch(() => {
      }).finally(() => setLoading(false));
    } else setLoading(false);
  }, [id]);
  if (loading) return /* @__PURE__ */ jsx(AppLayout, { title: "Order Tracking", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." }) });
  if (!tracking) return /* @__PURE__ */ jsx(AppLayout, { title: "Order Tracking", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-red-500", children: "Tracking not found" }) });
  const currentStep = STEPS.indexOf(tracking.status);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Order Tracking", children: [
    /* @__PURE__ */ jsx(Head, { title: "Order Tracking" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-gray-900 dark:text-white mb-4", children: "Order Tracking" }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: STEPS.map((step, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
          /* @__PURE__ */ jsx("div", { className: `h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= currentStep ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700"}`, children: i <= currentStep ? /* @__PURE__ */ jsx(CheckCircle, { className: "h-4 w-4" }) : i + 1 }),
          i < STEPS.length - 1 && /* @__PURE__ */ jsx("div", { className: `h-1 w-8 sm:w-12 ${i < currentStep ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}` })
        ] }, step)) }),
        /* @__PURE__ */ jsx("div", { className: "mt-2 flex justify-between text-xs text-gray-500", children: STEPS.map((s) => /* @__PURE__ */ jsx("span", { className: "capitalize", children: s }, s)) }),
        tracking.status_message && /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm bg-blue-50 p-3 rounded dark:bg-blue-900/20 dark:text-blue-300", children: tracking.status_message }),
        tracking.estimated_delivery && /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-gray-500 flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Clock, { className: "h-4 w-4" }),
          " Estimated delivery: ",
          new Date(tracking.estimated_delivery).toLocaleString()
        ] })
      ] }),
      history.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold dark:text-white mb-3", children: "History" }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3", children: history.map((h) => /* @__PURE__ */ jsx("div", { className: "flex gap-3 border-l-2 border-blue-500 pl-4 py-1", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium capitalize dark:text-white", children: h.status }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: h.status_message }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400", children: new Date(h.created_at).toLocaleString() })
        ] }) }, h.id)) })
      ] })
    ] })
  ] });
}
export {
  OrderTracking as default
};
