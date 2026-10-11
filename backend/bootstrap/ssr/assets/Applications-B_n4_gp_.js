import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { Briefcase, FileText } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function AccountApplications() {
  const [jobs, setJobs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("jobs");
  useEffect(() => {
    Promise.all([
      api.get("/api/jobs/my-applications").catch(() => ({ data: [] })),
      api.get("/api/my-task-applications").catch(() => ({ data: [] }))
    ]).then(([j, t]) => {
      setJobs((j.data ?? []).map((row) => {
        var _a;
        return {
          id: row.id,
          status: row.status,
          created_at: row.created_at,
          job_post: row.job_post ? { title: row.job_post.title ?? "Job", company: row.job_post.company ?? "" } : void 0,
          tab: "jobs",
          link: ((_a = row.job_post) == null ? void 0 : _a.id) ? `/jobs/${row.job_post.id}` : "/jobs"
        };
      }));
      setTasks((t.data ?? []).map((row) => {
        const task = row.task_post ?? row.task;
        return {
          id: row.id,
          status: row.status,
          created_at: row.created_at,
          task_post: task ? { title: task.title ?? "Task" } : void 0,
          tab: "tasks",
          link: (task == null ? void 0 : task.id) ? `/tasks/${task.id}` : "/tasks"
        };
      }));
    }).finally(() => setLoading(false));
  }, []);
  const list = tab === "jobs" ? jobs : tasks;
  return /* @__PURE__ */ jsxs(AppLayout, { title: "My Applications", children: [
    /* @__PURE__ */ jsx(Head, { title: "My Applications" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Briefcase, { className: "h-6 w-6" }),
        " My Applications"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs("button", { onClick: () => setTab("jobs"), className: `px-4 py-2 rounded-lg text-sm ${tab === "jobs" ? "bg-blue-600 text-white" : "bg-white border dark:bg-gray-800 dark:border-gray-600"}`, children: [
          "Jobs (",
          jobs.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => setTab("tasks"), className: `px-4 py-2 rounded-lg text-sm ${tab === "tasks" ? "bg-blue-600 text-white" : "bg-white border dark:bg-gray-800 dark:border-gray-600"}`, children: [
          "Tasks (",
          tasks.length,
          ")"
        ] })
      ] }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : list.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(FileText, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No applications yet" }),
        /* @__PURE__ */ jsxs(Link, { href: tab === "jobs" ? "/jobs" : "/tasks", className: "mt-4 inline-block text-blue-600 hover:underline", children: [
          "Browse ",
          tab
        ] })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: list.map((a) => {
        var _a, _b;
        return /* @__PURE__ */ jsxs(
          Link,
          {
            href: a.link ?? "#",
            className: "block rounded-lg bg-white p-4 shadow transition hover:shadow-md dark:bg-gray-800",
            children: [
              /* @__PURE__ */ jsx("p", { className: "font-semibold dark:text-white", children: ((_a = a.job_post) == null ? void 0 : _a.title) || ((_b = a.task_post) == null ? void 0 : _b.title) || "Application" }),
              a.job_post && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: a.job_post.company }),
              /* @__PURE__ */ jsxs("div", { className: "mt-2 flex justify-between text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-full text-xs ${a.status === "hired" || a.status === "approved" ? "bg-green-100 text-green-800" : a.status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`, children: a.status }),
                /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: new Date(a.created_at).toLocaleDateString() })
              ] })
            ]
          },
          a.id
        );
      }) })
    ] })
  ] });
}
export {
  AccountApplications as default
};
