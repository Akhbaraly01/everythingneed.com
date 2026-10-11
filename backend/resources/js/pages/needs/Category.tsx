import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { formatPrice } from '@/lib/currency';
import { NEED_STATUS_LABELS, needStatusClasses } from '@/lib/needs';
import { ArrowLeft, Plus } from 'lucide-react';
import type { NeedStatus } from '@/types';
import Image from '@/components/shared/Image';

interface CategoryRequest {
    id: string;
    title: string;
    description?: string;
    status?: string;
    budget_min?: number | string | null;
    budget_max?: number | string | null;
    currency?: string;
    location?: string | null;
    deadline?: string | null;
    created_at?: string;
    url: string;
}

interface CategoryItem {
    id: string;
    name: string;
    description?: string;
    price?: number | string | null;
    image_url?: string | null;
    url: string;
}

interface NeedsCategoryProps {
    slug: string;
    category?: { id: string; name: string; slug: string; description?: string | null } | null;
    requests?: CategoryRequest[];
    items?: CategoryItem[];
}

/**
 * Spec S10/S12 - category browse. Server-rendered: open requests in this
 * category (each linking to its canonical detail) plus published items.
 */
export default function NeedsCategory({ slug, category, requests = [], items = [] }: NeedsCategoryProps) {
    const categoryName = category?.name ?? slug.replace(/-/g, ' ');

    return (
        <AppLayout title={categoryName}>
            <Head title={categoryName} />
            <div className="space-y-6 px-3 py-4">
                <Link href="/needs" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> All Categories
                </Link>

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{categoryName}</h1>
                        {category?.description && <p className="mt-1 text-sm text-gray-500">{category.description}</p>}
                    </div>
                    <Link
                        href={`/needs/create?category=${encodeURIComponent(slug)}`}
                        className="inline-flex h-9 items-center gap-2 rounded-md bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                        <Plus className="h-4 w-4" /> Post a need
                    </Link>
                </div>

                {/* Open requests in this category */}
                <section aria-label="Open requests">
                    <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Open requests ({requests.length})</h2>
                    {requests.length === 0 ? (
                        <div className="mt-3 rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
                            <p className="text-sm text-gray-500">No open requests in this category yet.</p>
                            <Link href={`/needs/create?category=${encodeURIComponent(slug)}`} className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline">
                                Be the first - post a need
                            </Link>
                        </div>
                    ) : (
                        <ul className="mt-3 space-y-3">
                            {requests.map((r) => (
                                <li key={r.id}>
                                    <Link
                                        href={r.url}
                                        className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800"
                                    >
                                        <div className="flex flex-wrap items-center gap-2">
                                            {r.status && (
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${needStatusClasses(r.status as NeedStatus)}`}>
                                                    {NEED_STATUS_LABELS[r.status as NeedStatus] ?? r.status}
                                                </span>
                                            )}
                                            {r.location && <span className="text-xs text-gray-500">{r.location}</span>}
                                        </div>
                                        <h3 className="mt-1 font-medium text-gray-900 dark:text-white">{r.title}</h3>
                                        {r.description && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{r.description}</p>}
                                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                                            <span>
                                                {r.budget_max != null
                                                    ? `Budget ${r.currency} ${r.budget_min ?? 0} - ${r.budget_max}`
                                                    : 'Open budget'}
                                            </span>
                                            {r.created_at && <span>{new Date(r.created_at).toLocaleDateString()}</span>}
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Published items in this category */}
                {items.length > 0 && (
                    <section aria-label="Available items">
                        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Available items ({items.length})</h2>
                        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {items.map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.url}
                                    className="group rounded-lg bg-white p-4 shadow transition hover:shadow-md dark:bg-gray-800"
                                >
                                    {item.image_url && (
                                        <div className="h-40 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                                            <Image src={item.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                                        </div>
                                    )}
                                    <h3 className="mt-2 font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white">{item.name}</h3>
                                    {item.description && <p className="mt-1 text-sm text-gray-500 line-clamp-2">{item.description}</p>}
                                    {item.price != null && <p className="mt-2 font-bold text-gray-900 dark:text-white">{formatPrice(Number(item.price))}</p>}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
