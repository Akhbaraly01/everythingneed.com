import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { Briefcase, MapPin, DollarSign } from "lucide-react";
import "react";
import "./api-Dp2ndEHF.js";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function Jobs({ jobs }) {
  const list = (jobs == null ? void 0 : jobs.data) ?? [];
  if (list.length === 0) {
    return /* @__PURE__ */ jsxs(AppLayout, { title: "Jobs", children: [
      /* @__PURE__ */ jsx(Head, { title: "Jobs" }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Briefcase, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No jobs found" })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Jobs", children: [
    /* @__PURE__ */ jsx(Head, { title: "Jobs" }),
    /* @__PURE__ */ jsx("div", { className: "space-y-4", children: list.map((job) => {
      var _a;
      return /* @__PURE__ */ jsx(Link, { href: `/jobs/${job.id}`, className: "block rounded-lg bg-white p-6 shadow hover:shadow-md dark:bg-gray-800", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold text-gray-900 dark:text-white", children: job.title }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-indigo-600", children: job.company }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center gap-4 text-sm text-gray-500", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "h-3 w-3" }),
              job.location
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Briefcase, { className: "h-3 w-3" }),
              job.job_type
            ] }),
            job.salary_min && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(DollarSign, { className: "h-3 w-3" }),
              job.salary_min.toLocaleString(),
              " - ",
              (_a = job.salary_max) == null ? void 0 : _a.toLocaleString()
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-indigo-600", children: "View →" })
      ] }) }, job.id);
    }) })
  ] });
}
export {
  Jobs as default
};
