import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Package, Heart, CreditCard, Bell, BookOpen, Award, MapPin, User, Lock, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function AccountDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/user/stats").then((data) => setStats(data)).catch(() => setStats(null)).finally(() => setLoading(false));
  }, []);
  const links = [
    { label: "My Orders", href: "/orders", icon: Package, color: "text-blue-600" },
    { label: "Wishlist", href: "/wishlist", icon: Heart, color: "text-red-500" },
    { label: "Wallet", href: "/wallet", icon: CreditCard, color: "text-green-600" },
    { label: "Notifications", href: "/notifications", icon: Bell, color: "text-yellow-600" },
    { label: "My Learning", href: "/learn/my-learning", icon: BookOpen, color: "text-purple-600" },
    { label: "Certificates", href: "/learn/certificates", icon: Award, color: "text-indigo-600" },
    { label: "My Addresses", href: "/account/addresses", icon: MapPin, color: "text-teal-600" },
    { label: "My Profile", href: "/account/profile", icon: User, color: "text-gray-600" },
    { label: "Change Password", href: "/account/change-password", icon: Lock, color: "text-orange-600" },
    { label: "Settings", href: "/settings", icon: Settings, color: "text-gray-500" }
  ];
  return /* @__PURE__ */ jsxs(AppLayout, { title: "My Account", children: [
    /* @__PURE__ */ jsx(Head, { title: "My Account" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "My Account" }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : stats ? /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 sm:grid-cols-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Orders" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: stats.orders_count })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Wishlist" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: stats.wishlist_count })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Wallet" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: formatCurrency(stats.wallet_balance) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Courses" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: stats.enrolled_courses })
        ] })
      ] }) : null,
      /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: links.map((link) => /* @__PURE__ */ jsxs(
        Link,
        {
          href: link.href,
          className: "flex items-center gap-4 rounded-lg bg-white p-5 shadow transition hover:shadow-md dark:bg-gray-800",
          children: [
            /* @__PURE__ */ jsx(link.icon, { className: `h-8 w-8 ${link.color}` }),
            /* @__PURE__ */ jsx("span", { className: "font-semibold text-gray-900 dark:text-white", children: link.label })
          ]
        },
        link.href
      )) })
    ] })
  ] });
}
export {
  AccountDashboard as default
};
