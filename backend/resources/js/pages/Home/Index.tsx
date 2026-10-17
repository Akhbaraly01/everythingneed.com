import { useMemo, useState, type ReactNode } from 'react';
import { usePage } from '@inertiajs/react';
import { Gift, Send } from 'lucide-react';
import MarketplaceLayout from '@/layouts/MarketplaceLayout';
import BannerSlider from '@/components/Marketplace/BannerSlider';
import CategoryGrid from '@/components/Marketplace/CategoryGrid';
import NeedCarousel from '@/components/Marketplace/NeedCarousel';
import TripleBanner from '@/components/Marketplace/TripleBanner';
import SearchTabs, { type ContentTab } from '@/components/Marketplace/SearchTabs';
import type { MarketplaceProduct } from '@/components/Marketplace/ProductCard';
import ExpertsShowcase from '@/components/experts/ExpertsShowcase';
import RecentlyViewedSection from '@/components/home/RecentlyViewedSection';
import SectionRail from '@/components/home/SectionRail';
import InfiniteProductFeed from '@/components/home/InfiniteProductFeed';
import PromoCard from '@/components/home/PromoCard';
import SeoMeta, { type LearnSeo } from '@/components/learn/SeoMeta';
import { useLanguage } from '@/lib/use-language';
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

/** Admin-owned builder row (home_page_sections, active + ordered). */
export interface HomeSectionConfig {
    id: string | number;
    name: string;
    slug: string;
    is_active?: boolean;
    order?: number;
}

interface HomeProps {
    products?: {
        data: MarketplaceProduct[];
        current_page?: number;
        last_page?: number;
        total?: number;
    };
    /** Storefront batch size (home.products_per_batch, default 12). */
    productsPerBatch?: number;
    /** Admin-ordered active sections; empty on a fresh DB (fallback order). */
    homeSections?: HomeSectionConfig[];
    categories?: { id: string | number; name: string; slug?: string; icon?: string | null }[];
    learning?: MarketplaceProduct[];
    healthcareCards?: MarketplaceProduct[];
    topExperts?: TopExpert[];
    cartCount?: number;
    sections?: HomeSections;
    seo?: LearnSeo | null;
}

/** Fallback scroll order (mirrors HomePageSectionsSeeder) when unseeded. */
const FALLBACK_ORDER = [
    'featured',
    'deals',
    'services',
    'healthcare',
    'jobs',
    'hotels',
    'transportation',
    'food',
    'agriculture',
    'real-estate',
    'building-services',
    'learn',
    'daily-deals',
    'recently-added',
];

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
    productsPerBatch = 12,
    homeSections = [],
    categories = [],
    learning = [],
    healthcareCards = [],
    topExperts = [],
    cartCount = 0,
    sections = {},
    seo = null,
}: HomeProps) {
    const { props } = usePage();
    const uiTexts = (props.uiTexts ?? {}) as {
        ui?: Record<string, { value?: string }>;
    };
    const auth = (props.auth ?? null) as { user?: { id: string } } | null;
    const { t } = useLanguage();
    const ui = uiTexts.ui ?? {};
    const uiValue = (key: string, fallback: string): string => ui[key]?.value || fallback;

    const [activeTab, setActiveTab] = useState<ContentTab>('all');

    const realProducts = useMemo(() => products?.data ?? [], [products]);
    const spotlight = useMemo(
        () => [...realProducts, ...learning, ...healthcareCards],
        [realProducts, learning, healthcareCards],
    );

    const healthcareItems = useMemo(() => healthcareCards.map(toSectionItem), [healthcareCards]);
    const learnItems = useMemo(() => learning.map(toSectionItem), [learning]);
    const recentlyAddedItems = useMemo(
        () => realProducts.slice(0, 6).map(toSectionItem),
        [realProducts],
    );

    // Slug → rail (title, items, See-all). Unknown slugs resolve to null and
    // are skipped — custom sections never fabricate content. Titles render
    // through the global language so one selection translates every rail.
    const resolveSection = (slug: string): ReactNode | null => {
        const rail = (
            titleKey: string,
            items: HomeSectionItem[] | undefined,
            seeAllHref: string,
        ): ReactNode => (
            <SectionRail
                testId={`home-section-${slug}`}
                title={t(titleKey)}
                items={items}
                seeAllHref={seeAllHref}
                seeAllLabel={`${t('nav.seeAll')} >`}
            />
        );

        switch (slug) {
            case 'daily-deals':
                return rail('home.dailyDeals', sections.dailyDeals, '/products');
            case 'featured':
                // No /featured page exists — See-all lands on the catalogue,
                // matching the long-standing storefront behaviour.
                return rail('home.featured', sections.featured, '/products');
            case 'deals':
                return rail('home.deals', sections.deals, '/deals');
            case 'services':
                return rail('home.services', sections.services, '/tasks');
            case 'healthcare':
                return rail('home.healthcare', healthcareItems, '/healthcare');
            case 'jobs':
                return rail('home.jobs', sections.jobs, '/jobs');
            case 'hotels':
                return rail('home.hotels', sections.hotels, '/hotels');
            case 'transportation':
                return rail('home.transportation', sections.transportation, '/flights');
            case 'food':
                return rail('home.food', sections.food, '/food');
            case 'agriculture':
                return rail('home.agriculture', sections.agriculture, '/agriculture');
            case 'real-estate':
                return rail('home.realEstate', sections.realEstate, '/properties');
            case 'building-services':
                return rail('home.buildingServices', sections.buildingServices, '/building-services');
            case 'learn':
                return rail('home.learn', learnItems, '/learn');
            case 'recently-added':
                return rail('home.recentlyAdded', recentlyAddedItems, '/products');
            default:
                return null;
        }
    };

    const orderedSlugs = useMemo(() => {
        const active = (homeSections ?? []).filter((s) => s.is_active !== false);
        if (active.length === 0) return FALLBACK_ORDER;
        return [...active]
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((s) => s.slug);
    }, [homeSections]);

    const feedSections = useMemo(
        () =>
            orderedSlugs
                .map((slug) => resolveSection(slug))
                .filter((node): node is ReactNode => node !== null),
        // t() included: rail titles must re-render on language switch.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [orderedSlugs, sections, healthcareItems, learnItems, recentlyAddedItems, t],
    );

    return (
        <MarketplaceLayout title="Home" cartCount={cartCount}>
            <SeoMeta seo={seo} />
            <div className="min-h-screen pb-6 bg-background">
                <div className="container mx-auto px-3 py-4 space-y-5">
                    {/* Sliding banners first — immediately after the fixed header. */}
                    <BannerSlider />

                    {/* Category icons: 4 + 4 with SeeMore for the rest. */}
                    <section data-testid="home-section-categories">
                        <CategoryGrid categories={categories} />
                    </section>

                    {/* Submit-Your-Need carousel (instance 1 of 2 — both render
                        the same component over /api/need-categories, so admin
                        manages them as one surface). */}
                    <NeedCarousel />

                    {/* Need-something banner. */}
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

                    {/* Discovery tabs (pills only — search lives in the fixed
                        header). They filter the product feed below. */}
                    <SearchTabs
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        hideSearchBar
                    />

                    {/* Products: batches interleaved between the
                        admin-ordered category sections. */}
                    <InfiniteProductFeed
                        initial={realProducts}
                        initialPage={products?.current_page ?? 1}
                        lastPage={products?.last_page ?? 1}
                        extras={[...learning, ...healthcareCards]}
                        tab={activeTab}
                        sections={feedSections}
                        perBatch={productsPerBatch}
                        loadMoreLabel={t('home.loadMore')}
                        emptyTitle={t('home.nothingHere')}
                        emptyText={t('home.nothingHereText')}
                        browseProductsLabel={t('home.browseProducts')}
                        browseCoursesLabel={t('home.browseCourses')}
                        findDoctorsLabel={t('home.findDoctors')}
                    />

                    {/* Recently Viewed — highly visible. */}
                    <RecentlyViewedSection />

                    {/* More to explore (kept features, stable test hooks). */}
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

                    {/* Submit-Your-Need carousel (instance 2 of 2 — same
                        single component/source as instance 1). */}
                    <NeedCarousel />

                    {/* Trending Items sliding banners. */}
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

                    <section data-testid="home-section-experts">
                        <ExpertsShowcase experts={topExperts} title={t('home.topExperts')} limit={8} />
                    </section>
                </div>
            </div>
        </MarketplaceLayout>
    );
}
