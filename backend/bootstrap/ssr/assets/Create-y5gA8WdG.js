import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { a as api, A as ApiError, e as errorMessage } from "./api-Dp2ndEHF.js";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
function CreateTask() {
  var _a, _b, _c, _d, _e;
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [requirements, setRequirements] = useState([""]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    quantity: "1",
    budget: "",
    deadline: ""
  });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      await api.post("/api/tasks", {
        title: form.title,
        description: form.description,
        quantity: Number(form.quantity) || 1,
        budget: Number(form.budget),
        deadline: form.deadline || null,
        requirements: requirements.filter((r) => r.trim())
      });
      toast.success("Task published", { description: "Workers on the platform can now apply." });
      router.visit("/tasks?mine=1");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? {});
        toast.error(errorMessage(err, "Action failed"));
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Post a task", children: [
    /* @__PURE__ */ jsx(Head, { title: "Post a task — Task Center" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs(Link, { href: "/tasks", className: "mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back to board"
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-5 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100", children: /* @__PURE__ */ jsx(Plus, { className: "h-5 w-5 text-violet-600" }) }),
          /* @__PURE__ */ jsx("h1", { className: "text-lg font-bold text-gray-900 dark:text-white", children: "Describe your task" })
        ] }),
        /* @__PURE__ */ jsx(Field, { label: "Task title", error: (_a = errors.title) == null ? void 0 : _a[0], children: /* @__PURE__ */ jsx(
          "input",
          {
            required: true,
            value: form.title,
            onChange: set("title"),
            placeholder: "e.g. Data entry — 200 product records",
            className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          }
        ) }),
        /* @__PURE__ */ jsx(Field, { label: "Full description", error: (_b = errors.description) == null ? void 0 : _b[0], children: /* @__PURE__ */ jsx(
          "textarea",
          {
            required: true,
            rows: 5,
            value: form.description,
            onChange: set("description"),
            placeholder: "What needs to be done, expected output, how you'll verify completion…",
            className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-3", children: [
          /* @__PURE__ */ jsx(Field, { label: "Quantity / units", error: (_c = errors.quantity) == null ? void 0 : _c[0], children: /* @__PURE__ */ jsx("input", { type: "number", min: 1, value: form.quantity, onChange: set("quantity"), className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" }) }),
          /* @__PURE__ */ jsx(Field, { label: `Budget (USD)`, error: (_d = errors.budget) == null ? void 0 : _d[0], children: /* @__PURE__ */ jsx("input", { type: "number", min: 0.01, step: "0.01", value: form.budget, onChange: set("budget"), placeholder: "50.00", className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" }) }),
          /* @__PURE__ */ jsx(Field, { label: "Deadline", optional: true, error: (_e = errors.deadline) == null ? void 0 : _e[0], children: /* @__PURE__ */ jsx("input", { type: "date", value: form.deadline, onChange: set("deadline"), className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" }) })
        ] }),
        /* @__PURE__ */ jsx(Field, { label: "Requirements", optional: true, hint: "One per line — workers must satisfy these to complete the task.", children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          requirements.map((req, i) => /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                value: req,
                onChange: (e) => setRequirements((r) => r.map((x, j) => j === i ? e.target.value : x)),
                placeholder: `Requirement ${i + 1}`,
                className: "flex-1 rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              }
            ),
            requirements.length > 1 && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setRequirements((r) => r.filter((_, j) => j !== i)), className: "text-gray-400 hover:text-red-500", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
          ] }, i)),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setRequirements((r) => [...r, ""]),
              className: "text-sm font-medium text-violet-600 hover:text-violet-700",
              children: "+ Add requirement"
            }
          )
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-950/40 dark:text-blue-300", children: "💡 Payment is only released after you verify the submitted evidence. The budget is paid per task completion." }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700", children: [
          /* @__PURE__ */ jsx(Link, { href: "/tasks", className: "rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400", children: "Cancel" }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              disabled: submitting,
              className: "flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60",
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
                " ",
                submitting ? "Publishing…" : "Publish task"
              ]
            }
          )
        ] })
      ] })
    ] })
  ] });
}
function Field({ label, children, optional, error, hint }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("label", { className: "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300", children: [
      label,
      " ",
      optional && /* @__PURE__ */ jsx("span", { className: "font-normal text-gray-400", children: "(optional)" })
    ] }),
    children,
    hint && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-gray-400", children: hint }),
    error && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-red-600", children: error })
  ] });
}
export {
  CreateTask as default
};
