import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { formatPrice } from '@/lib/currency';
import { Search as SearchIcon, Sprout, Tractor, GraduationCap, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from '@/components/shared/Image';

interface AgriProduct {
    id: string;
    name: string;
    description?: string;
    price: number | string;
    category?: string;
    image_url?: string;
    vendor?: { store_name?: string; rating?: number } | null;
}

interface Props {
    products: { data: AgriProduct[]; current_page: number; last_page: number; total: number };
    filters: { q?: string };
}

export default function AgricultureIndex({ products, filters }: Props) {
    const [q, setQ] = useState(filters.q ?? '');

    const search = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/agriculture', q ? { q } : {}, { preserveState: true });
    };

    return (
        <AppLayout title="Agriculture">
            <Head title="Agriculture" />
            <div className="mx-auto max-w-6xl px-4 py-8">
                {/* Hero */}
                <div className="mb-8 rounded-2xl bg-gradient-to-r from-green-700 to-emerald-600 p-8 text-white">
                    <div className="flex items-center gap-3">
                        <Sprout className="h-9 w-9" />
                        <h1 className="text-3xl font-bold">Agriculture Hub</h1>
                    </div>
                    <p className="mt-2 max-w-xl text-sm text-green-100">
                        Farm inputs, equipment, produce and hands — everything that keeps the fields moving.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                        <Pill icon={<Tractor className="h-4 w-4" />} label="Products & equipment" href="/agriculture/products" />
                        <Pill icon={<Users className="h-4 w-4" />} label="Farm workers" href="/job-seekers?category=Agriculture" />
                        <Pill icon={<GraduationCap className="h-4 w-4" />} label="Training tasks" href="/tasks" />
                    </div>
                </div>

                {/* Search */}
                <form onSubmit={search} className="relative mb-6 max-w-md">
                    <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search seeds, tools, feed…"
                        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                </form>

                {/* Grid */}
                {products.data.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-600">
                        <Tractor className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                        <p className="font-medium text-gray-900 dark:text-white">No agricultural listings match</p>
                        <p className="text-sm text-gray-500">Try a different search term.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {products.data.map((p) => (
                            <div key={p.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex h-36 items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/20">
                                    {p.image_url
                                        ? <Image src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                                        : <Sprout className="h-12 w-12 text-green-500/60" />}
                                </div>
                                <div className="p-4">
                                    <h3 className="line-clamp-1 font-semibold text-gray-900 dark:text-white">{p.name}</h3>
                                    <p className="mt-0.5 line-clamp-2 h-8 text-xs text-gray-500">{p.description}</p>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="font-bold text-green-700">{formatPrice(Number(p.price))}</span>
                                        {p.vendor?.store_name && (
                                            <span className="truncate text-[11px] text-gray-400">{p.vendor.store_name}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {products.last_page > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-3">
                        {products.current_page > 1 && (
                            <Link href={`/agriculture?page=${products.current_page - 1}`} preserveState className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white"><ChevronLeft className="h-4 w-4" /></Link>
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-300">Page {products.current_page} of {products.last_page}</span>
                        {products.current_page < products.last_page && (
                            <Link href={`/agriculture?page=${products.current_page + 1}`} preserveState className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white"><ChevronRight className="h-4 w-4" /></Link>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function Pill({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
    return (
        <Link href={href} className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/25">
            {icon} {label}
        </Link>
    );
}
