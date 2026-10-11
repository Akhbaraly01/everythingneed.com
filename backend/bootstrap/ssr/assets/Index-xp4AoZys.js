import { jsxs, jsx } from "react/jsx-runtime";
import { usePage, Head, Link } from "@inertiajs/react";
import { M as MarketplaceLayout } from "./MarketplaceLayout-BjqzrNjx.js";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { User, ShoppingBag, Heart, CreditCard, Bell, BookOpen, Award, MapPin, Calendar, MessageSquare, ClipboardList, History, Settings, Lock, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import "../app2.js";
import "react-dom/client";
import "sonner";
import "clsx";
function AccountIndex() {
  const { props } = usePage();
  const auth = props.auth ?? null;
  const user = (auth == null ? void 0 : auth.user) ?? null;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/user/stats").then((data) => setStats(data)).catch(() => setStats(null)).finally(() => setLoading(false));
  }, []);
  const links = [
    { label: "Orders", href: "/orders", icon: ShoppingBag },
    { label: "Wishlist", href: "/wishlist", icon: Heart },
    { label: "Wallet", href: "/wallet", icon: CreditCard },
    { label: "Notifications", href: "/notifications", icon: Bell },
    { label: "My Learning", href: "/learn/my-learning", icon: BookOpen },
    { label: "Certificates", href: "/learn/certificates", icon: Award },
    { label: "Addresses", href: "/account/addresses", icon: MapPin },
    { label: "Bookings", href: "/account/bookings", icon: Calendar },
    { label: "Reviews", href: "/account/reviews", icon: MessageSquare },
    { label: "Applications", href: "/account/applications", icon: ClipboardList },
    { label: "Healthcare History", href: "/account/healthcare-history", icon: History },
    { label: "Profile", href: "/account/profile", icon: Settings },
    { label: "Security", href: "/account/change-password", icon: Lock },
    { label: "Settings", href: "/settings", icon: Shield }
  ];
  return /* @__PURE__ */ jsxs(MarketplaceLayout, { title: "Account", children: [
    /* @__PURE__ */ jsx(Head, { title: "Account" }),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-3 py-4 space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 rounded-xl border border-border bg-card p-4", children: [
        /* @__PURE__ */ jsx("span", { className: "flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary", children: (user == null ? void 0 : user.name) ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : /* @__PURE__ */ jsx(User, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-lg font-bold", children: (user == null ? void 0 : user.name) ?? "My Account" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: (user == null ? void 0 : user.email) ?? "Manage orders, learning, wallet" })
        ] })
      ] }),
      !loading && stats && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-4 text-center", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Orders" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold", children: stats.orders_count })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-4 text-center", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Wishlist" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold", children: stats.wishlist_count })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-4 text-center", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Wallet" }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold", children: formatCurrency(stats.wallet_balance) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-4 text-center", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Courses" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold", children: stats.enrolled_courses })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: links.map((link) => /* @__PURE__ */ jsxs(
        Link,
        {
          href: link.href,
          className: "flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md",
          children: [
            /* @__PURE__ */ jsx(link.icon, { className: "h-6 w-6 text-primary" }),
            /* @__PURE__ */ jsx("span", { className: "font-semibold", children: link.label })
          ]
        },
        link.href
      )) }),
      !loading && stats && stats.recent_orders.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-card p-6 shadow-sm", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Recent Orders" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-3", children: stats.recent_orders.map((o) => /* @__PURE__ */ jsxs(Link, { href: `/orders/${o.id}`, className: "flex items-center justify-between text-sm hover:text-primary", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: o.reference }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatCurrency(o.total) }),
          /* @__PURE__ */ jsx("span", { className: "rounded-full bg-muted px-2 py-0.5 text-xs", children: o.status })
        ] }, o.id)) })
      ] })
    ] })
  ] });
}
export {
  AccountIndex as default
};
