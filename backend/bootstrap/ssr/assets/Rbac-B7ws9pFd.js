import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { Head } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { toast } from "sonner";
import { ShieldCheck, Plus, Search, X } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
function AdminRbac({ catalog }) {
  const [matrix, setMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [roleFilter, setRoleFilter] = useState("");
  const [grantRole, setGrantRole] = useState("");
  const [grantPerm, setGrantPerm] = useState("");
  const load = async () => {
    try {
      const res = await api.get("/api/admin/rbac/matrix");
      setMatrix(res.data);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to load matrix"));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const filtered = useMemo(
    () => matrix.filter((r) => r.role.includes(roleFilter.toLowerCase())),
    [matrix, roleFilter]
  );
  const mutate = async (role, permission, action) => {
    setBusy(`${role}:${permission}`);
    try {
      await api.post(`/api/admin/rbac/${action}`, { role, permission });
      toast.success(`${action === "grant" ? "Granted" : "Revoked"} ${permission} ${action === "grant" ? "to" : "from"} ${role}`);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, "Action failed"));
    } finally {
      setBusy(null);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Admin · RBAC", children: [
    /* @__PURE__ */ jsx(Head, { title: "Roles & permissions" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("span", { className: "flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100", children: /* @__PURE__ */ jsx(ShieldCheck, { className: "h-6 w-6 text-violet-600" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Roles & Permissions" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
            catalog.length,
            " granular permissions across the platform"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex flex-wrap items-end gap-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("select", { value: grantRole, onChange: (e) => setGrantRole(e.target.value), className: "rounded-lg border-gray-300 text-sm capitalize dark:border-gray-600 dark:bg-gray-700 dark:text-white", children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "Select role…" }),
          matrix.map((r) => /* @__PURE__ */ jsx("option", { value: r.role, children: r.role.replace("_", " ") }, r.role))
        ] }),
        /* @__PURE__ */ jsxs("select", { value: grantPerm, onChange: (e) => setGrantPerm(e.target.value), className: "min-w-52 rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white", children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "Select permission…" }),
          catalog.map((p) => /* @__PURE__ */ jsx("option", { value: p, children: p }, p))
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            disabled: !grantRole || !grantPerm || busy !== null,
            onClick: () => mutate(grantRole, grantPerm, "grant").then(() => {
              setGrantRole("");
              setGrantPerm("");
            }),
            className: "flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
              " Grant"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative mb-4 max-w-xs", children: [
        /* @__PURE__ */ jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            value: roleFilter,
            onChange: (e) => setRoleFilter(e.target.value),
            placeholder: "Filter roles…",
            className: "w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          }
        )
      ] }),
      loading ? /* @__PURE__ */ jsx("p", { className: "py-10 text-center text-sm text-gray-400", children: "Loading matrix…" }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: filtered.map((row) => /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold capitalize text-gray-900 dark:text-white", children: row.role.replace("_", " ") }),
          /* @__PURE__ */ jsxs("span", { className: "rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300", children: [
            row.permissions.length,
            " permission",
            row.permissions.length === 1 ? "" : "s"
          ] })
        ] }),
        row.permissions.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400", children: "No explicit grants." }) : /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5", children: row.permissions.map((perm) => /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-violet-50 py-0.5 pl-2.5 pr-1 text-[11px] font-medium text-violet-800 dark:bg-violet-950/40 dark:text-violet-200", children: [
          perm,
          /* @__PURE__ */ jsx(
            "button",
            {
              disabled: busy !== null,
              onClick: () => mutate(row.role, perm, "revoke"),
              title: `Revoke ${perm}`,
              className: "rounded-full p-0.5 hover:bg-violet-200 disabled:opacity-40",
              children: /* @__PURE__ */ jsx(X, { className: "h-3 w-3" })
            }
          )
        ] }, perm)) })
      ] }, row.role)) })
    ] })
  ] });
}
export {
  AdminRbac as default
};
