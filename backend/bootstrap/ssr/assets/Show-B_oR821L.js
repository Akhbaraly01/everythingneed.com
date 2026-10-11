import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Head, Link } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { g as getInitials, f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { ArrowLeft, BadgeCheck, Star, MapPin, Send, Clock, GraduationCap, FolderOpen, Briefcase } from "lucide-react";
import "react";
import "./api-Dp2ndEHF.js";
import "clsx";
import "sonner";
function JobSeekerShow({ worker }) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  return /* @__PURE__ */ jsxs(AppLayout, { title: ((_a = worker.user) == null ? void 0 : _a.name) ?? "Worker", children: [
    /* @__PURE__ */ jsx(Head, { title: `${(_b = worker.user) == null ? void 0 : _b.name} — ${worker.category}` }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs(Link, { href: "/job-seekers", className: "mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back to directory"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-8 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("span", { className: "flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700", children: getInitials(((_c = worker.user) == null ? void 0 : _c.name) ?? "W") }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-gray-900 dark:text-white", children: (_d = worker.user) == null ? void 0 : _d.name }),
                worker.is_verified && /* @__PURE__ */ jsx(BadgeCheck, { className: "h-5 w-5 text-blue-500" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-gray-600 dark:text-gray-300", children: worker.headline }),
              /* @__PURE__ */ jsxs("div", { className: "mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500", children: [
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(Star, { className: "h-4 w-4 fill-yellow-400 text-yellow-400" }),
                  /* @__PURE__ */ jsx("strong", { children: Number(worker.rating_avg).toFixed(1) }),
                  " (",
                  worker.rating_count,
                  " ratings)"
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4" }),
                  [worker.city, worker.country].filter(Boolean).join(", ") || "Remote"
                ] }),
                /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${worker.availability === "available" ? "bg-green-100 text-green-800" : worker.availability === "busy" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-700"}`, children: worker.availability })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: `/job-seekers/request/${worker.id}`,
              className: "flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700",
              children: [
                /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" }),
                " Request this worker"
              ]
            }
          )
        ] }),
        worker.bio && /* @__PURE__ */ jsx("p", { className: "mt-4 border-t border-gray-100 pt-4 text-sm leading-relaxed text-gray-600 dark:border-gray-700 dark:text-gray-300", children: worker.bio }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3", children: [
          /* @__PURE__ */ jsx(Stat, { label: "Hourly rate", value: worker.hourly_rate ? `${formatCurrency(worker.hourly_rate)}/hr` : "On request" }),
          /* @__PURE__ */ jsx(Stat, { label: "Daily rate", value: worker.daily_rate ? `${formatCurrency(worker.daily_rate)}/day` : "On request" }),
          /* @__PURE__ */ jsx(Stat, { label: "Jobs completed", value: String(worker.completed_jobs), icon: /* @__PURE__ */ jsx(Clock, { className: "inline h-4 w-4 text-gray-400" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-6 lg:col-span-2", children: [
          (((_e = worker.skills) == null ? void 0 : _e.length) ?? 0) > 0 && /* @__PURE__ */ jsx(Section, { title: "Skills", children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: worker.skills.map((s) => /* @__PURE__ */ jsxs("span", { className: "rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-300", children: [
            s.name,
            s.level ? ` · ${s.level}` : ""
          ] }, s.name)) }) }),
          (((_f = worker.experience) == null ? void 0 : _f.length) ?? 0) > 0 && /* @__PURE__ */ jsx(Section, { title: "Experience", children: /* @__PURE__ */ jsx("ol", { className: "space-y-4", children: worker.experience.map((x, i) => /* @__PURE__ */ jsxs("li", { className: "relative border-l-2 border-indigo-200 pl-4 dark:border-indigo-800", children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900 dark:text-white", children: x.title }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
              x.company,
              x.from ? ` · ${x.from}${x.to ? ` – ${x.to}` : " – present"}` : ""
            ] }),
            x.description && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-600 dark:text-gray-300", children: x.description })
          ] }, i)) }) }),
          (((_g = worker.education) == null ? void 0 : _g.length) ?? 0) > 0 && /* @__PURE__ */ jsx(Section, { title: /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(GraduationCap, { className: "mr-2 inline h-4 w-4" }),
            "Education"
          ] }), children: /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: worker.education.map((e, i) => /* @__PURE__ */ jsxs("li", { className: "text-sm text-gray-700 dark:text-gray-300", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: e.degree }),
            " — ",
            e.institution,
            e.year ? `, ${e.year}` : ""
          ] }, i)) }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          (((_h = worker.portfolio) == null ? void 0 : _h.length) ?? 0) > 0 && /* @__PURE__ */ jsx(Section, { title: /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(FolderOpen, { className: "mr-2 inline h-4 w-4" }),
            "Portfolio"
          ] }), children: /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: worker.portfolio.map((p, i) => /* @__PURE__ */ jsxs("li", { className: "rounded-lg border border-gray-200 p-3 dark:border-gray-600", children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: p.title }),
            p.description && /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: p.description })
          ] }, i)) }) }),
          /* @__PURE__ */ jsx(Section, { title: "Hiring safety", children: /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm text-gray-600 dark:text-gray-300", children: [
            /* @__PURE__ */ jsx("li", { children: "• Agree scope and rate before work starts." }),
            /* @__PURE__ */ jsx("li", { children: "• Payment is recorded when you mark the request paid." }),
            /* @__PURE__ */ jsx("li", { children: "• Rate the worker only after completion — ratings are final." }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Briefcase, { className: "h-4 w-4 text-gray-400" }),
              " ",
              worker.completed_jobs,
              " completed jobs on record"
            ] })
          ] }) })
        ] })
      ] })
    ] })
  ] });
}
function Stat({ label, value, icon }) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50", children: [
    /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500", children: [
      icon,
      " ",
      label
    ] }),
    /* @__PURE__ */ jsx("p", { className: "font-bold text-gray-900 dark:text-white", children: value })
  ] });
}
function Section({ title, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800", children: [
    /* @__PURE__ */ jsx("h2", { className: "mb-3 font-semibold text-gray-900 dark:text-white", children: title }),
    children
  ] });
}
export {
  JobSeekerShow as default
};
