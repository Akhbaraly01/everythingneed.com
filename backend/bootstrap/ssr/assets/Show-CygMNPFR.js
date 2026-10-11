import { jsx, jsxs } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { ArrowLeft, User, Star, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function ExpertProfile({ expert_id }) {
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState({});
  useEffect(() => {
    api.get(`/api/experts/${expert_id}`).then((res) => setExpert(res.data)).catch(() => setExpert(null)).finally(() => setLoading(false));
    api.get(`/api/experts/${expert_id}/availability`).then((res) => setAvailability(res.data ?? {})).catch(() => {
    });
  }, [expert_id]);
  if (loading) return /* @__PURE__ */ jsx(AppLayout, { title: "Expert Profile", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." }) });
  if (!expert) return /* @__PURE__ */ jsx(AppLayout, { title: "Expert Profile", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-red-500", children: "Not found" }) });
  return /* @__PURE__ */ jsxs(AppLayout, { title: expert.name, children: [
    /* @__PURE__ */ jsx(Head, { title: expert.name }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsxs(Link, { href: "/experts", className: "inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back to Experts"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
          /* @__PURE__ */ jsx("div", { className: "h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gray-100", children: expert.image_url ? /* @__PURE__ */ jsx("img", { src: expert.image_url, alt: "", className: "h-full w-full rounded-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center text-gray-400", children: /* @__PURE__ */ jsx(User, { className: "h-12 w-12" }) }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: expert.name }),
            /* @__PURE__ */ jsx("p", { className: "text-indigo-600 font-medium", children: expert.specialty }),
            expert.years_experience && /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
              expert.years_experience,
              " years experience"
            ] }),
            expert.rating && /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-1 text-sm text-yellow-600", children: [
              /* @__PURE__ */ jsx(Star, { className: "h-4 w-4 fill-yellow-400" }),
              " ",
              expert.rating,
              " rating"
            ] })
          ] })
        ] }),
        expert.bio && /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm text-gray-600 dark:text-gray-400", children: expert.bio }),
        expert.hourly_rate != null && /* @__PURE__ */ jsxs("p", { className: "mt-2 text-lg font-bold text-gray-900 dark:text-white", children: [
          "$",
          expert.hourly_rate,
          "/hour"
        ] }),
        /* @__PURE__ */ jsx("button", { className: "mt-4 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500", children: "Book Consultation" })
      ] }),
      Object.keys(availability).length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("h2", { className: "font-semibold text-gray-900 dark:text-white flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Clock, { className: "h-5 w-5" }),
          " Availability"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 grid grid-cols-7 gap-2", children: Object.entries(availability).slice(0, 14).map(([date, slots]) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-center text-gray-500 mb-1", children: (/* @__PURE__ */ new Date(date + "T00:00:00")).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) }),
          /* @__PURE__ */ jsx("div", { className: "space-y-1", children: slots.slice(0, 3).map((s) => /* @__PURE__ */ jsx("p", { className: "text-[10px] bg-green-50 text-green-700 text-center rounded py-0.5 dark:bg-green-900/20 dark:text-green-400", children: s }, s)) })
        ] }, date)) })
      ] })
    ] })
  ] });
}
export {
  ExpertProfile as default
};
