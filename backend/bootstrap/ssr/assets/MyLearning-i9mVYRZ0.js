import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { BookOpen, Award } from "lucide-react";
import { useState, useEffect } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function mapEnrollment(row) {
  const course = row.course ?? {};
  return {
    id: row.course_id,
    course_id: row.course_id,
    title: course.title ?? "Course",
    instructor: course.instructor_name ?? course.instructor,
    image_url: course.thumbnail_url ?? course.image_url,
    enrolled_at: row.enrolled_at ?? row.created_at ?? "",
    progress: Number(row.progress ?? 0),
    completed_lessons: Math.round(Number(row.progress ?? 0) / 100 * Number(course.lessons_count ?? 0)),
    total_lessons: Number(course.lessons_count ?? 0)
  };
}
function MyLearning() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/my-courses").then((res) => setCourses((res.data ?? []).map(mapEnrollment))).catch(() => setCourses([])).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "My Learning", children: [
    /* @__PURE__ */ jsx(Head, { title: "My Learning" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "My Learning" }),
        /* @__PURE__ */ jsx(Link, { href: "/learn", className: "text-sm text-indigo-600 hover:text-indigo-500", children: "Browse more courses →" })
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) }) : courses.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(BookOpen, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No courses yet" }),
        /* @__PURE__ */ jsx(Link, { href: "/learn", className: "mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500", children: "Browse Courses" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: courses.map((course) => /* @__PURE__ */ jsxs(
        Link,
        {
          href: `/learn/${course.course_id}`,
          className: "group overflow-hidden rounded-lg bg-white shadow transition hover:shadow-lg dark:bg-gray-800",
          children: [
            /* @__PURE__ */ jsx("div", { className: "h-40 bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center", children: course.image_url ? /* @__PURE__ */ jsx("img", { src: course.image_url, alt: "", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx(BookOpen, { className: "h-12 w-12 text-indigo-400" }) }),
            /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white", children: course.title }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: course.instructor }),
              /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-gray-500", children: [
                    course.completed_lessons,
                    "/",
                    course.total_lessons,
                    " lessons"
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "font-medium text-indigo-600", children: [
                    course.progress,
                    "%"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "mt-1 rounded-full bg-gray-200 h-1.5 dark:bg-gray-700", children: /* @__PURE__ */ jsx("div", { className: "bg-indigo-600 h-1.5 rounded-full", style: { width: `${course.progress}%` } }) })
              ] }),
              course.progress === 100 && /* @__PURE__ */ jsxs("div", { className: "mt-2 inline-flex items-center gap-1 text-xs text-green-600", children: [
                /* @__PURE__ */ jsx(Award, { className: "h-3 w-3" }),
                " Completed"
              ] })
            ] })
          ]
        },
        course.id
      )) })
    ] })
  ] });
}
export {
  MyLearning as default
};
