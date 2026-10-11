import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { Key, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function PermissionsIndex() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/admin/permissions").then((res) => setPermissions(res.data)).catch(() => setPermissions([])).finally(() => setLoading(false));
  }, []);
  const grouped = permissions.reduce((acc, p) => {
    const cat = p.category ?? "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Permissions", children: [
    /* @__PURE__ */ jsx(Head, { title: "Permissions" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Key, { className: "h-6 w-6" }),
        " Permissions"
      ] }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : permissions.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Shield, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No permissions found" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-6", children: Object.entries(grouped).map(([cat, perms]) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white capitalize", children: cat }),
        /* @__PURE__ */ jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: perms.map((p) => /* @__PURE__ */ jsx("span", { className: "rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400", children: p.name }, p.id)) })
      ] }, cat)) })
    ] })
  ] });
}
export {
  PermissionsIndex as default
};
