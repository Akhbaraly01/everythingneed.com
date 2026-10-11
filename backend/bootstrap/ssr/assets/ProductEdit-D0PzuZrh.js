import { jsx, jsxs } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, router } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { Package, ArrowRight } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function VendorProductEdit({ product_id }) {
  const [form, setForm] = useState({ name: "", description: "", category: "", price: "", stock_quantity: "", image_url: "", is_active: true });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    const id = product_id || window.location.pathname.split("/").pop();
    if (id) {
      api.get(`/api/products/${id}`).then((res) => setForm({ name: res.data.name, description: res.data.description || "", category: res.data.category, price: String(res.data.price), stock_quantity: String(res.data.stock_quantity), image_url: res.data.image_url || "", is_active: res.data.is_active })).catch(() => {
      }).finally(() => setLoading(false));
    } else setLoading(false);
  }, [product_id]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    const id = product_id || window.location.pathname.split("/").pop();
    setSubmitting(true);
    try {
      await api.put(`/api/vendor/products/${id}`, { ...form, price: parseFloat(form.price), stock_quantity: parseInt(form.stock_quantity) });
      router.visit("/vendor/products");
    } catch {
      setSubmitting(false);
    }
  };
  if (loading) return /* @__PURE__ */ jsx(AppLayout, { title: "Edit Product", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." }) });
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Edit Product", children: [
    /* @__PURE__ */ jsx(Head, { title: "Edit Product" }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "mx-auto max-w-2xl space-y-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Package, { className: "h-6 w-6" }),
        " Edit Product"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Product Name" }),
          /* @__PURE__ */ jsx("input", { required: true, value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Description" }),
          /* @__PURE__ */ jsx("textarea", { value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }), rows: 3, className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Category" }),
            /* @__PURE__ */ jsx("input", { required: true, value: form.category, onChange: (e) => setForm({ ...form, category: e.target.value }), className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Price" }),
            /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", required: true, value: form.price, onChange: (e) => setForm({ ...form, price: e.target.value }), className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Stock" }),
            /* @__PURE__ */ jsx("input", { type: "number", required: true, value: form.stock_quantity, onChange: (e) => setForm({ ...form, stock_quantity: e.target.value }), className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Image URL" }),
            /* @__PURE__ */ jsx("input", { value: form.image_url, onChange: (e) => setForm({ ...form, image_url: e.target.value }), className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: form.is_active, onChange: (e) => setForm({ ...form, is_active: e.target.checked }) }),
          " Active"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "submit", disabled: submitting, className: "w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2", children: [
        submitting ? "Saving..." : "Save Changes",
        " ",
        /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
      ] })
    ] })
  ] });
}
export {
  VendorProductEdit as default
};
