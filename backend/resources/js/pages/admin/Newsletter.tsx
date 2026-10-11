import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import { Mail, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/** Real newsletter_subscriptions row (NewsletterController::index). */
interface Subscription {
    id: string;
    email: string;
    created_at: string;
}

interface Meta {
    current_page: number;
    last_page: number;
    total: number;
}

export default function AdminNewsletter() {
    const [subs, setSubs] = useState<Subscription[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        api.get<{ data: Subscription[]; meta: Meta }>(`/api/newsletter/subscriptions?page=${page}`)
            .then((res) => {
                setSubs(rows<Subscription>(res));
                setMeta(res.meta);
            })
            .catch((e) => {
                setSubs([]);
                toast.error(errorMessage(e, 'Failed to load subscribers'));
            })
            .finally(() => setLoading(false));
    }, [page]);

    return (
        <AdminLayout title="Newsletter">
            <Head title="Newsletter" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Newsletter Subscribers</h1>
                    {meta && (
                        <span className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Users className="h-4 w-4" /> {meta.total} subscribers
                        </span>
                    )}
                </div>

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
                    ]}
                    data={subs}
                    loading={loading}
                    emptyTitle="No subscribers yet"
                    emptyDescription="Visitors subscribe from the storefront footer."
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
