import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, router } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { useState } from "react";
import { Home, ArrowRight } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function PropertyInquiry({ property_id }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", viewing_date: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const id = property_id || (typeof window !== "undefined" ? window.location.pathname.split("/")[2] : void 0);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post(`/api/properties/${id}/inquiries`, form);
      router.visit(`/properties/${id}`);
    } catch (err) {
      setError(errorMessage(err, "Failed to send inquiry"));
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Property Inquiry", children: [
    /* @__PURE__ */ jsx(Head, { title: "Property Inquiry" }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "mx-auto max-w-2xl space-y-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Home, { className: "h-6 w-6" }),
        " Inquire About Property"
      ] }),
      error && /* @__PURE__ */ jsx("div", { className: "rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20", children: error }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Name" }),
            /* @__PURE__ */ jsx("input", { required: true, value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Phone" }),
            /* @__PURE__ */ jsx("input", { required: true, value: form.phone, onChange: (e) => setForm({ ...form, phone: e.target.value }), className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Email" }),
          /* @__PURE__ */ jsx("input", { type: "email", required: true, value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }), className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Preferred Viewing Date" }),
          /* @__PURE__ */ jsx("input", { type: "date", value: form.viewing_date, onChange: (e) => setForm({ ...form, viewing_date: e.target.value }), className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Message" }),
          /* @__PURE__ */ jsx("textarea", { required: true, value: form.message, onChange: (e) => setForm({ ...form, message: e.target.value }), rows: 4, placeholder: "Tell us about your interest...", className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "submit", disabled: submitting, className: "w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2", children: [
        submitting ? "Sending..." : "Send Inquiry",
        " ",
        /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
      ] })
    ] })
  ] });
}
export {
  PropertyInquiry as default
};
