import {
    AlertTriangle,
    Award,
    BarChart3,
    Bell,
    BookOpen,
    Briefcase,
    Building2,
    Calendar,
    ClipboardList,
    CreditCard,
    FlaskConical,
    FolderTree,
    GraduationCap,
    Handshake,
    HardHat,
    Heart,
    HeartHandshake,
    HelpCircle,
    Hotel,
    LayoutDashboard,
    ListChecks,
    Lock,
    MapPin,
    MessageSquare,
    Package,
    Pill,
    Plane,
    Receipt,
    RotateCcw,
    Settings,
    ShieldCheck,
    ShoppingBag,
    ShoppingCart,
    Sprout,
    Star,
    Stethoscope,
    Store,
    Truck,
    User,
    Users,
    UtensilsCrossed,
    Wallet,
    type LucideIcon,
} from 'lucide-react';

export interface AppNavItem {
    name: string;
    href: string;
    icon: LucideIcon;
    /** Optional role allow-list; omitted = every authenticated customer. */
    roles?: string[];
}

export interface AppNavGroup {
    label: string;
    /** Only show for a workspace this account can actually enter. */
    workspace?: 'admin' | 'vendor' | 'provider';
    items: AppNavItem[];
}

/**
 * Customer/marketplace navigation registry.
 *
 * Every authenticated account sees the marketplace groups; vendor and
 * provider groups are unlocked by the server-shared workspace list, and
 * the administration entry by the admin workspace. This mirrors the
 * backend authority (routes re-check the role on every request) and stops
 * a customer from being shown vendor/provider surfaces they cannot use.
 */
export const appNavigation: AppNavGroup[] = [
    {
        label: 'Shop',
        items: [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { name: 'Products', href: '/products', icon: ShoppingBag },
            { name: 'Categories', href: '/categories', icon: FolderTree },
            { name: 'Stores', href: '/stores', icon: Store },
            { name: 'Deals', href: '/deals', icon: Handshake },
            { name: 'Cart', href: '/cart', icon: ShoppingCart },
            { name: 'Wishlist', href: '/wishlist', icon: Heart },
            { name: 'Compare Products', href: '/products/compare', icon: Star },
        ],
    },
    {
        label: 'Orders',
        items: [
            { name: 'Orders', href: '/orders', icon: Package },
            { name: 'Returns', href: '/orders/returns', icon: RotateCcw },
            { name: 'Disputes', href: '/orders/disputes', icon: AlertTriangle },
            { name: 'Deliveries', href: '/deliveries', icon: Truck },
            { name: 'My Bookings', href: '/bookings', icon: Calendar },
            { name: 'Food Orders', href: '/food/order-history', icon: UtensilsCrossed },
            { name: 'Needs History', href: '/needs/history', icon: Handshake },
        ],
    },
    {
        label: 'Services',
        items: [
            { name: 'Hotels', href: '/hotels', icon: Hotel },
            { name: 'Food', href: '/food', icon: UtensilsCrossed },
            { name: 'Flights', href: '/flights', icon: Plane },
            { name: 'Properties', href: '/properties', icon: Building2 },
            { name: 'Jobs', href: '/jobs', icon: Briefcase },
            { name: 'Job Seekers', href: '/job-seekers', icon: Users },
            { name: 'Task Center', href: '/tasks', icon: ListChecks },
            { name: 'My Requests', href: '/requests', icon: Handshake },
            { name: 'Needs & Services', href: '/needs', icon: Handshake },
            { name: 'Agriculture', href: '/agriculture', icon: Sprout },
            { name: 'Agri Products', href: '/agriculture/products', icon: Sprout },
            { name: 'Agri Workers', href: '/agriculture/workers', icon: Users },
            { name: 'Building', href: '/building-services', icon: HardHat },
            { name: 'Building Book', href: '/building-services/book', icon: HardHat },
            { name: 'Transportation', href: '/transportation', icon: Plane },
            { name: 'Vendors', href: '/vendors', icon: Store },
            { name: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
        ],
    },
    {
        label: 'Health',
        items: [
            { name: 'Healthcare', href: '/healthcare', icon: Stethoscope },
            { name: 'Find Doctors', href: '/healthcare/doctors', icon: Stethoscope },
            { name: 'Appointments', href: '/healthcare/appointments', icon: Calendar },
            { name: 'Health Bookings', href: '/healthcare/bookings', icon: Calendar },
            { name: 'Healthcare Aid', href: '/healthcare/aid', icon: HeartHandshake },
            { name: 'Records', href: '/healthcare/records', icon: ClipboardList },
            { name: 'Prescriptions', href: '/healthcare/prescriptions', icon: Pill },
            { name: 'Lab Tests', href: '/healthcare/labs', icon: FlaskConical },
            { name: 'Experts', href: '/experts', icon: User },
            { name: 'Pharmacy', href: '/pharmacy', icon: Pill },
            { name: 'Pharmacy Upload', href: '/pharmacy/prescription-upload', icon: Pill },
            { name: 'Health History', href: '/account/healthcare-history', icon: Stethoscope },
        ],
    },
    {
        label: 'Learning',
        items: [
            { name: 'Learn', href: '/learn', icon: BookOpen },
            { name: 'My Learning', href: '/learn/my-learning', icon: GraduationCap },
            { name: 'Instructors', href: '/learn/instructors', icon: Users },
            { name: 'Certificates', href: '/learn/certificates', icon: Award },
        ],
    },
    {
        label: 'Money',
        items: [
            { name: 'Wallet', href: '/wallet', icon: Wallet },
            { name: 'Bills', href: '/bills', icon: Receipt },
            { name: 'Payments', href: '/payments', icon: CreditCard },
            { name: 'My Analytics', href: '/analytics', icon: BarChart3 },
            { name: 'Reviews', href: '/reviews', icon: Star },
            { name: 'Write Review', href: '/reviews/create', icon: Star },
            { name: 'My Reviews', href: '/account/reviews', icon: Star },
        ],
    },
    {
        label: 'Account',
        items: [
            { name: 'My Account', href: '/account/dashboard', icon: User },
            { name: 'My Profile', href: '/account/profile', icon: User },
            { name: 'My Addresses', href: '/account/addresses', icon: MapPin },
            { name: 'My Applications', href: '/account/applications', icon: Briefcase },
            { name: 'Settings', href: '/settings', icon: Settings },
            { name: 'Change Password', href: '/account/change-password', icon: Lock },
            { name: 'Help / Tickets', href: '/account/support', icon: HelpCircle },
            { name: 'Notifications', href: '/notifications', icon: Bell },
            { name: 'Messages', href: '/messages', icon: MessageSquare },
        ],
    },
    {
        label: 'Vendor',
        workspace: 'vendor',
        items: [
            { name: 'Vendor Portal', href: '/vendor', icon: Store },
            { name: 'Vendor Products', href: '/vendor/products', icon: Package },
            { name: 'Vendor Add Product', href: '/vendor/products/create', icon: Package },
            { name: 'Vendor Orders', href: '/vendor/orders', icon: ShoppingCart },
            { name: 'Payouts', href: '/vendor/payouts', icon: Wallet },
            { name: 'Vendor Profile', href: '/vendor/profile', icon: User },
        ],
    },
    {
        label: 'Provider',
        workspace: 'provider',
        items: [
            { name: 'Provider Workspace', href: '/provider', icon: LayoutDashboard },
            { name: 'Needs Work', href: '/provider/needs', icon: Handshake },
            { name: 'My Applications', href: '/tasks/my-applications', icon: Briefcase },
            { name: 'Provider Profile', href: '/provider/profile', icon: ShieldCheck },
        ],
    },
    {
        label: 'Admin',
        workspace: 'admin',
        items: [{ name: 'Administration', href: '/admin/dashboard', icon: ShieldCheck }],
    },
];

export interface AppNavContext {
    roles: string[];
    workspaces: string[];
}

export function visibleAppNavigation(groups: AppNavGroup[], context: AppNavContext): AppNavGroup[] {
    return groups
        .map((group) => {
            if (group.workspace && !context.workspaces.includes(group.workspace)) {
                return null;
            }

            const items = group.items.filter(
                (item) => !item.roles || item.roles.some((role) => context.roles.includes(role)),
            );

            return items.length > 0 ? { ...group, items } : null;
        })
        .filter((group): group is AppNavGroup => group !== null);
}
