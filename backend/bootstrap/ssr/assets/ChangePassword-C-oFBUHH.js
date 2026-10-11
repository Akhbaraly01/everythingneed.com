import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { Lock } from "lucide-react";
import { useState } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function AccountChangePassword() {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    if (password !== confirmation) {
      alert("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/auth/change-password", { current_password: current, password, password_confirmation: confirmation });
      alert("Password changed successfully");
      setCurrent("");
      setPassword("");
      setConfirmation("");
    } catch (e) {
      alert(errorMessage(e, "Failed to change password"));
    }
    setSaving(false);
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Change Password", children: [
    /* @__PURE__ */ jsx(Head, { title: "Change Password" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-lg space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Change Password" }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Current Password" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "password",
                value: current,
                onChange: (e) => setCurrent(e.target.value),
                className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "New Password" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "password",
                value: password,
                onChange: (e) => setPassword(e.target.value),
                className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Confirm New Password" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "password",
                value: confirmation,
                onChange: (e) => setConfirmation(e.target.value),
                className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleSave,
            disabled: saving || !current || !password || !confirmation,
            className: "mt-6 flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50",
            children: [
              /* @__PURE__ */ jsx(Lock, { className: "h-4 w-4" }),
              " ",
              saving ? "Saving..." : "Update Password"
            ]
          }
        )
      ] })
    ] })
  ] });
}
export {
  AccountChangePassword as default
};
