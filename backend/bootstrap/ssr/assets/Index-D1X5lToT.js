import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { c as formatDate, f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { ListChecks, ClipboardList, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import "./api-Dp2ndEHF.js";
import "clsx";
import "sonner";
const statusStyles = {
  open: "bg-green-100 text-green-800",
  in_review: "bg-amber-100 text-amber-800",
  assigned: "bg-indigo-100 text-indigo-800",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700"
};
function TasksIndex({ tasks, filters }) {
  const [q, setQ] = useState(filters.q ?? "");
  const mine = filters.mine === "1";
  const search = (e) => {
    e.preventDefault();
    router.get("/tasks", q ? { q } : {}, { preserveState: true });
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Task Center", children: [
    /* @__PURE__ */ jsx(Head, { title: "Task Center" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100", children: /* @__PURE__ */ jsx(ListChecks, { className: "h-6 w-6 text-violet-600" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Task Center" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
              tasks.total,
              " open tasks — participate and earn"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs(Link, { href: "/tasks/my-applications", className: "flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700", children: [
            /* @__PURE__ */ jsx(ClipboardList, { className: "h-4 w-4" }),
            " My Applications"
          ] }),
          /* @__PURE__ */ jsxs(Link, { href: "/tasks/create", className: "flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700", children: [
            /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
            " Post a Task"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-5 flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "inline-flex rounded-lg border border-gray-300 p-0.5 dark:border-gray-600", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => router.get("/tasks", {}, { preserveState: true }),
              className: `rounded-md px-3 py-1.5 text-sm font-medium ${!mine ? "bg-violet-600 text-white" : "text-gray-600 dark:text-gray-300"}`,
              children: "Open tasks"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => router.get("/tasks", { mine: "1" }, { preserveState: true }),
              className: `rounded-md px-3 py-1.5 text-sm font-medium ${mine ? "bg-violet-600 text-white" : "text-gray-600 dark:text-gray-300"}`,
              children: "My posts"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: search, className: "relative min-w-60 flex-1", children: [
          /* @__PURE__ */ jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              value: q,
              onChange: (e) => setQ(e.target.value),
              placeholder: "Search tasks…",
              className: "w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            }
          )
        ] })
      ] }),
      tasks.data.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-600", children: [
        /* @__PURE__ */ jsx(ListChecks, { className: "mx-auto mb-3 h-10 w-10 text-gray-300" }),
        /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: mine ? "You haven't posted any tasks yet" : "No open tasks right now" }),
        /* @__PURE__ */ jsx(Link, { href: "/tasks/create", className: "mt-3 inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700", children: "Post the first one" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: tasks.data.map((task) => {
        var _a;
        return /* @__PURE__ */ jsx(
          Link,
          {
            href: `/tasks/${task.id}`,
            className: "block rounded-xl border border-gray-200 bg-white p-5 transition hover:border-violet-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800",
            children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsxs("div", { className: "mb-1 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-mono text-[11px] text-gray-400", children: task.post_number }),
                  /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[task.status] ?? ""}`, children: task.status.replace("_", " ") })
                ] }),
                /* @__PURE__ */ jsx("h3", { className: "font-semibold text-gray-900 dark:text-white", children: task.title }),
                /* @__PURE__ */ jsx("p", { className: "mt-0.5 line-clamp-1 text-sm text-gray-500", children: task.description }),
                /* @__PURE__ */ jsxs("p", { className: "mt-1.5 text-xs text-gray-400", children: [
                  "by ",
                  ((_a = task.owner) == null ? void 0 : _a.name) ?? "Unknown",
                  " · posted ",
                  formatDate(task.created_at),
                  task.deadline ? ` · due ${formatDate(task.deadline)}` : ""
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xl font-bold text-violet-600", children: formatCurrency(Number(task.budget)) }),
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500", children: [
                  "Qty ",
                  task.quantity,
                  " · ",
                  task.applications_count ?? 0,
                  " applicant",
                  (task.applications_count ?? 0) === 1 ? "" : "s"
                ] })
              ] })
            ] })
          },
          task.id
        );
      }) }),
      tasks.last_page > 1 && /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-center justify-center gap-3", children: [
        tasks.current_page > 1 && /* @__PURE__ */ jsx(Link, { href: `/tasks?page=${tasks.current_page - 1}`, preserveState: true, className: "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white", children: /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-600 dark:text-gray-300", children: [
          "Page ",
          tasks.current_page,
          " of ",
          tasks.last_page
        ] }),
        tasks.current_page < tasks.last_page && /* @__PURE__ */ jsx(Link, { href: `/tasks?page=${tasks.current_page + 1}`, preserveState: true, className: "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white", children: /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" }) })
      ] })
    ] })
  ] });
}
export {
  TasksIndex as default
};
