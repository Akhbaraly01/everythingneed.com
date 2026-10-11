import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, router } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function CustomTransportRequest() {
  const [form, setForm] = useState({ pickup_address: "", dropoff_address: "", vehicle_type: "car", description: "", scheduled_date: "" });
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/api/transport/requests", form);
      router.visit(`/transportation/tracking/${res.data.id}`);
    } catch {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Custom Transport Request", children: [
    /* @__PURE__ */ jsx(Head, { title: "Custom Transport Request" }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "mx-auto max-w-2xl space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Custom Transport Request" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Request unavailable routes — our team will find a provider and send you a quote" }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Pickup Address" }),
          /* @__PURE__ */ jsx("input", { required: true, value: form.pickup_address, onChange: (e) => setForm({ ...form, pickup_address: e.target.value }), className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Drop-off Address" }),
          /* @__PURE__ */ jsx("input", { required: true, value: form.dropoff_address, onChange: (e) => setForm({ ...form, dropoff_address: e.target.value }), className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Vehicle Type" }),
          /* @__PURE__ */ jsxs("select", { value: form.vehicle_type, onChange: (e) => setForm({ ...form, vehicle_type: e.target.value }), className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700", children: [
            /* @__PURE__ */ jsx("option", { value: "car", children: "Car" }),
            /* @__PURE__ */ jsx("option", { value: "truck", children: "Truck" }),
            /* @__PURE__ */ jsx("option", { value: "motorcycle", children: "Motorcycle" }),
            /* @__PURE__ */ jsx("option", { value: "lorry", children: "Lorry" }),
            /* @__PURE__ */ jsx("option", { value: "other", children: "Other" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Description" }),
          /* @__PURE__ */ jsx("textarea", { required: true, value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }), rows: 3, className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700", placeholder: "What do you need to transport?" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Preferred Date" }),
          /* @__PURE__ */ jsx("input", { type: "date", value: form.scheduled_date, onChange: (e) => setForm({ ...form, scheduled_date: e.target.value }), className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "submit", disabled: submitting, className: "w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2", children: [
        submitting ? "Submitting..." : "Submit Request",
        " ",
        /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
      ] })
    ] })
  ] });
}
export {
  CustomTransportRequest as default
};
