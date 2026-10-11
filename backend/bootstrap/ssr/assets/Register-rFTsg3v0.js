import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { usePage, Head, router } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { Store } from "lucide-react";
import { useState } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function VendorRegister() {
  const { auth } = usePage().props;
  const [form, setForm] = useState({ store_name: "", category: "", description: "", business_type: "individual", phone: "", address: "" });
  const [submitting, setSubmitting] = useState(false);
  const handleRegister = async () => {
    if (!(auth == null ? void 0 : auth.user)) {
      router.visit("/login");
      return;
    }
    if (!form.category.trim()) {
      alert("Please enter a store category");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/api/vendors", {
        store_name: form.store_name,
        category: form.category,
        description: form.description
      });
      router.visit("/vendor");
    } catch (e) {
      alert(errorMessage(e, "Failed to register"));
    }
    setSubmitting(false);
  };
  const inputClass = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white";
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Become a Vendor", children: [
    /* @__PURE__ */ jsx(Head, { title: "Become a Vendor" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-lg mx-auto space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx(Store, { className: "mx-auto h-12 w-12 text-indigo-600" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-4 text-2xl font-bold text-gray-900 dark:text-white", children: "Become a Vendor" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Start selling on EverythingNeed" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Store Name *" }),
            /* @__PURE__ */ jsx("input", { type: "text", value: form.store_name, onChange: (e) => setForm({ ...form, store_name: e.target.value }), className: inputClass })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Store Category *" }),
            /* @__PURE__ */ jsx("input", { type: "text", value: form.category, onChange: (e) => setForm({ ...form, category: e.target.value }), placeholder: "e.g. Electronics, Fashion, Food", className: inputClass })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Description" }),
            /* @__PURE__ */ jsx("textarea", { value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }), rows: 3, className: inputClass })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Business Type" }),
            /* @__PURE__ */ jsxs("select", { value: form.business_type, onChange: (e) => setForm({ ...form, business_type: e.target.value }), className: inputClass, children: [
              /* @__PURE__ */ jsx("option", { value: "individual", children: "Individual" }),
              /* @__PURE__ */ jsx("option", { value: "business", children: "Business" }),
              /* @__PURE__ */ jsx("option", { value: "corporation", children: "Corporation" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Phone" }),
            /* @__PURE__ */ jsx("input", { type: "tel", value: form.phone, onChange: (e) => setForm({ ...form, phone: e.target.value }), className: inputClass })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Address" }),
            /* @__PURE__ */ jsx("input", { type: "text", value: form.address, onChange: (e) => setForm({ ...form, address: e.target.value }), className: inputClass })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleRegister,
            disabled: submitting || !form.store_name,
            className: "mt-6 w-full rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50",
            children: submitting ? "Registering..." : "Register Store"
          }
        )
      ] })
    ] })
  ] });
}
export {
  VendorRegister as default
};
