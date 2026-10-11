import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { e as errorMessage, a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency, c as formatDate } from "./PushNotificationPrompt-DvDsnr4H.js";
import { toast } from "sonner";
import { Handshake, Wallet, ChevronLeft, ArrowRight } from "lucide-react";
import "clsx";
const statusStyles = {
  pending: "bg-amber-100 text-amber-800",
  reviewing: "bg-sky-100 text-sky-800",
  offered: "bg-indigo-100 text-indigo-800",
  accepted: "bg-teal-100 text-teal-800",
  paid: "bg-purple-100 text-purple-800",
  in_progress: "bg-cyan-100 text-cyan-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700"
};
function MyServiceRequests({ requests }) {
  const [busyId, setBusyId] = useState(null);
  const act = async (id, fn, msg) => {
    setBusyId(id);
    try {
      await fn();
      toast.success(msg);
      router.reload({ only: ["requests"] });
    } catch (err) {
      toast.error(errorMessage(err, "Action failed"));
    } finally {
      setBusyId(null);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "My requests", children: [
    /* @__PURE__ */ jsx(Head, { title: "My service requests" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex flex-wrap items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "My Requests" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
            requests.total,
            " requests across all services — offers, payment and progress in one place"
          ] })
        ] }),
        /* @__PURE__ */ jsx(Link, { href: "/needs/request", className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700", children: "New request" })
      ] }),
      requests.data.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-600", children: [
        /* @__PURE__ */ jsx(Handshake, { className: "mx-auto mb-3 h-10 w-10 text-gray-300" }),
        /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "No requests yet" }),
        /* @__PURE__ */ jsx("p", { className: "mb-4 text-sm text-gray-500", children: "Tell us what you need and customer service will source offers for you." }),
        /* @__PURE__ */ jsx(Link, { href: "/needs/request", className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white", children: "Create a request" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: requests.data.map((r) => {
        var _a;
        const pendingOffer = (_a = r.offers) == null ? void 0 : _a.find((o) => o.status === "pending");
        return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("div", { className: "mb-3 flex flex-wrap items-start justify-between gap-2", children: /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "font-mono text-[11px] text-gray-400", children: r.request_number }),
              /* @__PURE__ */ jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[r.status]}`, children: r.status.replace("_", " ") }),
              /* @__PURE__ */ jsx("span", { className: "rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300", children: r.category_name })
            ] }),
            /* @__PURE__ */ jsx("h3", { className: "mt-1 font-semibold text-gray-900 dark:text-white", children: r.title }),
            /* @__PURE__ */ jsx("p", { className: "mt-0.5 line-clamp-1 text-sm text-gray-500", children: r.description }),
            /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-gray-400", children: [
              "Budget ",
              [r.budget_min && formatCurrency(Number(r.budget_min)), r.budget_max && `– ${formatCurrency(Number(r.budget_max))}`].filter(Boolean).join(" ") || "Flexible",
              r.deadline ? ` · due ${formatDate(r.deadline)}` : "",
              r.location ? ` · 📍 ${r.location}` : ""
            ] })
          ] }) }),
          pendingOffer && /* @__PURE__ */ jsxs("div", { className: "mb-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/30", children: [
            /* @__PURE__ */ jsxs("p", { className: "mb-2 text-sm font-medium text-indigo-900 dark:text-indigo-200", children: [
              /* @__PURE__ */ jsx(Handshake, { className: "mr-1 inline h-4 w-4" }),
              "Offer received: ",
              formatCurrency(Number(pendingOffer.amount)),
              pendingOffer.message && /* @__PURE__ */ jsxs("span", { className: "font-normal", children: [
                " — “",
                pendingOffer.message,
                "”"
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                disabled: busyId === r.id,
                onClick: () => act(
                  r.id,
                  () => api.post(`/api/need-requests/${r.id}/offers/${pendingOffer.id}/accept`),
                  "Offer accepted — proceed to payment"
                ),
                className: "rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700",
                children: "Accept offer"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-700", children: [
            r.status === "accepted" && /* @__PURE__ */ jsxs(
              "button",
              {
                disabled: busyId === r.id,
                onClick: () => act(r.id, () => api.post(`/api/need-requests/${r.id}/pay`), "Payment recorded"),
                className: "flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700",
                children: [
                  /* @__PURE__ */ jsx(Wallet, { className: "h-3.5 w-3.5" }),
                  " Pay now"
                ]
              }
            ),
            r.status === "reviewing" && /* @__PURE__ */ jsx("span", { className: "text-xs text-sky-600", children: "⏳ Customer service is sourcing the best offer…" }),
            r.status === "in_progress" && /* @__PURE__ */ jsx("span", { className: "text-xs text-cyan-700", children: "Fulfilment in progress." }),
            r.status === "completed" && /* @__PURE__ */ jsx("span", { className: "text-xs text-green-600", children: "✓ Completed — thank you!" })
          ] })
        ] }, r.id);
      }) }),
      requests.last_page > 1 && /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-center justify-center gap-3", children: [
        requests.current_page > 1 && /* @__PURE__ */ jsx(Link, { href: `/requests?page=${requests.current_page - 1}`, preserveState: true, className: "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white", children: /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-600 dark:text-gray-300", children: [
          "Page ",
          requests.current_page,
          " of ",
          requests.last_page
        ] }),
        requests.current_page < requests.last_page && /* @__PURE__ */ jsx(Link, { href: `/requests?page=${requests.current_page + 1}`, preserveState: true, className: "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white", children: /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" }) })
      ] })
    ] })
  ] });
}
export {
  MyServiceRequests as default
};
