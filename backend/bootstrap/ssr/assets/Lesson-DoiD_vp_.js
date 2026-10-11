import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { PlayCircle, CheckCircle, ArrowRight } from "lucide-react";
import { useState } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function sanitizeHtml(html) {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "").replace(/\son\w+\s*=\s*"[^"]*"/gi, "").replace(/\son\w+\s*=\s*'[^']*'/gi, "").replace(/\son\w+\s*=\s*[^\s>]+/gi, "").replace(/javascript\s*:/gi, "");
}
function CourseLesson({ course, lesson, nextLessonId, prevLessonId, progress, is_enrolled }) {
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const markComplete = async () => {
    setCompleting(true);
    try {
      await api.post(`/api/learn/courses/${course.id}/lessons/${lesson.id}/complete`);
      setCompleted(true);
    } catch {
    }
    setCompleting(false);
  };
  return /* @__PURE__ */ jsxs(AppLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: `${lesson.title} - ${course.title}` }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx(Link, { href: `/learn/${course.id}`, className: "text-sm text-gray-500 hover:text-gray-700", children: "← Back to course" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: lesson.title }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
            "by ",
            course.instructor ?? "Instructor"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm text-gray-500", children: [
          "Lesson ",
          lesson.order,
          " of ",
          course.total_lessons ?? "?"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "rounded-full bg-gray-200 h-2 dark:bg-gray-700", children: /* @__PURE__ */ jsx("div", { className: "bg-indigo-600 h-2 rounded-full transition-all", style: { width: `${progress}%` } }) }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500", children: [
        Math.round(progress),
        "% complete"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: lesson.video_url ? /* @__PURE__ */ jsx("div", { className: "aspect-video", children: /* @__PURE__ */ jsx("iframe", { src: lesson.video_url, className: "h-full w-full rounded-lg", allowFullScreen: true }) }) : lesson.content ? /* @__PURE__ */ jsx("div", { className: "prose dark:prose-invert max-w-none", dangerouslySetInnerHTML: { __html: sanitizeHtml(lesson.content) } }) : /* @__PURE__ */ jsx("div", { className: "flex h-48 items-center justify-center text-gray-400", children: /* @__PURE__ */ jsx(PlayCircle, { className: "h-12 w-12" }) }) }),
      lesson.description && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-gray-900 dark:text-white", children: "About this lesson" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-600 dark:text-gray-400", children: lesson.description })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        prevLessonId ? /* @__PURE__ */ jsx(
          Link,
          {
            href: `/learn/courses/${course.id}/lessons/${prevLessonId}`,
            className: "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50",
            children: "Previous Lesson"
          }
        ) : /* @__PURE__ */ jsx("div", {}),
        is_enrolled && (completed ? /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-green-600", children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "h-5 w-5" }),
          " Completed"
        ] }) : /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: markComplete,
            disabled: completing,
            className: "flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50",
            children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "h-4 w-4" }),
              " ",
              completing ? "Saving..." : "Mark Complete"
            ]
          }
        )),
        nextLessonId ? /* @__PURE__ */ jsxs(
          Link,
          {
            href: `/learn/courses/${course.id}/lessons/${nextLessonId}`,
            className: "flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500",
            children: [
              "Next Lesson ",
              /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
            ]
          }
        ) : is_enrolled ? /* @__PURE__ */ jsxs(
          Link,
          {
            href: `/learn/courses/${course.id}/quiz`,
            className: "flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-500",
            children: [
              "Take Quiz ",
              /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
            ]
          }
        ) : /* @__PURE__ */ jsx("div", {})
      ] })
    ] })
  ] });
}
export {
  CourseLesson as default
};
