import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Link, Head } from "@inertiajs/react";
import { Handshake, Sprout, Plane, ListChecks, Building2, Hotel, Briefcase, UtensilsCrossed, ArrowRight } from "lucide-react";
import "react";
import "./api-Dp2ndEHF.js";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
const DEAL_LANDINGS = {
  food: {
    slug: "food",
    title: "Food & Restaurants",
    description: "Order from local restaurants, track delivery, and enjoy meals at home.",
    icon: UtensilsCrossed,
    color: "from-orange-500 to-orange-600",
    verticalHref: "/food",
    ctaLabel: "Browse Restaurants",
    highlights: ["Live restaurant menus", "Order tracking", "Delivery to your door"],
    apiPath: "/api/restaurants"
  },
  jobs: {
    slug: "jobs",
    title: "Jobs & Careers",
    description: "Find open roles, apply in minutes, and manage your applications.",
    icon: Briefcase,
    color: "from-blue-500 to-blue-600",
    verticalHref: "/jobs",
    ctaLabel: "View Open Jobs",
    highlights: ["Fresh listings", "Easy apply", "Application status"],
    apiPath: "/api/jobs"
  },
  hotels: {
    slug: "hotels",
    title: "Hotels & Stays",
    description: "Search rooms, check availability, and book stays with instant confirmation.",
    icon: Hotel,
    color: "from-purple-500 to-purple-600",
    verticalHref: "/hotels",
    ctaLabel: "Search Hotels",
    highlights: ["Real availability", "Secure booking", "Manage reservations"],
    apiPath: "/api/hotels"
  },
  "real-estate": {
    slug: "real-estate",
    title: "Real Estate",
    description: "Browse properties for sale or rent and connect with agents.",
    icon: Building2,
    color: "from-green-500 to-green-600",
    verticalHref: "/properties",
    ctaLabel: "Browse Properties",
    highlights: ["Verified listings", "Filter by type", "Direct inquiries"],
    apiPath: "/api/properties"
  },
  tasks: {
    slug: "tasks",
    title: "Tasks & Gigs",
    description: "Post a task or pick up gigs — get work done faster.",
    icon: ListChecks,
    color: "from-indigo-500 to-indigo-600",
    verticalHref: "/tasks",
    ctaLabel: "Open Task Center",
    highlights: ["Post a task", "Worker submissions", "Secure payments"],
    apiPath: "/api/tasks"
  },
  transportation: {
    slug: "transportation",
    title: "Transportation & Rides",
    description: "Book rides, flights, and transport services in one place.",
    icon: Plane,
    color: "from-sky-500 to-sky-600",
    verticalHref: "/transportation",
    ctaLabel: "Explore Transport",
    highlights: ["Rides & flights", "Live booking", "Trip history"]
  },
  agriculture: {
    slug: "agriculture",
    title: "Agriculture & Farming",
    description: "Farm products, workers, and agri-services for growers and buyers.",
    icon: Sprout,
    color: "from-emerald-500 to-emerald-600",
    verticalHref: "/agriculture",
    ctaLabel: "Explore Agriculture",
    highlights: ["Fresh produce", "Hire farm workers", "Agri services"],
    apiPath: "/api/agriculture/products"
  },
  booking: {
    slug: "booking",
    title: "Bookings & Reservations",
    description: "Hotels, appointments, and services — book anything from one hub.",
    icon: Handshake,
    color: "from-amber-500 to-amber-600",
    verticalHref: "/bookings",
    ctaLabel: "Manage Bookings",
    highlights: ["Unified bookings", "Reminders", "Easy reschedule"]
  }
};
function DealLanding({ slug }) {
  const config = DEAL_LANDINGS[slug];
  if (!config) {
    return /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Deal category not found" }),
      /* @__PURE__ */ jsx(Link, { href: "/deals", className: "mt-4 inline-block text-sm text-indigo-600 hover:underline", children: "Back to all deals" })
    ] });
  }
  const Icon = config.icon;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx(
      "section",
      {
        className: `rounded-xl bg-gradient-to-br ${config.color} p-8 text-white shadow-lg md:p-12`,
        "data-testid": "deal-landing-hero",
        children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white/20 p-3", children: /* @__PURE__ */ jsx(Icon, { className: "h-8 w-8" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold md:text-3xl", children: config.title }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-xl text-white/90", children: config.description }),
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: config.verticalHref,
                className: "mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow hover:bg-gray-100",
                children: [
                  config.ctaLabel,
                  /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
                ]
              }
            )
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsx("section", { className: "grid gap-4 sm:grid-cols-3", children: config.highlights.map((h) => /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-5 shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: h }) }, h)) }),
    /* @__PURE__ */ jsx("section", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Ready to start?" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
          "Everything for ",
          config.title.toLowerCase(),
          " lives in one place."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3", children: [
        /* @__PURE__ */ jsx(
          Link,
          {
            href: config.verticalHref,
            className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500",
            children: config.ctaLabel
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            href: "/deals",
            className: "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300",
            children: "All Deals"
          }
        )
      ] })
    ] }) })
  ] });
}
function DealLandingPage({ slug }) {
  const config = DEAL_LANDINGS[slug];
  return /* @__PURE__ */ jsxs(AppLayout, { title: (config == null ? void 0 : config.title) ?? "Deals", children: [
    /* @__PURE__ */ jsx(Head, { title: config ? `${config.title} | Deals` : "Deals" }),
    /* @__PURE__ */ jsx(DealLanding, { slug })
  ] });
}
export {
  DealLandingPage as default
};
