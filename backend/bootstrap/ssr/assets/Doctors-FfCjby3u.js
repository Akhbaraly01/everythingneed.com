import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { User, Star } from "lucide-react";
import { useState, useEffect } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  useEffect(() => {
    const params = specialtyFilter ? `?specialization=${encodeURIComponent(specialtyFilter)}` : "";
    api.get(`/api/doctors${params}`).then((res) => setDoctors(res.data)).catch(() => setDoctors([])).finally(() => setLoading(false));
  }, [specialtyFilter]);
  const specialties = ["General Practice", "Cardiology", "Dermatology", "Pediatrics", "Orthopedics", "Psychiatry"];
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Find a Doctor", children: [
    /* @__PURE__ */ jsx(Head, { title: "Find a Doctor" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Find a Doctor" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Book consultations with verified healthcare professionals" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => setSpecialtyFilter(""), className: `rounded-full px-4 py-1.5 text-sm font-medium ${!specialtyFilter ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"}`, children: "All" }),
        specialties.map((s) => /* @__PURE__ */ jsx("button", { onClick: () => setSpecialtyFilter(s), className: `rounded-full px-4 py-1.5 text-sm font-medium ${specialtyFilter === s ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"}`, children: s }, s))
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) }) : doctors.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(User, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No doctors found" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: doctors.map((doc) => /* @__PURE__ */ jsxs(
        Link,
        {
          href: `/healthcare/doctors/${doc.id}`,
          className: "group rounded-lg bg-white p-6 shadow transition hover:shadow-lg dark:bg-gray-800",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100", children: doc.image_url ? /* @__PURE__ */ jsx("img", { src: doc.image_url, alt: "", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center text-gray-400", children: /* @__PURE__ */ jsx(User, { className: "h-8 w-8" }) }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white", children: doc.name }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-indigo-600", children: doc.specialty })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-between text-sm text-gray-500", children: [
              doc.years_experience && /* @__PURE__ */ jsxs("span", { children: [
                doc.years_experience,
                " yrs exp"
              ] }),
              doc.rating && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Star, { className: "h-3 w-3 fill-yellow-400 text-yellow-400" }),
                doc.rating
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center justify-between", children: [
              doc.consultation_fee != null && /* @__PURE__ */ jsxs("span", { className: "font-semibold text-gray-900 dark:text-white", children: [
                "$",
                doc.consultation_fee
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-sm text-indigo-600 group-hover:underline", children: "Book →" })
            ] })
          ]
        },
        doc.id
      )) })
    ] })
  ] });
}
export {
  DoctorsPage as default
};
