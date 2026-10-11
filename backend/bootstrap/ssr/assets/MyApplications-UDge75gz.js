import { jsxs, jsx } from "react/jsx-runtime";
import { Head, Link } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { c as formatDate, f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { ClipboardList, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import "react";
import "./api-Dp2ndEHF.js";
import "clsx";
import "sonner";
const statusStyles = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-indigo-100 text-indigo-800",
  rejected: "bg-red-100 text-red-700",
  submitted: "bg-cyan-100 text-cyan-800",
  verified: "bg-green-100 text-green-800",
  paid: "bg-purple-100 text-purple-800"
};
const nextStep = {
  pending: "Awaiting the owner’s review",
  approved: "Open the task and submit your evidence",
  submitted: "Evidence under review",
  verified: "Payment being released",
  paid: "Completed — funds in your payments history"
};
function MyTaskApplications({ applications }) {
  return /* @__PURE__ */ jsxs(AppLayout, { title: "My task applications", children: [
    /* @__PURE__ */ jsx(Head, { title: "My task applications" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 py-8", children: [
      /* @__PURE__ */ jsx("h1", { className: "mb-1 text-2xl font-bold text-gray-900 dark:text-white", children: "My Applications" }),
      /* @__PURE__ */ jsxs("p", { className: "mb-6 text-sm text-gray-500", children: [
        applications.total,
        " tasks you applied for"
      ] }),
      applications.data.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-600", children: [
        /* @__PURE__ */ jsx(ClipboardList, { className: "mx-auto mb-3 h-10 w-10 text-gray-300" }),
        /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "No applications yet" }),
        /* @__PURE__ */ jsx(Link, { href: "/tasks", className: "mt-3 inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700", children: "Browse open tasks" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: applications.data.map((a) => {
        var _a;
        return /* @__PURE__ */ jsxs(
          Link,
          {
            href: a.task ? `/tasks/${a.task.id}` : "/tasks",
            className: "flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition hover:border-violet-300 dark:border-gray-700 dark:bg-gray-800",
            children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: ((_a = a.task) == null ? void 0 : _a.title) ?? "Task removed" }),
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500", children: [
                  "Applied ",
                  formatDate(a.created_at),
                  a.task ? ` · ${formatCurrency(Number(a.task.budget))}` : "",
                  " · ",
                  /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyles[a.status]}`, children: a.status })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-xs text-gray-400", children: nextStep[a.status] })
              ] }),
              /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4 shrink-0 text-gray-400" })
            ]
          },
          a.id
        );
      }) }),
      applications.last_page > 1 && /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-center justify-center gap-3", children: [
        applications.current_page > 1 && /* @__PURE__ */ jsx(Link, { href: `/tasks/my-applications?page=${applications.current_page - 1}`, preserveState: true, className: "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white", children: /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-600 dark:text-gray-300", children: [
          "Page ",
          applications.current_page,
          " of ",
          applications.last_page
        ] }),
        applications.current_page < applications.last_page && /* @__PURE__ */ jsx(Link, { href: `/tasks/my-applications?page=${applications.current_page + 1}`, preserveState: true, className: "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white", children: /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" }) })
      ] })
    ] })
  ] });
}
export {
  MyTaskApplications as default
};
