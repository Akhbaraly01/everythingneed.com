import AdminLayout from '@/layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { useCallback, useEffect, useState } from 'react';
import DataTable from '@/components/shared/DataTable';
import SearchInput from '@/components/shared/SearchInput';
import { StatusBadge } from '@/components/shared/Ui';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { toast } from 'sonner';
import { KeyRound, Plus, X } from 'lucide-react';

/** Real shape returned by UserAdminService::paginate(). */
interface User {
    id: string;
    name: string;
    email: string;
    role: string | null;
    status: 'active' | 'suspended' | 'unverified';
    email_verified_at?: string | null;
    suspended_at?: string | null;
    created_at: string;
}

interface RoleSummary {
    role: string;
    user_count: number;
}

const labelize = (role: string): string =>
    role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function AdminUsers() {
    const permissions =
        (usePage().props.auth as { permissions?: string[] } | null)?.permissions ?? [];
    const canCreate = permissions.includes('*') || permissions.includes('users.users.create');

    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Create-user dialog.
    const [showAdd, setShowAdd] = useState(false);
    const [adding, setAdding] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: '' });

    useEffect(() => {
        api.get<{ data: RoleSummary[] }>('/api/admin/roles')
            .then((res) => setRoles((res.data ?? []).map((r) => r.role)))
            .catch(() => setRoles([]));
    }, []);

    const fetchUsers = useCallback(() => {
        setLoading(true);
        const params = search ? `?search=${encodeURIComponent(search)}` : '';
        api.get<{ data: User[] }>(`/api/admin/users${params}`)
            .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
            .catch((e) => {
                setUsers([]);
                toast.error(errorMessage(e, 'Failed to load users'));
            })
            .finally(() => setLoading(false));
    }, [search]);
    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const toggleSuspend = async (user: User) => {
        const suspend = user.status !== 'suspended';
        try {
            if (suspend) await api.post(`/api/admin/users/${user.id}/suspend`);
            else await api.post(`/api/admin/users/${user.id}/restore`);
            toast.success(suspend ? `${user.name} suspended.` : `${user.name} restored.`);
            fetchUsers();
        } catch (e) {
            toast.error(errorMessage(e, 'Action failed'));
        }
    };

    const changeRole = async (userId: string, role: string) => {
        try {
            await api.put(`/api/admin/users/${userId}/role`, { role });
            toast.success(`Role changed to ${labelize(role)}.`);
            fetchUsers();
        } catch (e) {
            toast.error(errorMessage(e, 'Role change refused'));
            fetchUsers();
        }
    };

    const createUser = async () => {
        if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password || !addForm.role) {
            toast.error('Name, email, password and role are required.');
            return;
        }
        setAdding(true);
        try {
            await api.post('/api/admin/users', {
                name: addForm.name.trim(),
                email: addForm.email.trim(),
                password: addForm.password,
                role: addForm.role,
            });
            toast.success(`${addForm.name.trim()} created.`);
            setShowAdd(false);
            setAddForm({ name: '', email: '', password: '', role: '' });
            fetchUsers();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to create user'));
        } finally {
            setAdding(false);
        }
    };

    const roleOptions = (current: string | null): string[] => {
        const list = current && !roles.includes(current) ? [current, ...roles] : roles;
        return list;
    };

    // Per-user permission grants (super_admin-only endpoints; layered on the role matrix)
    const [permUser, setPermUser] = useState<User | null>(null);
    const [permList, setPermList] = useState<string[]>([]);
    const [permCatalog, setPermCatalog] = useState<string[]>([]);
    const [permGrant, setPermGrant] = useState('');
    const [permBusy, setPermBusy] = useState(false);

    const loadPermList = async (userId: string): Promise<string[]> => {
        const res = await api.get<{ data: string[] }>(`/api/admin/users/${userId}/permissions`);
        return res.data ?? [];
    };

    const openPerms = async (user: User) => {
        setPermUser(user);
        setPermGrant('');
        setPermList([]);
        if (permCatalog.length === 0) {
            try {
                const res = await api.get<{ data: Record<string, string[]> }>('/api/admin/permissions');
                setPermCatalog(
                    Object.entries(res.data ?? {}).flatMap(([mod, actions]) => actions.map((a) => `${mod}.${a}`)),
                );
            } catch {
                setPermCatalog([]);
            }
        }
        try {
            setPermList(await loadPermList(user.id));
        } catch (e) {
            setPermUser(null);
            toast.error(errorMessage(e, 'Per-user grants are super admin only'));
        }
    };

    const grantUserPerm = async () => {
        if (!permUser || !permGrant) return;
        setPermBusy(true);
        try {
            await api.post(`/api/admin/users/${permUser.id}/permissions`, { permission: permGrant });
            toast.success(`Granted ${permGrant}`);
            setPermGrant('');
            setPermList(await loadPermList(permUser.id));
        } catch (e) {
            toast.error(errorMessage(e, 'Grant failed'));
        } finally {
            setPermBusy(false);
        }
    };

    const revokeUserPerm = async (permission: string) => {
        if (!permUser) return;
        setPermBusy(true);
        try {
            await api.del(`/api/admin/users/${permUser.id}/permissions/${encodeURIComponent(permission)}`);
            toast.success(`Revoked ${permission}`);
            setPermList((prev) => prev.filter((p) => p !== permission));
        } catch (e) {
            toast.error(errorMessage(e, 'Revoke failed'));
        } finally {
            setPermBusy(false);
        }
    };

    return (
        <AdminLayout title="Manage Users">
            <Head title="Manage Users" />

            <div className="space-y-6">
                <Breadcrumb items={[{ label: 'Admin' }, { label: 'Users' }]} />
                <div className="flex items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Users</h1>
                    {canCreate && (
                        <button
                            onClick={() => setShowAdd(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            <Plus className="h-4 w-4" /> Add User
                        </button>
                    )}
                </div>

                <div className="max-w-md">
                    <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." />
                </div>

                <DataTable
                    loading={loading}
                    emptyTitle="No users found"
                    emptyDescription="Try adjusting your search."
                    columns={[
                        {
                            key: 'user',
                            header: 'User',
                            render: (u: User) => (
                                <div>
                                    <Link href={`/admin/users/${u.id}`} className="font-medium text-gray-900 hover:text-indigo-600 dark:text-white">
                                        {u.name}
                                    </Link>
                                    <p className="text-xs text-gray-500">{u.email}</p>
                                </div>
                            ),
                        },
                        {
                            key: 'role',
                            header: 'Role',
                            render: (u: User) => (
                                <>
                                    <label className="sr-only" htmlFor={`role-${u.id}`}>Role for {u.name}</label>
                                    <select
                                        id={`role-${u.id}`}
                                        value={u.role ?? ''}
                                        onChange={(e) => changeRole(u.id, e.target.value)}
                                        className="rounded border px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    >
                                        {!u.role && <option value="">(no role)</option>}
                                        {roleOptions(u.role).map((r) => (
                                            <option key={r} value={r}>{labelize(r)}</option>
                                        ))}
                                    </select>
                                </>
                            ),
                        },
                        {
                            key: 'status',
                            header: 'Status',
                            render: (u: User) => (
                                <StatusBadge
                                    status={u.status === 'suspended' ? 'Suspended' : u.status === 'unverified' ? 'Unverified' : 'Active'}
                                    tone={u.status === 'suspended' ? 'red' : u.status === 'unverified' ? 'yellow' : 'green'}
                                />
                            ),
                        },
                        {
                            key: 'joined',
                            header: 'Joined',
                            render: (u: User) => <span className="text-xs text-gray-500">{formatDateTime(u.created_at)}</span>,
                        },
                        {
                            key: 'actions',
                            header: 'Actions',
                            render: (u: User) => (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => void openPerms(u)}
                                        title="Per-user permissions"
                                        className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700"
                                    >
                                        <KeyRound className="h-3.5 w-3.5" /> Perms
                                    </button>
                                    <button
                                        onClick={() => toggleSuspend(u)}
                                        className={`text-xs font-medium ${u.status === 'suspended' ? 'text-green-600' : 'text-red-600'}`}
                                    >
                                        {u.status === 'suspended' ? 'Restore' : 'Suspend'}
                                    </button>
                                </div>
                            ),
                        },
                    ]}
                    data={users}
                />

                {showAdd && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
                        <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <h2 className="font-semibold text-gray-900 dark:text-white">Add User</h2>
                                    <p className="text-xs text-gray-500">Creates the account and assigns its initial role.</p>
                                </div>
                                <button
                                    onClick={() => setShowAdd(false)}
                                    className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    aria-label="Close"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label htmlFor="add-user-name" className="mb-1 block text-xs font-medium text-gray-500">Name</label>
                                    <input
                                        id="add-user-name"
                                        value={addForm.name}
                                        onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                                        className="w-full rounded-md border border-gray-300 bg-transparent px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="add-user-email" className="mb-1 block text-xs font-medium text-gray-500">Email</label>
                                    <input
                                        id="add-user-email"
                                        type="email"
                                        value={addForm.email}
                                        onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                                        className="w-full rounded-md border border-gray-300 bg-transparent px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="add-user-password" className="mb-1 block text-xs font-medium text-gray-500">Password</label>
                                    <input
                                        id="add-user-password"
                                        type="password"
                                        autoComplete="new-password"
                                        value={addForm.password}
                                        onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                                        className="w-full rounded-md border border-gray-300 bg-transparent px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="add-user-role" className="mb-1 block text-xs font-medium text-gray-500">Role</label>
                                    <select
                                        id="add-user-role"
                                        value={addForm.role}
                                        onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                                        className="w-full rounded-md border border-gray-300 bg-transparent px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="">Select role...</option>
                                        {roles.map((r) => (
                                            <option key={r} value={r}>{labelize(r)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-5 flex justify-end gap-2">
                                <button
                                    onClick={() => setShowAdd(false)}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => void createUser()}
                                    disabled={adding}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {adding ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {permUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
                        <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <h2 className="font-semibold text-gray-900 dark:text-white">
                                        Extra permissions - {permUser.name}
                                    </h2>
                                    <p className="text-xs text-gray-500">
                                        {permUser.email} - grants layer on top of the role matrix
                                    </p>
                                </div>
                                <button
                                    onClick={() => setPermUser(null)}
                                    className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    aria-label="Close"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="mb-4 flex items-end gap-2">
                                <label className="sr-only" htmlFor="perm-grant-select">Permission to grant</label>
                                <select
                                    id="perm-grant-select"
                                    value={permGrant}
                                    onChange={(e) => setPermGrant(e.target.value)}
                                    className="min-w-0 flex-1 rounded-lg border border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="">Select permission...</option>
                                    {permCatalog.map((p) => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                                <button
                                    disabled={!permGrant || permBusy}
                                    onClick={() => void grantUserPerm()}
                                    className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                                >
                                    <Plus className="h-4 w-4" /> Grant
                                </button>
                            </div>

                            {permList.length === 0 ? (
                                <p className="text-xs text-gray-400">No per-user grants.</p>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {permList.map((perm) => (
                                        <span
                                            key={perm}
                                            className="inline-flex items-center gap-1 rounded-full bg-violet-50 py-0.5 pl-2.5 pr-1 text-[11px] font-medium text-violet-800 dark:bg-violet-950/40 dark:text-violet-200"
                                        >
                                            {perm}
                                            <button
                                                disabled={permBusy}
                                                onClick={() => void revokeUserPerm(perm)}
                                                title={`Revoke ${perm}`}
                                                className="rounded-full p-0.5 hover:bg-violet-200 disabled:opacity-40"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
