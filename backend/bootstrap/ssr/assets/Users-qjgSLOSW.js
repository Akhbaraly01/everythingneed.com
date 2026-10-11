import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Link, Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { a as formatDateTime } from "./PushNotificationPrompt-DvDsnr4H.js";
import { useState, useCallback, useEffect } from "react";
import { Search, X, Home, ChevronRight } from "lucide-react";
import { S as StatusBadge } from "./Ui-Skq5Ja_G.js";
import "clsx";
import "sonner";
function DataTable({ columns, data, loading, emptyTitle = "No data", emptyDescription, emptyAction, onRowClick }) {
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-gray-500", children: "Loading..." })
    ] });
  }
  if (data.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
      /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: emptyTitle }),
      emptyDescription && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: emptyDescription }),
      emptyAction && /* @__PURE__ */ jsx("div", { className: "mt-4", children: emptyAction })
    ] });
  }
  return /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
    /* @__PURE__ */ jsx("thead", { className: "border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700", children: /* @__PURE__ */ jsx("tr", { children: columns.map((col) => /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-semibold text-gray-600 dark:text-gray-300", children: col.header }, col.key)) }) }),
    /* @__PURE__ */ jsx("tbody", { className: "divide-y dark:divide-gray-700", children: data.map((row, idx) => /* @__PURE__ */ jsx("tr", { onClick: () => onRowClick == null ? void 0 : onRowClick(row), className: onRowClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" : "", children: columns.map((col) => /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: col.render ? col.render(row) : col.accessor ? String(row[col.accessor] ?? "") : "" }, col.key)) }, typeof row.id === "string" ? row.id : idx)) })
  ] }) });
}
function SearchInput({ value, onChange, placeholder = "Search...", onSearch }) {
  return /* @__PURE__ */ jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" }),
    /* @__PURE__ */ jsx(
      "input",
      {
        value,
        onChange: (e) => onChange(e.target.value),
        onKeyDown: (e) => e.key === "Enter" && (onSearch == null ? void 0 : onSearch()),
        placeholder,
        className: "w-full rounded-lg border py-2 pl-9 pr-9 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      }
    ),
    value && /* @__PURE__ */ jsx("button", { onClick: () => onChange(""), className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600", children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) })
  ] });
}
function Breadcrumb({ items }) {
  return /* @__PURE__ */ jsxs("nav", { className: "flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400", children: [
    /* @__PURE__ */ jsx(Link, { href: "/dashboard", className: "hover:text-gray-700 dark:hover:text-gray-200", children: /* @__PURE__ */ jsx(Home, { className: "h-4 w-4" }) }),
    items.map((c, i) => /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
      /* @__PURE__ */ jsx(ChevronRight, { className: "h-3 w-3" }),
      c.href ? /* @__PURE__ */ jsx(Link, { href: c.href, className: "hover:text-gray-700 dark:hover:text-gray-200 hover:underline", children: c.label }) : /* @__PURE__ */ jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: c.label })
    ] }, i))
  ] });
}
function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const fetchUsers = useCallback(() => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    api.get(`/api/admin/users${params}`).then((res) => setUsers(res.data)).catch(() => setUsers([])).finally(() => setLoading(false));
  }, [search]);
  useEffect(() => {
    fetchUsers();
  }, [search, fetchUsers]);
  const toggleSuspend = async (userId, suspend) => {
    try {
      if (suspend) await api.post(`/api/admin/users/${userId}/suspend`);
      else await api.post(`/api/admin/users/${userId}/restore`);
      fetchUsers();
    } catch {
    }
  };
  const changeRole = async (userId, role) => {
    try {
      await api.put(`/api/admin/users/${userId}/role`, { role });
      fetchUsers();
    } catch {
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Manage Users", children: [
    /* @__PURE__ */ jsx(Head, { title: "Manage Users" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx(Breadcrumb, { items: [{ label: "Admin" }, { label: "Users" }] }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Manage Users" }),
      /* @__PURE__ */ jsx("div", { className: "max-w-md", children: /* @__PURE__ */ jsx(SearchInput, { value: search, onChange: setSearch, placeholder: "Search by name or email..." }) }),
      /* @__PURE__ */ jsx(
        DataTable,
        {
          loading,
          emptyTitle: "No users found",
          emptyDescription: "Try adjusting your search.",
          columns: [
            { key: "user", header: "User", render: (u) => /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: u.name }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: u.email })
            ] }) },
            { key: "role", header: "Role", render: (u) => /* @__PURE__ */ jsxs("select", { value: u.role, onChange: (e) => changeRole(u.id, e.target.value), className: "rounded border px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700", children: [
              /* @__PURE__ */ jsx("option", { value: "customer", children: "Customer" }),
              /* @__PURE__ */ jsx("option", { value: "vendor", children: "Vendor" }),
              /* @__PURE__ */ jsx("option", { value: "rider", children: "Rider" }),
              /* @__PURE__ */ jsx("option", { value: "admin", children: "Admin" }),
              /* @__PURE__ */ jsx("option", { value: "super_admin", children: "Super Admin" })
            ] }) },
            { key: "status", header: "Status", render: (u) => /* @__PURE__ */ jsx(StatusBadge, { status: u.is_suspended ? "Suspended" : "Active", tone: u.is_suspended ? "red" : "green" }) },
            { key: "joined", header: "Joined", render: (u) => /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-500", children: formatDateTime(u.created_at) }) },
            { key: "actions", header: "Actions", render: (u) => /* @__PURE__ */ jsx("button", { onClick: () => toggleSuspend(u.id, !u.is_suspended), className: `text-xs font-medium ${u.is_suspended ? "text-green-600" : "text-red-600"}`, children: u.is_suspended ? "Unsuspend" : "Suspend" }) }
          ],
          data: users
        }
      )
    ] })
  ] });
}
export {
  AdminUsers as default
};
