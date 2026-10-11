import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { a as formatDateTime } from "./PushNotificationPrompt-DvDsnr4H.js";
import { CheckCheck, Bell, Check, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function NotificationsIndex() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchNotifications = () => {
    api.get("/api/notifications").then((res) => setNotifications(res.data)).catch(() => setNotifications([])).finally(() => setLoading(false));
  };
  useEffect(() => {
    fetchNotifications();
  }, []);
  const markAsRead = async (id) => {
    try {
      await api.post(`/api/notifications/${id}/read`);
      setNotifications(notifications.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch {
    }
  };
  const markAllRead = async () => {
    try {
      await api.post("/api/notifications/read-all");
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    } catch {
    }
  };
  const deleteNotification = async (id) => {
    try {
      await api.del(`/api/notifications/${id}`);
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch {
    }
  };
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Notifications", children: [
    /* @__PURE__ */ jsx(Head, { title: "Notifications" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up" }),
        unreadCount > 0 && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: markAllRead,
            className: "inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300",
            children: [
              /* @__PURE__ */ jsx(CheckCheck, { className: "h-4 w-4" }),
              " Mark all read"
            ]
          }
        )
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) }) : notifications.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Bell, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No notifications" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-500", children: "You're all caught up!" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: notifications.map((n) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: `flex items-start gap-4 rounded-lg bg-white p-4 shadow transition dark:bg-gray-800 ${!n.is_read ? "border-l-4 border-indigo-500" : ""}`,
          children: [
            /* @__PURE__ */ jsx("div", { className: `mt-1 h-2 w-2 shrink-0 rounded-full ${!n.is_read ? "bg-indigo-500" : "bg-transparent"}` }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: `text-sm ${!n.is_read ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`, children: n.title }),
              /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-sm text-gray-500", children: n.message }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-gray-400", children: formatDateTime(n.created_at) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
              !n.is_read && /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => markAsRead(n.id),
                  className: "rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-green-600 dark:hover:bg-gray-700",
                  title: "Mark as read",
                  children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => deleteNotification(n.id),
                  className: "rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700",
                  title: "Delete",
                  children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
                }
              )
            ] })
          ]
        },
        n.id
      )) })
    ] })
  ] });
}
export {
  NotificationsIndex as default
};
