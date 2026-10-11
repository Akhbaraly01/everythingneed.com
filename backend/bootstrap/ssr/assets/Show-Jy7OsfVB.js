import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { usePage, Head, Link } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { a as formatDateTime } from "./PushNotificationPrompt-DvDsnr4H.js";
import { ArrowLeft, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import "clsx";
import "sonner";
const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};
function TicketShow({ ticket }) {
  const { auth } = usePage().props;
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState(ticket.messages ?? []);
  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/api/tickets/${ticket.id}/reply`, { message: reply });
      setMessages([...messages, res.data]);
      setReply("");
    } catch (e) {
      alert(errorMessage(e, "Failed to send reply"));
    } finally {
      setSending(false);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: `Ticket ${ticket.ticket_number}` }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs(Link, { href: "/tickets", className: "inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back to tickets"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-start justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "font-mono text-sm text-gray-500", children: ticket.ticket_number }),
            /* @__PURE__ */ jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[ticket.priority] ?? ""}`, children: ticket.priority }),
            /* @__PURE__ */ jsx("span", { className: "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800", children: ticket.status })
          ] }),
          /* @__PURE__ */ jsx("h1", { className: "mt-2 text-xl font-bold text-gray-900 dark:text-white", children: ticket.subject }),
          ticket.department && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-gray-500", children: [
            "Department: ",
            ticket.department.name
          ] })
        ] }) }),
        ticket.description && /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap", children: ticket.description }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("h2", { className: "flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white", children: [
          /* @__PURE__ */ jsx(MessageSquare, { className: "h-5 w-5" }),
          " Conversation"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-4", children: messages.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-center text-gray-500", children: "No messages yet." }) : messages.map((msg) => {
          var _a, _b;
          const isOwn = msg.sender_id === ((_a = auth == null ? void 0 : auth.user) == null ? void 0 : _a.id);
          return /* @__PURE__ */ jsx("div", { className: `flex ${isOwn ? "justify-end" : "justify-start"}`, children: /* @__PURE__ */ jsxs("div", { className: `max-w-xl rounded-lg p-4 ${isOwn ? "bg-indigo-50 dark:bg-indigo-900/20" : "bg-gray-50 dark:bg-gray-700"}`, children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-900 dark:text-white", children: ((_b = msg.sender) == null ? void 0 : _b.name) ?? "Unknown" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-400", children: formatDateTime(msg.created_at) })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300", children: msg.message })
          ] }) }, msg.id);
        }) }),
        ticket.status !== "closed" && /* @__PURE__ */ jsxs("div", { className: "mt-6 border-t border-gray-200 pt-4 dark:border-gray-700", children: [
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: reply,
              onChange: (e) => setReply(e.target.value),
              rows: 3,
              className: "block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700",
              placeholder: "Type your reply..."
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "mt-3 flex justify-end", children: /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: sendReply,
              disabled: sending || !reply.trim(),
              className: "inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50",
              children: [
                /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" }),
                sending ? "Sending..." : "Send Reply"
              ]
            }
          ) })
        ] })
      ] })
    ] })
  ] });
}
export {
  TicketShow as default
};
