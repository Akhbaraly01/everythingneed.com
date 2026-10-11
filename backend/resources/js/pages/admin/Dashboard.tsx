import AdminLayout from '@/layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import {
    Users,
    Store,
    ShoppingCart,
    DollarSign,
    AlertTriangle,
    HelpCircle,
    Stethoscope,
    BookOpen,
    Building2,
    Package,
    LayoutDashboard,
    ShieldCheck,
    Scale,
    Undo2,
    Banknote,
    ChevronRight,
    CheckCircle2,
    UserCog,
} from 'lucide-react';

interface DashboardCard {
    label: string;
    value: number | string;
    href?: string | null;
    icon?: string;
    format?: 'currency' | 'number';
}

interface AdminStats {
    total_users: number;
    total_vendors: number;
    total_orders: number;
    total_revenue: number;
    pending_approvals: number;
    open_tickets: number;
}

interface AttentionItem {
    label: string;
    count: number;
    href: string;
    icon?: string;
}

/** One admin-console account in the super-only Admin Access panel. */
interface AdminAccessAccount {
    id: string;
    name: string;
    email: string;
    roles: string[];
    suspended: boolean;
    is_self: boolean;
}

interface AdminDashboardProps {
    cards: DashboardCard[];
    stats: AdminStats | null;
    needsAttention?: AttentionItem[];
    /** Super-only: null/absent for every other role. */
    adminAccess?: AdminAccessAccount[] | null;
}

const labelize = (role: string): string =>
    role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const ICONS: Record<string, typeof Users> = {
    users: Users,
    vendors: Store,
    orders: ShoppingCart,
    revenue: DollarSign,
    approvals: AlertTriangle,
    tickets: HelpCircle,
    health: Stethoscope,
    learn: BookOpen,
    cms: Building2,
    kyc: ShieldCheck,
    disputes: Scale,
    returns: Undo2,
    payouts: Banknote,
    inventory: Package,
};

const CARD_COLORS = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-yellow-600', 'text-orange-600', 'text-red-600'];

function formatValue(card: DashboardCard): string {
    if (card.format === 'currency' && typeof card.value === 'number') {
        return formatCurrency(card.value);
    }
    return typeof card.value === 'number' ? card.value.toLocaleString() : String(card.value);
}

/**
 * Administration dashboard. All figures come from server-computed props
 * backed by real PostgreSQL queries for the signed-in role — an empty
 * database renders honest zeros, never fabricated numbers.
 *
 * "Needs Attention" lists live work queues (count > 0 only), each already
 * filtered server-side against the role's permitted admin hrefs, so every
 * row links to a page the role can actually open.
 */
export default function AdminDashboard({ cards = [], stats = null, needsAttention = [], adminAccess = null }: AdminDashboardProps) {
    const { uiTexts } = usePage().props as {
        uiTexts?: { ui?: Record<string, { label?: string; value?: string }> };
    };
    const dashboardTitle = uiTexts?.ui?.dashboard_title?.value || 'Administration Dashboard';

    const [access, setAccess] = useState<AdminAccessAccount[]>(adminAccess ?? []);
    const [accessBusy, setAccessBusy] = useState<string | null>(null);

    useEffect(() => {
        setAccess(adminAccess ?? []);
    }, [adminAccess]);

    const toggleAccess = async (account: AdminAccessAccount) => {
        const suspend = !account.suspended;
        setAccessBusy(account.id);
        try {
            if (suspend) await api.post(`/api/admin/users/${account.id}/suspend`);
            else await api.post(`/api/admin/users/${account.id}/restore`);
            setAccess((prev) =>
                prev.map((a) => (a.id === account.id ? { ...a, suspended: suspend } : a)),
            );
            toast.success(suspend ? `${account.name}'s access is off.` : `${account.name}'s access is on.`);
        } catch (e) {
            toast.error(errorMessage(e, 'Could not change access'));
        } finally {
            setAccessBusy(null);
        }
    };

    const statTiles = stats
        ? [
              { label: 'Total Users', value: stats.total_users.toLocaleString(), href: '/admin/users', icon: Users },
              { label: 'Total Vendors', value: stats.total_vendors.toLocaleString(), href: '/admin/vendors', icon: Store },
              { label: 'Total Orders', value: stats.total_orders.toLocaleString(), href: '/admin/orders', icon: ShoppingCart },
              { label: 'Revenue', value: formatCurrency(stats.total_revenue), href: '/admin/finance', icon: DollarSign },
              { label: 'Pending Approvals', value: stats.pending_approvals.toLocaleString(), href: '/admin/approvals', icon: AlertTriangle },
              { label: 'Open Tickets', value: stats.open_tickets.toLocaleString(), href: '/admin/support/tickets', icon: HelpCircle },
          ]
        : [];

    const attentionTotal = needsAttention.reduce((sum, item) => sum + item.count, 0);

    return (
        <AdminLayout title={dashboardTitle}>
            <Head title={dashboardTitle} />

            <div className="mb-8 rounded-xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Needs Attention</h2>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            Live work queues for your role
                        </p>
                    </div>
                    {needsAttention.length > 0 && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                            {attentionTotal} item{attentionTotal === 1 ? '' : 's'}
                        </span>
                    )}
                </div>

                {needsAttention.length === 0 ? (
                    <div className="flex items-center gap-3 px-5 py-5">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/30">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </span>
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Nothing needs your attention</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                No open work items in your assigned areas right now.
                            </p>
                        </div>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {needsAttention.map((item) => {
                            const Icon = ICONS[item.icon ?? ''] ?? Package;
                            return (
                                <li key={`${item.href}-${item.label}`}>
                                    <Link
                                        href={item.href}
                                        className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                    >
                                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-700">
                                            <Icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                        </span>
                                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">
                                            {item.label}
                                        </span>
                                        <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                                            {item.count}
                                        </span>
                                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {access.length > 0 && (
                <div className="mb-8 rounded-xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Admin Access</h2>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                Turn console access on or off for admin accounts
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                            <UserCog className="h-3.5 w-3.5" /> Super admin only
                        </span>
                    </div>

                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {access.map((account) => (
                            <li key={account.id} className="flex items-center gap-3 px-5 py-3.5">
                                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                                    {account.name.charAt(0).toUpperCase()}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                        {account.name}
                                        {account.is_self && <span className="ml-1.5 text-xs text-gray-400">(you)</span>}
                                    </p>
                                    <p className="truncate text-xs text-gray-500">{account.email}</p>
                                </div>
                                <div className="hidden flex-wrap gap-1 sm:flex">
                                    {account.roles.slice(0, 3).map((role) => (
                                        <span
                                            key={role}
                                            className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                        >
                                            {labelize(role)}
                                        </span>
                                    ))}
                                </div>
                                <span
                                    className={`inline-flex w-20 justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                        account.suspended
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'
                                            : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200'
                                    }`}
                                >
                                    {account.suspended ? 'Suspended' : 'Active'}
                                </span>
                                <button
                                    role="switch"
                                    aria-checked={!account.suspended}
                                    aria-label={`Toggle access for ${account.name}`}
                                    disabled={account.is_self || accessBusy === account.id}
                                    title={
                                        account.is_self
                                            ? 'You cannot suspend your own account'
                                            : account.suspended
                                              ? 'Turn access on'
                                              : 'Turn access off'
                                    }
                                    onClick={() => void toggleAccess(account)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                                        !account.suspended ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            !account.suspended ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {statTiles.length > 0 && (
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {statTiles.map((tile) => (
                        <Link
                            key={tile.label}
                            href={tile.href}
                            className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition hover:shadow dark:bg-gray-800 dark:ring-gray-700"
                        >
                            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-700">
                                <tile.icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                            </span>
                            <span>
                                <span className="block text-sm text-gray-500 dark:text-gray-400">{tile.label}</span>
                                <span className="block text-xl font-semibold text-gray-900 dark:text-white">{tile.value}</span>
                            </span>
                        </Link>
                    ))}
                </div>
            )}

            {cards.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {cards.map((card, index) => {
                        const Icon = ICONS[card.icon ?? ''] ?? Package;
                        const body = (
                            <>
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-700">
                                    <Icon className={`h-5 w-5 ${CARD_COLORS[index % CARD_COLORS.length]}`} />
                                </span>
                                <span className="mt-3 block text-2xl font-semibold text-gray-900 dark:text-white">
                                    {formatValue(card)}
                                </span>
                                <span className="block text-sm text-gray-500 dark:text-gray-400">{card.label}</span>
                            </>
                        );
                        return card.href ? (
                            <Link
                                key={card.label}
                                href={card.href}
                                className="block rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition hover:shadow dark:bg-gray-800 dark:ring-gray-700"
                            >
                                {body}
                            </Link>
                        ) : (
                            <div
                                key={card.label}
                                className="block rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700"
                            >
                                {body}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
                    <LayoutDashboard className="mx-auto h-10 w-10 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No role-specific metrics yet</h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Your role has no dashboard counters in this domain. Use the navigation to manage the resources you
                        are authorized for.
                    </p>
                    <Link
                        href="/dashboard"
                        className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                    >
                        Back to Marketplace
                    </Link>
                </div>
            )}
        </AdminLayout>
    );
}
