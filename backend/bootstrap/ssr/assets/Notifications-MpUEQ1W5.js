import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { usePage, Head } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "lucide-react";
import "clsx";
import "sonner";
function SettingsNotifications() {
  var _a;
  const [prefs, setPrefs] = useState({
    email_orders: true,
    email_promotions: false,
    email_tickets: true,
    push_orders: true,
    push_messages: true
  });
  const [saving, setSaving] = useState(false);
  const { props } = usePage();
  const authUser = (_a = props.auth) == null ? void 0 : _a.user;
  useEffect(() => {
    if (!(authUser == null ? void 0 : authUser.id)) return;
    api.get(`/api/users/${authUser.id}/settings`).then((res) => {
      const stored = res.data ?? {};
      setPrefs((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          const key = `notifications.${k}`;
          if (stored[key] === "1") next[k] = true;
          if (stored[key] === "0") next[k] = false;
        });
        return next;
      });
    }).catch(() => {
    });
  }, [authUser == null ? void 0 : authUser.id]);
  const handleSave = async () => {
    if (!(authUser == null ? void 0 : authUser.id)) return;
    setSaving(true);
    try {
      await api.put(`/api/users/${authUser.id}/settings`, {
        settings: Object.keys(prefs).map((k) => ({
          key: `notifications.${k}`,
          value: prefs[k] ? "1" : "0"
        }))
      });
      alert("Preferences saved");
    } catch (e) {
      alert(errorMessage(e, "Failed"));
    }
    setSaving(false);
  };
  const toggle = (key) => setPrefs({ ...prefs, [key]: !prefs[key] });
  const rows = [
    { key: "email_orders", label: "Email me about order updates" },
    { key: "email_promotions", label: "Email me about promotions" },
    { key: "email_tickets", label: "Email me about support tickets" },
    { key: "push_orders", label: "Push notifications for orders" },
    { key: "push_messages", label: "Push notifications for messages" }
  ];
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Notification Preferences", children: [
    /* @__PURE__ */ jsx(Head, { title: "Notification Preferences" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-lg space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Notification Preferences" }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("div", { className: "space-y-4", children: rows.map((r) => /* @__PURE__ */ jsxs("label", { className: "flex items-center justify-between cursor-pointer", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300", children: r.label }),
          /* @__PURE__ */ jsx("button", { onClick: () => toggle(r.key), className: `relative h-6 w-11 rounded-full transition ${prefs[r.key] ? "bg-indigo-600" : "bg-gray-300"}`, children: /* @__PURE__ */ jsx("span", { className: `absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition ${prefs[r.key] ? "translate-x-5" : ""}` }) })
        ] }, r.key)) }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleSave,
            disabled: saving,
            className: "mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50",
            children: saving ? "Saving..." : "Save Preferences"
          }
        )
      ] })
    ] })
  ] });
}
export {
  SettingsNotifications as default
};
