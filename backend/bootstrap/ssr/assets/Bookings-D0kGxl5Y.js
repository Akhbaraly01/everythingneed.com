import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function AccountBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  useEffect(() => {
    api.get("/api/bookings").then((res) => setBookings(res.data)).catch(() => setBookings([])).finally(() => setLoading(false));
  }, []);
  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.service_type === filter);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "My Bookings", children: [
    /* @__PURE__ */ jsx(Head, { title: "My Bookings" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Calendar, { className: "h-6 w-6" }),
        " My Bookings"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-2 flex-wrap", children: ["all", "hotel", "flight", "building", "healthcare", "transport"].map((t) => /* @__PURE__ */ jsx("button", { onClick: () => setFilter(t), className: `rounded-full px-4 py-1.5 text-sm capitalize ${filter === t ? "bg-blue-600 text-white" : "bg-white border dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"}`, children: t }, t)) }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : filtered.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Calendar, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No bookings found" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex justify-center gap-2", children: [
          /* @__PURE__ */ jsx(Link, { href: "/hotels", className: "text-blue-600 hover:underline text-sm", children: "Browse Hotels" }),
          /* @__PURE__ */ jsx(Link, { href: "/flights", className: "text-blue-600 hover:underline text-sm", children: "Search Flights" }),
          /* @__PURE__ */ jsx(Link, { href: "/healthcare", className: "text-blue-600 hover:underline text-sm", children: "Healthcare" })
        ] })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: filtered.map((b) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium capitalize bg-blue-50 px-2 py-1 rounded dark:bg-blue-900/30 dark:text-blue-300", children: b.service_type }),
          /* @__PURE__ */ jsx("span", { className: `text-xs px-2 py-1 rounded-full ${b.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`, children: b.status })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-600 dark:text-gray-400", children: JSON.stringify(b.details).slice(0, 100) }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 mt-1", children: new Date(b.created_at).toLocaleDateString() })
      ] }, b.id)) })
    ] })
  ] });
}
export {
  AccountBookings as default
};
