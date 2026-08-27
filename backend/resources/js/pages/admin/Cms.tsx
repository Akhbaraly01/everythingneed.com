import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CmsPage {
    id: string;
    title: string;
    slug: string;
    status: string;
    updated_at: string;
}

export default function AdminCms() {
    const [pages, setPages] = useState<CmsPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'pages' | 'banners' | 'announcements'>('pages');

    useEffect(() => {
        const endpoint = tab === 'pages' ? '/api/admin/cms/pages' : tab === 'banners' ? '/api/admin/cms/banners' : '/api/admin/cms/announcements';
        api.get<{ data: CmsPage[] }>(endpoint)
            .then((res) => setPages(res.data))
            .catch(() => setPages([]))
            .finally(() => setLoading(false));
    }, [tab]);

    return (
        <AppLayout title="Content Manager">
            <Head title="Content Manager" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Manager</h1>

                <div className="flex gap-2">
                    {(['pages', 'banners', 'announcements'] as const).map((t) => (
                        <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
                            tab === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700'
                        }`}>{t}</button>
                    ))}
                </div>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : pages.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No {tab} found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Title</th>
                                    <th className="px-4 py-3">Slug</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {pages.map((p) => (
                                    <tr key={p.id}>
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.title}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500 font-mono">/{p.slug}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                p.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>{p.status}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
