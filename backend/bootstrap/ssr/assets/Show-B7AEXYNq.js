import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { usePage, Head, router } from "@inertiajs/react";
import { BookOpen, Clock, Users, Star, Play } from "lucide-react";
import "react";
import "./api-Dp2ndEHF.js";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function CourseShow({ course }) {
  const { auth } = usePage().props;
  const handleEnroll = () => {
    if (!(auth == null ? void 0 : auth.user)) {
      router.visit("/login");
      return;
    }
    router.post(`/api/courses/${course.id}/enroll`, {}, {
      preserveScroll: true,
      onSuccess: () => router.visit("/learn/my-learning"),
      onError: (errors) => {
        const msg = Object.values(errors)[0];
        if (typeof msg === "string") alert(msg);
      }
    });
  };
  return /* @__PURE__ */ jsxs(AppLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: course.title }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
      /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-6 lg:flex-row", children: [
        /* @__PURE__ */ jsx("div", { className: "aspect-video w-full overflow-hidden rounded-lg bg-gray-100 lg:w-1/2", children: course.thumbnail_url ? /* @__PURE__ */ jsx("img", { src: course.thumbnail_url, alt: course.title, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center text-gray-400", children: /* @__PURE__ */ jsx(BookOpen, { className: "h-12 w-12" }) }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800", children: course.category }),
            /* @__PURE__ */ jsx("span", { className: "rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800", children: course.level }),
            /* @__PURE__ */ jsx("span", { className: "rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800", children: course.type })
          ] }),
          /* @__PURE__ */ jsx("h1", { className: "mt-3 text-3xl font-bold text-gray-900 dark:text-white", children: course.title }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center gap-4 text-sm text-gray-500", children: [
            course.duration_hours && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Clock, { className: "h-4 w-4" }),
              course.duration_hours,
              "h total"
            ] }),
            course.students_count != null && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Users, { className: "h-4 w-4" }),
              course.students_count,
              " students"
            ] }),
            course.rating != null && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Star, { className: "h-4 w-4 fill-yellow-400 text-yellow-400" }),
              course.rating
            ] })
          ] }),
          course.description && /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-600 dark:text-gray-400", children: course.description }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("span", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: course.type === "free" ? "Free" : `$${course.price}` }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleEnroll,
                className: "rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500",
                children: "Enroll Now"
              }
            )
          ] })
        ] })
      ] }) }),
      course.lessons && course.lessons.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "Curriculum" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-gray-500", children: [
          course.lessons.length,
          " lessons"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 divide-y dark:divide-gray-700", children: course.lessons.sort((a, b) => a.lesson_order - b.lesson_order).map((lesson, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 py-4", children: [
          /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-800", children: index + 1 }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-medium text-gray-900 dark:text-white", children: lesson.title }),
            lesson.duration_minutes && /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500", children: [
              lesson.duration_minutes,
              " min"
            ] })
          ] }),
          lesson.video_url && /* @__PURE__ */ jsx(Play, { className: "h-5 w-5 text-gray-400" })
        ] }, lesson.id)) })
      ] })
    ] })
  ] });
}
export {
  CourseShow as default
};
