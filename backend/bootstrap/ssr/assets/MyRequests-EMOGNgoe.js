import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { e as errorMessage, a as api } from "./api-Dp2ndEHF.js";
import { c as formatDate, f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { toast } from "sonner";
import { ArrowLeft, XCircle, Handshake, BadgeDollarSign, Star, Check } from "lucide-react";
import "clsx";
const statusStyles = {
  open: "bg-blue-100 text-blue-800",
  negotiating: "bg-amber-100 text-amber-800",
  accepted: "bg-indigo-100 text-indigo-800",
  paid: "bg-purple-100 text-purple-800",
  in_progress: "bg-cyan-100 text-cyan-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
  disputed: "bg-red-100 text-red-700"
};
function MyWorkRequests({ requests }) {
  const [busyId, setBusyId] = useState(null);
  const [ratingFor, setRatingFor] = useState(null);
  const [rating, setRating] = useState(5);
  const act = async (request, action, successMsg) => {
    setBusyId(request.id);
    try {
      await action();
      toast.success(successMsg);
      router.reload({ only: ["requests"] });
    } catch (err) {
      toast.error(errorMessage(err, "Action failed"));
    } finally {
      setBusyId(null);
    }
  };
  const pendingOffer = (request) => {
    var _a;
    return (_a = request.offers) == null ? void 0 : _a.find((o) => o.status === "pending" && o.proposed_by === "worker");
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "My work requests", children: [
    /* @__PURE__ */ jsx(Head, { title: "My work requests" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs(Link, { href: "/job-seekers", className: "mb-1 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600", children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
            " Browse workers"
          ] }),
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "My Requests" })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300", children: [
          requests.total,
          " total"
        ] })
      ] }),
      requests.data.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-600", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "No requests yet" }),
        /* @__PURE__ */ jsx("p", { className: "mb-4 text-sm text-gray-500", children: "Find a worker and send your first request." }),
        /* @__PURE__ */ jsx(Link, { href: "/job-seekers", className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700", children: "Browse directory" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: requests.data.map((req) => {
        var _a, _b;
        const offer = pendingOffer(req);
        return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-3 flex flex-wrap items-start justify-between gap-2", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("h3", { className: "font-semibold text-gray-900 dark:text-white", children: req.title }),
                /* @__PURE__ */ jsx("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[req.status]}`, children: req.status.replace("_", " ") })
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "mt-0.5 text-xs text-gray-500", children: [
                ((_b = (_a = req.worker_profile) == null ? void 0 : _a.user) == null ? void 0 : _b.name) ?? "Open to offers",
                " · created ",
                formatDate(req.created_at),
                req.agreed_rate ? ` · agreed ${formatCurrency(Number(req.agreed_rate))}` : ""
              ] })
            ] }),
            !["cancelled", "completed"].includes(req.status) && /* @__PURE__ */ jsxs(
              "button",
              {
                disabled: busyId === req.id,
                onClick: () => act(req, () => api.post(`/api/work-requests/${req.id}/cancel`), "Request cancelled"),
                className: "flex items-center gap-1 text-xs text-red-500 hover:text-red-700",
                children: [
                  /* @__PURE__ */ jsx(XCircle, { className: "h-3.5 w-3.5" }),
                  " Cancel"
                ]
              }
            )
          ] }),
          offer && /* @__PURE__ */ jsxs("div", { className: "mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30", children: [
            /* @__PURE__ */ jsxs("p", { className: "mb-2 flex items-center gap-1.5 text-sm font-medium text-amber-900 dark:text-amber-200", children: [
              /* @__PURE__ */ jsx(Handshake, { className: "h-4 w-4" }),
              "Offer received: ",
              formatCurrency(Number(offer.rate)),
              offer.message && /* @__PURE__ */ jsxs("span", { className: "font-normal", children: [
                "— “",
                offer.message,
                "”"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  disabled: busyId === req.id,
                  onClick: () => act(
                    req,
                    () => api.post(`/api/work-offers/${offer.id}/respond`, { decision: "accept" }),
                    "Offer accepted — proceed to payment"
                  ),
                  className: "rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700",
                  children: "Accept offer"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  disabled: busyId === req.id,
                  onClick: () => act(
                    req,
                    () => api.post(`/api/work-offers/${offer.id}/respond`, { decision: "reject" }),
                    "Offer rejected"
                  ),
                  className: "rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300",
                  children: "Reject"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 border-t border-gray-100 pt-3 dark:border-gray-700", children: [
            req.status === "accepted" && /* @__PURE__ */ jsxs(
              "button",
              {
                disabled: busyId === req.id,
                onClick: () => act(req, () => api.post(`/api/work-requests/${req.id}/pay`), "Marked as paid"),
                className: "flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700",
                children: [
                  /* @__PURE__ */ jsx(BadgeDollarSign, { className: "h-3.5 w-3.5" }),
                  " Mark as paid (",
                  formatCurrency(Number(req.agreed_rate ?? 0)),
                  ")"
                ]
              }
            ),
            req.status === "in_progress" && /* @__PURE__ */ jsx("span", { className: "rounded-lg bg-cyan-50 px-3 py-1.5 text-xs text-cyan-700", children: "Work in progress — the worker will mark it complete." }),
            req.status === "completed" && !req.rated_at && (ratingFor === req.id ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              [1, 2, 3, 4, 5].map((n) => /* @__PURE__ */ jsx("button", { onClick: () => setRating(n), children: /* @__PURE__ */ jsx(Star, { className: `h-6 w-6 ${n <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}` }) }, n)),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  disabled: busyId === req.id,
                  onClick: () => act(
                    req,
                    () => api.post(`/api/work-requests/${req.id}/rate`, { rating }),
                    "Rating recorded — thank you!"
                  ).then(() => setRatingFor(null)),
                  className: "ml-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white",
                  children: [
                    /* @__PURE__ */ jsx(Check, { className: "mr-1 inline h-3 w-3" }),
                    " Submit"
                  ]
                }
              )
            ] }) : /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  setRatingFor(req.id);
                  setRating(5);
                },
                className: "flex items-center gap-1.5 rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-600",
                children: [
                  /* @__PURE__ */ jsx(Star, { className: "h-3.5 w-3.5" }),
                  " Rate this worker"
                ]
              }
            )),
            req.status === "completed" && req.rated_at && /* @__PURE__ */ jsx("span", { className: "text-xs text-green-600", children: "✓ Rated — thank you for the feedback." })
          ] })
        ] }, req.id);
      }) }),
      requests.last_page > 1 && /* @__PURE__ */ jsxs("div", { className: "mt-8 flex justify-center gap-3", children: [
        requests.current_page > 1 && /* @__PURE__ */ jsx(Link, { href: `/job-seekers/my-requests?page=${requests.current_page - 1}`, preserveState: true, className: "rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:text-white", children: "Previous" }),
        /* @__PURE__ */ jsxs("span", { className: "self-center text-sm text-gray-500", children: [
          "Page ",
          requests.current_page,
          " of ",
          requests.last_page
        ] }),
        requests.current_page < requests.last_page && /* @__PURE__ */ jsx(Link, { href: `/job-seekers/my-requests?page=${requests.current_page + 1}`, preserveState: true, className: "rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:text-white", children: "Next" })
      ] })
    ] })
  ] });
}
export {
  MyWorkRequests as default
};
