import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Head, Link } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { f as formatCurrency, c as formatDate } from "./PushNotificationPrompt-DvDsnr4H.js";
import { toast } from "sonner";
import { useState } from "react";
import { ArrowLeft, Video, MapPin, Stethoscope, XCircle, ClipboardList, FileText, Pill, CalendarClock } from "lucide-react";
import "clsx";
function AppointmentShow({ appointment: a, consultation }) {
  var _a;
  const [busy, setBusy] = useState(false);
  const [joining, setJoining] = useState(false);
  const cancel = async () => {
    if (!confirm("Cancel this appointment?")) return;
    setBusy(true);
    try {
      await api.post(`/api/appointments/${a.id}/cancel`);
      toast.success("Appointment cancelled");
      window.location.reload();
    } catch (err) {
      toast.error(errorMessage(err, "Cancellation failed"));
    } finally {
      setBusy(false);
    }
  };
  const joinVirtual = async () => {
    setJoining(true);
    try {
      const res = await api.post(`/api/appointments/${a.id}/video-room`);
      window.open(res.data.join_url, "_blank", "noopener");
      toast.info(`Opening ${res.data.provider} room…`, { description: "The same link is shared with your clinician." });
    } catch (err) {
      toast.error(errorMessage(err, "Could not open the room"));
    } finally {
      setJoining(false);
    }
  };
  const cancellable = ["pending", "assigned"].includes(a.status);
  const canJoin = a.consultation_type === "virtual" && ["assigned", "in_consultation"].includes(a.status);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Appointment details", children: [
    /* @__PURE__ */ jsx(Head, { title: `Appointment ${a.ticket_number}` }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs(Link, { href: "/healthcare/appointments", className: "mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-rose-600", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back to appointments"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-gray-400", children: a.ticket_number }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-rose-600", children: formatCurrency(Number(a.consultation_fee ?? 0)) })
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "mb-1 text-lg font-bold text-gray-900 dark:text-white", children: a.symptoms }),
        a.description && /* @__PURE__ */ jsx("p", { className: "mb-4 text-sm text-gray-500", children: a.description }),
        /* @__PURE__ */ jsxs("dl", { className: "grid grid-cols-2 gap-x-6 gap-y-3 text-sm", children: [
          /* @__PURE__ */ jsx(Info, { label: "Type", children: a.consultation_type === "virtual" ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Video, { className: "mr-1 inline h-4 w-4 text-sky-500" }),
            "Virtual consultation"
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(MapPin, { className: "mr-1 inline h-4 w-4 text-rose-500" }),
            "In-person visit"
          ] }) }),
          /* @__PURE__ */ jsx(Info, { label: "Status", children: /* @__PURE__ */ jsx("span", { className: "font-medium capitalize", children: a.status.replace("_", " ") }) }),
          /* @__PURE__ */ jsx(Info, { label: "Scheduled", children: a.appointment_date ? `${formatDate(a.appointment_date)}${a.appointment_time ? ` · ${a.appointment_time.slice(0, 5)}` : ""}` : "To be scheduled" }),
          /* @__PURE__ */ jsx(Info, { label: "Booked", children: formatDate(a.created_at) }),
          /* @__PURE__ */ jsx(Info, { label: "Doctor", children: a.doctor ? /* @__PURE__ */ jsxs("span", { className: "flex items-start gap-1.5", children: [
            /* @__PURE__ */ jsx(Stethoscope, { className: "mt-0.5 h-4 w-4 shrink-0 text-rose-500" }),
            /* @__PURE__ */ jsxs("span", { children: [
              a.doctor.full_name,
              a.doctor.specialization ? ` — ${a.doctor.specialization}` : ""
            ] })
          ] }) : "Awaiting assignment" })
        ] }),
        canJoin && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: joinVirtual,
            disabled: joining,
            className: "mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60 sm:w-auto",
            children: [
              /* @__PURE__ */ jsx(Video, { className: "h-4 w-4" }),
              " ",
              joining ? "Preparing room…" : "Join virtual consultation"
            ]
          }
        ),
        cancellable && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: cancel,
            disabled: busy,
            className: `flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 ${canJoin ? "mt-3" : "mt-5"}`,
            children: [
              /* @__PURE__ */ jsx(XCircle, { className: "h-4 w-4" }),
              " Cancel appointment"
            ]
          }
        )
      ] }),
      consultation ? /* @__PURE__ */ jsxs("div", { className: "space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("h2", { className: "flex items-center gap-2 font-bold text-gray-900 dark:text-white", children: [
          /* @__PURE__ */ jsx(ClipboardList, { className: "h-5 w-5" }),
          " Consultation record"
        ] }),
        consultation.diagnosis && /* @__PURE__ */ jsx(Section, { icon: /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }), title: "Diagnosis", children: consultation.diagnosis }),
        consultation.notes && /* @__PURE__ */ jsx(Section, { icon: /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }), title: "Doctor's notes", children: consultation.notes }),
        (((_a = consultation.prescription_items) == null ? void 0 : _a.length) ?? 0) > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: "mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400", children: [
            /* @__PURE__ */ jsx(Pill, { className: "h-4 w-4" }),
            " Prescription"
          ] }),
          /* @__PURE__ */ jsx("ul", { className: "divide-y divide-gray-100 rounded-lg border border-gray-100 dark:divide-gray-700 dark:border-gray-700", children: consultation.prescription_items.map((item, i) => /* @__PURE__ */ jsxs("li", { className: "px-3 py-2.5 text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: item.name }),
            /* @__PURE__ */ jsx("span", { className: "ml-2 text-xs text-gray-500", children: [item.dosage, item.frequency, item.duration].filter(Boolean).join(" · ") })
          ] }, i)) })
        ] }),
        consultation.follow_up_date && /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2.5 text-sm text-blue-800 dark:bg-blue-950/40 dark:text-blue-300", children: [
          /* @__PURE__ */ jsx(CalendarClock, { className: "h-4 w-4" }),
          " Follow-up recommended on ",
          formatDate(consultation.follow_up_date)
        ] })
      ] }) : a.status === "completed" ? /* @__PURE__ */ jsx("p", { className: "rounded-xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-700/40", children: "Consultation record is being finalised." }) : /* @__PURE__ */ jsx("p", { className: "rounded-xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-700/40", children: "The clinical record will appear here after your consultation." })
    ] })
  ] });
}
function Info({ label, children }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("dt", { className: "text-xs uppercase tracking-wide text-gray-400", children: label }),
    /* @__PURE__ */ jsx("dd", { className: "mt-0.5 text-gray-900 dark:text-white", children })
  ] });
}
function Section({ icon, title, children }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("p", { className: "mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400", children: [
      icon,
      " ",
      title
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed text-gray-700 dark:text-gray-300", children })
  ] });
}
export {
  AppointmentShow as default
};
