import AdminLayout from '@/layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import SearchInput from '@/components/shared/SearchInput';
import { useConfirm } from '@/lib/confirm';
import { Download, Mail, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Subscription {
    id: string;
    email: string;
    created_at: string;
}

interface Meta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export default function AdminNewsletter() {
    const ask = useConfirm();
    const roles = (usePage().props.auth as { roles?: string[] } | null)?.roles ?? [];
    const canManage = roles.some((r) => ['super_admin', 'administrator', 'content_manager', 'cms_editor', 'content_admin'].includes(r));

    const [subs, setSubs] = useState<Subscription[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [query, setQuery] = useState('');
    const [reloadToken, setReloadToken] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams({ page: String(page) });
        if (query) params.set('search', query);

        setLoading(true);
        api.get<{ data: Subscription[]; meta: Meta }>(`/api/newsletter/subscriptions?${params.toString()}`)
            .then((res) => {
                setSubs(rows<Subscription>(res));
                setMeta(res.meta);
            })
            .catch((e) => {
                setSubs([]);
                toast.error(errorMessage(e, 'Failed to load subscribers'));
            })
            .finally(() => setLoading(false));
    }, [page, query, reloadToken]);

    const exportCsv = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams();
            if (query) params.set('search', query);
            const qs = params.toString();
            await api.download(
                `/api/newsletter/subscriptions/export${qs ? `?${qs}` : ''}`,
                `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`,
            );
            toast.success('Subscribers exported');
        } catch (e) {
            toast.error(errorMessage(e, 'Export failed'));
        } finally {
            setExporting(false);
        }
    };

    const removeSubscriber = async (subscriber: Subscription) => {
        const ok = await ask({
            title: 'Remove this subscriber?',
            description: `${subscriber.email} will stop receiving newsletter communications.`,
            confirmLabel: 'Remove subscriber',
            danger: true,
        });
        if (!ok) return;

        setBusy(subscriber.id);
        try {
            await api.del(`/api/newsletter/subscriptions/${subscriber.id}`);
            setReloadToken((value) => value + 1);
            toast.success('Subscriber removed');
        } catch (e) {
            toast.error(errorMessage(e, 'Could not remove subscriber'));
        } finally {
            setBusy(null);
        }
    };

    return (
        <AdminLayout title="Newsletter">
            <Head title="Newsletter" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Newsletter Subscribers</h1>
                    <div className="flex items-center gap-3">
                        {meta && (
                            <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                <Users className="h-4 w-4" /> {meta.total} subscribers
                            </span>
                        )}
                        {canManage && (
                            <button onClick={() => void exportCsv()} disabled={exporting}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                                <Download className="h-4 w-4" /> {exporting ? 'Exporting...' : 'Export CSV'}
                            </button>
                        )}
                    </div>
                </div>

                <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search subscribers by email" />

                <DataTable
                    columns={[
                        {
                            key: 'email', header: 'Email', accessor: 'email', sortable: true,
                            render: (s) => (
                                <span className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                                    <Mail className="h-4 w-4 text-gray-400" /> {s.email}
                                </span>
                            ),
                        },
                        {
                            key: 'subscribed', header: 'Subscribed', accessor: 'created_at', sortable: true,
                            render: (s) => <span className="text-xs text-gray-500">{formatDateTime(s.created_at)}</span>,
                        },
                        {
                            key: 'actions', header: 'Actions',
                            render: (s) => canManage ? (
                                <button disabled={busy === s.id} onClick={() => void removeSubscriber(s)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 dark:border-red-900 dark:hover:bg-red-950/30">
                                    <Trash2 className="h-3 w-3" /> Remove
                                </button>
                            ) : <span className="text-xs text-gray-400">View only</span>,
                        },
                    ]}
                    data={subs}
                    loading={loading}
                    emptyTitle={query ? 'No matching subscribers' : 'No subscribers yet'}
                    emptyDescription={query ? 'Try a different email search.' : 'Visitors subscribe from the storefront footer.'}
                />

                {meta && meta.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {meta.current_page} of {meta.last_page}</span>
                        <div className="flex gap-2">
                            <button disabled={meta.current_page <= 1} onClick={() => setPage(page - 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                            <button disabled={meta.current_page >= meta.last_page} onClick={() => setPage(page + 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
