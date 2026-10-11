import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { Calendar, Clock, Video, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};
function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");
  useEffect(() => {
    api.get("/api/appointments").then((res) => setAppointments(res.data)).catch(() => setAppointments([])).finally(() => setLoading(false));
  }, []);
  const now = /* @__PURE__ */ new Date();
  const filtered = appointments.filter((a) => {
    const d = /* @__PURE__ */ new Date(a.appointment_date + "T" + a.appointment_time);
    return tab === "upcoming" ? d >= now && a.status !== "cancelled" : d < now || a.status === "cancelled" || a.status === "completed";
  });
  return /* @__PURE__ */ jsxs(AppLayout, { title: "My Appointments", children: [
    /* @__PURE__ */ jsx(Head, { title: "My Appointments" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "My Appointments" }),
        /* @__PURE__ */ jsx(Link, { href: "/healthcare/doctors", className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500", children: "Book New" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => setTab("upcoming"), className: `rounded-lg px-4 py-2 text-sm font-medium ${tab === "upcoming" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`, children: "Upcoming" }),
        /* @__PURE__ */ jsx("button", { onClick: () => setTab("past"), className: `rounded-lg px-4 py-2 text-sm font-medium ${tab === "past" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`, children: "Past" })
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) }) : filtered.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Calendar, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsxs("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: [
          "No ",
          tab,
          " appointments"
        ] })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: filtered.map((a) => {
        var _a, _b;
        return /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "font-mono text-sm text-gray-500", children: a.reference }),
                /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[a.status] ?? "bg-gray-100 text-gray-800"}`, children: a.status })
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "mt-1 font-semibold text-gray-900 dark:text-white", children: [
                ((_a = a.doctor) == null ? void 0 : _a.name) ?? "Doctor",
                " — ",
                ((_b = a.doctor) == null ? void 0 : _b.specialty) ?? a.type
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center gap-4 text-sm text-gray-500", children: [
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(Calendar, { className: "h-3 w-3" }),
                  " ",
                  a.appointment_date
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(Clock, { className: "h-3 w-3" }),
                  " ",
                  a.appointment_time
                ] })
              ] }),
              a.reason && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: a.reason })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: a.video_room_id && a.status === "confirmed" && /* @__PURE__ */ jsxs(
              "a",
              {
                href: `/healthcare/virtual?room=${a.video_room_id}`,
                target: "_blank",
                className: "inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500",
                children: [
                  /* @__PURE__ */ jsx(Video, { className: "h-4 w-4" }),
                  " Join Video"
                ]
              }
            ) })
          ] }),
          a.consultation && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700", children: [
            /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-white", children: [
              /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }),
              " Consultation Notes"
            ] }),
            a.consultation.diagnosis && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-gray-600 dark:text-gray-400", children: [
              "Diagnosis: ",
              a.consultation.diagnosis
            ] }),
            a.consultation.notes && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-600 dark:text-gray-400", children: a.consultation.notes }),
            a.consultation.prescription && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-gray-600 dark:text-gray-400", children: [
              "Rx: ",
              a.consultation.prescription
            ] })
          ] })
        ] }, a.id);
      }) })
    ] })
  ] });
}
export {
  AppointmentsPage as default
};
