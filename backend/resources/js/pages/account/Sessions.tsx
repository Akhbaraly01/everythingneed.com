import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { MonitorSmartphone, LogOut } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/shared/Ui';

interface SessionToken {
    id: number;
    name: string;
    last_used_at?: string | null;
    created_at?: string | null;
    current: boolean;
}

/**
 * Active sessions: every API token on the account with last use.
 * Revoking the current one signs this device out (stated up front).
 */
export default function Sessions() {
    const [tokens, setTokens] = useState<SessionToken[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingRevoke, setPendingRevoke] = useState<SessionToken | null>(null);
    const [confirmOthers, setConfirmOthers] = useState(false);
    const [revoking, setRevoking] = useState(false);

    const load = () => {
        setLoading(true);
        api.get<{ data: SessionToken[] }>('/api/auth/tokens')
            .then((res) => setTokens(Array.isArray(res.data) ? res.data : []))
            .catch((e) => toast.error(errorMessage(e, 'Failed to load sessions')))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const revoke = async (token: SessionToken) => {
        setRevoking(true);
        try {
            const res = await api.del<{ message?: string }>(`/api/auth/tokens/${token.id}`);
            toast.success(res.message ?? 'Session revoked.');
            setPendingRevoke(null);
            if (token.current) {
                window.location.href = '/login';
                return;
            }
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not revoke session'));
        } finally {
            setRevoking(false);
        }
    };

    const revokeOthers = async () => {
        setRevoking(true);
        try {
            const res = await api.del<{ message?: string }>('/api/auth/tokens');
            toast.success(res.message ?? 'Other sessions revoked.');
            setConfirmOthers(false);
            load();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not revoke sessions'));
        } finally {
            setRevoking(false);
        }
    };

    return (
        <AppLayout title="Sessions">
            <Head title="Sessions" />
            <div className="mx-auto max-w-2xl space-y-6 px-3 py-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Active sessions</h1>
                        <p className="text-sm text-gray-500">Every device signed in to your account.</p>
                    </div>
                    {tokens.some((t) => !t.current) && (
                        <button
                            type="button"
                            onClick={() => setConfirmOthers(true)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600"
                        >
                            Sign out other devices
                        </button>
                    )}
                </div>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : tokens.length === 0 ? (
                    <p className="text-sm text-gray-500">No sessions found.</p>
                ) : (
                    <div className="space-y-3">
                        {tokens.map((t) => (
                            <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <div className="flex items-center gap-3">
                                    <MonitorSmartphone className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {t.name || 'App session'}
                                            {t.current && (
                                                <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                                                    This device
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {t.last_used_at
                                                ? `Last used ${new Date(t.last_used_at).toLocaleString()}`
                                                : 'Never used yet'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPendingRevoke(t)}
                                    className="flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-700"
                                >
                                    <LogOut className="h-4 w-4" /> Revoke
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <ConfirmDialog
                    open={confirmOthers}
                    title="Sign out other devices?"
                    description="Every other signed-in device will be signed out immediately."
                    confirmLabel="Sign out others"
                    danger
                    busy={revoking}
                    onConfirm={() => void revokeOthers()}
                    onCancel={() => setConfirmOthers(false)}
                />

                <ConfirmDialog
                    open={pendingRevoke !== null}
                    title="Revoke this session?"
                    description={
                        pendingRevoke?.current
                            ? 'This signs you out on this device.'
                            : 'That device will be signed out immediately.'
                    }
                    confirmLabel="Revoke session"
                    danger
                    busy={revoking}
                    onConfirm={() => {
                        if (pendingRevoke) void revoke(pendingRevoke);
                    }}
                    onCancel={() => setPendingRevoke(null)}
                />
            </div>
        </AppLayout>
    );
}
