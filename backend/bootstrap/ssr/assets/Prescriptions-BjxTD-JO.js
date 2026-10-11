import { jsxs, jsx } from "react/jsx-runtime";
import { Head, Link } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { c as formatDate } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Pill, FileText, Stethoscope, CalendarClock } from "lucide-react";
import "react";
import "./api-Dp2ndEHF.js";
import "clsx";
import "sonner";
function HealthcarePrescriptions({ prescriptions }) {
  return /* @__PURE__ */ jsxs(AppLayout, { title: "My prescriptions", children: [
    /* @__PURE__ */ jsx(Head, { title: "My prescriptions" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("span", { className: "flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100", children: /* @__PURE__ */ jsx(Pill, { className: "h-6 w-6 text-teal-600" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Prescriptions" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
            prescriptions.length,
            " on file"
          ] })
        ] })
      ] }),
      prescriptions.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-600", children: [
        /* @__PURE__ */ jsx(FileText, { className: "mx-auto mb-3 h-10 w-10 text-gray-300" }),
        /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "No prescriptions yet" }),
        /* @__PURE__ */ jsx(Link, { href: "/healthcare/appointments", className: "mt-3 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700", children: "View my appointments" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: prescriptions.map((p) => {
        var _a, _b;
        return /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-600 dark:bg-gray-700/40", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("p", { className: "text-xs uppercase tracking-wide text-gray-400", children: [
                "Issued ",
                p.date ? formatDate(p.date) : "recently"
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white", children: [
                /* @__PURE__ */ jsx(Stethoscope, { className: "h-4 w-4 text-teal-500" }),
                ((_a = p.doctor) == null ? void 0 : _a.full_name) ?? "Healthcare provider",
                ((_b = p.doctor) == null ? void 0 : _b.specialization) && /* @__PURE__ */ jsxs("span", { className: "font-normal text-gray-500", children: [
                  "· ",
                  p.doctor.specialization
                ] })
              ] })
            ] }),
            p.ticket_number && /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-gray-400", children: p.ticket_number })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "px-5 py-4", children: [
            p.diagnosis && /* @__PURE__ */ jsxs("p", { className: "mb-3 text-sm text-gray-600 dark:text-gray-300", children: [
              /* @__PURE__ */ jsx("strong", { children: "Diagnosis:" }),
              " ",
              p.diagnosis
            ] }),
            /* @__PURE__ */ jsx("ul", { className: "divide-y divide-gray-100 dark:divide-gray-700", children: p.items.map((item, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-start justify-between py-2.5 first:pt-0 last:pb-0", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium text-gray-900 dark:text-white", children: [
                "💊 ",
                item.name
              ] }),
              /* @__PURE__ */ jsx("span", { className: "ml-4 text-right text-xs text-gray-500", children: [item.dosage, item.frequency, item.duration].filter(Boolean).join(" · ") || "As directed" })
            ] }, i)) }),
            p.follow_up_date && /* @__PURE__ */ jsxs("p", { className: "mt-3 flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-300", children: [
              /* @__PURE__ */ jsx(CalendarClock, { className: "h-3.5 w-3.5" }),
              " Follow-up: ",
              formatDate(p.follow_up_date)
            ] })
          ] })
        ] }, p.id);
      }) })
    ] })
  ] });
}
export {
  HealthcarePrescriptions as default
};
