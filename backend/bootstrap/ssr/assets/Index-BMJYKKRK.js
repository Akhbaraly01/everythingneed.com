import { jsxs, jsx } from "react/jsx-runtime";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { M as MarketplaceLayout } from "./MarketplaceLayout-BjqzrNjx.js";
import { Clock, Users, Star, BookOpen } from "lucide-react";
import "../app2.js";
import "react-dom/client";
import "react";
import "sonner";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "./api-Dp2ndEHF.js";
import "clsx";
function Learn({ courses }) {
  var _a;
  const { auth } = usePage().props;
  const list = (courses == null ? void 0 : courses.data) ?? [];
  const total = ((_a = courses == null ? void 0 : courses.meta) == null ? void 0 : _a.total) ?? list.length;
  const handleEnroll = (courseId) => {
    if (!(auth == null ? void 0 : auth.user)) {
      router.visit("/login");
      return;
    }
    router.post(`/api/courses/${courseId}/enroll`, {}, {
      preserveScroll: true,
      onSuccess: () => router.visit("/learn/my-learning")
    });
  };
  const instructorNames = Array.from(
    new Set(list.map((c) => c.instructor_name ?? c.instructor).filter(Boolean))
  ).slice(0, 4);
  const stats = [
    { label: "Courses", value: String(total) },
    { label: "Instructors", value: String(instructorNames.length || new Set(list.map((c) => c.category).filter(Boolean)).size) },
    { label: "Students", value: String(list.reduce((sum, c) => sum + (c.students_count ?? 0), 0)) },
    {
      label: "Average Rating",
      value: (() => {
        const rated = list.map((c) => c.rating).filter((r) => typeof r === "number" && r > 0);
        if (!rated.length) return "—";
        return (rated.reduce((a, b) => a + b, 0) / rated.length).toFixed(1);
      })()
    }
  ];
  return /* @__PURE__ */ jsxs(MarketplaceLayout, { title: "Learn", children: [
    /* @__PURE__ */ jsx(Head, { title: "Learn" }),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-3 py-4 space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl md:text-2xl font-bold", children: "Learn New Skills & Advance Your Career" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-white/80", children: total > 0 ? `${total} course${total === 1 ? "" : "s"} to transform your future` : "Browse courses when they become available" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx(Link, { href: "/learn/courses", className: "inline-flex h-9 items-center rounded-md bg-white px-4 text-xs font-semibold text-teal-700", children: "Start Learning" }),
          /* @__PURE__ */ jsx(Link, { href: "/learn/certificates", className: "inline-flex h-9 items-center rounded-md bg-white/20 px-4 text-xs font-medium text-white hover:bg-white/30", children: "View Certificates" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: stats.map((s) => /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-4 text-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xl font-bold text-primary", children: s.value }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: s.label })
      ] }, s.label)) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: "Instructors" }),
          /* @__PURE__ */ jsx(Link, { href: "/learn/courses", className: "text-sm text-muted-foreground hover:text-foreground", children: "View all courses" })
        ] }),
        instructorNames.length === 0 ? /* @__PURE__ */ jsx("p", { className: "py-4 text-center text-sm text-muted-foreground", children: "No instructors listed yet." }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: instructorNames.map((name) => /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-4 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary", children: name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold line-clamp-1", children: name }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Instructor" }),
          /* @__PURE__ */ jsx(
            Link,
            {
              href: `/learn/instructors/${encodeURIComponent(name)}`,
              className: "mt-3 inline-flex h-8 items-center rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground",
              children: "View"
            }
          )
        ] }, name)) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
        total,
        " courses available"
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", children: list.map((course) => /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-xl border border-border bg-card shadow-sm", children: [
        /* @__PURE__ */ jsx("div", { className: "aspect-video bg-muted", children: course.thumbnail_url && /* @__PURE__ */ jsx("img", { src: course.thumbnail_url, alt: course.title, className: "h-full w-full object-cover", loading: "lazy" }) }),
        /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary", children: course.category }),
            /* @__PURE__ */ jsx("span", { className: "rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground", children: course.level })
          ] }),
          /* @__PURE__ */ jsx(Link, { href: `/learn/${course.id}`, children: /* @__PURE__ */ jsx("h3", { className: "mt-2 font-semibold hover:text-primary line-clamp-1", children: course.title }) }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground line-clamp-2", children: course.description }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center gap-4 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Clock, { className: "h-3 w-3" }),
              course.duration_hours ?? 0,
              "h"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Users, { className: "h-3 w-3" }),
              course.students_count ?? 0
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Star, { className: "h-3 w-3" }),
              course.rating ?? "N/A"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-lg font-bold", children: course.type === "free" ? "Free" : `$${course.price ?? 0}` }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => handleEnroll(course.id),
                className: "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90",
                children: "Enroll"
              }
            )
          ] })
        ] })
      ] }, course.id)) }),
      list.length === 0 && /* @__PURE__ */ jsxs("p", { className: "py-10 text-center text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsx(BookOpen, { className: "mx-auto mb-2 h-8 w-8" }),
        "No courses yet. Check back soon."
      ] })
    ] })
  ] });
}
export {
  Learn as default
};
