import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { a as formatDateTime } from "./PushNotificationPrompt-DvDsnr4H.js";
import { ArrowLeft, Plus, X, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
const statusColors = {
  open: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800"
};
function DisputesPage() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fetchDisputes = () => {
    api.get("/api/disputes").then((res) => setDisputes(res.data)).catch(() => setDisputes([])).finally(() => setLoading(false));
  };
  useEffect(() => {
    fetchDisputes();
  }, []);
  const createDispute = async () => {
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/api/disputes", {
        order_id: orderId || void 0,
        subject,
        description
      });
      setShowForm(false);
      setOrderId("");
      setSubject("");
      setDescription("");
      fetchDisputes();
    } catch (e) {
      alert(errorMessage(e, "Failed to create dispute"));
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Disputes", children: [
    /* @__PURE__ */ jsx(Head, { title: "My Disputes" }),
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
              " Open Dispute"
            ]
          }
        )
      ] }),
      showForm && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Open Dispute" }),
          /* @__PURE__ */ jsx("button", { onClick: () => setShowForm(false), children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Order ID (optional)" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: orderId,
                onChange: (e) => setOrderId(e.target.value),
                className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700",
                placeholder: "Paste order ID if related to an order"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Subject *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: subject,
                onChange: (e) => setSubject(e.target.value),
                className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700",
                placeholder: "Brief summary of the issue"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Description *" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: description,
                onChange: (e) => setDescription(e.target.value),
                rows: 4,
                className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700",
                placeholder: "Describe the issue in detail..."
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex gap-3", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => setShowForm(false), className: "flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50", children: "Cancel" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: createDispute,
              disabled: submitting || !subject.trim() || !description.trim(),
              className: "flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50",
              children: submitting ? "Submitting..." : "Submit Dispute"
            }
          )
        ] })
      ] }) }),
      loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) }) : disputes.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No disputes" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-500", children: "You haven't filed any disputes." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: disputes.map((d) => /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          d.order && /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
            "Order #",
            d.order.order_number
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 font-medium text-gray-900 dark:text-white", children: d.subject }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: d.description }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-gray-400", children: formatDateTime(d.created_at) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsx("span", { className: `rounded-full px-3 py-1 text-xs font-medium ${statusColors[d.status] ?? "bg-gray-100 text-gray-800"}`, children: d.status }),
          d.resolution && /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-gray-600", children: [
            "Resolved: ",
            d.resolution
          ] })
        ] })
      ] }) }, d.id)) })
    ] })
  ] });
}
export {
  DisputesPage as default
};
