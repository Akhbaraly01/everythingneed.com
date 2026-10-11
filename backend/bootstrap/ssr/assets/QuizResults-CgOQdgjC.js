import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { BarChart3, CheckCircle, XCircle } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function QuizResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/learn/quiz-results").then((res) => setResults(res.data)).catch(() => setResults([])).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Quiz Results", children: [
    /* @__PURE__ */ jsx(Head, { title: "Quiz Results" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Quiz Results" }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : results.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(BarChart3, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No quiz results yet" }),
        /* @__PURE__ */ jsx(Link, { href: "/learn", className: "mt-4 inline-block text-blue-600 hover:underline", children: "Browse Courses" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: results.map((r) => /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900 dark:text-white", children: r.course_title }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: new Date(r.completed_at).toLocaleDateString() })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          r.passed ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400", children: [
            /* @__PURE__ */ jsx(CheckCircle, { className: "h-3 w-3" }),
            " Passed"
          ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400", children: [
            /* @__PURE__ */ jsx(XCircle, { className: "h-3 w-3" }),
            " Failed"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold text-gray-900 dark:text-white", children: [
            r.score,
            "/",
            r.total_questions
          ] })
        ] })
      ] }) }, r.id)) })
    ] })
  ] });
}
export {
  QuizResults as default
};
