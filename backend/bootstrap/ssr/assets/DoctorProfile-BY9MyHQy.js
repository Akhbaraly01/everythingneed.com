import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Stethoscope, Star, Clock } from "lucide-react";
import "react";
import "./api-Dp2ndEHF.js";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function DoctorProfile({ doctor, availability }) {
  return /* @__PURE__ */ jsxs(AppLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: `Dr. ${doctor.name}` }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsxs(Link, { href: "/healthcare/doctors", className: "inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back to doctors"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
          /* @__PURE__ */ jsx("div", { className: "h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gray-100", children: doctor.image_url ? /* @__PURE__ */ jsx("img", { src: doctor.image_url, alt: "", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center text-gray-400", children: /* @__PURE__ */ jsx(Stethoscope, { className: "h-12 w-12" }) }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: [
              "Dr. ",
              doctor.name
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-indigo-600 font-medium", children: doctor.specialty }),
            doctor.years_experience && /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
              doctor.years_experience,
              " years experience"
            ] }),
            doctor.rating && /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-1 text-sm text-yellow-600", children: [
              /* @__PURE__ */ jsx(Star, { className: "h-4 w-4 fill-yellow-400" }),
              " ",
              doctor.rating,
              " rating"
            ] })
          ] })
        ] }),
        doctor.bio && /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm text-gray-600 dark:text-gray-400", children: doctor.bio }),
        /* @__PURE__ */ jsx(Link, { href: `/healthcare/doctors/${doctor.id}`, className: "mt-4 inline-flex rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500", children: "Book Appointment" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("h2", { className: "font-semibold text-gray-900 dark:text-white flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Clock, { className: "h-5 w-5" }),
          " Available Time Slots"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 grid grid-cols-7 gap-2", children: Object.entries(availability).slice(0, 14).map(([date, slots]) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-center text-gray-500 mb-1", children: (/* @__PURE__ */ new Date(date + "T00:00:00")).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) }),
          /* @__PURE__ */ jsx("div", { className: "space-y-1", children: slots.filter((s) => s.available).slice(0, 3).map((s) => /* @__PURE__ */ jsx("p", { className: "text-[10px] bg-green-50 text-green-700 text-center rounded py-0.5 dark:bg-green-900/20 dark:text-green-400", children: s.time }, s.time)) })
        ] }, date)) })
      ] })
    ] })
  ] });
}
export {
  DoctorProfile as default
};
