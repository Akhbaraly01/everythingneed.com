import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { Stethoscope } from "lucide-react";
import { useState, useEffect } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function AdminHealthcare() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/doctors").then((res) => setDoctors(res.data)).catch(() => setDoctors([])).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Healthcare Admin", children: [
    /* @__PURE__ */ jsx(Head, { title: "Healthcare Admin" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Healthcare Management" }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : doctors.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Stethoscope, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No doctors registered" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Doctor" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Specialty" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Appointments" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y dark:divide-gray-700", children: doctors.map((d) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-3", children: [
            /* @__PURE__ */ jsxs("p", { className: "font-medium text-gray-900 dark:text-white", children: [
              "Dr. ",
              d.name
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: d.user_email })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-sm text-indigo-600", children: d.specialty }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${d.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`, children: d.status }) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: d.total_appointments })
        ] }, d.id)) })
      ] }) })
    ] })
  ] });
}
export {
  AdminHealthcare as default
};
