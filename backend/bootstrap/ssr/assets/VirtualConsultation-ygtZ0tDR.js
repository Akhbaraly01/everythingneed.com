import { jsx, jsxs } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, router } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { Video, User, ArrowRight } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function VirtualConsultation() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [form, setForm] = useState({ symptoms: "", description: "", preferred_date: "", preferred_time: "" });
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    api.get("/api/health/doctors", { params: { virtual: true } }).then((res) => setDoctors(res.data)).catch(() => setDoctors([])).finally(() => setLoading(false));
  }, []);
  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    setSubmitting(true);
    try {
      const res = await api.post("/api/health/tickets", {
        doctor_id: selectedDoctor.id,
        consultation_type: "virtual",
        ...form
      });
      router.visit(`/healthcare/booking-confirmation?id=${res.data.id}`);
    } catch {
      setSubmitting(false);
    }
  };
  if (loading) return /* @__PURE__ */ jsx(AppLayout, { title: "Virtual Consultation", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." }) });
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Virtual Consultation", children: [
    /* @__PURE__ */ jsx(Head, { title: "Virtual Consultation" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(Video, { className: "h-8 w-8 text-blue-600" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Virtual Consultation" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Connect with a doctor from anywhere" })
        ] })
      ] }),
      !selectedDoctor ? /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: [
        doctors.map((d) => /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setSelectedDoctor(d),
            className: "rounded-lg bg-white p-4 shadow text-left hover:ring-2 hover:ring-blue-500 dark:bg-gray-800",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center", children: /* @__PURE__ */ jsx(User, { className: "h-6 w-6 text-blue-600" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900 dark:text-white", children: d.full_name }),
                  /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: d.specialization })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center justify-between text-sm", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-yellow-500", children: [
                  "★ ",
                  d.rating || "New"
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "font-semibold text-green-600", children: [
                  "$",
                  d.virtual_fee
                ] })
              ] })
            ]
          },
          d.id
        )),
        doctors.length === 0 && /* @__PURE__ */ jsxs("div", { className: "col-span-full rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx(Video, { className: "mx-auto h-12 w-12 text-gray-400" }),
          /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No virtual consultation doctors available" })
        ] })
      ] }) : /* @__PURE__ */ jsxs("form", { onSubmit: handleBook, className: "mx-auto max-w-2xl space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white", children: "Selected Doctor" }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setSelectedDoctor(null), className: "text-sm text-blue-600 hover:underline", children: "Change" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center", children: /* @__PURE__ */ jsx(User, { className: "h-6 w-6 text-blue-600" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900 dark:text-white", children: selectedDoctor.full_name }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
                selectedDoctor.specialization,
                " • $",
                selectedDoctor.virtual_fee
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white", children: "Consultation Details" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Symptoms" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                required: true,
                value: form.symptoms,
                onChange: (e) => setForm({ ...form, symptoms: e.target.value }),
                className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700",
                placeholder: "Brief description of symptoms"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Additional Details" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: form.description,
                onChange: (e) => setForm({ ...form, description: e.target.value }),
                rows: 3,
                className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Preferred Date" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "date",
                  required: true,
                  value: form.preferred_date,
                  onChange: (e) => setForm({ ...form, preferred_date: e.target.value }),
                  className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Preferred Time" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "time",
                  required: true,
                  value: form.preferred_time,
                  onChange: (e) => setForm({ ...form, preferred_time: e.target.value }),
                  className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              disabled: submitting,
              className: "w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2",
              children: [
                submitting ? "Booking..." : "Book Virtual Consultation",
                " ",
                /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
              ]
            }
          )
        ] })
      ] })
    ] })
  ] });
}
export {
  VirtualConsultation as default
};
