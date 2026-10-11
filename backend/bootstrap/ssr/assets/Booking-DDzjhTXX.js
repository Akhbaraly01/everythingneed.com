import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, router } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { useState } from "react";
import { HardHat, ArrowRight } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function BuildingServiceBooking({ worker_id }) {
  const [form, setForm] = useState({
    worker_type: "plumber",
    service_category: "",
    description: "",
    address: "",
    scheduled_date: "",
    scheduled_time: "",
    estimated_cost: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/api/building-services/bookings", { ...form, worker_id });
      router.visit(`/building-services/bookings/${res.data.id}`);
    } catch (err) {
      setError(errorMessage(err, "Booking failed"));
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Book Building Service", children: [
    /* @__PURE__ */ jsx(Head, { title: "Book Building Service" }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "mx-auto max-w-2xl space-y-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(HardHat, { className: "h-6 w-6" }),
        " Book Building Service"
      ] }),
      error && /* @__PURE__ */ jsx("div", { className: "rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20", children: error }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Worker Type" }),
            /* @__PURE__ */ jsxs("select", { value: form.worker_type, onChange: (e) => setForm({ ...form, worker_type: e.target.value }), className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700", children: [
              /* @__PURE__ */ jsx("option", { value: "plumber", children: "Plumber" }),
              /* @__PURE__ */ jsx("option", { value: "electrician", children: "Electrician" }),
              /* @__PURE__ */ jsx("option", { value: "carpenter", children: "Carpenter" }),
              /* @__PURE__ */ jsx("option", { value: "mason", children: "Mason" }),
              /* @__PURE__ */ jsx("option", { value: "painter", children: "Painter" }),
              /* @__PURE__ */ jsx("option", { value: "welder", children: "Welder" }),
              /* @__PURE__ */ jsx("option", { value: "general", children: "General Contractor" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Service Category" }),
            /* @__PURE__ */ jsx("input", { required: true, value: form.service_category, onChange: (e) => setForm({ ...form, service_category: e.target.value }), placeholder: "e.g. Pipe repair", className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Description" }),
          /* @__PURE__ */ jsx("textarea", { required: true, value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }), rows: 3, className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700", placeholder: "Describe the work needed..." })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Address" }),
          /* @__PURE__ */ jsx("input", { required: true, value: form.address, onChange: (e) => setForm({ ...form, address: e.target.value }), className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700", placeholder: "Service address" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Date" }),
            /* @__PURE__ */ jsx("input", { type: "date", required: true, value: form.scheduled_date, onChange: (e) => setForm({ ...form, scheduled_date: e.target.value }), className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Time" }),
            /* @__PURE__ */ jsx("input", { type: "time", value: form.scheduled_time, onChange: (e) => setForm({ ...form, scheduled_time: e.target.value }), className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Estimated Budget" }),
          /* @__PURE__ */ jsx("input", { type: "number", min: "0", step: "0.01", value: form.estimated_cost, onChange: (e) => setForm({ ...form, estimated_cost: e.target.value }), placeholder: "Optional", className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Notes" }),
          /* @__PURE__ */ jsx("textarea", { value: form.notes, onChange: (e) => setForm({ ...form, notes: e.target.value }), rows: 2, className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "submit", disabled: submitting, className: "w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2", children: [
        submitting ? "Booking..." : "Confirm Booking",
        " ",
        /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
      ] })
    ] })
  ] });
}
export {
  BuildingServiceBooking as default
};
