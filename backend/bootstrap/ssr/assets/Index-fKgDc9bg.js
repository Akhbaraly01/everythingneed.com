import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { a as formatDateTime, f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function PaymentsIndex() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/payments").then((res) => setPayments(res.data)).catch(() => setPayments([])).finally(() => setLoading(false));
  }, []);
  const statusColors = {
    completed: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-orange-100 text-orange-800"
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Payments", children: [
    /* @__PURE__ */ jsx(Head, { title: "Payments" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Payment History" }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : payments.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(CreditCard, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No payments yet" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: payments.map((p) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: p.description ?? "Payment" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: formatDateTime(p.created_at) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[p.status] ?? "bg-gray-100 text-gray-800"}`, children: p.status }),
          /* @__PURE__ */ jsx("span", { className: "font-bold text-gray-900 dark:text-white", children: formatCurrency(p.amount) })
        ] })
      ] }, p.id)) })
    ] })
  ] });
}
export {
  PaymentsIndex as default
};
