import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { usePage, Head, router } from "@inertiajs/react";
import { Building2, MapPin, Briefcase, DollarSign, Clock, CheckCircle } from "lucide-react";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import "react";
import "./api-Dp2ndEHF.js";
import "clsx";
import "sonner";
function JobShow({ job }) {
  var _a;
  const { auth } = usePage().props;
  const isOwner = ((_a = auth == null ? void 0 : auth.user) == null ? void 0 : _a.id) === job.user_id;
  const handleApply = () => {
    if (!(auth == null ? void 0 : auth.user)) {
      router.visit("/login");
      return;
    }
    router.post(`/api/jobs/${job.id}/apply`, {}, {
      preserveScroll: true,
      onSuccess: () => router.reload(),
      onError: (errors) => {
        const msg = Object.values(errors)[0];
        if (typeof msg === "string") alert(msg);
      }
    });
  };
  return /* @__PURE__ */ jsxs(AppLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: job.title }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
      /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: job.title }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center gap-2 text-lg text-indigo-600", children: [
            /* @__PURE__ */ jsx(Building2, { className: "h-5 w-5" }),
            job.company
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4" }),
              job.location
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Briefcase, { className: "h-4 w-4" }),
              job.job_type
            ] }),
            job.salary_min && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(DollarSign, { className: "h-4 w-4" }),
              formatCurrency(job.salary_min),
              " - ",
              formatCurrency(job.salary_max ?? job.salary_min)
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Clock, { className: "h-4 w-4" }),
              "Posted ",
              new Date(job.created_at).toLocaleDateString()
            ] })
          ] })
        ] }),
        !isOwner && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleApply,
            className: "rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500",
            children: "Apply Now"
          }
        ),
        isOwner && /* @__PURE__ */ jsx("span", { className: "rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800", children: "Your listing" })
      ] }) }),
      job.description && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "Job Description" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 whitespace-pre-wrap text-gray-600 dark:text-gray-400", children: job.description })
      ] }),
      job.requirements && job.requirements.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "Requirements" }),
        /* @__PURE__ */ jsx("ul", { className: "mt-4 space-y-2", children: job.requirements.map((req, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-gray-600 dark:text-gray-400", children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "mt-0.5 h-4 w-4 shrink-0 text-green-500" }),
          req
        ] }, i)) })
      ] }),
      job.benefits && job.benefits.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "Benefits" }),
        /* @__PURE__ */ jsx("ul", { className: "mt-4 space-y-2", children: job.benefits.map((benefit, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-gray-600 dark:text-gray-400", children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "mt-0.5 h-4 w-4 shrink-0 text-indigo-500" }),
          benefit
        ] }, i)) })
      ] }),
      job.expires_at && /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
        "Application deadline: ",
        new Date(job.expires_at).toLocaleDateString()
      ] })
    ] })
  ] });
}
export {
  JobShow as default
};
