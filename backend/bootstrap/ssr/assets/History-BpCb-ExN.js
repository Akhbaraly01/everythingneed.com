import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function NeedHistory() {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/need-requests").then((res) => setNeeds(res.data)).catch(() => setNeeds([])).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Need History", children: [
    /* @__PURE__ */ jsx(Head, { title: "Need History" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "My Need Requests" }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : needs.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(FileText, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No requests yet" }),
        /* @__PURE__ */ jsx(Link, { href: "/needs/request", className: "mt-4 inline-block text-blue-600 hover:underline", children: "Create a Request" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: needs.map((n) => /* @__PURE__ */ jsxs(Link, { href: `/needs/requests/${n.id}`, className: "block rounded-lg bg-white p-4 shadow hover:ring-2 hover:ring-blue-500 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "font-semibold dark:text-white", children: n.title }),
          /* @__PURE__ */ jsx("span", { className: `text-xs px-2 py-1 rounded-full ${n.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`, children: n.status })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-400 mt-1", children: [
          "#",
          n.request_number,
          " • ",
          new Date(n.created_at).toLocaleDateString()
        ] })
      ] }, n.id)) })
    ] })
  ] });
}
export {
  NeedHistory as default
};
