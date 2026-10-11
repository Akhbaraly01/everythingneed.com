import { jsx, jsxs } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { User, Star, Briefcase, Clock } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function WorkerProfile({ worker_id }) {
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (worker_id) {
      api.get(`/api/building-services/workers/${worker_id}`).then((res) => setWorker(res.data)).catch(() => {
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [worker_id]);
  if (loading) return /* @__PURE__ */ jsx(AppLayout, { title: "Worker Profile", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." }) });
  if (!worker) return /* @__PURE__ */ jsx(AppLayout, { title: "Worker Profile", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-red-500", children: "Worker not found" }) });
  return /* @__PURE__ */ jsxs(AppLayout, { title: worker.full_name, children: [
    /* @__PURE__ */ jsx(Head, { title: worker.full_name }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-8 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
          /* @__PURE__ */ jsx("div", { className: "h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center", children: /* @__PURE__ */ jsx(User, { className: "h-10 w-10 text-blue-600" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: worker.full_name }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-500 capitalize", children: worker.worker_type }),
            /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center gap-4 text-sm", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-yellow-500", children: [
                /* @__PURE__ */ jsx(Star, { className: "h-4 w-4" }),
                " ",
                worker.rating || "New"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-gray-500", children: [
                /* @__PURE__ */ jsx(Briefcase, { className: "h-4 w-4" }),
                " ",
                worker.completed_jobs,
                " jobs"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-gray-500", children: [
                /* @__PURE__ */ jsx(Clock, { className: "h-4 w-4" }),
                " ",
                worker.experience_years,
                "yr exp"
              ] })
            ] })
          ] })
        ] }),
        worker.bio && /* @__PURE__ */ jsx("p", { className: "mt-6 text-gray-600 dark:text-gray-400", children: worker.bio }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center gap-4", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold text-green-600", children: [
            "$",
            worker.hourly_rate,
            "/hr"
          ] }),
          /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-1 text-xs font-medium ${worker.is_available ? "bg-green-100 text-green-800 dark:bg-green-900/30" : "bg-red-100 text-red-800 dark:bg-red-900/30"}`, children: worker.is_available ? "Available" : "Busy" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        Link,
        {
          href: `/building-services/book?worker=${worker.id}`,
          className: "block w-full rounded-lg bg-blue-600 px-4 py-3 text-center text-white hover:bg-blue-700",
          children: "Book This Worker"
        }
      )
    ] })
  ] });
}
export {
  WorkerProfile as default
};
