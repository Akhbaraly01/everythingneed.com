import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { ArrowLeft, Stethoscope } from "lucide-react";
import { useState, useEffect } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function HealthcareSpecialty({ specialty }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get(`/api/doctors?specialization=${encodeURIComponent(specialty)}`).then((res) => setDoctors(res.data)).catch(() => setDoctors([])).finally(() => setLoading(false));
  }, [specialty]);
  return /* @__PURE__ */ jsxs(AppLayout, { title: specialty, children: [
    /* @__PURE__ */ jsx(Head, { title: specialty }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs(Link, { href: "/healthcare", className: "inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back to Healthcare"
      ] }),
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white capitalize", children: [
        specialty,
        " Specialists"
      ] }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : doctors.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Stethoscope, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No doctors found for this specialty." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: doctors.map((doc) => /* @__PURE__ */ jsxs(
        Link,
        {
          href: `/healthcare/doctors/${doc.id}/profile`,
          className: "group rounded-lg bg-white p-4 shadow transition hover:shadow-md dark:bg-gray-800",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100", children: doc.image_url && /* @__PURE__ */ jsx("img", { src: doc.image_url, alt: "", className: "h-full w-full rounded-full object-cover" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("p", { className: "font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white", children: [
                  "Dr. ",
                  doc.name
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-indigo-600", children: doc.specialty })
              ] })
            ] }),
            doc.rating && /* @__PURE__ */ jsxs("p", { className: "mt-2 text-xs text-yellow-600", children: [
              "Rating: ",
              doc.rating
            ] }),
            /* @__PURE__ */ jsx("span", { className: "mt-2 inline-block text-sm text-indigo-600", children: "Book →" })
          ]
        },
        doc.id
      )) })
    ] })
  ] });
}
export {
  HealthcareSpecialty as default
};
