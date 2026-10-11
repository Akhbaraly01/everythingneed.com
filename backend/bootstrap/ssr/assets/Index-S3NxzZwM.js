import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { Plane, Car, Truck, Bike, Package, MapPin } from "lucide-react";
import "react";
import "./api-Dp2ndEHF.js";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
const SERVICES = [
  { name: "Flights", href: "/flights", icon: Plane, desc: "Search and book flights", color: "bg-blue-500" },
  { name: "Ride Booking", href: "/transportation/ride-booking", icon: Car, desc: "Book a car ride", color: "bg-green-500" },
  { name: "Trucks & Lorries", href: "/transportation/vehicles?type=truck", icon: Truck, desc: "Heavy transport", color: "bg-orange-500" },
  { name: "Motorcycles", href: "/transportation/vehicles?type=motorcycle", icon: Bike, desc: "Quick delivery", color: "bg-purple-500" },
  { name: "Logistics", href: "/deliveries", icon: Package, desc: "Track deliveries", color: "bg-indigo-500" },
  { name: "Custom Request", href: "/transportation/custom-request", icon: MapPin, desc: "Request custom transport", color: "bg-pink-500" }
];
function TransportationIndex() {
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Transportation", children: [
    /* @__PURE__ */ jsx(Head, { title: "Transportation" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Transportation" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Flights, rides, logistics and more" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: SERVICES.map((s) => /* @__PURE__ */ jsxs(Link, { href: s.href, className: "rounded-lg bg-white p-6 shadow hover:ring-2 hover:ring-blue-500 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("div", { className: `h-12 w-12 rounded-lg ${s.color} flex items-center justify-center`, children: /* @__PURE__ */ jsx(s.icon, { className: "h-6 w-6 text-white" }) }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 font-semibold text-gray-900 dark:text-white", children: s.name }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: s.desc })
      ] }, s.name)) })
    ] })
  ] });
}
export {
  TransportationIndex as default
};
