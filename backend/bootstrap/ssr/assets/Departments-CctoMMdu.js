import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { toast } from "sonner";
import { Building2, Plus, Pencil, Trash2, X } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
const emptyForm = { name: "", description: "" };
function AdminDepartments({ departments }) {
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const openCreate = () => {
    setForm(emptyForm);
    setEditing(null);
    setCreating(true);
  };
  const openEdit = (d) => {
    setForm({ name: d.name, description: d.description ?? "" });
    setEditing(d);
    setCreating(true);
  };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing) {
        await api.put(`/api/admin/departments/${editing.id}`, form);
        toast.success("Department updated");
      } else {
        await api.post("/api/admin/departments", form);
        toast.success("Department created");
      }
      setCreating(false);
      router.reload({ only: ["departments"] });
    } catch (err) {
      toast.error(errorMessage(err, "Save failed"));
    } finally {
      setBusy(false);
    }
  };
  const destroy = async (d) => {
    if (!confirm(`Delete department "${d.name}"?`)) return;
    try {
      await api.del(`/api/admin/departments/${d.id}`);
      toast.success("Department deleted");
      router.reload({ only: ["departments"] });
    } catch (err) {
      toast.error(errorMessage(err, "Delete failed"));
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Admin · Departments", children: [
    /* @__PURE__ */ jsx(Head, { title: "Departments" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100", children: /* @__PURE__ */ jsx(Building2, { className: "h-6 w-6 text-sky-600" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Departments" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Routing for support tickets and internal escalation" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: openCreate, className: "flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700", children: [
          /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
          " New department"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-700/50", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-5 py-3", children: "Name" }),
          /* @__PURE__ */ jsx("th", { className: "px-5 py-3", children: "Description" }),
          /* @__PURE__ */ jsx("th", { className: "px-5 py-3", children: "Tickets" }),
          /* @__PURE__ */ jsx("th", { className: "px-5 py-3 text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-100 dark:divide-gray-700", children: departments.map((d) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { className: "px-5 py-3 font-medium text-gray-900 dark:text-white", children: d.name }),
          /* @__PURE__ */ jsx("td", { className: "max-w-xs truncate px-5 py-3 text-gray-500", children: d.description ?? "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-5 py-3", children: d.tickets_count }),
          /* @__PURE__ */ jsx("td", { className: "px-5 py-3", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => openEdit(d), className: "text-gray-400 hover:text-sky-600", children: /* @__PURE__ */ jsx(Pencil, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => destroy(d),
                disabled: Number(d.tickets_count) > 0,
                title: Number(d.tickets_count) > 0 ? "In use by tickets — cannot delete" : "Delete",
                className: "text-gray-400 hover:text-red-500 disabled:cursor-not-allowed disabled:text-gray-200",
                children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
              }
            )
          ] }) })
        ] }, d.id)) })
      ] }) }),
      creating && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/50", onClick: () => setCreating(false) }),
        /* @__PURE__ */ jsxs("form", { onSubmit: save, className: "relative w-full max-w-md space-y-3 rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("h2", { className: "font-bold text-gray-900 dark:text-white", children: editing ? "Edit department" : "New department" }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setCreating(false), children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5 text-gray-400" }) })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              required: true,
              value: form.name,
              onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })),
              placeholder: "Department name (e.g. Billing)",
              className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            }
          ),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              rows: 3,
              value: form.description,
              onChange: (e) => setForm((f) => ({ ...f, description: e.target.value })),
              placeholder: "What kinds of issues route here?",
              className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-1", children: [
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setCreating(false), className: "rounded-lg px-4 py-2 text-sm text-gray-500", children: "Cancel" }),
            /* @__PURE__ */ jsx("button", { type: "submit", disabled: busy, className: "rounded-lg bg-sky-600 px-5 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60", children: busy ? "Saving…" : editing ? "Save changes" : "Create" })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  AdminDepartments as default
};
