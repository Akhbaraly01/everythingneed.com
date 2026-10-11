import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { e as errorMessage, a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency, c as formatDate } from "./PushNotificationPrompt-DvDsnr4H.js";
import { toast } from "sonner";
import { ArrowLeft, FileText, ClipboardList, BadgeCheck, Send, CheckCircle2 } from "lucide-react";
import "clsx";
const appStatusStyles = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-indigo-100 text-indigo-800",
  rejected: "bg-red-100 text-red-700",
  submitted: "bg-cyan-100 text-cyan-800",
  verified: "bg-green-100 text-green-800",
  paid: "bg-purple-100 text-purple-800"
};
function TaskShow({ task, isOwner, myApplication, applications }) {
  var _a;
  const [busy, setBusy] = useState(null);
  const [applyMessage, setApplyMessage] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");
  const act = async (label, fn) => {
    setBusy(label);
    try {
      await fn();
      toast.success(`${label} successful`);
      router.reload({ only: ["task", "myApplication", "applications"] });
    } catch (err) {
      toast.error(errorMessage(err, "Action failed"));
    } finally {
      setBusy(null);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: task.title, children: [
    /* @__PURE__ */ jsx(Head, { title: `${task.title} — Task Center` }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs(Link, { href: "/tasks", className: "mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back to board"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-3 flex flex-wrap items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-gray-400", children: task.post_number }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-violet-600", children: formatCurrency(Number(task.budget)) })
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "mb-2 text-xl font-bold text-gray-900 dark:text-white", children: task.title }),
        /* @__PURE__ */ jsx("p", { className: "whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-gray-300", children: task.description }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4", children: [
          /* @__PURE__ */ jsx(Stat, { label: "Quantity", value: String(task.quantity) }),
          /* @__PURE__ */ jsx(Stat, { label: "Budget", value: formatCurrency(Number(task.budget)) }),
          /* @__PURE__ */ jsx(Stat, { label: "Deadline", value: task.deadline ? formatDate(task.deadline) : "Flexible" }),
          /* @__PURE__ */ jsx(Stat, { label: "Applicants", value: String(task.applications_count ?? 0) })
        ] }),
        (((_a = task.requirements) == null ? void 0 : _a.length) ?? 0) > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/40", children: [
          /* @__PURE__ */ jsxs("p", { className: "mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400", children: [
            /* @__PURE__ */ jsx(FileText, { className: "h-3.5 w-3.5" }),
            " Requirements"
          ] }),
          /* @__PURE__ */ jsx("ul", { className: "list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-300", children: task.requirements.map((r, i) => /* @__PURE__ */ jsx("li", { children: r }, i)) })
        ] })
      ] }),
      !isOwner && /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("h2", { className: "mb-3 flex items-center gap-2 font-bold text-gray-900 dark:text-white", children: [
          /* @__PURE__ */ jsx(ClipboardList, { className: "h-5 w-5" }),
          " Participate"
        ] }),
        myApplication ? /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: `mb-3 inline-block rounded-full px-3 py-1 text-xs font-medium ${appStatusStyles[myApplication.status]}`, children: [
            "Your application: ",
            myApplication.status,
            ["approved", "submitted"].includes(myApplication.status) && " — you are assigned to this task"
          ] }),
          myApplication.status === "pending" && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Waiting for the task owner's review." }),
          myApplication.status === "rejected" && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "This time the owner went with another applicant." }),
          myApplication.status === "approved" && /* @__PURE__ */ jsx(
            SubmitEvidence,
            {
              evidenceUrl,
              setEvidenceUrl,
              evidenceNote,
              setEvidenceNote,
              busy: busy === "submit",
              onSubmit: () => act("Submission", () => api.post(`/api/task-applications/${myApplication.id}/submit`, {
                evidence_url: evidenceUrl || null,
                evidence_note: evidenceNote || null
              }))
            }
          ),
          myApplication.status === "submitted" && /* @__PURE__ */ jsx("p", { className: "text-sm text-amber-600", children: "⏳ Evidence submitted — awaiting owner verification." }),
          myApplication.status === "verified" && /* @__PURE__ */ jsxs("p", { className: "text-sm text-green-600", children: [
            "✓ Work verified! Payment of ",
            formatCurrency(Number(myApplication.payout ?? task.budget)),
            " is being released."
          ] }),
          myApplication.status === "paid" && /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-2 text-sm font-medium text-purple-600", children: [
            /* @__PURE__ */ jsx(BadgeCheck, { className: "h-4 w-4" }),
            " Paid ",
            formatCurrency(Number(myApplication.payout ?? task.budget)),
            " — check your payments history."
          ] })
        ] }) : task.status === "open" ? /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(
            "textarea",
            {
              rows: 3,
              value: applyMessage,
              onChange: (e) => setApplyMessage(e.target.value),
              placeholder: "Tell the owner why you're a good fit (optional)…",
              className: "mb-3 w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              disabled: busy === "apply",
              onClick: () => act("Application", () => api.post(`/api/tasks/${task.id}/apply`, { message: applyMessage || null })),
              className: "flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60",
              children: [
                /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" }),
                " ",
                busy === "apply" ? "Submitting…" : "Apply for this task"
              ]
            }
          )
        ] }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "This task is no longer open for new applicants." })
      ] }),
      isOwner && /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("h2", { className: "mb-3 flex items-center gap-2 font-bold text-gray-900 dark:text-white", children: [
          /* @__PURE__ */ jsx(ClipboardList, { className: "h-5 w-5" }),
          " Applications (",
          (applications == null ? void 0 : applications.length) ?? 0,
          ")"
        ] }),
        ((applications == null ? void 0 : applications.length) ?? 0) === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "No applications yet. They'll appear here as workers apply." }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: applications.map((a) => {
          var _a2;
          return /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-gray-200 p-4 dark:border-gray-600", children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-2 flex flex-wrap items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: ((_a2 = a.worker) == null ? void 0 : _a2.name) ?? "Worker" }),
              /* @__PURE__ */ jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${appStatusStyles[a.status]}`, children: a.status })
            ] }),
            a.message && /* @__PURE__ */ jsxs("p", { className: "mb-2 text-sm text-gray-600 dark:text-gray-300", children: [
              "“",
              a.message,
              "”"
            ] }),
            a.evidence_url && /* @__PURE__ */ jsxs("a", { href: a.evidence_url, target: "_blank", rel: "noreferrer", className: "mb-1 block truncate text-xs text-sky-600 hover:underline", children: [
              "📎 Evidence link: ",
              a.evidence_url
            ] }),
            a.evidence_note && /* @__PURE__ */ jsxs("p", { className: "mb-2 text-xs text-gray-500", children: [
              "Note: ",
              a.evidence_note
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
              a.status === "pending" && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    disabled: !!busy,
                    onClick: () => act("Approval", () => api.post(`/api/task-applications/${a.id}/approve`)),
                    className: "rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700",
                    children: "Approve & assign"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    disabled: !!busy,
                    onClick: () => act("Rejection", () => api.post(`/api/task-applications/${a.id}/reject`)),
                    className: "rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300",
                    children: "Reject"
                  }
                )
              ] }),
              a.status === "submitted" && /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs(
                "button",
                {
                  disabled: !!busy,
                  onClick: () => act("Verification", () => api.post(`/api/task-applications/${a.id}/verify`)),
                  className: "flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700",
                  children: [
                    /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3.5 w-3.5" }),
                    " Verify work"
                  ]
                }
              ) }),
              a.status === "verified" && /* @__PURE__ */ jsxs(
                "button",
                {
                  disabled: !!busy,
                  onClick: () => act("Payment", () => api.post(`/api/task-applications/${a.id}/mark-paid`)),
                  className: "rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700",
                  children: [
                    "Release payment (",
                    formatCurrency(Number(task.budget)),
                    ")"
                  ]
                }
              ),
              a.status === "paid" && /* @__PURE__ */ jsx("span", { className: "text-xs text-purple-600 font-medium", children: "✓ Completed & paid" })
            ] })
          ] }, a.id);
        }) })
      ] })
    ] })
  ] });
}
function SubmitEvidence({ evidenceUrl, setEvidenceUrl, evidenceNote, setEvidenceNote, busy, onSubmit }) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-gray-50 p-4 dark:bg-gray-700/40", children: [
    /* @__PURE__ */ jsx("p", { className: "mb-2 text-sm font-medium text-gray-900 dark:text-white", children: "Submit your work" }),
    /* @__PURE__ */ jsx(
      "input",
      {
        value: evidenceUrl,
        onChange: (e) => setEvidenceUrl(e.target.value),
        placeholder: "Evidence URL (drive folder, repo, album…)",
        className: "mb-2 w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      }
    ),
    /* @__PURE__ */ jsx(
      "textarea",
      {
        rows: 2,
        value: evidenceNote,
        onChange: (e) => setEvidenceNote(e.target.value),
        placeholder: "Notes for the reviewer (what was done, how to verify)…",
        className: "mb-3 w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      }
    ),
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: onSubmit,
        disabled: busy || !evidenceUrl && !evidenceNote,
        className: "flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50",
        children: [
          /* @__PURE__ */ jsx(Send, { className: "h-3.5 w-3.5" }),
          " ",
          busy ? "Submitting…" : "Submit evidence"
        ]
      }
    )
  ] });
}
function Stat({ label, value }) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-gray-50 p-3 dark:bg-gray-700/40", children: [
    /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: label }),
    /* @__PURE__ */ jsx("p", { className: "font-bold text-gray-900 dark:text-white", children: value })
  ] });
}
export {
  TaskShow as default
};
