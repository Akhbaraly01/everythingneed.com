import { jsxs, jsx } from "react/jsx-runtime";
import { Link, usePage } from "@inertiajs/react";
import { useState, useRef, useEffect } from "react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency, C as CartDrawerProvider, G as GlobalCartDrawer, b as CompareDrawer, P as PushNotificationPrompt, g as getInitials, N as NotificationBell, F as Footer } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Search, Loader2, ShoppingBag, Wrench, GraduationCap, BedDouble, Briefcase, UtensilsCrossed, ShieldCheck, Users, Store, Package, ShoppingCart, FolderTree, Building2, KeyRound, Wallet, DollarSign, Hotel, Plane, Stethoscope, BookOpen, HelpCircle, BarChart3, Server, X, LayoutDashboard, RotateCcw, AlertTriangle, Award, ListChecks, Handshake, Sprout, HardHat, Calendar, Heart, MessageSquare, User, Pill, Bell, CreditCard, Settings, Lock, MapPin, Star, Truck, Menu, ChevronDown, LogOut } from "lucide-react";
const GROUPS = [
  { key: "products", label: "Products", icon: ShoppingBag, href: (id) => `/products/${id}` },
  { key: "services", label: "Services", icon: Wrench, href: (id) => `/needs/requests/${id}` },
  { key: "courses", label: "Courses", icon: GraduationCap, href: (id) => `/learn/${id}` },
  { key: "hotels", label: "Hotels", icon: BedDouble, href: (id) => `/hotels/${id}` },
  { key: "jobs", label: "Jobs", icon: Briefcase, href: (id) => `/jobs/${id}` },
  { key: "restaurants", label: "Food", icon: UtensilsCrossed, href: (id) => `/food/${id}` }
];
function GlobalSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const debounceRef = useRef(null);
  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(
          `/api/search?q=${encodeURIComponent(q.trim())}`
        );
        setResults(res.data);
        setOpen(true);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 250);
  }, [q]);
  const total = results ? Object.values(results).reduce((n, g) => n + ((g == null ? void 0 : g.length) ?? 0), 0) : 0;
  return /* @__PURE__ */ jsxs("div", { ref: boxRef, className: "relative w-full max-w-md", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          value: q,
          onChange: (e) => setQ(e.target.value),
          onFocus: () => q.length >= 2 && setOpen(true),
          placeholder: "Search everything…",
          className: "w-full rounded-full border border-gray-300 bg-white py-2 pl-10 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        }
      ),
      loading && /* @__PURE__ */ jsx(Loader2, { className: "absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" })
    ] }),
    open && q.trim().length >= 2 && /* @__PURE__ */ jsx("div", { className: "absolute left-0 right-0 z-40 mt-1 max-h-96 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800", children: total === 0 && !loading ? /* @__PURE__ */ jsxs("p", { className: "px-4 py-6 text-center text-sm text-gray-400", children: [
      "No matches for “",
      q,
      "”"
    ] }) : GROUPS.map(({ key, label, icon: Icon }) => {
      const group = results == null ? void 0 : results[key];
      if (!(group == null ? void 0 : group.length)) return null;
      return /* @__PURE__ */ jsxs("div", { className: "border-b border-gray-100 py-1 last:border-0 dark:border-gray-700", children: [
        /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-1.5 px-3 pt-2 text-[10px] font-bold uppercase tracking-wide text-gray-400", children: [
          /* @__PURE__ */ jsx(Icon, { className: "h-3 w-3" }),
          " ",
          label
        ] }),
        group.map((row) => {
          const id = String(row.id);
          const title = String(row.name ?? row.title ?? "Untitled");
          const price = row.price ?? row.budget;
          return /* @__PURE__ */ jsxs(
            Link,
            {
              href: hrefFor(key, id),
              onClick: () => setOpen(false),
              className: "flex items-center justify-between px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/60",
              children: [
                /* @__PURE__ */ jsx("span", { className: "truncate text-gray-800 dark:text-gray-200", children: title }),
                price != null && /* @__PURE__ */ jsx("span", { className: "ml-3 shrink-0 text-xs text-indigo-600", children: formatCurrency(Number(price)) })
              ]
            },
            id
          );
        })
      ] }, key);
    }) })
  ] });
}
function hrefFor(group, _id) {
  const found = GROUPS.find((g) => g.key === group);
  return found ? found.href(_id) : "/";
}
const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: ShoppingBag },
  { name: "Cart", href: "/cart", icon: ShoppingCart },
  { name: "Orders", href: "/orders", icon: Package },
  { name: "Returns", href: "/orders/returns", icon: RotateCcw },
  { name: "Disputes", href: "/orders/disputes", icon: AlertTriangle },
  { name: "Hotels", href: "/hotels", icon: Hotel },
  { name: "Food", href: "/food", icon: UtensilsCrossed },
  { name: "Learn", href: "/learn", icon: BookOpen },
  { name: "My Learning", href: "/learn/my-learning", icon: GraduationCap },
  { name: "Certificates", href: "/learn/certificates", icon: Award },
  { name: "Properties", href: "/properties", icon: Building2 },
  { name: "Jobs", href: "/jobs", icon: Briefcase },
  { name: "Vendors", href: "/vendors", icon: Store },
  { name: "Job Seekers", href: "/job-seekers", icon: Briefcase },
  { name: "Flights", href: "/flights", icon: Plane },
  { name: "Task Center", href: "/tasks", icon: ListChecks },
  { name: "My Requests", href: "/requests", icon: Handshake },
  { name: "Agriculture", href: "/agriculture", icon: Sprout },
  { name: "Building", href: "/building-services", icon: HardHat },
  { name: "My Bookings", href: "/bookings", icon: Calendar },
  { name: "Wishlist", href: "/wishlist", icon: Heart },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Vendor Portal", href: "/vendor", icon: Store },
  { name: "Payouts", href: "/vendor/payouts", icon: Wallet },
  { name: "Healthcare", href: "/healthcare", icon: Stethoscope },
  { name: "Lab Tests", href: "/healthcare/labs", icon: Stethoscope },
  { name: "Experts", href: "/experts", icon: User },
  { name: "Pharmacy", href: "/pharmacy", icon: Pill },
  { name: "Find Doctors", href: "/healthcare/doctors", icon: Stethoscope },
  { name: "Appointments", href: "/healthcare/appointments", icon: Calendar },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Wallet", href: "/wallet", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "My Profile", href: "/account/profile", icon: User },
  { name: "Change Password", href: "/account/change-password", icon: Lock },
  { name: "My Addresses", href: "/account/addresses", icon: MapPin },
  { name: "Help / Tickets", href: "/tickets", icon: HelpCircle },
  { name: "My Account", href: "/account/dashboard", icon: User },
  { name: "Stores", href: "/stores", icon: Store },
  { name: "Deals", href: "/deals", icon: Handshake },
  { name: "Needs & Services", href: "/needs", icon: Handshake },
  { name: "Needs History", href: "/needs/history", icon: Handshake },
  { name: "Transportation", href: "/transportation", icon: Plane },
  { name: "Agriculture", href: "/agriculture", icon: Sprout },
  { name: "Agri Products", href: "/agriculture/products", icon: Sprout },
  { name: "Agri Workers", href: "/agriculture/workers", icon: Users },
  { name: "Building Book", href: "/building-services/book", icon: HardHat },
  { name: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { name: "Reviews", href: "/reviews", icon: Star },
  { name: "Write Review", href: "/reviews/create", icon: Star },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Categories", href: "/categories", icon: FolderTree },
  { name: "Deliveries", href: "/deliveries", icon: Truck },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Compare Products", href: "/products/compare", icon: Star },
  { name: "My Analytics", href: "/analytics", icon: BarChart3 },
  { name: "My Bookings", href: "/account/bookings", icon: Calendar },
  { name: "My Applications", href: "/account/applications", icon: Briefcase },
  { name: "Health History", href: "/account/healthcare-history", icon: Stethoscope },
  { name: "My Reviews", href: "/account/reviews", icon: Star },
  { name: "Food Orders", href: "/food/order-history", icon: UtensilsCrossed },
  { name: "Pharmacy Upload", href: "/pharmacy/prescription-upload", icon: Pill },
  { name: "Vendor - Add Product", href: "/vendor/products/create", icon: Package }
];
const SA = "super_admin";
const ADMIN = "administrator";
const adminNavigation = [
  { name: "Admin Dashboard", href: "/admin/dashboard", icon: ShieldCheck, roles: [SA, ADMIN] },
  { name: "Admin - Users", href: "/admin/users", icon: Users, roles: [SA, ADMIN] },
  { name: "Admin - Vendors", href: "/admin/vendors", icon: Store, roles: [SA, ADMIN] },
  { name: "Admin - Products", href: "/admin/products", icon: Package, roles: [SA, ADMIN] },
  { name: "Admin - Orders", href: "/admin/orders", icon: ShoppingCart, roles: [SA, ADMIN] },
  { name: "Admin - Approvals", href: "/admin/approvals", icon: ShieldCheck, roles: [SA, ADMIN, "category_admin"] },
  { name: "Admin - Categories", href: "/admin/categories", icon: FolderTree, roles: [SA, ADMIN, "category_admin"] },
  { name: "Admin - Departments", href: "/admin/departments", icon: Building2, roles: [SA, ADMIN, "customer_service", "support_staff"] },
  { name: "Admin - RBAC", href: "/admin/rbac", icon: KeyRound, roles: [SA] },
  { name: "Admin - Payouts", href: "/admin/payouts", icon: Wallet, roles: [SA, ADMIN, "finance_admin"] },
  { name: "Admin - Finance", href: "/admin/finance", icon: DollarSign, roles: [SA, ADMIN, "finance_admin"] },
  { name: "Admin - Hotels", href: "/admin/hotels", icon: Hotel, roles: [SA, ADMIN] },
  { name: "Admin - Food", href: "/admin/food", icon: UtensilsCrossed, roles: [SA, ADMIN] },
  { name: "Admin - Transport", href: "/admin/transport", icon: Plane, roles: [SA, ADMIN] },
  { name: "Admin - Jobs", href: "/admin/jobs", icon: Briefcase, roles: [SA, ADMIN] },
  { name: "Admin - Healthcare", href: "/admin/healthcare/doctors", icon: Stethoscope, roles: [SA, ADMIN, "healthcare_admin"] },
  { name: "Admin - Learning", href: "/admin/learning/courses", icon: BookOpen, roles: [SA, ADMIN, "learning_admin"] },
  { name: "Admin - CMS", href: "/admin/cms", icon: Building2, roles: [SA, ADMIN] },
  { name: "Admin - Support", href: "/admin/support/tickets", icon: HelpCircle, roles: [SA, ADMIN, "support_staff", "customer_service"] },
  { name: "Admin - Audit Logs", href: "/admin/audit-logs", icon: ShieldCheck, roles: [SA] },
  { name: "Admin - Analytics", href: "/admin/analytics", icon: BarChart3, roles: [SA, ADMIN] },
  { name: "Admin - System", href: "/admin/system", icon: Server, roles: [SA] }
];
function AppLayout(props) {
  return /* @__PURE__ */ jsxs(CartDrawerProvider, { children: [
    /* @__PURE__ */ jsx(AppLayoutShell, { ...props }),
    /* @__PURE__ */ jsx(GlobalCartDrawer, {}),
    /* @__PURE__ */ jsx(CompareDrawer, {}),
    /* @__PURE__ */ jsx(PushNotificationPrompt, {})
  ] });
}
function AppLayoutShell({ children, title }) {
  var _a;
  const auth = usePage().props.auth;
  const user = (auth == null ? void 0 : auth.user) ?? auth;
  const page = usePage();
  const authRoles = ((_a = page.props.auth) == null ? void 0 : _a.roles) ?? [];
  const visibleAdminNavigation = adminNavigation.filter(
    (item) => item.roles.some((r) => authRoles.includes(r))
  );
  const isAdminPage = page.url === "/admin" || page.url.startsWith("/admin/");
  const canViewAdminPage = !isAdminPage || visibleAdminNavigation.some((item) => page.url === item.href || page.url.startsWith(`${item.href}/`));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  useEffect(() => {
    if (!profileOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [profileOpen]);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900", children: [
    sidebarOpen && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50 lg:hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-gray-900/80", onClick: () => setSidebarOpen(false) }),
      /* @__PURE__ */ jsx("div", { className: "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800", children: /* @__PURE__ */ jsxs("div", { className: "flex h-full flex-col", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4", children: [
          /* @__PURE__ */ jsx(Link, { href: "/dashboard", className: "text-xl font-bold text-gray-900 dark:text-white", children: "EverythingNeed" }),
          /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "Close menu", onClick: () => setSidebarOpen(false), children: /* @__PURE__ */ jsx(X, { className: "h-6 w-6" }) })
        ] }),
        /* @__PURE__ */ jsx("nav", { className: "flex-1 space-y-1 overflow-y-auto px-3", children: [...navigation, ...visibleAdminNavigation].map((item) => /* @__PURE__ */ jsxs(
          Link,
          {
            href: item.href,
            className: `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${page.url === item.href ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"}`,
            children: [
              /* @__PURE__ */ jsx(item.icon, { className: "h-5 w-5" }),
              item.name
            ]
          },
          item.name
        )) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col", children: /* @__PURE__ */ jsxs("div", { className: "flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white dark:bg-gray-800", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-1 flex-col overflow-y-auto pt-5 pb-4", children: [
        /* @__PURE__ */ jsx("div", { className: "flex flex-shrink-0 items-center px-4", children: /* @__PURE__ */ jsx(Link, { href: "/dashboard", className: "text-xl font-bold text-gray-900 dark:text-white", children: "EverythingNeed" }) }),
        /* @__PURE__ */ jsx("nav", { className: "mt-8 flex-1 space-y-1 overflow-y-auto px-3", children: [...navigation, ...visibleAdminNavigation].map((item) => /* @__PURE__ */ jsxs(
          Link,
          {
            href: item.href,
            className: `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${page.url === item.href ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"}`,
            children: [
              /* @__PURE__ */ jsx(item.icon, { className: "h-5 w-5" }),
              item.name
            ]
          },
          item.name
        )) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-shrink-0 border-t border-gray-200 p-4", children: /* @__PURE__ */ jsx("div", { className: "group block w-full flex-shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsx("div", { className: "inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-500", children: /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-white", children: getInitials((user == null ? void 0 : user.name) ?? "U") }) }),
        /* @__PURE__ */ jsxs("div", { className: "ml-3", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-700 dark:text-gray-200", children: user == null ? void 0 : user.name }),
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-gray-500", children: user == null ? void 0 : user.email })
        ] })
      ] }) }) })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "lg:pl-72", children: [
      /* @__PURE__ */ jsxs("div", { className: "sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm dark:bg-gray-800 sm:gap-x-6 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "-m-2.5 p-2.5 text-gray-700 lg:hidden",
            onClick: () => setSidebarOpen(true),
            "aria-label": "Open menu",
            children: /* @__PURE__ */ jsx(Menu, { className: "h-6 w-6" })
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-1 gap-x-4 self-stretch lg:gap-x-6", children: [
          /* @__PURE__ */ jsx(GlobalSearch, {}),
          /* @__PURE__ */ jsx("div", { className: "flex flex-1" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-x-4 lg:gap-x-6", children: [
            /* @__PURE__ */ jsx(NotificationBell, {}),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  className: "-m-1.5 flex items-center p-1.5",
                  onClick: () => setProfileOpen(!profileOpen),
                  "aria-label": "Open profile menu",
                  "aria-expanded": profileOpen,
                  "aria-haspopup": "menu",
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-500", children: /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-white", children: getInitials((user == null ? void 0 : user.name) ?? "U") }) }),
                    /* @__PURE__ */ jsxs("span", { className: "hidden lg:flex lg:items-center", children: [
                      /* @__PURE__ */ jsx("span", { className: "ml-2 text-sm font-semibold text-gray-700 dark:text-gray-200", children: user == null ? void 0 : user.name }),
                      /* @__PURE__ */ jsx(ChevronDown, { className: "ml-2 h-4 w-4 text-gray-400" })
                    ] })
                  ]
                }
              ),
              profileOpen && /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  "aria-label": "Close profile menu",
                  onClick: () => setProfileOpen(false),
                  className: "fixed inset-0 z-[5] cursor-default bg-transparent"
                }
              ),
              profileOpen && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5", children: [
                /* @__PURE__ */ jsxs(
                  Link,
                  {
                    href: "/profile",
                    className: "flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100",
                    onClick: () => setProfileOpen(false),
                    children: [
                      /* @__PURE__ */ jsx(User, { className: "h-4 w-4" }),
                      "Profile"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  Link,
                  {
                    href: "/settings",
                    className: "flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100",
                    onClick: () => setProfileOpen(false),
                    children: [
                      /* @__PURE__ */ jsx(Settings, { className: "h-4 w-4" }),
                      "Settings"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  Link,
                  {
                    href: "/wallet",
                    className: "flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100",
                    onClick: () => setProfileOpen(false),
                    children: [
                      /* @__PURE__ */ jsx(CreditCard, { className: "h-4 w-4" }),
                      "Wallet"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  Link,
                  {
                    href: "/logout",
                    method: "post",
                    className: "flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100",
                    onClick: () => setProfileOpen(false),
                    children: [
                      /* @__PURE__ */ jsx(LogOut, { className: "h-4 w-4" }),
                      "Sign out"
                    ]
                  }
                )
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("main", { className: "py-6", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: [
        title && /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold text-gray-900 dark:text-white", children: title }) }),
        !canViewAdminPage ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx(ShieldCheck, { className: "mx-auto h-12 w-12 text-gray-400" }),
          /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "Access denied" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-500", children: "Your role does not have access to this admin page." }),
          /* @__PURE__ */ jsx(
            Link,
            {
              href: "/dashboard",
              className: "mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500",
              children: "Back to Dashboard"
            }
          )
        ] }) : children
      ] }) }),
      /* @__PURE__ */ jsx(
        Footer,
        {
          socialLinks: page.props.socialLinks ?? {},
          appLinks: page.props.appLinks ?? {}
        }
      )
    ] })
  ] });
}
export {
  AppLayout as A
};
