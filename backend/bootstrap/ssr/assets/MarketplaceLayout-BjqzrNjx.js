import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { usePage, Link, router, Head } from "@inertiajs/react";
import { u as useTheme, T as ThemeProvider } from "../app2.js";
import { useState, useEffect } from "react";
import { User, Search, Sun, Moon, Headphones, ShoppingCart, Home, FileText, GraduationCap, Heart, X, MessageCircle, Send } from "lucide-react";
import { u as useCartDrawer, N as NotificationBell, g as getInitials, C as CartDrawerProvider, F as Footer, G as GlobalCartDrawer, b as CompareDrawer, P as PushNotificationPrompt } from "./PushNotificationPrompt-DvDsnr4H.js";
import { a as api } from "./api-Dp2ndEHF.js";
function Header({
  cartCount = 0,
  onSearch
}) {
  const { props, url } = usePage();
  const auth = props.auth ?? null;
  const user = (auth == null ? void 0 : auth.user) ?? auth;
  const { openCart } = useCartDrawer();
  const { theme, setTheme } = useTheme();
  const initialQuery = (() => {
    const qIndex = url.indexOf("?");
    if (qIndex === -1) return "";
    const params = new URLSearchParams(url.slice(qIndex + 1));
    return params.get("q") ?? params.get("search") ?? "";
  })();
  const [query, setQuery] = useState(initialQuery);
  const isDark = theme === "dark";
  const getUserInitials = () => {
    if (user == null ? void 0 : user.name) return getInitials(user.name);
    if (user == null ? void 0 : user.email) return user.email[0].toUpperCase();
    return "U";
  };
  const submitSearch = (value) => {
    onSearch == null ? void 0 : onSearch(value);
    const q = value.trim();
    router.visit(q ? `/search?q=${encodeURIComponent(q)}` : "/search", {
      preserveState: false
    });
  };
  return /* @__PURE__ */ jsx("div", { className: "sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border", children: /* @__PURE__ */ jsx("div", { className: "container mx-auto px-3 py-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
    user ? /* @__PURE__ */ jsx(Link, { href: "/account", children: /* @__PURE__ */ jsx("span", { className: "flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-primary/50 bg-primary/10 text-xs font-semibold text-primary", children: getUserInitials() }) }) : /* @__PURE__ */ jsx(
      Link,
      {
        href: "/login",
        className: "flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-muted",
        "aria-label": "Sign in",
        children: /* @__PURE__ */ jsx(User, { className: "h-5 w-5" })
      }
    ),
    /* @__PURE__ */ jsxs(
      "form",
      {
        className: "flex-1 relative",
        onSubmit: (e) => {
          e.preventDefault();
          submitSearch(query);
        },
        children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "search",
              value: query,
              onChange: (e) => {
                setQuery(e.target.value);
                onSearch == null ? void 0 : onSearch(e.target.value);
              },
              placeholder: "Search everything...",
              "aria-label": "Search everything",
              className: "h-9 w-full rounded-md border-0 bg-muted/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => setTheme(isDark ? "light" : "dark"),
        className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-muted",
        "aria-label": "Toggle theme",
        children: isDark ? /* @__PURE__ */ jsx(Sun, { className: "h-5 w-5" }) : /* @__PURE__ */ jsx(Moon, { className: "h-5 w-5" })
      }
    ),
    /* @__PURE__ */ jsx(
      Link,
      {
        href: user ? "/tickets" : "/login",
        className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-muted",
        "aria-label": "Support",
        children: /* @__PURE__ */ jsx(Headphones, { className: "h-5 w-5" })
      }
    ),
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: openCart,
        className: "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-muted",
        "aria-label": "Open cart",
        children: [
          /* @__PURE__ */ jsx(ShoppingCart, { className: "h-5 w-5" }),
          cartCount > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive p-0 text-[10px] font-medium text-destructive-foreground", children: cartCount > 9 ? "9+" : cartCount })
        ]
      }
    ),
    user ? /* @__PURE__ */ jsx(NotificationBell, {}) : /* @__PURE__ */ jsx(
      Link,
      {
        href: "/login",
        className: "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-muted",
        "aria-label": "Sign in for notifications",
        children: /* @__PURE__ */ jsx(User, { className: "h-5 w-5" })
      }
    )
  ] }) }) });
}
function BottomNav({ cartCount: _cartCount = 0 }) {
  const { props, url } = usePage();
  const auth = props.auth ?? null;
  const user = (auth == null ? void 0 : auth.user) ?? null;
  const currentPath = url.split("?")[0];
  const navItems = [
    { path: user ? "/dashboard" : "/home", icon: Home, label: "Home" },
    { path: "/needs", icon: FileText, label: "Needs" },
    { path: "/learn", icon: GraduationCap, label: "Learn" },
    { path: "/healthcare", icon: Heart, label: "Health" },
    { path: user ? "/account" : "/login", icon: User, label: "Account" }
  ];
  const isActive = (path) => {
    if (path === "/dashboard" || path === "/home") {
      return currentPath === "/" || currentPath === "/dashboard" || currentPath === "/home";
    }
    if (path === "/login" || path === "/account") {
      return currentPath === "/account" || currentPath.startsWith("/account/") || currentPath === "/login";
    }
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };
  return /* @__PURE__ */ jsx(
    "nav",
    {
      className: "fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden",
      style: { paddingBottom: "env(safe-area-inset-bottom)" },
      children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-around h-14", children: navItems.map(({ path, icon: Icon, label }) => {
        const active = isActive(path);
        return /* @__PURE__ */ jsxs(
          Link,
          {
            href: path,
            "aria-current": active ? "page" : void 0,
            className: `flex flex-col items-center justify-center flex-1 h-full transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`,
            children: [
              /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5 mb-0.5", "aria-hidden": "true" }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-medium", children: label })
            ]
          },
          label
        );
      }) })
    }
  );
}
function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);
  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);
    try {
      const data = await api.post("/api/ai/chat", { message: trimmed });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply ?? "Sorry, I could not process your request." }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Chat service is unavailable right now." }
      ]);
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => setIsOpen((v) => !v),
        "aria-label": "Open chat",
        className: "fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90",
        children: isOpen ? /* @__PURE__ */ jsx(X, { className: "h-6 w-6" }) : /* @__PURE__ */ jsx(MessageCircle, { className: "h-6 w-6" })
      }
    ),
    isOpen && /* @__PURE__ */ jsxs(
      "div",
      {
        role: "dialog",
        "aria-label": "AI Assistant chat",
        className: "fixed bottom-40 right-4 z-50 w-[350px] max-w-[calc(100vw-2rem)] md:w-[400px] shadow-2xl border-2 border-border rounded-lg bg-card overflow-hidden",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "pb-2 bg-primary text-primary-foreground rounded-t-lg px-4 pt-3", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-sm", children: "AI Assistant" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs opacity-80", children: "Ask about products, orders, bookings" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "h-64 overflow-y-auto p-3 space-y-2", children: [
            messages.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Hi! How can I help you today?" }),
            messages.map((m, i) => /* @__PURE__ */ jsx(
              "div",
              {
                className: `rounded-lg px-3 py-2 text-xs max-w-[85%] ${m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground"}`,
                children: m.content
              },
              i
            )),
            loading && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", role: "status", "aria-live": "polite", children: "Typing..." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2 border-t border-border p-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                value: input,
                onChange: (e) => setInput(e.target.value),
                onKeyDown: (e) => {
                  if (e.key === "Enter") void sendMessage();
                },
                placeholder: "Type a message...",
                "aria-label": "Type a message",
                className: "h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => void sendMessage(),
                "aria-label": "Send message",
                className: "flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground",
                children: /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" })
              }
            )
          ] })
        ]
      }
    )
  ] });
}
function FloatingCart({ count = 0 }) {
  const { openCart } = useCartDrawer();
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      onClick: openCart,
      "aria-label": "Open cart",
      className: "fixed bottom-20 left-4 md:left-6 z-40 h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90",
      children: /* @__PURE__ */ jsxs("span", { className: "relative", children: [
        /* @__PURE__ */ jsx(ShoppingCart, { className: "h-6 w-6" }),
        count > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-2 -right-2 h-5 w-5 p-0 text-[10px] bg-destructive text-destructive-foreground rounded-full flex items-center justify-center", children: count > 9 ? "9+" : count })
      ] })
    }
  );
}
function MarketplaceShell({
  children,
  title = "EverythingNeed",
  cartCount,
  socialLinks,
  appLinks
}) {
  const { props } = usePage();
  const sharedCartCount = props.cartCount ?? 0;
  const effectiveCartCount = cartCount ?? sharedCartCount;
  const sharedSocials = props.socialLinks ?? {};
  const sharedApps = props.appLinks ?? {};
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex flex-col bg-background", children: [
    /* @__PURE__ */ jsx(Head, { title }),
    /* @__PURE__ */ jsx(Header, { cartCount: effectiveCartCount }),
    /* @__PURE__ */ jsx("main", { className: "flex-1 pb-[152px] md:pb-4", children }),
    /* @__PURE__ */ jsx(Footer, { socialLinks: { ...sharedSocials, ...socialLinks }, appLinks: { ...sharedApps, ...appLinks } }),
    /* @__PURE__ */ jsx(BottomNav, { cartCount: effectiveCartCount }),
    /* @__PURE__ */ jsx(FloatingChat, {}),
    /* @__PURE__ */ jsx(FloatingCart, { count: effectiveCartCount }),
    /* @__PURE__ */ jsx(GlobalCartDrawer, {}),
    /* @__PURE__ */ jsx(CompareDrawer, {}),
    /* @__PURE__ */ jsx(PushNotificationPrompt, {})
  ] });
}
function MarketplaceLayout(props) {
  return /* @__PURE__ */ jsx(ThemeProvider, { defaultTheme: "light", storageKey: "everythingneed-theme", children: /* @__PURE__ */ jsx(CartDrawerProvider, { children: /* @__PURE__ */ jsx(MarketplaceShell, { ...props }) }) });
}
export {
  MarketplaceLayout as M
};
