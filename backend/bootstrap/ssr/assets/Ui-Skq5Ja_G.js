import { jsxs, jsx } from "react/jsx-runtime";
function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  onConfirm,
  onCancel
}) {
  if (!open) return null;
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/50", onClick: onCancel }),
    /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800", role: "dialog", "aria-modal": "true", children: [
      /* @__PURE__ */ jsx("h2", { className: "font-bold text-gray-900 dark:text-white", children: title }),
      description && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: description }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 flex justify-end gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: onCancel, disabled: busy, className: "rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400", children: cancelLabel }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onConfirm,
            disabled: busy,
            className: `rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${danger ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"}`,
            children: busy ? "Working…" : confirmLabel
          }
        )
      ] })
    ] })
  ] });
}
function EmptyState({ icon, title, description, action }) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-gray-300 p-14 text-center dark:border-gray-600", children: [
    icon && /* @__PURE__ */ jsx("div", { className: "mx-auto mb-3 w-fit text-gray-300", children: icon }),
    /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: title }),
    description && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: description }),
    action && /* @__PURE__ */ jsx("div", { className: "mt-4", children: action })
  ] });
}
const badgeTones = {
  green: "bg-green-100 text-green-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-800",
  indigo: "bg-indigo-100 text-indigo-800",
  gray: "bg-gray-100 text-gray-600"
};
function StatusBadge({ status, tone = "gray" }) {
  return /* @__PURE__ */ jsx("span", { className: `inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badgeTones[tone]}`, children: status.replace(/_/g, " ") });
}
export {
  ConfirmDialog as C,
  EmptyState as E,
  StatusBadge as S
};
