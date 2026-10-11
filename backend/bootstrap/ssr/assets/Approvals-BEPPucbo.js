import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { a as formatDateTime, f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { toast } from "sonner";
import { ShieldCheck, PackageSearch, CheckCircle2, XCircle, History } from "lucide-react";
import "clsx";
function AdminApprovals({ pending, recentDecisions }) {
  const [busyId, setBusyId] = useState(null);
  const decide = async (id, action) => {
    let reason = null;
    if (action === "reject") {
      reason = window.prompt("Reason for rejection (stored in the audit trail):");
      if (reason === null) return;
    }
    setBusyId(id);
    try {
      await api.post(
        `/api/admin/products/${id}/${action}`,
        action === "reject" ? { reason: reason || null } : {}
      );
      toast.success(action === "approve" ? "Approved and published" : "Rejected");
      router.reload({ only: ["pending", "recentDecisions"] });
    } catch (err) {
      toast.error(errorMessage(err, "Action failed"));
    } finally {
      setBusyId(null);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Admin · Approvals", children: [
    /* @__PURE__ */ jsx(Head, { title: "Product approvals" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("span", { className: "flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100", children: /* @__PURE__ */ jsx(ShieldCheck, { className: "h-6 w-6 text-amber-600" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Product Approvals" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
            pending.length,
            " submission",
            pending.length === 1 ? "" : "s",
            " awaiting review"
          ] })
        ] })
      ] }),
      pending.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "mb-8 rounded-xl border border-dashed border-gray-300 p-14 text-center dark:border-gray-600", children: [
        /* @__PURE__ */ jsx(PackageSearch, { className: "mx-auto mb-3 h-10 w-10 text-gray-300" }),
        /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "Queue is clear" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "New vendor submissions will appear here." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "mb-8 space-y-3", children: pending.map((p) => /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: p.name }),
          /* @__PURE__ */ jsxs("p", { className: "mt-0.5 text-xs text-gray-500", children: [
            p.vendor_name ?? "Unknown vendor",
            " · ",
            p.category,
            " · stock ",
            p.stock_quantity
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-gray-400", children: [
            "submitted ",
            formatDateTime(p.created_at)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx("span", { className: "font-bold text-indigo-600", children: formatCurrency(Number(p.price)) }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              disabled: busyId === p.id,
              onClick: () => decide(p.id, "approve"),
              className: "flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50",
              children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3.5 w-3.5" }),
                " Approve"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              disabled: busyId === p.id,
              onClick: () => decide(p.id, "reject"),
              className: "flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50",
              children: [
                /* @__PURE__ */ jsx(XCircle, { className: "h-3.5 w-3.5" }),
                " Reject"
              ]
            }
          )
        ] })
      ] }, p.id)) }),
      /* @__PURE__ */ jsxs("h2", { className: "mb-3 flex items-center gap-2 font-bold text-gray-900 dark:text-white", children: [
        /* @__PURE__ */ jsx(History, { className: "h-5 w-5" }),
        " Recent rejections"
      ] }),
      recentDecisions.length === 0 ? /* @__PURE__ */ jsx("p", { className: "rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-400 dark:bg-gray-700/40", children: "No rejections recorded." }) : /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: recentDecisions.map((d) => /* @__PURE__ */ jsxs("li", { className: "rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: d.product_name }),
        d.reason && /* @__PURE__ */ jsxs("span", { className: "text-gray-500", children: [
          " — “",
          d.reason,
          "”"
        ] }),
        /* @__PURE__ */ jsx("span", { className: "ml-2 text-xs text-gray-400", children: formatDateTime(d.created_at) })
      ] }, d.id)) })
    ] })
  ] });
}
export {
  AdminApprovals as default
};
