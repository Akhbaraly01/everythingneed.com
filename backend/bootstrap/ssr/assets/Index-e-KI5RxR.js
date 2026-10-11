import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { Truck } from "lucide-react";
import { useState, useEffect } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  picked_up: "bg-blue-100 text-blue-800",
  in_transit: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800"
};
function DeliveriesIndex() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/delivery/my").then((res) => setDeliveries(res.data)).catch(() => setDeliveries([])).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "My Deliveries", children: [
    /* @__PURE__ */ jsx(Head, { title: "My Deliveries" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "My Deliveries" }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : deliveries.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Truck, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No deliveries yet" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: deliveries.map((d) => /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          d.order_reference && /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
            "Order #",
            d.order_reference
          ] }),
          /* @__PURE__ */ jsx("span", { className: `inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[d.status] ?? "bg-gray-100 text-gray-800"}`, children: d.status.replace(/_/g, " ") }),
          d.driver_name && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-gray-600", children: [
            "Driver: ",
            d.driver_name
          ] }),
          d.pickup_address && /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-400", children: [
            "From: ",
            d.pickup_address
          ] }),
          d.delivery_address && /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-400", children: [
            "To: ",
            d.delivery_address
          ] })
        ] }),
        d.estimated_delivery && /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500", children: [
          "ETA: ",
          d.estimated_delivery
        ] })
      ] }) }, d.id)) })
    ] })
  ] });
}
export {
  DeliveriesIndex as default
};
