import { useMemo, useState, type ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { useLanguage } from '@/lib/use-language';
import { pageSeed, rotate } from '@/lib/session-rotation';
import { toast } from 'sonner';
import ProductGrid from '@/components/home/ProductGrid';
import type { MarketplaceProduct } from '@/components/Marketplace/ProductCard';
import type { ContentTab } from '@/components/Marketplace/SearchTabs';

interface FeedPage {
    data: MarketplaceProduct[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
}

interface InfiniteProductFeedProps {
    /** First-paint products (page 1, already `perBatch`-sized server-side). */
    initial: MarketplaceProduct[];
    initialPage: number;
    lastPage: number;
    /** Active discovery tab (SearchTabs pills above the feed). */
    tab?: ContentTab;
    /** Interleaved section blocks in admin order; a batch leads and trails. */
    sections: ReactNode[];
    perBatch: number;
    loadMoreLabel?: string;
    emptyTitle?: string;
    emptyText?: string;
    browseProductsLabel?: string;
    browseCoursesLabel?: string;
    findDoctorsLabel?: string;
}

/**
 * The feed is cartable products ONLY (user directive): doctors, courses,
 * needs and services never mix into product batches — they live in their own
 * rails between batches. `matchesTab` still guards the pills so a stray
 * non-product can never leak into a batch.
 */
function matchesTab(product: MarketplaceProduct, tab: ContentTab): boolean {
    if (tab === 'all') return true;
    return (product.type ?? 'product') === 'product';
}

/**
 * Interleaved Home feed (Home rebuild): batch(0), section(0), batch(1),
 * section(1) … with a trailing batch, then the Load More button.
 *
 * Batches slice the product pool; when the pool is shorter than the page,
 * batches wrap around (spec: loop until more arrive). Load More appends the
 * next `/api/home/feed` page — same card shape, no adapter — so wrapped
 * duplicates resolve into real inventory. Pure fetch: no Inertia visit, no
 * scroll jump, loader while fetching. An empty pool renders the honest empty
 * state instead of blank space.
 */
export default function InfiniteProductFeed({
    initial,
    initialPage,
    lastPage,
    tab = 'all',
    sections,
    perBatch,
    loadMoreLabel = 'See More Products & Services',
    emptyTitle = 'Nothing here yet',
    emptyText = 'Products, courses and doctors will appear once available.',
    browseProductsLabel = 'Browse products',
    browseCoursesLabel = 'Browse courses',
    findDoctorsLabel = 'Find doctors',
}: InfiniteProductFeedProps) {
    const [items, setItems] = useState<MarketplaceProduct[]>(initial);
    const [page, setPage] = useState(initialPage);
    const [last, setLast] = useState(lastPage);
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();

    const batchSize = Math.max(1, perBatch);

    const visible = useMemo(
        () => items.filter((p) => matchesTab(p, tab)),
        [items, tab],
    );

    // The shelf order changes on every page load (the shopper never gets
    // the same arrangement twice in a row) but stays stable while the
    // page is open.
    const seed = useMemo(() => pageSeed(), []);

    const blocks = useMemo(() => {
        const nodes: ReactNode[] = [];
        const batches = sections.length + 1;

        // Every batch gets its own rotation, so the products change places
        // between the batches as well as between visits.
        const rotated = rotate(visible, seed, batches);

        nodes.push(
            <ProductGrid key="batch-0" keyPrefix="batch-0" products={rotated.slice(0, batchSize)} testId="home-feed-batch-0" />,
        );
        sections.forEach((section, i) => {
            nodes.push(<div key={`section-${i}`}>{section}</div>);
            const offset = (i + 1) * batchSize;
            nodes.push(
                <ProductGrid
                    key={`batch-${i + 1}`}
                    keyPrefix={`batch-${i + 1}`}
                    products={rotated.slice(offset, offset + batchSize)}
                    testId={`home-feed-batch-${i + 1}`}
                />,
            );
        });
        return nodes;
    }, [visible, sections, batchSize, seed]);

    // Product pages only extend the products/all pools; static tabs (learning,
    // healthcare) have no further pages to fetch.
    const hasMore = visible.length > 0 && (tab === 'all' || tab === 'products') && page < last;

    const loadMore = async () => {
        if (!hasMore || loading) return;
        setLoading(true);
        try {
            const res = await api.get<FeedPage>('/api/home/feed', {
                params: { page: page + 1, per_page: batchSize },
            });
            const fresh = Array.isArray(res?.data) ? res.data : [];
            setItems((prev) => {
                const seen = new Set(prev.map((p) => String(p.id)));
                return [...prev, ...fresh.filter((p) => !seen.has(String(p.id)))];
            });
            setPage(res?.meta?.current_page ?? page + 1);
            setLast(res?.meta?.last_page ?? last);
        } catch (e) {
            toast.error(errorMessage(e, 'Could not load more products'));
        } finally {
            setLoading(false);
        }
    };

    if (visible.length === 0) {
        return (
            <div className="py-10 text-center text-sm text-muted-foreground" data-testid="home-feed-empty">
                <p className="font-medium">{emptyTitle}</p>
                <p className="mt-1">{emptyText}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <Link href="/products" className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">{browseProductsLabel}</Link>
                    <Link href="/learn/courses" className="rounded-md border px-3 py-1.5 text-xs">{browseCoursesLabel}</Link>
                    <Link href="/healthcare/doctors" className="rounded-md border px-3 py-1.5 text-xs">{findDoctorsLabel}</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {blocks}
            {hasMore && (
                <div className="flex justify-center pt-2">
                    <button
                        type="button"
                        data-testid="home-load-more"
                        onClick={() => void loadMore()}
                        disabled={loading}
                        className="btn-3d px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {loading ? t('common.loading') : loadMoreLabel}
                    </button>
                </div>
            )}
        </div>
    );
}
