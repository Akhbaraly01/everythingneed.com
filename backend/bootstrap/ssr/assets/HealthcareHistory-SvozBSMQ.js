import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { Stethoscope, Calendar, Pill } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function HealthcareHistory() {
  const [tickets, setTickets] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("appointments");
  useEffect(() => {
    Promise.all([
      api.get("/api/health/tickets").catch(() => ({ data: [] })),
      api.get("/api/health/consultations").catch(() => ({ data: [] }))
    ]).then(([t, c]) => {
      setTickets(t.data || []);
      setConsultations(c.data || []);
    }).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Healthcare History", children: [
    /* @__PURE__ */ jsx(Head, { title: "Healthcare History" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Stethoscope, { className: "h-6 w-6" }),
        " Healthcare History"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs("button", { onClick: () => setTab("appointments"), className: `px-4 py-2 rounded-lg text-sm ${tab === "appointments" ? "bg-blue-600 text-white" : "bg-white border dark:bg-gray-800 dark:border-gray-600"}`, children: [
          "Appointments (",
          tickets.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => setTab("prescriptions"), className: `px-4 py-2 rounded-lg text-sm ${tab === "prescriptions" ? "bg-blue-600 text-white" : "bg-white border dark:bg-gray-800 dark:border-gray-600"}`, children: [
          "Prescriptions (",
          consultations.length,
          ")"
        ] })
      ] }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : tab === "appointments" ? tickets.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Calendar, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No appointments yet" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: tickets.map((t) => {
        var _a, _b;
        return /* @__PURE__ */ jsxs(Link, { href: `/healthcare/appointments/${t.id}`, className: "block rounded-lg bg-white p-4 shadow hover:ring-2 hover:ring-blue-500 dark:bg-gray-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "font-semibold dark:text-white", children: ((_a = t.doctor) == null ? void 0 : _a.full_name) || "Doctor" }),
            /* @__PURE__ */ jsx("span", { className: `text-xs px-2 py-1 rounded-full ${t.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`, children: t.status })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: (_b = t.symptoms) == null ? void 0 : _b.slice(0, 80) }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 mt-1", children: t.appointment_date || new Date(t.created_at).toLocaleDateString() })
        ] }, t.id);
      }) }) : consultations.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Pill, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No prescriptions yet" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: consultations.map((c) => {
        var _a;
        return /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("p", { className: "font-semibold dark:text-white", children: c.diagnosis || "Consultation" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: (_a = c.notes) == null ? void 0 : _a.slice(0, 100) })
        ] }, c.id);
      }) })
    ] })
  ] });
}
export {
  HealthcareHistory as default
};
