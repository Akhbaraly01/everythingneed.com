import { useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { ShieldCheck, X, Search, Plus, RotateCcw } from 'lucide-react';
import DataTable from '@/components/shared/DataTable';

interface RoleRow {
    role: string;
    permissions: string[];
}

interface ScopeRow {
    id: string;
    holder_type: 'role' | 'user';
    holder_id: string;
    permission: string;
    scope: string;
    scope_value?: string | null;
}

// Mirrors Core\Enums\PermissionScope::values().
const SCOPE_VALUES = ['global', 'own', 'vendor', 'domain', 'team', 'country', 'region'];
// Mirrors PermissionScope::isDeferred() — stored but not enforced yet.
const DEFERRED_SCOPES = ['team', 'country', 'region'];

interface Props {
    catalog: string[];
}

export default function AdminRbac({ catalog }: Props) {
    const [matrix, setMatrix] = useState<RoleRow[]>([]);
    // W2 reversible state: denied rows stay visible with one-click restore.
    const [denied, setDenied] = useState<RoleRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);
    const [roleFilter, setRoleFilter] = useState('');
    const [permFilter, setPermFilter] = useState('');
    const [grantRole, setGrantRole] = useState('');
    const [grantPerm, setGrantPerm] = useState('');

    const [scopes, setScopes] = useState<ScopeRow[]>([]);
    const [scopeBusy, setScopeBusy] = useState(false);
    const [holderType, setHolderType] = useState<'role' | 'user'>('role');
    const [holderId, setHolderId] = useState('');
    const [scopePerm, setScopePerm] = useState('');
    const [scopeKind, setScopeKind] = useState('global');
    const [scopeValue, setScopeValue] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [userOptions, setUserOptions] = useState<{ id: string; label: string }[]>([]);

    const load = async () => {
        try {
            const [matrixRes, scopesRes] = await Promise.all([
                api.get<{ data: RoleRow[]; denied?: RoleRow[] }>('/api/admin/rbac/matrix'),
                api.get<{ data: ScopeRow[] }>('/api/admin/rbac/scopes'),
            ]);
            setMatrix(matrixRes.data);
            setDenied(matrixRes.denied ?? []);
            setScopes(scopesRes.data ?? []);
        } catch (err) {
            toast.error(errorMessage(err, 'Failed to load matrix'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void load(); }, []);

    useEffect(() => {
        if (holderType !== 'user') {
            setUserOptions([]);
            return;
        }
        const timer = setTimeout(() => {
            api.get<{ data: { id: string; name?: string; email?: string }[] }>(
                `/api/admin/users?per_page=10&search=${encodeURIComponent(userSearch)}`,
            )
                .then((res) =>
                    setUserOptions(
                        (res.data ?? []).map((u) => ({
                            id: u.id,
                            label: `${u.name ?? ''} (${u.email ?? u.id})`.trim(),
                        })),
                    ),
                )
                .catch(() => setUserOptions([]));
        }, 300);
        return () => clearTimeout(timer);
    }, [holderType, userSearch]);

    const grantScope = async () => {
        if (!holderId || !scopePerm || (scopeKind === 'domain' && !scopeValue)) return;
        setScopeBusy(true);
        try {
            await api.post('/api/admin/rbac/scopes', {
                holder_type: holderType,
                holder_id: holderId,
                permission: scopePerm,
                scope: scopeKind,
                ...(scopeKind === 'domain' ? { scope_value: scopeValue } : {}),
            });
            toast.success(`Scope granted to ${holderType} ${holderId}`);
            setHolderId('');
            setScopePerm('');
            setScopeValue('');
            const res = await api.get<{ data: ScopeRow[] }>('/api/admin/rbac/scopes');
            setScopes(res.data ?? []);
        } catch (err) {
            toast.error(errorMessage(err, 'Scope grant failed'));
        } finally {
            setScopeBusy(false);
        }
    };

    const revokeScope = async (id: string) => {
        setScopeBusy(true);
        try {
            await api.del(`/api/admin/rbac/scopes/${id}`);
            toast.success('Scope revoked');
            setScopes((prev) => prev.filter((s) => s.id !== id));
        } catch (err) {
            toast.error(errorMessage(err, 'Scope revoke failed'));
        } finally {
            setScopeBusy(false);
        }
    };

    const deniedByRole = useMemo(() => {
        const map = new Map<string, string[]>();
        for (const row of denied) map.set(row.role, row.permissions);
        return map;
    }, [denied]);

    const filtered = useMemo(() => {
        const rf = roleFilter.toLowerCase();
        const pf = permFilter.toLowerCase();
        return matrix
            .filter((r) => r.role.includes(rf))
            .map((r) => {
                if (!pf) return { ...r, denied: deniedByRole.get(r.role) ?? [] };
                return {
                    ...r,
                    permissions: r.permissions.filter((p) => p.toLowerCase().includes(pf)),
                    denied: (deniedByRole.get(r.role) ?? []).filter((p) => p.toLowerCase().includes(pf)),
                };
            })
            .filter((r) => !pf || r.permissions.length > 0 || r.denied.length > 0);
    }, [matrix, deniedByRole, roleFilter, permFilter]);

    const mutate = async (role: string, permission: string, action: 'grant' | 'revoke') => {
        setBusy(`${role}:${permission}`);
        try {
            await api.post(`/api/admin/rbac/${action}`, { role, permission });
            toast.success(`${action === 'grant' ? 'Granted' : 'Revoked'} ${permission} ${action === 'grant' ? 'to' : 'from'} ${role}`);
            await load();
        } catch (err) {
            toast.error(errorMessage(err, 'Action failed'));
        } finally {
            setBusy(null);
        }
    };

    return (
        <AdminLayout title="Admin - RBAC">
            <Head title="Roles & permissions" />
            <div className="mx-auto max-w-5xl px-4 py-8">
                <div className="mb-6 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100"><ShieldCheck className="h-6 w-6 text-violet-600" /></span>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles & Permissions</h1>
                        <p className="text-sm text-gray-500">{catalog.length} granular permissions across the platform</p>
                    </div>
                </div>

                {/* Grant new pair */}
                <div className="mb-6 flex flex-wrap items-end gap-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                    <select value={grantRole} onChange={(e) => setGrantRole(e.target.value)} className="rounded-lg border-gray-300 text-sm capitalize dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                        <option value="">Select role...</option>
                        {matrix.map((r) => <option key={r.role} value={r.role}>{r.role.replace('_', ' ')}</option>)}
                    </select>
                    <select value={grantPerm} onChange={(e) => setGrantPerm(e.target.value)} className="min-w-52 rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                        <option value="">Select permission...</option>
                        {catalog.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <button
                        disabled={!grantRole || !grantPerm || busy !== null}
                        onClick={() => mutate(grantRole, grantPerm, 'grant').then(() => { setGrantRole(''); setGrantPerm(''); })}
                        className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                        <Plus className="h-4 w-4" /> Grant
                    </button>
                </div>

                {/* Filters */}
                <div className="mb-4 flex max-w-xl gap-2">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            placeholder="Filter roles..."
                            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={permFilter}
                            onChange={(e) => setPermFilter(e.target.value)}
                            placeholder="Filter permissions..."
                            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                </div>

                {/* Matrix */}
                {loading ? (
                    <p className="py-10 text-center text-sm text-gray-400">Loading matrix...</p>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((row) => (
                            <div key={row.role} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                                <div className="mb-2 flex items-center justify-between">
                                    <h3 className="font-semibold capitalize text-gray-900 dark:text-white">{row.role.replace('_', ' ')}</h3>
                                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                        {row.permissions.length} permission{row.permissions.length === 1 ? '' : 's'}
                                    </span>
                                </div>
                                {row.permissions.length === 0 && row.denied.length === 0 ? (
                                    <p className="text-xs text-gray-400">No explicit grants.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                        {row.permissions.map((perm) => (
                                            <span key={perm} className="inline-flex items-center gap-1 rounded-full bg-violet-50 py-0.5 pl-2.5 pr-1 text-[11px] font-medium text-violet-800 dark:bg-violet-950/40 dark:text-violet-200">
                                                {perm}
                                                <button
                                                    disabled={busy !== null}
                                                    onClick={() => mutate(row.role, perm, 'revoke')}
                                                    title={`Revoke ${perm}`}
                                                    className="rounded-full p-0.5 hover:bg-violet-200 disabled:opacity-40"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                        {row.denied.map((perm) => (
                                            <span key={`denied:${perm}`} title="Revoked — click to restore"
                                                className="inline-flex items-center gap-1 rounded-full bg-gray-100 py-0.5 pl-2.5 pr-1 text-[11px] font-medium text-gray-500 line-through dark:bg-gray-700 dark:text-gray-400">
                                                {perm}
                                                <button
                                                    disabled={busy !== null}
                                                    onClick={() => mutate(row.role, perm, 'grant')}
                                                    title={`Restore ${perm}`}
                                                    className="rounded-full p-0.5 hover:bg-gray-200 disabled:opacity-40 dark:hover:bg-gray-600"
                                                >
                                                    <RotateCcw className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Permission scopes (W1.6) */}
                <div className="mt-8 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                        Permission Scopes
                    </h2>
                    <p className="mb-4 text-sm text-gray-500">
                        Row-level narrowing of a permission grant. own / vendor / domain are enforced
                        now; team / country / region are stored but enforcement is deferred.
                    </p>

                    <div className="mb-4 flex flex-wrap items-end gap-2">
                        <div>
                            <label className="mb-1 block text-xs text-gray-500">Holder</label>
                            <select
                                value={holderType}
                                onChange={(e) => {
                                    setHolderType(e.target.value as 'role' | 'user');
                                    setHolderId('');
                                }}
                                className="rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="role">Role</option>
                                <option value="user">User</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-gray-500">
                                {holderType === 'role' ? 'Role' : 'Find user'}
                            </label>
                            {holderType === 'role' ? (
                                <select
                                    value={holderId}
                                    onChange={(e) => setHolderId(e.target.value)}
                                    className="rounded-lg border-gray-300 text-sm capitalize dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="">Select role...</option>
                                    {matrix.map((r) => (
                                        <option key={r.role} value={r.role}>
                                            {r.role.replace('_', ' ')}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="space-y-1">
                                    <input
                                        type="text"
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        placeholder="name or email..."
                                        className="w-52 rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                    <select
                                        value={holderId}
                                        onChange={(e) => setHolderId(e.target.value)}
                                        className="w-52 rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="">Select user...</option>
                                        {userOptions.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-gray-500">Permission</label>
                            <select
                                value={scopePerm}
                                onChange={(e) => setScopePerm(e.target.value)}
                                className="min-w-52 rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">Select permission...</option>
                                {catalog.map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-gray-500">Scope</label>
                            <select
                                value={scopeKind}
                                onChange={(e) => setScopeKind(e.target.value)}
                                className="rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                {SCOPE_VALUES.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                        {DEFERRED_SCOPES.includes(s) ? ' (deferred)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {scopeKind === 'domain' && (
                            <div>
                                <label className="mb-1 block text-xs text-gray-500">
                                    Domain key
                                </label>
                                <input
                                    type="text"
                                    maxLength={100}
                                    value={scopeValue}
                                    onChange={(e) => setScopeValue(e.target.value)}
                                    placeholder="e.g. department id"
                                    className="w-44 rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        )}
                        <button
                            disabled={
                                scopeBusy ||
                                !holderId ||
                                !scopePerm ||
                                (scopeKind === 'domain' && !scopeValue)
                            }
                            onClick={() => void grantScope()}
                            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                        >
                            <Plus className="h-4 w-4" /> Grant scope
                        </button>
                    </div>

                    <DataTable
                            columns={[
                                {
                                    key: 'holder', header: 'Holder',
                                    render: (s) => (
                                        <>
                                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">
                                                {s.holder_type}
                                            </span>{' '}
                                            <span className="text-gray-600 dark:text-gray-300">
                                                {s.holder_type === 'role'
                                                    ? s.holder_id.replace('_', ' ')
                                                    : s.holder_id}
                                            </span>
                                        </>
                                    ),
                                },
                                {
                                    key: 'permission', header: 'Permission', accessor: 'permission', sortable: true,
                                    render: (s) => (
                                        <span className="text-xs text-gray-500">{s.permission}</span>
                                    ),
                                },
                                {
                                    key: 'scope', header: 'Scope', accessor: 'scope', sortable: true,
                                    render: (s) => (
                                        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-800 dark:bg-violet-950/40 dark:text-violet-200">
                                            {s.scope}
                                        </span>
                                    ),
                                },
                                {
                                    key: 'value', header: 'Value',
                                    render: (s) => (
                                        <span className="text-xs text-gray-500">{s.scope_value || '-'}</span>
                                    ),
                                },
                                {
                                    key: 'actions', header: '',
                                    render: (s) => (
                                        <button
                                            disabled={scopeBusy}
                                            onClick={() => void revokeScope(s.id)}
                                            title={`Revoke ${s.permission} scope`}
                                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    ),
                                },
                            ]}
                            data={scopes}
                            loading={loading}
                            emptyTitle="No scope rows yet"
                        />
                </div>
            </div>
        </AdminLayout>
    );
}
