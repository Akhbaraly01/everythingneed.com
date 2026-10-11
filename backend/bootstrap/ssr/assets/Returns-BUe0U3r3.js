import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { a as formatDateTime, f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { ArrowLeft, Plus, X, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800"
};
function ReturnsPage() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fetchReturns = () => {
    api.get("/api/returns").then((res) => setReturns(res.data)).catch(() => setReturns([])).finally(() => setLoading(false));
  };
  useEffect(() => {
    fetchReturns();
  }, []);
  const createReturn = async () => {
    if (!orderId.trim() || !reason.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/api/returns", { order_id: orderId, reason, description: description || void 0 });
      setShowForm(false);
      setOrderId("");
      setReason("");
      setDescription("");
      fetchReturns();
    } catch (e) {
      alert(errorMessage(e, "Failed to create return request"));
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Returns", children: [
    /* @__PURE__ */ jsx(Head, { title: "My Returns" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs(Link, { href: "/orders", className: "inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700", children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
          " Back to Orders"
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowForm(true),
            className: "inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
              " Request Return"
            ]
          }
        )
      ] }),
      showForm && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Request Return" }),
          /* @__PURE__ */ jsx("button", { onClick: () => setShowForm(false), children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Order ID *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: orderId,
                onChange: (e) => setOrderId(e.target.value),
                className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700",
                placeholder: "Paste order ID"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Reason *" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: reason,
                onChange: (e) => setReason(e.target.value),
                className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "Select reason" }),
                  /* @__PURE__ */ jsx("option", { value: "damaged", children: "Item arrived damaged" }),
                  /* @__PURE__ */ jsx("option", { value: "wrong_item", children: "Wrong item received" }),
                  /* @__PURE__ */ jsx("option", { value: "not_as_described", children: "Not as described" }),
                  /* @__PURE__ */ jsx("option", { value: "defective", children: "Product defective" }),
                  /* @__PURE__ */ jsx("option", { value: "changed_mind", children: "Changed my mind" }),
                  /* @__PURE__ */ jsx("option", { value: "other", children: "Other" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Description" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: description,
                onChange: (e) => setDescription(e.target.value),
                rows: 3,
                className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700",
                placeholder: "Additional details..."
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex gap-3", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => setShowForm(false), className: "flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50", children: "Cancel" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: createReturn,
              disabled: submitting || !orderId.trim() || !reason.trim(),
              className: "flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50",
              children: submitting ? "Submitting..." : "Submit Request"
            }
          )
        ] })
      ] }) }),
      loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) }) : returns.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(RotateCcw, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No return requests" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-500", children: "You haven't requested any returns yet." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: returns.map((ret) => {
        var _a;
        return /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
              "Order #",
              ((_a = ret.order) == null ? void 0 : _a.order_number) ?? ret.order_id.slice(0, 8)
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 font-medium text-gray-900 dark:text-white", children: ret.reason }),
            ret.description && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: ret.description }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-gray-400", children: formatDateTime(ret.created_at) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("span", { className: `rounded-full px-3 py-1 text-xs font-medium ${statusColors[ret.status] ?? "bg-gray-100 text-gray-800"}`, children: ret.status }),
            ret.refund_amount != null && /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm font-semibold text-green-600", children: [
              "Refund: ",
              formatCurrency(ret.refund_amount)
            ] })
          ] })
        ] }) }, ret.id);
      }) })
    ] })
  ] });
}
export {
  ReturnsPage as default
};
