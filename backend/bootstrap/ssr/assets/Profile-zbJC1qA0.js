import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { usePage, Head, router } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { Camera } from "lucide-react";
import { useState } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function AccountProfile() {
  const { auth } = usePage().props;
  const [name, setName] = useState(auth.user.name);
  const [phone, setPhone] = useState(auth.user.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.put("/api/profile", { full_name: name, phone });
      router.reload({ only: ["auth"] });
      setSaved(true);
    } catch (e) {
      alert(errorMessage(e, "Failed to save"));
    }
    setSaving(false);
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "My Profile", children: [
    /* @__PURE__ */ jsx(Head, { title: "My Profile" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-2xl space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "My Profile" }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative h-20 w-20 rounded-full bg-gray-200", children: [
            auth.user.avatar_url ? /* @__PURE__ */ jsx("img", { src: auth.user.avatar_url, alt: "", className: "h-full w-full rounded-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center text-2xl font-bold text-gray-500", children: auth.user.name.charAt(0).toUpperCase() }),
            /* @__PURE__ */ jsx("button", { className: "absolute bottom-0 right-0 rounded-full bg-indigo-600 p-1.5 text-white hover:bg-indigo-500", children: /* @__PURE__ */ jsx(Camera, { className: "h-3 w-3" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900 dark:text-white", children: auth.user.name }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: auth.user.email })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Full Name" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: name,
                onChange: (e) => setName(e.target.value),
                className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Email" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                value: auth.user.email,
                readOnly: true,
                title: "Email cannot be changed here",
                className: "mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Phone" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "tel",
                value: phone,
                onChange: (e) => setPhone(e.target.value),
                className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleSave,
            disabled: saving,
            className: "mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50",
            children: saving ? "Saving..." : "Save Changes"
          }
        ),
        saved && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-green-600", children: "Profile saved." })
      ] })
    ] })
  ] });
}
export {
  AccountProfile as default
};
