import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { usePage, router, useForm, Head } from "@inertiajs/react";
import { useState } from "react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { toast } from "sonner";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "lucide-react";
import "clsx";
function TwoFactorCard() {
  const auth = usePage().props.auth;
  const enabled = !!(auth == null ? void 0 : auth.two_factor_enabled);
  const [busy, setBusy] = useState(false);
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState("");
  const refreshAuth = () => router.reload({ only: ["auth"] });
  const handleEnable = async () => {
    setBusy(true);
    try {
      const res = await api.post("/api/auth/2fa/enable");
      setSetup(res.data);
      setCode("");
    } catch (e) {
      toast.error(errorMessage(e, "Failed to start 2FA setup"));
    } finally {
      setBusy(false);
    }
  };
  const handleVerify = async () => {
    if (!/^\d{6}$/.test(code)) {
      toast.error("Enter the 6-digit code from your authenticator app");
      return;
    }
    setBusy(true);
    try {
      await api.post("/api/auth/2fa/verify", { code });
      toast.success("Two-factor authentication enabled");
      setSetup(null);
      setCode("");
      refreshAuth();
    } catch (e) {
      toast.error(errorMessage(e, "Verification failed"));
    } finally {
      setBusy(false);
    }
  };
  const handleDisable = async () => {
    setBusy(true);
    try {
      await api.post("/api/auth/2fa/disable");
      toast.success("Two-factor authentication disabled");
      setSetup(null);
      refreshAuth();
    } catch (e) {
      toast.error(errorMessage(e, "Failed to disable 2FA"));
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-gray-200 p-4 dark:border-gray-700", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: "Two-Factor Authentication" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: enabled ? "2FA is enabled — a 6-digit code is required at login." : "Add an extra layer of security using a TOTP authenticator app." })
      ] }),
      !setup && (enabled ? /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleDisable,
          disabled: busy,
          className: "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600",
          children: busy ? "Disabling..." : "Disable"
        }
      ) : /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleEnable,
          disabled: busy,
          className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50",
          children: busy ? "Starting..." : "Enable"
        }
      ))
    ] }),
    setup && /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-4 border-t border-gray-200 pt-4 dark:border-gray-700", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 sm:flex-row", children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: setup.qr_code_url,
            alt: "Scan this QR code with your authenticator app",
            className: "h-40 w-40 rounded-lg border border-gray-200 dark:border-gray-700"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-2", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: "Scan or enter this secret" }),
          /* @__PURE__ */ jsx("p", { className: "break-all rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200", children: setup.secret }),
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "6-digit verification code" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              inputMode: "numeric",
              autoComplete: "one-time-code",
              maxLength: 6,
              value: code,
              onChange: (e) => setCode(e.target.value.replace(/\D/g, "")),
              placeholder: "000000",
              className: "block w-36 rounded-lg border border-gray-300 px-3 py-2 font-mono tracking-widest focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleVerify,
            disabled: busy,
            className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50",
            children: busy ? "Verifying..." : "Verify & Enable"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              setSetup(null);
              setCode("");
            },
            disabled: busy,
            className: "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600",
            children: "Cancel"
          }
        )
      ] })
    ] })
  ] });
}
function Settings({ user, settings }) {
  const [activeTab, setActiveTab] = useState("general");
  const [processing, setProcessing] = useState(false);
  const [saved, setSaved] = useState(false);
  const { data, setData } = useForm({
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    language: settings.language,
    currency: settings.currency,
    email_notifications: settings.email_notifications,
    push_notifications: settings.push_notifications,
    marketing_emails: settings.marketing_emails
  });
  const saveSettings = async (entries) => {
    await api.put(`/api/users/${user.id}/settings`, { settings: entries });
  };
  const handleSaveGeneral = async () => {
    setProcessing(true);
    setSaved(false);
    try {
      await api.put("/api/profile", { full_name: data.name, phone: data.phone });
      await saveSettings([
        { key: "general.language", value: data.language },
        { key: "general.currency", value: data.currency }
      ]);
      setSaved(true);
    } catch {
      alert("Failed to save settings");
    } finally {
      setProcessing(false);
    }
  };
  const handleSaveNotifications = async () => {
    setProcessing(true);
    setSaved(false);
    try {
      await saveSettings([
        { key: "notifications.email_notifications", value: data.email_notifications ? "1" : "0" },
        { key: "notifications.push_notifications", value: data.push_notifications ? "1" : "0" },
        { key: "notifications.marketing_emails", value: data.marketing_emails ? "1" : "0" }
      ]);
      setSaved(true);
    } catch {
      alert("Failed to save preferences");
    } finally {
      setProcessing(false);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Settings", children: [
    /* @__PURE__ */ jsx(Head, { title: "Settings" }),
    /* @__PURE__ */ jsx("div", { className: "max-w-4xl", children: /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white shadow dark:bg-gray-800", children: [
      /* @__PURE__ */ jsx("div", { className: "border-b border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsx("nav", { className: "flex gap-6 px-6", children: ["general", "notifications", "security"].map((tab) => /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setActiveTab(tab),
          className: `border-b-2 py-4 text-sm font-medium capitalize ${activeTab === tab ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`,
          children: tab
        },
        tab
      )) }) }),
      /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
        activeTab === "general" && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white", children: "Profile" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Update your profile information." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Name" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: data.name,
                  onChange: (e) => setData("name", e.target.value),
                  className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Email" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "email",
                  value: data.email,
                  onChange: (e) => setData("email", e.target.value),
                  className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Phone" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: data.phone,
                  onChange: (e) => setData("phone", e.target.value),
                  className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Language" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: data.language,
                    onChange: (e) => setData("language", e.target.value),
                    className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "en", children: "English" }),
                      /* @__PURE__ */ jsx("option", { value: "es", children: "Spanish" }),
                      /* @__PURE__ */ jsx("option", { value: "fr", children: "French" })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Currency" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: data.currency,
                    onChange: (e) => setData("currency", e.target.value),
                    className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "USD", children: "USD" }),
                      /* @__PURE__ */ jsx("option", { value: "EUR", children: "EUR" }),
                      /* @__PURE__ */ jsx("option", { value: "GBP", children: "GBP" })
                    ]
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleSaveGeneral,
              disabled: processing,
              className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50",
              children: [
                processing ? "Saving..." : "Save Changes",
                saved && activeTab === "general" ? " ?" : ""
              ]
            }
          )
        ] }),
        activeTab === "notifications" && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white", children: "Notification Preferences" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Choose what notifications you receive." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-4", children: [
            { key: "email_notifications", name: "Email notifications", description: "Receive notifications via email" },
            { key: "push_notifications", name: "Push notifications", description: "Receive push notifications in browser" },
            { key: "marketing_emails", name: "Marketing emails", description: "Receive deals and promotional offers" }
          ].map((item) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: item.name }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: item.description })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "relative inline-flex cursor-pointer items-center", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  className: "peer sr-only",
                  checked: data[item.key],
                  onChange: (e) => setData(item.key, e.target.checked)
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white" })
            ] })
          ] }, item.key)) }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleSaveNotifications,
              disabled: processing,
              className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50",
              children: [
                processing ? "Saving..." : "Save Preferences",
                saved && activeTab === "notifications" ? " ?" : ""
              ]
            }
          )
        ] }),
        activeTab === "security" && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white", children: "Security Settings" }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Manage your account security." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsx("div", { className: "rounded-lg border border-gray-200 p-4 dark:border-gray-700", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: "Change Password" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Update your password regularly." })
              ] }),
              /* @__PURE__ */ jsx(
                "a",
                {
                  href: "/forgot-password",
                  className: "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600",
                  children: "Change"
                }
              )
            ] }) }),
            /* @__PURE__ */ jsx(TwoFactorCard, {})
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  Settings as default
};
