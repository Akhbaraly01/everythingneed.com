import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { ArrowLeft, Building2 } from "lucide-react";
import { useState } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function PropertyCreate() {
  const { auth } = usePage().props;
  const [form, setForm] = useState({
    title: "",
    description: "",
    property_type: "apartment",
    price: "",
    city: "",
    state: "",
    country: "",
    bedrooms: "1",
    bathrooms: "1",
    area_sqft: "",
    image_url: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const handleChange = (key, val) => setForm({ ...form, [key]: val });
  const handleSubmit = async () => {
    if (!(auth == null ? void 0 : auth.user)) {
      router.visit("/login");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/api/properties", {
        ...form,
        price: parseFloat(form.price) || 0,
        bedrooms: parseInt(form.bedrooms) || 1,
        bathrooms: parseInt(form.bathrooms) || 1,
        area_sqft: parseFloat(form.area_sqft) || 0
      });
      router.visit("/properties");
    } catch (e) {
      alert(errorMessage(e, "Failed to create"));
    }
    setSubmitting(false);
  };
  const inputClass = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white";
  return /* @__PURE__ */ jsxs(AppLayout, { title: "List Property", children: [
    /* @__PURE__ */ jsx(Head, { title: "List Property" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsxs(Link, { href: "/properties", className: "inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back to Properties"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "List a Property" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Fill in details to list your property" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Title *" }),
            /* @__PURE__ */ jsx("input", { type: "text", value: form.title, onChange: (e) => handleChange("title", e.target.value), className: inputClass })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Description" }),
            /* @__PURE__ */ jsx("textarea", { value: form.description, onChange: (e) => handleChange("description", e.target.value), rows: 4, className: inputClass })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Type" }),
              /* @__PURE__ */ jsxs("select", { value: form.property_type, onChange: (e) => handleChange("property_type", e.target.value), className: inputClass, children: [
                /* @__PURE__ */ jsx("option", { value: "apartment", children: "Apartment" }),
                /* @__PURE__ */ jsx("option", { value: "house", children: "House" }),
                /* @__PURE__ */ jsx("option", { value: "condo", children: "Condo" }),
                /* @__PURE__ */ jsx("option", { value: "land", children: "Land" }),
                /* @__PURE__ */ jsx("option", { value: "commercial", children: "Commercial" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Price *" }),
              /* @__PURE__ */ jsx("input", { type: "number", value: form.price, onChange: (e) => handleChange("price", e.target.value), className: inputClass })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "City *" }),
              /* @__PURE__ */ jsx("input", { type: "text", value: form.city, onChange: (e) => handleChange("city", e.target.value), className: inputClass })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "State" }),
              /* @__PURE__ */ jsx("input", { type: "text", value: form.state, onChange: (e) => handleChange("state", e.target.value), className: inputClass })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Country" }),
              /* @__PURE__ */ jsx("input", { type: "text", value: form.country, onChange: (e) => handleChange("country", e.target.value), className: inputClass })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Bedrooms" }),
              /* @__PURE__ */ jsx("input", { type: "number", value: form.bedrooms, onChange: (e) => handleChange("bedrooms", e.target.value), className: inputClass })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Bathrooms" }),
              /* @__PURE__ */ jsx("input", { type: "number", value: form.bathrooms, onChange: (e) => handleChange("bathrooms", e.target.value), className: inputClass })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Area (sqft)" }),
              /* @__PURE__ */ jsx("input", { type: "number", value: form.area_sqft, onChange: (e) => handleChange("area_sqft", e.target.value), className: inputClass })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Image URL" }),
            /* @__PURE__ */ jsx("input", { type: "url", value: form.image_url, onChange: (e) => handleChange("image_url", e.target.value), placeholder: "https://...", className: inputClass })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleSubmit,
            disabled: submitting || !form.title || !form.price || !form.city,
            className: "mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50",
            children: [
              /* @__PURE__ */ jsx(Building2, { className: "h-5 w-5" }),
              " ",
              submitting ? "Creating..." : "List Property"
            ]
          }
        )
      ] })
    ] })
  ] });
}
export {
  PropertyCreate as default
};
