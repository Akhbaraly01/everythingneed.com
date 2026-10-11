import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { toast } from "sonner";
import { Plus, Package, Pencil, Trash2, X } from "lucide-react";
import { E as EmptyState, C as ConfirmDialog } from "./Ui-Skq5Ja_G.js";
import "clsx";
const emptyForm = { name: "", category: "", price: "", stock_quantity: "0", description: "" };
function VendorProducts({ products }) {
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const openCreate = () => {
    setForm(emptyForm);
    setEditing(null);
    setCreating(true);
  };
  const openEdit = (p) => {
    setForm({ name: p.name, category: p.category, price: String(p.price), stock_quantity: String(p.stock_quantity), description: "" });
    setEditing(p);
    setCreating(true);
  };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        category: form.category,
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity)
      };
      if (editing) {
        await api.put(`/api/products/${editing.id}`, payload);
        toast.success("Product updated");
      } else {
        await api.post("/api/products", payload);
        toast.success("Product created");
      }
      setCreating(false);
      router.reload({ only: ["products"] });
    } catch (err) {
      toast.error(errorMessage(err, "Save failed"));
    } finally {
      setBusy(false);
    }
  };
  const toggleActive = async (p) => {
    try {
      await api.put(`/api/products/${p.id}`, { is_active: !p.is_active });
      router.reload({ only: ["products"] });
    } catch (err) {
      toast.error(errorMessage(err, "Update failed"));
    }
  };
  const destroy = async (p) => {
    setBusy(true);
    try {
      await api.del(`/api/products/${p.id}`);
      toast.success("Product deleted");
      setPendingDelete(null);
      router.reload({ only: ["products"] });
    } catch (err) {
      toast.error(errorMessage(err, "Delete failed"));
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Vendor products", children: [
    /* @__PURE__ */ jsx(Head, { title: "My products" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "My Products" }),
        /* @__PURE__ */ jsxs("button", { onClick: openCreate, className: "flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700", children: [
          /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
          " Add product"
        ] })
      ] }),
      products.data.length === 0 ? /* @__PURE__ */ jsx(
        EmptyState,
        {
          icon: /* @__PURE__ */ jsx(Package, { className: "h-10 w-10" }),
          title: "No products yet",
          action: /* @__PURE__ */ jsx("button", { onClick: openCreate, className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700", children: "Create your first product" })
        }
      ) : /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-700/50", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-5 py-3", children: "Product" }),
          /* @__PURE__ */ jsx("th", { className: "px-5 py-3", children: "Category" }),
          /* @__PURE__ */ jsx("th", { className: "px-5 py-3", children: "Price" }),
          /* @__PURE__ */ jsx("th", { className: "px-5 py-3", children: "Stock" }),
          /* @__PURE__ */ jsx("th", { className: "px-5 py-3", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-5 py-3 text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-100 dark:divide-gray-700", children: products.data.map((p) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { className: "px-5 py-3 font-medium text-gray-900 dark:text-white", children: p.name }),
          /* @__PURE__ */ jsx("td", { className: "px-5 py-3 capitalize text-gray-500", children: p.category }),
          /* @__PURE__ */ jsx("td", { className: "px-5 py-3 font-semibold text-indigo-600", children: formatCurrency(Number(p.price)) }),
          /* @__PURE__ */ jsx("td", { className: "px-5 py-3", children: p.stock_quantity > 0 ? p.stock_quantity : /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "Out" }) }),
          /* @__PURE__ */ jsx("td", { className: "px-5 py-3", children: /* @__PURE__ */ jsx("button", { onClick: () => toggleActive(p), className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${p.is_active ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`, children: p.is_active ? "Active" : "Hidden" }) }),
          /* @__PURE__ */ jsx("td", { className: "px-5 py-3", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => openEdit(p), className: "text-gray-400 hover:text-indigo-600", children: /* @__PURE__ */ jsx(Pencil, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsx("button", { onClick: () => setPendingDelete(p), className: "text-gray-400 hover:text-red-500", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
          ] }) })
        ] }, p.id)) })
      ] }) }),
      creating && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/50", onClick: () => setCreating(false) }),
        /* @__PURE__ */ jsxs("form", { onSubmit: save, className: "relative w-full max-w-md space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("h2", { className: "font-bold text-gray-900 dark:text-white", children: editing ? "Edit product" : "New product" }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setCreating(false), children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5 text-gray-400" }) })
          ] }),
          /* @__PURE__ */ jsx("input", { required: true, value: form.name, onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })), placeholder: "Product name", className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" }),
          /* @__PURE__ */ jsx("input", { required: true, value: form.category, onChange: (e) => setForm((f) => ({ ...f, category: e.target.value })), placeholder: "Category (e.g. electronics)", className: "w-full rounded-lg border-gray-300 text-sm capitalize dark:border-gray-600 dark:bg-gray-700 dark:text-white" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
            /* @__PURE__ */ jsx("input", { required: true, type: "number", min: 0.01, step: "0.01", value: form.price, onChange: (e) => setForm((f) => ({ ...f, price: e.target.value })), placeholder: "Price", className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" }),
            /* @__PURE__ */ jsx("input", { required: true, type: "number", min: 0, value: form.stock_quantity, onChange: (e) => setForm((f) => ({ ...f, stock_quantity: e.target.value })), placeholder: "Stock", className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setCreating(false), className: "rounded-lg px-4 py-2 text-sm text-gray-500", children: "Cancel" }),
            /* @__PURE__ */ jsx("button", { type: "submit", disabled: busy, className: "rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60", children: busy ? "Saving…" : editing ? "Save changes" : "Create product" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        ConfirmDialog,
        {
          open: pendingDelete !== null,
          title: `Delete "${(pendingDelete == null ? void 0 : pendingDelete.name) ?? ""}"?`,
          description: "This permanently removes the product from your store. This cannot be undone.",
          confirmLabel: "Delete product",
          danger: true,
          busy,
          onConfirm: () => pendingDelete && destroy(pendingDelete),
          onCancel: () => setPendingDelete(null)
        }
      )
    ] })
  ] });
}
export {
  VendorProducts as default
};
