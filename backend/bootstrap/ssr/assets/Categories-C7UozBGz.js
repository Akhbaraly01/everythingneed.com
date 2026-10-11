import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { toast } from "sonner";
import { FolderTree, Plus, Pencil, Trash2 } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
function AdminCategories({ categories }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const reset = () => {
    setShowForm(false);
    setEditId(null);
    setName("");
  };
  const startEdit = (cat) => {
    setEditId(cat.id);
    setName(cat.name);
    setShowForm(true);
  };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editId) {
        await api.put(`/api/categories/${editId}`, { name });
        toast.success("Category updated");
      } else {
        await api.post("/api/categories", { name });
        toast.success("Category created");
      }
      reset();
      router.reload({ only: ["categories"] });
    } catch (err) {
      toast.error(errorMessage(err, "Failed"));
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id) => {
    if (!confirm("Delete this category?")) return;
    try {
      await api.del(`/api/categories/${id}`);
      toast.success("Deleted");
      router.reload({ only: ["categories"] });
    } catch (err) {
      toast.error(errorMessage(err, "Failed"));
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Admin · Categories", children: [
    /* @__PURE__ */ jsx(Head, { title: "Categories" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100", children: /* @__PURE__ */ jsx(FolderTree, { className: "h-6 w-6 text-purple-600" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Categories" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
              categories.length,
              " categor",
              categories.length === 1 ? "y" : "ies"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => {
              reset();
              setShowForm(!showForm);
            },
            className: "flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
              " Add category"
            ]
          }
        )
      ] }),
      showForm && /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "mb-6 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: name,
            onChange: (e) => setName(e.target.value),
            placeholder: "Category name",
            className: "flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white",
            required: true,
            autoFocus: true
          }
        ),
        /* @__PURE__ */ jsx("button", { type: "submit", disabled: busy, className: "rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50", children: editId ? "Update" : "Create" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: reset, className: "rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400", children: "Cancel" })
      ] }),
      categories.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-gray-300 p-14 text-center dark:border-gray-600", children: [
        /* @__PURE__ */ jsx(FolderTree, { className: "mx-auto mb-3 h-10 w-10 text-gray-300" }),
        /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "No categories yet" })
      ] }) : /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: categories.map((cat) => /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: cat.name }),
          /* @__PURE__ */ jsx("span", { className: "ml-2 text-xs text-gray-400", children: cat.slug }),
          !cat.is_active && /* @__PURE__ */ jsx("span", { className: "ml-2 text-xs text-red-500", children: "(inactive)" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => startEdit(cat), className: "rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700", children: /* @__PURE__ */ jsx(Pencil, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsx("button", { onClick: () => remove(cat.id), className: "rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
        ] })
      ] }, cat.id)) })
    ] })
  ] });
}
export {
  AdminCategories as default
};
