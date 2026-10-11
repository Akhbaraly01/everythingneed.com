import { jsx, jsxs } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { Settings } from "lucide-react";
import { useState, useEffect } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/admin/settings").then((data) => setSettings(data)).catch(() => setSettings(null)).finally(() => setLoading(false));
  }, []);
  if (loading) return /* @__PURE__ */ jsx(AppLayout, { title: "Admin Settings", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." }) });
  if (!settings) return /* @__PURE__ */ jsx(AppLayout, { title: "Admin Settings", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-red-500", children: "Failed to load" }) });
  const Toggle = ({ label, value }) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between py-2", children: [
    /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300", children: label }),
    /* @__PURE__ */ jsx("span", { className: `text-xs font-medium px-2 py-0.5 rounded-full ${value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`, children: value ? "ON" : "OFF" })
  ] });
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Admin Settings", children: [
    /* @__PURE__ */ jsx(Head, { title: "Admin Settings" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-2xl space-y-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Settings, { className: "h-6 w-6" }),
        " Admin Settings"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white", children: "General" }),
        /* @__PURE__ */ jsxs("div", { className: "divide-y dark:divide-gray-700", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between py-3", children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-600", children: "Site Name" }),
            /* @__PURE__ */ jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: settings.site_name })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between py-3", children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-600", children: "Currency" }),
            /* @__PURE__ */ jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: settings.currency })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between py-3", children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-600", children: "Timezone" }),
            /* @__PURE__ */ jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: settings.timezone })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white", children: "Feature Toggles" }),
        /* @__PURE__ */ jsxs("div", { className: "divide-y dark:divide-gray-700", children: [
          /* @__PURE__ */ jsx(Toggle, { label: "Maintenance Mode", value: settings.maintenance_mode }),
          /* @__PURE__ */ jsx(Toggle, { label: "Registration Open", value: settings.registration_open }),
          /* @__PURE__ */ jsx(Toggle, { label: "Email Verification Required", value: settings.email_verification_required })
        ] })
      ] })
    ] })
  ] });
}
export {
  AdminSettings as default
};
