import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { Beaker } from "lucide-react";
import { useState, useEffect } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function HealthcareLabs() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/health/labs").then((res) => setLabs(res.data)).catch(() => setLabs([])).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Lab Tests", children: [
    /* @__PURE__ */ jsx(Head, { title: "Lab Tests" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Lab Tests & Diagnostics" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Browse and book lab tests" }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : labs.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Beaker, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No lab tests available" }),
        /* @__PURE__ */ jsx(Link, { href: "/healthcare", className: "mt-4 inline-flex text-sm text-indigo-600 hover:underline", children: "Back to Healthcare" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: labs.map((lab) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-gray-900 dark:text-white", children: lab.name }),
        lab.category && /* @__PURE__ */ jsx("p", { className: "text-xs text-indigo-600", children: lab.category }),
        lab.description && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500 line-clamp-2", children: lab.description }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("span", { className: "font-bold text-gray-900 dark:text-white", children: [
            "$",
            lab.price
          ] }),
          lab.turnaround_time && /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-500", children: lab.turnaround_time })
        ] }),
        /* @__PURE__ */ jsx(
          Link,
          {
            href: `/healthcare/labs/${lab.id}/book`,
            className: "mt-3 block w-full rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-500",
            children: "Book Test"
          }
        )
      ] }, lab.id)) })
    ] })
  ] });
}
export {
  HealthcareLabs as default
};
