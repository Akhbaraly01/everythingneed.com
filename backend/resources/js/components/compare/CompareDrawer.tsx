import { useCallback, useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import {X, GitCompareArrows, Star, Trash2, ChevronLeft} from 'lucide-react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { Button, buttonClasses } from '@/components/shared/Button';

interface CompareProduct {
    id: string;
    name: string;
    price?: number;
    image_url?: string;
    rating?: number;
    category?: string;
    description?: string;
}

interface CompareRow {
    id: string;
    product_id: string;
    product?: CompareProduct;
}

const MAX_COMPARE = 3;

export default function CompareDrawer() {
    const [items, setItems] = useState<CompareProduct[]>([]);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const fetchCompare = useCallback(async () => {
        try {
            const res = await api.get<{ data: CompareRow[] }>('/api/compare');
            const products = (res.data ?? [])
                .map((row) => row.product)
                .filter((p): p is CompareProduct => Boolean(p && p.id))
                .slice(0, MAX_COMPARE);
            setItems(products);
        } catch {
            setItems([]);
        }
    }, []);

    useEffect(() => {
        void fetchCompare();
        const sync = () => void fetchCompare();
        window.addEventListener('everythingneed:compare-updated', sync);
        return () => window.removeEventListener('everythingneed:compare-updated', sync);
    }, [fetchCompare]);

    const removeFromCompare = async (id: string) => {
        setItems((prev) => prev.filter((p) => p.id !== id));
        try {
            await api.del(`/api/compare/${id}`);
        } catch {
            // non-blocking
        }
    };

    const clearCompare = async () => {
        const previous = items;
        setItems([]);
        try {
            await Promise.all(previous.map((p) => api.del(`/api/compare/${p.id}`).catch(() => {})));
        } catch {
            // non-blocking
        }
    };

    if (items.length === 0) return null;

    return (
        <>
            {/* Floating compare bar */}
            {!drawerOpen && (
                <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2">
                    <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-card p-3 shadow-2xl">
                        <div className="flex -space-x-2">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="h-10 w-10 overflow-hidden rounded-full border-2 border-background bg-muted"
                                >
                                    {item.image_url && (
                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <span className="text-sm font-medium">
                            {items.length}/{MAX_COMPARE} selected
                        </span>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => setDrawerOpen(true)}
                            disabled={items.length < 2}
                        >
                            <GitCompareArrows className="h-3.5 w-3.5" />
                            Compare
                        </Button>
                        <Button
                            type="button"
                            variant="danger"
                            iconOnly
                            size="sm"
                            onClick={() => void clearCompare()}
                            aria-label="Clear comparison"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Comparison sheet */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true" aria-label="Product comparison">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
                    <div className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-xl bg-card p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-base font-semibold">
                                <GitCompareArrows className="h-5 w-5" />
                                Product Comparison
                            </h2>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => void clearCompare()}
                                >
                                    Clear all
                                </Button>
                                <Button
                                    type="button"
                                    variant="icon"
                                    iconOnly
                                    size="sm"
                                    onClick={() => setDrawerOpen(false)}
                                    aria-label="Close comparison"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[500px]">
                                <thead>
                                    <tr>
                                        <th className="w-28 p-2 text-left text-sm font-medium text-muted-foreground">
                                            Feature
                                        </th>
                                        {items.map((item) => (
                                            <th key={item.id} className="p-2 text-center">
                                                <div className="relative">
                                                    <Button
                                                        type="button"
                                                        variant="danger"
                                                        iconOnly
                                                        size="sm"
                                                        onClick={() => void removeFromCompare(item.id)}
                                                        aria-label={`Remove ${item.name}`}
                                                        className="absolute -top-1 -right-1 z-10 !h-5 !w-5 !min-h-5"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                    <div className="mx-auto mb-2 h-20 w-20 overflow-hidden rounded-lg bg-muted">
                                                        {item.image_url && (
                                                            <img
                                                                src={item.image_url}
                                                                alt={item.name}
                                                                className="h-full w-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        )}
                                                    </div>
                                                    <p className="line-clamp-2 text-xs font-medium">{item.name}</p>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-t">
                                        <td className="p-2 text-sm font-medium">Price</td>
                                        {items.map((item) => (
                                            <td key={item.id} className="p-2 text-center">
                                                <span className="font-bold text-primary">
                                                    {item.price !== undefined ? formatPrice(item.price) : 'N/A'}
                                                </span>
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-t bg-muted/30">
                                        <td className="p-2 text-sm font-medium">Rating</td>
                                        {items.map((item) => (
                                            <td key={item.id} className="p-2 text-center">
                                                <span className="inline-flex items-center gap-1">
                                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                    {(item.rating ?? 0).toFixed(1)}
                                                </span>
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-t">
                                        <td className="p-2 text-sm font-medium">Category</td>
                                        {items.map((item) => (
                                            <td key={item.id} className="p-2 text-center">
                                                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                                                    {item.category ?? '\u2014'}
                                                </span>
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-t bg-muted/30">
                                        <td className="p-2 text-sm font-medium">Description</td>
                                        {items.map((item) => (
                                            <td key={item.id} className="p-2 text-center">
                                                <p className="line-clamp-3 text-xs text-muted-foreground">
                                                    {item.description || 'No description available'}
                                                </p>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-2">
                            <Link
                                href="/products/compare"
                                onClick={() => setDrawerOpen(false)}
                                className={buttonClasses('primary', 'md')}
                            >
                                Full comparison page
                            </Link>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setDrawerOpen(false)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Keep shopping
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
