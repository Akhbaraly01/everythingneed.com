import { useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { api, errorMessage } from '@/lib/api';
import { useConfirm } from '@/lib/confirm';
import { toast } from 'sonner';
import { ShieldCheck, Plus, X } from 'lucide-react';
import DataTable from '@/components/shared/DataTable';
import SearchInput from '@/components/shared/SearchInput';
import { Button } from '@/components/shared/Button';
import { RbacStats } from '@/components/admin/rbac/RbacStats';
import { RoleCard } from '@/components/admin/rbac/RoleCard';
import { GrantAccessBar } from '@/components/admin/rbac/GrantAccessBar';
import { ManageRoleSheet } from '@/components/admin/rbac/ManageRoleSheet';
import { CreateRoleSheet } from '@/components/admin/rbac/CreateRoleSheet';
import { roleLabel, type RbacMatrixRow } from '@/lib/rbac';

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
    const ask = useConfirm();
    const { props } = usePage();
    // Built-in roles are protected; only the platform owner may retire or
    // restore them.
    const auth = (props.auth ?? null) as { roles?: string[] } | null;
    const isSuperAdmin = (auth?.roles ?? []).includes('super_admin');

    const [matrix, setMatrix] = useState<RbacMatrixRow[]>([]);
    // W2 reversible state: denied rows stay visible with one-click restore.
    const [deniedMap, setDeniedMap] = useState<Map<string, string[]>>(new Map());
    const [loading, setLoading] = useState(true);
    // Inline single-permission actions (grant pair / restore).
    const [busy, setBusy] = useState<string | null>(null);
    const [roleFilter, setRoleFilter] = useState('');
    const [permFilter, setPermFilter] = useState('');

    // Role editing surfaces.
    const [manageRole, setManageRole] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [savingRole, setSavingRole] = useState(false);
    const [resettingRole, setResettingRole] = useState(false);
    const [deletingRole, setDeletingRole] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

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
                api.get<{ data: RbacMatrixRow[]; denied?: { role: string; permissions: string[] }[] }>(
                    '/api/admin/rbac/matrix',
                ),
                api.get<{ data: ScopeRow[] }>('/api/admin/rbac/scopes'),
            ]);
            setMatrix(matrixRes.data ?? []);
            setDeniedMap(
                new Map((matrixRes.denied ?? []).map((row) => [row.role, row.permissions])),
            );
            setScopes(scopesRes.data ?? []);
        } catch (err) {
            toast.error(errorMessage(err, 'Failed to load matrix'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

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
        const scope = scopes.find((s) => s.id === id);
        const ok = await ask({
            title: `Revoke ${scope?.permission ?? 'this'} scope?`,
            description: 'The holder loses this scoped access immediately. The role or user grant itself is unchanged.',
            confirmLabel: 'Revoke',
            danger: true,
        });
        if (!ok) return;
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

    const grantPair = async (role: string, permission: string): Promise<boolean> => {
        setBusy(`${role}:${permission}`);
        try {
            await api.post('/api/admin/rbac/grant', { role, permission });
            toast.success(`Granted ${permission} to ${roleLabel({ role })}`);
            await load();
            return true;
        } catch (err) {
            toast.error(errorMessage(err, 'Action failed'));
            return false;
        } finally {
            setBusy(null);
        }
    };

    const saveRolePermissions = async (
        role: string,
        grant: string[],
        revoke: string[],
    ): Promise<boolean> => {
        setSavingRole(true);
        try {
            await api.post('/api/admin/rbac/bulk', { role, grant, revoke });
            toast.success(
                `Updated ${roleLabel({ role })} (${grant.length} granted, ${revoke.length} revoked)`,
            );
            await load();
            return true;
        } catch (err) {
            toast.error(errorMessage(err, 'Save failed'));
            return false;
        } finally {
            setSavingRole(false);
        }
    };

    const resetRole = async (role: string) => {
        const confirmed = await ask({
            title: `Reset ${roleLabel({ role })}?`,
            description:
                'Restores the seeded default permission set for this built-in role. Custom edits and denied rows for the role are cleared.',
            confirmLabel: 'Reset defaults',
            danger: true,
        });
        if (!confirmed) return;

        setResettingRole(true);
        try {
            await api.post(`/api/admin/rbac/roles/${role}/reset`);
            toast.success(`${roleLabel({ role })} reset to defaults`);
            await load();
        } catch (err) {
            toast.error(errorMessage(err, 'Reset failed'));
        } finally {
            setResettingRole(false);
        }
    };

    const deleteRole = async (row: RbacMatrixRow) => {
        const holders = row.user_count ?? 0;
        const isCustom = row.is_custom === true;
        const confirmed = await ask({
            title: isCustom ? `Delete ${roleLabel(row)}?` : `Retire ${roleLabel(row)}?`,
            description: isCustom
                ? holders > 0
                    ? `${holders} user${holders === 1 ? '' : 's'} currently hold this role and will be reassigned to the User role. The role and its permission rows are removed permanently.`
                    : 'The role and its permission rows are removed permanently.'
                : `This is a built-in role. Retiring it removes it from every role picker and drops its permission rows; its ${holders} holder${holders === 1 ? '' : 's'} will be reassigned to the User role. A super admin can restore it later.`,
            confirmLabel: isCustom ? 'Delete role' : 'Retire role',
            danger: true,
        });
        if (!confirmed) return;

        setDeletingRole(row.role);
        try {
            await api.del(
                `/api/admin/rbac/roles/${row.role}`,
                holders > 0 ? { reassign_to: 'user' } : undefined,
            );
            toast.success(
                isCustom ? `${roleLabel(row)} deleted` : `${roleLabel(row)} retired`,
            );
            if (manageRole === row.role) setManageRole(null);
            await load();
        } catch (err) {
            toast.error(errorMessage(err, 'Delete failed'));
        } finally {
            setDeletingRole(null);
        }
    };

    const restoreRole = async (row: RbacMatrixRow) => {
        const confirmed = await ask({
            title: `Restore ${roleLabel(row)}?`,
            description:
                'The role returns to every role picker and its default permissions are granted again.',
            confirmLabel: 'Restore role',
        });
        if (!confirmed) return;

        setDeletingRole(row.role);
        try {
            await api.post(`/api/admin/rbac/roles/${row.role}/restore`);
            toast.success(`${roleLabel(row)} restored`);
            await load();
        } catch (err) {
            toast.error(errorMessage(err, 'Restore failed'));
        } finally {
            setDeletingRole(null);
        }
    };

    const createRole = async (payload: {
        name: string;
        slug: string;
        description: string;
        permissions: string[];
    }): Promise<boolean> => {
        setCreating(true);
        try {
            await api.post('/api/admin/rbac/roles', {
                name: payload.name,
                slug: payload.slug,
                ...(payload.description ? { description: payload.description } : {}),
                permissions: payload.permissions,
            });
            toast.success(`Role ${payload.name} created`);
            await load();
            return true;
        } catch (err) {
            toast.error(errorMessage(err, 'Create failed'));
            return false;
        } finally {
            setCreating(false);
        }
    };

    const manageRow = useMemo(
        () => matrix.find((row) => row.role === manageRole) ?? null,
        [matrix, manageRole],
    );

    const filtered = useMemo(() => {
        const rf = roleFilter.trim().toLowerCase();
        const pf = permFilter.trim().toLowerCase();

        return matrix
            .filter(
                (row) =>
                    rf === '' ||
                    row.role.toLowerCase().includes(rf) ||
                    roleLabel(row).toLowerCase().includes(rf),
            )
            .map((row) => {
                const denied = deniedMap.get(row.role) ?? [];
                if (pf === '') return { ...row, denied };
                return {
                    ...row,
                    permissions: row.permissions.filter((p) => p.toLowerCase().includes(pf)),
                    denied: denied.filter((p) => p.toLowerCase().includes(pf)),
                };
            })
            .filter((row) => pf === '' || row.permissions.length > 0 || row.denied.length > 0);
    }, [matrix, deniedMap, roleFilter, permFilter]);

    return (
        <AdminLayout title="Admin - RBAC">
            <Head title="Roles & permissions" />
            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/15">
                            <ShieldCheck className="h-6 w-6 text-secondary" aria-hidden="true" />
                        </span>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Roles & Permissions</h1>
                            <p className="text-sm text-muted-foreground">
                                {matrix.length} roles · {catalog.length} granular permissions
                            </p>
                        </div>
                    </div>
                    <Button
                        iconLeft={<Plus className="h-4 w-4" />}
                        onClick={() => setCreateOpen(true)}
                    >
                        Create role
                    </Button>
                </div>

                <div className="mt-6">
                    <RbacStats rows={matrix} catalogSize={catalog.length} />
                </div>

                <div className="mt-6">
                    <GrantAccessBar
                        rows={matrix}
                        catalog={catalog}
                        busy={busy !== null || savingRole}
                        onGrant={grantPair}
                    />
                </div>

                <div className="mt-4 grid gap-2 sm:max-w-2xl sm:grid-cols-2">
                    <SearchInput value={roleFilter} onChange={setRoleFilter} placeholder="Filter roles..." />
                    <SearchInput
                        value={permFilter}
                        onChange={setPermFilter}
                        placeholder="Filter permissions..."
                    />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                    Built-in roles are protected. Custom roles can be deleted; holders are moved to the
                    User role first.
                </p>

                {loading ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">Loading matrix...</p>
                ) : filtered.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                        No roles match the current filters.
                    </p>
                ) : (
                    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {filtered.map((row) => (
                            <RoleCard
                                key={row.role}
                                row={row}
                                denied={row.denied ?? []}
                                busy={busy !== null || deletingRole === row.role}
                                canManageCore={isSuperAdmin}
                                onManage={() => setManageRole(row.role)}
                                onDelete={() => void deleteRole(row)}
                                onRestore={() => void restoreRole(row)}
                                onRestorePermission={(permission) => void grantPair(row.role, permission)}
                            />
                        ))}
                    </div>
                )}

                {/* Permission scopes (W1.6) */}
                <div className="mt-8 rounded-xl border border-border bg-card p-4">
                    <h2 className="mb-1 text-lg font-semibold text-foreground">Permission Scopes</h2>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Row-level narrowing of a permission grant. own / vendor / domain are enforced
                        now; team / country / region are stored but enforcement is deferred.
                    </p>

                    <div className="mb-4 flex flex-wrap items-end gap-2">
                        <div>
                            <label className="mb-1 block text-xs text-muted-foreground">Holder</label>
                            <select
                                value={holderType}
                                onChange={(e) => {
                                    setHolderType(e.target.value as 'role' | 'user');
                                    setHolderId('');
                                }}
                                className="rounded-lg border border-border bg-card text-sm text-foreground"
                            >
                                <option value="role">Role</option>
                                <option value="user">User</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-muted-foreground">
                                {holderType === 'role' ? 'Role' : 'Find user'}
                            </label>
                            {holderType === 'role' ? (
                                <select
                                    value={holderId}
                                    onChange={(e) => setHolderId(e.target.value)}
                                    className="rounded-lg border border-border bg-card text-sm text-foreground"
                                >
                                    <option value="">Select role...</option>
                                    {matrix.map((r) => (
                                        <option key={r.role} value={r.role}>
                                            {roleLabel(r)}
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
                                        className="w-52 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground"
                                    />
                                    <select
                                        value={holderId}
                                        onChange={(e) => setHolderId(e.target.value)}
                                        className="w-52 rounded-lg border border-border bg-card text-sm text-foreground"
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
                            <label className="mb-1 block text-xs text-muted-foreground">Permission</label>
                            <select
                                value={scopePerm}
                                onChange={(e) => setScopePerm(e.target.value)}
                                className="min-w-52 rounded-lg border border-border bg-card text-sm text-foreground"
                            >
                                <option value="">Select permission...</option>
                                {catalog.map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-muted-foreground">Scope</label>
                            <select
                                value={scopeKind}
                                onChange={(e) => setScopeKind(e.target.value)}
                                className="rounded-lg border border-border bg-card text-sm text-foreground"
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
                                <label className="mb-1 block text-xs text-muted-foreground">
                                    Domain key
                                </label>
                                <input
                                    type="text"
                                    maxLength={100}
                                    value={scopeValue}
                                    onChange={(e) => setScopeValue(e.target.value)}
                                    placeholder="e.g. department id"
                                    className="w-44 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground"
                                />
                            </div>
                        )}
                        <Button
                            iconLeft={<Plus className="h-4 w-4" />}
                            disabled={
                                scopeBusy ||
                                !holderId ||
                                !scopePerm ||
                                (scopeKind === 'domain' && !scopeValue)
                            }
                            onClick={() => void grantScope()}
                        >
                            Grant scope
                        </Button>
                    </div>

                    <DataTable
                        columns={[
                            {
                                key: 'holder', header: 'Holder',
                                render: (s) => (
                                    <>
                                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                            {s.holder_type}
                                        </span>{' '}
                                        <span className="text-muted-foreground">
                                            {s.holder_type === 'role'
                                                ? roleLabel({ role: s.holder_id })
                                                : s.holder_id}
                                        </span>
                                    </>
                                ),
                            },
                            {
                                key: 'permission', header: 'Permission', accessor: 'permission', sortable: true,
                                render: (s) => (
                                    <span className="text-xs text-muted-foreground">{s.permission}</span>
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
                                    <span className="text-xs text-muted-foreground">{s.scope_value || '-'}</span>
                                ),
                            },
                            {
                                key: 'actions', header: '',
                                render: (s) => (
                                    <button
                                        disabled={scopeBusy}
                                        onClick={() => void revokeScope(s.id)}
                                        title={`Revoke ${s.permission} scope`}
                                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
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

                <ManageRoleSheet
                    open={manageRow !== null}
                    onClose={() => setManageRole(null)}
                    row={manageRow}
                    denied={manageRow ? deniedMap.get(manageRow.role) ?? [] : []}
                    catalog={catalog}
                    saving={savingRole}
                    resetting={resettingRole}
                    onSave={saveRolePermissions}
                    onReset={(role) => void resetRole(role)}
                />

                <CreateRoleSheet
                    open={createOpen}
                    onClose={() => setCreateOpen(false)}
                    catalog={catalog}
                    creating={creating}
                    onCreate={createRole}
                />
            </div>
        </AdminLayout>
    );
}
