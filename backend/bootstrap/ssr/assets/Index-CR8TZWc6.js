import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { Briefcase, Hotel, UtensilsCrossed, Building2, Sprout, HardHat, Plane, Truck, Handshake } from "lucide-react";
import "react";
import "./api-Dp2ndEHF.js";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
const dealCategories = [
  { name: "Tasks & Gigs", href: "/tasks", icon: Briefcase, color: "text-blue-600", desc: "Find freelancers or get tasks done" },
  { name: "Hotels", href: "/hotels", icon: Hotel, color: "text-purple-600", desc: "Book hotel rooms" },
  { name: "Food", href: "/food", icon: UtensilsCrossed, color: "text-orange-600", desc: "Order from restaurants" },
  { name: "Real Estate", href: "/properties", icon: Building2, color: "text-green-600", desc: "Properties for sale or rent" },
  { name: "Agriculture", href: "/agriculture", icon: Sprout, color: "text-emerald-600", desc: "Agricultural products" },
  { name: "Building Services", href: "/building-services", icon: HardHat, color: "text-yellow-600", desc: "Construction & maintenance" },
  { name: "Flights", href: "/flights", icon: Plane, color: "text-sky-600", desc: "Search and book flights" },
  { name: "Job Seekers", href: "/job-seekers", icon: Truck, color: "text-red-600", desc: "Find workers or jobs" },
  { name: "Needs & Services", href: "/needs", icon: Handshake, color: "text-indigo-600", desc: "Submit service requests" }
];
function DealsIndex() {
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Deals", children: [
    /* @__PURE__ */ jsx(Head, { title: "Deals" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Deals & Services" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Explore all available services and deals" }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: dealCategories.map((cat) => /* @__PURE__ */ jsxs(
        Link,
        {
          href: cat.href,
          className: "group rounded-lg bg-white p-6 shadow transition hover:shadow-lg dark:bg-gray-800",
          children: [
            /* @__PURE__ */ jsx(cat.icon, { className: `h-10 w-10 ${cat.color}` }),
            /* @__PURE__ */ jsx("h2", { className: "mt-3 text-lg font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white", children: cat.name }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: cat.desc })
          ]
        },
        cat.href
      )) })
    ] })
  ] });
}
export {
  DealsIndex as default
};
