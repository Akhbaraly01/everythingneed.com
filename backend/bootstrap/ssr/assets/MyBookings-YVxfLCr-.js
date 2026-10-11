import { jsxs, jsx } from "react/jsx-runtime";
import { Head, Link, router } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { c as formatDate, f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { toast } from "sonner";
import { useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, UtensilsCrossed, BedDouble, Plane } from "lucide-react";
import "clsx";
const typeIcons = {
  flight: /* @__PURE__ */ jsx(Plane, { className: "h-4 w-4 text-sky-500" }),
  hotel: /* @__PURE__ */ jsx(BedDouble, { className: "h-4 w-4 text-indigo-500" }),
  food: /* @__PURE__ */ jsx(UtensilsCrossed, { className: "h-4 w-4 text-orange-500" })
};
const statusStyles = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  in_progress: "bg-cyan-100 text-cyan-800",
  checked_in: "bg-blue-100 text-blue-800",
  checked_out: "bg-gray-100 text-gray-600",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700"
};
function title(b) {
  const d = b.details ?? {};
  return d.route ?? d.hotel_name ?? d.restaurant_name ?? `${b.service_type} booking`;
}
function MyBookings({ bookings }) {
  const [busyId, setBusyId] = useState(null);
  const cancel = async (id) => {
    setBusyId(id);
    try {
      await api.post(`/api/bookings/${id}/cancel`);
      toast.success("Booking cancelled — any held inventory has been released.");
      router.reload({ only: ["bookings"] });
    } catch (err) {
      toast.error(errorMessage(err, "Cancellation failed"));
    } finally {
      setBusyId(null);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "My bookings", children: [
    /* @__PURE__ */ jsx(Head, { title: "My bookings" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "My Bookings" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
          bookings.total,
          " bookings across all services"
        ] })
      ] }),
      bookings.data.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-600", children: [
        /* @__PURE__ */ jsx(CalendarClock, { className: "mx-auto mb-3 h-10 w-10 text-gray-300" }),
        /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "No bookings yet" }),
        /* @__PURE__ */ jsx("p", { className: "mb-4 text-sm text-gray-500", children: "Flights, hotels and more will appear here." }),
        /* @__PURE__ */ jsx(Link, { href: "/flights", className: "rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700", children: "Book a flight" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: bookings.data.map((b) => {
        var _a, _b, _c, _d, _e, _f;
        return /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("span", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-700", children: typeIcons[b.service_type] ?? /* @__PURE__ */ jsx(CalendarClock, { className: "h-4 w-4 text-gray-400" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "font-medium capitalize text-gray-900 dark:text-white", children: title(b) }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500", children: [
                "Booked ",
                formatDate(b.created_at),
                ((_a = b.details) == null ? void 0 : _a.reference) ? ` · Ref ${(_b = b.details) == null ? void 0 : _b.reference}` : "",
                ((_c = b.details) == null ? void 0 : _c.travel_date) ? ` · Travel ${(_d = b.details) == null ? void 0 : _d.travel_date}` : ""
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[b.status] ?? "bg-gray-100 text-gray-600"}`, children: b.status.replace("_", " ") }),
            b.service_type === "flight" && !!((_e = b.details) == null ? void 0 : _e.total_price) && /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-sky-600", children: formatCurrency(Number(b.details.total_price)) }),
            !["cancelled", "completed", "checked_out"].includes(b.status) && /* @__PURE__ */ jsx(
              "button",
              {
                disabled: busyId === b.id,
                onClick: () => cancel(b.id),
                className: "text-xs text-red-500 hover:text-red-700",
                children: "Cancel"
              }
            ),
            b.service_type === "flight" && !!((_f = b.details) == null ? void 0 : _f.reference) && /* @__PURE__ */ jsx(Link, { href: `/flights/confirmation/${b.id}`, className: "text-xs font-medium text-indigo-600 hover:underline", children: "View ticket" })
          ] })
        ] }, b.id);
      }) }),
      bookings.last_page > 1 && /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-center justify-center gap-3", children: [
        bookings.current_page > 1 && /* @__PURE__ */ jsx(Link, { href: `/bookings?page=${bookings.current_page - 1}`, preserveState: true, className: "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white", children: /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-600 dark:text-gray-300", children: [
          "Page ",
          bookings.current_page,
          " of ",
          bookings.last_page
        ] }),
        bookings.current_page < bookings.last_page && /* @__PURE__ */ jsx(Link, { href: `/bookings?page=${bookings.current_page + 1}`, preserveState: true, className: "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white", children: /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" }) })
      ] })
    ] })
  ] });
}
export {
  MyBookings as default
};
