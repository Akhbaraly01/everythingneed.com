import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { a as formatDateTime } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Briefcase, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function mapApplication(row) {
  var _a, _b, _c;
  return {
    id: row.id,
    job_id: row.job_id ?? ((_a = row.job_post) == null ? void 0 : _a.id) ?? "",
    job_title: ((_b = row.job_post) == null ? void 0 : _b.title) ?? "Job application",
    company: (_c = row.job_post) == null ? void 0 : _c.company,
    status: row.status,
    applied_at: row.created_at,
    updated_at: row.updated_at
  };
}
const statusIcons = {
  pending: Clock,
  reviewed: Clock,
  shortlisted: CheckCircle,
  rejected: XCircle,
  hired: CheckCircle
};
function JobApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/jobs/my-applications").then((res) => setApplications((res.data ?? []).map(mapApplication))).catch(() => setApplications([])).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "My Applications", children: [
    /* @__PURE__ */ jsx(Head, { title: "Job Applications" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "My Applications" }),
        /* @__PURE__ */ jsx(Link, { href: "/jobs", className: "text-sm text-indigo-600 hover:underline", children: "Browse Jobs" })
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) }) : applications.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Briefcase, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No applications yet" }),
        /* @__PURE__ */ jsx(Link, { href: "/jobs", className: "mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500", children: "Browse Jobs" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: applications.map((a) => {
        const Icon = statusIcons[a.status] ?? Clock;
        return /* @__PURE__ */ jsxs(
          Link,
          {
            href: `/jobs/${a.job_id}`,
            className: "flex items-center justify-between rounded-lg bg-white p-4 shadow transition hover:shadow-md dark:bg-gray-800",
            children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900 dark:text-white", children: a.job_title }),
                a.company && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: a.company }),
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-400", children: [
                  "Applied ",
                  formatDateTime(a.applied_at)
                ] })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium capitalize ${a.status === "hired" ? "bg-green-100 text-green-800" : a.status === "rejected" ? "bg-red-100 text-red-800" : a.status === "shortlisted" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`, children: [
                /* @__PURE__ */ jsx(Icon, { className: "h-3 w-3" }),
                " ",
                a.status
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
  JobApplications as default
};
