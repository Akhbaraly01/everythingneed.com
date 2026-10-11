import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link, router } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import "clsx";
import "sonner";
function DoctorBooking({ doctor, availability }) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const dates = Object.keys(availability).sort();
  const slots = selectedDate ? availability[selectedDate] ?? [] : [];
  const handleBook = async () => {
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);
    try {
      await api.post("/api/appointments", {
        doctor_id: doctor.id,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        reason: reason || void 0,
        type: "consultation"
      });
      router.visit("/healthcare/appointments");
    } catch (e) {
      alert(errorMessage(e, "Failed to book"));
    }
    setSubmitting(false);
  };
  return /* @__PURE__ */ jsxs(AppLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: `Book ${doctor.name}` }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-3xl space-y-6", children: [
      /* @__PURE__ */ jsxs(Link, { href: "/healthcare/doctors", className: "inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back to doctors"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-100", children: doctor.image_url ? /* @__PURE__ */ jsx("img", { src: doctor.image_url, alt: "", className: "h-full w-full object-cover" }) : null }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: doctor.name }),
            /* @__PURE__ */ jsx("p", { className: "text-indigo-600", children: doctor.specialty }),
            doctor.years_experience && /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
              doctor.years_experience,
              " years experience"
            ] })
          ] })
        ] }),
        doctor.bio && /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm text-gray-600 dark:text-gray-400", children: doctor.bio }),
        doctor.consultation_fee != null && /* @__PURE__ */ jsxs("p", { className: "mt-4 text-lg font-bold text-gray-900 dark:text-white", children: [
          "Consultation fee: ",
          formatCurrency(doctor.consultation_fee)
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Select Date & Time" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: "Reason for visit" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: reason,
              onChange: (e) => setReason(e.target.value),
              rows: 2,
              placeholder: "Optional...",
              className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 grid grid-cols-7 gap-2", children: dates.map((d) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              setSelectedDate(d);
              setSelectedTime("");
            },
            className: `rounded-lg p-2 text-center text-xs font-medium ${selectedDate === d ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700"}`,
            children: (/* @__PURE__ */ new Date(d + "T00:00:00")).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
          },
          d
        )) }),
        selectedDate && /* @__PURE__ */ jsxs("div", { className: "mt-4 grid grid-cols-4 gap-2", children: [
          slots.filter((s) => s.available).map((slot) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setSelectedTime(slot.time),
              className: `rounded-lg px-3 py-2 text-sm font-medium ${selectedTime === slot.time ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700"}`,
              children: slot.time
            },
            slot.time
          )),
          slots.filter((s) => s.available).length === 0 && /* @__PURE__ */ jsx("p", { className: "col-span-4 text-sm text-gray-500", children: "No available slots" })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleBook,
            disabled: submitting || !selectedDate || !selectedTime,
            className: "mt-6 w-full rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50",
            children: submitting ? "Booking..." : "Book Appointment"
          }
        )
      ] })
    ] })
  ] });
}
export {
  DoctorBooking as default
};
