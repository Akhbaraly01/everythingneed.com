import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { Users, Star, Briefcase } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function AgricultureWorkers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/building-services/workers", { params: { type: "agriculture" } }).then((res) => setWorkers(res.data)).catch(() => setWorkers([])).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Agriculture Workers", children: [
    /* @__PURE__ */ jsx(Head, { title: "Agriculture Workers" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Users, { className: "h-6 w-6 text-green-600" }),
        " Agriculture Workers"
      ] }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : workers.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Users, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No agriculture workers available" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: workers.map((w) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold dark:text-white", children: w.full_name }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 capitalize", children: w.worker_type }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 flex gap-3 text-sm", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-yellow-500", children: [
            /* @__PURE__ */ jsx(Star, { className: "h-3 w-3" }),
            w.rating || "New"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-gray-500", children: [
            /* @__PURE__ */ jsx(Briefcase, { className: "h-3 w-3" }),
            w.completed_jobs,
            " jobs"
          ] })
        ] }),
        /* @__PURE__ */ jsx("span", { className: `mt-2 inline-block rounded-full px-2 py-1 text-xs ${w.is_available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`, children: w.is_available ? "Available" : "Busy" })
      ] }, w.id)) })
    ] })
  ] });
}
export {
  AgricultureWorkers as default
};
