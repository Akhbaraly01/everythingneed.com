import { useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Gift, GraduationCap, Send } from 'lucide-react';
import MarketplaceLayout from '@/layouts/MarketplaceLayout';
import BannerSlider from '@/components/Marketplace/BannerSlider';
import CategoryGrid from '@/components/Marketplace/CategoryGrid';
import NeedCarousel from '@/components/Marketplace/NeedCarousel';
import TripleBanner from '@/components/Marketplace/TripleBanner';
import SearchTabs, { type ContentTab, type SortOption } from '@/components/Marketplace/SearchTabs';
import ProductCard, { type MarketplaceProduct } from '@/components/Marketplace/ProductCard';
import ExpertsShowcase from '@/components/experts/ExpertsShowcase';
import RecentlyViewedSection from '@/components/home/RecentlyViewedSection';
import SectionRail from '@/components/home/SectionRail';
import PromoCard from '@/components/home/PromoCard';
import type { HomeSectionItem } from '@/types';

interface TopExpert {
    id: string | number;
    name: string;
    role: string;
    source: string;
    link: string;
}

export interface HomeSections {
    dailyDeals?: HomeSectionItem[];
    featured?: HomeSectionItem[];
    deals?: HomeSectionItem[];
    services?: HomeSectionItem[];
    jobs?: HomeSectionItem[];
    hotels?: HomeSectionItem[];
    transportation?: HomeSectionItem[];
    food?: HomeSectionItem[];
    agriculture?: HomeSectionItem[];
    realEstate?: HomeSectionItem[];
    buildingServices?: HomeSectionItem[];
}

interface HomeProps {
    products?: {
        data: MarketplaceProduct[];
        current_page?: number;
        last_page?: number;
        total?: number;
    };
    categories?: { id: string | number; name: string; slug?: string; icon?: string | null }[];
    learning?: MarketplaceProduct[];
    healthcareCards?: MarketplaceProduct[];
    topExperts?: TopExpert[];
    cartCount?: number;
    sections?: HomeSections;
}

const toSectionItem = (product: MarketplaceProduct): HomeSectionItem => ({
    id: product.id,
    title: product.name,
    subtitle: product.category,
    image: product.image ?? null,
    url: product.link ?? `/products/${product.id}`,
    badge: product.badge ?? null,
    price: product.price,
    rating: product.rating ?? null,
});

export default function HomeIndex({
    products,
    categories = [],
    learning = [],
    healthcareCards = [],
    topExperts = [],
    cartCount = 0,
    sections = {},
}: HomeProps) {
    const { props } = usePage();
    const uiTexts = (props.uiTexts ?? {}) as {
        ui?: Record<string, { value?: string }>;
    };
    const auth = (props.auth ?? null) as { user?: { id: string } } | null;
    const ui = uiTexts.ui ?? {};
    const uiValue = (key: string, fallback: string): string => ui[key]?.value || fallback;

    const [activeTab, setActiveTab] = useState<ContentTab>('all');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('default');
    const [loadingMore, setLoadingMore] = useState(false);

    // Gap 5: denser discovery grid (24/page) with page-based load-more.
    const productPage = products?.current_page ?? 1;
    const productLastPage = products?.last_page ?? 1;
    const hasMoreProducts = productPage < productLastPage;

    const loadMoreProducts = () => {
        if (!hasMoreProducts || loadingMore) return;
        setLoadingMore(true);
        router.get(
            '/',
            { page: productPage + 1 },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setLoadingMore(false),
            },
        );
    };

    const realProducts = useMemo(() => products?.data ?? [], [products]);
    const spotlight = useMemo(
        () => [...realProducts, ...learning, ...healthcareCards],
        [realProducts, learning, healthcareCards],
    );
    const pool: MarketplaceProduct[] = useMemo(() => {
        const merged = [...realProducts, ...learning, ...healthcareCards];
        if (activeTab === 'all') return merged;
        if (activeTab === 'products') return realProducts;
        if (activeTab === 'learning') return learning;
        if (activeTab === 'healthcare') return healthcareCards;
        return merged.filter((p) => (p.type ?? 'product') === (activeTab === 'needs' ? 'need' : 'service'));
    }, [realProducts, learning, healthcareCards, activeTab]);

    const filtered = useMemo(() => {
        let list = [...pool];
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    (p.category ?? '').toLowerCase().includes(q) ||
                    (p.vendor ?? '').toLowerCase().includes(q),
            );
        }
        if (sortBy === 'price_low') list.sort((a, b) => a.price - b.price);
        if (sortBy === 'price_high') list.sort((a, b) => b.price - a.price);
        if (sortBy === 'rating') list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
        return list;
    }, [pool, search, sortBy]);

    const healthcareItems = useMemo(() => healthcareCards.map(toSectionItem), [healthcareCards]);
    const learnItems = useMemo(() => learning.map(toSectionItem), [learning]);
    const recentlyAddedItems = useMemo(
        () => realProducts.slice(0, 6).map(toSectionItem),
        [realProducts],
    );

    return (
        <MarketplaceLayout title="Home" cartCount={cartCount}>
            <div className="min-h-screen pb-20 bg-background">
                <div className="container mx-auto px-3 py-4 space-y-6">
                    {/* 3. Hero/sliding banners (admin CMS banners). */}
                    <BannerSlider />

                    {/* 4. Daily Deals */}
                    <SectionRail
                        testId="home-section-daily-deals"
                        title="Daily Deals"
                        items={sections.dailyDeals}
                        seeAllHref="/products"
                    />

                    {/* 5. New User Bonus (guests only; copy from uiTexts). */}
                    {!auth && (
                        <PromoCard
                            testId="home-section-new-user-bonus"
                            title={uiValue('home_bonus_title', 'New here?')}
                            text={uiValue(
                                'home_bonus_text',
                                'Create your free account to shop, learn, book and request services in one place.',
                            )}
                            cta={uiValue('home_bonus_cta', 'Create free account')}
                            href="/register"
                            icon={Gift}
                        />
                    )}

                    {/* 6. Find Your Need */}
                    <NeedCarousel />

                    {/* 7. Learning promotion */}
                    <PromoCard
                        testId="home-section-learn-promo"
                        title={uiValue('home_learn_title', 'Grow your skills')}
                        text={uiValue(
                            'home_learn_text',
                            'Courses, instructors and certificates across every field - start learning today.',
                        )}
                        cta={uiValue('home_learn_cta', 'Explore courses')}
                        href="/learn"
                        icon={GraduationCap}
                    />

                    {/* 8+9. Quick categories + More categories */}
                    <section data-testid="home-section-categories">
                        <CategoryGrid categories={categories} />
                    </section>

                    {/* 10. Submit Your Need */}
                    <PromoCard
                        testId="home-section-submit-need"
                        title={uiValue('home_need_title', 'Need something?')}
                        text={uiValue(
                            'home_need_text',
                            'Post a request and receive offers from providers across every category.',
                        )}
                        cta={uiValue('home_need_cta', 'Submit your need')}
                        href="/needs/request"
                        icon={Send}
                    />

                    {/* 11. Featured products */}
                    <SectionRail
                        testId="home-section-featured"
                        title="Featured products"
                        items={sections.featured}
                        seeAllHref="/products"
                    />

                    {/* 12. Deals */}
                    <SectionRail
                        testId="home-section-deals"
                        title="Deals"
                        items={sections.deals}
                        seeAllHref="/deals"
                    />

                    {/* 13. Services (open tasks & gigs) */}
                    <SectionRail
                        testId="home-section-services"
                        title="Services"
                        items={sections.services}
                        seeAllHref="/tasks"
                    />

                    {/* 14. Healthcare */}
                    <SectionRail
                        testId="home-section-healthcare"
                        title="Healthcare"
                        items={healthcareItems}
                        seeAllHref="/healthcare"
                    />

                    {/* 15. Experts */}
                    <section data-testid="home-section-experts">
                        <ExpertsShowcase experts={topExperts} title="Top Experts" limit={8} />
                    </section>

                    {/* 16. Jobs */}
                    <SectionRail
                        testId="home-section-jobs"
                        title="Jobs"
                        items={sections.jobs}
                        seeAllHref="/jobs"
                    />

                    {/* 17. Hotels */}
                    <SectionRail
                        testId="home-section-hotels"
                        title="Hotels"
                        items={sections.hotels}
                        seeAllHref="/hotels"
                    />

                    {/* 18. Transportation */}
                    <SectionRail
                        testId="home-section-transportation"
                        title="Transportation"
                        items={sections.transportation}
                        seeAllHref="/flights"
                    />

                    {/* 19. Food */}
                    <SectionRail
                        testId="home-section-food"
                        title="Food"
                        items={sections.food}
                        seeAllHref="/food"
                    />

                    {/* 20. Agriculture */}
                    <SectionRail
                        testId="home-section-agriculture"
                        title="Agriculture"
                        items={sections.agriculture}
                        seeAllHref="/agriculture"
                    />

                    {/* 21. Real estate */}
                    <SectionRail
                        testId="home-section-real-estate"
                        title="Real estate"
                        items={sections.realEstate}
                        seeAllHref="/properties"
                    />

                    {/* 22. Building services */}
                    <SectionRail
                        testId="home-section-building-services"
                        title="Building services"
                        items={sections.buildingServices}
                        seeAllHref="/building-services"
                    />

                    {/* 23. Learn */}
                    <SectionRail
                        testId="home-section-learn"
                        title="Learn"
                        items={learnItems}
                        seeAllHref="/learn"
                    />

                    {/* 24. Recently added */}
                    <SectionRail
                        testId="home-section-recently-added"
                        title="Recently added"
                        items={recentlyAddedItems}
                        seeAllHref="/products"
                    />

                    {/* 25. Recommended / discovery content */}
                    <div data-testid="home-section-recommended" className="space-y-6">
                        <section id="product-grid" className="space-y-4 scroll-mt-24 outline-none">
                            <SearchTabs
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                                search={search}
                                onSearchChange={setSearch}
                                sortBy={sortBy}
                                onSortChange={setSortBy}
                            />
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 auto-rows-min">
                                {filtered.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                            {filtered.length === 0 && (
                                <div className="py-10 text-center text-sm text-muted-foreground">
                                    <p className="font-medium">Nothing here yet</p>
                                    <p className="mt-1">Products, courses and doctors will appear once available.</p>
                                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                                        <Link href="/products" className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">Browse products</Link>
                                        <Link href="/learn/courses" className="rounded-md border px-3 py-1.5 text-xs">Browse courses</Link>
                                        <Link href="/healthcare/doctors" className="rounded-md border px-3 py-1.5 text-xs">Find doctors</Link>
                                    </div>
                                </div>
                            )}
                            {hasMoreProducts && filtered.length > 0 && (
                                <div className="flex justify-center pt-2">
                                    <button
                                        type="button"
                                        data-testid="home-load-more"
                                        onClick={loadMoreProducts}
                                        disabled={loadingMore}
                                        className="rounded-md border px-6 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                                    >
                                        {loadingMore ? 'Loading…' : 'Load more'}
                                    </button>
                                </div>
                            )}
                        </section>

                        <TripleBanner
                            trending={[...spotlight]
                                .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
                                .slice(0, 4)
                                .map((p) => ({
                                    id: p.id,
                                    name: p.name,
                                    price: p.price,
                                    originalPrice: p.originalPrice ?? p.price,
                                    image: p.image ?? '',
                                    rating: p.rating ?? 0,
                                    link: p.link ?? `/products/${p.id}`,
                                }))}
                        />

                        <RecentlyViewedSection />
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
