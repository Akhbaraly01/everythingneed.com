import { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { useAuthPermissions } from '@/lib/permissions';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { StatusBadge } from '@/components/shared/Ui';
import { toast } from 'sonner';
import { ArrowLeft, KeyRound } from 'lucide-react';

interface UserRow {
    id: string;
    name: string;
    email: string;
    role?: string | null;
    phone?: string | null;
    email_verified_at?: string | null;
    suspended_at?: string | null;
    created_at: string;
}

interface Grant {
    permission: string;
    note?: string | null;
    created_at: string;
}

interface VendorRow {
    id: string;
    store_name: string;
    is_verified: boolean;
}

interface Stats {
    orders: number;
    tickets: number;
}

interface Props {
    user: UserRow;
    roles: string[];
    grants: Grant[];
    vendor: VendorRow | null;
    stats: Stats;
}

const labelize = (role: string): string =>
    role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function AdminUserDetail({ user, roles, grants, vendor, stats }: Props) {
    const { workspace } = usePage().props as { workspace?: { adminHrefs?: string[] } };
    const canSee = (href: string) => (workspace?.adminHrefs ?? []).includes(href);
    const { can } = useAuthPermissions();
    const canManageUsers = can('users.users.manage', 'users.users.suspend', 'users.users.activate');
    const canManageRoles = can('users.permissions.manage');
    const [busy, setBusy] = useState(false);
    const [roleOptions, setRoleOptions] = useState<string[]>([]);

    useEffect(() => {
        api.get<{ data: { role: string }[] }>('/api/admin/roles')
            .then((res) => setRoleOptions((res.data ?? []).map((r) => r.role)))
            .catch(() => setRoleOptions([]));
    }, []);

    const suspended = !!user.suspended_at;
    const status = suspended ? 'suspended' : user.email_verified_at ? 'active' : 'unverified';

    const toggleSuspend = async () => {
        setBusy(true);
        try {
            if (suspended) {
                await api.post(`/api/admin/users/${user.id}/restore`);
                toast.success(`${user.name} restored.`);
            } else {
                await api.post(`/api/admin/users/${user.id}/suspend`);
                toast.success(`${user.name} suspended.`);
            }
            router.reload({ only: ['user'] as never });
        } catch (e) {
            toast.error(errorMessage(e, 'Action failed'));
        } finally {
            setBusy(false);
        }
    };

    const changeRole = async (role: string) => {
        setBusy(true);
        try {
            await api.put(`/api/admin/users/${user.id}/role`, { role });
            toast.success(`Role changed to ${labelize(role)}.`);
            router.reload({ only: ['user', 'roles'] as never });
        } catch (e) {
            toast.error(errorMessage(e, 'Role change refused'));
        } finally {
            setBusy(false);
        }
    };

    const options = user.role && !roleOptions.includes(user.role) ? [user.role, ...roleOptions] : roleOptions;

    return (
        <AdminLayout title={user.name}>
            <Head title={user.name} />

            <div className="space-y-6">
                <Breadcrumb items={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Users', href: '/admin/users' }, { label: user.name }]} />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/users" className="rounded-lg border border-gray-300 p-2 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700" aria-label="Back to users">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                            <p className="text-sm text-gray-500">{user.email} · Joined {formatDateTime(user.created_at)}</p>
                        </div>
                        <StatusBadge
                            status={status}
                            tone={status === 'suspended' ? 'red' : status === 'unverified' ? 'amber' : 'green'}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        {canManageRoles ? (
                            <>
                                <label className="sr-only" htmlFor="user-role">Role for {user.name}</label>
                                <select
                                    id="user-role"
                                    value={user.role ?? ''}
                                    disabled={busy}
                                    onChange={(e) => void changeRole(e.target.value)}
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                >
                                    {!user.role && <option value="">(no role)</option>}
                                    {options.map((r) => (
                                        <option key={r} value={r}>{labelize(r)}</option>
                                    ))}
                                </select>
                            </>
                        ) : (
                            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                {user.role ? labelize(user.role) : 'No role'}
                            </span>
                        )}
                        {canManageUsers && (
                            <button
                                onClick={() => void toggleSuspend()}
                                disabled={busy}
                                className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${suspended ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                {suspended ? 'Restore' : 'Suspend'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Orders placed</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats.orders}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Support tickets</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats.tickets}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Phone</p>
                        <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">{user.phone ?? '—'}</p>
                        <p className="text-xs text-gray-500">
                            {user.email_verified_at ? `Verified ${formatDateTime(user.email_verified_at)}` : 'Email not verified'}
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">Roles</h2>
                        {roles.length === 0 ? (
                            <p className="text-sm text-gray-500">No role assigned.</p>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {roles.map((r) => (
                                    <span
                                        key={r}
                                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r === user.role ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
                                    >
                                        {labelize(r)}
                                    </span>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                        <div className="mb-3 flex items-center gap-2">
                            <KeyRound className="h-4 w-4 text-violet-600" aria-hidden="true" />
                            <h2 className="font-semibold text-gray-900 dark:text-white">Extra permission grants</h2>
                        </div>
                        {grants.length === 0 ? (
                            <p className="text-sm text-gray-500">No per-user grants — access comes from the role matrix alone.</p>
                        ) : (
                            <ul className="space-y-2 text-sm">
                                {grants.map((g) => (
                                    <li key={g.permission} className="flex items-center justify-between gap-3">
                                        <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-950/40 dark:text-violet-200">
                                            {g.permission}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {g.note ? `${g.note} · ` : ''}{formatDateTime(g.created_at)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>

                {vendor && (
                    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="mb-2 font-semibold text-gray-900 dark:text-white">Linked vendor store</h2>
                        {canSee('/admin/vendors') ? (
                            <Link href={`/admin/vendors/${vendor.id}`} className="font-medium text-indigo-600 hover:underline">
                                {vendor.store_name}
                            </Link>
                        ) : (
                            <p className="font-medium text-gray-900 dark:text-white">{vendor.store_name}</p>
                        )}
                        <p className="text-sm text-gray-500">{vendor.is_verified ? 'Verified' : 'Pending verification'}</p>
                    </section>
                )}
            </div>
        </AdminLayout>
    );
}
