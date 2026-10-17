import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Calendar, ArrowRight, Heart, Package, Tag } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import Image from '@/components/shared/Image';

interface DealPackage {
    name: string;
    price: number | string;
    description?: string | null;
    delivery_time?: string | null;
}

interface DealAddOn {
    name: string;
    price: number | string;
    description?: string | null;
}

interface Deal {
    id: string;
    name: string;
    slug?: string;
    description?: string | null;
    category_id?: string;
    price: number | string | null;
    image_url?: string | null;
    is_available: boolean;
    vendor_id?: string | null;
    packages?: DealPackage[] | null;
    add_ons?: DealAddOn[] | null;
    category?: { id: string; name: string; slug?: string } | null;
    vendor?: { id: string; store_name: string; slug?: string; is_verified?: boolean; rating?: number } | null;
    created_at?: string;
}

export default function DealShow({ deal_id }: { deal_id?: string }) {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const [deal, setDeal] = useState<Deal | null>(null);
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [tier, setTier] = useState(0);
    const [extras, setExtras] = useState<number[]>([]);
    const id = deal_id || (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : undefined);

    useEffect(() => {
        if (id) {
            api.get<{ data: Deal }>(`/api/deals/${id}`)
                .then((res) => setDeal(res.data))
                .catch(() => {})
                .finally(() => setLoading(false));
        } else setLoading(false);
    }, [id]);

    // TODO 18 saved listings (§6.6): guests are sent to login, never faked.
    const toggleSave = async () => {
        if (!auth?.user) {
            router.visit('/login');
            return;
        }
        if (!id) return;
        try {
            if (saved) {
                const res = await api.get<{ data: { id: string; item_id?: string | null }[] }>('/api/needs/saved');
                const row = (res.data ?? []).find((s) => s.item_id === id);
                if (row) await api.del(`/api/needs/saved/${row.id}`);
                setSaved(false);
            } else {
                await api.post('/api/needs/saved', { item_type: 'listing', item_id: id });
                setSaved(true);
                toast.success('Saved to My Needs.');
            }
        } catch (e) {
            toast.error(errorMessage(e, 'Could not save'));
        }
    };

    if (loading) return <AppLayout title="Deal"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    if (!deal) return <AppLayout title="Deal"><p className="p-12 text-center text-red-500">Deal not found</p></AppLayout>;

    const vendorHref = deal.vendor?.slug ?? deal.vendor?.id ?? deal.vendor_id;

    return (
        <AppLayout title={deal.name}>
            <Head title={deal.name} />
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    {deal.image_url && (
                        <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-gray-100">
                            <Image src={deal.image_url} alt={deal.name} className="h-full w-full object-cover" />
                        </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                        {deal.category && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                                <Tag className="h-3 w-3" /> {deal.category.name}
                            </span>
                        )}
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${deal.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                            {deal.is_available ? 'Available' : 'Unavailable'}
                        </span>
                    </div>
                    <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{deal.name}</h1>
                    <button
                        onClick={toggleSave}
                        aria-pressed={saved}
                        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-red-600"
                    >
                        <Heart className={`h-4 w-4 ${saved ? 'fill-red-500 text-red-500' : ''}`} />
                        {saved ? 'Saved' : 'Save for later'}
                    </button>
                    {deal.vendor && (
                        <p className="mt-1 text-sm text-gray-500">
                            Sold by{' '}
                            <Link href={`/vendors/${deal.vendor.slug ?? deal.vendor.id}`} className="font-medium text-indigo-600 hover:text-indigo-500">
                                {deal.vendor.store_name}
                            </Link>
                        </p>
                    )}
                    {deal.description && (
                        <p className="mt-3 text-gray-600 dark:text-gray-400">{deal.description}</p>
                    )}
                </div>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    {deal.packages && deal.packages.length > 0 ? (
                        <div className="space-y-3" data-testid="deal-packages">
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Choose a package</h2>
                            {deal.packages.map((p, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    data-testid={`deal-package-${i}`}
                                    aria-pressed={tier === i}
                                    onClick={() => setTier(i)}
                                    className={`w-full rounded-lg border p-4 text-left transition ${
                                        tier === i
                                            ? 'border-indigo-500 ring-2 ring-indigo-200 dark:border-indigo-400 dark:ring-indigo-900'
                                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="font-semibold text-gray-900 dark:text-white">{p.name}</span>
                                        <span className="font-bold text-green-600">{formatPrice(Number(p.price))}</span>
                                    </div>
                                    {p.delivery_time && (
                                        <p className="mt-1 text-xs text-gray-500">Delivery: {p.delivery_time}</p>
                                    )}
                                    {p.description && (
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{p.description}</p>
                                    )}
                                </button>
                            ))}

                            {deal.add_ons && deal.add_ons.length > 0 && (
                                <div>
                                    <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Add extras</h3>
                                    <div className="mt-2 space-y-2">
                                        {deal.add_ons.map((a, i) => (
                                            <label
                                                key={i}
                                                className="flex cursor-pointer items-center justify-between gap-3 rounded border border-gray-200 px-3 py-2 text-sm dark:border-gray-600"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={extras.includes(i)}
                                                        onChange={() =>
                                                            setExtras((prev) =>
                                                                prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
                                                            )
                                                        }
                                                    />
                                                    <span className="text-gray-800 dark:text-gray-200">{a.name}</span>
                                                </span>
                                                <span className="font-semibold text-green-600">+{formatPrice(Number(a.price))}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                data-testid="deal-request-package"
                                onClick={() => {
                                    const params = new URLSearchParams({ listing: deal.id, package: String(tier) });
                                    if (extras.length > 0) params.set('addons', [...extras].sort((a, b) => a - b).join(','));
                                    router.visit(`/needs/request?${params.toString()}`);
                                }}
                                className="w-full rounded-lg bg-red-600 px-4 py-3 text-white hover:bg-red-700"
                            >
                                Request {deal.packages[tier].name} — {formatPrice(Number(deal.packages[tier].price))} <ArrowRight className="inline h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 text-3xl font-bold text-green-600">
                                <Package className="h-6 w-6" />
                                {deal.price != null ? formatPrice(Number(deal.price)) : 'Price on request'}
                            </span>
                        </div>
                    )}
                    {deal.created_at && (
                        <p className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" /> Listed {formatDate(deal.created_at)}
                        </p>
                    )}
                </div>

                {vendorHref ? (
                    <button
                        onClick={() => router.visit(`/vendors/${vendorHref}`)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-white hover:bg-red-700"
                    >
                        Visit Vendor Store <ArrowRight className="h-4 w-4" />
                    </button>
                ) : (
                    <Link
                        href="/needs/request"
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-white hover:bg-red-700"
                    >
                        Request This Deal <ArrowRight className="h-4 w-4" />
                    </Link>
                )}
            </div>
        </AppLayout>
    );
}
