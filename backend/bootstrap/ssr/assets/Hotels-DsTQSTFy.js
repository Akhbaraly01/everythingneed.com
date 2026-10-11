import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api, r as rows } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { Hotel, MapPin } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function AdminHotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/hotels", { params: { per_page: 50 } }).then((res) => setHotels(rows(res))).catch(() => setHotels([])).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Hotel Management", children: [
    /* @__PURE__ */ jsx(Head, { title: "Hotel Management" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Hotel, { className: "h-6 w-6" }),
        " Hotel Management"
      ] }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Hotel" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Location" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Rating" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Status" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { className: "divide-y dark:divide-gray-700", children: [
          hotels.map((h) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium dark:text-white", children: h.name }),
            /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 text-sm text-gray-500 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "h-3 w-3" }),
              h.city,
              ", ",
              h.country
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: "★".repeat(h.star_rating || 0) }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-1 text-xs ${h.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`, children: h.is_active ? "Active" : "Inactive" }) })
          ] }, h.id)),
          hotels.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "px-4 py-12 text-center text-gray-500", children: "No hotels" }) })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  AdminHotels as default
};
