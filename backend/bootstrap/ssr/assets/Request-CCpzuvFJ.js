import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function NeedsRequest() {
  const { auth } = usePage().props;
  const [form, setForm] = useState({ title: "", description: "", category: "", budget: "", urgency: "normal", location: "" });
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (!(auth == null ? void 0 : auth.user)) {
      router.visit("/login");
      return;
    }
    setSubmitting(true);
    try {
      const budget = parseFloat(form.budget);
      await api.post("/api/need-requests", {
        title: form.title,
        description: form.description || form.title,
        location: form.location || void 0,
        budget_min: Number.isFinite(budget) ? budget : void 0,
        budget_max: Number.isFinite(budget) ? budget : void 0
      });
      router.visit("/requests");
    } catch (e) {
      alert(errorMessage(e, "Failed"));
    }
    setSubmitting(false);
  };
  const inputClass = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white";
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Submit a Need", children: [
    /* @__PURE__ */ jsx(Head, { title: "Submit a Need" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsxs(Link, { href: "/needs", className: "inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back to Needs"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Submit a Service Request" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Title *" }),
            /* @__PURE__ */ jsx("input", { type: "text", value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }), placeholder: "What do you need?", className: inputClass })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Description" }),
            /* @__PURE__ */ jsx("textarea", { value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }), rows: 4, className: inputClass })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Category" }),
              /* @__PURE__ */ jsx("input", { type: "text", value: form.category, onChange: (e) => setForm({ ...form, category: e.target.value }), className: inputClass })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Budget ($)" }),
              /* @__PURE__ */ jsx("input", { type: "number", value: form.budget, onChange: (e) => setForm({ ...form, budget: e.target.value }), className: inputClass })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Urgency" }),
              /* @__PURE__ */ jsxs("select", { value: form.urgency, onChange: (e) => setForm({ ...form, urgency: e.target.value }), className: inputClass, children: [
                /* @__PURE__ */ jsx("option", { value: "low", children: "Low" }),
                /* @__PURE__ */ jsx("option", { value: "normal", children: "Normal" }),
                /* @__PURE__ */ jsx("option", { value: "high", children: "High" }),
                /* @__PURE__ */ jsx("option", { value: "urgent", children: "Urgent" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Location" }),
              /* @__PURE__ */ jsx("input", { type: "text", value: form.location, onChange: (e) => setForm({ ...form, location: e.target.value }), className: inputClass })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleSubmit,
            disabled: submitting || !form.title,
            className: "mt-6 w-full rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50",
            children: submitting ? "Submitting..." : "Submit Request"
          }
        )
      ] })
    ] })
  ] });
}
export {
  NeedsRequest as default
};
