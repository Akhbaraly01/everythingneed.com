import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function AdminLearning() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/courses").then((res) => setCourses(res.data)).catch(() => setCourses([])).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Learning Admin", children: [
    /* @__PURE__ */ jsx(Head, { title: "Learning Admin" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Learning Management" }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : courses.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(BookOpen, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No courses" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Course" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Instructor" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Price" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Enrolled" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y dark:divide-gray-700", children: courses.map((c) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium text-gray-900 dark:text-white", children: c.title }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-sm text-gray-500", children: c.instructor }),
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 font-semibold", children: [
            "$",
            c.price
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: c.enrolled_count })
        ] }, c.id)) })
      ] }) })
    ] })
  ] });
}
export {
  AdminLearning as default
};
