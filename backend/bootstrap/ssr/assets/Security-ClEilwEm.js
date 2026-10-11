import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { Shield } from "lucide-react";
import { useState } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function SettingsSecurity() {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const handleChangePassword = async () => {
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
      alert("Password changed");
      setCurrent("");
      setPassword("");
      setConfirmation("");
    } catch (e) {
      alert(errorMessage(e, "Failed"));
    }
    setSaving(false);
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Security Settings", children: [
    /* @__PURE__ */ jsx(Head, { title: "Security Settings" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-lg space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Security Settings" }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("h2", { className: "font-semibold text-gray-900 dark:text-white flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Shield, { className: "h-5 w-5" }),
          " Change Password"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-4", children: [
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
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Confirm" }),
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
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleChangePassword,
            disabled: saving || !current || !password,
            className: "mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50",
            children: saving ? "Saving..." : "Update Password"
          }
        )
      ] })
    ] })
  ] });
}
export {
  SettingsSecurity as default
};
