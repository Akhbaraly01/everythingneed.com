import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useCallback, useEffect, useContext, createContext } from "react";
import { Link, usePage } from "@inertiajs/react";
import { Bell, Facebook, Twitter, Instagram, Linkedin, Youtube, Home, Phone, Mail, MapPin, Clock, Send, Shield, CheckCircle, Award, Heart, ShoppingCart, X, Minus, Plus, Trash2, GitCompareArrows, Star, ChevronLeft } from "lucide-react";
import { a as api } from "./api-Dp2ndEHF.js";
import "clsx";
import { toast } from "sonner";
function formatCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(amount);
}
function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(date));
}
function formatDateTime(date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}
function getInitials(name) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
const TYPE_ICONS = {
  order_update: "📦",
  ticket_update: "🎫",
  health_ticket: "🏥",
  enrollment: "📚"
};
const TYPE_LINKS = {
  order_update: (id) => `/pharmacy/order/${id ?? ""}`,
  ticket_update: (id) => `/support/tickets/${id ?? ""}`,
  health_ticket: () => "/healthcare/tickets",
  enrollment: () => "/learn/my-courses"
};
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const containerRef = useRef(null);
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/notifications", {
        params: { per_page: 8 }
      });
      setItems(res.data ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!open) return;
    void fetchNotifications();
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, fetchNotifications]);
  const unreadCount = items.filter((n) => !n.is_read).length;
  const markAsRead = async (id) => {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    try {
      await api.post(`/api/notifications/${id}/read`);
    } catch {
    }
  };
  const markAllAsRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await api.post("/api/notifications/read-all");
    } catch {
    }
  };
  const linkFor = (n) => {
    var _a;
    return (n.type && ((_a = TYPE_LINKS[n.type]) == null ? void 0 : _a.call(TYPE_LINKS, n.related_id))) ?? "/notifications";
  };
  return /* @__PURE__ */ jsxs("div", { ref: containerRef, className: "relative", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => setOpen((v) => !v),
        "aria-label": unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications",
        "aria-expanded": open,
        className: "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-muted",
        children: [
          /* @__PURE__ */ jsx(Bell, { className: "h-5 w-5" }),
          unreadCount > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive p-0 text-[10px] font-medium text-destructive-foreground", children: unreadCount > 9 ? "9+" : unreadCount })
        ]
      }
    ),
    open && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 z-50 mt-2 w-80 rounded-lg border border-border bg-card shadow-lg", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-border px-4 py-3", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold", children: "Notifications" }),
        unreadCount > 0 && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => void markAllAsRead(),
            className: "text-xs text-primary hover:underline",
            children: "Mark all read"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "max-h-80 overflow-y-auto", children: loading ? /* @__PURE__ */ jsx("p", { className: "p-4 text-center text-sm text-muted-foreground", children: "Loading..." }) : items.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-8 text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Bell, { className: "mx-auto mb-2 h-8 w-8 opacity-50" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm", children: "No notifications yet" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "divide-y divide-border", children: items.map((n) => /* @__PURE__ */ jsx(
        Link,
        {
          href: linkFor(n),
          onClick: () => {
            if (!n.is_read) void markAsRead(n.id);
            setOpen(false);
          },
          className: `block px-4 py-3 hover:bg-muted/50 ${!n.is_read ? "bg-primary/5" : ""}`,
          children: /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsx("span", { className: "text-lg", children: (n.type && TYPE_ICONS[n.type]) ?? "🔔" }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsx("p", { className: "truncate text-sm font-medium", children: n.title }),
              /* @__PURE__ */ jsx("p", { className: "line-clamp-2 text-xs text-muted-foreground", children: n.message }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: formatDateTime(n.created_at) })
            ] }),
            !n.is_read && /* @__PURE__ */ jsx("span", { className: "mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" })
          ] })
        },
        n.id
      )) }) }),
      /* @__PURE__ */ jsx("div", { className: "border-t border-border p-2", children: /* @__PURE__ */ jsx(
        Link,
        {
          href: "/notifications",
          onClick: () => setOpen(false),
          className: "block w-full rounded-md py-2 text-center text-sm text-primary hover:bg-muted",
          children: "View all notifications"
        }
      ) })
    ] })
  ] });
}
const CartDrawerContext = createContext({
  isOpen: false,
  openCart: () => {
  },
  closeCart: () => {
  }
});
function CartDrawerProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);
  return /* @__PURE__ */ jsx(CartDrawerContext.Provider, { value: { isOpen, openCart, closeCart }, children });
}
function useCartDrawer() {
  return useContext(CartDrawerContext);
}
const paymentMethods = ["Visa", "Mastercard", "PayPal", "Apple Pay", "Google Pay", "Stripe", "Crypto"];
function Footer({ socialLinks = {}, appLinks = {} }) {
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const [email, setEmail] = useState("");
  const [subState, setSubState] = useState("idle");
  const [subMessage, setSubMessage] = useState("");
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const socials = [
    { icon: Facebook, href: socialLinks.facebook, label: "Facebook" },
    { icon: Twitter, href: socialLinks.twitter, label: "Twitter" },
    { icon: Instagram, href: socialLinks.instagram, label: "Instagram" },
    { icon: Linkedin, href: socialLinks.linkedin, label: "LinkedIn" },
    { icon: Youtube, href: socialLinks.youtube, label: "YouTube" }
  ].filter((s) => Boolean(s.href));
  const subscribe = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setSubState("error");
      setSubMessage("Enter a valid email address.");
      return;
    }
    setSubState("sending");
    setSubMessage("");
    try {
      await api.post("/api/newsletter/subscribe", { email: value });
      setSubState("done");
      setSubMessage("Subscribed! Watch your inbox for deals.");
      setEmail("");
    } catch {
      setSubState("error");
      setSubMessage("Could not subscribe. Please try again.");
    }
  };
  return /* @__PURE__ */ jsxs("footer", { className: "bg-amber-900 text-amber-50 relative", children: [
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "font-bold text-amber-400 mb-4 text-lg", children: "CATEGORIES" }),
          /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: [
            { name: "Electronics", path: "/products?category=electronics" },
            { name: "Fashion", path: "/products?category=fashion" },
            { name: "Healthcare", path: "/healthcare" },
            { name: "Learning", path: "/learn" }
          ].map((link) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { href: link.path, className: "text-sm text-amber-200 hover:text-amber-400 transition-colors", children: link.name }) }, link.name)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "font-bold text-amber-400 mb-4 text-lg", children: "MY ACCOUNT" }),
          /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: [
            { name: "Dashboard", path: "/dashboard" },
            { name: "My Orders", path: "/orders" },
            { name: "Wishlist", path: "/wishlist" },
            { name: "Wallet", path: "/wallet" }
          ].map((link) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { href: link.path, className: "text-sm text-amber-200 hover:text-amber-400 transition-colors", children: link.name }) }, link.name)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "font-bold text-amber-400 mb-4 text-lg", children: "SUPPORT" }),
          /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: [
            { name: "Contact Us", path: "/tickets" },
            { name: "Help Center", path: "/tickets" },
            { name: "FAQs", path: "/tickets" }
          ].map((link) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { href: link.path, className: "text-sm text-amber-200 hover:text-amber-400 transition-colors", children: link.name }) }, link.name)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2 md:col-span-1", children: [
          /* @__PURE__ */ jsx("h4", { className: "font-bold text-amber-400 mb-4 text-lg", children: "GET IN TOUCH" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx(Home, { className: "h-5 w-5 text-amber-400 mt-0.5 shrink-0" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm text-amber-200", children: "EverythingNeed Global HQ, Tech City, Worldwide" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(Phone, { className: "h-5 w-5 text-amber-400 shrink-0" }),
              /* @__PURE__ */ jsx("a", { href: "tel:+15551234567", className: "text-sm text-amber-200 hover:text-amber-400", children: "+1 (555) 123-4567" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(Mail, { className: "h-5 w-5 text-amber-400 shrink-0" }),
              /* @__PURE__ */ jsx("a", { href: "mailto:support@everythingneed.com", className: "text-sm text-amber-200 hover:text-amber-400", children: "support@everythingneed.com" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "h-5 w-5 text-amber-400 shrink-0" }),
              /* @__PURE__ */ jsx(
                "a",
                {
                  href: "https://maps.google.com/?q=Tech+City",
                  target: "_blank",
                  rel: "noreferrer",
                  className: "text-sm text-amber-200 hover:text-amber-400 underline",
                  children: "View on Map"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(Clock, { className: "h-5 w-5 text-amber-400 shrink-0" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm text-amber-200", children: "24/7 Customer Support" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-amber-800 rounded-lg p-4 mb-4 mt-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center md:text-left", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-amber-100 mb-1", children: "Subscribe to our newsletter" }),
          /* @__PURE__ */ jsx("p", { className: "text-amber-300 text-xs", children: "Get exclusive deals and updates" })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: (e) => void subscribe(e), className: "w-full md:w-auto", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex w-full md:w-auto gap-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                value: email,
                onChange: (e) => setEmail(e.target.value),
                placeholder: "Enter your email",
                "aria-label": "Email for newsletter",
                className: "max-w-xs flex-1 rounded-md bg-amber-700 border border-amber-600 text-amber-100 placeholder:text-amber-400 h-8 px-3 text-sm focus:outline-none"
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "submit",
                disabled: subState === "sending",
                className: "shrink-0 inline-flex items-center rounded-md bg-amber-500 hover:bg-amber-400 text-amber-900 h-8 px-3 text-sm font-medium disabled:opacity-60",
                children: [
                  /* @__PURE__ */ jsx(Send, { className: "h-3 w-3 mr-1" }),
                  subState === "sending" ? "Joining…" : "Subscribe"
                ]
              }
            )
          ] }),
          subMessage && /* @__PURE__ */ jsx("p", { className: `mt-1 text-xs ${subState === "done" ? "text-green-300" : "text-red-300"}`, children: subMessage })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row justify-between items-center gap-6 mb-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center lg:text-left", children: [
          /* @__PURE__ */ jsx("h4", { className: "font-semibold mb-3 text-amber-100", children: "Download Our Mobile App" }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            appLinks.ios ? /* @__PURE__ */ jsx("a", { href: appLinks.ios, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-2 rounded-md border border-amber-600 text-amber-200 hover:bg-amber-700 px-3 py-1.5 text-sm", children: "App Store" }) : /* @__PURE__ */ jsx("span", { title: "iOS app coming soon", className: "inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-amber-600/60 text-amber-200/60 px-3 py-1.5 text-sm", children: "App Store" }),
            appLinks.android ? /* @__PURE__ */ jsx("a", { href: appLinks.android, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-2 rounded-md border border-amber-600 text-amber-200 hover:bg-amber-700 px-3 py-1.5 text-sm", children: "Google Play" }) : /* @__PURE__ */ jsx("span", { title: "Android app coming soon", className: "inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-amber-600/60 text-amber-200/60 px-3 py-1.5 text-sm", children: "Google Play" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("h4", { className: "font-semibold mb-3 text-amber-100", children: "We Accept" }),
          /* @__PURE__ */ jsx("div", { className: "flex gap-2 flex-wrap justify-center", children: paymentMethods.map((method) => /* @__PURE__ */ jsx("div", { className: "px-3 py-1.5 bg-amber-800 rounded text-xs font-medium text-amber-200", children: method }, method)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-center lg:text-right", children: [
          /* @__PURE__ */ jsx("h4", { className: "font-semibold mb-3 text-amber-100", children: "Security & Trust" }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2 flex-wrap justify-center lg:justify-end", children: [
            /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-md border border-amber-600 text-amber-200 px-2 py-1 text-xs", children: [
              /* @__PURE__ */ jsx(Shield, { className: "h-3 w-3" }),
              "SSL Secured"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-md border border-amber-600 text-amber-200 px-2 py-1 text-xs", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "h-3 w-3" }),
              "Verified Business"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-md border border-amber-600 text-amber-200 px-2 py-1 text-xs", children: [
              /* @__PURE__ */ jsx(Award, { className: "h-3 w-3" }),
              "ISO Certified"
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-amber-700", children: [
        socials.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: socials.map((social) => /* @__PURE__ */ jsx(
          "a",
          {
            href: social.href,
            target: "_blank",
            rel: "noreferrer",
            "aria-label": social.label,
            className: "p-2 rounded-full bg-amber-800 transition-all duration-300 hover:bg-amber-700",
            children: /* @__PURE__ */ jsx(social.icon, { className: "h-5 w-5" })
          },
          social.label
        )) }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-amber-300 flex items-center gap-1 flex-wrap justify-center", children: [
          "© ",
          currentYear,
          " everythingneed.com. Made with",
          /* @__PURE__ */ jsx(Heart, { className: "h-4 w-4 text-red-400 fill-red-400" }),
          "for humanity. All rights reserved."
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-4 text-sm text-amber-300", children: [
          /* @__PURE__ */ jsx(Link, { href: "/tickets", className: "hover:text-amber-400 transition-colors", children: "Privacy Policy" }),
          /* @__PURE__ */ jsx(Link, { href: "/tickets", className: "hover:text-amber-400 transition-colors", children: "Terms of Service" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: scrollToTop,
        "aria-label": "Scroll to top",
        className: "fixed bottom-40 right-4 h-12 w-12 rounded-full shadow-xl z-30 bg-amber-500 hover:bg-amber-400 text-amber-900 flex items-center justify-center font-bold",
        children: "↑"
      }
    )
  ] });
}
function GlobalCartDrawer() {
  const { isOpen, closeCart } = useCartDrawer();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/cart");
      setCart(res);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (isOpen) void fetchCart();
  }, [isOpen, fetchCart]);
  const updateQty = async (itemId, quantity) => {
    if (quantity < 1) return removeItem(itemId);
    try {
      await api.put(`/api/cart/items/${itemId}`, { quantity });
      void fetchCart();
    } catch {
    }
  };
  const removeItem = async (itemId) => {
    try {
      await api.del(`/api/cart/items/${itemId}`);
      void fetchCart();
    } catch {
    }
  };
  if (!isOpen) return null;
  const items = (cart == null ? void 0 : cart.cart.items) ?? [];
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50", role: "dialog", "aria-modal": "true", "aria-label": "Shopping cart", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/50", onClick: closeCart }),
    /* @__PURE__ */ jsxs("aside", { className: "absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-card shadow-xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-border px-4 py-3", children: [
        /* @__PURE__ */ jsxs("h2", { className: "flex items-center gap-2 text-sm font-semibold", children: [
          /* @__PURE__ */ jsx(ShoppingCart, { className: "h-4 w-4" }),
          " Cart (",
          (cart == null ? void 0 : cart.item_count) ?? 0,
          ")"
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: closeCart,
            "aria-label": "Close cart",
            className: "flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted",
            children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto p-4", children: loading ? /* @__PURE__ */ jsx("p", { className: "py-8 text-center text-sm text-muted-foreground", children: "Loading..." }) : items.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "py-12 text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsx(ShoppingCart, { className: "mx-auto mb-2 h-10 w-10 opacity-50" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Your cart is empty" }),
        /* @__PURE__ */ jsx(
          Link,
          {
            href: "/products",
            onClick: closeCart,
            className: "mt-4 inline-block rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground",
            children: "Browse products"
          }
        )
      ] }) : /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: items.map((item) => {
        var _a, _b;
        return /* @__PURE__ */ jsxs("li", { className: "flex gap-3 rounded-lg border border-border p-3", children: [
          /* @__PURE__ */ jsx("div", { className: "h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted", children: ((_a = item.product) == null ? void 0 : _a.image_url) && /* @__PURE__ */ jsx(
            "img",
            {
              src: item.product.image_url,
              alt: item.product.name,
              className: "h-full w-full object-cover",
              loading: "lazy"
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsx("p", { className: "truncate text-sm font-medium", children: ((_b = item.product) == null ? void 0 : _b.name) ?? "Item" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-primary", children: formatCurrency(item.unit_price) }),
            /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  "aria-label": "Decrease quantity",
                  onClick: () => void updateQty(item.id, item.quantity - 1),
                  className: "flex h-6 w-6 items-center justify-center rounded border border-border",
                  children: /* @__PURE__ */ jsx(Minus, { className: "h-3 w-3" })
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-medium", children: item.quantity }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  "aria-label": "Increase quantity",
                  onClick: () => void updateQty(item.id, item.quantity + 1),
                  className: "flex h-6 w-6 items-center justify-center rounded border border-border",
                  children: /* @__PURE__ */ jsx(Plus, { className: "h-3 w-3" })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  "aria-label": "Remove item",
                  onClick: () => void removeItem(item.id),
                  className: "ml-auto flex h-6 w-6 items-center justify-center rounded text-destructive hover:bg-muted",
                  children: /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3" })
                }
              )
            ] })
          ] })
        ] }, item.id);
      }) }) }),
      items.length > 0 && /* @__PURE__ */ jsxs("div", { className: "border-t border-border p-4 space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Subtotal" }),
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: formatCurrency(Number((cart == null ? void 0 : cart.subtotal) ?? 0)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Total" }),
          /* @__PURE__ */ jsx("span", { className: "font-bold text-primary", children: formatCurrency(Number((cart == null ? void 0 : cart.total) ?? 0)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              href: "/cart",
              onClick: closeCart,
              className: "flex-1 rounded-md border border-border px-4 py-2 text-center text-sm font-medium hover:bg-muted",
              children: "View cart"
            }
          ),
          /* @__PURE__ */ jsx(
            Link,
            {
              href: "/orders/checkout",
              onClick: closeCart,
              className: "flex-1 rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:opacity-90",
              children: "Checkout"
            }
          )
        ] })
      ] })
    ] })
  ] });
}
const MAX_COMPARE = 3;
function CompareDrawer() {
  const [items, setItems] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const fetchCompare = useCallback(async () => {
    try {
      const res = await api.get("/api/compare");
      const products = (res.data ?? []).map((row) => row.product).filter((p) => Boolean(p && p.id)).slice(0, MAX_COMPARE);
      setItems(products);
    } catch {
      setItems([]);
    }
  }, []);
  useEffect(() => {
    void fetchCompare();
    const sync = () => void fetchCompare();
    window.addEventListener("everythingneed:compare-updated", sync);
    return () => window.removeEventListener("everythingneed:compare-updated", sync);
  }, [fetchCompare]);
  const removeFromCompare = async (id) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
    try {
      await api.del(`/api/compare/${id}`);
    } catch {
    }
  };
  const clearCompare = async () => {
    const previous = items;
    setItems([]);
    try {
      await Promise.all(previous.map((p) => api.del(`/api/compare/${p.id}`).catch(() => {
      })));
    } catch {
    }
  };
  if (items.length === 0) return null;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    !drawerOpen && /* @__PURE__ */ jsx("div", { className: "fixed bottom-20 left-1/2 z-50 -translate-x-1/2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 rounded-lg border border-primary/30 bg-card p-3 shadow-2xl", children: [
      /* @__PURE__ */ jsx("div", { className: "flex -space-x-2", children: items.map((item) => /* @__PURE__ */ jsx(
        "div",
        {
          className: "h-10 w-10 overflow-hidden rounded-full border-2 border-background bg-muted",
          children: item.image_url && /* @__PURE__ */ jsx(
            "img",
            {
              src: item.image_url,
              alt: item.name,
              className: "h-full w-full object-cover",
              loading: "lazy"
            }
          )
        },
        item.id
      )) }),
      /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium", children: [
        items.length,
        "/",
        MAX_COMPARE,
        " selected"
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => setDrawerOpen(true),
          disabled: items.length < 2,
          className: "flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50",
          children: [
            /* @__PURE__ */ jsx(GitCompareArrows, { className: "h-3.5 w-3.5" }),
            "Compare"
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => void clearCompare(),
          "aria-label": "Clear comparison",
          className: "flex h-7 w-7 items-center justify-center rounded-md text-destructive hover:bg-muted",
          children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
        }
      )
    ] }) }),
    drawerOpen && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50 flex items-end", role: "dialog", "aria-modal": "true", "aria-label": "Product comparison", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/50", onClick: () => setDrawerOpen(false) }),
      /* @__PURE__ */ jsxs("div", { className: "relative max-h-[85vh] w-full overflow-y-auto rounded-t-xl bg-card p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("h2", { className: "flex items-center gap-2 text-base font-semibold", children: [
            /* @__PURE__ */ jsx(GitCompareArrows, { className: "h-5 w-5" }),
            "Product Comparison"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => void clearCompare(),
                className: "rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted",
                children: "Clear all"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setDrawerOpen(false),
                "aria-label": "Close comparison",
                className: "flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted",
                children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full min-w-[500px]", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "w-28 p-2 text-left text-sm font-medium text-muted-foreground", children: "Feature" }),
            items.map((item) => /* @__PURE__ */ jsx("th", { className: "p-2 text-center", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => void removeFromCompare(item.id),
                  "aria-label": `Remove ${item.name}`,
                  className: "absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground",
                  children: /* @__PURE__ */ jsx(X, { className: "h-3 w-3" })
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "mx-auto mb-2 h-20 w-20 overflow-hidden rounded-lg bg-muted", children: item.image_url && /* @__PURE__ */ jsx(
                "img",
                {
                  src: item.image_url,
                  alt: item.name,
                  className: "h-full w-full object-cover",
                  loading: "lazy"
                }
              ) }),
              /* @__PURE__ */ jsx("p", { className: "line-clamp-2 text-xs font-medium", children: item.name })
            ] }) }, item.id))
          ] }) }),
          /* @__PURE__ */ jsxs("tbody", { children: [
            /* @__PURE__ */ jsxs("tr", { className: "border-t", children: [
              /* @__PURE__ */ jsx("td", { className: "p-2 text-sm font-medium", children: "Price" }),
              items.map((item) => /* @__PURE__ */ jsx("td", { className: "p-2 text-center", children: /* @__PURE__ */ jsx("span", { className: "font-bold text-primary", children: item.price !== void 0 ? formatCurrency(item.price) : "N/A" }) }, item.id))
            ] }),
            /* @__PURE__ */ jsxs("tr", { className: "border-t bg-muted/30", children: [
              /* @__PURE__ */ jsx("td", { className: "p-2 text-sm font-medium", children: "Rating" }),
              items.map((item) => /* @__PURE__ */ jsx("td", { className: "p-2 text-center", children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Star, { className: "h-4 w-4 fill-yellow-400 text-yellow-400" }),
                (item.rating ?? 0).toFixed(1)
              ] }) }, item.id))
            ] }),
            /* @__PURE__ */ jsxs("tr", { className: "border-t", children: [
              /* @__PURE__ */ jsx("td", { className: "p-2 text-sm font-medium", children: "Category" }),
              items.map((item) => /* @__PURE__ */ jsx("td", { className: "p-2 text-center", children: /* @__PURE__ */ jsx("span", { className: "rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground", children: item.category ?? "—" }) }, item.id))
            ] }),
            /* @__PURE__ */ jsxs("tr", { className: "border-t bg-muted/30", children: [
              /* @__PURE__ */ jsx("td", { className: "p-2 text-sm font-medium", children: "Description" }),
              items.map((item) => /* @__PURE__ */ jsx("td", { className: "p-2 text-center", children: /* @__PURE__ */ jsx("p", { className: "line-clamp-3 text-xs text-muted-foreground", children: item.description || "No description available" }) }, item.id))
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              href: "/products/compare",
              onClick: () => setDrawerOpen(false),
              className: "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
              children: "Full comparison page"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setDrawerOpen(false),
              className: "rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted",
              children: [
                /* @__PURE__ */ jsx(ChevronLeft, { className: "mr-1 inline h-4 w-4" }),
                "Keep shopping"
              ]
            }
          )
        ] })
      ] })
    ] })
  ] });
}
const usePushNotifications = () => {
  const [permission, setPermission] = useState("default");
  const [isSupported, setIsSupported] = useState(false);
  useEffect(() => {
    if ("Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);
  const requestPermission = async () => {
    if (!isSupported) {
      toast.error("Push notifications are not supported in this browser");
      return false;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        toast.success("You'll receive alerts for order and ticket updates");
        return true;
      }
      if (result === "denied") {
        toast.error("Please enable notifications in your browser settings");
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };
  const sendNotification = (title, options) => {
    if (!isSupported || permission !== "granted") {
      return;
    }
    try {
      const notification = new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      setTimeout(() => notification.close(), 5e3);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };
  const notifyOrderUpdate = (orderNumber, status) => {
    sendNotification(`Order ${orderNumber} Updated`, {
      body: `Your order status has been changed to: ${status}`,
      tag: `order-${orderNumber}`
    });
  };
  const notifyTicketUpdate = (ticketNumber, status) => {
    sendNotification(`Ticket ${ticketNumber} Updated`, {
      body: `Your support ticket status has been changed to: ${status}`,
      tag: `ticket-${ticketNumber}`
    });
  };
  const notifyHealthTicketUpdate = (ticketNumber, status) => {
    sendNotification(`Health Ticket ${ticketNumber} Updated`, {
      body: `Your appointment status has been changed to: ${status}`,
      tag: `health-${ticketNumber}`
    });
  };
  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    notifyOrderUpdate,
    notifyTicketUpdate,
    notifyHealthTicketUpdate
  };
};
const DISMISS_KEY = "push-prompt-dismissed";
function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const auth = usePage().props.auth;
  const { isSupported, permission, requestPermission } = usePushNotifications();
  useEffect(() => {
    if (!(auth == null ? void 0 : auth.id)) {
      return;
    }
    const timer = setTimeout(() => {
      if (isSupported && permission === "default" && !localStorage.getItem(DISMISS_KEY)) {
        setShowPrompt(true);
      }
    }, 3e3);
    return () => clearTimeout(timer);
  }, [auth == null ? void 0 : auth.id, isSupported, permission]);
  const handleEnable = async () => {
    await requestPermission();
    setShowPrompt(false);
  };
  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(DISMISS_KEY, "true");
    toast.info("You can enable notifications later from browser settings");
  };
  if (!showPrompt) {
    return null;
  }
  return /* @__PURE__ */ jsx("div", { className: "fixed bottom-48 left-4 right-4 z-40 animate-in slide-in-from-bottom-4 md:left-auto md:w-96", children: /* @__PURE__ */ jsx("div", { className: "rounded-lg border border-primary/20 bg-card p-4 shadow-lg", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
    /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10", children: /* @__PURE__ */ jsx(Bell, { className: "h-5 w-5 text-primary" }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsx("h4", { className: "mb-1 text-sm font-semibold text-card-foreground", children: "Enable Notifications" }),
      /* @__PURE__ */ jsx("p", { className: "mb-3 text-sm text-muted-foreground", children: "Get instant alerts when your orders or tickets are updated" }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleEnable,
            className: "rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90",
            children: "Enable"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleDismiss,
            className: "rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted",
            children: "Not Now"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: handleDismiss,
        "aria-label": "Dismiss notification prompt",
        className: "rounded-md p-1 text-muted-foreground hover:bg-muted",
        children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
      }
    )
  ] }) }) });
}
export {
  CartDrawerProvider as C,
  Footer as F,
  GlobalCartDrawer as G,
  NotificationBell as N,
  PushNotificationPrompt as P,
  formatDateTime as a,
  CompareDrawer as b,
  formatDate as c,
  formatCurrency as f,
  getInitials as g,
  useCartDrawer as u
};
