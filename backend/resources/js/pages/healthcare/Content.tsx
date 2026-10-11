import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Play, FileText, BookOpen, ArrowLeft } from 'lucide-react';

interface HealthItem {
    id: string | number;
    title: string;
    summary?: string | null;
    description?: string | null;
    url?: string | null;
    specialty?: string | null;
    type?: string;
}

type ContentKind = 'videos' | 'documents' | 'guides';

const LABELS: Record<ContentKind, { title: string; icon: typeof Play; empty: string }> = {
    videos: { title: 'Health Videos', icon: Play, empty: 'No health videos published yet.' },
    documents: { title: 'Health Documents', icon: FileText, empty: 'No health documents published yet.' },
    guides: { title: 'Prevention Guides', icon: BookOpen, empty: 'No prevention guides published yet.' },
};

const API_PATH: Record<ContentKind, string> = {
    videos: '/api/healthcare/videos',
    documents: '/api/healthcare/documents',
    guides: '/api/healthcare/prevention-guides',
};

export default function HealthContentPage({ kind }: { kind: ContentKind }) {
    const [items, setItems] = useState<HealthItem[]>([]);
    const [loading, setLoading] = useState(true);
    const meta = LABELS[kind];

    useEffect(() => {
        let cancelled = false;
        api.get<{ data: HealthItem[] }>(API_PATH[kind])
            .then((res) => {
                if (!cancelled) setItems(Array.isArray(res?.data) ? res.data : []);
            })
            .catch(() => {
                if (!cancelled) setItems([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [kind]);

    return (
        <AppLayout title={meta.title}>
            <Head title={meta.title} />
            <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <meta.icon className="h-5 w-5 text-primary" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{meta.title}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/healthcare/documents" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" /> Documentation
                        </Link>
                        <Link href="/healthcare" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" /> Healthcare
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
                ) : items.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-12 text-center">
                        <meta.icon className="mx-auto h-10 w-10 text-muted-foreground" />
                        <p className="mt-3 text-sm text-muted-foreground">{meta.empty}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Content appears when admins publish materials.</p>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {items.map((item) => (
                            <article key={item.id} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                                <h2 className="font-semibold text-gray-900 dark:text-white line-clamp-2">{item.title}</h2>
                                {item.summary || item.description ? (
                                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                                        {item.summary || item.description}
                                    </p>
                                ) : null}
                                {item.specialty ? (
                                    <p className="mt-2 text-xs text-primary">{item.specialty}</p>
                                ) : null}
                                {item.url ? (
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-3 inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground"
                                    >
                                        Open
                                    </a>
                                ) : null}
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
