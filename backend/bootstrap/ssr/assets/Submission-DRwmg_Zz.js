import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, router } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { useState } from "react";
import { Upload, ArrowRight } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function TaskSubmission({ task_id }) {
  const [form, setForm] = useState({ evidence_note: "", evidence_url: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const id = task_id || (typeof window !== "undefined" ? window.location.pathname.split("/").pop() : void 0);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const mine = await api.get("/api/my-task-applications?per_page=100");
      const mineForTask = (mine.data ?? []).find(
        (a) => String(a.task_post_id) === String(id) && a.status === "approved"
      );
      if (!mineForTask) {
        setError("No approved application found for this task.");
        setSubmitting(false);
        return;
      }
      await api.post(`/api/task-applications/${mineForTask.id}/submit`, form);
      router.visit(`/tasks/${id}`);
    } catch (err) {
      setError(errorMessage(err, "Submission failed"));
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Submit Task Proof", children: [
    /* @__PURE__ */ jsx(Head, { title: "Submit Proof" }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "mx-auto max-w-2xl space-y-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Upload, { className: "h-6 w-6" }),
        " Submit Proof"
      ] }),
      error && /* @__PURE__ */ jsx("div", { className: "rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20", children: error }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Evidence URL" }),
          /* @__PURE__ */ jsx("input", { value: form.evidence_url, onChange: (e) => setForm({ ...form, evidence_url: e.target.value }), placeholder: "Link to proof (image, document, video...)", className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Notes" }),
          /* @__PURE__ */ jsx("textarea", { required: true, value: form.evidence_note, onChange: (e) => setForm({ ...form, evidence_note: e.target.value }), rows: 4, placeholder: "Describe your work...", className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "submit", disabled: submitting, className: "w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2", children: [
        submitting ? "Submitting..." : "Submit Proof",
        " ",
        /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
      ] })
    ] })
  ] });
}
export {
  TaskSubmission as default
};
