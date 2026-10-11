import { jsx, jsxs } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { User, Star, BookOpen, Award } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function InstructorProfile({ instructor_id }) {
  const [instructor, setInstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (instructor_id) {
      api.get(`/api/learn/instructors/${instructor_id}`).then((res) => setInstructor(res.data)).catch(() => {
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [instructor_id]);
  if (loading) return /* @__PURE__ */ jsx(AppLayout, { title: "Instructor", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." }) });
  if (!instructor) return /* @__PURE__ */ jsx(AppLayout, { title: "Instructor", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-red-500", children: "Instructor not found" }) });
  return /* @__PURE__ */ jsxs(AppLayout, { title: instructor.full_name, children: [
    /* @__PURE__ */ jsx(Head, { title: instructor.full_name }),
    /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-3xl space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-8 shadow dark:bg-gray-800", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
        /* @__PURE__ */ jsx("div", { className: "h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center", children: /* @__PURE__ */ jsx(User, { className: "h-10 w-10 text-blue-600" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: instructor.full_name }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: instructor.specialization }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center gap-4 text-sm", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-yellow-500", children: [
              /* @__PURE__ */ jsx(Star, { className: "h-4 w-4" }),
              " ",
              instructor.rating || "New"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-gray-500", children: [
              /* @__PURE__ */ jsx(BookOpen, { className: "h-4 w-4" }),
              " ",
              instructor.courses_count,
              " courses"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-gray-500", children: [
              /* @__PURE__ */ jsx(Award, { className: "h-4 w-4" }),
              " ",
              instructor.students_count,
              " students"
            ] })
          ] })
        ] })
      ] }),
      instructor.bio && /* @__PURE__ */ jsx("p", { className: "mt-6 text-gray-600 dark:text-gray-400", children: instructor.bio })
    ] }) })
  ] });
}
export {
  InstructorProfile as default
};
