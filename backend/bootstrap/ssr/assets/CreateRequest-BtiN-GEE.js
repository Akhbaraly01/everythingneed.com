import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { a as api, A as ApiError, e as errorMessage } from "./api-Dp2ndEHF.js";
import { g as getInitials, f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";
import "clsx";
function CreateWorkRequest({ worker }) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    start_date: "",
    estimated_duration: "",
    budget_min: worker.hourly_rate ? String(worker.hourly_rate) : "",
    budget_max: ""
  });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const submit = async (e) => {
    var _a2;
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      await api.post("/api/work-requests", {
        worker_profile_id: worker.id,
        title: form.title,
        description: form.description || null,
        category: worker.category,
        location: form.location || null,
        start_date: form.start_date || null,
        estimated_duration: form.estimated_duration || null,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null
      });
      toast.success("Request sent", {
        description: `${(_a2 = worker.user) == null ? void 0 : _a2.name} will receive your request and can respond with an offer.`
      });
      router.visit("/job-seekers/my-requests");
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
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Request worker", children: [
    /* @__PURE__ */ jsx(Head, { title: `Request ${(_a = worker.user) == null ? void 0 : _a.name}` }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs(Link, { href: `/job-seekers/${worker.id}`, className: "mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back to profile"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("span", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700", children: getInitials(((_b = worker.user) == null ? void 0 : _b.name) ?? "W") }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900 dark:text-white", children: (_c = worker.user) == null ? void 0 : _c.name }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500", children: [
            worker.headline,
            " · ",
            formatCurrency(worker.hourly_rate ?? 0),
            "/hr"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-5 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-lg font-bold text-gray-900 dark:text-white", children: "Describe the work you need" }),
        /* @__PURE__ */ jsx(Field, { label: "What do you need done?", error: (_d = errors.title) == null ? void 0 : _d[0], children: /* @__PURE__ */ jsx(
          "input",
          {
            required: true,
            value: form.title,
            onChange: set("title"),
            placeholder: "e.g. Rewire kitchen lighting",
            className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          }
        ) }),
        /* @__PURE__ */ jsx(Field, { label: "Details & requirements", optional: true, error: (_e = errors.description) == null ? void 0 : _e[0], children: /* @__PURE__ */ jsx(
          "textarea",
          {
            rows: 4,
            value: form.description,
            onChange: set("description"),
            placeholder: "Materials, access instructions, expectations…",
            className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsx(Field, { label: "Location", optional: true, error: (_f = errors.location) == null ? void 0 : _f[0], children: /* @__PURE__ */ jsx("input", { value: form.location, onChange: set("location"), className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" }) }),
          /* @__PURE__ */ jsx(Field, { label: "Preferred start date", optional: true, error: (_g = errors.start_date) == null ? void 0 : _g[0], children: /* @__PURE__ */ jsx("input", { type: "date", value: form.start_date, onChange: set("start_date"), className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" }) }),
          /* @__PURE__ */ jsx(Field, { label: "Estimated duration", optional: true, children: /* @__PURE__ */ jsx("input", { value: form.estimated_duration, onChange: set("estimated_duration"), placeholder: "e.g. 3 days, 2 weeks", className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" }) }),
          /* @__PURE__ */ jsx(Field, { label: "Workers needed", optional: true, children: /* @__PURE__ */ jsx("input", { type: "number", min: 1, defaultValue: 1, disabled: true, className: "w-full cursor-not-allowed rounded-lg border-gray-300 bg-gray-50 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsx(Field, { label: "Budget — minimum", error: (_h = errors.budget_min) == null ? void 0 : _h[0], children: /* @__PURE__ */ jsx("input", { type: "number", min: 0, step: "0.01", value: form.budget_min, onChange: set("budget_min"), className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" }) }),
          /* @__PURE__ */ jsx(Field, { label: "Budget — maximum", optional: true, error: (_i = errors.budget_max) == null ? void 0 : _i[0], children: /* @__PURE__ */ jsx("input", { type: "number", min: 0, step: "0.01", value: form.budget_max, onChange: set("budget_max"), className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => window.history.back(),
              className: "rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              disabled: submitting,
              className: "flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60",
              children: [
                /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" }),
                " ",
                submitting ? "Sending…" : "Send request"
              ]
            }
          )
        ] })
      ] })
    ] })
  ] });
}
function Field({ label, children, optional, error }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("label", { className: "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300", children: [
      label,
      " ",
      optional && /* @__PURE__ */ jsx("span", { className: "font-normal text-gray-400", children: "(optional)" })
    ] }),
    children,
    error && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-red-600", children: error })
  ] });
}
export {
  CreateWorkRequest as default
};
