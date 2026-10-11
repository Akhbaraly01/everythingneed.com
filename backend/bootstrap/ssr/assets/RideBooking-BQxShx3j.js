import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, router } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState } from "react";
import { Car, ArrowRight } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function RideBooking() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [form, setForm] = useState({ pickup_address: "", dropoff_address: "", pickup_lat: 0, pickup_lng: 0, dropoff_lat: 0, dropoff_lng: 0 });
  const [submitting, setSubmitting] = useState(false);
  const searchVehicles = async () => {
    if (!form.pickup_address || !form.dropoff_address) return;
    setLoading(true);
    try {
      const res = await api.get("/api/rides/available", { params: form });
      setVehicles(res.data);
    } catch {
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };
  const handleBook = async () => {
    if (!selectedVehicle) return;
    setSubmitting(true);
    try {
      const res = await api.post("/api/rides", {
        vehicle_id: selectedVehicle.id,
        ...form
      });
      router.visit(`/transportation/tracking/${res.data.id}`);
    } catch {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Book a Ride", children: [
    /* @__PURE__ */ jsx(Head, { title: "Book a Ride" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Car, { className: "h-6 w-6" }),
          " Book a Ride"
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Pickup Location" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              required: true,
              value: form.pickup_address,
              onChange: (e) => setForm({ ...form, pickup_address: e.target.value }),
              className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700",
              placeholder: "Enter pickup address"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Drop-off Location" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              required: true,
              value: form.dropoff_address,
              onChange: (e) => setForm({ ...form, dropoff_address: e.target.value }),
              className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700",
              placeholder: "Enter destination"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: searchVehicles,
            disabled: loading,
            className: "w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50",
            children: loading ? "Searching..." : "Search Available Vehicles"
          }
        )
      ] }),
      vehicles.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white", children: "Available Vehicles" }),
        vehicles.map((v) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setSelectedVehicle(v),
            className: `w-full rounded-lg bg-white p-4 shadow text-left dark:bg-gray-800 ${(selectedVehicle == null ? void 0 : selectedVehicle.id) === v.id ? "ring-2 ring-blue-500" : ""}`,
            children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900 dark:text-white", children: v.driver.full_name }),
                /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
                  v.vehicle_type,
                  " • ★ ",
                  v.driver.rating || "New"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsxs("p", { className: "font-bold text-gray-900 dark:text-white", children: [
                  "$",
                  v.estimated_fare
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: v.estimated_time })
              ] })
            ] })
          },
          v.id
        )),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleBook,
            disabled: !selectedVehicle || submitting,
            className: "w-full rounded-lg bg-green-600 px-4 py-3 text-white hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2",
            children: [
              submitting ? "Booking..." : "Confirm Booking",
              " ",
              /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
            ]
          }
        )
      ] })
    ] })
  ] });
}
export {
  RideBooking as default
};
