import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { CheckCircle, XCircle, Award, Clock } from "lucide-react";
import { useState } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function CourseQuiz({ course, quiz, questions }) {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  if (!quiz) {
    return /* @__PURE__ */ jsxs(AppLayout, { children: [
      /* @__PURE__ */ jsx(Head, { title: `Quiz - ${course.title}` }),
      /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-2xl space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-gray-900 dark:text-white", children: "No quiz yet" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-500", children: "This course does not have a quiz. Check back later." })
      ] }) })
    ] });
  }
  const handleSelect = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };
  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(
        `/api/quizzes/${quiz.id}/submit`,
        { answers }
      );
      const graded = res.data ?? { score: 0, passed: false, total: questions.length };
      setResults({
        score: graded.score,
        passed: graded.passed,
        correct_count: graded.score,
        total: graded.total,
        detail: []
      });
    } catch (e) {
      alert(errorMessage(e, "Failed to submit"));
    }
    setSubmitting(false);
  };
  if (results) {
    return /* @__PURE__ */ jsxs(AppLayout, { children: [
      /* @__PURE__ */ jsx(Head, { title: "Quiz Results" }),
      /* @__PURE__ */ jsx("div", { className: "max-w-2xl mx-auto space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800", children: [
        results.passed ? /* @__PURE__ */ jsx(CheckCircle, { className: "mx-auto h-16 w-16 text-green-500" }) : /* @__PURE__ */ jsx(XCircle, { className: "mx-auto h-16 w-16 text-red-500" }),
        /* @__PURE__ */ jsx("h2", { className: "mt-4 text-2xl font-bold text-gray-900 dark:text-white", children: results.passed ? "Congratulations!" : "Keep Practicing" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-2 text-gray-500", children: [
          "You scored ",
          results.correct_count,
          "/",
          results.total,
          " (",
          results.score,
          "%)"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-400", children: [
          "Passing score: ",
          quiz.passing_score,
          "%"
        ] }),
        results.passed && /* @__PURE__ */ jsxs(
          "a",
          {
            href: "/learn/certificates",
            className: "mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-500",
            children: [
              /* @__PURE__ */ jsx(Award, { className: "h-5 w-5" }),
              " View Certificates"
            ]
          }
        )
      ] }) })
    ] });
  }
  return /* @__PURE__ */ jsxs(AppLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: `${quiz.title} - ${course.title}` }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: quiz.title }),
        quiz.description && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: quiz.description }),
        quiz.time_limit_minutes && /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-1 text-sm text-gray-500", children: [
          /* @__PURE__ */ jsx(Clock, { className: "h-4 w-4" }),
          " ",
          quiz.time_limit_minutes,
          " minutes"
        ] })
      ] }),
      questions.map((q, idx) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("p", { className: "font-medium text-gray-900 dark:text-white", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-indigo-600", children: [
            "Q",
            idx + 1,
            "."
          ] }),
          " ",
          q.question
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-3 space-y-2", children: q.options.map((opt) => /* @__PURE__ */ jsxs("label", { className: `flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${answers[q.id] === opt ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-gray-200 dark:border-gray-700"}`, children: [
          /* @__PURE__ */ jsx("input", { type: "radio", name: q.id, value: opt, checked: answers[q.id] === opt, onChange: () => handleSelect(q.id, opt), className: "text-indigo-600" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300", children: opt })
        ] }, opt)) })
      ] }, q.id)),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleSubmit,
          disabled: submitting,
          className: "w-full rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50",
          children: submitting ? "Submitting..." : "Submit Quiz"
        }
      )
    ] })
  ] });
}
export {
  CourseQuiz as default
};
