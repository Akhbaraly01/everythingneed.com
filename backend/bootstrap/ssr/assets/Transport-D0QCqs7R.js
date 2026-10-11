import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api, r as rows } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { Plane, Car } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function AdminTransport() {
  const [flights, setFlights] = useState([]);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("flights");
  useEffect(() => {
    Promise.all([
      api.get("/api/flights").catch(() => ({ data: [] })),
      api.get("/api/rides").catch(() => ({ data: [] }))
    ]).then(([f, r]) => {
      setFlights(rows(f));
      setRides(rows(r));
    }).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Transport Management", children: [
    /* @__PURE__ */ jsx(Head, { title: "Transport Management" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Transport Management" }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs("button", { onClick: () => setTab("flights"), className: `px-4 py-2 rounded-lg text-sm flex items-center gap-1 ${tab === "flights" ? "bg-blue-600 text-white" : "bg-white border dark:bg-gray-800"}`, children: [
          /* @__PURE__ */ jsx(Plane, { className: "h-4 w-4" }),
          " Flights (",
          flights.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => setTab("rides"), className: `px-4 py-2 rounded-lg text-sm flex items-center gap-1 ${tab === "rides" ? "bg-blue-600 text-white" : "bg-white border dark:bg-gray-800"}`, children: [
          /* @__PURE__ */ jsx(Car, { className: "h-4 w-4" }),
          " Rides (",
          rides.length,
          ")"
        ] })
      ] }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : tab === "flights" ? /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Flight" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Route" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Price" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Status" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { className: "divide-y dark:divide-gray-700", children: [
          flights.map((f) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 font-medium dark:text-white", children: [
              f.flight_number,
              " • ",
              f.airline
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "px-4 py-3", children: [
              f.origin_city,
              " → ",
              f.destination_city
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "px-4 py-3", children: [
              "$",
              f.price
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-1 text-xs ${f.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`, children: f.is_active ? "Active" : "Inactive" }) })
          ] }, f.id)),
          flights.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "px-4 py-12 text-center text-gray-500", children: "No flights" }) })
        ] })
      ] }) }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Route" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Fare" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { className: "divide-y dark:divide-gray-700", children: [
          rides.map((r) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsxs("td", { className: "px-4 py-3", children: [
              r.pickup_address,
              " → ",
              r.dropoff_address
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("span", { className: "rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800", children: r.status }) }),
            /* @__PURE__ */ jsxs("td", { className: "px-4 py-3", children: [
              "$",
              r.fare
            ] })
          ] }, r.id)),
          rides.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 3, className: "px-4 py-12 text-center text-gray-500", children: "No rides" }) })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  AdminTransport as default
};
