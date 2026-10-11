import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, router } from "@inertiajs/react";
import { f as formatCurrency, a as formatDateTime } from "./PushNotificationPrompt-DvDsnr4H.js";
import { CreditCard, Plus, Minus, X, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { a as api } from "./api-Dp2ndEHF.js";
import "clsx";
import "sonner";
function WalletPage({ wallet, transactions }) {
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const handleDeposit = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) return;
    setProcessing(true);
    try {
      await api.post("/api/wallet/deposit", { amount: value });
      setShowDeposit(false);
      setAmount("");
      router.reload({ only: ["wallet", "transactions"] });
    } catch {
    } finally {
      setProcessing(false);
    }
  };
  const handleWithdraw = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0 || value > wallet.balance) return;
    setProcessing(true);
    try {
      await api.post("/api/wallet/withdraw", { amount: value });
      setShowWithdraw(false);
      setAmount("");
      router.reload({ only: ["wallet", "transactions"] });
    } catch {
    } finally {
      setProcessing(false);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Wallet", children: [
    /* @__PURE__ */ jsx(Head, { title: "Wallet" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-lg", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-indigo-100", children: "Available Balance" }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-4xl font-bold", children: formatCurrency(wallet.balance) }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-indigo-200", children: wallet.currency })
          ] }),
          /* @__PURE__ */ jsx(CreditCard, { className: "h-12 w-12 text-indigo-200" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex gap-3", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => {
                setShowDeposit(true);
                setAmount("");
              },
              className: "flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30",
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
                "Deposit"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => {
                setShowWithdraw(true);
                setAmount("");
              },
              className: "flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30",
              children: [
                /* @__PURE__ */ jsx(Minus, { className: "h-4 w-4" }),
                "Withdraw"
              ]
            }
          )
        ] })
      ] }),
      showDeposit && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Deposit Funds" }),
          /* @__PURE__ */ jsx("button", { onClick: () => setShowDeposit(false), children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Amount" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              min: "1",
              step: "0.01",
              value: amount,
              onChange: (e) => setAmount(e.target.value),
              className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700",
              placeholder: "0.00"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex gap-3", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => setShowDeposit(false), className: "flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50", children: "Cancel" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleDeposit,
              disabled: processing || !amount || parseFloat(amount) <= 0,
              className: "flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50",
              children: processing ? "Processing..." : "Deposit"
            }
          )
        ] })
      ] }) }),
      showWithdraw && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Withdraw Funds" }),
          /* @__PURE__ */ jsx("button", { onClick: () => setShowWithdraw(false), children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" }) })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-gray-500", children: [
          "Available: ",
          formatCurrency(wallet.balance)
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Amount" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              min: "1",
              max: wallet.balance,
              step: "0.01",
              value: amount,
              onChange: (e) => setAmount(e.target.value),
              className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700",
              placeholder: "0.00"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 flex gap-3", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => setShowWithdraw(false), className: "flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50", children: "Cancel" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleWithdraw,
              disabled: processing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > wallet.balance,
              className: "flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50",
              children: processing ? "Processing..." : "Withdraw"
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("div", { className: "border-b border-gray-200 px-6 py-4 dark:border-gray-700", children: /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Transactions" }) }),
        transactions.data.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-12 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "No transactions yet" }) }) : /* @__PURE__ */ jsx("div", { className: "divide-y dark:divide-gray-700", children: transactions.data.map((tx) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-6 py-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: `rounded-full p-2 ${tx.type === "credit" ? "bg-green-100" : "bg-red-100"}`, children: tx.type === "credit" ? /* @__PURE__ */ jsx(ArrowDownLeft, { className: "h-4 w-4 text-green-600" }) : /* @__PURE__ */ jsx(ArrowUpRight, { className: "h-4 w-4 text-red-600" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: tx.description ?? tx.type }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: formatDateTime(tx.created_at) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: `text-sm font-semibold ${tx.type === "credit" ? "text-green-600" : "text-red-600"}`, children: [
            tx.type === "credit" ? "+" : "-",
            formatCurrency(tx.amount)
          ] })
        ] }, tx.id)) })
      ] })
    ] })
  ] });
}
export {
  WalletPage as default
};
