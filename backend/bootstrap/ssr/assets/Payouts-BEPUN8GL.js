import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { f as formatCurrency, a as formatDateTime } from "./PushNotificationPrompt-DvDsnr4H.js";
import { toast } from "sonner";
import { Wallet, BanknoteIcon, Clock, CheckCircle2, XCircle } from "lucide-react";
import "clsx";
const statusStyles = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700"
};
function VendorPayouts() {
  const [summary, setSummary] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([
        api.get("/api/vendor/earnings"),
        api.get("/api/vendor/payouts")
      ]);
      setSummary(s.data);
      setWithdrawals(p.data);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to load earnings"));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const requestPayout = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/api/vendor/payouts/request", { amount: Number(amount) });
      toast.success("Payout requested");
      setAmount("");
      await load();
      router.reload({ only: [] });
    } catch (err) {
      toast.error(errorMessage(err, "Request failed"));
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Vendor payouts", children: [
    /* @__PURE__ */ jsx(Head, { title: "Earnings & payouts" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("span", { className: "flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100", children: /* @__PURE__ */ jsx(Wallet, { className: "h-6 w-6 text-emerald-600" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Earnings & Payouts" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Commission accrues when orders are delivered (platform fee 10%)" })
        ] })
      ] }),
      loading ? /* @__PURE__ */ jsx("p", { className: "py-16 text-center text-sm text-gray-400", children: "Loading…" }) : summary && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4", children: [
          /* @__PURE__ */ jsx(Card, { icon: /* @__PURE__ */ jsx(BanknoteIcon, { className: "h-5 w-5" }), label: "Total earned", value: formatCurrency(summary.total_earned) }),
          /* @__PURE__ */ jsx(Card, { icon: /* @__PURE__ */ jsx(Clock, { className: "h-5 w-5" }), label: "Pending withdrawals", value: formatCurrency(summary.pending_withdrawals) }),
          /* @__PURE__ */ jsx(Card, { icon: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5" }), label: "Withdrawn", value: formatCurrency(summary.withdrawn) }),
          /* @__PURE__ */ jsx(Card, { icon: /* @__PURE__ */ jsx(Wallet, { className: "h-5 w-5" }), label: "Available", value: formatCurrency(summary.available), highlight: true })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: requestPayout, className: "mb-8 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxs("label", { className: "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300", children: [
              "Request withdrawal (available: ",
              /* @__PURE__ */ jsx("strong", { children: formatCurrency(summary.available) }),
              ")"
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: 1,
                max: summary.available,
                step: "0.01",
                required: true,
                value: amount,
                onChange: (e) => setAmount(e.target.value),
                placeholder: "0.00",
                disabled: summary.available <= 0,
                className: "w-full rounded-lg border-gray-300 text-sm disabled:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: busy || Number(amount) > summary.available || summary.available <= 0,
              className: "rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50",
              children: busy ? "Requesting…" : "Request payout"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("h2", { className: "mb-3 font-bold text-gray-900 dark:text-white", children: "Withdrawal history" }),
        withdrawals.length === 0 ? /* @__PURE__ */ jsx("p", { className: "rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-400 dark:bg-gray-700/40", children: "No withdrawals yet." }) : /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: withdrawals.map((w) => /* @__PURE__ */ jsxs("li", { className: "flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "font-semibold text-gray-900 dark:text-white", children: formatCurrency(Number(w.amount)) }),
            w.notes && /* @__PURE__ */ jsx("span", { className: "ml-2 text-xs text-gray-500", children: w.notes }),
            /* @__PURE__ */ jsx("p", { className: "text-[11px] text-gray-400", children: formatDateTime(w.created_at) })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: `flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[w.status] ?? ""}`, children: [
            w.status === "pending" && /* @__PURE__ */ jsx(Clock, { className: "h-3 w-3" }),
            w.status === "paid" && /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3 w-3" }),
            w.status === "rejected" && /* @__PURE__ */ jsx(XCircle, { className: "h-3 w-3" }),
            w.status
          ] })
        ] }, w.id)) })
      ] })
    ] })
  ] });
}
function Card({ icon, label, value, highlight }) {
  return /* @__PURE__ */ jsxs("div", { className: `rounded-xl border p-4 ${highlight ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30" : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"}`, children: [
    /* @__PURE__ */ jsx("div", { className: "mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600", children: icon }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: label }),
    /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-gray-900 dark:text-white", children: value })
  ] });
}
export {
  VendorPayouts as default
};
