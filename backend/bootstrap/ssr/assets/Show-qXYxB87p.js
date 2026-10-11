import { jsx, jsxs } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { MapPin, Calendar, DollarSign } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function NeedShow({ need_id }) {
  var _a;
  const [need, setNeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const id = need_id || (typeof window !== "undefined" ? window.location.pathname.split("/").pop() : void 0);
  const reload = () => {
    if (id) api.get(`/api/need-requests/${id}`).then((res) => setNeed(res.data)).catch(() => {
    });
  };
  useEffect(() => {
    if (id) {
      api.get(`/api/need-requests/${id}`).then((res) => setNeed(res.data)).catch(() => {
      }).finally(() => setLoading(false));
    } else setLoading(false);
  }, [id]);
  const handleOfferAction = async (offerId, action) => {
    if (!id) return;
    try {
      await api.post(`/api/need-requests/${id}/offers/${offerId}/${action}`);
      reload();
    } catch (e) {
      alert(errorMessage(e, "Action failed"));
    }
  };
  const handleTransition = async (action) => {
    if (!id) return;
    try {
      await api.post(`/api/need-requests/${id}/${action}`);
      reload();
    } catch (e) {
      alert(errorMessage(e, "Action failed"));
    }
  };
  if (loading) return /* @__PURE__ */ jsx(AppLayout, { title: "Need Details", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." }) });
  if (!need) return /* @__PURE__ */ jsx(AppLayout, { title: "Need Details", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-red-500", children: "Request not found" }) });
  return /* @__PURE__ */ jsxs(AppLayout, { title: need.title, children: [
    /* @__PURE__ */ jsx(Head, { title: need.title }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-500", children: [
            "#",
            need.request_number
          ] }),
          /* @__PURE__ */ jsx("span", { className: `rounded-full px-3 py-1 text-xs font-medium ${need.status === "completed" ? "bg-green-100 text-green-800" : need.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"}`, children: need.status })
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-gray-900 dark:text-white", children: need.title }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-600 dark:text-gray-400", children: need.description }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 grid grid-cols-3 gap-3 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded bg-gray-50 p-3 dark:bg-gray-700", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Budget" }),
            /* @__PURE__ */ jsxs("p", { className: "font-semibold dark:text-white", children: [
              "$",
              need.budget_min,
              " - $",
              need.budget_max
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded bg-gray-50 p-3 dark:bg-gray-700", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-gray-500 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "h-3 w-3" }),
              " Location"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "font-semibold dark:text-white", children: need.location || "Anywhere" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded bg-gray-50 p-3 dark:bg-gray-700", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-gray-500 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Calendar, { className: "h-3 w-3" }),
              " Deadline"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "font-semibold dark:text-white", children: need.deadline || "Flexible" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("h2", { className: "font-semibold dark:text-white mb-3 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(DollarSign, { className: "h-5 w-5" }),
          " Offers (",
          ((_a = need.offers) == null ? void 0 : _a.length) || 0,
          ")"
        ] }),
        need.offers && need.offers.length > 0 ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: need.offers.map((o) => {
          var _a2;
          return /* @__PURE__ */ jsxs("div", { className: "rounded-lg border p-4 dark:border-gray-600", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "font-semibold dark:text-white", children: ((_a2 = o.provider) == null ? void 0 : _a2.name) || "Provider" }),
              /* @__PURE__ */ jsxs("span", { className: "font-bold text-green-600", children: [
                "$",
                o.price
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mt-1", children: o.message }),
            /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-1 text-xs ${o.status === "accepted" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`, children: o.status }),
              o.status === "pending" && ["offered", "reviewing", "pending"].includes(need.status) && /* @__PURE__ */ jsxs("span", { className: "inline-flex gap-2", children: [
                /* @__PURE__ */ jsx("button", { onClick: () => handleOfferAction(o.id, "accept"), className: "rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700", children: "Accept Offer" }),
                /* @__PURE__ */ jsx("button", { onClick: () => handleOfferAction(o.id, "reject"), className: "rounded border px-3 py-1 text-xs hover:bg-gray-50 dark:border-gray-600", children: "Reject" })
              ] })
            ] })
          ] }, o.id);
        }) }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "No offers yet. Providers will respond soon." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold dark:text-white mb-3", children: "Workflow" }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          need.status === "accepted" && /* @__PURE__ */ jsx("button", { onClick: () => handleTransition("pay"), className: "rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700", children: "Pay Now" }),
          need.status === "paid" && /* @__PURE__ */ jsx("button", { onClick: () => handleTransition("start"), className: "rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700", children: "Start Work" }),
          need.status === "in_progress" && /* @__PURE__ */ jsx("button", { onClick: () => handleTransition("complete"), className: "rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700", children: "Mark Complete" }),
          ["pending", "reviewing", "offered"].includes(need.status) && /* @__PURE__ */ jsx("button", { onClick: () => handleTransition("cancel"), className: "rounded border px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600", children: "Cancel Request" }),
          /* @__PURE__ */ jsx("a", { href: `/needs/history`, className: "rounded border px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600", children: "History" })
        ] })
      ] })
    ] })
  ] });
}
export {
  NeedShow as default
};
