import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { toast } from "sonner";
import { HardHat, Wrench, Star, ClipboardList, CalendarClock, MapPin, Briefcase } from "lucide-react";
import "clsx";
const bookingStatusStyles = {
  pending: "bg-amber-100 text-amber-800",
  assigned: "bg-blue-100 text-blue-800",
  in_progress: "bg-cyan-100 text-cyan-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700"
};
function BuildingServicesIndex({ services, myBookings }) {
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    worker_type: "",
    scheduled_date: "",
    scheduled_time: "",
    address: "",
    description: ""
  });
  const openBooking = (w) => {
    setSelected(w);
    setForm((f) => ({ ...f, worker_type: w.worker_type }));
  };
  const book = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/api/building-services/book", {
        worker_type: form.worker_type || (selected == null ? void 0 : selected.worker_type) || "general",
        scheduled_date: form.scheduled_date,
        scheduled_time: form.scheduled_time || null,
        address: form.address,
        description: form.description || null
      });
      toast.success("Request sent", { description: "The provider will confirm your slot." });
      setSelected(null);
      router.reload({ only: ["myBookings"] });
    } catch (err) {
      toast.error(errorMessage(err, "Booking failed"));
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Building services", children: [
    /* @__PURE__ */ jsx(Head, { title: "Building & construction services" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-8 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("span", { className: "flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100", children: /* @__PURE__ */ jsx(HardHat, { className: "h-6 w-6 text-orange-600" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Building Services" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Vetted masons, electricians, welders and general contractors" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("h2", { className: "mb-4 font-bold text-gray-900 dark:text-white", children: [
        "Available providers (",
        services.length,
        ")"
      ] }),
      services.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "mb-8 rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-600", children: [
        /* @__PURE__ */ jsx(Wrench, { className: "mx-auto mb-3 h-9 w-9 text-gray-300" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "No providers available right now — check back soon." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3", children: services.map((w) => /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-start justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-orange-100", children: /* @__PURE__ */ jsx(HardHat, { className: "h-5 w-5 text-orange-600" }) }),
          Number(w.rating ?? 0) > 0 && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-white", children: [
            /* @__PURE__ */ jsx(Star, { className: "h-4 w-4 fill-yellow-400 text-yellow-400" }),
            " ",
            Number(w.rating).toFixed(1)
          ] })
        ] }),
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-gray-900 dark:text-white", children: w.full_name }),
        /* @__PURE__ */ jsx("p", { className: "text-xs capitalize text-gray-500", children: String(w.worker_type).replace("_", " ") }),
        w.bio && /* @__PURE__ */ jsx("p", { className: "mt-1.5 line-clamp-2 text-xs text-gray-500", children: w.bio }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center gap-3 text-[11px] text-gray-400", children: [
          w.hourly_rate && /* @__PURE__ */ jsxs("span", { children: [
            formatCurrency(Number(w.hourly_rate)),
            "/hr"
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            w.experience_years ?? 0,
            " yrs exp"
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            w.completed_jobs ?? 0,
            " jobs"
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => openBooking(w),
            className: "mt-4 w-full rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700",
            children: "Request this provider"
          }
        )
      ] }, w.id)) }),
      /* @__PURE__ */ jsxs("h2", { className: "mb-4 flex items-center gap-2 font-bold text-gray-900 dark:text-white", children: [
        /* @__PURE__ */ jsx(ClipboardList, { className: "h-5 w-5" }),
        " My bookings"
      ] }),
      myBookings.length === 0 ? /* @__PURE__ */ jsx("p", { className: "rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-400 dark:bg-gray-700/40", children: "No building-service bookings yet." }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: myBookings.map((b) => /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: "text-sm font-medium capitalize text-gray-900 dark:text-white", children: [
            String(b.worker_type).replace("_", " "),
            b.service_category ? ` — ${b.service_category}` : ""
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mt-0.5 flex items-center gap-2 text-xs text-gray-500", children: [
            /* @__PURE__ */ jsx(CalendarClock, { className: "h-3.5 w-3.5" }),
            " ",
            b.scheduled_date,
            b.scheduled_time ? ` ${b.scheduled_time}` : "",
            "· ",
            /* @__PURE__ */ jsx(MapPin, { className: "h-3.5 w-3.5" }),
            " ",
            b.address
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          b.estimated_cost && /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-orange-600", children: formatCurrency(Number(b.estimated_cost)) }),
          /* @__PURE__ */ jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${bookingStatusStyles[b.status] ?? ""}`, children: b.status })
        ] })
      ] }, b.id)) }),
      selected && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/50", onClick: () => setSelected(null) }),
        /* @__PURE__ */ jsxs("form", { onSubmit: book, className: "relative w-full max-w-md space-y-3 rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("h2", { className: "flex items-center gap-2 font-bold text-gray-900 dark:text-white", children: [
            /* @__PURE__ */ jsx(Briefcase, { className: "h-5 w-5 text-orange-600" }),
            " Book ",
            selected.full_name
          ] }) }),
          /* @__PURE__ */ jsx("input", { required: true, type: "date", value: form.scheduled_date, min: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), onChange: (e) => setForm((f) => ({ ...f, scheduled_date: e.target.value })), className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" }),
          /* @__PURE__ */ jsx("input", { value: form.scheduled_time, onChange: (e) => setForm((f) => ({ ...f, scheduled_time: e.target.value })), placeholder: "Preferred time (e.g. morning)", className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" }),
          /* @__PURE__ */ jsx("textarea", { required: true, rows: 2, value: form.address, onChange: (e) => setForm((f) => ({ ...f, address: e.target.value })), placeholder: "Site address", className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" }),
          /* @__PURE__ */ jsx("textarea", { rows: 2, value: form.description, onChange: (e) => setForm((f) => ({ ...f, description: e.target.value })), placeholder: "Describe the work…", className: "w-full rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-1", children: [
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setSelected(null), className: "rounded-lg px-4 py-2 text-sm text-gray-500", children: "Cancel" }),
            /* @__PURE__ */ jsx("button", { type: "submit", disabled: busy, className: "rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60", children: busy ? "Sending…" : "Send request" })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  BuildingServicesIndex as default
};
