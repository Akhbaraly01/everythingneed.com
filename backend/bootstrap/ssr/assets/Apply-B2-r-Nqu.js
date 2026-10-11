import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, router } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function JobApply({ job }) {
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const handleApply = async () => {
    setSubmitting(true);
    try {
      await api.post(`/api/jobs/${job.id}/apply`, {
        cover_letter: coverLetter || void 0,
        resume_url: resumeUrl || void 0
      });
      alert("Application submitted!");
      router.visit("/jobs/applications");
    } catch (e) {
      alert(errorMessage(e, "Failed to apply"));
    }
    setSubmitting(false);
  };
  return /* @__PURE__ */ jsxs(AppLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: `Apply to ${job.title}` }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsxs("button", { onClick: () => history.back(), className: "inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back to job"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: [
          "Apply for ",
          job.title
        ] }),
        job.company && /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
          job.company,
          job.location ? ` - ${job.location}` : ""
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Resume URL (optional)" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "url",
                value: resumeUrl,
                onChange: (e) => setResumeUrl(e.target.value),
                placeholder: "https://...",
                className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Cover Letter" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: coverLetter,
                onChange: (e) => setCoverLetter(e.target.value),
                rows: 6,
                placeholder: "Tell the employer why you're a great fit...",
                className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleApply,
            disabled: submitting,
            className: "mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50",
            children: [
              /* @__PURE__ */ jsx(Check, { className: "h-5 w-5" }),
              " ",
              submitting ? "Submitting..." : "Submit Application"
            ]
          }
        )
      ] })
    ] })
  ] });
}
export {
  JobApply as default
};
