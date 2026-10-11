import { jsxs, jsx } from "react/jsx-runtime";
import { Head, Link } from "@inertiajs/react";
import { M as MarketplaceLayout } from "./MarketplaceLayout-BjqzrNjx.js";
import { f as formatCurrency, a as formatDateTime } from "./PushNotificationPrompt-DvDsnr4H.js";
import { FlaskConical, Video, Play, FileText, BookOpen, Stethoscope, Calendar, Star, Clock } from "lucide-react";
import { useState } from "react";
import "../app2.js";
import "react-dom/client";
import "sonner";
import "./api-Dp2ndEHF.js";
import "clsx";
function normalizeList(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  return input.data ?? [];
}
function Healthcare({ doctors, appointments }) {
  const [activeTab, setActiveTab] = useState("doctors");
  const doctorList = normalizeList(doctors);
  const appointmentList = normalizeList(appointments);
  return /* @__PURE__ */ jsxs(MarketplaceLayout, { title: "Healthcare", children: [
    /* @__PURE__ */ jsx(Head, { title: "Healthcare" }),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-3 py-4 space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 p-6 text-white", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl md:text-2xl font-bold", children: "Healthcare at Your Doorstep" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-white/80", children: "Book appointments & order medicines online" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx(Link, { href: "/healthcare/doctors", className: "inline-flex h-9 items-center rounded-md bg-white px-4 text-xs font-semibold text-pink-700", children: "Find Doctors" }),
          /* @__PURE__ */ jsx(Link, { href: "/pharmacy", className: "inline-flex h-9 items-center rounded-md bg-white/20 px-4 text-xs font-medium text-white hover:bg-white/30", children: "Order Medicines" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5", children: [
        { label: "Labs", href: "/healthcare/labs", icon: FlaskConical },
        { label: "Virtual", href: "/healthcare/virtual", icon: Video },
        { label: "Videos", href: "/healthcare/videos", icon: Play },
        { label: "Documents", href: "/healthcare/documents", icon: FileText },
        { label: "Guides", href: "/healthcare/guides", icon: BookOpen }
      ].map((item) => /* @__PURE__ */ jsxs(
        Link,
        {
          href: item.href,
          className: "flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-3 text-sm font-medium shadow-sm hover:shadow-md",
          children: [
            /* @__PURE__ */ jsx(item.icon, { className: "h-4 w-4 text-primary" }),
            item.label
          ]
        },
        item.href
      )) }),
      /* @__PURE__ */ jsx("div", { className: "border-b border-border", children: /* @__PURE__ */ jsxs("nav", { className: "-mb-px flex gap-6", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setActiveTab("doctors"),
            className: `border-b-2 pb-4 text-sm font-medium ${activeTab === "doctors" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`,
            children: [
              /* @__PURE__ */ jsx(Stethoscope, { className: "mr-2 inline h-4 w-4" }),
              "Doctors"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setActiveTab("appointments"),
            className: `border-b-2 pb-4 text-sm font-medium ${activeTab === "appointments" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`,
            children: [
              /* @__PURE__ */ jsx(Calendar, { className: "mr-2 inline h-4 w-4" }),
              "My Appointments"
            ]
          }
        )
      ] }) }),
      activeTab === "doctors" && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", children: doctorList.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "col-span-full rounded-xl border border-border bg-card p-12 text-center shadow-sm", children: [
        /* @__PURE__ */ jsx(Stethoscope, { className: "mx-auto h-12 w-12 text-muted-foreground" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium", children: "No doctors available" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Please check back later." })
      ] }) : doctorList.map((doctor) => /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-6 shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "h-16 w-16 flex-shrink-0 rounded-full bg-muted overflow-hidden", children: doctor.avatar_url && /* @__PURE__ */ jsx("img", { src: doctor.avatar_url, alt: doctor.full_name, className: "h-16 w-16 rounded-full object-cover", loading: "lazy" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: doctor.full_name }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-primary", children: doctor.specialization }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: doctor.qualification })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center gap-4 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Star, { className: "h-4 w-4 fill-yellow-400 text-yellow-400" }),
            doctor.rating ?? "N/A"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Clock, { className: "h-4 w-4" }),
            doctor.experience_years,
            " yrs exp"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-lg font-bold", children: formatCurrency(doctor.consultation_fee) }),
          /* @__PURE__ */ jsx(
            Link,
            {
              href: `/healthcare/book?doctor=${doctor.id}`,
              className: "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90",
              children: "Book Now"
            }
          )
        ] })
      ] }, doctor.id)) }),
      activeTab === "appointments" && /* @__PURE__ */ jsx("div", { className: "space-y-4", children: appointmentList.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-12 text-center shadow-sm", children: [
        /* @__PURE__ */ jsx(Calendar, { className: "mx-auto h-12 w-12 text-muted-foreground" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium", children: "No appointments" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Book a doctor to get started." })
      ] }) : appointmentList.map((ticket) => /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-6 shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: ticket.ticket_number }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: formatDateTime(ticket.created_at) })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary", children: ticket.status })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: ticket.symptoms }),
        ticket.doctor && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-primary", children: [
          "Dr. ",
          ticket.doctor.full_name
        ] })
      ] }, ticket.id)) })
    ] })
  ] });
}
export {
  Healthcare as default
};
