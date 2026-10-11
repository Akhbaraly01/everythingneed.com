import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link, router } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { ArrowLeft, Send } from "lucide-react";
import { useState } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function TicketCreate() {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post("/api/tickets", {
        subject,
        description,
        priority
      });
      router.visit(`/tickets/${res.data.id}`);
    } catch (e) {
      alert(errorMessage(e, "Failed to create ticket"));
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Create Ticket", children: [
    /* @__PURE__ */ jsx(Head, { title: "Create Support Ticket" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6 max-w-2xl", children: [
      /* @__PURE__ */ jsxs(Link, { href: "/tickets", className: "inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back to tickets"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "New Support Ticket" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Subject *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: subject,
                onChange: (e) => setSubject(e.target.value),
                className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700",
                placeholder: "Brief description of your issue"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Priority" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: priority,
                onChange: (e) => setPriority(e.target.value),
                className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "low", children: "Low" }),
                  /* @__PURE__ */ jsx("option", { value: "medium", children: "Medium" }),
                  /* @__PURE__ */ jsx("option", { value: "high", children: "High" }),
                  /* @__PURE__ */ jsx("option", { value: "urgent", children: "Urgent" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Description *" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: description,
                onChange: (e) => setDescription(e.target.value),
                rows: 6,
                className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700",
                placeholder: "Describe your issue in detail..."
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex gap-3", children: [
          /* @__PURE__ */ jsx(Link, { href: "/tickets", className: "flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium hover:bg-gray-50 dark:border-gray-600", children: "Cancel" }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleSubmit,
              disabled: submitting || !subject.trim() || !description.trim(),
              className: "flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50",
              children: [
                /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" }),
                submitting ? "Creating..." : "Create Ticket"
              ]
            }
          )
        ] })
      ] })
    ] })
  ] });
}
export {
  TicketCreate as default
};
