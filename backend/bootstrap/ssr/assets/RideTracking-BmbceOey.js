import { jsx, jsxs } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { CheckCircle, MapPin } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
const STATUS_STEPS = ["requested", "accepted", "in_progress", "completed"];
function RideTracking({ ride_id }) {
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (ride_id) {
      api.get(`/api/rides/${ride_id}`).then((res) => setRide(res.data)).catch(() => {
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [ride_id]);
  if (loading) return /* @__PURE__ */ jsx(AppLayout, { title: "Ride Tracking", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." }) });
  if (!ride) return /* @__PURE__ */ jsx(AppLayout, { title: "Ride Tracking", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-red-500", children: "Ride not found" }) });
  const currentStep = STATUS_STEPS.indexOf(ride.status);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Ride Tracking", children: [
    /* @__PURE__ */ jsx(Head, { title: "Ride Tracking" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-gray-900 dark:text-white mb-4", children: "Ride Status" }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: STATUS_STEPS.map((step, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
          /* @__PURE__ */ jsx("div", { className: `h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= currentStep ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700"}`, children: i <= currentStep ? /* @__PURE__ */ jsx(CheckCircle, { className: "h-4 w-4" }) : i + 1 }),
          i < STATUS_STEPS.length - 1 && /* @__PURE__ */ jsx("div", { className: `h-1 w-12 ${i < currentStep ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}` })
        ] }, step)) }),
        /* @__PURE__ */ jsx("div", { className: "mt-2 flex justify-between text-xs text-gray-500", children: STATUS_STEPS.map((s) => /* @__PURE__ */ jsx("span", { className: "capitalize", children: s.replace("_", " ") }, s)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(MapPin, { className: "h-5 w-5 text-green-500" }),
          /* @__PURE__ */ jsx("span", { children: ride.pickup_address })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(MapPin, { className: "h-5 w-5 text-red-500" }),
          /* @__PURE__ */ jsx("span", { children: ride.dropoff_address })
        ] }),
        ride.driver && /* @__PURE__ */ jsxs("div", { className: "border-t pt-3 dark:border-gray-700", children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: ride.driver.full_name }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: ride.driver.phone })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "border-t pt-3 dark:border-gray-700 flex justify-between", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-gray-500", children: [
            ride.distance_km,
            "km • ",
            ride.duration_minutes,
            "min"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "font-bold text-gray-900 dark:text-white", children: [
            "$",
            ride.fare
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  RideTracking as default
};
