import {
    ShieldCheck,
    Users,
    KeyRound,
    BarChart3,
    Package,
    FolderTree,
    Store,
    ShoppingCart,
    DollarSign,
    Wallet,
    Stethoscope,
    BookOpen,
    Building2,
    HelpCircle,
    Hotel,
    UtensilsCrossed,
    Plane,
    Briefcase,
    Menu,
    Server,
    Settings,
    LayoutDashboard,
    ListChecks,
    Handshake,
    ShoppingBag,
    Mail,
    BadgeCheck,
    Boxes,
    Pill,
    Scale,
    Star,
    CreditCard,
    Bell,
    Truck,
    Home,
    FileText,
    Images,
    LayoutGrid,
    FormInput,
    HeartHandshake,
    Flag,
    type LucideIcon,
} from 'lucide-react';

/**
 * Central administration navigation registry.
 *
 * One entry per real admin web route (routes/web.php admin groups).
 * Visibility is decided by the SERVER-shared workspace.adminHrefs
 * (derived from each route's role: middleware) AND, when set, the
 * auth.permissions list (role matrix ∪ per-user grants): a permission
 * field is a UX refinement whose value every role on the route's role
 * list holds in the seeded matrix (enforced by ConsoleNavPermissionTest).
 * Hiding nav is UX, never authorization: every /admin/* route stays
 * guarded by backend middleware.
 */
export interface ConsoleNavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    group: string;
    /** Canonical catalog permission required to SEE this entry (UX only). */
    permission?: string;
}

export const adminNavigation: ConsoleNavItem[] = [
    // Platform
    { label: 'Dashboard', href: '/admin/dashboard', icon: ShieldCheck, group: 'Platform' },
    { label: 'Users', href: '/admin/users', icon: Users, group: 'Platform', permission: 'users.users.view' },
    { label: 'Roles & Permissions', href: '/admin/rbac', icon: KeyRound, group: 'Platform', permission: 'users.permissions.manage' },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, group: 'Platform', permission: 'analytics.overview.view' },
    { label: 'Reports', href: '/admin/reports', icon: FileText, group: 'Platform', permission: 'reports.reports.view' },

    // Commerce
    { label: 'Products', href: '/admin/products', icon: Package, group: 'Commerce', permission: 'products.products.view' },
    { label: 'Categories', href: '/admin/categories', icon: FolderTree, group: 'Commerce', permission: 'categories.categories.view' },
    { label: 'Approvals', href: '/admin/approvals', icon: ShieldCheck, group: 'Commerce', permission: 'products.products.approve' },
    { label: 'Vendors', href: '/admin/vendors', icon: Store, group: 'Commerce', permission: 'vendors.vendors.view' },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingCart, group: 'Commerce', permission: 'orders.orders.view' },
    { label: 'Brands', href: '/admin/brands', icon: ShoppingBag, group: 'Commerce', permission: 'products.products.view' },
    { label: 'Inventory', href: '/admin/inventory', icon: Boxes, group: 'Commerce', permission: 'inventory.stock.view' },

    // Finance
    { label: 'Finance', href: '/admin/finance', icon: DollarSign, group: 'Finance', permission: 'finance.overview.view' },
    { label: 'Payouts', href: '/admin/payouts', icon: Wallet, group: 'Finance', permission: 'finance.payouts.manage' },
    { label: 'Wallet Ledger', href: '/admin/wallet', icon: Wallet, group: 'Finance', permission: 'finance.transactions.view' },
    { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard, group: 'Finance', permission: 'subscriptions.subscriptions.view' },

    // Healthcare
    { label: 'Doctors', href: '/admin/healthcare/doctors', icon: Stethoscope, group: 'Healthcare', permission: 'healthcare.overview.view' },
    { label: 'Healthcare Aid', href: '/admin/healthcare/aid', icon: HeartHandshake, group: 'Healthcare', permission: 'healthcare.aid.view' },

    // Learning
    { label: 'Courses', href: '/admin/learning/courses', icon: BookOpen, group: 'Learning', permission: 'learn.overview.view' },
    { label: 'Content Review', href: '/admin/learning/review', icon: ListChecks, group: 'Learning', permission: 'learn.posts.review' },

    // Content
    { label: 'CMS', href: '/admin/cms', icon: Building2, group: 'Content', permission: 'cms.pages.view' },
    { label: 'Home Sections', href: '/admin/home-sections', icon: Home, group: 'Content', permission: 'cms.home.view' },
    { label: 'Navigation', href: '/admin/navigation', icon: Menu, group: 'Content', permission: 'cms.pages.view' },
    { label: 'Modules', href: '/admin/modules', icon: LayoutGrid, group: 'Content', permission: 'modules.view' },
    { label: 'Forms', href: '/admin/forms', icon: FormInput, group: 'Content', permission: 'forms.view' },
    { label: 'Media Library', href: '/admin/media', icon: Images, group: 'Content', permission: 'media.view' },
    { label: 'Newsletter', href: '/admin/newsletter', icon: Mail, group: 'Content', permission: 'cms.pages.view' },

    // Operations
    { label: 'Hotels', href: '/admin/hotels', icon: Hotel, group: 'Operations', permission: 'hotels.overview.view' },
    { label: 'Food', href: '/admin/food', icon: UtensilsCrossed, group: 'Operations', permission: 'food.overview.view' },
    { label: 'Transport', href: '/admin/transport', icon: Plane, group: 'Operations', permission: 'transport.overview.view' },
    { label: 'Jobs', href: '/admin/jobs', icon: Briefcase, group: 'Operations', permission: 'jobs.overview.view' },
    { label: 'Deliveries', href: '/admin/deliveries', icon: Truck, group: 'Operations', permission: 'delivery.deliveries.view' },
    { label: 'Pharmacy', href: '/admin/pharmacy', icon: Pill, group: 'Operations', permission: 'pharmacy.overview.view' },
    { label: 'Building Services', href: '/admin/building', icon: Building2, group: 'Operations', permission: 'building_services.overview.view' },
    { label: 'Services', href: '/admin/services', icon: Building2, group: 'Operations', permission: 'services.overview.view' },
    { label: 'Real Estate', href: '/admin/real-estate', icon: Home, group: 'Operations', permission: 'real_estate.overview.view' },
    { label: 'Needs & Tasks', href: '/admin/needs', icon: Flag, group: 'Operations', permission: 'needs.overview.view' },

    // Support
    { label: 'Tickets', href: '/admin/support/tickets', icon: HelpCircle, group: 'Support', permission: 'support.tickets.view' },
    { label: 'Departments', href: '/admin/departments', icon: Building2, group: 'Support', permission: 'support.overview.view' },
    { label: 'Returns & Disputes', href: '/admin/returns', icon: Scale, group: 'Support', permission: 'orders.orders.view' },
    { label: 'Reviews', href: '/admin/reviews', icon: Star, group: 'Support', permission: 'reviews.reviews.moderate' },

    // Security
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldCheck, group: 'Security', permission: 'audit.logs.view' },
    { label: 'KYC Review', href: '/admin/kyc', icon: BadgeCheck, group: 'Security', permission: 'kyc.applications.view' },
    { label: 'Notifications', href: '/admin/notifications', icon: Bell, group: 'Security', permission: 'notifications.overview.view' },

    // System
    { label: 'Settings', href: '/admin/settings', icon: Settings, group: 'System', permission: 'settings.system.update' },
    { label: 'System Health', href: '/admin/system', icon: Server, group: 'System', permission: 'settings.system.update' },
];

/**
 * Documented route aliases (routes/web.php §59): canonical registry entry
 * already covers the shared page; the alias href stays route-accessible.
 * Kept in sync by AdminAuthorizationMatrixTest::test_registry_covers_every_admin_route.
 */
export const adminRouteAliases: Record<string, string> = {
    '/admin': '/admin/dashboard',
    '/admin/category': '/admin/categories',
    '/admin/roles': '/admin/rbac',
    '/admin/support': '/admin/support/tickets',
};

/** Provider/worker console navigation (worker-role routes only). */
export const providerNavigation: ConsoleNavItem[] = [
    { label: 'Workspace Overview', href: '/provider', icon: LayoutDashboard, group: 'Provider' },
    { label: 'Task Center', href: '/tasks', icon: ListChecks, group: 'Provider' },
    { label: 'My Applications', href: '/tasks/my-applications', icon: Briefcase, group: 'Provider' },
    { label: 'Needs Work', href: '/provider/needs', icon: Handshake, group: 'Provider' },
    { label: 'Provider Profile', href: '/provider/profile', icon: BadgeCheck, group: 'Provider' },
    { label: 'Jobs', href: '/jobs', icon: ShoppingBag, group: 'Discover' },
    { label: 'Needs & Services', href: '/needs', icon: Handshake, group: 'Discover' },
    { label: 'My Requests', href: '/requests', icon: Handshake, group: 'Discover' },
    { label: 'Marketplace', href: '/dashboard', icon: ShoppingBag, group: 'Discover' },
];
