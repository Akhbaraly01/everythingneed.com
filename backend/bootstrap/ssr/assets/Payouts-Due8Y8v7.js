import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency, a as formatDateTime } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Wallet, CheckCircle, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function AdminPayouts() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/admin/finance/withdrawals").then((res) => setPayouts((res.data ?? []).map((p) => ({
      ...p,
      vendor_name: p.vendor_name ?? "Vendor"
    })))).catch(() => setPayouts([])).finally(() => setLoading(false));
  }, []);
  const processPayout = async (id) => {
    try {
      await api.post(`/api/admin/finance/withdrawals/${id}/process`);
      setPayouts(payouts.map((p) => p.id === id ? { ...p, status: "completed", processed_at: (/* @__PURE__ */ new Date()).toISOString() } : p));
    } catch {
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Vendor Payouts", children: [
    /* @__PURE__ */ jsx(Head, { title: "Vendor Payouts" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Vendor Payouts" }),
      loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) }) : payouts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Wallet, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No payout requests" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Vendor" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Amount" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Method" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Requested" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y dark:divide-gray-700", children: payouts.map((p) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium text-gray-900 dark:text-white", children: p.vendor_name }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-semibold", children: formatCurrency(p.amount) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${p.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`, children: [
            p.status === "completed" ? /* @__PURE__ */ jsx(CheckCircle, { className: "h-3 w-3" }) : /* @__PURE__ */ jsx(Clock, { className: "h-3 w-3" }),
            p.status
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-sm text-gray-500", children: p.method ?? "Bank Transfer" }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-gray-500", children: formatDateTime(p.created_at) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: p.status === "pending" && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => processPayout(p.id),
              className: "rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-500",
              children: "Process"
            }
          ) })
        ] }, p.id)) })
      ] }) })
    ] })
  ] });
}
export {
  AdminPayouts as default
};
