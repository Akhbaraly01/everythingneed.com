import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import { Button, buttonClasses } from '@/components/shared/Button';
import { Heart, Trash2, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { invalidateWishlist } from '@/hooks/useWishlist';
import Image from '@/components/shared/Image';

interface WishlistSnapshot {
    title?: string | null;
    subtitle?: string | null;
    image_url?: string | null;
    price?: number | null;
    link?: string | null;
}

interface WishlistItem {
    id: string;
    entity_type?: string | null;
    entity_id?: string | null;
    // Legacy product-shaped rows (kept for backwards compatibility).
    product_id: string;
    name: string;
    price: number;
    image_url?: string;
    vendor_name?: string;
    created_at: string;
    snapshot?: WishlistSnapshot | null;
}

export default function WishlistPage() {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        setError(null);
        api.get<{ data: WishlistItem[] }>('/api/wishlist')
            .then((res) => setItems(res.data))
            .catch((e) => {
                setError(errorMessage(e, 'Failed to load wishlist'));
                setItems([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        invalidateWishlist();
    }, []);

    const removeItem = async (id: string) => {
        try {
            await api.del(`/api/wishlist/${id}`);
            setItems(items.filter((i) => i.id !== id));
            invalidateWishlist();
            toast.success('Removed from wishlist.');
        } catch (e) {
            toast.error(errorMessage(e, 'Could not remove from wishlist'));
        }
    };

    const viewFor = (item: WishlistItem): { title: string; subtitle?: string | null; image?: string | null; price?: number | null; link: string } | null => {
        if (item.snapshot) {
            if (!item.snapshot.title && !item.snapshot.link) return null;
            return {
                title: item.snapshot.title ?? 'Saved item',
                subtitle: item.snapshot.subtitle,
                image: item.snapshot.image_url,
                price: item.snapshot.price,
                link: item.snapshot.link ?? '#',
            };
        }
        // Legacy product rows carried the snapshot flat.
        if (!item.name) return null;
        return {
            title: item.name,
            subtitle: item.vendor_name ? `by ${item.vendor_name}` : null,
            image: item.image_url,
            price: item.price,
            link: `/products/${item.product_id}`,
        };
    };

    return (
        <AppLayout title="Wishlist">
            <Head title="Wishlist" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Wishlist</h1>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error}</p>
                        <Button onClick={load} variant="ghost" size="sm" className="mt-4 gap-2" iconLeft={<RefreshCcw className="h-4 w-4" />}>
                            Retry
                        </Button>
                    </div>
                ) : items.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Heart className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Your wishlist is empty</h3>
                        <Link href="/products" className={cn('mt-4 inline-flex', buttonClasses('primary', 'sm'))}>
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((item) => {
                            const view = viewFor(item);
                            if (!view) {
                                return (
                                    <div key={item.id} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                        <p className="font-semibold text-gray-900 dark:text-white">No longer available</p>
                                        <p className="text-xs text-gray-500">This saved item was removed.</p>
                                        <div className="mt-2 flex justify-end">
                                            <Button onClick={() => removeItem(item.id)} variant="icon" iconOnly size="sm" className="text-red-500">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <div key={item.id} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                    <Link href={view.link}>
                                        <div className="h-40 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                                            {view.image ? <Image src={view.image} alt="" className="h-full w-full object-cover" /> : null}
                                        </div>
                                        <p className="mt-2 font-semibold text-gray-900 hover:text-indigo-600 dark:text-white">{view.title}</p>
                                    </Link>
                                    <div className="mt-2 flex items-center justify-between">
                                        {view.price != null
                                            ? <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(view.price)}</span>
                                            : <span className="text-xs capitalize text-gray-500">{item.entity_type ?? 'saved'}</span>}
                                        <Button onClick={() => removeItem(item.id)} variant="icon" iconOnly size="sm" className="text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {view.subtitle && <p className="text-xs text-gray-500">{view.subtitle}</p>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
