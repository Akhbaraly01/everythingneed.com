import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { usePage, Head, Link } from "@inertiajs/react";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { a as formatDateTime } from "./PushNotificationPrompt-DvDsnr4H.js";
import { toast } from "sonner";
import { ArrowLeft, Image, Paperclip, Loader2, SendHorizonal } from "lucide-react";
import "clsx";
function MessageThread({ conversation, initialMessages }) {
  var _a, _b, _c, _d;
  const auth = usePage().props.auth;
  const myId = ((_a = auth == null ? void 0 : auth.user) == null ? void 0 : _a.id) ?? (auth == null ? void 0 : auth.id) ?? "";
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const lastIdRef = useRef(((_b = initialMessages.at(-1)) == null ? void 0 : _b.id) ?? null);
  const otherName = ((_c = conversation.worker) == null ? void 0 : _c.name) ?? ((_d = conversation.customer) == null ? void 0 : _d.name) ?? "Conversation";
  useEffect(() => {
    var _a2;
    (_a2 = bottomRef.current) == null ? void 0 : _a2.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);
  useEffect(() => {
    const interval = setInterval(async () => {
      var _a2;
      if (document.hidden || sending) return;
      try {
        const res = await api.get(`/api/chat/${conversation.id}/messages`);
        const latest = ((_a2 = res.data.at(-1)) == null ? void 0 : _a2.id) ?? null;
        if (latest && latest !== lastIdRef.current) {
          lastIdRef.current = latest;
          setMessages(res.data.map((m) => ({ ...m, mine: m.sender_id === myId })));
        }
      } catch {
      }
    }, 5e3);
    return () => clearInterval(interval);
  }, [conversation.id]);
  const send = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      const res = await api.post(
        `/api/chat/${conversation.id}/messages`,
        { message: text }
      );
      lastIdRef.current = res.data.id;
      setMessages((prev) => [...prev, {
        id: res.data.id,
        sender_id: myId,
        message: res.data.message,
        message_type: res.data.message_type ?? "text",
        created_at: res.data.created_at ?? (/* @__PURE__ */ new Date()).toISOString(),
        mine: true
      }]);
      setDraft("");
    } catch (err) {
      toast.error(errorMessage(err, "Message failed to send"));
    } finally {
      setSending(false);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: otherName, children: [
    /* @__PURE__ */ jsx(Head, { title: `Chat — ${otherName}` }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col px-4 py-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(Link, { href: "/messages", className: "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:text-white", children: /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "font-bold text-gray-900 dark:text-white", children: otherName }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400", children: "Direct conversation" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800", children: [
        messages.length === 0 ? /* @__PURE__ */ jsx("p", { className: "py-16 text-center text-sm text-gray-400", children: "No messages yet — say hello 👋" }) : messages.map((m) => /* @__PURE__ */ jsx("div", { className: `flex ${m.mine ? "justify-end" : "justify-start"}`, children: /* @__PURE__ */ jsxs(
          "div",
          {
            className: `max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${m.mine ? "rounded-br-sm bg-emerald-600 text-white" : "rounded-bl-sm bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100"}`,
            children: [
              m.message_type === "image" ? /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Image, { className: "inline h-4 w-4" }),
                " ",
                m.message
              ] }) : m.message_type === "file" ? /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Paperclip, { className: "inline h-4 w-4" }),
                " ",
                m.message
              ] }) : m.message,
              /* @__PURE__ */ jsx("span", { className: `mt-1 block text-right text-[10px] ${m.mine ? "text-emerald-200" : "text-gray-400"}`, children: formatDateTime(m.created_at ?? (/* @__PURE__ */ new Date()).toISOString()) })
            ]
          }
        ) }, m.id)),
        /* @__PURE__ */ jsx("div", { ref: bottomRef })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: send, className: "mt-3 flex gap-2", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            value: draft,
            onChange: (e) => setDraft(e.target.value),
            placeholder: "Type a message…",
            maxLength: 5e3,
            className: "flex-1 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: !draft.trim() || sending,
            className: "flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50",
            children: sending ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(SendHorizonal, { className: "h-4 w-4" })
          }
        )
      ] })
    ] })
  ] });
}
export {
  MessageThread as default
};
