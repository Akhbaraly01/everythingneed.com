import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { a as formatDateTime } from "./PushNotificationPrompt-DvDsnr4H.js";
import { toast } from "sonner";
import { MessageSquare, Plus, Search, UserSearch, X } from "lucide-react";
import "clsx";
function MessagesInbox({ conversations }) {
  const [q, setQ] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState(null);
  const debounceRef = useRef(null);
  useEffect(() => {
    if (!showNew) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/api/chat/users?q=${encodeURIComponent(userQuery)}`);
        setResults(res.data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
  }, [userQuery, showNew]);
  const startConversation = async (recipientId) => {
    setStarting(recipientId);
    try {
      const res = await api.post("/api/chat/conversations", { recipient_id: recipientId });
      router.visit(`/messages/${res.data.id}`);
    } catch (err) {
      toast.error(errorMessage(err, "Could not start conversation"));
      setStarting(null);
    }
  };
  const filtered = conversations.filter((c) => {
    var _a;
    if (!q.trim()) return true;
    const other = c.customer && c.worker ? [c.customer.name, c.worker.name] : [];
    return other.some((n) => n.toLowerCase().includes(q.toLowerCase())) || (((_a = c.last_message) == null ? void 0 : _a.message) ?? "").toLowerCase().includes(q.toLowerCase());
  });
  const otherParty = (c) => {
    var _a, _b;
    return ((_a = c.worker) == null ? void 0 : _a.name) ?? ((_b = c.customer) == null ? void 0 : _b.name) ?? "Conversation";
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Messages", children: [
    /* @__PURE__ */ jsx(Head, { title: "Messages" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100", children: /* @__PURE__ */ jsx(MessageSquare, { className: "h-6 w-6 text-emerald-600" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Messages" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
              conversations.length,
              " conversation",
              conversations.length === 1 ? "" : "s"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => {
              setShowNew(true);
              setUserQuery("");
              setResults([]);
            },
            className: "flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
              " New conversation"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative mb-4", children: [
        /* @__PURE__ */ jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            value: q,
            onChange: (e) => setQ(e.target.value),
            placeholder: "Search conversations…",
            className: "w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          }
        )
      ] }),
      filtered.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-600", children: [
        /* @__PURE__ */ jsx(MessageSquare, { className: "mx-auto mb-3 h-10 w-10 text-gray-300" }),
        /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: conversations.length === 0 ? "No conversations yet" : "No matches" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Start one with “New conversation”." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: filtered.map((c) => {
        var _a;
        return /* @__PURE__ */ jsx(
          Link,
          {
            href: `/messages/${c.id}`,
            className: "flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-emerald-300 dark:border-gray-700 dark:bg-gray-800",
            children: /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: otherParty(c) }),
                c.unread_count > 0 && /* @__PURE__ */ jsx("span", { className: "rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold text-white", children: c.unread_count })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "truncate text-sm text-gray-500", children: ((_a = c.last_message) == null ? void 0 : _a.message) ?? "No messages yet" }),
              c.last_message && /* @__PURE__ */ jsx("p", { className: "text-[11px] text-gray-400", children: formatDateTime(c.last_message.created_at) })
            ] })
          },
          c.id
        );
      }) }),
      showNew && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/50", onClick: () => setShowNew(false) }),
        /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("h2", { className: "flex items-center gap-2 font-bold text-gray-900 dark:text-white", children: [
              /* @__PURE__ */ jsx(UserSearch, { className: "h-5 w-5" }),
              " Start a conversation"
            ] }),
            /* @__PURE__ */ jsx("button", { onClick: () => setShowNew(false), children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5 text-gray-400" }) })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              autoFocus: true,
              value: userQuery,
              onChange: (e) => setUserQuery(e.target.value),
              placeholder: "Search people by name or email…",
              className: "w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "mt-3 max-h-64 space-y-1 overflow-y-auto", children: searching ? /* @__PURE__ */ jsx("p", { className: "py-4 text-center text-sm text-gray-400", children: "Searching…" }) : results.length === 0 ? /* @__PURE__ */ jsx("p", { className: "py-4 text-center text-sm text-gray-400", children: "No users found — try another search." }) : results.map((u) => /* @__PURE__ */ jsxs(
            "button",
            {
              disabled: starting === u.id,
              onClick: () => startConversation(u.id),
              className: "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-gray-700/60",
              children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx("span", { className: "block text-sm font-medium text-gray-900 dark:text-white", children: u.name }),
                  /* @__PURE__ */ jsx("span", { className: "block text-xs text-gray-400", children: u.email })
                ] }),
                /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 text-emerald-600" })
              ]
            },
            u.id
          )) })
        ] })
      ] })
    ] })
  ] });
}
export {
  MessagesInbox as default
};
