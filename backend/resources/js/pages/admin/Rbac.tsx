import { useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { api, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { ShieldCheck, X, Search, Plus } from 'lucide-react';

interface RoleRow {
    role: string;
    permissions: string[];
}

interface Props {
    catalog: string[];
}

export default function AdminRbac({ catalog }: Props) {
    const [matrix, setMatrix] = useState<RoleRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);
    const [roleFilter, setRoleFilter] = useState('');
    const [grantRole, setGrantRole] = useState('');
    const [grantPerm, setGrantPerm] = useState('');

    const load = async () => {
        try {
            const res = await api.get<{ data: RoleRow[] }>('/api/admin/rbac/matrix');
            setMatrix(res.data);
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Failed to load matrix');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void load(); }, []);

    const filtered = useMemo(
        () => matrix.filter((r) => r.role.includes(roleFilter.toLowerCase())),
        [matrix, roleFilter],
    );

    const mutate = async (role: string, permission: string, action: 'grant' | 'revoke') => {
        setBusy(`${role}:${permission}`);
        try {
            await api.post(`/api/admin/rbac/${action}`, { role, permission });
            toast.success(`${action === 'grant' ? 'Granted' : 'Revoked'} ${permission} ${action === 'grant' ? 'to' : 'from'} ${role}`);
            await load();
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Action failed');
        } finally {
            setBusy(null);
        }
    };

    return (
        <AppLayout title="Admin · RBAC">
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
                        <option value="">Select role…</option>
                        {matrix.map((r) => <option key={r.role} value={r.role}>{r.role.replace('_', ' ')}</option>)}
                    </select>
                    <select value={grantPerm} onChange={(e) => setGrantPerm(e.target.value)} className="min-w-52 rounded-lg border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                        <option value="">Select permission…</option>
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

                {/* Filter */}
                <div className="relative mb-4 max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        placeholder="Filter roles…"
                        className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                </div>

                {/* Matrix */}
                {loading ? (
                    <p className="py-10 text-center text-sm text-gray-400">Loading matrix…</p>
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
                                {row.permissions.length === 0 ? (
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
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
